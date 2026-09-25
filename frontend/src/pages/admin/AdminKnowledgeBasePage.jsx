import React, { useState, useMemo, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Upload, 
  RefreshCw, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Layers, 
  Sparkles, 
  Eye, 
  Trash2, 
  Archive, 
  ArrowUpRight, 
  Sliders, 
  Check, 
  ChevronRight, 
  Download, 
  FileCheck, 
  HelpCircle, 
  ExternalLink,
  ShieldCheck,
  Server,
  Cpu,
  History,
  Tag,
  BookOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  MOCK_KB_METRICS,
  MOCK_RAG_SYSTEM_STATUS,
  MOCK_KB_CATEGORIES,
  MOCK_KB_DOCUMENTS,
  MOCK_KB_RECENT_ACTIVITY,
} from '@/data/mockKnowledgeBaseData';

const ITEMS_PER_PAGE = 5;

export function AdminKnowledgeBasePage() {
  const [documents, setDocuments] = useState(MOCK_KB_DOCUMENTS);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'indexing' | 'error'

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [indexingFilter, setIndexingFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'title' | 'chunks'
  const [currentPage, setCurrentPage] = useState(1);

  // Global Re-index simulation state
  const [isReindexingAll, setIsReindexingAll] = useState(false);
  const [reindexProgress, setReindexProgress] = useState(0);
  const [reindexStatusText, setReindexStatusText] = useState('');
  const [confirmReindexAllOpen, setConfirmReindexAllOpen] = useState(false);

  // Upload Modal State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'National Immunization Schedule (NIS)',
    source: 'Ministry of Health & Family Welfare (MoHFW)',
    version: 'v2026.2',
    description: '',
    effectiveDate: '2026-10-01',
    tags: 'UIP, National Schedule, 2026',
    filename: 'UIP_Supplementary_Addendum_2026.pdf',
    filesize: '3.4 MB',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState('');

  // Document Details Sheet State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [detailsActiveTab, setDetailsActiveTab] = useState('overview');

  // Single document action confirmation states
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [documentToArchive, setDocumentToArchive] = useState(null);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);

  // Feedback Banner
  const [toastNotice, setToastNotice] = useState(null);

  // Chunks search filter inside details sheet
  const [chunkSearchQuery, setChunkSearchQuery] = useState('');

  // Global Re-indexing Timer Simulation
  useEffect(() => {
    let timer;
    if (isReindexingAll) {
      timer = setInterval(() => {
        setReindexProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsReindexingAll(false);
            setToastNotice('ChromaDB Knowledge Collection fully re-indexed. 2,450 vector chunks validated with text-embedding-004.');
            return 100;
          }
          const next = prev + 15;
          if (next < 30) setReindexStatusText('Parsing documents & extracting text layers...');
          else if (next < 60) setReindexStatusText('Generating 768-dim embeddings via Google Vertex AI...');
          else if (next < 90) setReindexStatusText('Updating ChromaDB HNSW vector index...');
          else setReindexStatusText('Finalizing deterministic grounding verification...');
          return next;
        });
      }, 600);
    }
    return () => clearInterval(timer);
  }, [isReindexingAll]);

  // Upload Progress Timer Simulation
  useEffect(() => {
    let timer;
    if (isUploading) {
      timer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsUploading(false);

            // Add synthetic uploaded document
            const newDoc = {
              id: `DOC-NEW-${Date.now().toString().slice(-4)}`,
              title: uploadForm.title || 'New Immunization Clinical Addendum',
              filename: uploadForm.filename,
              filesize: uploadForm.filesize,
              filetype: 'application/pdf',
              pages: 36,
              sha256: 'a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01',
              category: uploadForm.category,
              source: uploadForm.source,
              authorityType: 'Governmental / Clinical',
              version: uploadForm.version,
              status: 'ACTIVE',
              indexingStatus: 'INDEXED',
              chunksCount: 142,
              uploadedAt: new Date().toISOString(),
              uploadedAgo: 'Just now',
              lastIndexed: 'Just now',
              effectiveDate: uploadForm.effectiveDate,
              description: uploadForm.description || 'Clinical guidance document uploaded via Admin Console.',
              tags: uploadForm.tags.split(',').map((t) => t.trim()),
              chunks: [
                {
                  chunkId: 'CHK-NEW-001',
                  section: 'Section 1.1: Clinical Scope & Target Cohorts',
                  tokens: 380,
                  embeddingDim: 768,
                  collection: 'uip_clinical_guidelines_2026',
                  sourceRef: `${uploadForm.filename}, Page 3`,
                  score: '0.95 Similarity',
                  contentSnippet: 'Standardized operational protocol defining target age cohorts, storage temperature specifications, and co-administration compatibility matrices aligned with National Immunization Schedule regimens.',
                },
              ],
              versionHistory: [
                { version: uploadForm.version, date: new Date().toISOString().split('T')[0], author: 'System Administrator (Pradeep Pal)', changeSummary: 'Initial document upload and ChromaDB vector chunk ingestion.' },
              ],
            };

            setDocuments((prev) => [newDoc, ...prev]);
            setUploadDialogOpen(false);
            setToastNotice(`"${newDoc.title}" successfully uploaded, parsed, and indexed (142 vector chunks created).`);
            setUploadProgress(0);
            return 100;
          }
          const next = prev + 20;
          if (next < 30) setUploadStepText('Uploading document binary to storage...');
          else if (next < 60) setUploadStepText('Parsing PDF text & table structure...');
          else if (next < 85) setUploadStepText('Embedding semantic chunks (text-embedding-004)...');
          else setUploadStepText('Ingesting vector records into ChromaDB collection...');
          return next;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isUploading, uploadForm]);

  // Filtered & Sorted Documents computation
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Category filter
      if (categoryFilter !== 'All Categories' && doc.category !== categoryFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) {
        return false;
      }
      // Indexing status filter
      if (indexingFilter !== 'ALL' && doc.indexingStatus !== indexingFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesFilename = doc.filename.toLowerCase().includes(query);
        const matchesSource = doc.source.toLowerCase().includes(query);
        const matchesDesc = doc.description && doc.description.toLowerCase().includes(query);
        const matchesTags = doc.tags && doc.tags.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesFilename || matchesSource || matchesDesc || matchesTags;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'chunks') return b.chunksCount - a.chunksCount;
      // default newest
      return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
    });
  }, [documents, categoryFilter, statusFilter, indexingFilter, searchQuery, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE) || 1;
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocuments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocuments, currentPage]);

  // Handlers
  const handleStartReindexAll = () => {
    setConfirmReindexAllOpen(false);
    setIsReindexingAll(true);
    setReindexProgress(5);
    setReindexStatusText('Initializing ChromaDB collection re-indexing...');
  };

  const handleReindexSingleDocument = (doc) => {
    setToastNotice(`Re-indexing initiated for "${doc.filename}". Re-vectorizing ${doc.chunksCount} chunks...`);
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, indexingStatus: 'INDEXED', lastIndexed: 'Just now' } : d))
      );
      setToastNotice(`Completed re-indexing for "${doc.filename}". 0 embedding drift detected.`);
    }, 2000);
  };

  const handleOpenDetails = (doc, defaultTab = 'overview') => {
    setSelectedDoc(doc);
    setDetailsActiveTab(defaultTab);
    setChunkSearchQuery('');
    setDetailsSheetOpen(true);
  };

  const handleDeleteDocument = () => {
    if (!documentToDelete) return;
    setDocuments((prev) => prev.filter((d) => d.id !== documentToDelete.id));
    setToastNotice(`Document "${documentToDelete.filename}" and its vector chunks deleted from ChromaDB.`);
    setConfirmDeleteOpen(false);
    setDocumentToDelete(null);
    if (selectedDoc?.id === documentToDelete.id) {
      setDetailsSheetOpen(false);
    }
  };

  const handleToggleArchiveDocument = () => {
    if (!documentToArchive) return;
    const newStatus = documentToArchive.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    setDocuments((prev) =>
      prev.map((d) => (d.id === documentToArchive.id ? { ...d, status: newStatus } : d))
    );
    setToastNotice(`Document "${documentToArchive.filename}" status updated to ${newStatus}.`);
    setConfirmArchiveOpen(false);
    setDocumentToArchive(null);
    if (selectedDoc?.id === documentToArchive.id) {
      setSelectedDoc((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All Categories');
    setStatusFilter('ALL');
    setIndexingFilter('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Filtered chunks in document details sheet
  const filteredChunks = useMemo(() => {
    if (!selectedDoc || !selectedDoc.chunks) return [];
    if (!chunkSearchQuery.trim()) return selectedDoc.chunks;
    const q = chunkSearchQuery.toLowerCase();
    return selectedDoc.chunks.filter(
      (c) =>
        c.chunkId.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        c.contentSnippet.toLowerCase().includes(q) ||
        c.sourceRef.toLowerCase().includes(q)
    );
  }, [selectedDoc, chunkSearchQuery]);

  // Handle View States
  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Knowledge Base & RAG Indexing"
          subtitle="Clinical guideline ingestion, vector embeddings, and deterministic AI grounding sources."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Knowledge Base' },
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <LoadingState text="Loading ChromaDB vector collections, knowledge documents, and embedding telemetry..." />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Knowledge Base & RAG Indexing"
          subtitle="Clinical guideline ingestion, vector embeddings, and deterministic AI grounding sources."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Knowledge Base' },
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <ErrorState
          title="ChromaDB Vector Store Connection Failure"
          message="Could not communicate with the local vector database instance at port 8000. Verify the indexing service container is running."
          onRetry={() => setViewState('normal')}
        />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Knowledge Base & RAG Indexing"
          subtitle="Clinical guideline ingestion, vector embeddings, and deterministic AI grounding sources."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Knowledge Base' },
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <EmptyState
          icon={Database}
          title="No Knowledge Documents in RAG Collection"
          description="The vector store has not been initialized with clinical immunization guidelines. Upload your first PDF guideline to begin indexing."
          actionText="Upload First Document"
          onAction={() => {
            setViewState('normal');
            setUploadDialogOpen(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Knowledge Base & RAG Vector Management"
        subtitle="Curate authoritative immunization schedules, clinical guidelines, and inspect semantic vector chunks indexed in ChromaDB."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Knowledge Base' },
        ]}
        badge={
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-mono text-xs flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>RAG Grounding &bull; text-embedding-004</span>
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setToastNotice('Refreshed ChromaDB vector collection metrics. Status: Healthy.');
              }}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Status</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmReindexAllOpen(true)}
              disabled={isReindexingAll}
              className="text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isReindexingAll ? 'animate-spin' : ''}`} />
              <span>Re-index Collection</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setUploadDialogOpen(true)}
              className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Document</span>
            </Button>
          </div>
        }
      />

      {/* State Preview Toolbar */}
      <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />

      {/* Action Toast Alert Banner */}
      {toastNotice && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-slideDown">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{toastNotice}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setToastNotice(null)}
            className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Global Re-indexing Active Progress Notification */}
      {isReindexingAll && (
        <Card className="border border-primary/40 bg-primary/5 shadow-xs p-4 sm:p-5 space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary animate-spin" />
              <span className="font-bold text-foreground">Re-indexing Entire Knowledge Base</span>
            </div>
            <span className="font-mono font-bold text-primary">{reindexProgress}% Complete</span>
          </div>
          <Progress value={reindexProgress} className="h-2" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>{reindexStatusText}</span>
            <span>Target: ChromaDB (2,450 chunks)</span>
          </div>
        </Card>
      )}

      {/* 2. Top-Level Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Documents"
          value={documents.length}
          subtext={`${documents.filter((d) => d.indexingStatus === 'INDEXED').length} indexed in vector DB`}
          icon={FileText}
          badgeText="Active"
          badgeVariant="success"
          accentColor="cyan"
        />
        <MetricCard
          title="Vector Chunks"
          value={MOCK_KB_METRICS.totalChunks.toLocaleString()}
          subtext="Avg 384 tokens / chunk"
          icon={Layers}
          badgeText="768 dim"
          badgeVariant="secondary"
          accentColor="cyan"
        />
        <MetricCard
          title="Retrieval Health"
          value={MOCK_KB_METRICS.freshnessScore}
          subtext="Cosine Similarity > 0.82"
          icon={ShieldCheck}
          badgeText="Deterministic"
          badgeVariant="info"
          accentColor="success"
        />
        <MetricCard
          title="Last Synchronized"
          value="04:00 UTC"
          subtext="Daily automated cron"
          icon={Clock}
          badgeText="Grounded"
          badgeVariant="secondary"
          accentColor="neutral"
        />
      </div>

      {/* 3. Compact RAG System Status Card */}
      <Card className="border border-border shadow-xs bg-card/60">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                RAG Embedding & Vector Store Telemetry
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Active vector collection: <strong className="text-foreground font-mono">{MOCK_RAG_SYSTEM_STATUS.activeCollection}</strong>
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5 self-start sm:self-auto font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ChromaDB v0.5.4 Online</span>
          </Badge>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-mono">Embedding Model</span>
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">text-embedding-004</span>
              </div>
              <p className="text-[10.5px] text-muted-foreground font-mono">768-dim embeddings</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-mono">Vector Ingestion Queue</span>
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>{documents.filter((d) => d.indexingStatus === 'PENDING').length} Documents Queued</span>
              </div>
              <p className="text-[10.5px] text-muted-foreground font-mono">96 chunks awaiting vectorization</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-mono">Indexing Failures</span>
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span className={documents.some((d) => d.indexingStatus === 'FAILED') ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                  {documents.filter((d) => d.indexingStatus === 'FAILED').length} Issue Detected
                </span>
              </div>
              {documents.some((d) => d.indexingStatus === 'FAILED') && (
                <button
                  onClick={() => {
                    const failed = documents.find((d) => d.indexingStatus === 'FAILED');
                    if (failed) handleOpenDetails(failed, 'overview');
                  }}
                  className="text-[10.5px] text-primary hover:underline font-medium"
                >
                  Inspect Failed OCR &rarr;
                </button>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-mono">Average Query Latency</span>
              <div className="font-semibold text-foreground font-sora">
                {MOCK_RAG_SYSTEM_STATUS.averageQueryLatency}
              </div>
              <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">99.4% Retrieval Success</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Documents Management Section */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
              Official Guideline Repository
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Authoritative medical guidelines ingested and divided into vectorized semantic chunks.
            </CardDescription>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Showing {filteredDocuments.length} of {documents.length} guidelines
          </span>
        </CardHeader>

        {/* Filter and Search Bar */}
        <CardContent className="p-4 border-b border-border/60 bg-muted/20 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search guidelines by title, authority, filename, or clinical tag..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs sm:text-sm h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="w-full lg:w-64">
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_KB_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Indexing Status Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={indexingFilter}
                onValueChange={(val) => {
                  setIndexingFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Indexing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Indexing</SelectItem>
                  <SelectItem value="INDEXED">Indexed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-36">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="w-full sm:w-40">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="chunks">Chunks Count</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || categoryFilter !== 'All Categories' || statusFilter !== 'ALL' || indexingFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>

        {/* Documents Table or Empty State */}
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Search}
                title="No documents match your filters"
                description="Try clearing your search terms or selecting a different category or status."
                actionText="Reset All Filters"
                onAction={handleClearFilters}
              />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[320px] font-semibold text-xs text-foreground">Document Title & File</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Category / Authority</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Version</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Indexing Status</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Vector Chunks</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Last Re-indexed</TableHead>
                      <TableHead className="text-right font-semibold text-xs text-foreground pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDocuments.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5">
                          <div className="space-y-1 max-w-[300px]">
                            <button
                              onClick={() => handleOpenDetails(doc, 'overview')}
                              className="font-semibold text-sm text-foreground hover:text-primary transition-colors text-left line-clamp-1 cursor-pointer"
                            >
                              {doc.title}
                            </button>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{doc.filename}</span>
                              <span className="shrink-0 text-[11px]">&bull; {doc.filesize}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5 text-xs">
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[11px] font-medium bg-secondary text-foreground">
                              {doc.category}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{doc.source}</p>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5 text-xs font-mono text-muted-foreground">
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-semibold text-foreground">
                            {doc.version}
                          </span>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <IndexingBadge status={doc.indexingStatus} failureReason={doc.failureReason} />
                        </TableCell>

                        <TableCell className="py-3.5 text-xs font-mono">
                          {doc.chunksCount > 0 ? (
                            <button
                              onClick={() => handleOpenDetails(doc, 'chunks')}
                              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Layers className="h-3 w-3" />
                              <span>{doc.chunksCount} chunks</span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground">0 chunks</span>
                          )}
                        </TableCell>

                        <TableCell className="py-3.5 text-xs text-muted-foreground font-mono">
                          {doc.lastIndexed}
                        </TableCell>

                        <TableCell className="py-3.5 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDetails(doc, 'overview')}
                              className="h-8 px-2 text-xs gap-1"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>View</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReindexSingleDocument(doc)}
                              className="h-8 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
                              title="Re-index this document"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Re-index</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDocumentToDelete(doc);
                                setConfirmDeleteOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete from knowledge base"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Stack (<768px) */}
              <div className="md:hidden divide-y divide-border/60">
                {paginatedDocuments.map((doc) => (
                  <div key={doc.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <h4
                          onClick={() => handleOpenDetails(doc, 'overview')}
                          className="font-bold text-sm text-foreground line-clamp-2 cursor-pointer hover:text-primary"
                        >
                          {doc.title}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono">{doc.filename} &bull; {doc.filesize}</p>
                      </div>
                      <IndexingBadge status={doc.indexingStatus} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-[10px] bg-secondary">
                        {doc.category}
                      </Badge>
                      <span className="font-mono text-[11px] text-muted-foreground">Version: {doc.version}</span>
                      <span className="font-mono text-[11px] text-primary">&bull; {doc.chunksCount} chunks</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(doc, 'overview')}
                        className="flex-1 text-xs gap-1.5 h-8"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Details</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenDetails(doc, 'chunks')}
                        className="flex-1 text-xs gap-1.5 h-8"
                      >
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        <span>Chunks ({doc.chunksCount})</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <CardFooter className="p-4 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx + 1}
                  variant={currentPage === idx + 1 ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(idx + 1)}
                  className="h-8 w-8 p-0 text-xs font-mono"
                >
                  {idx + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* 5. Upload Document Dialog / Sheet */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <span>Ingest Guideline into RAG Knowledge Base</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Uploaded PDF documents are parsed into semantic vector chunks and indexed in ChromaDB with text-embedding-004.
            </DialogDescription>
          </DialogHeader>

          {isUploading ? (
            <div className="py-8 space-y-4 text-center">
              <div className="p-4 rounded-full bg-primary/10 text-primary w-14 h-14 mx-auto flex items-center justify-center animate-pulse">
                <Layers className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">Vector Ingestion In Progress</h4>
                <p className="text-xs text-muted-foreground font-mono">{uploadStepText}</p>
              </div>
              <Progress value={uploadProgress} className="h-2 max-w-sm mx-auto" />
              <span className="text-xs font-mono text-primary font-bold">{uploadProgress}% Complete</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsUploading(true);
                setUploadProgress(10);
                setUploadStepText('Uploading document binary...');
              }}
              className="space-y-4"
            >
              {/* Drag and Drop Upload Area */}
              <div className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-6 text-center space-y-2 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary w-10 h-10 mx-auto flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    Drop PDF guideline here, or <span className="text-primary hover:underline">browse files</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Supports clinical PDF, DOCX, TXT (Maximum file size: 25 MB)
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-card border border-border text-xs text-foreground font-mono mt-2">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>{uploadForm.filename}</span>
                  <span className="text-muted-foreground">({uploadForm.filesize})</span>
                </div>
              </div>

              {/* Form Metadata Fields */}
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Document Title *</Label>
                  <Input
                    required
                    placeholder="e.g. UIP National Operational Guidelines 2026 Addendum"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Guideline Category *</Label>
                    <Select
                      value={uploadForm.category}
                      onValueChange={(val) => setUploadForm({ ...uploadForm, category: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_KB_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Version Identifier *</Label>
                    <Input
                      required
                      placeholder="e.g. v2026.2"
                      value={uploadForm.version}
                      onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Authoritative Source *</Label>
                    <Input
                      required
                      placeholder="e.g. Ministry of Health & Family Welfare (MoHFW)"
                      value={uploadForm.source}
                      onChange={(e) => setUploadForm({ ...uploadForm, source: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Effective Implementation Date</Label>
                    <Input
                      type="date"
                      value={uploadForm.effectiveDate}
                      onChange={(e) => setUploadForm({ ...uploadForm, effectiveDate: e.target.value })}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Clinical Description & Scope</Label>
                  <Textarea
                    placeholder="Briefly describe target antigen cohorts, contraindications, and clinical rules contained in this document..."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="h-18 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Clinical Grounding Tags (comma-separated)</Label>
                  <Input
                    placeholder="e.g. UIP, Hexavalent, Catch-up, High Risk"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Parse & Ingest into ChromaDB</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Document Details Drawer / Sheet */}
      <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-card">
          {selectedDoc && (
            <>
              {/* Sheet Header */}
              <div className="p-5 border-b border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono bg-secondary">
                    {selectedDoc.id}
                  </Badge>
                  <IndexingBadge status={selectedDoc.indexingStatus} />
                </div>
                <SheetTitle className="text-base sm:text-lg font-bold text-foreground">
                  {selectedDoc.title}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                  <span>{selectedDoc.source}</span>
                  <span>&bull;</span>
                  <span className="font-mono">{selectedDoc.version}</span>
                  <span>&bull;</span>
                  <span className="font-mono">{selectedDoc.chunksCount} chunks</span>
                </SheetDescription>
              </div>

              {/* Sheet Body Tabs */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs value={detailsActiveTab} onValueChange={setDetailsActiveTab} className="flex-1 flex flex-col">
                  <div className="px-5 border-b border-border/80 bg-card">
                    <TabsList className="bg-muted/50 p-1 w-full justify-start rounded-lg">
                      <TabsTrigger value="overview" className="text-xs">
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs">
                        Content Preview
                      </TabsTrigger>
                      <TabsTrigger value="chunks" className="text-xs gap-1">
                        <span>Knowledge Chunks</span>
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.2 rounded-full font-mono font-bold">
                          {selectedDoc.chunks?.length || 0}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger value="history" className="text-xs">
                        Version History
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <ScrollArea className="flex-1 p-5">
                    {/* Tab 1: Overview */}
                    <TabsContent value="overview" className="m-0 space-y-5">
                      {/* Failure Alert if Failed */}
                      {selectedDoc.indexingStatus === 'FAILED' && (
                        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 space-y-2 text-xs text-rose-900 dark:text-rose-200">
                          <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                            <AlertCircle className="h-4 w-4" />
                            <span>Vector Indexing Failed</span>
                          </div>
                          <p className="leading-relaxed">{selectedDoc.failureReason}</p>
                          <Button
                            size="sm"
                            onClick={() => handleReindexSingleDocument(selectedDoc)}
                            className="text-xs bg-rose-600 text-white hover:bg-rose-700 h-8 gap-1.5"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Retry Ingestion with High-Resolution OCR</span>
                          </Button>
                        </div>
                      )}

                      {/* Metadata Grid */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                          Document Metadata
                        </span>
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                            <span className="text-[11px] text-muted-foreground font-mono">Category</span>
                            <div className="font-semibold text-foreground">{selectedDoc.category}</div>
                          </div>
                          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                            <span className="text-[11px] text-muted-foreground font-mono">Authority Type</span>
                            <div className="font-semibold text-foreground">{selectedDoc.authorityType}</div>
                          </div>
                          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                            <span className="text-[11px] text-muted-foreground font-mono">Effective Date</span>
                            <div className="font-mono font-semibold text-foreground">{selectedDoc.effectiveDate}</div>
                          </div>
                          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                            <span className="text-[11px] text-muted-foreground font-mono">Page Count</span>
                            <div className="font-mono font-semibold text-foreground">{selectedDoc.pages} pages</div>
                          </div>
                        </div>
                      </div>

                      {/* File Technical Spec */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                          Binary File Information
                        </span>
                        <div className="p-3 rounded-xl border border-border bg-muted/10 space-y-2 text-xs">
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-muted-foreground">Filename:</span>
                            <span className="font-bold text-foreground">{selectedDoc.filename}</span>
                          </div>
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-muted-foreground">File Size:</span>
                            <span>{selectedDoc.filesize}</span>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span className="text-muted-foreground">SHA-256 Hash:</span>
                            <span className="text-muted-foreground truncate max-w-[280px]" title={selectedDoc.sha256}>
                              {selectedDoc.sha256}
                            </span>
                          </div>
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-muted-foreground">Last Re-index:</span>
                            <span className="text-primary">{selectedDoc.lastIndexed}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                          Description
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed p-3 rounded-xl border border-border bg-muted/10">
                          {selectedDoc.description}
                        </p>
                      </div>

                      {/* Clinical Tags */}
                      {selectedDoc.tags && (
                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                            Grounding Keywords / Tags
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDoc.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs py-0.5 px-2">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab 2: Content Preview */}
                    <TabsContent value="preview" className="m-0 space-y-4">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span>Extracted guideline text from source PDF</span>
                        </div>
                        <span className="text-[11px] font-mono text-primary font-medium">Verified Unaltered</span>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs leading-relaxed space-y-4 text-foreground/90 font-mono">
                        <div className="border-b border-border/60 pb-2">
                          <h4 className="font-bold text-sm text-foreground">
                            {selectedDoc.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Authority: {selectedDoc.source} &bull; Effective: {selectedDoc.effectiveDate}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-bold text-primary">1. CLINICAL MANDATE & CORE SCHEDULE</h5>
                          <p className="text-muted-foreground">
                            All scheduled vaccines must be stored and administered strictly in accordance with national cold-chain standards (+2°C to +8°C for liquid vaccines). Universal Immunization Programme protocols mandate primary infant series protection against Tuberculosis, Poliomyelitis, Hepatitis B, Diphtheria, Pertussis, Tetanus, Haemophilus influenzae type b, Pneumococcal disease, Rotavirus diarrhoea, and Measles-Rubella.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-bold text-primary">2. CO-ADMINISTRATION SAFETY MATRIX</h5>
                          <p className="text-muted-foreground">
                            Multiple live and inactivated antigens may be administered simultaneously at different anatomical injection sites (minimum 2.5 cm separation) without compromising immunogenicity or increasing systemic reactogenicity. If two injectable live virus vaccines (e.g. Measles-Rubella and Varicella) are not administered concurrently, a mandatory spacing of 28 days must be enforced.
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-card border border-border text-[11px] text-muted-foreground">
                          [End of excerpt preview. All 142 pages parsed into {selectedDoc.chunksCount} semantic vector chunks.]
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab 3: Knowledge Chunks (RAG Inspection) */}
                    <TabsContent value="chunks" className="m-0 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                            ChromaDB Semantic Vector Chunks ({selectedDoc.chunks?.length || 0})
                          </span>
                          <span className="text-[11px] font-mono text-primary">Embedding: text-embedding-004</span>
                        </div>

                        {/* Chunk Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Filter chunks by section, keyword, or chunk ID..."
                            value={chunkSearchQuery}
                            onChange={(e) => setChunkSearchQuery(e.target.value)}
                            className="pl-8 text-xs h-8"
                          />
                        </div>
                      </div>

                      {filteredChunks.length === 0 ? (
                        <div className="text-center py-8 text-xs text-muted-foreground space-y-1">
                          <Layers className="h-6 w-6 text-muted-foreground mx-auto" />
                          <p>No knowledge chunks matching your search.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredChunks.map((chunk) => (
                            <div
                              key={chunk.chunkId}
                              className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5 hover:border-primary/40 transition-colors shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-primary">
                                      {chunk.chunkId}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] bg-secondary font-mono">
                                      {chunk.tokens} tokens
                                    </Badge>
                                  </div>
                                  <h5 className="font-semibold text-xs text-foreground truncate">
                                    {chunk.section}
                                  </h5>
                                </div>
                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shrink-0 font-mono">
                                  {chunk.score}
                                </Badge>
                              </div>

                              <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/50 font-mono text-[11.5px]">
                                "{chunk.contentSnippet}"
                              </p>

                              <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                                <span>Ref: {chunk.sourceRef}</span>
                                <span>Collection: {chunk.collection}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab 4: Version History */}
                    <TabsContent value="history" className="m-0 space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                        Revision & Re-indexing Log
                      </span>
                      <div className="space-y-2">
                        {selectedDoc.versionHistory?.map((hist, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground font-mono">{hist.version}</span>
                              <span className="text-[11px] font-mono text-muted-foreground">{hist.date}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{hist.changeSummary}</p>
                            <div className="text-[11px] text-muted-foreground/80 font-mono">
                              Author: {hist.author}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </div>

              {/* Sheet Footer Actions */}
              <SheetFooter className="p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDocumentToArchive(selectedDoc);
                    setConfirmArchiveOpen(true);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedDoc.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReindexSingleDocument(selectedDoc)}
                    className="text-xs gap-1.5 text-primary"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Re-index</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setToastNotice(`Downloading source binary for "${selectedDoc.filename}"...`);
                    }}
                    className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmation Alert Dialog: Delete Document */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Delete Knowledge Guideline?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Are you sure you want to permanently delete <strong>{documentToDelete?.title}</strong>?
              This will remove all associated vector embeddings ({documentToDelete?.chunksCount} chunks) from ChromaDB. RAG queries referencing this guideline will fall back to general UIP schedule rules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Alert Dialog: Archive Document */}
      <AlertDialog open={confirmArchiveOpen} onOpenChange={setConfirmArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" />
              <span>{documentToArchive?.status === 'ARCHIVED' ? 'Unarchive Document?' : 'Archive Knowledge Document?'}</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              {documentToArchive?.status === 'ARCHIVED'
                ? `Restoring "${documentToArchive?.title}" will re-enable its vector chunks for high-priority RAG query matching.`
                : `Archiving "${documentToArchive?.title}" will demote its vector chunks in semantic search rankings to historical reference tier.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleArchiveDocument}
              className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Alert Dialog: Re-index All */}
      <AlertDialog open={confirmReindexAllOpen} onOpenChange={setConfirmReindexAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <RotateCcw className="h-5 w-5 text-primary" />
              <span>Re-index Entire Knowledge Base?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              This will re-calculate semantic vector embeddings across all 48 guidelines (2,450 chunks) using <strong>Google Vertex AI text-embedding-004</strong> and rebuild the HNSW graph in ChromaDB.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartReindexAll}
              className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Start Re-indexing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Visual Indexing status badge helper
 */
function IndexingBadge({ status, failureReason }) {
  if (status === 'INDEXED') {
    return (
      <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-mono">
        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        <span>Indexed</span>
      </Badge>
    );
  }
  if (status === 'PENDING') {
    return (
      <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-mono animate-pulse">
        <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        <span>Queued</span>
      </Badge>
    );
  }
  if (status === 'FAILED') {
    return (
      <Badge
        variant="outline"
        className="text-[11px] bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 font-mono"
        title={failureReason || 'Indexing failed'}
      >
        <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
        <span>Failed OCR</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px] bg-secondary text-muted-foreground font-mono">
      {status}
    </Badge>
  );
}

/**
 * Inspection State Preview Toolbar
 */
function StatePreviewToolbar({ viewState, setViewState }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-dashed border-border bg-muted/30 text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>UI State Inspector:</span>
      </div>
      <div className="flex items-center gap-1">
        {['normal', 'loading', 'empty', 'error'].map((st) => (
          <button
            key={st}
            onClick={() => setViewState(st)}
            className={`px-2.5 py-1 rounded-md capitalize font-medium text-xs transition-colors ${
              viewState === st
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AdminKnowledgeBasePage;
