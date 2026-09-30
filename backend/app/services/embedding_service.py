"""
Dedicated Gemini Embedding Service.
Leverages the Gemini Embedding 2 API for high-dimensional semantic vector representations.
Features automatic batching, rate-limit retries with exponential backoff & jitter,
Retry-After compliance, progress reporting, and zero API key exposure.
"""
import asyncio
import logging
import random
from typing import List, Optional, Callable, Any, Awaitable
import httpx

from app.config import settings

logger = logging.getLogger("vaxassist.knowledge.embedding")

GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


class GeminiAPIError(Exception):
    """Base exception for Gemini API errors."""
    pass


class GeminiRateLimitError(GeminiAPIError):
    """Raised when Gemini API rate limit or quota is exhausted."""
    pass


class GeminiAuthError(GeminiAPIError):
    """Raised when GEMINI_API_KEY is invalid or unauthorized."""
    pass


class GeminiAPIKeyMissingError(GeminiAPIError):
    """Raised when GEMINI_API_KEY is not configured."""
    pass


def parse_retry_after(response: httpx.Response, attempt: int, default_base: float = 2.0) -> float:
    """
    Parses Retry-After and Retry-After-Ms headers correctly with unit handling.
    Falls back to exponential backoff with jitter, bounded between 0.5s and 30.0s.
    """
    # 1. Check Retry-After-Ms first (milliseconds)
    retry_after_ms = response.headers.get("retry-after-ms")
    if retry_after_ms:
        try:
            cleaned = retry_after_ms.lower().replace("ms", "").strip()
            ms_val = float(cleaned)
            if ms_val > 0:
                return min(max(0.5, ms_val / 1000.0), 30.0)
        except (ValueError, TypeError):
            pass

    # 2. Check standard Retry-After (seconds or HTTP-date)
    retry_after = response.headers.get("retry-after")
    if retry_after:
        try:
            sec_val = float(retry_after.strip())
            if sec_val > 0:
                return min(max(0.5, sec_val), 30.0)
        except (ValueError, TypeError):
            try:
                import email.utils
                from datetime import datetime, timezone
                dt = email.utils.parsedate_to_datetime(retry_after.strip())
                if dt:
                    now = datetime.now(timezone.utc)
                    delta = (dt - now).total_seconds()
                    if delta > 0:
                        return min(max(0.5, delta), 30.0)
            except Exception:
                pass

    # 3. Fallback: exponential backoff with jitter
    return min((default_base ** attempt) + random.uniform(0.1, 0.6), 30.0)


