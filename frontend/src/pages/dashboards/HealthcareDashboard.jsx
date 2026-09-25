import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  BadgeCheck,
  Building2,
  Users,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  AlertTriangle,
  CalendarDays,
  Clock,
  ArrowRight,
  Plus,
  Search,
  ShieldCheck,
  Check,
  FileText,
  RotateCcw,
  Eye,
  Activity,
  UserCheck,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';

// Common Components
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/healthcare/StatusBadge';

// shadcn UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  MOCK_HEALTHCARE_WORKER,
  MOCK_HEALTHCARE_METRICS,
  MOCK_TODAY_PRIORITIES,
  MOCK_PENDING_REVIEWS,
  MOCK_TODAY_SCHEDULE,
  MOCK_PATIENTS_REGISTRY,
} from '@/data/mockHealthcareData';

export default function HealthcareDashboard() {
  const navigate = useNavigate();

  // Interactive View Modes: 'normal' | 'loading' | 'empty' | 'error'
  const [viewState, setViewState] = useState('normal');

  // Modal Dialog States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null); // When reviewing a record
  const [verificationFeedback, setVerificationFeedback] = useState(null);

  // New Vaccination Record Form State
  const [recordForm, setRecordForm] = useState({
    patientId: 'pat-1',
    vaccine: 'Measles-Rubella (MR - Dose 1)',
    doseNumber: 'Dose 1',
    adminDate: '2026-09-25',
    batchNumber: 'MR-7782A-IND',
    site: 'Left Deltoid (IM)',
    provider: 'Dr. Sunita Sharma',
    facility: 'Primary Health Center North',
    notes: 'Administered under Universal Immunization Programme. Child tolerated well, no acute reactions during 30 min observation.',
    issueCertificate: true,
  });

  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [recordSubmitSuccess, setRecordSubmitSuccess] = useState(false);

  // Pending Reviews state (allows dismissing / verifying items in UI)
  const [pendingReviews, setPendingReviews] = useState(MOCK_PENDING_REVIEWS);

  // Handle Verify Record Action
  const handleVerifyRecord = (reviewId) => {
    setPendingReviews((prev) => prev.filter((item) => item.id !== reviewId));
    setVerificationFeedback('Record officially verified and digitally signed into Universal Registry.');
    setTimeout(() => {
      setVerificationFeedback(null);
      setSelectedReviewItem(null);
    }, 1500);
  };

  // Handle Record Submit
  const handleRecordSubmit = (e) => {
    e.preventDefault();
    setIsSubmittingRecord(true);
    setTimeout(() => {
      setIsSubmittingRecord(false);
      setRecordSubmitSuccess(true);
    }, 1000);
  };

  const handleResetRecordModal = () => {
    setRecordSubmitSuccess(false);
    setIsSubmittingRecord(false);
    setIsRecordModalOpen(false);
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

        <div className="my-12">
          <ErrorState
            title="Unable to load clinical workspace"
            description="The clinical records and appointment queue service encountered a temporary error. Please try again."
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
            Empty (Caught Up)
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

      {/* 1. CLINICAL DASHBOARD HEADER */}
      <div className="p-6 rounded-2xl border border-border/80 bg-linear-to-r from-card via-card to-primary/[0.04] shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                Good morning, {MOCK_HEALTHCARE_WORKER.name}
              </h1>
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-primary gap-1.5 text-xs py-0.5 px-2.5 font-medium"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span>{MOCK_HEALTHCARE_WORKER.roleBadge}</span>
              </Badge>
            </div>
            <p className="text-sm font-semibold text-primary">
              Here's what needs your clinical attention today.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Wednesday, 25 September 2026</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{MOCK_HEALTHCARE_WORKER.clinicOrHospital}</span>
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">Lic: {MOCK_HEALTHCARE_WORKER.licenseNumber}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
            <Button
              onClick={() => {
                setRecordSubmitSuccess(false);
                setIsRecordModalOpen(true);
              }}
              className="gap-2 h-10 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Record Administered Dose</span>
            </Button>

            <Button
              variant="outline"
              asChild
              className="h-10 text-xs font-semibold gap-1.5"
            >
              <Link to="/healthcare/patients">
                <Users className="h-3.5 w-3.5" />
                <span>Patient Registry</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ==========================================
          VIEW MODE: LOADING STATE
      ========================================== */}
      {viewState === 'loading' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-3 w-3/4" />
              </Card>
            ))}
          </div>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>
      )}

      {/* ==========================================
          VIEW MODE: EMPTY STATE
      ========================================== */}
      {viewState === 'empty' && (
        <div className="my-8">
          <EmptyState
            title="You're all caught up"
            description="There are no pending record verifications, overdue patient recalls, or pending tasks in your clinical inbox today."
            actionLabel="View Patient Registry"
            onAction={() => navigate('/healthcare/patients')}
          />
        </div>
      )}

      {/* ==========================================
          VIEW MODE: NORMAL WORKSPACE
      ========================================== */}
      {viewState === 'normal' && (
        <>
          {/* 2. OVERVIEW METRICS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_HEALTHCARE_METRICS.map((metric, idx) => (
              <MetricCard
                key={idx}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                trend={metric.trend}
                description={metric.description}
              />
            ))}
          </div>

          {/* 3. TODAY'S PRIORITIES SECTION */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold font-sora text-foreground tracking-tight flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                  <span>Today's Clinical Priorities</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Immediate tasks requiring attending physician evaluation and action
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {MOCK_TODAY_PRIORITIES.length} Action Items
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_TODAY_PRIORITIES.map((item) => (
                <Card
                  key={item.id}
                  className="border border-border/80 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 text-xs font-bold border border-primary/20 bg-primary/10 text-primary">
                          <AvatarFallback>{item.patientName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">
                            {item.patientName}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            {item.age} • {item.family}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={item.priority === 'URGENT' ? 'destructive' : item.priority === 'HIGH' ? 'secondary' : 'outline'}
                        className="text-[10px] font-mono uppercase"
                      >
                        {item.priority}
                      </Badge>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="font-semibold text-xs text-foreground block">
                        {item.task}
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </CardHeader>

                  <CardFooter className="p-3 pt-2.5 border-t border-border/60 bg-muted/15 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{item.dueTime}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs font-semibold h-8 gap-1.5"
                      onClick={() => {
                        if (item.actionType === 'RECORD') {
                          setIsRecordModalOpen(true);
                        } else if (item.actionType === 'VERIFY') {
                          const rev = pendingReviews[0];
                          setSelectedReviewItem(rev);
                        } else {
                          navigate(`/healthcare/patients/${item.patientId}`);
                        }
                      }}
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          {/* 4. MAIN DUAL SECTION: PENDING REVIEW QUEUE (LEFT 7) + CLINICAL SCHEDULE (RIGHT 5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* PENDING VERIFICATION QUEUE (7 COLS) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-sora text-foreground tracking-tight flex items-center gap-2">
                    <FileCheck className="h-4.5 w-4.5 text-primary" />
                    <span>Records Awaiting Clinical Verification</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Parent submissions and inter-clinic transfers needing certification
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  {pendingReviews.length} Pending
                </Badge>
              </div>

              {pendingReviews.length === 0 ? (
                <Card className="p-6 text-center border-dashed">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">All pending records verified</p>
                  <p className="text-[11px] text-muted-foreground">No pending items in queue.</p>
                </Card>
              ) : (
                <div className="rounded-xl border border-border/80 overflow-hidden bg-card shadow-2xs">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold text-muted-foreground">Patient & Vaccine</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Date Administered</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReviews.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-3">
                            <div>
                              <span className="font-bold text-xs text-foreground block">
                                {item.patientName}
                              </span>
                              <span className="text-[11px] text-primary font-medium block">
                                {item.vaccine}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {item.reviewReason} • {item.batchNumber}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3 text-xs text-muted-foreground font-mono">
                            {item.dateAdministered}
                          </TableCell>

                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] py-0.5"
                            >
                              {item.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7.5 text-xs px-2.5 gap-1 font-semibold"
                              onClick={() => setSelectedReviewItem(item)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Review</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* TODAY'S CLINICAL SCHEDULE (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-sora text-foreground tracking-tight flex items-center gap-2">
                    <CalendarDays className="h-4.5 w-4.5 text-primary" />
                    <span>Today's Sessions</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Appointment queue for Sector 14 clinic
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {MOCK_TODAY_SCHEDULE.length} Slots
                </Badge>
              </div>

              <Card className="border border-border/80 shadow-2xs divide-y divide-border/60">
                {MOCK_TODAY_SCHEDULE.map((slot) => (
                  <div key={slot.id} className="p-3.5 hover:bg-muted/20 transition-colors flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary/80 border border-border/80 text-foreground font-mono text-xs font-bold shrink-0 text-center min-w-[64px]">
                        {slot.time}
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          to={`/healthcare/patients/${slot.patientId}`}
                          className="font-bold text-xs text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span>{slot.patientName}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({slot.age})</span>
                        </Link>
                        <p className="text-[11px] text-primary font-medium">
                          {slot.vaccine}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {slot.facility}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={slot.status === 'Checked In' ? 'default' : 'secondary'}
                      className="text-[10px] shrink-0 font-medium"
                    >
                      {slot.status}
                    </Badge>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ==============================================================
          MODAL 1: RECORD ADMINISTERED DOSE (SECTION 12)
      ============================================================== */}
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {!recordSubmitSuccess ? (
            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <DialogHeader>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <DialogTitle className="text-lg font-bold font-sora">
                  Record Administered Vaccination
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Official clinical entry under Universal Immunization Programme (UIP). Digitally logged to patient record.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-1 text-xs">
                {/* Patient Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Select Patient</Label>
                  <Select
                    value={recordForm.patientId}
                    onValueChange={(val) => setRecordForm({ ...recordForm, patientId: val })}
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

                {/* Vaccine & Dose Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Vaccine Administered</Label>
                    <Input
                      value={recordForm.vaccine}
                      onChange={(e) => setRecordForm({ ...recordForm, vaccine: e.target.value })}
                      placeholder="e.g. Measles-Rubella (MR - Dose 1)"
                      className="text-xs h-9"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Dose Number / Milestone</Label>
                    <Input
                      value={recordForm.doseNumber}
                      onChange={(e) => setRecordForm({ ...recordForm, doseNumber: e.target.value })}
                      placeholder="e.g. Dose 1 or Booster 1"
                      className="text-xs h-9"
                      required
                    />
                  </div>
                </div>

                {/* Batch & Administration Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Batch / Lot Number</Label>
                    <Input
                      value={recordForm.batchNumber}
                      onChange={(e) => setRecordForm({ ...recordForm, batchNumber: e.target.value })}
                      placeholder="e.g. MR-7782A-IND"
                      className="text-xs h-9 font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Date of Administration</Label>
                    <Input
                      type="date"
                      value={recordForm.adminDate}
                      onChange={(e) => setRecordForm({ ...recordForm, adminDate: e.target.value })}
                      className="text-xs h-9 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Site & Route */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Anatomical Site & Route</Label>
                    <Input
                      value={recordForm.site}
                      onChange={(e) => setRecordForm({ ...recordForm, site: e.target.value })}
                      placeholder="e.g. Left Deltoid, Intramuscular"
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Administering Facility</Label>
                    <Input
                      value={recordForm.facility}
                      onChange={(e) => setRecordForm({ ...recordForm, facility: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* Clinical Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Clinical Observations & Adverse Reaction Monitoring</Label>
                  <Textarea
                    rows={2}
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                    className="text-xs"
                    placeholder="Enter observation notes, cold-chain checks, or patient tolerance..."
                  />
                </div>

                <div className="p-3 rounded-lg bg-secondary/50 border border-border/80 flex items-center space-x-2.5">
                  <Checkbox
                    id="chk-issue"
                    checked={recordForm.issueCertificate}
                    onCheckedChange={(checked) => setRecordForm({ ...recordForm, issueCertificate: checked })}
                  />
                  <label htmlFor="chk-issue" className="text-xs text-foreground font-medium cursor-pointer">
                    Issue SHA-256 signed digital certificate to family account immediately
                  </label>
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecordModalOpen(false)}
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
                      <span>Recording Dose...</span>
                    </>
                  ) : (
                    <span>Submit & Sign Record</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            /* Success State */
            <div className="text-center py-5 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold font-sora text-foreground">
                  Vaccination Record Certified
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {recordForm.vaccine} was successfully entered into the clinical immunization ledger for {MOCK_PATIENTS_REGISTRY.find(p => p.id === recordForm.patientId)?.name || 'Patient'}.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch Number:</span>
                  <span className="text-foreground font-bold">{recordForm.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Certified By:</span>
                  <span className="text-foreground">{MOCK_HEALTHCARE_WORKER.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registry Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">DIGITALLY SIGNED</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-2">
                <Button
                  size="sm"
                  onClick={handleResetRecordModal}
                >
                  Back to Dashboard
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleResetRecordModal();
                    navigate(`/healthcare/patients/${recordForm.patientId}`);
                  }}
                >
                  View Patient Records
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==============================================================
          MODAL 2: RECORD VERIFICATION MODAL (SECTION 13)
      ============================================================== */}
      <Dialog open={!!selectedReviewItem} onOpenChange={(open) => !open && setSelectedReviewItem(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedReviewItem && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono">
                    {selectedReviewItem.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Submitted: {selectedReviewItem.submittedOn}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold font-sora pt-1">
                  Verify Vaccination Entry
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Review the parent submission against clinic batch numbers and the National Immunization Schedule (UIP).
                </DialogDescription>
              </DialogHeader>

              {verificationFeedback ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 mx-auto" />
                  <p className="font-bold text-xs">{verificationFeedback}</p>
                </div>
              ) : (
                <div className="space-y-3 py-1 text-xs">
                  {/* Beneficiary summary */}
                  <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Patient
                    </span>
                    <h4 className="font-bold text-sm text-foreground">
                      {selectedReviewItem.patientName} ({selectedReviewItem.family})
                    </h4>
                    <p className="text-muted-foreground text-[11px]">
                      Submitted by: {selectedReviewItem.submittedBy}
                    </p>
                  </div>

                  {/* Vaccine details */}
                  <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl border border-primary/20 bg-primary/[0.02]">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Vaccine:</span>
                      <strong className="text-foreground">{selectedReviewItem.vaccine}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Dose:</span>
                      <strong className="text-foreground">{selectedReviewItem.dose}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Administered Date:</span>
                      <span className="font-mono font-semibold text-foreground">{selectedReviewItem.dateAdministered}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Batch Number:</span>
                      <span className="font-mono text-primary font-bold">{selectedReviewItem.batchNumber}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border/60">
                      <span className="text-muted-foreground text-[11px] block">Administering Facility:</span>
                      <span className="text-foreground">{selectedReviewItem.facility}</span>
                    </div>
                  </div>

                  {/* Submission Notes */}
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground text-[11px] leading-relaxed">
                    <strong>Review Observation:</strong> {selectedReviewItem.notes}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReviewItem(null)}
                >
                  Cancel
                </Button>

                {!verificationFeedback && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-amber-600 dark:text-amber-400 border-amber-500/30"
                      onClick={() => {
                        alert('Correction request sent to parent household via notification.');
                        setSelectedReviewItem(null);
                      }}
                    >
                      Request Correction
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs gap-1.5"
                      onClick={() => handleVerifyRecord(selectedReviewItem.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Verify &amp; Sign</span>
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
