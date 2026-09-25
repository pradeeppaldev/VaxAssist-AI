import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Syringe,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Download,
  FileText,
  FileCheck,
  MapPin,
  User,
  Users,
  Eye,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  List,
  GitCommit,
  Share2,
  FileSpreadsheet,
  Upload,
  CalendarDays
} from 'lucide-react';

// Design system & layout
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';

// shadcn UI Primitives
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Centralized mock data
import {
  INITIAL_FAMILY_MEMBERS,
  INITIAL_VACCINATION_RECORDS,
} from '@/data/mockFamilyData';

const COMMON_VACCINES = [
  'Measles-Rubella (MR - Dose 1)',
  'DPT Booster (Dose 1)',
  'Oral Polio Vaccine (OPV Booster)',
  'Annual Influenza (Quadrivalent)',
  'Tetanus, Diphtheria (Td Booster)',
  'COVID-19 Precautionary Dose',
  'BCG (Bacillus Calmette-Guérin)',
  'Pentavalent 1 (DPT, HepB, Hib)',
  'Pentavalent 2 (DPT, HepB, Hib)',
  'Pentavalent 3 (DPT, HepB, Hib)',
  'Typhoid Conjugate Vaccine (TCV)',
  'Hepatitis B Adult Series',
  'Rotavirus Vaccine',
  'Pneumococcal Conjugate (PCV)',
  'Other / Custom Vaccine',
];

const ADMINISTRATION_SITES = [
  'Left Deltoid (Upper Arm)',
  'Right Deltoid (Upper Arm)',
  'Left Anterolateral Thigh',
  'Right Anterolateral Thigh',
  'Oral Drops',
  'Subcutaneous (Upper Arm)',
  'Other Clinical Site',
];

