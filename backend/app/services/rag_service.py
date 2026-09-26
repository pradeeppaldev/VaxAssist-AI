"""
Grounded Retrieval-Augmented Generation (RAG) Service.
Combines Gemini Embedding 2 semantic search, ChromaDB vector matching,
strict evidence filtering, and Gemini LLM generation with mandatory clinical guardrails.
"""
import time
import logging
import asyncio
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.schemas.knowledge import (
    RAGQueryRequest,
    RAGQueryResponse,
    RAGSourceItem,
    RAGRetrievedChunk,
)
from app.services.embedding_service import embedding_service, GeminiAPIError, GeminiAPIKeyMissingError
from app.services.vector_store import vector_store, VectorStoreError

logger = logging.getLogger("vaxassist.knowledge.rag")

GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Strict clinical system prompt for grounded RAG answers
RAG_SYSTEM_PROMPT = """You are VaxAssist AI's Clinical Knowledge Assistant, an expert informational assistant grounded exclusively in verified official immunization documentation.

STRICT OPERATIONAL GUIDELINES:
1. GROUNDED EVIDENCE ONLY: Formulate your answer solely based on the provided Context excerpts. Do NOT invent, assume, extrapolate, or fabricate vaccination guidelines, schedules, contraindications, or sources.
2. INSUFFICIENT EVIDENCE: If the retrieved context does not contain clear, explicit information to answer the question, clearly state: "The VaxAssist AI Knowledge Base does not contain sufficient verified documentation to answer this question. Please consult with your pediatrician or healthcare provider."
3. SCHEDULE ENGINE PRESERVATION: Never calculate, alter, or synthesize personalized vaccination due dates or schedules yourself. Emphasize that patient-specific schedules and status calculations are deterministically computed by the VaxAssist Schedule Engine.
4. MEDICAL DISCLAIMER & SAFETY: Do not diagnose medical conditions, recommend specific pharmaceutical brands without guidance, or replace professional clinical judgment. Always advise users to consult qualified healthcare professionals before clinical decisions.
5. CITATIONS: Attribute key facts to the sources cited in the context (referencing the official document title and page number when available).
6. TONE: Professional, objective, empathetic, clear, and reassuring.
"""


