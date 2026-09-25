import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  Eye,
  Calendar,
  Building,
  RotateCcw,
  Sparkles,
  Stethoscope
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

// Mock Data
import { MOCK_PATIENTS_REGISTRY, MOCK_HEALTHCARE_WORKER } from '@/data/mockHealthcareData';

export default function HealthcarePatientsPage() {
  const navigate = useNavigate();

  // Testing View Modes: 'normal' | 'loading' | 'empty' | 'error'
  const [viewState, setViewState] = useState('normal');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ageFilter, setAgeFilter] = useState('ALL');

  // Quick Dose Recording Modal State
  const [selectedPatientForDose, setSelectedPatientForDose] = useState(null);
  const [doseSuccess, setDoseSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Filtered Patients List
  const filteredPatients = useMemo(() => {
    return MOCK_PATIENTS_REGISTRY.filter((patient) => {
      // Status filter
      if (statusFilter !== 'ALL' && patient.status !== statusFilter) {
        return false;
      }
      // Age filter
      if (ageFilter === 'CHILD' && !patient.isChild) return false;
      if (ageFilter === 'ADULT' && patient.isChild) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = patient.name.toLowerCase().includes(q);
        const matchFamily = patient.family.toLowerCase().includes(q);
        const matchId = patient.id.toLowerCase().includes(q);
        const matchVaccine = patient.nextVaccine.toLowerCase().includes(q);
        if (!matchName && !matchFamily && !matchId && !matchVaccine) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, statusFilter, ageFilter]);

  // Handle Quick Dose Submit
  const handleQuickDoseSubmit = (e) => {
    e.preventDefault();
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setDoseSuccess(true);
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
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('empty')}>Empty</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Error State</Button>
          </div>
        </div>

        <PageHeader
          title="Patient Registry & Families"
          description="Lookup authorized patient households, review immunization timelines, and record clinical doses."
        />

        <div className="my-12">
          <ErrorState
            title="We couldn't load the patient registry"
            description="The clinical patient directory service encountered a temporary error. Please try again."
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
            variant={viewState === 'empty' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('empty')}
          >
            Empty (No Patients)
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

      {/* 1. PAGE HEADER WITH CLINICAL AUTHORIZATION NOTICE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Patient Registry & Families"
          description="Lookup authorized patient households, review immunization timelines, and record clinical doses."
        />

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Authorized Clinical Access</span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <Card className="border border-border/80 shadow-2xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, family, ID, or vaccine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9.5 pl-9 text-xs sm:text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] text-xs h-9.5">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="UPCOMING">Upcoming / Due</SelectItem>
                <SelectItem value="UP_TO_DATE">Up to Date</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-[140px] text-xs h-9.5">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Age Groups</SelectItem>
                <SelectItem value="CHILD">Pediatric (0-18y)</SelectItem>
                <SelectItem value="ADULT">Adults (18y+)</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'ALL' || ageFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9.5 text-xs px-2.5"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setAgeFilter('ALL');
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
          <Skeleton className="h-12 w-full" />
        </Card>
      )}

      {/* ==========================================
          VIEW MODE: EMPTY STATE
      ========================================== */}
      {viewState === 'empty' && (
        <div className="my-8">
          <EmptyState
            title="No authorized patients found"
            description="There are currently no patients assigned to your clinical sector, or your search filters did not match any active patient records."
            actionLabel="Reset Search Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setAgeFilter('ALL');
              setViewState('normal');
            }}
          />
        </div>
      )}

      {/* ==========================================
          VIEW MODE: NORMAL WORKSPACE
      ========================================== */}
      {viewState === 'normal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Showing <strong>{filteredPatients.length}</strong> authorized patient profiles</span>
            <span className="font-mono">Sector: {MOCK_HEALTHCARE_WORKER.assignedDistrict}</span>
          </div>

          {filteredPatients.length === 0 ? (
            <Card className="p-10 text-center border-dashed border-2">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">No matching patients</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No patient records match "{searchQuery}". Try searching for another name, family household, or ID.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setAgeFilter('ALL');
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
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Patient / Family</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age &amp; DOB</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Due Vaccination</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clinical Status</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Authorization</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Updated</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                        {/* Patient info */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 text-xs font-bold border border-primary/20 bg-primary/10 text-primary">
                              <AvatarFallback>{patient.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link
                                to={`/healthcare/patients/${patient.id}`}
                                className="font-bold text-xs text-foreground hover:text-primary transition-colors block"
                              >
                                {patient.name}
                              </Link>
                              <span className="text-[11px] text-muted-foreground block">
                                {patient.family} • ID: {patient.id}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Age & DOB */}
                        <TableCell className="py-3 text-xs">
                          <span className="font-semibold text-foreground block">{patient.age}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{patient.dob}</span>
                        </TableCell>

                        {/* Next Vaccine */}
                        <TableCell className="py-3 text-xs">
                          <span className="font-medium text-foreground block">{patient.nextVaccine}</span>
                          <span className={patient.status === 'OVERDUE' ? 'text-[11px] text-destructive font-semibold' : 'text-[11px] text-muted-foreground'}>
                            {patient.nextDueDate} ({patient.relativeDue})
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3">
                          <StatusBadge status={patient.status} size="sm" />
                        </TableCell>

                        {/* Authorization Indicator */}
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] py-0.5 gap-1 font-medium"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            <span>{patient.authorizationBadge}</span>
                          </Badge>
                        </TableCell>

                        {/* Last Updated */}
                        <TableCell className="py-3 text-[11px] text-muted-foreground font-mono">
                          {patient.lastUpdated}
                        </TableCell>

                        {/* Action buttons */}
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs px-2.5 gap-1"
                              asChild
                            >
                              <Link to={`/healthcare/patients/${patient.id}`}>
                                <Eye className="h-3.5 w-3.5" />
                                <span>View</span>
                              </Link>
                            </Button>

                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 text-xs px-2.5 gap-1"
                              onClick={() => {
                                setDoseSuccess(false);
                                setSelectedPatientForDose(patient);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Dose</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden space-y-3">
                {filteredPatients.map((patient) => (
                  <Card key={patient.id} className="p-4 space-y-3 border border-border/80 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 text-xs font-bold border border-primary/20 bg-primary/10 text-primary">
                          <AvatarFallback>{patient.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            to={`/healthcare/patients/${patient.id}`}
                            className="font-bold text-xs text-foreground hover:text-primary transition-colors block"
                          >
                            {patient.name}
                          </Link>
                          <span className="text-[10px] text-muted-foreground">
                            {patient.age} • {patient.family}
                          </span>
                        </div>
                      </div>

                      <StatusBadge status={patient.status} size="sm" />
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next Vaccine:</span>
                        <span className="font-semibold text-foreground text-right">{patient.nextVaccine}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Due:</span>
                        <span className={patient.status === 'OVERDUE' ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                          {patient.nextDueDate} ({patient.relativeDue})
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8 gap-1.5"
                        asChild
                      >
                        <Link to={`/healthcare/patients/${patient.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Profile</span>
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-8 gap-1.5"
                        onClick={() => {
                          setDoseSuccess(false);
                          setSelectedPatientForDose(patient);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Record Dose</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==============================================================
          QUICK DOSE RECORD MODAL (FROM PATIENT LIST)
      ============================================================== */}
      <Dialog open={!!selectedPatientForDose} onOpenChange={(open) => !open && setSelectedPatientForDose(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedPatientForDose && !doseSuccess ? (
            <form onSubmit={handleQuickDoseSubmit} className="space-y-4">
              <DialogHeader>
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <DialogTitle className="text-base font-bold font-sora">
                  Record Dose for {selectedPatientForDose.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Quick clinical entry logged directly into this patient's immunization ledger.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-1 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Vaccine Administered</Label>
                  <Input defaultValue={selectedPatientForDose.nextVaccine} className="text-xs h-8.5" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Batch / Lot No.</Label>
                    <Input defaultValue="IND-2026-B81" className="text-xs h-8.5 font-mono" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date Administered</Label>
                    <Input type="date" defaultValue="2026-09-25" className="text-xs h-8.5 font-mono" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Facility / Clinic</Label>
                  <Input defaultValue="Primary Health Center North" className="text-xs h-8.5" />
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatientForDose(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isRecording}
                >
                  {isRecording ? 'Certifying...' : 'Save & Certify'}
                </Button>
              </DialogFooter>
            </form>
          ) : selectedPatientForDose && doseSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm font-sora">Vaccine Dose Recorded</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The dose has been certified and logged into {selectedPatientForDose.name}'s registry history.
              </p>
              <Button size="sm" onClick={() => setSelectedPatientForDose(null)}>
                Done
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
