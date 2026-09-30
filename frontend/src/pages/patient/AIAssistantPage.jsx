import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  CalendarDays,
  BookOpen,
  ShieldCheck,
  FileCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  WifiOff,
  Info,
  X,
  Bot,
  User as UserIcon,
  RefreshCw,
  HelpCircle,
  Copy,
  Check,
  Cpu,
  Layers,
} from 'lucide-react';

// Contexts & APIs
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { knowledgeApi, familyApi, agentApi } from '@/services/api';
import { useOfflineSync } from '@/services/offlineSync';

// UI Primitives
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// React Bits Components
import GhostCursor from '@/components/ui/GhostCursor';
import ThoughtLine from '@/components/ui/ThoughtLine';
import LatticeLoader from '@/components/ui/LatticeLoader';

// Mock baseline data for demo mode
import { INITIAL_FAMILY_MEMBERS } from '@/data/mockFamilyData';
import { DEFAULT_SOURCES_LIBRARY } from '@/data/mockAIData';

/**
 * Normalizes raw LLM markdown artifacts (escaped asterisks, hyphens, broken headers)
 * without corrupting hyphens in vaccine compound names or date strings.
 */
function normalizeMarkdown(text) {
  if (!text) return '';
  let cleaned = text;

  // 1. Unescape escaped asterisks, underscores, and bullet hyphens
  cleaned = cleaned.replace(/\\\*/g, '*');
  cleaned = cleaned.replace(/\\_/g, '_');
  cleaned = cleaned.replace(/(^|\n)\s*\\-\s+/g, '$1- ');
  cleaned = cleaned.replace(/\\-/g, '-');

  // 2. Normalize malformed headings e.g. **### Heading** or ### **Heading**
  cleaned = cleaned.replace(/\*\*\s*(#{1,6}\s+[^*]+?)\s*\*\*/g, '$1');
  cleaned = cleaned.replace(/(#{1,6})\s*\*\*(.+?)\*\*/g, '$1 $2');

  // 3. Normalize advisory markers: e.g. **\*Safe Clinical Advisory:\** -> *Safe Clinical Advisory:*
  cleaned = cleaned.replace(/[*_\\]+\s*(Safe Clinical Advisory:?)\s*[*_\\]+/gi, '*$1*');

  // 4. Normalize broken bullet/bold combos
  cleaned = cleaned.replace(/\*{4,}/g, '**');

  return cleaned;
}

/**
 * Formatted AI response renderer for clean paragraphs, bullet points, and emphasis
 */
function FormattedAIMessage({ content }) {
  if (!content) return null;

  const normalized = normalizeMarkdown(content);
  const lines = normalized.split('\n');

  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-base text-foreground pt-2">
              <BoldHighlight text={trimmed.replace('### ', '')} />
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-lg text-foreground pt-3 border-b border-border/40 pb-1">
              <BoldHighlight text={trimmed.replace('## ', '')} />
            </h3>
          );
        }

        // Sub-bullets / Indented lists
        if (/^\s*[\*\-•]\s/.test(line)) {
          const isSub = /^\s{2,}[\*\-•]\s/.test(line);
          const bulletText = line.replace(/^\s*[\*\-•]\s*/, '');
          return (
            <div key={idx} className={`flex items-start gap-2 ${isSub ? 'pl-6' : 'pl-2'}`}>
              <span className={`rounded-full shrink-0 ${isSub ? 'h-1 w-1 bg-muted-foreground/60 mt-2' : 'h-1.5 w-1.5 bg-primary mt-2'}`} />
              <div className="flex-1 text-foreground/90">
                <BoldHighlight text={bulletText} />
              </div>
            </div>
          );
        }

        // Numbered list item
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2">
              <span className="font-mono text-xs font-bold text-primary shrink-0 mt-0.5">
                {numMatch ? numMatch[1] : '•'}.
              </span>
              <div className="flex-1 text-foreground/90">
                <BoldHighlight text={numMatch ? numMatch[2] : trimmed} />
              </div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-foreground/90">
            <BoldHighlight text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

/**
 * Helper to parse bold (**text**), italics (*text*), and clean up dangling asterisks
 * without modifying hyphens in vaccine compound names (e.g. Measles-Rubella, DPT-HepB-Hib).
 */
function BoldHighlight({ text }) {
  if (!text) return null;

  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
          return (
            <strong key={`b-${bIdx}`} className="font-semibold text-foreground">
              {bPart.slice(2, -2)}
            </strong>
          );
        }

        // Handle single-asterisk italics e.g. *Safe Clinical Advisory:*
        const italicParts = bPart.split(/(?<!\*)\*([^*]+)\*(?!\*)/g);
        return (
          <span key={`nb-${bIdx}`}>
            {italicParts.map((iPart, iIdx) => {
              if (iIdx % 2 === 1) {
                return (
                  <em key={`i-${bIdx}-${iIdx}`} className="italic text-foreground/90">
                    {iPart}
                  </em>
                );
              }
              // Clean up dangling unclosed asterisks if any
              const clean = iPart.replace(/^\s*\*\s*|\s*\*\s*$/g, ' ');
              return clean;
            })}
          </span>
        );
      })}
    </>
  );
}