export default function VaccinationsPage() {
  const navigate = useNavigate();

  // State
  const [records, setRecords] = useState(INITIAL_VACCINATION_RECORDS);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'
  const [displayMode, setDisplayMode] = useState('table'); // 'table' | 'timeline'

  // Filter States
  const [selectedMemberId, setSelectedMemberId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'UPCOMING' | 'DUE' | 'OVERDUE'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('DATE_DESC'); // 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC'

  // Modals & Drawers
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certViewingRecord, setCertViewingRecord] = useState(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  // Form State for Add Record
  const [addForm, setAddForm] = useState({
    memberId: 'fam-1',
    vaccineName: 'DPT Booster (Dose 1)',
    dose: 'Booster 1',
    category: 'UIP Routine',
    date: new Date().toISOString().split('T')[0],
    provider: 'Dr. Sunita Sharma',
    clinic: 'City Child Clinic, Sector 14',
    batchNumber: 'BT-2026-X84',
    site: 'Left Deltoid (Upper Arm)',
    notes: '',
    hasCertificate: true,
  });

  const [formErrors, setFormErrors] = useState({});

  // Summary Metrics Calculation
  const filteredByMember = useMemo(() => {
    if (selectedMemberId === 'ALL') return records;
    return records.filter((r) => r.memberId === selectedMemberId);
  }, [records, selectedMemberId]);

  const summaryCounts = useMemo(() => {
    return {
      total: filteredByMember.length,
      completed: filteredByMember.filter((r) => r.status === 'COMPLETED').length,
      upcoming: filteredByMember.filter((r) => r.status === 'UPCOMING').length,
      due: filteredByMember.filter((r) => r.status === 'DUE').length,
      overdue: filteredByMember.filter((r) => r.status === 'OVERDUE').length,
    };
  }, [filteredByMember]);

  // Filtered & Sorted Records
  const displayRecords = useMemo(() => {
    let result = [...filteredByMember];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.vaccineName.toLowerCase().includes(q) ||
          r.memberName.toLowerCase().includes(q) ||
          r.clinic.toLowerCase().includes(q) ||
          r.provider.toLowerCase().includes(q) ||
          (r.disease && r.disease.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === 'DATE_DESC') return new Date(b.date) - new Date(a.date);
      if (sortOption === 'DATE_ASC') return new Date(a.date) - new Date(b.date);
      if (sortOption === 'NAME_ASC') return a.vaccineName.localeCompare(b.vaccineName);
      return 0;
    });

    return result;
  }, [filteredByMember, statusFilter, searchQuery, sortOption]);

  // Timeline Grouping by Year
  const timelineGroups = useMemo(() => {
    const groups = {};
    displayRecords.forEach((rec) => {
      const yr = rec.year || new Date(rec.date).getFullYear();
      if (!groups[yr]) groups[yr] = [];
      groups[yr].push(rec);
    });
    // Sort years descending
    return Object.keys(groups)
      .sort((a, b) => Number(b) - Number(a))
      .map((year) => ({
        year,
        items: groups[year],
      }));
  }, [displayRecords]);

  // Validation
  const validateAddForm = () => {
    const errors = {};
    if (!addForm.memberId) errors.memberId = 'Please select a family member';
    if (!addForm.vaccineName.trim()) errors.vaccineName = 'Vaccine name is required';
    if (!addForm.dose.trim()) errors.dose = 'Dose / milestone description is required';
    if (!addForm.date) errors.date = 'Date is required';
    return errors;
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const errors = validateAddForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const memberObj = INITIAL_FAMILY_MEMBERS.find((m) => m.id === addForm.memberId);
    const dateObj = new Date(addForm.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const isFuture = dateObj > new Date();
    const assignedStatus = isFuture ? 'UPCOMING' : 'COMPLETED';

    const newRecord = {
      id: `vax-rec-${Date.now()}`,
      vaccineName: addForm.vaccineName.trim(),
      disease: 'Routine Immunization',
      dose: addForm.dose.trim(),
      category: addForm.category,
      memberId: addForm.memberId,
      memberName: memberObj ? memberObj.name : 'Family Member',
      memberRelation: memberObj ? `${memberObj.relationship} (${memberObj.age})` : 'Dependent',
      date: addForm.date,
      formattedDate,
      year: dateObj.getFullYear(),
      month: dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      status: assignedStatus,
      provider: addForm.provider.trim() || 'Health Practitioner',
      clinic: addForm.clinic.trim() || 'Community Clinic',
      batchNumber: addForm.batchNumber.trim() || `BATCH-${Date.now().toString().slice(-4)}`,
      site: addForm.site,
      hasCertificate: addForm.hasCertificate,
      certificateId: addForm.hasCertificate ? `CERT-${Date.now().toString().slice(-6)}` : null,
      notes: addForm.notes.trim() || 'Recorded via patient digital portal.',
    };

    setRecords((prev) => [newRecord, ...prev]);
    setIsAddModalOpen(false);
    setToastMessage(`Recorded "${newRecord.vaccineName}" for ${newRecord.memberName}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenDetail = (record) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const handleOpenCertificate = (record) => {
    setCertViewingRecord(record);
    setIsCertModalOpen(true);
  };

  const handleExportSummary = () => {
    setToastMessage('Exporting complete family vaccination report (PDF)... Download started.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ==========================================
  // VIEW MODE: LOADING SKELETON
  // ==========================================
  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
          <span className="text-xs font-semibold text-foreground">Interactive State Preview:</span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('normal')}>Normal</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Loading Skeleton</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('empty')}>Empty</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('error')}>Error</Button>
          </div>
        </div>

        <div className="space-y-2 pb-4 border-b border-border/60">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

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
          title="Vaccinations"
          subtitle="View and manage vaccination records for your family."
          breadcrumbs={[
            { label: 'Dashboard', href: '/patient/dashboard' },
            { label: 'Vaccinations' },
          ]}
        />

        <ErrorState
          title="We couldn't load vaccination records"
          description="A temporary error occurred while fetching the immunization registry. Please check your connectivity and try again."
          onRetry={() => setViewState('normal')}
          className="my-12 py-12"
        />
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: NORMAL OR EMPTY STATE
  // ==========================================
  const showEmpty = viewState === 'empty' || records.length === 0;

  return (
    <div className="space-y-8">
      {/* 0. INTERACTIVE STATE PREVIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Interactive View Modes:</span>
          <span className="hidden sm:inline">Preview the Vaccinations page under different lifecycle states</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewState === 'normal' && records.length > 0 ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => {
              if (records.length === 0) setRecords(INITIAL_VACCINATION_RECORDS);
              setViewState('normal');
            }}
          >
            Normal View
          </Button>
          <Button
            size="sm"
            variant={viewState === 'loading' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('loading')}
          >
            Loading Skeleton
          </Button>
          <Button
            size="sm"
            variant={showEmpty ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('empty')}
          >
            Empty State
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

      {/* SUCCESS TOAST ALERT */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl border border-status-completed/30 bg-status-completed-bg text-status-completed-fg flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-status-completed" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-muted-foreground hover:text-foreground text-xs p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Vaccinations"
        subtitle="View and manage vaccination records for your family."
        breadcrumbs={[
          { label: 'Dashboard', href: '/patient/dashboard' },
          { label: 'Vaccinations' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold h-9 hidden sm:inline-flex"
              onClick={handleExportSummary}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Records</span>
            </Button>
            <Button
              onClick={() => {
                setFormErrors({});
                setIsAddModalOpen(true);
              }}
              className="gap-2 font-semibold shadow-xs h-9 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vaccination Record</span>
            </Button>
          </div>
        }
      />

      {showEmpty ? (
        <EmptyState
          icon={Syringe}
          title="No vaccination records yet"
          description="Add a vaccination record to start building this member's digital history, track national schedules, and verify certificates."
          actionLabel="+ Add Vaccination Record"
          onAction={() => {
            setFormErrors({});
            setIsAddModalOpen(true);
          }}
          secondaryActionLabel="Restore Demo Records"
          onSecondaryAction={() => {
            setRecords(INITIAL_VACCINATION_RECORDS);
            setViewState('normal');
          }}
          className="my-12 py-16"
        />
      ) : (
        <>
          {/* 2. FAMILY MEMBER SELECTOR BAR */}
          <section aria-label="Family Member Selection" className="p-4 rounded-2xl border border-border/80 bg-card shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground font-sans">
                    Family Member Filter
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Viewing records for:{' '}
                    <strong className="text-primary font-semibold">
                      {selectedMemberId === 'ALL'
                        ? 'All Family Members'
                        : INITIAL_FAMILY_MEMBERS.find((m) => m.id === selectedMemberId)?.name}
                    </strong>
                  </p>
                </div>
              </div>

              {/* shadcn Select */}
              <div className="w-full sm:w-72">
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger className="text-xs sm:text-sm font-medium">
                    <SelectValue placeholder="Select Family Member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Family Members (4 Profiles)</SelectItem>
                    {INITIAL_FAMILY_MEMBERS.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.relationship})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* 3. VACCINATION SUMMARY METRICS */}
          <section aria-label="Vaccination Summary Metrics">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <MetricCard
                title="Total Records"
                value={summaryCounts.total}
                subtext="Registered doses"
                icon={Syringe}
                accentColor="cyan"
              />
              <MetricCard
                title="Completed"
                value={summaryCounts.completed}
                subtext="Verified immunizations"
                icon={CheckCircle2}
                accentColor="success"
              />
              <MetricCard
                title="Upcoming"
                value={summaryCounts.upcoming}
                subtext="Scheduled milestones"
                icon={Calendar}
                accentColor="cyan"
              />
              <MetricCard
                title="Due Now"
                value={summaryCounts.due}
                subtext="Within 30 days window"
                icon={Clock}
                accentColor="warning"
                badgeText={summaryCounts.due > 0 ? `${summaryCounts.due} Due` : null}
                badgeVariant="secondary"
              />
              <MetricCard
                title="Overdue"
                value={summaryCounts.overdue}
                subtext="Catch-up needed"
                icon={AlertTriangle}
                accentColor={summaryCounts.overdue > 0 ? 'danger' : 'neutral'}
                badgeText={summaryCounts.overdue > 0 ? `${summaryCounts.overdue} Alert` : '0'}
                badgeVariant={summaryCounts.overdue > 0 ? 'destructive' : 'secondary'}
              />
            </div>
          </section>

          {/* 4. CONTROLS BAR: STATUS FILTER, SEARCH, SORT, & VIEW SWITCHER */}
          <section aria-label="Controls and Filtering" className="space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                <Button
                  size="sm"
                  variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('ALL')}
                  className="h-8 text-xs font-medium"
                >
                  All ({summaryCounts.total})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('COMPLETED')}
                  className="h-8 text-xs font-medium"
                >
                  Completed ({summaryCounts.completed})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'UPCOMING' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('UPCOMING')}
                  className="h-8 text-xs font-medium"
                >
                  Upcoming ({summaryCounts.upcoming})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'DUE' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('DUE')}
                  className="h-8 text-xs font-medium"
                >
                  Due ({summaryCounts.due})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'OVERDUE' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('OVERDUE')}
                  className="h-8 text-xs font-medium"
                >
                  Overdue ({summaryCounts.overdue})
                </Button>
              </div>

              {/* View Switcher: Table vs Timeline */}
              <div className="flex items-center gap-1.5 self-start lg:self-center shrink-0">
                <div className="p-1 rounded-xl bg-muted/60 border border-border flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('table')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      displayMode === 'table'
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>Table View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('timeline')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      displayMode === 'timeline'
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <GitCommit className="h-3.5 w-3.5" />
                    <span>Timeline View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Secondary Search & Sort Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search vaccine, recipient, disease, or clinic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs sm:text-sm h-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:inline">Sort:</span>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="text-xs h-9 w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DATE_DESC">Newest Date First</SelectItem>
                    <SelectItem value="DATE_ASC">Oldest Date First</SelectItem>
                    <SelectItem value="NAME_ASC">Vaccine Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* 5. MAIN CONTENT: TABLE VIEW OR TIMELINE VIEW */}
          {displayRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
              <Search className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="font-semibold text-foreground text-base">
                No vaccination records match your filter criteria
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try resetting your search query or choosing "All" for status and family members.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSelectedMemberId('ALL');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : displayMode === 'table' ? (
            /* ================= TABLE VIEW ================= */
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Vaccine</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Dose / Milestone</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Family Member</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Provider / Clinic</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Certificate</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRecords.map((record) => (
                      <TableRow
                        key={record.id}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => handleOpenDetail(record)}
                      >
                        <TableCell className="font-medium">
                          <div className="space-y-0.5">
                            <span className="font-bold text-sm text-foreground font-sans">
                              {record.vaccineName}
                            </span>
                            <p className="text-[11px] text-muted-foreground">
                              {record.disease}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[11px] font-mono py-0 h-5">
                            {record.dose}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 text-[10px] font-bold border">
                              <AvatarFallback>
                                {record.memberName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-xs">
                              <span className="font-semibold text-foreground">{record.memberName}</span>
                              <span className="text-muted-foreground block text-[10px]">
                                {record.memberRelation}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {record.formattedDate}
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={record.status} size="sm" />
                        </TableCell>

                        <TableCell>
                          <div className="text-xs truncate max-w-[160px]">
                            <span className="font-medium text-foreground block truncate">
                              {record.clinic}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {record.provider}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          {record.hasCertificate ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCertificate(record);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline p-1"
                              title="View Verified Certificate"
                            >
                              <FileCheck className="h-4 w-4 text-primary" />
                              <span>Verified</span>
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleOpenDetail(record)}
                                className="text-xs cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                View Full Details
                              </DropdownMenuItem>
                              {record.hasCertificate && (
                                <DropdownMenuItem
                                  onClick={() => handleOpenCertificate(record)}
                                  className="text-xs cursor-pointer"
                                >
                                  <Download className="h-3.5 w-3.5 mr-2" />
                                  Download Certificate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => navigate('/schedule')}
                                className="text-xs cursor-pointer"
                              >
                                <CalendarDays className="h-3.5 w-3.5 mr-2" />
                                View in Schedule
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Records List (Stacked Cards) */}
              <div className="block md:hidden space-y-3">
                {displayRecords.map((record) => (
                  <Card
                    key={record.id}
                    className="p-4 cursor-pointer hover:border-primary/40 transition-colors space-y-3"
                    onClick={() => handleOpenDetail(record)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground font-sans truncate">
                          {record.vaccineName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="font-semibold text-primary">{record.memberName}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">{record.dose}</span>
                        </div>
                      </div>
                      <StatusBadge status={record.status} size="sm" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {record.formattedDate}
                      </span>
                      <span className="truncate max-w-[150px]">{record.clinic}</span>
                    </div>

                    {record.hasCertificate && (
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                          <FileCheck className="h-3 w-3" />
                          Certificate Available
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] text-primary p-0 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCertificate(record);
                          }}
                        >
                          View Pass →
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Showing {displayRecords.length} of {filteredByMember.length} records</span>
                <span className="font-mono text-[11px]">Indian UIP & WHO Clinical Regimen</span>
              </div>
            </div>
          ) : (
            /* ================= TIMELINE VIEW ================= */
            <div className="space-y-8">
              {timelineGroups.map((group) => (
                <div key={group.year} className="space-y-4">
                  {/* Year Header Banner */}
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs font-bold font-mono px-3 py-1">
                      Year {group.year}
                    </Badge>
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground font-mono">
                      {group.items.length} dose{group.items.length === 1 ? '' : 's'} recorded
                    </span>
                  </div>

                  {/* Vertical Chronological Spine */}
                  <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {group.items.map((item) => {
                      const isCompleted = item.status === 'COMPLETED';
                      const isOverdue = item.status === 'OVERDUE';
                      const isDue = item.status === 'DUE';

                      return (
                        <div key={item.id} className="relative flex items-start gap-4">
                          {/* Node marker */}
                          <div
                            className={`absolute -left-6 sm:-left-7 p-1 rounded-full border bg-background shrink-0 ${
                              isCompleted
                                ? 'text-status-completed border-status-completed/40 bg-status-completed-bg'
                                : isOverdue
                                ? 'text-status-overdue border-status-overdue/40 bg-status-overdue-bg animate-pulse'
                                : isDue
                                ? 'text-status-due border-status-due/40 bg-status-due-bg'
                                : 'text-primary border-primary/30 bg-primary/10'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : isOverdue ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : isDue ? (
                              <Clock className="h-4 w-4" />
                            ) : (
                              <Calendar className="h-4 w-4" />
                            )}
                          </div>

                          {/* Timeline Card */}
                          <Card
                            className="flex-1 p-4 sm:p-5 hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
                            onClick={() => handleOpenDetail(item)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm sm:text-base text-foreground font-sans">
                                    {item.vaccineName}
                                  </h4>
                                  <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                                    {item.dose}
                                  </Badge>
                                </div>
                                <p className="text-xs text-primary font-medium">
                                  Recipient: {item.memberName} ({item.memberRelation})
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                <StatusBadge status={item.status} size="sm" />
                                <span className="text-xs font-mono text-muted-foreground">
                                  {item.formattedDate}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              {item.notes}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{item.clinic}</span>
                                <span>•</span>
                                <span className="font-mono text-[11px]">Batch: {item.batchNumber}</span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {item.hasCertificate && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] gap-1 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCertificate(item);
                                    }}
                                  >
                                    <FileCheck className="h-3.5 w-3.5 text-primary" />
                                    <span>Certificate</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[11px] gap-1 px-2"
                                  onClick={() => handleOpenDetail(item)}
                                >
                                  <span>Details</span>
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 6. VACCINATION DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedRecord && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-4">
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans">
                    <Syringe className="h-5 w-5 text-primary" />
                    Vaccination Record Details
                  </DialogTitle>
                  <StatusBadge status={selectedRecord.status} size="sm" />
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Individual immunization ledger entry and digital verification stamp.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Vaccine Title Banner */}
                <div className="p-3.5 rounded-xl bg-secondary/60 border border-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Target Disease / Immunogen
                  </span>
                  <h3 className="text-base font-bold text-foreground font-sans">
                    {selectedRecord.vaccineName}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground pt-0.5">
                    <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                      {selectedRecord.dose}
                    </Badge>
                    <span>•</span>
                    <span>Category: {selectedRecord.category}</span>
                  </div>
                </div>

                {/* Recipient info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-0.5">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      Recipient Member
                    </span>
                    <p className="font-bold text-sm text-foreground">
                      {selectedRecord.memberName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedRecord.memberRelation}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-0.5">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      Administered / Due Date
                    </span>
                    <p className="font-bold text-sm text-foreground font-mono">
                      {selectedRecord.formattedDate}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedRecord.status === 'COMPLETED' ? 'Recorded on registry' : 'Pending appointment'}
                    </p>
                  </div>
                </div>

                {/* Provider, Site & Batch */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-0.5">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      Healthcare Provider
                    </span>
                    <p className="font-semibold text-foreground truncate">
                      {selectedRecord.provider}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedRecord.clinic}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-0.5">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      Batch # & Site
                    </span>
                    <p className="font-mono text-foreground font-semibold">
                      {selectedRecord.batchNumber}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedRecord.site}
                    </p>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                    Clinical Notes & Observations
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">
                    {selectedRecord.notes || 'No specific post-vaccination reactions reported.'}
                  </p>
                </div>

                {/* Certificate Section */}
                {selectedRecord.hasCertificate ? (
                  <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <span className="font-bold text-foreground">Official Digital Certificate Available</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">
                        SHA-256 Validated
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Certificate ID: <strong className="font-mono text-foreground">{selectedRecord.certificateId}</strong> • Digitally signed by healthcare authority.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="text-xs h-7 font-semibold"
                        onClick={() => {
                          setIsDetailOpen(false);
                          handleOpenCertificate(selectedRecord);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Certificate Pass
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setToastMessage(`Downloading certificate ${selectedRecord.certificateId}.pdf`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed border-border text-center text-muted-foreground">
                    <span>No digital certificate file attached to this record.</span>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Close</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. DIGITAL CERTIFICATE PREVIEW MODAL */}
      <Dialog open={isCertModalOpen} onOpenChange={setIsCertModalOpen}>
        <DialogContent className="sm:max-w-md">
          {certViewingRecord && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold font-sans">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Official Immunization Pass
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Universal Immunization Programme Digital Verification
                </DialogDescription>
              </DialogHeader>

              {/* Certificate Mockup Canvas */}
              <div className="p-6 rounded-2xl border-2 border-primary/30 bg-card space-y-5 text-center relative overflow-hidden">
                <div className="absolute -top-12 -right-12 h-32 w-32 bg-primary/10 rounded-full blur-xl pointer-events-none" />

                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] tracking-widest uppercase border-primary/40 text-primary">
                    Government of India • Ministry of Health
                  </Badge>
                  <h3 className="font-bold text-lg text-foreground font-sans pt-1">
                    Certificate of Vaccination
                  </h3>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    Pass ID: {certViewingRecord.certificateId || 'CERT-UIP-2026-X88'}
                  </p>
                </div>

                <Separator />

                <div className="text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beneficiary Name:</span>
                    <strong className="text-foreground">{certViewingRecord.memberName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vaccine Administered:</span>
                    <strong className="text-foreground">{certViewingRecord.vaccineName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dose / Batch:</span>
                    <span className="font-mono text-foreground">{certViewingRecord.dose} • {certViewingRecord.batchNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Administration:</span>
                    <span className="font-mono text-foreground">{certViewingRecord.formattedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Administering Center:</span>
                    <span className="text-foreground truncate max-w-[180px]">{certViewingRecord.clinic}</span>
                  </div>
                </div>

                {/* Simulated QR Code Stamp */}
                <div className="p-3 bg-secondary/80 rounded-xl inline-flex flex-col items-center justify-center space-y-1 border border-border">
                  <div className="h-16 w-16 bg-muted-foreground/20 rounded-md border flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                    [QR VALID]
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground">Scan to verify cryptographic signature</span>
                </div>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsCertModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => {
                    setIsCertModalOpen(false);
                    setToastMessage(`Downloading official PDF for ${certViewingRecord.memberName}`);
                    setTimeout(() => setToastMessage(null), 3500);
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download PDF Pass
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. ADD VACCINATION RECORD MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans">
              <Plus className="h-5 w-5 text-primary" />
              Add Vaccination Record
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Log an administered vaccination with clinical batch and provider details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            {/* Family Member */}
            <div className="space-y-1.5">
              <Label htmlFor="add-member" className="text-xs font-semibold">
                Family Member *
              </Label>
              <Select
                value={addForm.memberId}
                onValueChange={(val) => setAddForm((prev) => ({ ...prev, memberId: val }))}
              >
                <SelectTrigger id="add-member" className="text-sm">
                  <SelectValue placeholder="Select family member" />
                </SelectTrigger>
                <SelectContent>
                  {INITIAL_FAMILY_MEMBERS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.relationship}, {m.age})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.memberId && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.memberId}
                </p>
              )}
            </div>

            {/* Vaccine & Dose */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-vaccine" className="text-xs font-semibold">
                  Vaccine Name *
                </Label>
                <Select
                  value={addForm.vaccineName}
                  onValueChange={(val) => setAddForm((prev) => ({ ...prev, vaccineName: val }))}
                >
                  <SelectTrigger id="add-vaccine" className="text-sm">
                    <SelectValue placeholder="Choose vaccine" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_VACCINES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.vaccineName && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.vaccineName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-dose" className="text-xs font-semibold">
                  Dose / Milestone *
                </Label>
                <Input
                  id="add-dose"
                  placeholder="e.g. Dose 1, Booster 1, Annual"
                  value={addForm.dose}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, dose: e.target.value }))}
                  className="text-sm"
                />
                {formErrors.dose && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.dose}
                  </p>
                )}
              </div>
            </div>

            {/* Date & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-date" className="text-xs font-semibold">
                  Vaccination Date *
                </Label>
                <Input
                  id="add-date"
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="text-sm"
                />
                {formErrors.date && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.date}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-category" className="text-xs font-semibold">
                  Category
                </Label>
                <Select
                  value={addForm.category}
                  onValueChange={(val) => setAddForm((prev) => ({ ...prev, category: val }))}
                >
                  <SelectTrigger id="add-category" className="text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UIP Routine">UIP Routine</SelectItem>
                    <SelectItem value="Pre-school Booster">Pre-school Booster</SelectItem>
                    <SelectItem value="Seasonal">Seasonal</SelectItem>
                    <SelectItem value="Catch-up">Catch-up</SelectItem>
                    <SelectItem value="Adult Routine">Adult Routine</SelectItem>
                    <SelectItem value="Travel / Other">Travel / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Provider & Clinic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-clinic" className="text-xs font-semibold">
                  Healthcare Center / Clinic
                </Label>
                <Input
                  id="add-clinic"
                  placeholder="e.g. City Child Clinic"
                  value={addForm.clinic}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, clinic: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-provider" className="text-xs font-semibold">
                  Healthcare Professional / Doctor
                </Label>
                <Input
                  id="add-provider"
                  placeholder="e.g. Dr. Sunita Sharma"
                  value={addForm.provider}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, provider: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Batch & Site */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-batch" className="text-xs font-semibold">
                  Batch / Lot Number
                </Label>
                <Input
                  id="add-batch"
                  placeholder="e.g. MR-2026-X84"
                  value={addForm.batchNumber}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, batchNumber: e.target.value }))}
                  className="text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-site" className="text-xs font-semibold">
                  Administration Site
                </Label>
                <Select
                  value={addForm.site}
                  onValueChange={(val) => setAddForm((prev) => ({ ...prev, site: val }))}
                >
                  <SelectTrigger id="add-site" className="text-sm">
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMINISTRATION_SITES.map((site) => (
                      <SelectItem key={site} value={site}>
                        {site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="add-notes" className="text-xs font-semibold">
                Clinical Observations / Notes (Optional)
              </Label>
              <Textarea
                id="add-notes"
                rows={2}
                placeholder="Patient tolerated well; no immediate hypersensitivity noted."
                value={addForm.notes}
                onChange={(e) => setAddForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* Simulated Attachment Zone */}
            <div className="p-3 rounded-xl border border-dashed border-border bg-secondary/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <span>Attach Digital Certificate (PDF / Image)</span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                Optional Demo
              </Badge>
            </div>

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" className="font-semibold">
                Save Vaccination Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
