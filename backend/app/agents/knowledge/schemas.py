"""
Pydantic Schemas for Knowledge / RAG Agent (Agent 3 of 5).
Defines request, response, and citation data transfer objects.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class KnowledgeAgentInput(BaseModel):
    """Input payload for Knowledge / RAG Agent execution."""
    question: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="User or clinical inquiry regarding vaccination guidance, policies, or schedules",
    )
    top_k: Optional[int] = Field(
        default=None,
        ge=1,
        le=10,
        description="Override maximum number of relevant chunks to retrieve from ChromaDB",
    )
    document_type_filter: Optional[str] = Field(
        default=None,
        description="Optional filter by DocumentType (e.g., GUIDELINE, SCHEDULE, FAQ)",
    )
    authority_filter: Optional[str] = Field(
        default=None,
        description="Optional filter by SourceAuthority (e.g., MOHFW, WHO, IAP, CDC)",
    )
    correlation_id: Optional[str] = Field(
        default=None,
        description="Unique cross-agent correlation ID for distributed tracing",
    )
    user_id: Optional[str] = Field(
        default=None,
        description="User or household identifier requesting the knowledge query",
    )
    caller_user_id: Optional[str] = Field(
        default=None,
        description="Authenticated caller user ID",
    )
    caller_role: Optional[str] = Field(
        default=None,
        description="Caller RBAC role (PATIENT, HEALTHCARE_WORKER, ADMIN)",
    )


class KnowledgeSourceCitation(BaseModel):
    """Structured citation item linking answer claims to official source documents."""
    document_id: str = Field(..., description="Unique knowledge document ID in MongoDB")
    document_title: str = Field(..., description="Official document title")
    source_authority: str = Field(..., description="Issuing authority (e.g. MoHFW, WHO, IAP)")
    source_url: Optional[str] = Field(default=None, description="Official public source URL if available")
    page_number: Optional[int] = Field(default=None, description="Original document page number")
    chunk_index: Optional[int] = Field(default=None, description="Zero-based semantic chunk index")
    relevance_score: float = Field(default=0.0, description="Cosine similarity score (0.0 to 1.0)")
    excerpt: Optional[str] = Field(default=None, description="Verbatim text snippet supporting the answer")


class KnowledgeAgentResult(BaseModel):
    """Structured output returned by Knowledge / RAG Agent."""
    agent_id: str = Field(default="agent_knowledge_rag_v1", description="Unique agent identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC execution timestamp")
    question: str = Field(..., description="Original user query")
    answer: str = Field(..., description="Grounded clinical answer synthesized from official context")
    has_sufficient_context: bool = Field(
        default=True,
        description="Whether sufficient verified documentation was found to answer the query",
    )
    confidence_score: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Confidence score based on retrieval similarity and context sufficiency",
    )
    sources: List[KnowledgeSourceCitation] = Field(
        default_factory=list,
        description="Itemized source citations attributing claims to official documents",
    )
    retrieved_chunks_count: int = Field(
        default=0,
        description="Total relevant document chunks retrieved from ChromaDB",
    )
    model_used: str = Field(
        default="",
        description="Underlying LLM model utilized for inference",
    )
    disclaimer: str = Field(
        ...,
        description="Mandatory clinical safety disclaimer",
    )
    warning: Optional[str] = Field(
        default=None,
        description="Advisory warnings (e.g., fallback mode, low confidence, schedule engine notice)",
    )
    correlation_id: Optional[str] = Field(
        default=None,
        description="Cross-agent correlation ID",
    )
    execution_duration_ms: float = Field(
        default=0.0,
        description="Total execution time in milliseconds",
    )
