"""
Comprehensive Test Suite for Phase 8:
AGENT 3 OF 5: KNOWLEDGE / RAG AGENT IMPLEMENTATION.

Validates:
1. Agent Architecture & BaseAgent Lifecycle
2. Query Validation (empty, too short, too long queries)
3. Grounded Retrieval & Source Citation Attribution
4. Insufficient Context & Safe Fallback Handling
5. Provider Error Handling (Gemini missing key, Gemini API error, Vector store error)
6. BaseAgent.run() Lifecycle, Telemetry & Exception Containment
7. Clinical Safety Guardrails & Schedule Engine Authority Preservation
8. API Endpoints via FastAPI TestClient (Auth, Query, Run, Errors)
"""
import sys
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from unittest.mock import AsyncMock, patch, MagicMock

from app.main import app
from app.agents.base import BaseAgent, AgentStatus, AgentExecutionResult
from app.agents.architecture import FIVE_AGENT_ARCHITECTURE
from app.agents.knowledge import (
    knowledge_agent,
    KnowledgeAgent,
    KnowledgeAgentInput,
    KnowledgeAgentResult,
    KnowledgeSourceCitation,
    MANDATORY_CLINICAL_DISCLAIMER,
)
from app.schemas.knowledge import (
    RAGQueryRequest,
    RAGQueryResponse,
    RAGSourceItem,
    RAGRetrievedChunk,
)
from app.services.embedding_service import GeminiAPIError, GeminiAPIKeyMissingError
from app.services.vector_store import VectorStoreError
from app.models.user import UserRole
from app.api.deps import get_current_user


def print_step(title: str):
    print(f"\n{'='*75}\n[TEST KNOWLEDGE AGENT] {title}\n{'='*75}")


# =============================================================================
# 1. Agent Architecture & BaseAgent Lifecycle
# =============================================================================
def test_knowledge_agent_architecture():
    print_step("1. Agent Architecture & BaseAgent Lifecycle")

    assert isinstance(knowledge_agent, BaseAgent), "Knowledge Agent must inherit from BaseAgent"
    assert knowledge_agent.agent_id == "agent_knowledge_rag_v1"
    assert knowledge_agent.name == "Knowledge / RAG Agent"
    assert knowledge_agent.version == "1.0.0"

    metadata = knowledge_agent.metadata
    assert metadata.agent_id == "agent_knowledge_rag_v1"
    assert metadata.name == "Knowledge / RAG Agent"
    assert "guideline" in metadata.description.lower() or "vaccination" in metadata.description.lower()

    # Architecture registry verification
    assert "knowledge_rag_agent" in FIVE_AGENT_ARCHITECTURE
    spec = FIVE_AGENT_ARCHITECTURE["knowledge_rag_agent"]
    assert spec["agent_id"] == "agent_knowledge_rag_v1"
    assert spec["zero_llm_rules_enforced"] is False
    assert "Gemini" in spec["upstream_dependencies"] or "gemini" in str(spec["upstream_dependencies"]).lower()

    print("  [OK] Knowledge Agent correctly implements BaseAgent and matches architecture registry.")
    print("PASS: Agent Architecture & BaseAgent specification verified.")


# =============================================================================
# 2. Query Validation
# =============================================================================
def test_query_validation():
    print_step("2. Query Validation (Empty, Short, Long Bounds)")

    # 1. Empty query
    try:
        asyncio.run(knowledge_agent.execute(KnowledgeAgentInput(question="   ")))
        assert False, "Should have raised ValueError on empty query"
    except ValueError as ve:
        assert "too short" in str(ve).lower() or "minimum length" in str(ve).lower()
        print("  [OK] Empty/whitespace query rejected with ValueError.")

    # 2. Too short (< 3 chars)
    try:
        asyncio.run(knowledge_agent.execute(KnowledgeAgentInput(question="ab")))
        assert False, "Should have raised ValueError on 2-char query"
    except ValueError as ve:
        assert "3" in str(ve)
        print("  [OK] Under-3-character query ('ab') rejected with ValueError.")

    # 3. Too long (> 1000 chars)
    try:
        asyncio.run(knowledge_agent.execute(KnowledgeAgentInput(question="x" * 1001)))
        assert False, "Should have raised ValueError on > 1000 char query"
    except ValueError as ve:
        assert "1000" in str(ve)
        print("  [OK] Over-1000-character query rejected with ValueError.")

    print("PASS: Query validation bounds verified.")


