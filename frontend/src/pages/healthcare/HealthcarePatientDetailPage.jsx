import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  FileCheck,
  Calendar,
  Building,
  Activity,
  Download,
  Printer,
  Syringe,
  FileText,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  Stethoscope,
  ChevronRight
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

// Mock Data
import { MOCK_PATIENTS_REGISTRY, MOCK_HEALTHCARE_WORKER } from '@/data/mockHealthcareData';

export default function HealthcarePatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Testing view states: 'normal' | 'loading' | 'error'
  const [viewState, setViewState] = useState('normal');

  // Active tab state: 'records' | 'schedule' | 'activity'
  const [activeTab, setActiveTab] = useState('records');

  // Modal dialog states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedReviewRecord, setSelectedReviewRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // New Record Form State
  const [recordForm, setRecordForm] = useState({
    vaccine: '',
    doseNumber: 'Dose 1',
    adminDate: '2026-09-25',
    batchNumber: 'IND-2026-X88',
    site: 'Left Deltoid, IM',
    notes: 'Administered in clinic. Observed for 20 mins post-dose without immediate AEFI.',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordSuccess, setRecordSuccess] = useState(false);

  // Find Patient Data
  const patient = useMemo(() => {
    const found = MOCK_PATIENTS_REGISTRY.find((p) => p.id === id);
    return found || MOCK_PATIENTS_REGISTRY[0]; // Fallback to Aarav Pal
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Record Submission
  const handleRecordSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setRecordSuccess(true);
    }, 1000);
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
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Error State</Button>
          </div>
        </div>

        <div className="my-12">
          <ErrorState
            title="We couldn't load this patient profile"
            description="The clinical record ledger for this patient could not be retrieved from the district registry. Please try again."
            onRetry={() => setViewState('normal')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
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

      {/* Navigation Breadcrumb / Back Link */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 -ml-2"
          asChild
        >
          <Link to="/healthcare/patients">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Patient Registry</span>
          </Link>
        </Button>
      </div>

      {/* ==========================================
          VIEW MODE: LOADING STATE
      ========================================== */}
      {viewState === 'loading' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </Card>
          <Card className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </Card>
        </div>
      )}

      {/* ==========================================
          VIEW MODE: NORMAL WORKSPACE
      ========================================== */}
      {viewState === 'normal' && (
        <>
          {/* 1. PATIENT HEADER CARD (SECTION 8 & 9) */}
          <Card className="border border-border/80 shadow-2xs overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Avatar and Basic Details */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 text-lg font-bold border-2 border-primary/20 bg-primary/10 text-primary shrink-0">
                    <AvatarFallback>{patient.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold text-foreground font-sans">
                        {patient.name}
                      </h1>
                      <StatusBadge status={patient.status} size="sm" />
                      <Badge variant="secondary" className="text-xs font-mono">
                        ID: {patient.id}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{patient.age} ({patient.gender})</span>
                      <span>•</span>
                      <span>DOB: <strong>{patient.dob}</strong></span>
                      <span>•</span>
                      <span>Blood Group: <strong>{patient.bloodGroup}</strong></span>
                      <span>•</span>
                      <span>Household: <strong>{patient.family}</strong></span>
                    </div>

                    {/* Section 9: Authorization Indicator */}
                    <div className="pt-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        <span>Authorized Clinical Access • Patient identity and records verified under Universal Immunization Registry</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 11: Patient Detail Actions */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-9 shadow-xs"
                    onClick={() => {
                      setRecordSuccess(false);
                      setRecordForm({ ...recordForm, vaccine: patient.nextVaccine });
                      setIsRecordModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Record Vaccination</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-9 gap-1.5"
                    onClick={() => showToast(`Generated clinical immunization certificate for ${patient.name}`)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Issue Certificate</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Clinical Overview Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Progress */}
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Immunization Progress</span>
                    <span className="font-bold font-mono text-foreground">{patient.coverage}%</span>
                  </div>
                  <Progress value={patient.coverage} className="h-2" />
                  <span className="text-[10px] text-muted-foreground block">
                    {patient.completedDoses} of {patient.totalDoses} doses recorded
                  </span>
                </div>

                {/* Next Vaccine */}
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Next Due Milestone
                  </span>
                  <p className="font-bold text-xs text-foreground truncate">
                    {patient.nextVaccine}
                  </p>
                  <span className={patient.status === 'OVERDUE' ? 'text-[11px] text-destructive font-semibold block' : 'text-[11px] text-muted-foreground block'}>
                    {patient.nextDueDate} ({patient.relativeDue})
                  </span>
                </div>

                {/* Medical History Notes */}
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Allergies &amp; Alerts
                  </span>
                  <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                    {patient.allergies || 'No known allergies or contraindications recorded.'}
                  </p>
                </div>

                {/* Primary Provider */}
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Primary Provider &amp; Center
                  </span>
                  <p className="font-bold text-xs text-foreground truncate">
                    {patient.primaryDoctor}
                  </p>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {patient.facility}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. TABBED CLINICAL SECTIONS */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-secondary/60 p-1 border border-border/80 rounded-xl">
                <TabsTrigger value="records" className="text-xs gap-1.5 font-semibold">
                  <Syringe className="h-3.5 w-3.5" />
                  <span>Vaccination Records ({patient.records?.length || 0})</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-xs gap-1.5 font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Upcoming Schedule &amp; Catch-up</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs gap-1.5 font-semibold">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Clinical Activity Trail</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: VACCINATION RECORDS LEDGER */}
              <TabsContent value="records" className="space-y-3">
                <div className="rounded-xl border border-border/80 overflow-hidden bg-card shadow-2xs">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Vaccine Administered</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Milestone Dose</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Date Administered</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Batch Number</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Administering Center</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground">Verification</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patient.records?.map((rec) => (
                        <TableRow key={rec.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-3 font-bold text-xs text-foreground">
                            {rec.vaccine}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {rec.dose}
                          </TableCell>
                          <TableCell className="py-3 text-xs font-mono text-foreground">
                            {rec.date}
                          </TableCell>
                          <TableCell className="py-3 text-xs font-mono text-primary font-bold">
                            {rec.batch}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            <div>{rec.clinic}</div>
                            <div className="text-[10px]">{rec.doctor}</div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={
                                rec.status === 'VERIFIED'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]'
                                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]'
                              }
                            >
                              {rec.status === 'VERIFIED' ? 'Verified by MD' : 'Pending Review'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            {rec.status === 'PENDING_REVIEW' ? (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs px-2.5 font-semibold"
                                onClick={() => setSelectedReviewRecord(rec)}
                              >
                                Verify Now
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2 text-muted-foreground"
                                onClick={() => showToast(`Exported certified digital copy for ${rec.vaccine}`)}
                              >
                                Certificate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* TAB 2: UPCOMING SCHEDULE & CATCH-UP FORECAST */}
              <TabsContent value="schedule" className="space-y-4">
                <Card className="border border-border/80 shadow-2xs divide-y divide-border/60">
                  <div className="p-4 bg-muted/20 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground font-sora">
                        Future Vaccination Forecast
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Projected against National Immunization Schedule (UIP) rules
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {patient.upcomingSchedule?.length || 0} Milestones
                    </Badge>
                  </div>

                  {patient.upcomingSchedule?.map((item, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/15 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs sm:text-sm text-foreground">
                            {item.vaccine}
                          </h5>
                          <Badge
                            variant={item.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                            className="text-[10px] font-mono"
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Recommended Administration Date: <strong className="font-mono text-foreground">{item.dueDate}</strong> ({item.relative})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Button
                          size="sm"
                          className="h-8 text-xs font-semibold gap-1"
                          onClick={() => {
                            setRecordSuccess(false);
                            setRecordForm({ ...recordForm, vaccine: item.vaccine });
                            setIsRecordModalOpen(true);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Administer Now</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </Card>
              </TabsContent>

              {/* TAB 3: PATIENT CLINICAL TIMELINE (SECTION 9) */}
              <TabsContent value="activity" className="space-y-4">
                <Card className="border border-border/80 shadow-2xs p-5 sm:p-6 space-y-6">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground font-sora">
                      Patient Clinical Timeline &amp; Event Stream
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Complete chronological clinical audit trail for {patient.name}
                    </p>
                  </div>

                  {/* Visual Clinical Timeline Stream */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {/* Event 1: Clinical Review Requested */}
                    <div className="relative space-y-1">
                      <div className="absolute -left-[27px] top-0.5 h-6 w-6 rounded-full bg-amber-500/15 border-2 border-amber-500 text-amber-600 flex items-center justify-center">
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-xs text-foreground font-sans">
                          Clinical Review Requested
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">Today, 08:30 AM</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Parent uploaded private clinic record for Measles-Rubella (MR - Dose 1). Awaiting attending pediatrician batch endorsement.
                      </p>
                    </div>

                    {/* Event 2: Certificate Uploaded */}
                    <div className="relative space-y-1">
                      <div className="absolute -left-[27px] top-0.5 h-6 w-6 rounded-full bg-blue-500/15 border-2 border-blue-500 text-blue-600 flex items-center justify-center">
                        <FileCheck className="h-3 w-3" />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-xs text-foreground font-sans">
                          Certificate Uploaded
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">Yesterday, 04:15 PM</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Digital copy of private clinic receipt (Batch MR-7782A-IND) submitted by Meera Pal for school validation.
                      </p>
                    </div>

                    {/* Event 3: Schedule Updated */}
                    <div className="relative space-y-1">
                      <div className="absolute -left-[27px] top-0.5 h-6 w-6 rounded-full bg-primary/15 border-2 border-primary text-primary flex items-center justify-center">
                        <Calendar className="h-3 w-3" />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-xs text-foreground font-sans">
                          Schedule Updated &amp; Interval Evaluated
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">18 Sep 2026</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Evaluated against UIP standards. DPT Booster 2 window scheduled for 15 Jan 2027.
                      </p>
                    </div>

                    {/* Event 4: Record Verified */}
                    <div className="relative space-y-1">
                      <div className="absolute -left-[27px] top-0.5 h-6 w-6 rounded-full bg-emerald-500/15 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="h-3 w-3" />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-xs text-foreground font-sans">
                          Record Verified &amp; Signed
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">14 Jul 2026</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        School admission compliance certificate officially certified by Dr. Sunita Sharma (MCI-2014-88492).
                      </p>
                    </div>

                    {/* Event 5: Vaccination Administered */}
                    <div className="relative space-y-1">
                      <div className="absolute -left-[27px] top-0.5 h-6 w-6 rounded-full bg-primary/15 border-2 border-primary text-primary flex items-center justify-center">
                        <Syringe className="h-3 w-3" />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-xs text-foreground font-sans">
                          Vaccination Administered
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">28 Jul 2018</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Pentavalent 3 (DPT + HepB + Hib) administered at City Child Clinic. Batch PNT-443-C. Zero adverse events recorded.
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* ==============================================================
          MODAL: RECORD VACCINATION MODAL
      ============================================================== */}
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogContent className="sm:max-w-md">
          {!recordSuccess ? (
            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <DialogHeader>
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <DialogTitle className="text-base font-bold font-sora">
                  Record Vaccination for {patient.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Certify an administered vaccine dose into {patient.name}'s official clinical ledger.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-1 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Vaccine Administered</Label>
                  <Input
                    value={recordForm.vaccine}
                    onChange={(e) => setRecordForm({ ...recordForm, vaccine: e.target.value })}
                    className="text-xs h-8.5"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Dose / Milestone</Label>
                    <Input
                      value={recordForm.doseNumber}
                      onChange={(e) => setRecordForm({ ...recordForm, doseNumber: e.target.value })}
                      className="text-xs h-8.5"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Batch / Lot No.</Label>
                    <Input
                      value={recordForm.batchNumber}
                      onChange={(e) => setRecordForm({ ...recordForm, batchNumber: e.target.value })}
                      className="text-xs h-8.5 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Administration Date</Label>
                    <Input
                      type="date"
                      value={recordForm.adminDate}
                      onChange={(e) => setRecordForm({ ...recordForm, adminDate: e.target.value })}
                      className="text-xs h-8.5 font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Site &amp; Route</Label>
                    <Input
                      value={recordForm.site}
                      onChange={(e) => setRecordForm({ ...recordForm, site: e.target.value })}
                      className="text-xs h-8.5"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Observations &amp; Post-Vaccine Notes</Label>
                  <Textarea
                    rows={2}
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                    className="text-xs"
                  />
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recording...' : 'Submit & Certify Dose'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm font-sora">Dose Certified &amp; Recorded</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {recordForm.vaccine} was successfully certified for {patient.name}. The digital record is now verified.
              </p>
              <Button size="sm" onClick={() => setIsRecordModalOpen(false)}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==============================================================
          MODAL: QUICK VERIFY PENDING RECORD
      ============================================================== */}
      <Dialog open={!!selectedReviewRecord} onOpenChange={(open) => !open && setSelectedReviewRecord(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedReviewRecord && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-bold font-sora">
                  Verify Record: {selectedReviewRecord.vaccine}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Confirm the batch number and clinical details before digitally signing this entry.
                </DialogDescription>
              </DialogHeader>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Patient:</span>
                  <span className="font-bold text-foreground font-sans">{patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Batch Number:</span>
                  <span className="text-primary font-bold">{selectedReviewRecord.batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Administered Date:</span>
                  <span className="text-foreground">{selectedReviewRecord.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Clinic / Doctor:</span>
                  <span className="text-foreground font-sans">{selectedReviewRecord.clinic}</span>
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReviewRecord(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    showToast(`Successfully verified & signed ${selectedReviewRecord.vaccine}`);
                    setSelectedReviewRecord(null);
                  }}
                >
                  Verify &amp; Sign
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
