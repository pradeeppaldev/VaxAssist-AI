import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Syringe,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  FileCheck,
  Eye,
  ShieldCheck,
  Building,
  User,
  ArrowRight,
  Upload,
  X,
  FileText,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Calendar,
  AlertCircle,
  Check
} from 'lucide-react';

// Common Components
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/healthcare/StatusBadge';

// shadcn UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogClose,
} from '@/components/ui/dialog';

// Mock Data
import {
  MOCK_CLINICAL_VACCINATION_RECORDS,
  MOCK_CLINICAL_REVIEWS_QUEUE,
  MOCK_PATIENTS_REGISTRY,
  MOCK_HEALTHCARE_WORKER,
} from '@/data/mockHealthcareData';

export default function HealthcareVaccinationsPage() {
  // Interactive testing state preview
  const [viewState, setViewState] = useState('normal');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [patientFilter, setPatientFilter] = useState('ALL');

  // Dialog States
  const [selectedRecordDetail, setSelectedRecordDetail] = useState(null);
  const [recordToVerify, setRecordToVerify] = useState(null);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Record Form State
  const [newRecordForm, setNewRecordForm] = useState({
    patientId: 'pat-1',
    vaccine: 'Measles-Rubella (MR - Dose 1)',
    doseNumber: 'Booster 1',
    adminDate: '2026-09-25',
    batchNumber: 'MR-7782A-IND',
    site: 'Right Deltoid (SC)',
    facility: 'Primary Health Center North',
    notes: 'Administered under Universal Immunization Programme standards. Observed for 20 mins.',
    uploadedFile: { name: 'Signed_Vaccine_Vial_Batch_Log.pdf', size: '1.2 MB', type: 'PDF Document' },
  });
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [recordSuccess, setRecordSuccess] = useState(false);

  // Feedback Toast simulation
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Clinical Records
  const filteredRecords = useMemo(() => {
    return MOCK_CLINICAL_VACCINATION_RECORDS.filter((rec) => {
      // Status filter
      if (statusFilter !== 'ALL' && rec.verificationStatus !== statusFilter) {
        return false;
      }
      // Patient filter
      if (patientFilter !== 'ALL' && rec.patientId !== patientFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = rec.patientName.toLowerCase().includes(q);
        const matchVaccine = rec.vaccine.toLowerCase().includes(q);
        const matchBatch = rec.batchNumber.toLowerCase().includes(q);
        if (!matchName && !matchVaccine && !matchBatch) return false;
      }
      return true;
    });
  }, [searchQuery, statusFilter, patientFilter]);

  // Handle Form Submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsSubmittingRecord(true);
    setTimeout(() => {
      setIsSubmittingRecord(false);
      setRecordSuccess(true);
    }, 1100);
  };

  const handleResetForm = () => {
    setRecordSuccess(false);
    setIsSubmittingRecord(false);
    setIsAddRecordOpen(false);
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
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('loading')}>Loading</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('empty')}>Empty</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Error State</Button>
          </div>
        </div>

        <PageHeader
          title="Clinical Vaccination Records"
          description="Log, audit, and certify administered vaccine doses under National Immunization Schedule (UIP) standards."
        />

        <div className="my-12">
          <ErrorState
            title="We couldn't load clinical records"
            description="The clinical vaccination database encountered a temporary retrieval error. Please try again."
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

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-xs py-2.5 px-4 rounded-xl shadow-lg border border-border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Clinical Vaccination Records"
          description="Log, audit, and certify administered vaccine doses under National Immunization Schedule (UIP) standards."
        />

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <Button
            onClick={() => {
              setRecordSuccess(false);
              setIsAddRecordOpen(true);
            }}
            className="gap-2 h-10 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Record Administered Dose</span>
          </Button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <Card className="border border-border/80 shadow-2xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by patient, vaccine, or batch number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9.5 pl-9 text-xs sm:text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px] text-xs h-9.5">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                <SelectItem value="NEEDS_CORRECTION">Needs Correction</SelectItem>
                <SelectItem value="CLINICAL_REVIEW">Clinical Review</SelectItem>
              </SelectContent>
            </Select>

            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="w-[160px] text-xs h-9.5">
                <SelectValue placeholder="All Patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Patients</SelectItem>
                {MOCK_PATIENTS_REGISTRY.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'ALL' || patientFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9.5 text-xs px-2.5"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setPatientFilter('ALL');
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
          VIEW MODE: LOADING STATE
      ========================================== */}
      {viewState === 'loading' && (
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      )}

      {/* ==========================================
          VIEW MODE: EMPTY STATE
      ========================================== */}
      {viewState === 'empty' && (
        <div className="my-8">
          <EmptyState
            title="No vaccination records found"
            description="There are currently no clinical vaccination records matching your search or filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setPatientFilter('ALL');
              setViewState('normal');
            }}
          />
        </div>
      )}

      {/* ==========================================
          VIEW MODE: NORMAL WORKSPACE
      ========================================== */}
      {viewState === 'normal' && (
        <>
          {/* SECTION 11: CLINICAL REVIEW QUEUE CALLOUT */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-sora text-foreground tracking-tight flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                  <span>Clinical Review &amp; Exception Queue</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Doses requiring physician batch endorsement, interval contraindication evaluation, or correction
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {MOCK_CLINICAL_REVIEWS_QUEUE.length} Items
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {MOCK_CLINICAL_REVIEWS_QUEUE.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 border border-border/80 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <Badge variant={item.badgeVariant} className="text-[10px] font-mono">
                        {item.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{item.date}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-foreground font-sans">
                        {item.patientName} ({item.age})
                      </h4>
                      <p className="text-[11px] font-semibold text-primary mt-0.5">
                        {item.issue}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-semibold h-7.5 justify-between"
                    onClick={() => {
                      const matched = MOCK_CLINICAL_VACCINATION_RECORDS.find(r => r.patientId === item.patientId);
                      setRecordToVerify(matched || MOCK_CLINICAL_VACCINATION_RECORDS[0]);
                    }}
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Card>
              ))}
            </div>
          </section>

          {/* MAIN CLINICAL RECORDS DATA TABLE */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Showing <strong>{filteredRecords.length}</strong> official clinical entries</span>
              <span className="font-mono">Standards: Universal Immunization Programme (UIP)</span>
            </div>

            {filteredRecords.length === 0 ? (
              <Card className="p-10 text-center border-dashed border-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-3">
                  <Syringe className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm text-foreground">No records match your criteria</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Try adjusting the verification status or patient filters above.
                </p>
              </Card>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-xl border border-border/80 overflow-hidden bg-card shadow-2xs">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Patient</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vaccine &amp; Dose</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administration Date</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Batch / Lot</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Provider &amp; Clinic</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((rec) => (
                        <TableRow key={rec.id} className="hover:bg-muted/30 transition-colors">
                          {/* Patient */}
                          <TableCell className="py-3">
                            <div>
                              <Link
                                to={`/healthcare/patients/${rec.patientId}`}
                                className="font-bold text-xs text-foreground hover:text-primary transition-colors block"
                              >
                                {rec.patientName}
                              </Link>
                              <span className="text-[11px] text-muted-foreground">
                                {rec.patientAge} • {rec.patientFamily}
                              </span>
                            </div>
                          </TableCell>

                          {/* Vaccine */}
                          <TableCell className="py-3">
                            <span className="font-bold text-xs text-foreground block">{rec.vaccine}</span>
                            <span className="text-[11px] text-primary">{rec.dose}</span>
                          </TableCell>

                          {/* Admin Date */}
                          <TableCell className="py-3 text-xs font-mono text-foreground">
                            {rec.adminDate}
                          </TableCell>

                          {/* Batch */}
                          <TableCell className="py-3 text-xs font-mono text-primary font-bold">
                            {rec.batchNumber}
                          </TableCell>

                          {/* Provider */}
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground block">{rec.provider}</span>
                            <span className="text-[11px]">{rec.facility}</span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={
                                rec.verificationStatus === 'VERIFIED'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]'
                                  : rec.verificationStatus === 'NEEDS_CORRECTION'
                                  ? 'border-destructive/30 bg-destructive/10 text-destructive text-[10px]'
                                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]'
                              }
                            >
                              {rec.verificationStatus === 'VERIFIED'
                                ? 'Verified by MD'
                                : rec.verificationStatus === 'NEEDS_CORRECTION'
                                ? 'Needs Correction'
                                : 'Pending Verification'}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7.5 text-xs px-2.5 gap-1 font-semibold"
                                onClick={() => setSelectedRecordDetail(rec)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Detail</span>
                              </Button>

                              {rec.verificationStatus !== 'VERIFIED' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7.5 text-xs px-2.5 font-semibold"
                                  onClick={() => setRecordToVerify(rec)}
                                >
                                  Verify
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {filteredRecords.map((rec) => (
                    <Card key={rec.id} className="p-4 space-y-3 border border-border/80 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/healthcare/patients/${rec.patientId}`}
                            className="font-bold text-xs text-foreground hover:text-primary transition-colors block"
                          >
                            {rec.patientName} ({rec.patientAge})
                          </Link>
                          <span className="text-[10px] text-muted-foreground">{rec.patientFamily}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            rec.verificationStatus === 'VERIFIED'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]'
                          }
                        >
                          {rec.verificationStatus}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vaccine:</span>
                          <span className="font-semibold text-foreground">{rec.vaccine} ({rec.dose})</span>
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-muted-foreground">Batch:</span>
                          <span className="text-primary font-bold">{rec.batchNumber}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Administered:</span>
                          <span>{rec.adminDate}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8"
                          onClick={() => setSelectedRecordDetail(rec)}
                        >
                          View Detail
                        </Button>
                        {rec.verificationStatus !== 'VERIFIED' && (
                          <Button
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => setRecordToVerify(rec)}
                          >
                            Verify Record
                          </Button>
                        )}
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
          MODAL 1: RECORD DETAIL VIEW (SECTION 3)
      ============================================================== */}
      <Dialog open={!!selectedRecordDetail} onOpenChange={(open) => !open && setSelectedRecordDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedRecordDetail && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    ID: {selectedRecordDetail.id}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Updated: {selectedRecordDetail.lastUpdated}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold font-sora pt-1">
                  Clinical Vaccination Record
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Universal Immunization Registry detailed dose profile and verification history.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-1 text-xs">
                {/* Patient Information */}
                <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Patient Particulars
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{selectedRecordDetail.patientName}</h4>
                      <p className="text-muted-foreground text-[11px]">{selectedRecordDetail.patientFamily} • DOB: {selectedRecordDetail.patientDob}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                      <Link to={`/healthcare/patients/${selectedRecordDetail.patientId}`}>
                        Open Profile
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Vaccine & Cold-Chain Batch Information */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/[0.02]">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Vaccine:</span>
                    <strong className="text-foreground">{selectedRecordDetail.vaccine}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Dose Milestone:</span>
                    <strong className="text-foreground">{selectedRecordDetail.dose}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Administered Date:</span>
                    <span className="font-mono font-semibold text-foreground">{selectedRecordDetail.adminDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Batch Number:</span>
                    <span className="font-mono text-primary font-bold">{selectedRecordDetail.batchNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Site &amp; Route:</span>
                    <span className="text-foreground">{selectedRecordDetail.site}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Facility:</span>
                    <span className="text-foreground">{selectedRecordDetail.facility}</span>
                  </div>
                </div>

                {/* Verification Section */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Verification State:</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {selectedRecordDetail.verificationStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Certified By:</span>
                    <span className="font-semibold text-foreground">{selectedRecordDetail.verifiedBy}</span>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div className="p-3 rounded-lg bg-card border border-border/80 text-[11px] text-muted-foreground leading-relaxed">
                  <strong>Clinical Observations:</strong> {selectedRecordDetail.notes}
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecordDetail(null)}
                >
                  Close
                </Button>
                {selectedRecordDetail.hasCertificate ? (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      showToast(`Digital certificate ${selectedRecordDetail.certificateId} ready`);
                      setSelectedRecordDetail(null);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>View Certificate</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      showToast(`Issued digital certificate for ${selectedRecordDetail.vaccine}`);
                      setSelectedRecordDetail(null);
                    }}
                  >
                    Generate Certificate
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==============================================================
          MODAL 2: VERIFY RECORD WORKFLOW (SECTION 4)
      ============================================================== */}
      <Dialog open={!!recordToVerify} onOpenChange={(open) => !open && setRecordToVerify(null)}>
        <DialogContent className="sm:max-w-md">
          {recordToVerify && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px] font-mono">
                    Verification Workflow
                  </Badge>
                </div>
                <DialogTitle className="text-base font-bold font-sora pt-1">
                  Certify Dose: {recordToVerify.vaccine}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Confirm cold-chain lot registration and validate adherence with National Immunization Schedule (UIP).
                </DialogDescription>
              </DialogHeader>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between font-sans">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-bold text-foreground">{recordToVerify.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Batch Number:</span>
                  <span className="text-primary font-bold">{recordToVerify.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Administered Date:</span>
                  <span className="text-foreground">{recordToVerify.adminDate}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-[11px] text-muted-foreground leading-relaxed">
                By clicking <strong>Verify &amp; Sign</strong>, this record will be cryptographically marked as verified by <strong>{MOCK_HEALTHCARE_WORKER.name}</strong> and published to the patient's official digital health wallet.
              </div>

              <DialogFooter className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecordToVerify(null)}
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      showToast(`Flagged ${recordToVerify.vaccine} for parent correction`);
                      setRecordToVerify(null);
                    }}
                  >
                    Request Correction
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={() => {
                      showToast(`Verified and digitally signed ${recordToVerify.vaccine}`);
                      setRecordToVerify(null);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Verify &amp; Sign</span>
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==============================================================
          MODAL 3: ADD / UPDATE ADMINISTERED VACCINATION CLINICAL FORM (SECTION 5 & 6)
      ============================================================== */}
      <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {!recordSuccess ? (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <DialogHeader>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <Syringe className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold font-sora">
                  Administer &amp; Certify Vaccination
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record full clinical administration specifics, cold-chain batch lot, and certificate documentation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-1 text-xs">
                {/* 1. Patient Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">1. Patient &amp; Beneficiary</Label>
                  <Select
                    value={newRecordForm.patientId}
                    onValueChange={(val) => setNewRecordForm({ ...newRecordForm, patientId: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Select Patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_PATIENTS_REGISTRY.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.age}, {p.family})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Vaccine & Dose */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">2. Vaccine &amp; Milestone Dose</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Input
                      value={newRecordForm.vaccine}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, vaccine: e.target.value })}
                      placeholder="e.g. Measles-Rubella (MR - Dose 1)"
                      className="text-xs h-9"
                      required
                    />
                    <Input
                      value={newRecordForm.doseNumber}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, doseNumber: e.target.value })}
                      placeholder="e.g. Dose 1 or Booster 1"
                      className="text-xs h-9"
                      required
                    />
                  </div>
                </div>

                {/* 3. Batch Lot & Administration Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">3. Cold-Chain Batch &amp; Date</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Input
                      value={newRecordForm.batchNumber}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, batchNumber: e.target.value })}
                      placeholder="Batch Lot (e.g. MR-7782A-IND)"
                      className="text-xs h-9 font-mono"
                      required
                    />
                    <Input
                      type="date"
                      value={newRecordForm.adminDate}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, adminDate: e.target.value })}
                      className="text-xs h-9 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* 4. Anatomical Site & Facility */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">4. Administration Route &amp; Facility</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Input
                      value={newRecordForm.site}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, site: e.target.value })}
                      placeholder="Site (e.g. Right Deltoid, SC)"
                      className="text-xs h-9"
                    />
                    <Input
                      value={newRecordForm.facility}
                      onChange={(e) => setNewRecordForm({ ...newRecordForm, facility: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* 5. Clinical Observations */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">5. Clinical Notes &amp; Adverse Reaction Monitoring</Label>
                  <Textarea
                    rows={2}
                    value={newRecordForm.notes}
                    onChange={(e) => setNewRecordForm({ ...newRecordForm, notes: e.target.value })}
                    className="text-xs"
                    placeholder="Enter observation notes, cold-chain checks, or patient tolerance..."
                  />
                </div>

                {/* 6. Section 6: Certificate Upload UI */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <Label className="text-xs font-semibold">6. Certificate / Physical Document Attachment</Label>

                  {newRecordForm.uploadedFile ? (
                    <div className="p-3 rounded-xl border border-border/80 bg-secondary/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-foreground block">{newRecordForm.uploadedFile.name}</span>
                          <span className="text-[10px] text-muted-foreground">{newRecordForm.uploadedFile.size} • {newRecordForm.uploadedFile.type}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setNewRecordForm({ ...newRecordForm, uploadedFile: null })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="p-6 border-2 border-dashed border-border/80 rounded-xl text-center space-y-1.5 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => setNewRecordForm({
                        ...newRecordForm,
                        uploadedFile: { name: 'Signed_Vaccine_Vial_Batch_Log.pdf', size: '1.2 MB', type: 'PDF Document' }
                      })}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                      <p className="font-semibold text-xs text-foreground">Click to upload physical certificate or vial sticker</p>
                      <p className="text-[10px] text-muted-foreground">PDF, JPEG, or PNG up to 10 MB</p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddRecordOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingRecord}
                  className="gap-2"
                >
                  {isSubmittingRecord ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                      <span>Certifying Record...</span>
                    </>
                  ) : (
                    <span>Submit &amp; Certify Dose</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="text-center py-5 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold font-sora text-foreground">
                  Vaccination Certified &amp; Registered
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {newRecordForm.vaccine} ({newRecordForm.doseNumber}) was registered into the universal ledger with batch {newRecordForm.batchNumber}.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Beneficiary:</span>
                  <span className="text-foreground font-bold font-sans">{MOCK_PATIENTS_REGISTRY.find(p => p.id === newRecordForm.patientId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Lot Number:</span>
                  <span className="text-primary font-bold">{newRecordForm.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Certified By:</span>
                  <span className="text-foreground font-sans">{MOCK_HEALTHCARE_WORKER.name}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-2">
                <Button size="sm" onClick={handleResetForm}>
                  Close &amp; Return
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