class RAGService:
    """
    Executes grounded RAG workflow against ChromaDB knowledge vectors and Gemini.
    """

    def __init__(
        self,
        generation_model: Optional[str] = None,
        top_k: Optional[int] = None,
        relevance_threshold: float = 0.65,
    ):
        raw_gen = generation_model or settings.GEMINI_GENERATION_MODEL
        if not raw_gen.startswith("models/"):
            self.generation_model = f"models/{raw_gen}"
        else:
            self.generation_model = raw_gen

        self.top_k = top_k or settings.RAG_TOP_K
        self.relevance_threshold = relevance_threshold

    async def query(self, req: RAGQueryRequest) -> RAGQueryResponse:
        """
        Executes end-to-end RAG query:
        1. Validates query text
        2. Generates query vector via Gemini Embedding 2
        3. Queries ChromaDB vector store
        4. Filters for semantic relevance
        5. Constructs grounded context
        6. Calls Gemini LLM with clinical guardrails
        7. Returns answer with verified sources
        """
        start_time = time.time()
        question = req.question.strip()
        if len(question) < 3:
            raise ValueError("Query question is too short. Please provide a more descriptive query.")

        # 1. Generate query embedding via Gemini Embedding 2
        query_vector = await embedding_service.embed_text(question)

        # 2. Build ChromaDB filter if specified
        where_filter: Optional[Dict[str, Any]] = None
        filter_conditions = []
        if req.document_type_filter:
            filter_conditions.append({"document_type": req.document_type_filter})
        if req.authority_filter:
            filter_conditions.append({"source_authority": req.authority_filter})

        if len(filter_conditions) == 1:
            where_filter = filter_conditions[0]
        elif len(filter_conditions) > 1:
            where_filter = {"$and": filter_conditions}

        # 3. Retrieve relevant chunks from ChromaDB
        effective_k = req.top_k or self.top_k
        raw_chunks = vector_store.search(
            query_embedding=query_vector,
            top_k=effective_k,
            where_filter=where_filter,
        )

        # 4. Relevance filtering
        relevant_chunks: List[Dict[str, Any]] = []
        for rc in raw_chunks:
            if rc["similarity_score"] >= self.relevance_threshold:
                relevant_chunks.append(rc)

        # Format retrieved chunks for response schema
        formatted_chunks = [
            RAGRetrievedChunk(
                content=c["content"],
                document_id=c["metadata"].get("knowledge_document_id", ""),
                document_title=c["metadata"].get("document_title", "Official Guideline"),
                source_authority=c["metadata"].get("source_authority", "Health Authority"),
                page_number=int(c["metadata"]["page_number"]) if c["metadata"].get("page_number") else None,
                chunk_index=int(c["metadata"].get("chunk_index", 0)),
                distance=c["distance"],
                similarity_score=c["similarity_score"],
            )
            for c in relevant_chunks
        ]

        # 5. Handle scenario where no relevant documentation is found
        if not relevant_chunks:
            elapsed = round((time.time() - start_time) * 1000, 2)
            return RAGQueryResponse(
                question=question,
                answer=(
                    "The VaxAssist AI Knowledge Base does not currently contain verified documentation "
                    "addressing this specific query. Please consult with your pediatrician or local healthcare "
                    "provider for authoritative clinical guidance."
                ),
                sources=[],
                retrieved_chunks=[],
                metadata={
                    "retrieved_count": 0,
                    "model_used": self.generation_model,
                    "elapsed_ms": elapsed,
                    "grounded": False,
                },
            )

        # 6. Extract deduplicated source citations
        sources_map: Dict[str, RAGSourceItem] = {}
        for c in relevant_chunks:
            meta = c["metadata"]
            doc_id = meta.get("knowledge_document_id", "")
            page = int(meta["page_number"]) if meta.get("page_number") else None
            key = f"{doc_id}_p{page}"

            if key not in sources_map:
                sources_map[key] = RAGSourceItem(
                    document_id=doc_id,
                    document_title=meta.get("document_title", "Document"),
                    source_authority=meta.get("source_authority", "Health Authority"),
                    source_url=meta.get("source_url") or None,
                    page_number=page,
                    chunk_index=int(meta.get("chunk_index", 0)),
                )

        unique_sources = list(sources_map.values())

        # 7. Assemble grounded context prompt
        context_blocks = []
        for idx, c in enumerate(relevant_chunks):
            meta = c["metadata"]
            title = meta.get("document_title", "Document")
            auth = meta.get("source_authority", "Authority")
            page = meta.get("page_number", "N/A")
            context_blocks.append(
                f"[Source {idx + 1}: {title} | Authority: {auth} | Page: {page}]\n{c['content']}"
            )

        assembled_context = "\n\n---\n\n".join(context_blocks)

        user_prompt = (
            f"CONTEXT FROM OFFICIAL IMMUNIZATION KNOWLEDGE BASE:\n"
            f"{assembled_context}\n\n"
            f"QUESTION:\n{question}\n\n"
            f"Please answer the user's question using ONLY the provided official context above. "
            f"Cite the relevant documents and page numbers where appropriate."
        )

        # 8. Generate answer via Gemini LLM with graceful error containment
        try:
            answer = await self._generate_gemini_answer(user_prompt)
        except Exception as gen_err:
            logger.warning(f"Gemini generation service error: {gen_err}")
            doc_title = unique_sources[0].document_title if unique_sources else "Verified Clinical Guidelines"
            snippet = relevant_chunks[0]["content"][:320].strip() if relevant_chunks else ""
            answer = (
                f"Official Immunization Guidance (Retrieved from {doc_title}):\n\n"
                f"{snippet}...\n\n"
                f"[Service Notice: AI synthesis is temporarily throttled or unavailable ({str(gen_err)}). "
                f"The verified guideline excerpt above was retrieved directly from official documentation. Please consult your pediatrician.]"
            )

        is_unsupported = (
            "does not contain sufficient verified documentation" in answer.lower()
            or "does not currently contain verified documentation" in answer.lower()
            or "knowledge base does not contain" in answer.lower()
            or "insufficient verified documentation" in answer.lower()
        )
        if is_unsupported:
            unique_sources = []
            formatted_chunks = []

        elapsed = round((time.time() - start_time) * 1000, 2)
        return RAGQueryResponse(
            question=question,
            answer=answer,
            sources=unique_sources,
            retrieved_chunks=formatted_chunks,
            metadata={
                "retrieved_count": len(formatted_chunks),
                "model_used": self.generation_model,
                "elapsed_ms": elapsed,
                "grounded": not is_unsupported,
            },
        )

    async def _generate_gemini_answer(self, user_prompt: str) -> str:
        """Calls Gemini API with the assembled prompt and clinical system instructions."""
        api_key = settings.GEMINI_API_KEY
        if not api_key or not api_key.strip():
            raise GeminiAPIKeyMissingError("GEMINI_API_KEY is not configured.")

        endpoint = f"{GOOGLE_API_BASE}/{self.generation_model}:generateContent"
        params = {"key": api_key.strip()}

        payload = {
            "system_instruction": {
                "parts": [{"text": RAG_SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,  # Low temperature for clinical fidelity
                "topP": 0.8,
                "maxOutputTokens": 1024,
            }
        }

        max_retries = 4
        backoff_delays = [1.0, 2.0, 4.0, 8.0]

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    response = await client.post(endpoint, params=params, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip()
                        return "No response could be generated from the verified evidence."
                    elif response.status_code in (429, 500, 502, 503, 504):
                        delay = backoff_delays[min(attempt, len(backoff_delays) - 1)]
                        logger.warning(
                            f"Gemini generation returned HTTP {response.status_code}. "
                            f"Attempt {attempt + 1}/{max_retries}. Retrying in {delay}s..."
                        )
                        if attempt < max_retries - 1:
                            await asyncio.sleep(delay)
                            continue
                        raise GeminiAPIError(f"Gemini API rate limit or service error (HTTP {response.status_code}) after {max_retries} attempts.")
                    elif response.status_code in (401, 403):
                        raise GeminiAPIError("Gemini API authentication failed. Please verify GEMINI_API_KEY.")
                    else:
                        logger.error(f"Gemini generation error ({response.status_code}): {response.text[:200]}")
                        raise GeminiAPIError(f"Gemini API returned HTTP {response.status_code}")
            except (httpx.TimeoutException, httpx.RequestError) as net_err:
                if attempt < max_retries - 1:
                    delay = backoff_delays[min(attempt, len(backoff_delays) - 1)]
                    logger.warning(f"Network error on Gemini generation ({net_err}). Attempt {attempt + 1}/{max_retries}. Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    continue
                raise GeminiAPIError(f"Network error communicating with Gemini generation service: {net_err}")


rag_service = RAGService()
