import httpx
import json
import asyncio
from typing import Dict, Any, AsyncGenerator, Tuple
from app.config import settings
import logging

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# Rough heuristic: ~4 characters per token for English text.
CHARS_PER_TOKEN = 4
# Leave headroom below the TPM limit for prompt-token estimation error and
# chat/role overhead so we never trip Groq's 413 "request too large" guard.
SAFETY_MARGIN = 512
# Never request fewer than this many completion tokens.
MIN_COMPLETION_TOKENS = 256


class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.tpm_limit = settings.GROQ_TPM_LIMIT

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        return len(text) // CHARS_PER_TOKEN + 1

    def _fit_request(self, prompt: str, max_tokens: int) -> Tuple[str, int]:
        """
        Shrink the prompt and/or completion budget so that
        (input tokens + completion tokens) stays within the TPM limit.
        Groq counts both halves against the per-minute budget and returns
        413 if the sum exceeds it.
        """
        budget = self.tpm_limit - SAFETY_MARGIN
        input_tokens = self._estimate_tokens(prompt)

        # If the prompt alone leaves no room for a useful answer, truncate it.
        if input_tokens > budget - MIN_COMPLETION_TOKENS:
            allowed_input_tokens = max(0, budget - MIN_COMPLETION_TOKENS)
            prompt = prompt[: allowed_input_tokens * CHARS_PER_TOKEN]
            input_tokens = self._estimate_tokens(prompt)
            logger.warning(
                "Groq prompt truncated to ~%d tokens to fit TPM limit %d",
                input_tokens,
                self.tpm_limit,
            )

        available = max(MIN_COMPLETION_TOKENS, budget - input_tokens)
        fitted_max_tokens = max(MIN_COMPLETION_TOKENS, min(max_tokens, available))
        return prompt, fitted_max_tokens

    async def generate_content(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 8192,
        retries: int = 3,
    ) -> str:
        if not self.api_key:
            raise ValueError(
                "GROQ_API_KEY is not configured. Set it in environment variables."
            )

        prompt, max_tokens = self._fit_request(prompt, max_tokens)

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        f"{GROQ_BASE_URL}/chat/completions",
                        json=payload,
                        headers=self._headers(),
                    )
                    response.raise_for_status()
                    return response.json()["choices"][0]["message"]["content"]

            except httpx.HTTPStatusError as e:
                status = e.response.status_code
                if status == 429:
                    wait = 2 ** attempt
                    logger.warning(f"Groq rate limited, retrying in {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                if status == 413 and attempt < retries - 1:
                    # Request still too large: halve the completion budget and,
                    # if needed, trim the prompt, then retry.
                    new_max = max(MIN_COMPLETION_TOKENS, payload["max_tokens"] // 2)
                    trimmed, new_max = self._fit_request(
                        payload["messages"][0]["content"], new_max
                    )
                    payload["messages"][0]["content"] = trimmed
                    payload["max_tokens"] = new_max
                    logger.warning(
                        "Groq 413: retrying with max_tokens=%d after shrinking request",
                        new_max,
                    )
                    continue
                raise
            except Exception:
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)

        raise Exception("Max retries exceeded for Groq API")

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
            raise ValueError("GROQ_API_KEY is not configured.")

        prompt, max_tokens = self._fit_request(prompt, 4096)

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{GROQ_BASE_URL}/chat/completions",
                json=payload,
                headers=self._headers(),
            ) as response:
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue


groq_service = GroqService()
