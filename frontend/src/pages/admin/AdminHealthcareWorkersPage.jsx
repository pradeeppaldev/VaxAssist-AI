import React, { useState, useMemo } from 'react';
import { 
  Stethoscope, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  FileCheck, 
  Building2, 
  Award, 
  FileText, 
  Check, 
  Sliders, 
  Download, 
  ExternalLink, 
  AlertTriangle,
  UserCheck,
  HelpCircle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileQuestion,
  Sparkles
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MOCK_HEALTHCARE_WORKERS_ADMIN } from '@/data/mockAdminData';

export function AdminHealthcareWorkersPage() {
  const [workers, setWorkers] = useState(MOCK_HEALTHCARE_WORKERS_ADMIN);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'

  // Filter Tabs
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'REQUIRES_REVIEW' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');
  const [councilFilter, setCouncilFilter] = useState('ALL');

  // Review Modal State
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  // Confirmation Alert Dialogs
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [requestReviewNoticeOpen, setRequestReviewNoticeOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  // Document preview simulation
  const [previewingDoc, setPreviewingDoc] = useState(null);

  // Filtered workers calculation
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      // Tab matching
      if (activeTab !== 'ALL' && w.verificationStatus !== activeTab) {
        return false;
      }

      // Council matching
      if (councilFilter !== 'ALL' && !w.medicalCouncil.includes(councilFilter)) {
        return false;
      }

      // Search matching
      const matchesSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.facility.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.degree && w.degree.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [workers, activeTab, councilFilter, searchQuery]);

  // Tab counts
  const pendingCount = workers.filter((w) => w.verificationStatus === 'PENDING').length;
  const verifiedCount = workers.filter((w) => w.verificationStatus === 'VERIFIED').length;
  const requiresReviewCount = workers.filter((w) => w.verificationStatus === 'REQUIRES_REVIEW').length;
  const rejectedCount = workers.filter((w) => w.verificationStatus === 'REJECTED').length;

  const handleOpenReview = (worker) => {
    setSelectedWorker(worker);
    setReviewNote(worker.notes || '');
    setReviewModalOpen(true);
  };

  const executeApproval = () => {
    if (!selectedWorker) return;
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === selectedWorker.id) {
          return {
            ...w,
            verificationStatus: 'VERIFIED',
            account_status: 'ACTIVE',
            approvedBy: 'System Administrator (Pradeep Pal)',
            approvedAt: new Date().toISOString(),
            notes: reviewNote ? `${reviewNote} — Approved by Admin` : 'Approved by System Admin',
          };
        }
        return w;
      })
    );
    setToastNotice(`Dr. ${selectedWorker.name.replace('Dr. ', '')} successfully verified & clinical signing key issued.`);
    setConfirmApproveOpen(false);
    setReviewModalOpen(false);
    setTimeout(() => setToastNotice(null), 5000);
  };

  const executeRejection = () => {
    if (!selectedWorker) return;
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === selectedWorker.id) {
          return {
            ...w,
            verificationStatus: 'REJECTED',
            account_status: 'INACTIVE',
            reviewedBy: 'System Administrator',
            reviewedAt: new Date().toISOString(),
            notes: reviewNote || 'Rejected due to credential verification discrepancy.',
          };
        }
        return w;
      })
    );
    setToastNotice(`Application for ${selectedWorker.name} has been rejected.`);
    setConfirmRejectOpen(false);
    setReviewModalOpen(false);
    setTimeout(() => setToastNotice(null), 5000);
  };

  const executeRequestReview = () => {
    if (!selectedWorker) return;
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === selectedWorker.id) {
          return {
            ...w,
            verificationStatus: 'REQUIRES_REVIEW',
            notes: reviewNote || 'Additional documentation requested by administrator.',
          };
        }
        return w;
      })
    );
    setToastNotice(`Inquiry dispatched to Dr. ${selectedWorker.name.replace('Dr. ', '')} for supplemental verification documents.`);
    setRequestReviewNoticeOpen(false);
    setReviewModalOpen(false);
    setTimeout(() => setToastNotice(null), 5000);
  };

  const clearFilters = () => {
    setActiveTab('ALL');
    setSearchQuery('');
    setCouncilFilter('ALL');
  };

  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Healthcare Worker Approvals" 
          subtitle="Review pending medical registration requests, verify medical licenses, and approve or reject clinical accounts."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Healthcare Workers' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <LoadingState text="Fetching medical council registries and practitioner applications..." />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Healthcare Worker Approvals" 
          subtitle="Review pending medical registration requests, verify medical licenses, and approve or reject clinical accounts."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Healthcare Workers' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <ErrorState 
          title="Medical Registry Gateway Unreachable" 
          message="National Medical Commission (NMC) verification sync timed out. Please retry."
          onRetry={() => setViewState('normal')}
        />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Healthcare Worker Approvals" 
          subtitle="Review pending medical registration requests, verify medical licenses, and approve or reject clinical accounts."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Healthcare Workers' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <EmptyState 
          icon={Stethoscope}
          title="No Healthcare Worker Applications"
          description="There are currently no practitioner records registered in this queue."
          actionText="Reset Directory"
          onAction={() => setViewState('normal')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <PageHeader
        title="Healthcare Worker Verification"
        subtitle="Review medical registration requests, verify medical council licenses, and authorize clinical vaccine administration privileges."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Healthcare Workers' },
        ]}
        badge={
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-mono text-xs">
            {pendingCount} Pending Review
          </Badge>
        }
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setToastNotice('Registry export prepared: CSV generated with 10 records.')}
            className="text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Registry</span>
          </Button>
        }
      />

      {/* State Inspector */}
      <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />

      {/* Toast Alert Notice */}
      {toastNotice && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-slideDown">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{toastNotice}</span>
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'ALL'
              ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Practitioners ({workers.length})
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'PENDING'
              ? 'bg-card text-amber-700 dark:text-amber-400 font-semibold shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-3 w-3" />
          <span>Pending Review</span>
          <span className="ml-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-300">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFIED')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'VERIFIED'
              ? 'bg-card text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-3 w-3" />
          <span>Verified ({verifiedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUIRES_REVIEW')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'REQUIRES_REVIEW'
              ? 'bg-card text-indigo-700 dark:text-indigo-400 font-semibold shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <HelpCircle className="h-3 w-3" />
          <span>Requires Action ({requiresReviewCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'REJECTED'
              ? 'bg-card text-rose-700 dark:text-rose-400 font-semibold shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <XCircle className="h-3 w-3" />
          <span>Rejected ({rejectedCount})</span>
        </button>
      </div>

      {/* Search & State Council Filters */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by doctor name, license number, hospital or qualification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            <div className="w-full sm:w-60">
              <Select value={councilFilter} onValueChange={setCouncilFilter}>
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All State Medical Councils" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All State Councils</SelectItem>
                  <SelectItem value="Delhi">Delhi Medical Council</SelectItem>
                  <SelectItem value="Karnataka">Karnataka Medical Council</SelectItem>
                  <SelectItem value="Maharashtra">Maharashtra Medical Council</SelectItem>
                  <SelectItem value="West Bengal">West Bengal Medical Council</SelectItem>
                  <SelectItem value="Kerala">Travancore-Cochin Council</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || councilFilter !== 'ALL' || activeTab !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                Reset All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Directory Table / Cards */}
      {filteredWorkers.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No healthcare workers match this criteria"
          description="Adjust your search term or select a different status filter tab."
          actionText="Reset Filter Tabs"
          onAction={clearFilters}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[280px] font-semibold text-xs text-foreground">Practitioner</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">Facility & Specialization</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">License & Council Reg</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">Verification</TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">Submitted</TableHead>
                  <TableHead className="text-right font-semibold text-xs text-foreground pr-6">Review Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow key={worker.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={worker.avatar}
                          alt={worker.name}
                          className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">
                            {worker.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {worker.degree}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs text-muted-foreground">
                      <div className="font-medium text-foreground truncate max-w-[220px]">
                        {worker.facility}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {worker.department} &bull; {worker.location}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs">
                      <div className="font-mono font-bold text-primary">
                        {worker.licenseNumber}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {worker.medicalCouncil}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <StatusBadge status={worker.verificationStatus} size="sm" />
                    </TableCell>

                    <TableCell className="py-3.5 text-xs text-muted-foreground font-mono">
                      {worker.submittedAgo}
                    </TableCell>

                    <TableCell className="py-3.5 text-right pr-6">
                      <Button
                        variant={worker.verificationStatus === 'PENDING' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleOpenReview(worker)}
                        className={`h-8 px-3 text-xs gap-1.5 ${
                          worker.verificationStatus === 'PENDING'
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : ''
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{worker.verificationStatus === 'PENDING' ? 'Review & Sign' : 'Inspect Profile'}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Stack (<768px) */}
          <div className="md:hidden space-y-3">
            {filteredWorkers.map((worker) => (
              <Card key={worker.id} className="border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="h-11 w-11 rounded-full object-cover border border-border shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">{worker.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{worker.title}</p>
                    </div>
                  </div>
                  <StatusBadge status={worker.verificationStatus} size="sm" />
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reg Number:</span>
                    <span className="font-mono font-bold text-primary">{worker.licenseNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Council:</span>
                    <span className="text-foreground">{worker.medicalCouncil}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Facility:</span>
                    <span className="font-medium text-foreground truncate max-w-[180px]">{worker.facility}</span>
                  </div>
                </div>

                <Button
                  variant={worker.verificationStatus === 'PENDING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleOpenReview(worker)}
                  className="w-full text-xs gap-1.5 h-9"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{worker.verificationStatus === 'PENDING' ? 'Review Credentials & Sign' : 'View Profile'}</span>
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Credential & Verification Review Modal (Dialog) */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedWorker && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-bold">
                      Clinical Credential Audit & Endorsement
                    </DialogTitle>
                    <StatusBadge status={selectedWorker.verificationStatus} size="sm" />
                  </div>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Verify practitioner identity and state medical council licensure before granting digital signing keys.
                </DialogDescription>
              </DialogHeader>

              {/* Doctor Profile Banner */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={selectedWorker.avatar}
                    alt={selectedWorker.name}
                    className="h-14 w-14 rounded-full object-cover border border-border shrink-0"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-bold text-base text-foreground">{selectedWorker.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedWorker.title}</p>
                    <p className="text-xs text-foreground/90 font-medium flex items-center gap-1 mt-1">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{selectedWorker.facility}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 text-xs text-muted-foreground space-y-1">
                  <div>Department: <strong className="text-foreground">{selectedWorker.department}</strong></div>
                  <div>Location: <strong className="text-foreground">{selectedWorker.location}</strong></div>
                  <div>Submitted: <strong className="text-foreground">{selectedWorker.submittedAgo}</strong></div>
                </div>
              </div>

              {/* Council Licensure Verification Grid */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                  Medical Council Registration Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                    <span className="text-[11px] text-muted-foreground uppercase font-mono">License Number</span>
                    <div className="font-mono font-bold text-sm text-primary">{selectedWorker.licenseNumber}</div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                    <span className="text-[11px] text-muted-foreground uppercase font-mono">Issuing Council</span>
                    <div className="font-semibold text-foreground">{selectedWorker.medicalCouncil}</div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                    <span className="text-[11px] text-muted-foreground uppercase font-mono">Registry Year</span>
                    <div className="font-semibold text-foreground font-mono">{selectedWorker.regYear || 2017}</div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card space-y-1 sm:col-span-3">
                    <span className="text-[11px] text-muted-foreground uppercase font-mono">Academic Qualifications Recognized</span>
                    <div className="font-medium text-foreground">{selectedWorker.degree}</div>
                  </div>
                </div>
              </div>

              {/* Simulated Registry Check Banner */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">National Medical Commission (NMC) Online Registry Check:</span>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Practitioner registration status is ACTIVE with 0 disciplinary flags on the central portal.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40">
                  Verified Online
                </Badge>
              </div>

              {/* Attached Verification Documents Preview */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                  Submitted Verification Documents ({selectedWorker.documents?.length || 0})
                </span>
                <div className="space-y-2">
                  {selectedWorker.documents?.map((doc, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileCheck className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-[11px] text-muted-foreground">{doc.type} &bull; {doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setPreviewingDoc(doc.name)}
                          className="h-7 text-xs gap-1 text-primary"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Preview</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Preview Overlay if triggered */}
              {previewingDoc && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 text-xs space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>Viewing: {previewingDoc}</span>
                    </span>
                    <button 
                      onClick={() => setPreviewingDoc(null)}
                      className="text-xs text-muted-foreground hover:text-foreground font-mono"
                    >
                      Close Preview
                    </button>
                  </div>
                  <div className="p-6 rounded-lg bg-card border border-border text-center text-muted-foreground text-xs font-mono">
                    [Simulated Verified PDF Preview: Medical Council Registration Seal & Signature Verified]
                  </div>
                </div>
              )}

              {/* Audit Reason / Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Administrative Review Notes & Comments</Label>
                <Textarea
                  placeholder="Record your verification notes, document check observations, or sign-off memo..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="text-xs h-20"
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => setReviewModalOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setConfirmRejectOpen(true)}
                  className="text-xs gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject Application</span>
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => setRequestReviewNoticeOpen(true)}
                  className="text-xs gap-1"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Request Review</span>
                </Button>
                <Button 
                  onClick={() => setConfirmApproveOpen(true)}
                  className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve & Authorize Signing</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert for Approval */}
      <AlertDialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Authorize Healthcare Worker?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              This action will grant <strong>{selectedWorker?.name}</strong> clinical signing privileges under IT Act Section 65B.
              Their registered medical license (<strong>{selectedWorker?.licenseNumber}</strong>) will be recorded as the signing authority for all vaccine batches administered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeApproval}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              Confirm Endorsement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Alert for Rejection */}
      <AlertDialog open={confirmRejectOpen} onOpenChange={setConfirmRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>Reject Application?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Are you sure you want to reject the application for <strong>{selectedWorker?.name}</strong>?
              The applicant will be notified via their registered email ({selectedWorker?.email}) with your review comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeRejection}
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Alert for Request Review */}
      <AlertDialog open={requestReviewNoticeOpen} onOpenChange={setRequestReviewNoticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-indigo-600">
              <HelpCircle className="h-5 w-5" />
              <span>Request Additional Review?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              This will update Dr. {selectedWorker?.name}'s application to <strong>Requires Review</strong> and send an automated request to upload updated credentials or CME credit documentation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeRequestReview}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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

export default AdminHealthcareWorkersPage;