# =============================================================================
# 3. Grounded Retrieval & Source Citation Attribution
# =============================================================================
def test_grounded_retrieval_and_citations():
    print_step("3. Grounded Retrieval & Source Citation Attribution")

    mock_rag_response = RAGQueryResponse(
        question="What is the recommended age for BCG vaccine under UIP?",
        answer=(
            "Under the Universal Immunization Programme (UIP), the BCG vaccine birth dose "
            "should be administered intradermally at birth or as early as possible up to one year of age."
        ),
        sources=[
            RAGSourceItem(
                document_id="doc_uip_guidelines_2024",
                document_title="National Immunization Schedule (NIS) Comprehensive Operational Guidelines",
                source_authority="MOHFW",
                source_url="https://mohfw.gov.in/immunization/nis",
                page_number=4,
                chunk_index=2,
            )
        ],
        retrieved_chunks=[
            RAGRetrievedChunk(
                content=(
                    "BCG Vaccine: Given at birth or up to 1 year of age. Dose: 0.05 ml until 1 month of age, "
                    "0.1 ml from 1 month onwards. Route: Intradermal, Left upper arm."
                ),
                document_id="doc_uip_guidelines_2024",
                document_title="National Immunization Schedule (NIS) Comprehensive Operational Guidelines",
                source_authority="MOHFW",
                page_number=4,
                chunk_index=2,
                distance=0.12,
                similarity_score=0.88,
            )
        ],
        metadata={
            "retrieved_count": 1,
            "model_used": "models/gemini-2.5-flash",
            "elapsed_ms": 250.0,
            "grounded": True,
        },
    )

    with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = mock_rag_response

        agent_input = KnowledgeAgentInput(
            question="What is the recommended age for BCG vaccine under UIP?",
            authority_filter="MOHFW",
            correlation_id="corr_test_grounded_123",
        )

        result: KnowledgeAgentResult = asyncio.run(knowledge_agent.execute(input_data=agent_input))

        assert result.agent_id == "agent_knowledge_rag_v1"
        assert result.question == "What is the recommended age for BCG vaccine under UIP?"
        assert "BCG vaccine" in result.answer
        assert result.has_sufficient_context is True
        assert result.confidence_score == 0.88
        assert result.correlation_id == "corr_test_grounded_123"
        assert result.warning is None
        assert result.retrieved_chunks_count == 1
        assert result.model_used == "models/gemini-2.5-flash"
        assert result.execution_duration_ms > 0

        # Verify Citations
        assert len(result.sources) == 1
        citation = result.sources[0]
        assert citation.document_id == "doc_uip_guidelines_2024"
        assert citation.document_title == "National Immunization Schedule (NIS) Comprehensive Operational Guidelines"
        assert citation.source_authority == "MOHFW"
        assert citation.page_number == 4
        assert citation.relevance_score == 0.88
        assert "BCG Vaccine: Given at birth" in citation.excerpt
        assert citation.source_url == "https://mohfw.gov.in/immunization/nis"

        # Verify Mandatory Disclaimer
        assert result.disclaimer == MANDATORY_CLINICAL_DISCLAIMER
        assert "Schedule Engine" in result.disclaimer
        assert "pediatrician" in result.disclaimer

        print("  [OK] Grounded answer generated with verified citations and similarity metrics.")
        print(f"  [OK] Verified citation: {citation.document_title} (Page {citation.page_number}, Score: {citation.relevance_score})")
        print("PASS: Grounded retrieval & source citation attribution verified.")


# =============================================================================
# 4. Insufficient Context & Safe Fallback Handling
# =============================================================================
def test_insufficient_context_fallback():
    print_step("4. Insufficient Context & Safe Fallback Handling")

    # Scenario: Query on completely unindexed topic (e.g. experimental non-vaccine drug)
    mock_rag_response = RAGQueryResponse(
        question="Can I give experimental compound XYZ for measles treatment?",
        answer=(
            "The VaxAssist AI Knowledge Base does not contain sufficient verified documentation "
            "to answer this question. Please consult with your pediatrician or healthcare provider."
        ),
        sources=[],
        retrieved_chunks=[],
        metadata={
            "retrieved_count": 0,
            "model_used": "models/gemini-2.5-flash",
            "elapsed_ms": 110.0,
            "grounded": False,
        },
    )

    with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = mock_rag_response

        agent_input = KnowledgeAgentInput(
            question="Can I give experimental compound XYZ for measles treatment?",
        )

        result: KnowledgeAgentResult = asyncio.run(knowledge_agent.execute(input_data=agent_input))

        assert result.has_sufficient_context is False
        assert result.confidence_score == 0.0
        assert len(result.sources) == 0
        assert result.retrieved_chunks_count == 0
        assert result.warning is not None
        assert "does not contain sufficient verified documentation" in result.warning or "consult" in result.warning
        assert "does not contain sufficient verified documentation" in result.answer.lower()
        assert result.disclaimer == MANDATORY_CLINICAL_DISCLAIMER

        print("  [OK] Insufficient evidence gracefully detected: confidence=0.0, sources empty, warning raised.")
        print("PASS: Safe fallback on insufficient context verified.")


