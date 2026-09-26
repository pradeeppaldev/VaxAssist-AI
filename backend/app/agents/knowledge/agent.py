"""
Knowledge / RAG Agent Implementation (Agent 3 of 5).
Answers clinical and guideline questions grounded strictly in official immunization documentation
using vector search (ChromaDB) and generative LLM (Gemini) with clinical guardrails.
"""
import time
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from app.agents.base import BaseAgent
from app.agents.knowledge.schemas import (
    KnowledgeAgentInput,
    KnowledgeAgentResult,
    KnowledgeSourceCitation,
)
from app.schemas.knowledge import RAGQueryRequest, RAGQueryResponse
from app.services.rag_service import rag_service, RAGService
from app.services.embedding_service import GeminiAPIError, GeminiAPIKeyMissingError
from app.services.vector_store import VectorStoreError

logger = logging.getLogger("vaxassist.agents.knowledge")

MANDATORY_CLINICAL_DISCLAIMER = (
    "This guidance is grounded strictly in official immunization documentation "
    "(MoHFW UIP, WHO, IAP) for informational purposes. VaxAssist AI does not provide medical "
    "diagnosis, clinical treatment, or replace consultation with a qualified pediatrician "
    "or healthcare provider. Patient vaccination schedules and milestone assessments are "
    "computed deterministically by the VaxAssist Schedule Engine."
)


