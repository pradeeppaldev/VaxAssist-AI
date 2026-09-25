import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileCheck,
  History,
  CalendarDays,
  Users,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Sparkles,
  QrCode,
  Building,
  User,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Check,
  ChevronRight,
  Calendar
} from 'lucide-react';

// Common Components
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';

// shadcn UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock Data
import { INITIAL_FAMILY_MEMBERS } from '@/data/mockFamilyData';
import {
  REPORT_TYPES_CONFIG,
  MOCK_CERTIFICATES,
  MOCK_REPORT_PREVIEWS,
} from '@/data/mockReportsData';

export default function ReportsPage() {
  // View State for Testing: 'normal' | 'loading' | 'empty' | 'error'
  const [viewState, setViewState] = useState('normal');

  // Active Family Member Filter
  const [selectedMemberId, setSelectedMemberId] = useState('ALL');

  // Search & Filter state for Certificates
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('ALL');

  // Modals state
  const [previewReport, setPreviewReport] = useState(null); // Report object currently previewed
  const [previewCert, setPreviewCert] = useState(null); // Certificate object currently previewed
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  // Generate Report Form State
  const [generateForm, setGenerateForm] = useState({
    memberId: 'ALL',
    reportType: 'summary',
    dateRange: 'ALL_TIME',
    includeHistory: true,
    includeSchedule: true,
    includeCertificates: true,
    includeSignatures: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // Download feedback toast indicator (UI-only simulation)
  const [downloadToast, setDownloadToast] = useState(null);

  const triggerDownloadSimulation = (title) => {
    setDownloadToast(`Preparing download for "${title}"...`);
    setTimeout(() => {
      setDownloadToast(`Downloaded "${title}" (Sample PDF)`);
      setTimeout(() => setDownloadToast(null), 3000);
    }, 800);
  };

  // Active member details for contextual headers
  const activeMember = useMemo(() => {
    if (selectedMemberId === 'ALL') {
      return {
        id: 'ALL',
        name: 'Entire Family',
        relationship: 'All Household Profiles',
        age: '4 Members',
      };
    }
    return INITIAL_FAMILY_MEMBERS.find((m) => m.id === selectedMemberId) || INITIAL_FAMILY_MEMBERS[0];
  }, [selectedMemberId]);

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return MOCK_CERTIFICATES.filter((cert) => {
      // Member filter
      if (selectedMemberId !== 'ALL' && cert.memberId !== selectedMemberId && cert.memberId !== 'ALL') {
        return false;
      }
      // Type filter
      if (selectedDocType !== 'ALL' && cert.type !== selectedDocType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = cert.title.toLowerCase().includes(q);
        const matchesVaccine = cert.vaccine.toLowerCase().includes(q);
        const matchesMember = cert.memberName.toLowerCase().includes(q);
        const matchesId = cert.documentId.toLowerCase().includes(q);
        if (!matchesTitle && !matchesVaccine && !matchesMember && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [selectedMemberId, selectedDocType, searchQuery]);

  // Handle Generate Report Flow
  const handleGenerateSubmit = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationSuccess(true);
    }, 1200);
  };

  const handleResetGenerateForm = () => {
    setGenerationSuccess(false);
    setIsGenerating(false);
    setIsGenerateDialogOpen(false);
  };

  // ==========================================
  // VIEW MODE: ERROR STATE
  // ==========================================
  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        {/* Interactive State Preview Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
          <span className="text-xs font-semibold text-foreground">Interactive State Preview:</span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('normal')}>Normal</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('loading')}>Loading</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('empty')}>Empty</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Error State</Button>
          </div>
        </div>

        <PageHeader
          title="Reports & Certificates"
          description="Access vaccination summaries, records, and available certificates for your family."
        />

        <div className="my-12">
          <ErrorState
            title="We couldn't load your reports"
            description="The vaccination document store encountered a temporary error while retrieving family records. Please try again."
            onRetry={() => setViewState('normal')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 0. INTERACTIVE STATE PREVIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Interactive View Modes:</span>
          <span className="hidden sm:inline">Preview states for testing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewState === 'normal' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('normal')}
          >
            Normal View
          </Button>
          <Button
            size="sm"
            variant={viewState === 'loading' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('loading')}
          >
            Loading
          </Button>
          <Button
            size="sm"
            variant={viewState === 'empty' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('empty')}
          >
            Empty
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

      {/* Floating Download Toast Indicator */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-xs py-2.5 px-4 rounded-xl shadow-lg border border-border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{downloadToast}</span>
        </div>
      )}

      {/* 1. PAGE HEADER WITH PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Reports & Certificates"
          description="Access vaccination summaries, records, and available certificates for your family."
        />

        <Button
          onClick={() => {
            setGenerationSuccess(false);
            setIsGenerateDialogOpen(true);
          }}
          className="gap-2 shrink-0 self-start sm:self-center h-10 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Generate Report</span>
        </Button>
      </div>

      {/* 2. FAMILY MEMBER SELECTOR BAR */}
      <Card className="border border-border/80 shadow-2xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Viewing Documents For
              </span>
              <h3 className="font-bold text-base text-foreground font-sans">
                {activeMember.name}
                {activeMember.relationship && (
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    ({activeMember.relationship})
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline whitespace-nowrap">
              Switch Member:
            </span>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-full sm:w-[240px] text-xs font-semibold h-9.5">
                <SelectValue placeholder="Select Member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Entire Family (All Members)</SelectItem>
                <SelectItem value="fam-1">Aarav Pal (Son, 8 yrs)</SelectItem>
                <SelectItem value="fam-2">Anaya Pal (Daughter, 4 yrs)</SelectItem>
                <SelectItem value="fam-3">Meera Pal (Mother, 32 yrs)</SelectItem>
                <SelectItem value="fam-4">Raj Pal (Father, 35 yrs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
          VIEW MODE: LOADING STATE
      ========================================== */}
      {viewState === 'loading' && (
        <div className="space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-5 space-y-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <div className="pt-2 flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <Card className="p-5 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </Card>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW MODE: EMPTY STATE
      ========================================== */}
      {viewState === 'empty' && (
        <div className="my-8">
          <EmptyState
            title="No reports available"
            description="Create a report to view your family's vaccination information, clinical histories, and upcoming forecasts in one place."
            actionLabel="Create Report"
            onAction={() => {
              setGenerationSuccess(false);
              setIsGenerateDialogOpen(true);
            }}
          />
        </div>
      )}

      {/* ==========================================
          VIEW MODE: NORMAL WORKSPACE
      ========================================== */}
      {viewState === 'normal' && (
        <>
          {/* 3. REPORT TYPES SECTION */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold font-sora text-foreground tracking-tight">
                  Available Family Reports
                </h2>
                <p className="text-xs text-muted-foreground">
                  Consolidated summaries and chronological clinical records ready to preview or download
                </p>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                {REPORT_TYPES_CONFIG.length} Formats
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {REPORT_TYPES_CONFIG.map((rpt) => {
                const isApplicable = rpt.applicableMembers.includes(selectedMemberId);
                const IconComponent =
                  rpt.id === 'summary'
                    ? FileCheck
                    : rpt.id === 'history'
                    ? History
                    : rpt.id === 'schedule'
                    ? CalendarDays
                    : Users;

                return (
                  <Card
                    key={rpt.id}
                    className="border border-border/80 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
                  >
                    <CardHeader className="pb-3 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <Badge variant={rpt.badgeVariant} className="text-[10px] uppercase font-mono">
                          {rpt.badgeText}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold font-sans text-foreground">
                          {rpt.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {rpt.description}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="py-2 text-[11px] text-muted-foreground space-y-1 border-t border-border/60 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span>Format:</span>
                        <span className="font-semibold text-foreground">{rpt.defaultFormat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Length:</span>
                        <span className="font-mono text-foreground">{rpt.pages}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Updated:</span>
                        <span className="font-mono text-foreground">{rpt.lastGenerated}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-3 pt-2.5 border-t border-border/60 bg-card flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 text-xs font-semibold h-8 gap-1.5"
                        onClick={() => setPreviewReport(MOCK_REPORT_PREVIEWS[rpt.id])}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 shrink-0"
                        title="Download sample PDF"
                        onClick={() => triggerDownloadSimulation(rpt.title)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* 4. CERTIFICATES & DOCUMENTS SECTION */}
          <section className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold font-sora text-foreground tracking-tight flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span>Vaccination Certificates & Official Documents</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Verified clinical proof documents with digital authenticity stamps
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 pl-8 text-xs w-full"
                  />
                </div>

                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger className="h-8.5 text-xs w-[140px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="Vaccine Certificate">Certificates</SelectItem>
                    <SelectItem value="Birth Series Certificate">Birth Series</SelectItem>
                    <SelectItem value="Compliance Document">School Compliance</SelectItem>
                    <SelectItem value="Family Passport">Family Passports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Certificates Table (Desktop) / Cards (Mobile) */}
            {filteredCertificates.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm text-foreground">No vaccination certificates match your filters</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Try adjusting your search terms or switch the active family member filter above.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 text-xs"
                  onClick={() => {
                    setSelectedMemberId('ALL');
                    setSelectedDocType('ALL');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-xl border border-border/80 overflow-hidden bg-card shadow-2xs">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold uppercase tracking-wider font-sans text-muted-foreground">Document Details</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider font-sans text-muted-foreground">Beneficiary</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider font-sans text-muted-foreground">Vaccine / Protection</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider font-sans text-muted-foreground">Issued Date</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider font-sans text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider font-sans text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCertificates.map((cert) => (
                        <TableRow key={cert.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-3">
                            <div className="flex items-start gap-2.5">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                                <FileCheck className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-foreground block hover:text-primary transition-colors cursor-pointer" onClick={() => setPreviewCert(cert)}>
                                  {cert.title}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                  <span className="font-mono text-[10px]">{cert.documentId}</span>
                                  <span>•</span>
                                  <span>{cert.size}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 text-[10px] font-bold border border-primary/20 bg-primary/10 text-primary">
                                <AvatarFallback>{cert.memberName.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-xs font-semibold text-foreground block">{cert.memberName}</span>
                                <span className="text-[10px] text-muted-foreground">{cert.memberRelation}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div>
                              <span className="text-xs font-medium text-foreground block">{cert.vaccine}</span>
                              <span className="text-[11px] text-muted-foreground">{cert.disease}</span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3 text-xs text-muted-foreground font-mono">
                            {cert.issueDate}
                          </TableCell>

                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[10px] py-0.5 font-medium"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{cert.status}</span>
                            </Badge>
                          </TableCell>

                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs px-2.5 gap-1"
                                onClick={() => setPreviewCert(cert)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Download Document"
                                onClick={() => triggerDownloadSimulation(cert.title)}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {filteredCertificates.map((cert) => (
                    <Card key={cert.id} className="p-4 space-y-3 border border-border/80 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 text-[10px] font-bold border border-primary/20 bg-primary/10 text-primary">
                            <AvatarFallback>{cert.memberName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-xs font-bold text-foreground block">{cert.memberName}</span>
                            <span className="text-[10px] text-muted-foreground">{cert.memberRelation}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
                        >
                          {cert.status}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-foreground font-sans">
                          {cert.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Vaccine: <strong>{cert.vaccine}</strong>
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1">
                          <span>{cert.documentId}</span>
                          <span>{cert.issueDate}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8 gap-1.5"
                          onClick={() => setPreviewCert(cert)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Certificate</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 px-3 text-xs gap-1"
                          onClick={() => triggerDownloadSimulation(cert.title)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {/* ==============================================================
          5. REPORT PREVIEW MODAL (DOCUMENT-STYLE PREVIEW)
      ============================================================== */}
      <Dialog open={!!previewReport} onOpenChange={(open) => !open && setPreviewReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border border-border shadow-xl">
          {previewReport && (
            <div className="space-y-0">
              {/* Document Header Bar */}
              <div className="p-6 bg-linear-to-r from-card to-primary/[0.04] border-b border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-xs">
                      V
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground font-sora">VaxAssist AI</h3>
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-mono">
                          Official Standard
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Universal Immunization Intelligence Platform</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs font-mono text-muted-foreground">
                    <div className="font-bold text-foreground">{previewReport.refNumber}</div>
                    <div>Generated: {previewReport.dateGenerated}</div>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3">
                  <h2 className="text-xl font-bold text-foreground font-sora">
                    {previewReport.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {previewReport.subtitle} • Grounded in Indian UIP & WHO Position Papers
                  </p>
                </div>
              </div>

              {/* Document Body */}
              <div className="p-6 space-y-6 text-xs sm:text-sm">
                {/* Beneficiary particulars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-secondary/50 border border-border/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Beneficiary</span>
                    <span className="font-bold text-foreground">{activeMember.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Profile Age</span>
                    <span className="text-foreground">{activeMember.age}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Registry ID</span>
                    <span className="font-mono text-foreground">{activeMember.id === 'ALL' ? 'FAM-PAL-HOUSEHOLD' : `BEN-${activeMember.id.toUpperCase()}`}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Verification</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Registry Verified</span>
                    </span>
                  </div>
                </div>

                {/* Metrics Banner */}
                {previewReport.summaryMetrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(previewReport.summaryMetrics).map(([key, val], idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border/60 bg-card text-center space-y-0.5">
                        <span className="text-[10px] uppercase text-muted-foreground font-medium block">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-bold text-base text-primary font-mono block">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Section Specific Content */}
                {previewReport.sections && previewReport.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider font-sora">
                      {sec.title}
                    </h4>
                    {sec.content && (
                      <p className="text-xs text-foreground leading-relaxed">
                        {sec.content}
                      </p>
                    )}
                    {sec.items && (
                      <ul className="space-y-1.5 text-xs text-foreground list-disc pl-4">
                        {sec.items.map((item, i) => (
                          <li key={i} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {/* Table Data (for History or Schedule reports) */}
                {previewReport.tableData && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider font-sora">
                      Clinical Record Breakdown
                    </h4>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/40 text-[11px]">
                          <TableRow>
                            <TableHead className="py-2">Vaccine</TableHead>
                            <TableHead className="py-2">Milestone / Dose</TableHead>
                            <TableHead className="py-2">Date</TableHead>
                            <TableHead className="py-2">Facility / Clinic</TableHead>
                            <TableHead className="py-2">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {previewReport.tableData.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="py-2 font-semibold text-foreground">{row.vaccine}</TableCell>
                              <TableCell className="py-2 text-muted-foreground">{row.dose || row.beneficiary}</TableCell>
                              <TableCell className="py-2 font-mono text-muted-foreground">{row.date || row.dueDate}</TableCell>
                              <TableCell className="py-2 text-muted-foreground">{row.clinic}</TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {row.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Family Summary Table */}
                {previewReport.familyMembersSummary && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider font-sora">
                      Household Member Overview
                    </h4>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/40 text-[11px]">
                          <TableRow>
                            <TableHead className="py-2">Member</TableHead>
                            <TableHead className="py-2">Relationship</TableHead>
                            <TableHead className="py-2">Coverage</TableHead>
                            <TableHead className="py-2">Recorded Doses</TableHead>
                            <TableHead className="py-2">Current Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {previewReport.familyMembersSummary.map((mem, i) => (
                            <TableRow key={i}>
                              <TableCell className="py-2 font-bold text-foreground">{mem.name}</TableCell>
                              <TableCell className="py-2 text-muted-foreground">{mem.relationship} ({mem.age})</TableCell>
                              <TableCell className="py-2 font-mono text-primary font-semibold">{mem.coverage}</TableCell>
                              <TableCell className="py-2 font-mono">{mem.completed}</TableCell>
                              <TableCell className="py-2 text-xs">
                                <span className={mem.attention.includes('Overdue') ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                                  {mem.attention}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Official Disclaimer Watermark Notice */}
                <div className="p-3 rounded-lg border border-border/80 bg-muted/30 text-[11px] text-muted-foreground leading-relaxed">
                  <strong>Notice:</strong> This document is a generated healthcare demonstration summary provided by VaxAssist AI. It reflects patient entries verified against the Universal Immunization Programme (UIP). For medical advice or school legal exemptions, consult your attending pediatrician.
                </div>
              </div>

              {/* Document Actions Footer */}
              <div className="p-4 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-muted-foreground font-mono">
                  Engine: {previewReport.generatedBy}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-8.5"
                    onClick={() => {
                      triggerDownloadSimulation(previewReport.title);
                      setPreviewReport(null);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-8.5"
                    onClick={() => setPreviewReport(null)}
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==============================================================
          6. CERTIFICATE VIEWER MODAL
      ============================================================== */}
      <Dialog open={!!previewCert} onOpenChange={(open) => !open && setPreviewCert(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border border-border shadow-xl">
          {previewCert && (
            <div className="space-y-0">
              {/* Certificate Border & Header */}
              <div className="p-6 bg-linear-to-b from-card to-primary/[0.04] border-b border-border text-center space-y-3">
                <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 mx-auto">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-mono tracking-wider uppercase mb-1">
                    Universal Immunization Programme Standard
                  </Badge>
                  <h3 className="text-xl font-bold font-sora text-foreground">
                    Vaccination Verification Certificate
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official Immunization Record • National Health ID Compliant
                  </p>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="p-6 space-y-5 text-xs sm:text-sm">
                {/* Beneficiary particulars */}
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/80 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Beneficiary Information
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Full Name:</span>
                      <p className="font-bold text-foreground text-sm">{previewCert.memberName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Relationship / Age:</span>
                      <p className="font-semibold text-foreground">{previewCert.memberRelation} • {previewCert.memberAge}</p>
                    </div>
                  </div>
                </div>

                {/* Vaccination Specifics */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02] space-y-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    Vaccine Administration Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Vaccine Administered:</span>
                      <p className="font-bold text-foreground">{previewCert.vaccine}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target Pathogen:</span>
                      <p className="font-semibold text-foreground">{previewCert.disease}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date Administered:</span>
                      <p className="font-mono font-bold text-foreground">{previewCert.issueDate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Batch / Lot Number:</span>
                      <p className="font-mono text-primary font-bold">{previewCert.batchNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Healthcare Facility:</span>
                      <p className="text-foreground">{previewCert.facility}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Attending Clinician:</span>
                      <p className="text-foreground">{previewCert.clinician}</p>
                    </div>
                  </div>
                </div>

                {/* Cryptographic / QR Verification Simulation */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-card border border-border text-foreground shrink-0">
                      <QrCode className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block">
                        Digital Verification Key
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        {previewCert.documentId}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        SHA-256 Digitally Signed by Healthcare Facility
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono shrink-0">
                    VALID
                  </Badge>
                </div>

                <div className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Demonstration Record issued under VaxAssist AI Healthcare Standard. Not an official legal government certificate.
                </div>
              </div>

              {/* Certificate Actions Footer */}
              <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8.5 gap-1.5"
                  onClick={() => triggerDownloadSimulation(previewCert.title)}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Document</span>
                </Button>

                <Button
                  size="sm"
                  className="text-xs h-8.5"
                  onClick={() => setPreviewCert(null)}
                >
                  Close Certificate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==============================================================
          7. GENERATE REPORT DIALOG
      ============================================================== */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {!generationSuccess ? (
            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <DialogHeader>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <FileText className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold font-sora">
                  Generate Vaccination Report
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Custom-tailor an immunization summary or comprehensive history report for your family.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-1 text-xs">
                {/* Member selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Select Family Member</Label>
                  <Select
                    value={generateForm.memberId}
                    onValueChange={(val) => setGenerateForm({ ...generateForm, memberId: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Select Member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Entire Family (All Members)</SelectItem>
                      <SelectItem value="fam-1">Aarav Pal (Son, 8 yrs)</SelectItem>
                      <SelectItem value="fam-2">Anaya Pal (Daughter, 4 yrs)</SelectItem>
                      <SelectItem value="fam-3">Meera Pal (Mother, 32 yrs)</SelectItem>
                      <SelectItem value="fam-4">Raj Pal (Father, 35 yrs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Report Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Report Format</Label>
                  <Select
                    value={generateForm.reportType}
                    onValueChange={(val) => setGenerateForm({ ...generateForm, reportType: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Select Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Vaccination Summary (Executive Overview)</SelectItem>
                      <SelectItem value="history">Vaccination History Ledger (Complete Records)</SelectItem>
                      <SelectItem value="schedule">Upcoming Immunization Forecast Schedule</SelectItem>
                      <SelectItem value="family">Combined Family Vaccination Portfolio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Date Range</Label>
                  <Select
                    value={generateForm.dateRange}
                    onValueChange={(val) => setGenerateForm({ ...generateForm, dateRange: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Select Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_TIME">Complete Lifetime History</SelectItem>
                      <SelectItem value="PAST_YEAR">Past 12 Months Only</SelectItem>
                      <SelectItem value="UPCOMING_YEAR">Upcoming 12-Month Forecast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Checkbox Options */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-semibold text-foreground">Include in Report:</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="opt-history"
                      checked={generateForm.includeHistory}
                      onCheckedChange={(checked) => setGenerateForm({ ...generateForm, includeHistory: checked })}
                    />
                    <label htmlFor="opt-history" className="text-xs text-foreground font-medium cursor-pointer">
                      Include historical administered vaccines and clinic notes
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="opt-schedule"
                      checked={generateForm.includeSchedule}
                      onCheckedChange={(checked) => setGenerateForm({ ...generateForm, includeSchedule: checked })}
                    />
                    <label htmlFor="opt-schedule" className="text-xs text-foreground font-medium cursor-pointer">
                      Include upcoming schedule forecasts and due dates
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="opt-certs"
                      checked={generateForm.includeCertificates}
                      onCheckedChange={(checked) => setGenerateForm({ ...generateForm, includeCertificates: checked })}
                    />
                    <label htmlFor="opt-certs" className="text-xs text-foreground font-medium cursor-pointer">
                      Include certificate IDs & verified batch numbers
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGenerateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating Report...</span>
                    </>
                  ) : (
                    <span>Generate Report</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            /* Success State */
            <div className="text-center py-4 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold font-sora text-foreground">
                  Report ready
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Your vaccination summary has been prepared with up-to-date family immunization records.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 text-left text-xs space-y-1">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Document:</span>
                  <span>Vaccination Summary Report.pdf</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Beneficiary:</span>
                  <span>{generateForm.memberId === 'ALL' ? 'Entire Family' : INITIAL_FAMILY_MEMBERS.find(m => m.id === generateForm.memberId)?.name || 'Member'}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready for Download</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Button
                  size="sm"
                  className="w-full sm:w-auto text-xs gap-1.5"
                  onClick={() => {
                    setIsGenerateDialogOpen(false);
                    setPreviewReport(MOCK_REPORT_PREVIEWS[generateForm.reportType] || MOCK_REPORT_PREVIEWS.summary);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Report</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto text-xs gap-1.5"
                  onClick={() => {
                    triggerDownloadSimulation('Vaccination Summary Report');
                    setIsGenerateDialogOpen(false);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full sm:w-auto text-xs"
                  onClick={handleResetGenerateForm}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
