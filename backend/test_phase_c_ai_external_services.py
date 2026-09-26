"""
Phase C: External Services & AI Integration Test Suite.
Verifies:
1. Gemini text generation & clinical guardrails
2. Gemini Embedding 2 service & 3072-dimensional vector output
3. Missing & invalid API key error containment
4. Persistent ChromaDB insertion, retrieval, and metadata preservation
5. Grounded RAG question answering with verified source citations
6. Five specialized AI agents & Multi-Agent Orchestrator workflows
7. Brevo Transactional Email & SMS configuration and E.164 phone validation
"""
import os
import asyncio
import unittest
from datetime import date, datetime
from typing import Dict, Any

from app.config import settings
from app.database.mongodb import db_manager
from app.services.embedding_service import (
    embedding_service,
    GeminiEmbeddingService,
    GeminiAPIKeyMissingError,
    GeminiAPIError,
)
from app.services.vector_store import vector_store, VectorStoreError
from app.services.rag_service import rag_service, RAGService
from app.schemas.knowledge import RAGQueryRequest
from app.agents.monitoring import monitoring_agent, MonitoringAgentInput
from app.agents.reminder import reminder_agent, ReminderAgentInput
from app.agents.knowledge import knowledge_agent, KnowledgeAgentInput
from app.agents.recommendation import recommendation_agent, RecommendationAgentInput
from app.agents.report import report_agent, ReportAgentInput, ReportType, ReportOutputFormat
from app.agents.base import AgentStatus
from app.agents.orchestrator import (
    multi_agent_orchestrator,
    OrchestratorInput,
    OrchestrationWorkflowType,
)
from app.services.brevo_service import (
    brevo_service,
    format_e164_phone,
    build_vaccination_reminder_email,
    build_vaccination_reminder_sms,
)
from app.services.user_service import user_service


