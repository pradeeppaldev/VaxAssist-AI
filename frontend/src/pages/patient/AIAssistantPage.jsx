import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Plus,
  Trash2,
  Layers,
  Search,
  Check,
  X,
  ExternalLink,
  HelpCircle,
  Database,
  FileCheck,
  MessageSquare,
  Users,
  RotateCcw,
  FileText,
  Syringe,
  Info,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
  MapPin,
} from 'lucide-react';

// Reliable Design System & Healthcare Primitives
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';

// Standard shadcn UI Primitives
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// Centralized Mock Data
import { INITIAL_FAMILY_MEMBERS } from '@/data/mockFamilyData';
import {
  CATEGORIZED_EXPLORATION_PROMPTS,
  DEFAULT_SOURCES_LIBRARY,
  INITIAL_CONVERSATION_HISTORY,
  STRUCTURED_DEMO_EXCHANGES,
} from '@/data/mockAIData';

/**
 * Self-contained AI Header component (no external dependency)
 */
function AIHeaderSection({ title, description, badge = "Clinical Intelligence Workspace" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1 font-mono text-[10px] tracking-wide uppercase px-2 py-0.5">
          <Sparkles className="h-3 w-3 text-primary animate-pulse" />
          <span>{badge}</span>
        </Badge>
      </div>
      <h2 className="font-sora text-xl sm:text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Self-contained Source Citation Chip (no external dependency)
 */
function SourceCitationChip({ title, source, page, confidence, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/90 p-2.5 text-xs transition-colors hover:border-primary/50 hover:bg-primary/[0.02] cursor-pointer group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-1 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
          <FileText className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 truncate">
          <div className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{title}</div>
          <div className="text-[10px] text-muted-foreground truncate">{source} {page ? `• ${page}` : ''}</div>
        </div>
      </div>
      {confidence && (
        <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
          {confidence}% Match
        </Badge>
      )}
    </div>
  );
}

export default function AIAssistantPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Selected Member Context
  const [selectedMemberId, setSelectedMemberId] = useState('fam-1'); // Default: Aarav Pal

  // Conversation Exchanges state
  const [exchanges, setExchanges] = useState(STRUCTURED_DEMO_EXCHANGES);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState('Reviewing records'); // Multi-stage clinical reasoning

  // View state switcher: 'normal' | 'thinking' | 'empty' | 'error'
  const [viewState, setViewState] = useState('normal');

  // Source Inspector Modal State
  const [selectedSource, setSelectedSource] = useState(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Mobile Drawer State
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Active family member with safe fallback
  const activeMember = useMemo(() => {
    if (selectedMemberId === 'ALL') {
      return {
        id: 'ALL',
        name: 'Entire Family',
        relationship: 'Household Overview',
        age: '4 Members',
        progress: 82,
        completedDoses: 28,
        totalDoses: 34,
        bloodGroup: 'All Types',
        needsAttention: true,
        attentionReason: '2 immediate doses require attention (1 overdue, 1 due soon)',
        nextVaccine: {
          name: 'Measles-Rubella (MR - Dose 1)',
          dueDate: '12 October 2026',
          status: 'OVERDUE',
          relative: '12 days overdue',
        },
      };
    }
    const found = INITIAL_FAMILY_MEMBERS?.find((m) => m.id === selectedMemberId);
    return found || (INITIAL_FAMILY_MEMBERS && INITIAL_FAMILY_MEMBERS[0]) || {
      id: 'fam-1',
      name: 'Aarav Pal',
      relationship: 'Son',
      age: '8 yrs',
      progress: 75,
      completedDoses: 15,
      totalDoses: 20,
      nextVaccine: {
        name: 'Measles-Rubella (MR - Dose 1)',
        dueDate: '12 October 2026',
        status: 'OVERDUE',
        relative: '12 days overdue',
      },
    };
  }, [selectedMemberId]);

  // Messages end ref for auto-scrolling
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (exchanges.length > 0) {
      scrollToBottom();
    }
  }, [exchanges, isThinking]);

  // Handle prefilled query passed via route state
  useEffect(() => {
    if (location.state?.prefilledQuery) {
      handleSendPrompt(location.state.prefilledQuery);
    }
  }, [location.state]);

  // Handle Query Submission
  const handleSendPrompt = (promptText) => {
    const query = (promptText || inputText).trim();
    if (!query) return;

    setInputText('');
    setIsThinking(true);
    setThinkingStage('Reviewing family records');

    // Simulate multi-stage clinical RAG pipeline
    setTimeout(() => {
      setThinkingStage('Checking UIP & WHO guideline library');
    }, 600);

    setTimeout(() => {
      setThinkingStage('Structuring clinical guidance response');
    }, 1200);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let exchangeData = null;

      if (lower.includes('history') || lower.includes('records') || lower.includes('bcg') || lower.includes('pentavalent')) {
        exchangeData = {
          id: `ex-${Date.now()}`,
          query,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recipient: activeMember.name,
          relation: activeMember.relationship,
          title: `Vaccination History Summary: ${activeMember.name}`,
          milestone: {
            vaccine: activeMember.nextVaccine?.name || 'Immunization Record',
            dose: `${activeMember.completedDoses || 15} of ${activeMember.totalDoses || 20} Doses Completed`,
            date: 'Official Registry Verified',
            status: activeMember.needsAttention ? 'OVERDUE' : 'COMPLETED',
            countdown: `${activeMember.progress || 75}% Coverage Achieved`,
            clinic: activeMember.primaryClinic || 'Community Health Center',
          },
          whyItMatters:
            'A complete chronological vaccination record proves immunity against endemic infectious pathogens, validates school entry compliance, and prevents redundant re-vaccination.',
          clinicalPoints: [
            `Primary infant series (BCG, Hepatitis B, OPV, Pentavalent 1-3) successfully completed.`,
            `Verified digital entries confirmed by attending pediatricians under Universal Immunization Programme (UIP).`,
            `Official SHA-256 signed immunization certificates are available for export under the Vaccinations tab.`,
          ],
          sources: [DEFAULT_SOURCES_LIBRARY[0]],
          primaryAction: {
            label: 'View Detailed History Ledger',
            href: '/vaccinations',
          },
          secondaryAction: {
            label: 'Download Family Report',
            href: '/reports',
          },
        };
      } else if (lower.includes('attention') || lower.includes('which family') || lower.includes('priority')) {
        exchangeData = {
          id: `ex-${Date.now()}`,
          query,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recipient: 'Entire Family',
          relation: 'Household Review',
          title: 'Family Vaccination Priority Status',
          milestone: {
            vaccine: 'Aarav (MR-1 Overdue) & Anaya (DPT Booster Due)',
            dose: '2 Actions Required',
            date: 'Immediate Attention',
            status: 'OVERDUE',
            countdown: '1 overdue, 1 due soon',
            clinic: 'Primary Health Center North & City Child Clinic',
          },
          whyItMatters:
            'Maintaining on-schedule immunization across the entire household prevents immunity debt and provides strong herd protection for younger siblings.',
          clinicalPoints: [
            'Aarav Pal (8 yrs): Measles-Rubella booster is 12 days overdue. Immediate catch-up session advised.',
            'Anaya Pal (4 yrs): DPT Booster 1 appointment confirmed for October 29 at 10:30 AM.',
            'Meera & Raj Pal: Adult schedules up to date; annual influenza season begins November 1.',
          ],
          sources: [DEFAULT_SOURCES_LIBRARY[0], DEFAULT_SOURCES_LIBRARY[1]],
          primaryAction: {
            label: 'Open Vaccination Schedule',
            href: '/schedule',
          },
          secondaryAction: {
            label: 'Manage Family Reminders',
            href: '/reminders',
          },
        };
      } else {
        // Default structured response
        exchangeData = {
          id: `ex-${Date.now()}`,
          query,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recipient: activeMember.name,
          relation: activeMember.relationship,
          title: `Vaccination Guidance: ${activeMember.name}`,
          milestone: {
            vaccine: activeMember.nextVaccine?.name || 'Routine Milestone',
            dose: 'National UIP Schedule',
            date: activeMember.nextVaccine?.dueDate || 'Upcoming',
            status: activeMember.nextVaccine?.status || 'UPCOMING',
            countdown: activeMember.nextVaccine?.relative || 'On Schedule',
            clinic: activeMember.primaryClinic || 'Primary Health Center',
          },
          whyItMatters:
            'Timely vaccination adheres to age-stratified immunologic windows, sustaining antibody titers before community exposure.',
          clinicalPoints: [
            'Guidance aligned with the Indian National Immunization Schedule (NIS) and WHO standards.',
            'Inactivated and routine pediatric immunizations can be safely co-administered at separate anatomical sites.',
            'Consult with your healthcare practitioner before any modified schedule adjustments.',
          ],
          sources: [DEFAULT_SOURCES_LIBRARY[0], DEFAULT_SOURCES_LIBRARY[3] || DEFAULT_SOURCES_LIBRARY[0]],
          primaryAction: {
            label: 'View in Schedule',
            href: '/schedule',
          },
          secondaryAction: {
            label: 'View Family Records',
            href: '/vaccinations',
          },
        };
      }

      setExchanges((prev) => [...prev, exchangeData]);
      setIsThinking(false);
    }, 1800);
  };

  const handleNewChat = () => {
    setExchanges([]);
    setIsThinking(false);
  };

  const handleOpenSourceModal = (source) => {
    setSelectedSource(source);
    setIsSourceModalOpen(true);
  };

  // ==========================================
  // VIEW MODE: ERROR STATE
  // ==========================================
  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
          <span className="text-xs font-semibold text-foreground">Interactive State Preview:</span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('normal')}>Normal</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('thinking')}>Thinking</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('empty')}>Empty</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Error State</Button>
          </div>
        </div>

        <AIHeaderSection
          title="VaxAssist AI"
          description="Vaccination intelligence for your family."
          badge="Clinical Intelligence Workspace"
        />

        <div className="my-12">
          <ErrorState
            title="VaxAssist couldn't complete that request"
            description="The clinical knowledge retrieval pipeline encountered a temporary interruption. Try again or explore your family vaccination records directly."
            onRetry={() => setViewState('normal')}
          />
        </div>
      </div>
    );
  }

  const isCurrentlyEmpty = viewState === 'empty' || (exchanges.length === 0 && !isThinking);
  const showThinkingState = viewState === 'thinking' || isThinking;

  return (
    <div className="space-y-6">
      {/* 0. INTERACTIVE STATE PREVIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Interactive View Modes:</span>
          <span className="hidden sm:inline">Preview the Vaccination Intelligence Workspace</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewState === 'normal' && exchanges.length > 0 ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => {
              if (exchanges.length === 0) setExchanges(STRUCTURED_DEMO_EXCHANGES);
              setViewState('normal');
              setIsThinking(false);
            }}
          >
            Normal Workspace
          </Button>
          <Button
            size="sm"
            variant={showThinkingState ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => {
              setViewState('thinking');
              setIsThinking(true);
              setThinkingStage('Checking UIP & WHO guideline library');
            }}
          >
            Thinking State
          </Button>
          <Button
            size="sm"
            variant={isCurrentlyEmpty ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => {
              setViewState('empty');
              setExchanges([]);
              setIsThinking(false);
            }}
          >
            Initial Welcome
          </Button>
          <Button
            size="sm"
            variant={viewState === 'error' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('error')}
          >
            Error State
          </Button>
        </div>
      </div>

      {/* 1. AI HERO & HEADER WITH FAMILY CONTEXT SELECTOR */}
      <div className="p-6 rounded-2xl border border-border/80 bg-linear-to-r from-card via-card to-primary/[0.03] shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sora">
                VaxAssist AI
              </h1>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 text-xs py-0.5 px-2.5 font-medium"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Knowledge-aware assistant</span>
              </Badge>
            </div>
            <p className="text-sm font-semibold text-primary font-sans">
              Vaccination intelligence for your family.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Ask questions, understand your vaccination schedule, explore your records, and find guidance grounded in trusted national immunization guidelines (UIP & WHO).
            </p>
          </div>

          {/* Context Selector & Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start md:self-center shrink-0">
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-card">
              <span className="text-xs font-semibold text-muted-foreground pl-2 whitespace-nowrap">
                Answering for:
              </span>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="h-8 text-xs font-bold border-0 bg-secondary/80 focus:ring-0">
                  <SelectValue placeholder="Select Member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fam-1">Aarav (Son, 8 yrs)</SelectItem>
                  <SelectItem value="fam-2">Anaya (Daughter, 4 yrs)</SelectItem>
                  <SelectItem value="fam-3">Meera (Mother, 32 yrs)</SelectItem>
                  <SelectItem value="fam-4">Raj (Father, 35 yrs)</SelectItem>
                  <SelectItem value="ALL">Entire Family (4 Profiles)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="h-10 text-xs font-semibold gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>New Exploration</span>
            </Button>

            {/* Mobile Sheet Trigger */}
            <Button
              variant="outline"
              size="sm"
              className="h-10 text-xs gap-1.5 lg:hidden"
              onClick={() => setIsMobilePanelOpen(true)}
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Context & Sources</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN WORKSPACE: CONTEXT & SOURCES (LEFT 4) + INTELLIGENCE WORKSPACE (RIGHT 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT SIDE PANEL (4 COLS - DESKTOP) ================= */}
        <div className="hidden lg:block lg:col-span-4 space-y-5">
          {/* Current Context Card */}
          <Card className="border border-border/80 shadow-2xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider font-sora">
                  Current Context
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  Active Profile
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-foreground font-sans">
                    {activeMember.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeMember.age} • {activeMember.relationship}
                  </p>
                </div>
                <Avatar className="h-12 w-12 border text-sm font-bold border-primary/20 bg-primary/10 text-primary">
                  <AvatarFallback>
                    {activeMember.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Vaccination Progress</span>
                  <span className="font-bold text-foreground font-mono">{activeMember.progress}%</span>
                </div>
                <Progress value={activeMember.progress} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  {activeMember.completedDoses} of {activeMember.totalDoses} expected doses recorded
                </p>
              </div>

              <Separator />

              {/* Next Vaccination Milestone */}
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                    Next Vaccination
                  </span>
                  <StatusBadge status={activeMember.nextVaccine?.status} size="sm" />
                </div>
                <p className="font-bold text-sm text-foreground">
                  {activeMember.nextVaccine?.name}
                </p>
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>{activeMember.nextVaccine?.dueDate}</span>
                  <span className={activeMember.nextVaccine?.status === 'OVERDUE' ? 'text-status-overdue font-semibold' : ''}>
                    {activeMember.nextVaccine?.relative}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full text-xs font-semibold justify-between h-8.5"
              >
                <Link to={activeMember.id === 'ALL' ? '/vaccinations' : `/family/${activeMember.id}`}>
                  <span>View Vaccination Records</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Trusted Knowledge Library */}
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase font-bold text-foreground tracking-wider font-sora flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Trusted Knowledge</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  Official Standards
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5 text-xs">
              {DEFAULT_SOURCES_LIBRARY.map((source) => (
                <div
                  key={source.id}
                  onClick={() => handleOpenSourceModal(source)}
                  className="p-3 rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:bg-primary/[0.02] transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {source.title}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                      {source.confidence}%
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {source.organization} • {source.section}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Explorations / Conversations */}
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider font-sora">
                Recent Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1.5">
              {INITIAL_CONVERSATION_HISTORY.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setExchanges(STRUCTURED_DEMO_EXCHANGES);
                    setViewState('normal');
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-secondary/80 transition-colors border border-transparent hover:border-border text-xs flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-foreground block truncate group-hover:text-primary transition-colors">
                      {conv.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{conv.date} • {conv.memberContext}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT MAIN WORKSPACE (8 COLS) ================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Smart Question Area */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-sora block">
              What would you like to explore?
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CATEGORIZED_EXPLORATION_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(item.question)}
                  className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:bg-primary/[0.02] transition-all text-left group cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                      {item.category}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Structured Intelligence Conversation Stream */}
          <div className="space-y-6">
            {isCurrentlyEmpty ? (
              /* Initial Welcome State */
              <Card className="p-8 text-center border-dashed border-2 border-border/80 bg-card/60 space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-bold text-lg text-foreground font-sora">
                    Ready to Explore Vaccination Guidance
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Select one of the exploration prompts above, or ask a specific question about {activeMember.name}'s schedule, records, or catch-up rules below.
                  </p>
                </div>
              </Card>
            ) : (
              /* Structured Response Exchanges */
              <>
                {exchanges.map((ex) => (
                  <div key={ex.id} className="space-y-4">
                    {/* User Question Block */}
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                      <Avatar className="h-8 w-8 border border-primary/30 bg-primary text-primary-foreground shrink-0 text-xs font-bold">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">You asked:</span>
                          <span className="font-mono text-[10px]">{ex.timestamp}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          "{ex.query}"
                        </p>
                      </div>
                    </div>

                    {/* Structured AI Healthcare Response Card */}
                    <Card className="border border-border/80 bg-card shadow-2xs overflow-hidden">
                      {/* Response Header */}
                      <CardHeader className="pb-3 border-b border-border/60 bg-muted/15">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-lg bg-primary/10 text-primary">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-foreground font-sora">
                                {ex.title}
                              </h3>
                              <span className="text-[11px] text-muted-foreground">
                                Beneficiary: {ex.recipient} ({ex.relation})
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified Guidance
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
                        {/* Milestone Callout Box */}
                        {ex.milestone && (
                          <div className="p-4 rounded-xl border border-border/80 bg-secondary/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                Milestone Details
                              </span>
                              <StatusBadge status={ex.milestone.status} size="sm" />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="font-bold text-base text-foreground font-sans">
                                {ex.milestone.vaccine}
                              </span>
                              <span className="font-mono text-xs text-primary font-semibold">
                                {ex.milestone.date} ({ex.milestone.countdown})
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span>{ex.milestone.clinic}</span>
                            </p>
                          </div>
                        )}

                        {/* Why This Matters */}
                        <div className="space-y-1.5">
                          <span className="font-bold text-xs uppercase text-muted-foreground tracking-wider font-sora">
                            Why This Matters
                          </span>
                          <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                            {ex.whyItMatters}
                          </p>
                        </div>

                        {/* Clinical Points Checklist */}
                        {ex.clinicalPoints && (
                          <div className="space-y-2 pt-1">
                            <span className="font-bold text-xs uppercase text-muted-foreground tracking-wider font-sora">
                              Key Clinical Recommendations
                            </span>
                            <ul className="space-y-1.5 text-xs text-foreground">
                              {ex.clinicalPoints.map((pt, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  <span className="leading-relaxed">{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Sources Reference Chips */}
                        {ex.sources && ex.sources.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/60">
                            <span className="font-bold text-[11px] uppercase text-muted-foreground tracking-wider font-sora flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-primary" />
                              <span>Clinical Evidence Sources:</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ex.sources.map((src) => (
                                <SourceCitationChip
                                  key={src.id}
                                  title={src.title}
                                  source={src.organization}
                                  page={src.page}
                                  confidence={src.confidence}
                                  onClick={() => handleOpenSourceModal(src)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>

                      {/* Related Actions Footer */}
                      <CardFooter className="p-4 bg-muted/20 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {ex.primaryAction && (
                            <Button size="sm" asChild className="text-xs font-semibold h-8">
                              <Link to={ex.primaryAction.href}>
                                <span>{ex.primaryAction.label}</span>
                                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                              </Link>
                            </Button>
                          )}
                          {ex.secondaryAction && (
                            <Button variant="outline" size="sm" asChild className="text-xs h-8">
                              <Link to={ex.secondaryAction.href}>
                                <span>{ex.secondaryAction.label}</span>
                              </Link>
                            </Button>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Verified against UIP Standard
                        </span>
                      </CardFooter>
                    </Card>
                  </div>
                ))}

                {/* Thinking / Progression State */}
                {showThinkingState && (
                  <Card className="p-6 border border-primary/30 bg-primary/[0.02] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        <h4 className="font-bold text-sm text-foreground font-sora">
                          {thinkingStage}...
                        </h4>
                      </div>
                      <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                        RAG Active
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full bg-primary/10" />
                      <Skeleton className="h-3 w-4/5 bg-primary/10" />
                      <Skeleton className="h-3 w-2/3 bg-primary/10" />
                    </div>
                  </Card>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* AI Input & Quick Action Area */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card space-y-3 shadow-2xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="space-y-3"
            >
              <div className="relative">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  placeholder={`Ask about ${activeMember.name}'s vaccinations, schedule, records, or catch-up guidelines...`}
                  rows={3}
                  className="resize-none text-xs sm:text-sm min-h-[72px] p-3.5 rounded-xl pr-12"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputText.trim() || isThinking}
                  className="absolute right-3 bottom-3 h-8 w-8 p-0 rounded-lg shadow-xs"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Action Shortcuts around Input */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
                    Shortcuts:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5"
                    onClick={() => navigate('/schedule')}
                  >
                    View Schedule
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5"
                    onClick={() => navigate('/vaccinations')}
                  >
                    View Records
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5"
                    onClick={() => handleSendPrompt('What vaccines are currently due or overdue for my family?')}
                  >
                    Check Due Vaccinations
                  </Button>
                </div>

                <span className="text-[10px] text-muted-foreground font-mono hidden md:inline">
                  Press Enter to send • Shift + Enter for newline
                </span>
              </div>
            </form>

            {/* Informational Disclaimer */}
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Clinical Grounding Notice:</strong> VaxAssist AI provides informational assistance grounded in official National Immunization Schedule (UIP) and WHO guidelines. It does not replace professional medical diagnosis. For personal or urgent medical concerns, consult your licensed pediatrician.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SOURCE INSPECTOR MODAL */}
      <Dialog open={isSourceModalOpen} onOpenChange={setIsSourceModalOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedSource && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-4">
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono">
                    {selectedSource.confidence}% Confidence Match
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">{selectedSource.year}</span>
                </div>
                <DialogTitle className="text-base sm:text-lg font-bold font-sora pt-1">
                  {selectedSource.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Published by {selectedSource.organization} • {selectedSource.section}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider font-sora block">
                    Verified Document Excerpt ({selectedSource.page})
                  </span>
                  <p className="text-foreground leading-relaxed italic">
                    "{selectedSource.excerpt}"
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 text-muted-foreground flex items-center justify-between">
                  <span>Document Type: <strong className="text-foreground">{selectedSource.type}</strong></span>
                  <span className="text-primary flex items-center gap-1 text-[11px] font-medium">
                    <span>Evidence-grounded</span>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Close Source Inspector
                  </Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 4. MOBILE CONTEXT & SOURCES SHEET */}
      <Sheet open={isMobilePanelOpen} onOpenChange={setIsMobilePanelOpen}>
        <SheetContent side="right" className="w-80 sm:w-96 overflow-y-auto space-y-5 p-6">
          <SheetHeader>
            <SheetTitle className="font-sora text-base font-bold">Vaccination Context</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Current patient profile and verified guideline sources
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Active Family Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fam-1">Aarav (Son, 8 yrs)</SelectItem>
                  <SelectItem value="fam-2">Anaya (Daughter, 4 yrs)</SelectItem>
                  <SelectItem value="fam-3">Meera (Mother, 32 yrs)</SelectItem>
                  <SelectItem value="fam-4">Raj (Father, 35 yrs)</SelectItem>
                  <SelectItem value="ALL">Entire Family</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/60 space-y-2">
              <div className="flex justify-between font-bold text-foreground">
                <span>{activeMember.name}</span>
                <span>{activeMember.progress}% Coverage</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Next: {activeMember.nextVaccine?.name} ({activeMember.nextVaccine?.dueDate})
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <span className="font-bold text-foreground block font-sora">Trusted Sources</span>
              <div className="space-y-2">
                {DEFAULT_SOURCES_LIBRARY.map((src) => (
                  <div
                    key={src.id}
                    onClick={() => {
                      setIsMobilePanelOpen(false);
                      handleOpenSourceModal(src);
                    }}
                    className="p-2.5 rounded-lg border border-border bg-card text-xs space-y-1 cursor-pointer"
                  >
                    <span className="font-semibold text-foreground block truncate">{src.title}</span>
                    <span className="text-[10px] text-muted-foreground block">{src.organization}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
