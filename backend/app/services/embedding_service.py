"""
Dedicated Gemini Embedding Service.
Leverages the Gemini Embedding 2 API for high-dimensional semantic vector representations.
Features automatic batching, rate-limit retries with exponential backoff, and zero API key exposure.
"""
import asyncio
import logging
from typing import List, Optional
import httpx

from app.config import settings

logger = logging.getLogger("vaxassist.knowledge.embedding")

GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


class GeminiAPIError(Exception):
    """Base exception for Gemini API errors."""
    pass


class GeminiAPIKeyMissingError(GeminiAPIError):
    """Raised when GEMINI_API_KEY is not configured."""
    pass


class GeminiEmbeddingService:
    """
    Dedicated client for Gemini Embedding 2 model.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        raw_model = model or settings.GEMINI_EMBEDDING_MODEL
        # Normalize model string to ensure standard format
        if not raw_model.startswith("models/"):
            self.model_name = f"models/{raw_model}"
        else:
            self.model_name = raw_model

    @property
    def is_configured(self) -> bool:
        """Returns True if a valid non-empty API key is present."""
        key = self._api_key if self._api_key is not None else settings.GEMINI_API_KEY
        return bool(key and key.strip())

    def _get_api_key(self) -> str:
        key = self._api_key if self._api_key is not None else settings.GEMINI_API_KEY
        if not key or not key.strip():
            raise GeminiAPIKeyMissingError(
                "GEMINI_API_KEY is not configured in backend environment. Please set GEMINI_API_KEY in backend/.env"
            )
        return key.strip()

    async def embed_text(self, text: str) -> List[float]:
        """
        Generates an embedding vector for a single string.
        """
        if not text or not text.strip():
            raise ValueError("Cannot generate embedding for empty text.")

        results = await self.embed_batch([text])
        if not results:
            raise GeminiAPIError("Failed to obtain embedding from Gemini Embedding 2 API.")
        return results[0]

    async def embed_batch(
        self,
        texts: List[str],
        batch_size: int = 25,
        max_retries: int = 3,
    ) -> List[List[float]]:
        """
        Embeds a list of texts in batches using Gemini Embedding 2 batchEmbedContents.
        Includes exponential backoff for rate limits (HTTP 429).
        """
        if not texts:
            return []

        api_key = self._get_api_key()
        endpoint = f"{GOOGLE_API_BASE}/{self.model_name}:batchEmbedContents"

        all_embeddings: List[List[float]] = []

        async with httpx.AsyncClient(timeout=45.0) as client:
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                requests_payload = [
                    {
                        "model": self.model_name,
                        "content": {"parts": [{"text": t}]},
                    }
                    for t in batch
                ]

                payload = {"requests": requests_payload}
                params = {"key": api_key}

                retries = 0
                success = False

                while retries <= max_retries and not success:
                    try:
                        response = await client.post(endpoint, params=params, json=payload)

                        if response.status_code == 200:
                            data = response.json()
                            batch_results = [
                                emb["values"] for emb in data.get("embeddings", [])
                            ]
                            all_embeddings.extend(batch_results)
                            success = True

                        elif response.status_code == 429:
                            # Rate limit hit: exponential backoff
                            retries += 1
                            wait_time = 2.0 ** retries
                            logger.warning(
                                f"Gemini Embedding rate limit reached (429). Retrying in {wait_time:.1f}s (attempt {retries}/{max_retries})..."
                            )
                            if retries > max_retries:
                                raise GeminiAPIError(
                                    "Gemini Embedding rate limit exceeded after maximum retries. Please wait and retry."
                                )
                            await asyncio.sleep(wait_time)

                        elif response.status_code in (401, 403):
                            # Auth failure: do not leak key
                            logger.error(f"Gemini API authentication error ({response.status_code}).")
                            raise GeminiAPIError("Invalid or unauthorized GEMINI_API_KEY.")

                        elif response.status_code == 404:
                            logger.error(f"Gemini model not found: {self.model_name}")
                            raise GeminiAPIError(f"Gemini embedding model '{self.model_name}' not found.")

                        else:
                            retries += 1
                            if retries > max_retries:
                                logger.error(f"Gemini API HTTP {response.status_code}: {response.text[:200]}")
                                raise GeminiAPIError(
                                    f"Gemini Embedding API returned HTTP {response.status_code}: {response.text[:150]}"
                                )
                            await asyncio.sleep(1.0)

                    except httpx.TimeoutException:
                        retries += 1
                        if retries > max_retries:
                            raise GeminiAPIError("Timeout connecting to Gemini Embedding 2 service.")
                        await asyncio.sleep(1.5)

                    except (GeminiAPIError, GeminiAPIKeyMissingError):
                        raise
                    except Exception as e:
                        retries += 1
                        if retries > max_retries:
                            raise GeminiAPIError(f"Unexpected error calling Gemini Embedding API: {type(e).__name__}")
                        await asyncio.sleep(1.0)

        return all_embeddings


embedding_service = GeminiEmbeddingService()