# =============================================================================
# 5. Provider Error Handling
# =============================================================================
def test_provider_error_handling():
    print_step("5. Provider Error Handling (Gemini Key, API Error, Vector Store)")

    # 1. Missing Gemini API Key
    with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
        mock_query.side_effect = GeminiAPIKeyMissingError("GEMINI_API_KEY is not configured.")
        try:
            asyncio.run(knowledge_agent.execute(KnowledgeAgentInput(question="What is IPV?")))
            assert False, "Should have raised GeminiAPIKeyMissingError"
        except GeminiAPIKeyMissingError as err:
            assert "GEMINI_API_KEY" in str(err)
            print("  [OK] GeminiAPIKeyMissingError propagated cleanly.")

    # 2. Gemini API Error (Quota / HTTP 500)
    with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
        mock_query.side_effect = GeminiAPIError("Gemini API returned HTTP 429: Resource Exhausted")
        try:
            asyncio.run(knowledge_agent.execute(KnowledgeAgentInput(question="What is IPV?")))
            assert False, "Should have raised GeminiAPIError"
        except GeminiAPIError as err:
            assert "429" in str(err)
            print("  [OK] GeminiAPIError propagated cleanly.")

    # 3. Vector Store Error (ChromaDB down/corrupt)
    with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
        mock_query.side_effect = VectorStoreError("ChromaDB index file unavailable.")
        try:
            asyncio.run(knowledge_agent.execute(KnowledgeAgentInput(question="What is IPV?")))
            assert False, "Should have raised VectorStoreError"
        except VectorStoreError as err:
            assert "ChromaDB" in str(err)
            print("  [OK] VectorStoreError propagated cleanly.")

    print("PASS: Provider error handling verified.")


# =============================================================================
# 6. BaseAgent.run() Lifecycle, Telemetry & Exception Containment
# =============================================================================
def test_base_agent_run_lifecycle():
    print_step("6. BaseAgent.run() Lifecycle, Telemetry & Exception Containment")

    # 1. Successful execution through run() wrapper
    mock_rag_response = RAGQueryResponse(
        question="What is the route for Rotavirus vaccine?",
        answer="Rotavirus vaccine (Rotavac/RotaSIIL) is administered orally as drops.",
        sources=[
            RAGSourceItem(
                document_id="doc_rota_1",
                document_title="Operational Guidelines for Rotavirus Vaccine Introduction",
                source_authority="MOHFW",
                page_number=2,
            )
        ],
        retrieved_chunks=[
            RAGRetrievedChunk(
                content="Route of administration: Oral. 5 drops (Rotavac) or 2.5 ml depending on formulation.",
                document_id="doc_rota_1",
                document_title="Operational Guidelines for Rotavirus Vaccine Introduction",
                source_authority="MOHFW",
                page_number=2,
                chunk_index=0,
                similarity_score=0.91,
            )
        ],
        metadata={"grounded": True, "model_used": "models/gemini-2.5-flash"},
    )

    with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = mock_rag_response

        run_result: AgentExecutionResult[KnowledgeAgentResult] = asyncio.run(
            knowledge_agent.run(input_data=KnowledgeAgentInput(question="What is the route for Rotavirus vaccine?"))
        )

        assert run_result.status == AgentStatus.SUCCESS
        assert run_result.agent_id == "agent_knowledge_rag_v1"
        assert run_result.agent_name == "Knowledge / RAG Agent"
        assert run_result.execution_id.startswith("exec_")
        assert run_result.duration_ms > 0
        assert run_result.data is not None
        assert run_result.data.question == "What is the route for Rotavirus vaccine?"
        assert run_result.data.confidence_score == 0.91
        assert len(run_result.errors) == 0
        print("  [OK] BaseAgent.run() successful execution verified with execution ID and timing.")

    # 2. Failed execution containment through run() wrapper
    with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
        mock_query.side_effect = GeminiAPIError("Remote LLM connection timeout.")

        failed_result: AgentExecutionResult[KnowledgeAgentResult] = asyncio.run(
            knowledge_agent.run(input_data=KnowledgeAgentInput(question="What is Rotavirus route?"))
        )

        assert failed_result.status == AgentStatus.FAILED
        assert failed_result.agent_id == "agent_knowledge_rag_v1"
        assert len(failed_result.errors) == 1
        assert "Remote LLM connection timeout" in failed_result.errors[0]
        assert failed_result.data is None
        print("  [OK] BaseAgent.run() caught exception cleanly without crashing process.")

    print("PASS: BaseAgent run wrapper lifecycle and telemetry verified.")