class GeminiEmbeddingService:
    """
    Dedicated client for Gemini Embedding 2 model.
    """
    DEFAULT_BATCH_SIZE: int = 5
    batch_size: int = 5

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        batch_size: int = DEFAULT_BATCH_SIZE,
    ):
        self._api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        raw_model = model or settings.GEMINI_EMBEDDING_MODEL
        # Normalize model string to ensure standard format
        if not raw_model.startswith("models/"):
            self.model_name = f"models/{raw_model}"
        else:
            self.model_name = raw_model
        self.batch_size = batch_size
        self._semaphore = asyncio.Semaphore(1)

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

        results = await self.embed_batch([text], batch_size=1)
        if not results:
            raise GeminiAPIError("Failed to obtain embedding from Gemini Embedding 2 API.")
        return results[0]

    async def embed_batch(
        self,
        texts: List[str],
        batch_size: Optional[int] = None,
        max_retries: int = 3,
        inter_batch_delay: float = 0.4,
        progress_callback: Optional[Callable[[int, int, int, int], Any]] = None,
    ) -> List[List[float]]:
        """
        Embeds a list of texts in batches using Gemini Embedding 2 batchEmbedContents.
        Includes exponential backoff with jitter and Retry-After header support for rate limits (HTTP 429).
        Never logs API keys or full request URLs containing keys.
        """
        if not texts:
            return []

        effective_batch_size = batch_size or getattr(self, "batch_size", self.DEFAULT_BATCH_SIZE) or self.DEFAULT_BATCH_SIZE
        api_key = self._get_api_key()
        endpoint = f"{GOOGLE_API_BASE}/{self.model_name}:batchEmbedContents"

        all_embeddings: List[List[float]] = []
        total_chunks = len(texts)
        total_batches = (total_chunks + effective_batch_size - 1) // effective_batch_size

        async with self._semaphore:
            async with httpx.AsyncClient(timeout=45.0) as client:
                for batch_idx in range(total_batches):
                    start_idx = batch_idx * effective_batch_size
                    batch = texts[start_idx : start_idx + effective_batch_size]
                    current_batch_num = batch_idx + 1

                    requests_payload = [
                        {
                            "model": self.model_name,
                            "content": {"parts": [{"text": t}]},
                        }
                        for t in batch
                    ]

                    payload = {"requests": requests_payload}
                    params = {"key": api_key}

                    success = False

                    for attempt in range(1, max_retries + 1):
                        try:
                            response = await client.post(endpoint, params=params, json=payload)

                            if response.status_code == 200:
                                data = response.json()
                                batch_results = [
                                    emb["values"] for emb in data.get("embeddings", [])
                                ]
                                if len(batch_results) != len(batch):
                                    raise GeminiAPIError(
                                        f"Expected {len(batch)} embeddings from batch {current_batch_num}, but received {len(batch_results)}."
                                    )
                                all_embeddings.extend(batch_results)
                                success = True
                                break

                            elif response.status_code == 429:
                                # Rate limit hit: parse Retry-After or calculate exponential backoff with jitter
                                wait_time = parse_retry_after(response, attempt)

                                logger.warning(
                                    f"Gemini Embedding rate limit (HTTP 429) on batch {current_batch_num}/{total_batches}. "
                                    f"Retrying in {wait_time:.1f}s (attempt {attempt}/{max_retries})..."
                                )

                                if attempt == max_retries:
                                    raise GeminiRateLimitError(
                                        "Gemini embedding quota temporarily exceeded. Your document has been saved but is not yet indexed. Retry indexing later."
                                    )
                                await asyncio.sleep(wait_time)

                            elif response.status_code in (401, 403):
                                # Auth failure: do NOT leak key
                                logger.error(f"Gemini API authentication error (HTTP {response.status_code}) on batch {current_batch_num}.")
                                raise GeminiAuthError("Invalid or unauthorized GEMINI_API_KEY. Please verify backend/.env.")

                            elif response.status_code == 400:
                                logger.error(f"Gemini API Bad Request (HTTP 400) on batch {current_batch_num}.")
                                raise GeminiAPIError("Bad request sent to Gemini Embedding API. Check text chunk formatting.")

                            elif response.status_code == 404:
                                logger.error(f"Gemini model not found: {self.model_name}")
                                raise GeminiAPIError(f"Gemini embedding model '{self.model_name}' not found.")

                            else:
                                # Transient 5xx server errors
                                wait_time = (1.5 * attempt) + random.uniform(0.1, 0.4)
                                logger.warning(
                                    f"Gemini Embedding API HTTP {response.status_code} on batch {current_batch_num}/{total_batches}. "
                                    f"Retrying in {wait_time:.1f}s (attempt {attempt}/{max_retries})..."
                                )
                                if attempt == max_retries:
                                    raise GeminiAPIError(
                                        f"Gemini Embedding API returned HTTP {response.status_code} after {max_retries} attempts."
                                    )
                                await asyncio.sleep(wait_time)

                        except httpx.TimeoutException:
                            wait_time = (1.5 * attempt) + random.uniform(0.1, 0.4)
                            logger.warning(
                                f"Timeout connecting to Gemini Embedding API on batch {current_batch_num}/{total_batches}. "
                                f"Retrying in {wait_time:.1f}s (attempt {attempt}/{max_retries})..."
                            )
                            if attempt == max_retries:
                                raise GeminiAPIError("Timeout connecting to Gemini Embedding 2 service after maximum retries.")
                            await asyncio.sleep(wait_time)

                        except (GeminiAPIError, GeminiAPIKeyMissingError):
                            raise
                        except Exception as e:
                            if attempt == max_retries:
                                raise GeminiAPIError(f"Unexpected error calling Gemini Embedding API: {type(e).__name__}")
                            await asyncio.sleep(1.0)

                if not success:
                    raise GeminiAPIError(f"Failed to generate embeddings for batch {current_batch_num}/{total_batches}.")

                # Invoke progress callback if provided
                if progress_callback:
                    try:
                        res = progress_callback(current_batch_num, total_batches, len(batch), total_chunks)
                        if asyncio.iscoroutine(res):
                            await res
                    except Exception as cb_err:
                        logger.debug(f"Progress callback error: {cb_err}")

                # Gentle polite throttle between batches to prevent quota burst
                if batch_idx < total_batches - 1 and inter_batch_delay > 0:
                    await asyncio.sleep(inter_batch_delay)

        return all_embeddings


embedding_service = GeminiEmbeddingService()