export default function AIAssistantPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemoMode, demoStore } = useDemoMode();
  const { isOnline } = useOfflineSync();

  // Family Members & Context
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('ALL');

  // Conversation State
  const [exchanges, setExchanges] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState('Reviewing records');
  const [offlineNotice, setOfflineNotice] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Expanded sections state per message (sources & technical details)
  const [expandedSources, setExpandedSources] = useState({});
  const [expandedDetails, setExpandedDetails] = useState({});

  // Citation Inspector Modal
  const [selectedSource, setSelectedSource] = useState(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  // Load real members in Live Mode, fallback to demo members in Demo Mode
  useEffect(() => {
    let mounted = true;
    if (isDemoMode) {
      setFamilyMembers(INITIAL_FAMILY_MEMBERS);
      return;
    }

    familyApi
      .getMembers()
      .then((res) => {
        if (mounted && res?.data && res.data.length > 0) {
          const mapped = res.data.map((m) => ({
            id: m.id,
            name: m.full_name,
            relationship: m.relationship,
            age: m.date_of_birth
              ? `${Math.max(0, new Date().getFullYear() - new Date(m.date_of_birth).getFullYear())} yrs`
              : '',
          }));
          setFamilyMembers(mapped);
        } else if (mounted) {
          setFamilyMembers([]);
        }
      })
      .catch((err) => {
        console.warn('Notice loading family members in AI Assistant:', err);
      });

    return () => {
      mounted = false;
    };
  }, [isDemoMode]);

  const displayMembers = useMemo(() => {
    if (isDemoMode) return demoStore?.familyMembers || INITIAL_FAMILY_MEMBERS;
    return familyMembers;
  }, [isDemoMode, demoStore?.familyMembers, familyMembers]);

  const activeMember = useMemo(() => {
    if (selectedMemberId === 'ALL') {
      return {
        id: 'ALL',
        name: 'Entire Family',
        relationship: 'Household',
      };
    }
    const found = displayMembers?.find((m) => m.id === selectedMemberId);
    return found || { id: selectedMemberId, name: 'Family Member', relationship: 'Dependent' };
  }, [selectedMemberId, displayMembers]);

  // Auto-scroll when messages change or while thinking
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (exchanges.length > 0 || isThinking) {
      scrollToBottom();
    }
  }, [exchanges, isThinking, scrollToBottom]);

  // Handle prefilled query passed via route state
  useEffect(() => {
    if (location.state?.prefilledQuery) {
      handleSendPrompt(location.state.prefilledQuery);
    }
  }, [location.state]);

  // Auto-resize textarea
  const handleTextareaInput = (e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Keyboard Enter to send, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  // Toggle expandable sections
  const toggleSourceExpand = (id) => {
    setExpandedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDetailExpand = (id) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy text to clipboard
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Start fresh conversation (returns to clean empty state with GhostCursor)
  const handleNewChat = () => {
    setExchanges([]);
    setInputText('');
    setIsThinking(false);
    setOfflineNotice(null);
  };

  // Inspect source citation in modal
  const handleOpenSourceModal = (source) => {
    setSelectedSource(source);
    setIsSourceModalOpen(true);
  };

  // ==========================================
  // DISPATCH AI QUERY WORKFLOW
  // ==========================================
  const handleSendPrompt = async (explicitPrompt) => {
    const query = (explicitPrompt || inputText).trim();
    if (!query) return;

    if (!isOnline && !isDemoMode) {
      setOfflineNotice(
        'Clinical AI Consultation requires an active internet connection to query ChromaDB and Google Gemini. Your query has been preserved.'
      );
      return;
    }

    setOfflineNotice(null);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message
    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: 'user',
      query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipient: activeMember.name,
      relationship: activeMember.relationship,
    };

    setExchanges((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setThinkingStage('Reviewing clinical context');

    // Multi-stage thinking feedback
    const stage1 = setTimeout(() => {
      setThinkingStage('Querying ChromaDB vector knowledge library');
    }, 450);

    const stage2 = setTimeout(() => {
      setThinkingStage('Synthesizing grounded response with Google Gemini');
    }, 950);

    const startTime = performance.now();

    // Determine query intent
    const qLower = query.toLowerCase();
    const isScheduleQuery = /schedule|upcoming|overdue|due|next|when is|timeline|milestone/i.test(qLower);
    const isRecordsQuery = /record|history|completed|dose|missing|catch.?up/i.test(qLower);
    const isReportQuery = /report|passport|certificate|summary document|cert/i.test(qLower);

    try {
      // 1. DEMO MODE SIMULATION
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1100));
        clearTimeout(stage1);
        clearTimeout(stage2);

        let answer = '';
        let sources = DEFAULT_SOURCES_LIBRARY.slice(0, 2);
        let workflowName = 'Clinical Advisory Simulation';

        if (isScheduleQuery) {
          workflowName = 'Routine Milestone Evaluation';
          if (activeMember.id === 'fam-1' || activeMember.name?.includes('Aarav')) {
            answer = `Based on the Universal Immunization Programme (UIP) schedule for **Aarav Sharma** (Age 6 years):\n\n` +
              `* **DPT Booster 2 (Age 5-6 Years):** Currently **Overdue** (was due on 10 Jul 2026). Catch-up administration is recommended immediately without restarting earlier infant doses.\n` +
              `* **Upcoming Adolescence Boosters:** Td at age 10 years (July 2030) and Td at age 16 years (July 2036).\n\n` +
              `You can schedule catch-up immunization at Lilavati Hospital or your nearest Primary Health Center.`;
          } else if (activeMember.id === 'fam-2' || activeMember.name?.includes('Ananya')) {
            answer = `Based on the Universal Immunization Programme (UIP) schedule for **Ananya Sharma** (Age 15 weeks):\n\n` +
              `* **Pentavalent 3, OPV 3 & Rotavirus 3:** Currently **Overdue** (was due at 14 weeks on 18 Sep 2026). Co-administration of all three vaccines is safe and recommended under UIP.\n` +
              `* **Next Routine Milestone:** Measles-Rubella (MR - Dose 1) & Vitamin A at 9-12 months (March 2027).\n\n` +
              `Recommended to visit Bandra Urban Primary Health Center to complete her 14-week primary infant series.`;
          } else if (activeMember.id === 'fam-4' || activeMember.name?.includes('Rajesh')) {
            answer = `Immunization overview for **Rajesh Sharma** (Adult, Age 35 years):\n\n` +
              `* **Annual Influenza (Quadrivalent):** Recommended ahead of the winter respiratory peak (due 15 Nov 2026).\n` +
              `* **Tetanus-Diphtheria (Td):** Routine decennial booster completed; next interval review due in 2031.`;
          } else if (activeMember.id === 'fam-3' || activeMember.name?.includes('Pooja')) {
            answer = `Immunization overview for **Pooja Sharma** (Adult, Age 32 years):\n\n` +
              `* **Routine Status:** All childhood and adult primary immunizations are completely up to date.\n` +
              `* **Next Scheduled Booster:** Tetanus-Diphtheria (Td) Decennial Booster due on 20 Aug 2028.`;
          } else {
            answer = `Based on the Universal Immunization Programme (UIP) schedule, here is your household immunization milestone summary:\n\n` +
              `* **Aarav Sharma (Son, 6 yrs):** DPT Booster 2 (Age 5-6 Years) is overdue by 2 months. Immediate catch-up recommended.\n` +
              `* **Ananya Sharma (Daughter, 15 wks):** 14-week primary combination milestone (Pentavalent 3, OPV 3, Rota 3) is overdue. Co-administration recommended.\n` +
              `* **Rajesh Sharma (Father, 35 yrs):** Annual Seasonal Influenza shot due 15 Nov 2026.\n` +
              `* **Pooja Sharma (Mother, 32 yrs):** All routine doses current; decennial Td booster due in Aug 2028.\n\n` +
              `Ensure records are updated with your healthcare worker or clinic after administration.`;
          }
        } else if (isRecordsQuery) {
          workflowName = 'Clinical Record Audit';
          if (activeMember.id === 'fam-1' || activeMember.name?.includes('Aarav')) {
            answer = `Immunization coverage review for **Aarav Sharma**:\n\n` +
              `* **Completed Doses:** 9 doses verified (BCG, HepB-0, OPV-0, Pentavalent 1-3, MR 1-2, DPT Booster 1).\n` +
              `* **Coverage Progress:** 90% compliance with UIP guidelines.\n` +
              `* **Action Required:** 1 overdue catch-up booster (DPT Booster 2).`;
          } else if (activeMember.id === 'fam-2' || activeMember.name?.includes('Ananya')) {
            answer = `Immunization coverage review for **Ananya Sharma**:\n\n` +
              `* **Completed Doses:** 9 primary doses verified (BCG, HepB-0, OPV 0-2, Rota 1-2, Pentavalent 1-2).\n` +
              `* **Coverage Progress:** 64% completed towards infant schedule.\n` +
              `* **Action Required:** 3 overdue 14-week doses (Pentavalent 3, OPV 3, Rotavirus 3).`;
          } else {
            answer = `Immunization coverage review for ${activeMember.name}:\n\n` +
              `* **Completed Doses:** 34 total verified household immunizations recorded.\n` +
              `* **Coverage Index:** Aligned with National Immunization Schedule guidelines.\n` +
              `* **Pending Actions:** 2 pediatric milestones requiring clinic visits (Aarav DPT-B2, Ananya 14-wk series).`;
          }
        } else if (isReportQuery) {
          workflowName = 'Official Report Generation Agent';
          answer = `Official Immunization Record compiled for ${activeMember.name}.\n\n` +
            `* **Document:** Verified Comprehensive Vaccination History\n` +
            `* **Cryptographic Seal:** SHA-256 verified digital audit seal attached\n` +
            `* **Status:** Ready for download from the Reports tab.`;
        } else {
          workflowName = 'Grounded Guideline Inquiry';
          answer = `According to official MoHFW and WHO immunization guidelines for India:\n\n` +
            `The Universal Immunization Programme (UIP) protects against 12 life-threatening diseases including Tuberculosis, Diphtheria, Pertussis, Tetanus, Polio, Hepatitis B, Pneumonia & Meningitis caused by Haemophilus influenzae b, Measles, Rubella, Japanese Encephalitis, and Rotavirus.\n\n` +
            `Timely administration according to the national schedule ensures optimal antibody formation and long-lasting protection.`;
        }

        const elapsed = Math.round(performance.now() - startTime);
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          answer,
          sources,
          workflow: workflowName,
          model: 'Gemini 2.0 Flash (Demo Mode)',
          elapsedMs: elapsed,
          correlationId: `demo_${Date.now()}`,
          grounded: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setExchanges((prev) => [...prev, aiMsg]);
        setIsThinking(false);
        return;
      }

      // 2. LIVE MODE: CHOOSE ORCHESTRATOR TASK ROUTING VS KNOWLEDGE RAG
      if (isScheduleQuery || isRecordsQuery || isReportQuery) {
        let taskIntent = 'routine';
        if (isRecordsQuery) taskIntent = 'advisory';
        if (isReportQuery) taskIntent = 'report';

        const orchResp = await agentApi.routeTask({
          task_intent: taskIntent,
          query,
          family_member_id: selectedMemberId !== 'ALL' ? selectedMemberId : undefined,
          dry_run: true,
        });

        clearTimeout(stage1);
        clearTimeout(stage2);

        if (orchResp?.data) {
          const orch = orchResp.data;
          const answer = orch.natural_answer || orch.knowledge?.answer || orch.summary || 'Workflow executed successfully across specialized clinical agents.';
          let sources = (orch.knowledge?.sources || []).map((s, idx) => ({
            id: `src-orch-${idx}`,
            title: s.document_title || 'National Immunization Guideline',
            authority: s.source_authority || 'MoHFW / WHO',
            page: s.page_number ? `Page ${s.page_number}` : 'Official Guideline',
            excerpt: s.excerpt || 'Verified clinical guideline context.',
            url: s.source_url || '#',
          }));

          // Merge verified citations from recommendation pathways if knowledge sources are empty
          if (sources.length === 0 && orch.recommendation?.member_recommendations) {
            orch.recommendation.member_recommendations.forEach((mr) => {
              (mr.recommendations || []).forEach((rec) => {
                (rec.supporting_citations || []).forEach((sc, scIdx) => {
                  if (!sources.some((existing) => existing.title === sc.document_title)) {
                    sources.push({
                      id: `src-rec-${scIdx}`,
                      title: sc.document_title || 'National Immunization Schedule (NIS)',
                      authority: sc.source_authority || 'MoHFW',
                      page: sc.page_number ? `Page ${sc.page_number}` : 'Universal Immunization Programme',
                      excerpt: sc.excerpt || rec.clinical_rationale || rec.description,
                      url: sc.source_url || '#',
                    });
                  }
                });
              });
            });
          }

          const elapsed = Math.round(performance.now() - startTime);
          const aiMsg = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            answer,
            sources,
            workflow: `Orchestrator: ${orch.workflow}`,
            model: orch.knowledge?.model_used || 'Gemini 2.0 Flash',
            elapsedMs: elapsed,
            correlationId: orch.correlation_id || `orch_${Date.now()}`,
            grounded: orch.knowledge?.has_sufficient_context ?? true,
            steps: orch.steps_executed || [],
            telemetrySummary: orch.execution_telemetry_summary || null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setExchanges((prev) => [...prev, aiMsg]);
          setIsThinking(false);
          return;
        }
      }

      // 3. LIVE MODE: KNOWLEDGE / RAG AGENT VIA CHROMA & GEMINI
      const ragResp = await knowledgeApi.queryKnowledgeBase({ question: query });
      clearTimeout(stage1);
      clearTimeout(stage2);

      if (ragResp?.data) {
        const rag = ragResp.data;
        const sources = (rag.sources || []).map((s, idx) => ({
          id: `src-${idx}`,
          title: s.document_title || 'MoHFW National Immunization Guideline',
          authority: s.source_authority || 'Health Authority',
          page: s.page_number ? `Page ${s.page_number}` : 'Official Guideline',
          url: s.source_url || '#',
          excerpt: rag.retrieved_chunks?.[idx]?.content || 'Verified official immunization evidence.',
        }));

        const elapsed = Math.round(performance.now() - startTime);
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          answer: rag.answer,
          sources,
          workflow: 'Knowledge / RAG Agent',
          model: rag.metadata?.model_used || 'Gemini 2.0 Flash',
          elapsedMs: elapsed,
          correlationId: `rag_${Date.now()}`,
          grounded: rag.metadata?.grounded ?? true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setExchanges((prev) => [...prev, aiMsg]);
        setIsThinking(false);
      }
    } catch (err) {
      clearTimeout(stage1);
      clearTimeout(stage2);
      console.error('AI Assistant invocation error:', err);

      const errorMsg = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        isError: true,
        answer: `I encountered an issue retrieving that information: ${err.message || 'The clinical knowledge service is temporarily unavailable.'}. Please try asking again or consult your healthcare provider.`,
        sources: [],
        workflow: 'Error Boundary',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setExchanges((prev) => [...prev, errorMsg]);
      setIsThinking(false);
    }
  };

  const isConversationEmpty = exchanges.length === 0 && !isThinking;

  // Suggested quick prompts (matching reference image pill tags)
  const quickPills = [
    { label: "When is the next MMR booster due?", query: "When is the next MMR booster due for children under UIP?" },
    { label: "What are common side effects of Pentavalent?", query: "What are the common mild side effects of the Pentavalent vaccine?" },
    { label: "Difference between OPV and IPV?", query: "What is the difference between Oral Polio Vaccine (OPV) and Inactivated Polio Vaccine (IPV)?" },
    { label: "How to catch up on missed doses?", query: "How does the catch-up immunization pathway work for delayed vaccines in India?" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-8.5rem)] flex flex-col justify-between">
      {/* ==============================================================
          1. GHOST CURSOR EFFECT (EMPTY STATE ONLY)
          Restricted strictly to when the conversation is empty.
          Never blocks typing, clicking, or navigation (pointer-events-none).
         ============================================================== */}
      {isConversationEmpty && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-60 dark:opacity-40">
          <GhostCursor
            color="#3b82f6"
            brightness={1.6}
            edgeIntensity={0.15}
            trailLength={45}
            inertia={0.5}
            grainIntensity={0.03}
            bloomStrength={0.12}
            bloomRadius={1.0}
            bloomThreshold={0.03}
            fadeDelayMs={800}
            fadeDurationMs={1200}
            zIndex={0}
          />
        </div>
      )}

      {/* ==============================================================
          2. TOP BAR & WORKSPACE CONTROLS
         ============================================================== */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-foreground tracking-tight">
                VaxAssist AI Assistant
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] font-medium py-0.5 px-2 gap-1.5 ${
                  isDemoMode
                    ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                    : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span>{isDemoMode ? 'Demo Mode' : 'Live Grounded RAG'}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Grounded in official National Immunization Guidelines (UIP & WHO)
            </p>
          </div>
        </div>

        {/* Top Controls: Family Context & Reset */}
        <div className="flex items-center gap-2">
          {displayMembers.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-border/80 bg-card text-xs">
              <span className="text-muted-foreground font-medium hidden sm:inline">Context:</span>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="h-7 text-xs font-semibold border-0 bg-transparent focus:ring-0 px-1 gap-1">
                  <SelectValue placeholder="All Family" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="ALL">Entire Family</SelectItem>
                  {displayMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} {m.relationship ? `(${m.relationship})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {exchanges.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/80 hover:bg-primary/5 hover:text-primary transition-colors"
              title="Reset conversation and start fresh"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          )}
        </div>
      </header>

      {/* Offline Alert Notice */}
      {(!isOnline || offlineNotice) && (
        <div className="relative z-10 mt-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{offlineNotice || 'Internet offline. You can view previous messages, but new queries require an active connection.'}</span>
        </div>
      )}

      {/* ==============================================================
          3. MAIN CONTENT: EMPTY SCREEN VS CONVERSATION STREAM
         ============================================================== */}
      <main className="relative z-10 flex-1 flex flex-col justify-center py-6">
        {/* -----------------------------------------------------------
            A. EMPTY CONVERSATION STATE (INSPIRED BY REFERENCE IMAGE)
           ----------------------------------------------------------- */}
        {isConversationEmpty ? (
          <div className="max-w-4xl mx-auto w-full flex flex-col items-center justify-center text-center space-y-8 py-4 sm:py-8">
            {/* Centered Welcome Title & Subtitle */}
            <div className="space-y-3 max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-sans">
                Welcome back, <span className="text-primary">{userName}</span>.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                How can I help with your vaccination care today? Track upcoming schedules, review records, verify national guidelines, and generate certified reports.
              </p>
            </div>

            {/* Quick Action Suggestion Cards (4 Columns matching reference style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full px-2">
              {/* Card 1: Vaccination Schedule */}
              <button
                type="button"
                onClick={() => handleSendPrompt("What are the upcoming and overdue vaccinations for my family?")}
                className="group p-4 rounded-2xl border border-border/80 bg-card/70 hover:bg-card hover:border-primary/50 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    Vaccination Schedule
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Check upcoming UIP milestones, due dates & overdue alerts.
                  </p>
                </div>
              </button>

              {/* Card 2: Vaccine Information */}
              <button
                type="button"
                onClick={() => handleSendPrompt("What are the essential vaccines in India's Universal Immunization Programme and their schedules?")}
                className="group p-4 rounded-2xl border border-border/80 bg-card/70 hover:bg-card hover:border-primary/50 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    Vaccine Information
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Ask about safety, efficacy, and official MoHFW/WHO guidelines.
                  </p>
                </div>
              </button>

              {/* Card 3: My Vaccination Records */}
              <button
                type="button"
                onClick={() => handleSendPrompt("Review my family vaccination records and identify any missing doses.")}
                className="group p-4 rounded-2xl border border-border/80 bg-card/70 hover:bg-card hover:border-primary/50 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    My Vaccination Records
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Review completed doses, coverage progress & catch-up advice.
                  </p>
                </div>
              </button>

              {/* Card 4: Generate Report */}
              <button
                type="button"
                onClick={() => handleSendPrompt("Generate a comprehensive immunization report for my records.")}
                className="group p-4 rounded-2xl border border-border/80 bg-card/70 hover:bg-card hover:border-primary/50 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    Generate Report
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Compile a verifiable immunization certificate or digital record.
                  </p>
                </div>
              </button>
            </div>

            {/* Subtle Center AI Connector Badge */}
            <div className="flex items-center justify-center pt-2">
              <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            {/* Prominent Center Chat Input Container (Matching Reference Design) */}
            <div className="w-full max-w-3xl px-2">
              <div className="rounded-2xl border border-border/90 bg-card/90 dark:bg-card/70 backdrop-blur-xl shadow-xl ring-1 ring-primary/10 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all p-3 sm:p-4 text-left">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask anything about vaccinations, schedules, or guidelines for ${activeMember.name}...`}
                  rows={2}
                  className="w-full bg-transparent resize-none border-0 p-1 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[11px] font-normal py-0.5 px-2 bg-secondary/80 text-muted-foreground">
                      Answering for: <strong className="text-foreground ml-1">{activeMember.name}</strong>
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSendPrompt()}
                    disabled={!inputText.trim() || isThinking}
                    className="gap-2 h-9 px-4 rounded-xl font-semibold shadow-xs transition-all active:scale-95"
                  >
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Quick Prompt Pill Tags (Below Input) */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                {quickPills.map((pill, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendPrompt(pill.query)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/80 bg-card/60 hover:bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all duration-150 shadow-2xs"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* -----------------------------------------------------------
             B. ACTIVE CONVERSATION STREAM
             ----------------------------------------------------------- */
          <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
            {exchanges.map((exchange) => {
              if (exchange.sender === 'user') {
                return (
                  <div key={exchange.id} className="flex justify-end gap-3 pl-8">
                    <div className="max-w-2xl rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/20 p-4 text-foreground shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-primary">You</span>
                        <span>{exchange.timestamp}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {exchange.query}
                      </p>
                      {exchange.recipient && (
                        <div className="text-[10px] text-muted-foreground pt-1 border-t border-primary/10">
                          Target Context: {exchange.recipient} ({exchange.relationship})
                        </div>
                      )}
                    </div>
                    <Avatar className="h-8 w-8 shrink-0 border border-primary/20 bg-primary/20 text-primary text-xs font-bold mt-1">
                      <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                );
              }

              // AI Message
              return (
                <div key={exchange.id} className="flex items-start gap-3 pr-4 sm:pr-8 animate-in fade-in duration-200">
                  <Avatar className="h-8 w-8 shrink-0 border border-primary/30 bg-primary/10 text-primary text-xs font-bold mt-1 shadow-xs">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 max-w-3xl space-y-3">
                    <Card className={`border shadow-2xs overflow-hidden ${exchange.isError ? 'border-destructive/40 bg-destructive/5' : 'border-border/80 bg-card'}`}>
                      <CardHeader className="py-2.5 px-4 bg-muted/20 border-b border-border/60 flex flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">VaxAssist Clinical AI</span>
                          {exchange.workflow && (
                            <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 text-muted-foreground">
                              {exchange.workflow}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-[11px]">{exchange.timestamp}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(exchange.id, exchange.answer)}
                            className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                            title="Copy response"
                          >
                            {copiedId === exchange.id ? (
                              <Check className="h-3.5 w-3.5 text-status-completed" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-5 space-y-4">
                        {/* Formatted Answer Body */}
                        <FormattedAIMessage content={exchange.answer} />

                        {/* ==============================================================
                            EXPANDABLE SECTION: SOURCES & CITATIONS (RAG)
                           ============================================================== */}
                        {exchange.sources && exchange.sources.length > 0 && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => toggleSourceExpand(exchange.id)}
                              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-3.5 w-3.5 text-primary" />
                                <span>Verified Sources & Citations ({exchange.sources.length})</span>
                              </div>
                              {expandedSources[exchange.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>

                            {expandedSources[exchange.id] && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-1 animate-in fade-in duration-200">
                                {exchange.sources.map((src, sIdx) => (
                                  <div
                                    key={sIdx}
                                    onClick={() => handleOpenSourceModal(src)}
                                    className="p-2.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:bg-primary/[0.02] cursor-pointer transition-all flex items-start gap-2.5 group"
                                  >
                                    <div className="p-1 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                                      <FileText className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                        {src.title}
                                      </p>
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-0.5">
                                        <span>{src.authority}</span>
                                        {src.page && <span>• {src.page}</span>}
                                      </div>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ==============================================================
                            EXPANDABLE SECTION: AI PROCESSING & AGENT TELEMETRY
                           ============================================================== */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => toggleDetailExpand(exchange.id)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>AI Processing & Agent Telemetry</span>
                            </div>
                            {expandedDetails[exchange.id] ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {expandedDetails[exchange.id] && (
                            <div className="mt-2 p-3 rounded-xl border border-border/60 bg-muted/20 text-xs font-mono space-y-1.5 animate-in fade-in duration-200">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Model:</span>
                                <span className="text-foreground">{exchange.model || 'Gemini 2.0 Flash'}</span>
                              </div>
                              {exchange.elapsedMs && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Latency:</span>
                                  <span className="text-foreground">{exchange.elapsedMs} ms</span>
                                </div>
                              )}
                              {exchange.correlationId && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Trace ID:</span>
                                  <span className="text-foreground truncate max-w-[200px]">{exchange.correlationId}</span>
                                </div>
                              )}
                              {exchange.steps && exchange.steps.length > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Chained Steps:</span>
                                  <span className="text-primary">{exchange.steps.join(' → ')}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Grounded RAG:</span>
                                <span className={exchange.grounded ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                                  {exchange.grounded ? 'Verified official sources' : 'General immunization advisory'}
                                </span>
                              </div>
                              {exchange.telemetrySummary && (
                                <div className="pt-2 mt-1 border-t border-border/40 text-[11px] text-muted-foreground leading-relaxed">
                                  <span className="text-foreground font-semibold">Workflow Telemetry: </span>
                                  <span>{exchange.telemetrySummary}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Mandatory Clinical Disclaimer */}
                        <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground/80 flex items-start gap-2">
                          <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                          <span>
                            Grounded in official National Immunization Guidelines (UIP, WHO). For informational reference; always consult your pediatrician before clinical decisions.
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}

            {/* Thinking / Reasoning Bubble */}
            {isThinking && (
              <div className="flex items-start gap-3 animate-in fade-in duration-200">
                <Avatar className="h-8 w-8 border border-primary/30 bg-primary/10 text-primary text-xs font-bold mt-1">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="p-3.5 rounded-2xl rounded-tl-sm border border-primary/20 bg-card shadow-xs max-w-md">
                  <LatticeLoader
                    label={`${thinkingStage}...`}
                    pattern="orbit"
                    color="#3b82f6"
                    cellSize={6}
                    gap={2.5}
                    fontSize={13}
                    showTimer={true}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ==============================================================
          4. FLOATING BOTTOM CHAT BAR (WHEN CONVERSATION IS ACTIVE)
         ============================================================== */}
      {!isConversationEmpty && (
        <div className="sticky bottom-0 z-20 pt-2 pb-4 bg-linear-to-t from-background via-background to-transparent">
          <div className="max-w-3xl mx-auto px-2">
            <div className="rounded-2xl border border-border/90 bg-card/95 dark:bg-card/85 backdrop-blur-xl shadow-xl ring-1 ring-primary/10 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all p-2.5 sm:p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask a follow-up about vaccination for ${activeMember.name}...`}
                  rows={1}
                  className="flex-1 bg-transparent resize-none border-0 p-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 leading-relaxed max-h-32"
                />

                <Button
                  size="sm"
                  onClick={() => handleSendPrompt()}
                  disabled={!inputText.trim() || isThinking}
                  className="h-9 px-3.5 rounded-xl font-semibold shadow-xs shrink-0 transition-all active:scale-95"
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 px-1 border-t border-border/40 mt-1.5">
                <span>Answering for: <strong className="text-foreground">{activeMember.name}</strong></span>
                <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          5. SOURCE CITATION DETAIL MODAL
         ============================================================== */}
      <Dialog open={isSourceModalOpen} onOpenChange={setIsSourceModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Verified Clinical Source Document</span>
            </DialogTitle>
            <DialogDescription>
              Retrieved from the VaxAssist AI ChromaDB vector knowledge base.
            </DialogDescription>
          </DialogHeader>

          {selectedSource && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 space-y-1.5">
                <h4 className="font-bold text-sm text-foreground">
                  {selectedSource.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {selectedSource.authority}
                  </Badge>
                  {selectedSource.page && <span>• {selectedSource.page}</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Extracted Evidence Chunk
                </span>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs text-foreground/90 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedSource.excerpt}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
