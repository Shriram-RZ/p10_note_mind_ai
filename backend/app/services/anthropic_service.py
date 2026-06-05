import httpx
import json
import asyncio
from typing import Dict, Any, AsyncGenerator
from app.config import settings
import logging

logger = logging.getLogger(__name__)

ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1"
ANTHROPIC_VERSION = "2023-06-01"


class AnthropicService:
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.model = settings.ANTHROPIC_MODEL

    def _headers(self) -> dict:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type": "application/json",
        }

    async def generate_content(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 8192,
        retries: int = 3,
    ) -> str:
        if not self.api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY is not configured. Set it in environment variables."
            )

        payload = {
            "model": self.model,
            "max_tokens": min(max_tokens, 8192),
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }

        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        f"{ANTHROPIC_BASE_URL}/messages",
                        json=payload,
                        headers=self._headers(),
                    )
                    response.raise_for_status()
                    data = response.json()
                    return data["content"][0]["text"]

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 529:  # overloaded
                    wait = 2 ** attempt
                    logger.warning(f"Anthropic overloaded, retrying in {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                raise
            except Exception:
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)

        raise Exception("Max retries exceeded for Anthropic API")

    async def generate_json_content(
        self,
        prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 8192,
    ) -> Dict[str, Any]:
        text = await self.generate_content(prompt, temperature, max_tokens)
        text = text.strip()

        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        start = text.find("{")
        if start == -1:
            start = text.find("[")
        if start != -1:
            end = len(text) - 1
            while end > start and text[end] not in ("}", "]"):
                end -= 1
            text = text[start : end + 1]

        return json.loads(text)

    async def stream_content(
        self,
        prompt: str,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured.")

        payload = {
            "model": self.model,
            "max_tokens": 4096,
            "temperature": temperature,
            "stream": True,
            "messages": [{"role": "user", "content": prompt}],
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{ANTHROPIC_BASE_URL}/messages",
                json=payload,
                headers=self._headers(),
            ) as response:
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str in ("[DONE]", ""):
                        continue
                    try:
                        event = json.loads(data_str)
                        if event.get("type") == "content_block_delta":
                            delta = event.get("delta", {})
                            if delta.get("type") == "text_delta":
                                yield delta.get("text", "")
                    except (json.JSONDecodeError, KeyError):
                        continue


anthropic_service = AnthropicService()