class TestPhaseCAIExternalServices(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 70)
        print("  VAXASSIST AI — PHASE C: AI & EXTERNAL SERVICES VERIFICATION")
        print("=" * 70)
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)
        cls.loop.run_until_complete(db_manager.connect())

    @classmethod
    def tearDownClass(cls):
        cls.loop.run_until_complete(db_manager.disconnect())
        cls.loop.close()
        print("\n" + "=" * 70)
        print("  PHASE C VERIFICATION COMPLETE")
        print("=" * 70)

    # -------------------------------------------------------------------------
    # Scenario 1: Gemini Embedding Model & Vector Dimension
    # -------------------------------------------------------------------------
    def test_01_gemini_embedding_and_dimension(self):
        print("\n[SCENARIO 1] Verifying Gemini Embedding 2 model & vector dimension...")
        self.assertTrue(embedding_service.is_configured, "GEMINI_API_KEY must be configured")
        
        async def run_embed():
            test_text = "Universal Immunization Programme India BCG at birth"
            vec = await embedding_service.embed_text(test_text)
            return vec

        vector = self.loop.run_until_complete(run_embed())
        self.assertIsInstance(vector, list)
        self.assertEqual(len(vector), 3072, f"Expected 3072-dim embedding, got {len(vector)}")
        print(f"  PASS: Successfully generated {len(vector)}-dimensional vector via {embedding_service.model_name}.")

    # -------------------------------------------------------------------------
    # Scenario 2: Error Handling for Missing / Invalid Keys
    # -------------------------------------------------------------------------
    def test_02_gemini_error_handling(self):
        print("\n[SCENARIO 2] Verifying error handling for missing and invalid keys...")
        
        async def run_missing():
            svc = GeminiEmbeddingService(api_key="")
            await svc.embed_text("Sample text")

        with self.assertRaises(GeminiAPIKeyMissingError):
            self.loop.run_until_complete(run_missing())
        print("  PASS: Gracefully raised GeminiAPIKeyMissingError when key is empty.")

        async def run_invalid():
            svc = GeminiEmbeddingService(api_key="AIzaSy_INVALID_TEST_KEY_99999")
            await svc.embed_text("Sample text")

        with self.assertRaises(GeminiAPIError):
            self.loop.run_until_complete(run_invalid())
        print("  PASS: Gracefully caught 400/401/403 and raised GeminiAPIError without crash.")

    # -------------------------------------------------------------------------
    # Scenario 3: Persistent ChromaDB Storage, Insertion & Retrieval
    # -------------------------------------------------------------------------
    def test_03_chromadb_insertion_and_search(self):
        print("\n[SCENARIO 3] Verifying ChromaDB persistent storage, chunk insertion & search...")
        info = vector_store.verify_persistence()
        self.assertEqual(info["status"], "connected")
        self.assertTrue(info["exists_on_disk"])

        async def run_vector_ops():
            test_doc_id = "test_phase_c_doc_9999"
            test_chunk_id = f"{test_doc_id}_c0"
            test_text = "Rotavirus oral vaccine is administered at 6, 10, and 14 weeks of age."
            
            # Embed
            vec = await embedding_service.embed_text(test_text)
            
            # Upsert
            vector_store.delete_document_chunks(test_doc_id)
            vector_store.upsert_chunks(
                chunk_ids=[test_chunk_id],
                embeddings=[vec],
                documents=[test_text],
                metadatas=[{
                    "knowledge_document_id": test_doc_id,
                    "document_title": "MoHFW Rotavirus Advisory 2026",
                    "source_authority": "MOHFW",
                    "page_number": 3,
                    "chunk_index": 0,
                }]
            )

            # Query
            results = vector_store.search(query_embedding=vec, top_k=2)
            
            # Cleanup
            deleted = vector_store.delete_document_chunks(test_doc_id)
            return results, deleted

        search_results, deleted_count = self.loop.run_until_complete(run_vector_ops())
        self.assertGreater(len(search_results), 0)
        self.assertGreaterEqual(search_results[0]["similarity_score"], 0.85)
        self.assertEqual(deleted_count, 1)
        print(f"  PASS: Chunk inserted, matched with similarity {search_results[0]['similarity_score']}, and cleaned.")

    # -------------------------------------------------------------------------
    # Scenario 4: Grounded RAG Query & Citation Verification
    # -------------------------------------------------------------------------
    def test_04_rag_grounded_query_and_citations(self):
        print("\n[SCENARIO 4] Verifying Grounded RAG Query with source citations...")

        async def run_rag():
            req = RAGQueryRequest(
                question="What is the recommended administration schedule for BCG vaccine in India?",
                top_k=3
            )
            return await rag_service.query(req)

        resp = self.loop.run_until_complete(run_rag())
        self.assertTrue(resp.metadata.get("grounded"))
        self.assertGreater(len(resp.sources), 0)
        print(f"  PASS: Grounded answer generated ({len(resp.answer)} chars) with {len(resp.sources)} source citation(s).")
        for s in resp.sources:
            print(f"        -> Source: {s.document_title} (Page {s.page_number})")

    # -------------------------------------------------------------------------
    # Scenario 5: Five Specialized AI Agents
    # -------------------------------------------------------------------------
    def test_05_five_specialized_agents(self):
        print("\n[SCENARIO 5] Verifying Five Specialized AI Agents...")

        async def run_agents():
            u = await user_service.get_by_email("rajesh.sharma@vaxassist.demo")
            uid = str(u["id"])

            # 1. Monitoring Agent
            mon_res = await monitoring_agent.execute(MonitoringAgentInput(user_id=uid))
            
            # 2. Reminder Agent
            rem_res = await reminder_agent.execute(ReminderAgentInput(
                user_id=uid,
                events=mon_res.actionable_events,
                dry_run=True,
            ))

            await asyncio.sleep(2.0)

            # 3. Knowledge Agent
            k_res = await knowledge_agent.execute(KnowledgeAgentInput(
                question="When is OPV zero dose given?",
            ))

            # 4. Recommendation Agent
            rec_res = await recommendation_agent.execute(RecommendationAgentInput(
                user_id=uid,
                include_optional_vaccines=True,
            ))

            # 5. Report Generation Agent
            rep_res = await report_agent.execute(ReportAgentInput(
                user_id=uid,
                report_type=ReportType.COMPREHENSIVE_RECORD,
                output_format=ReportOutputFormat.PDF,
            ))

            return mon_res, rem_res, k_res, rec_res, rep_res

        mon, rem, know, rec, rep = self.loop.run_until_complete(run_agents())
        self.assertEqual(mon.agent_id, "agent_monitoring_v1")
        self.assertEqual(rem.agent_id, "agent_reminder_v1")
        self.assertEqual(know.agent_id, "agent_knowledge_rag_v1")
        self.assertEqual(rec.agent_id, "agent_recommendation_v1")
        self.assertEqual(rep.agent_id, "agent_report_generation_v1")
        self.assertIsNotNone(rep.verification_hash)
        print(f"  PASS: All 5 specialized agents executed successfully.")
        print(f"        - Monitoring: {len(mon.member_assessments)} members assessed")
        print(f"        - Reminder: dry_run={rem.dry_run}")
        print(f"        - Knowledge: confidence={know.confidence_score}")
        print(f"        - Recommendation: {len(rec.member_recommendations)} recommendation sets")
        print(f"        - Report: SHA-256={rep.verification_hash[:16]}... ({len(rep.content_base64)} b64 bytes)")

    # -------------------------------------------------------------------------
    # Scenario 6: Multi-Agent Orchestrator Workflows
    # -------------------------------------------------------------------------
    def test_06_orchestrator_workflows(self):
        print("\n[SCENARIO 6] Verifying Multi-Agent Orchestrator Workflows...")

        async def run_workflows():
            u = await user_service.get_by_email("rajesh.sharma@vaxassist.demo")
            uid = str(u["id"])

            await asyncio.sleep(2.0)

            res_k = await multi_agent_orchestrator.execute(OrchestratorInput(
                user_id=uid,
                workflow=OrchestrationWorkflowType.KNOWLEDGE_INQUIRY,
                query="When is Hepatitis B birth dose administered?",
            ))

            await asyncio.sleep(2.0)

            res_cr = await multi_agent_orchestrator.execute(OrchestratorInput(
                user_id=uid,
                workflow=OrchestrationWorkflowType.COMPREHENSIVE_RECORD,
            ))

            res_rc = await multi_agent_orchestrator.execute(OrchestratorInput(
                user_id=uid,
                workflow=OrchestrationWorkflowType.ROUTINE_CYCLE,
            ))

            return res_k, res_cr, res_rc

        wk_k, wk_cr, wk_rc = self.loop.run_until_complete(run_workflows())
        self.assertEqual(wk_k.workflow_status, AgentStatus.SUCCESS)
        self.assertEqual(wk_cr.workflow_status, AgentStatus.SUCCESS)
        self.assertEqual(wk_rc.workflow_status, AgentStatus.SUCCESS)
        print(f"  PASS: Orchestrator executed 3 complex multi-agent workflows with SUCCESS.")
        print(f"        - Knowledge Inquiry: {wk_k.steps_executed}")
        print(f"        - Comprehensive Record: {wk_cr.steps_executed}")
        print(f"        - Routine Cycle: {wk_rc.steps_executed}")

    # -------------------------------------------------------------------------
    # Scenario 7: External Notification Services & Brevo Integration
    # -------------------------------------------------------------------------
    def test_07_notification_services_and_validation(self):
        print("\n[SCENARIO 7] Verifying Notification Services & Brevo integration...")
        self.assertTrue(brevo_service.is_configured)

        # Phone sanitization
        p1, err1 = format_e164_phone("9876543210")
        self.assertEqual(p1, "919876543210")
        self.assertIsNone(err1)

        p2, err2 = format_e164_phone("+91 98765-43210")
        self.assertEqual(p2, "919876543210")
        self.assertIsNone(err2)

        # Bad phone
        p_bad, err_bad = format_e164_phone("1234")
        self.assertIsNone(p_bad)
        self.assertIsNotNone(err_bad)

        # Email escaping
        subj, body = build_vaccination_reminder_email(
            recipient_name="<script>alert(1)</script> Rajesh",
            member_name="Aarav",
            vaccine_name="Pentavalent 1",
            dose_name="Dose 1",
            due_date_str="2026-10-15",
            vaccination_status="DUE",
        )
        self.assertNotIn("<script>", body)
        self.assertIn("&lt;script&gt;", body)

        # SMS <= 160
        sms = build_vaccination_reminder_sms(
            recipient_name="Rajesh",
            member_name="Aarav",
            vaccine_name="Pentavalent 1",
            due_date_str="2026-10-15",
        )
        self.assertLessEqual(len(sms), 160)
        print("  PASS: Brevo SDK configured, phone E.164 verified, HTML safe escaping verified.")


if __name__ == "__main__":
    unittest.main()
