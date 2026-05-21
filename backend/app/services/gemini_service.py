import httpx
import json
import asyncio
from typing import Optional, Dict, Any, AsyncGenerator
from app.config import settings
import logging

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = GEMINI_BASE_URL

    async def generate_content(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 8192,
        retries: int = 3
    ) -> str:
        url = f"{self.base_url}/models/{self.model}:generateContent"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "topP": 0.95,
                "topK": 40
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
            ]
        }

        headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }

        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    response.raise_for_status()
                    data = response.json()

                    if "candidates" in data and data["candidates"]:
                        return data["candidates"][0]["content"]["parts"][0]["text"]
                    raise ValueError("No content in response")

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    wait_time = 2 ** attempt
                    logger.warning(f"Rate limited, waiting {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
                raise
            except Exception as e:
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)

        raise Exception("Max retries exceeded for Gemini API")

    async def generate_json_content(
        self,
        prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 8192
    ) -> Dict[str, Any]:
        response_text = await self.generate_content(prompt, temperature, max_tokens)

        # Extract JSON from response
        text = response_text.strip()

        # Handle markdown code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        # Find JSON object/array
        start_idx = text.find('{')
        if start_idx == -1:
            start_idx = text.find('[')

        if start_idx != -1:
            end_idx = len(text) - 1
            while end_idx > start_idx:
                if text[end_idx] in ('}', ']'):
                    break
                end_idx -= 1
            text = text[start_idx:end_idx + 1]

        return json.loads(text)

    async def stream_content(
        self,
        prompt: str,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/models/{self.model}:streamGenerateContent"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 4096
            }
        }

        headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as response:
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            data = json.loads(line)
                            if "candidates" in data:
                                text = data["candidates"][0]["content"]["parts"][0]["text"]
                                yield text
                        except json.JSONDecodeError:
                            continue

gemini_service = GeminiService()