# =============================================================================
# 7. Clinical Safety Guardrails & Schedule Engine Authority Preservation
# =============================================================================
def test_clinical_safety_guardrails():
    print_step("7. Clinical Safety Guardrails & Schedule Engine Authority Preservation")

    # Verify standard disclaimer explicitly protects schedule engine and pediatricians
    assert "Schedule Engine" in MANDATORY_CLINICAL_DISCLAIMER
    assert "pediatrician" in MANDATORY_CLINICAL_DISCLAIMER
    assert "diagnosis" in MANDATORY_CLINICAL_DISCLAIMER.lower()

    # Verify query for patient schedule reminds user of deterministic engine
    mock_rag_response = RAGQueryResponse(
        question="Can you calculate when my child born on 2026-01-01 should get OPV-1?",
        answer=(
            "Under the National Immunization Schedule, OPV-1 is routinely scheduled at 6 weeks of age. "
            "However, patient-specific vaccination due dates, grace windows, and catch-up schedules are "
            "computed deterministically by the VaxAssist Schedule Engine based on the child's recorded "
            "date of birth and prior administered doses. Please refer to your patient dashboard."
        ),
        sources=[
            RAGSourceItem(
                document_id="doc_uip_nis",
                document_title="Universal Immunization Programme Guidelines",
                source_authority="MOHFW",
                page_number=1,
            )
        ],
        retrieved_chunks=[
            RAGRetrievedChunk(
                content="OPV 1st dose at 6 weeks.",
                document_id="doc_uip_nis",
                document_title="Universal Immunization Programme Guidelines",
                source_authority="MOHFW",
                page_number=1,
                chunk_index=0,
                similarity_score=0.85,
            )
        ],
        metadata={"grounded": True},
    )

    with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = mock_rag_response

        result: KnowledgeAgentResult = asyncio.run(
            knowledge_agent.execute(
                KnowledgeAgentInput(question="Can you calculate when my child born on 2026-01-01 should get OPV-1?")
            )
        )

        assert "Schedule Engine" in result.disclaimer
        assert result.has_sufficient_context is True
        print("  [OK] Clinical safety guardrails and schedule engine protection verified.")

    print("PASS: Clinical safety guardrails verified.")