class KnowledgeAgent(BaseAgent):
    """
    Agent 3 of 5: Knowledge / RAG Agent.
    Retrieves authoritative clinical documentation from ChromaDB via RAG service
    and produces grounded, citation-backed answers with strict clinical guardrails.
    """

    def __init__(self, service: Optional[RAGService] = None):
        super().__init__(
            agent_id="agent_knowledge_rag_v1",
            name="Knowledge / RAG Agent",
            description=(
                "Answers vaccination-related clinical, policy, and guideline questions "
                "strictly grounded in verified vector documentation (MoHFW UIP, WHO, IAP) "
                "with verified citations and medical safety disclaimers."
            ),
            version="1.0.0",
        )
        self.rag_service = service or rag_service

    async def execute(
        self,
        input_data: Optional[KnowledgeAgentInput] = None,
        **kwargs: Any,
    ) -> KnowledgeAgentResult:
        """
        Executes grounded knowledge retrieval and answering workflow:
        1. Validates query text bounds (3 - 1000 characters)
        2. Dispatches semantic search via existing RAG service
        3. Parses retrieved chunks, citations, and LLM answers
        4. Detects insufficient evidence scenarios
        5. Formulates structured KnowledgeAgentResult with citations and disclaimer
        """
        start_time = time.perf_counter()

        # Parse input data
        if input_data is None:
            input_data = KnowledgeAgentInput(**kwargs)

        # 1. Validate query text length
        question = (input_data.question or "").strip()
        if len(question) < 3:
            raise ValueError("Query question is too short. Minimum length is 3 characters.")
        if len(question) > 1000:
            raise ValueError("Query question exceeds maximum length of 1000 characters.")

        logger.info(
            f"KnowledgeAgent executing query: '{question[:60]}...' "
            f"[doc_filter={input_data.document_type_filter}, auth_filter={input_data.authority_filter}]"
        )

        # 2. Delegate to authoritative RAG service
        rag_req = RAGQueryRequest(
            question=question,
            top_k=input_data.top_k,
            document_type_filter=input_data.document_type_filter,
            authority_filter=input_data.authority_filter,
        )

        try:
            rag_resp: RAGQueryResponse = await self.rag_service.query(rag_req)
        except (GeminiAPIError, GeminiAPIKeyMissingError, VectorStoreError) as svc_err:
            logger.warning(f"KnowledgeAgent external service unavailable: {svc_err}")
            return KnowledgeAgentResult(
                agent_id=self.agent_id,
                timestamp=datetime.utcnow(),
                question=question,
                answer=(
                    f"Clinical Knowledge Service is temporarily unavailable ({str(svc_err)}). "
                    "Please refer directly to official MoHFW / WHO immunization documentation or consult your pediatrician."
                ),
                has_sufficient_context=False,
                confidence_score=0.0,
                sources=[],
                retrieved_chunks_count=0,
                model_used="unavailable",
                disclaimer=MANDATORY_CLINICAL_DISCLAIMER,
                warning=f"External service limitation: {str(svc_err)}",
                correlation_id=input_data.correlation_id,
                execution_duration_ms=round((time.perf_counter() - start_time) * 1000, 2),
            )
        except ValueError:
            raise
        except Exception as exc:
            logger.error(f"Unexpected error in KnowledgeAgent during RAG retrieval: {exc}")
            return KnowledgeAgentResult(
                agent_id=self.agent_id,
                timestamp=datetime.utcnow(),
                question=question,
                answer=(
                    f"Clinical Knowledge Service is temporarily unavailable ({str(exc)}). "
                    "Please refer directly to official MoHFW / WHO immunization documentation or consult your pediatrician."
                ),
                has_sufficient_context=False,
                confidence_score=0.0,
                sources=[],
                retrieved_chunks_count=0,
                model_used="unavailable",
                disclaimer=MANDATORY_CLINICAL_DISCLAIMER,
                warning=f"External service limitation: {str(exc)}",
                correlation_id=input_data.correlation_id,
                execution_duration_ms=round((time.perf_counter() - start_time) * 1000, 2),
            )

        # 3. Analyze grounding & context sufficiency
        metadata = rag_resp.metadata or {}
        grounded = metadata.get("grounded", True)
        answer = rag_resp.answer.strip()
        chunks = rag_resp.retrieved_chunks or []
        raw_sources = rag_resp.sources or []

        # Check for insufficient context indicators
        insufficient_markers = [
            "does not contain sufficient verified documentation",
            "does not currently contain verified documentation",
            "knowledge base does not contain",
            "insufficient verified documentation",
        ]
        is_unsupported = (
            not grounded
            or len(chunks) == 0
            or any(marker in answer.lower() for marker in insufficient_markers)
        )

        # 4. Construct citations and confidence scoring
        citations: List[KnowledgeSourceCitation] = []
        if is_unsupported:
            has_sufficient_context = False
            confidence_score = 0.0
            warning = (
                "The VaxAssist Knowledge Base does not contain sufficient verified documentation "
                "addressing this specific query. A professional healthcare provider should be consulted."
            )
        else:
            has_sufficient_context = True
            warning = None

            # Calculate confidence score based on chunk similarity scores
            if chunks:
                scores = [c.similarity_score for c in chunks if c.similarity_score is not None]
                avg_score = sum(scores) / len(scores) if scores else 0.85
                confidence_score = round(min(1.0, max(0.1, avg_score)), 3)
            else:
                confidence_score = 0.85

            # Map retrieved chunks by document_id and page_number for excerpt matching
            chunk_lookup: Dict[str, Any] = {}
            for chunk in chunks:
                key = f"{chunk.document_id}_p{chunk.page_number}"
                if key not in chunk_lookup:
                    chunk_lookup[key] = chunk

            for src in raw_sources:
                key = f"{src.document_id}_p{src.page_number}"
                matched_chunk = chunk_lookup.get(key)
                excerpt = None
                rel_score = 0.0
                if matched_chunk:
                    rel_score = round(matched_chunk.similarity_score, 3)
                    content = matched_chunk.content.strip()
                    excerpt = content[:250] + ("..." if len(content) > 250 else "")

                citations.append(
                    KnowledgeSourceCitation(
                        document_id=src.document_id,
                        document_title=src.document_title,
                        source_authority=src.source_authority,
                        source_url=src.source_url,
                        page_number=src.page_number,
                        chunk_index=src.chunk_index,
                        relevance_score=rel_score,
                        excerpt=excerpt,
                    )
                )

        execution_duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return KnowledgeAgentResult(
            agent_id=self.agent_id,
            timestamp=datetime.utcnow(),
            question=question,
            answer=answer,
            has_sufficient_context=has_sufficient_context,
            confidence_score=confidence_score,
            sources=citations,
            retrieved_chunks_count=len(chunks),
            model_used=metadata.get("model_used", getattr(self.rag_service, "generation_model", "gemini")),
            disclaimer=MANDATORY_CLINICAL_DISCLAIMER,
            warning=warning,
            correlation_id=input_data.correlation_id,
            execution_duration_ms=execution_duration_ms,
        )


# Singleton instance for backend reuse
knowledge_agent = KnowledgeAgent()