# =============================================================================
# 8. API Endpoints via FastAPI TestClient
# =============================================================================
def test_api_endpoints():
    print_step("8. API Endpoints via FastAPI TestClient (/knowledge/query and /knowledge/run)")
    from starlette.testclient import TestClient

    client = TestClient(app)

    # 1. Unauthenticated request -> 401 / 403
    resp_unauth = client.post("/api/v1/agents/knowledge/query", json={"question": "What is BCG?"})
    assert resp_unauth.status_code in (401, 403), f"Expected 401/403, got {resp_unauth.status_code}"
    print("  [OK] Unauthenticated request to /knowledge/query rejected.")

    # 2. Dependency override for authenticated patient
    patient_id = "patient_rag_test_001"
    async def mock_current_patient():
        return {"id": patient_id, "role": UserRole.PATIENT.value, "email": "patient@vaxassist.ai"}

    app.dependency_overrides[get_current_user] = mock_current_patient

    try:
        mock_rag_response = RAGQueryResponse(
            question="What is the dosing interval between Pentavalent-1 and Pentavalent-2?",
            answer="The minimum interval between Pentavalent doses is 4 weeks (28 days).",
            sources=[
                RAGSourceItem(
                    document_id="doc_penta_uip",
                    document_title="Pentavalent Vaccine Operational Guidelines",
                    source_authority="MOHFW",
                    page_number=3,
                )
            ],
            retrieved_chunks=[
                RAGRetrievedChunk(
                    content="Pentavalent-1, 2 and 3 are given at 6, 10, and 14 weeks with a minimum 4-week interval.",
                    document_id="doc_penta_uip",
                    document_title="Pentavalent Vaccine Operational Guidelines",
                    source_authority="MOHFW",
                    page_number=3,
                    chunk_index=1,
                    similarity_score=0.92,
                )
            ],
            metadata={"grounded": True, "model_used": "models/gemini-2.5-flash"},
        )

        with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
            mock_query.return_value = mock_rag_response

            # 3. POST /api/v1/agents/knowledge/query
            resp = client.post(
                "/api/v1/agents/knowledge/query",
                json={
                    "question": "What is the dosing interval between Pentavalent-1 and Pentavalent-2?",
                    "authority_filter": "MOHFW",
                    "correlation_id": "api_test_corr_001",
                },
            )
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            body = resp.json()
            assert body["success"] is True
            data = body["data"]
            assert data["agent_id"] == "agent_knowledge_rag_v1"
            assert data["has_sufficient_context"] is True
            assert data["confidence_score"] == 0.92
            assert len(data["sources"]) == 1
            assert data["sources"][0]["document_title"] == "Pentavalent Vaccine Operational Guidelines"
            assert data["correlation_id"] == "api_test_corr_001"
            print("  [OK] POST /api/v1/agents/knowledge/query returned 200 with KnowledgeAgentResult.")

            # 4. POST /api/v1/agents/knowledge/run (BaseAgent lifecycle)
            resp_run = client.post(
                "/api/v1/agents/knowledge/run",
                json={
                    "question": "What is the dosing interval between Pentavalent-1 and Pentavalent-2?",
                },
            )
            assert resp_run.status_code == 200, f"Expected 200, got {resp_run.status_code}: {resp_run.text}"
            run_body = resp_run.json()
            assert run_body["success"] is True
            exec_data = run_body["data"]
            assert exec_data["agent_id"] == "agent_knowledge_rag_v1"
            assert exec_data["status"] == "SUCCESS"
            assert exec_data["execution_id"].startswith("exec_")
            assert exec_data["duration_ms"] > 0
            assert exec_data["data"]["confidence_score"] == 0.92
            print("  [OK] POST /api/v1/agents/knowledge/run returned 200 with AgentExecutionResult.")

        # 5. Invalid query (< 3 chars) -> 400 Bad Request
        resp_bad = client.post("/api/v1/agents/knowledge/query", json={"question": "a"})
        assert resp_bad.status_code == 422 or resp_bad.status_code == 400
        print("  [OK] Invalid short query rejected with HTTP 400/422.")

        # 6. Provider error mapping in endpoint (GeminiAPIError -> 502)
        with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
            mock_query.side_effect = GeminiAPIError("Upstream model service unavailable")
            resp_err = client.post(
                "/api/v1/agents/knowledge/query",
                json={"question": "What are contraindications for Pentavalent?"},
            )
            assert resp_err.status_code == 502
            print("  [OK] GeminiAPIError properly mapped to HTTP 502 Bad Gateway.")

        # 7. Missing API key mapping (GeminiAPIKeyMissingError -> 503)
        with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
            mock_query.side_effect = GeminiAPIKeyMissingError("GEMINI_API_KEY missing")
            resp_key = client.post(
                "/api/v1/agents/knowledge/query",
                json={"question": "What are contraindications for Pentavalent?"},
            )
            assert resp_key.status_code == 503
            print("  [OK] GeminiAPIKeyMissingError properly mapped to HTTP 503 Service Unavailable.")

        # 8. Vector store error mapping (VectorStoreError -> 503)
        with patch.object(knowledge_agent.rag_service, "query", new_callable=AsyncMock) as mock_query:
            mock_query.side_effect = VectorStoreError("ChromaDB storage read failure")
            resp_vs = client.post(
                "/api/v1/agents/knowledge/query",
                json={"question": "What are contraindications for Pentavalent?"},
            )
            assert resp_vs.status_code == 503
            print("  [OK] VectorStoreError properly mapped to HTTP 503 Service Unavailable.")

    finally:
        app.dependency_overrides.clear()

    print("PASS: API endpoints verified via FastAPI TestClient.")


# =============================================================================
# MAIN TEST RUNNER
# =============================================================================
def run_all_knowledge_agent_tests():
    print("=" * 75)
    print("RUNNING PHASE 8: AGENT 3 (KNOWLEDGE / RAG AGENT) TEST SUITE")
    print("=" * 75)

    test_knowledge_agent_architecture()
    test_query_validation()
    test_grounded_retrieval_and_citations()
    test_insufficient_context_fallback()
    test_provider_error_handling()
    test_base_agent_run_lifecycle()
    test_clinical_safety_guardrails()
    test_api_endpoints()

    print("\n" + "=" * 75)
    print("ALL KNOWLEDGE / RAG AGENT TESTS PASSED SUCCESSFULLY! (8/8)")
    print("=" * 75)


if __name__ == "__main__":
    run_all_knowledge_agent_tests()
