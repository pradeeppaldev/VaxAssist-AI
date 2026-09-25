import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Activity,
  FileCheck,
  Bell,
  ArrowRight,
  Syringe,
  MapPin,
  Check,
  Info,
  CalendarDays,
  Smartphone,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Send
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

// Common & Healthcare UI Components
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { AICard, AIHeader, AIHighlight } from '@/components/ai/AIComponents';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';

// shadcn Primitives
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ==========================================
// MOCK DATA FOR PATIENT / FAMILY DASHBOARD
// ==========================================

const FAMILY_MEMBERS = [
  {
    id: 'fam-1',
    name: 'Aarav Pal',
    relationship: 'Son',
    age: '8 years',
    dob: '2018-04-12',
    gender: 'Male',
    bloodGroup: 'O+',
    avatarFallback: 'AP',
    avatarBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    progress: 85,
    completedDoses: 11,
    totalDoses: 13,
    status: 'ACTION_NEEDED',
    statusLabel: '1 Overdue',
    statusVariant: 'overdue',
    nextVaccine: {
      name: 'Measles-Rubella (MR - Dose 1)',
      due: 'Oct 12, 2026',
      relative: '12 days overdue',
      status: 'OVERDUE',
    },
  },
  {
    id: 'fam-2',
    name: 'Anaya Pal',
    relationship: 'Daughter',
    age: '4 years',
    dob: '2022-09-18',
    gender: 'Female',
    bloodGroup: 'B+',
    avatarFallback: 'AP',
    avatarBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    progress: 78,
    completedDoses: 7,
    totalDoses: 9,
    status: 'DUE_SOON',
    statusLabel: '1 Due Soon',
    statusVariant: 'due',
    nextVaccine: {
      name: 'DPT Booster (Dose 1)',
      due: 'Oct 29, 2026',
      relative: 'Due in 5 days',
      status: 'DUE',
    },
  },
  {
    id: 'fam-3',
    name: 'Meera Pal',
    relationship: 'Spouse',
    age: '32 years',
    dob: '1994-06-25',
    gender: 'Female',
    bloodGroup: 'A+',
    avatarFallback: 'MP',
    avatarBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    progress: 100,
    completedDoses: 8,
    totalDoses: 8,
    status: 'UP_TO_DATE',
    statusLabel: 'All Up to Date',
    statusVariant: 'success',
    nextVaccine: {
      name: 'All scheduled vaccines completed',
      due: 'Routine Complete',
      relative: 'Next review 2028',
      status: 'COMPLETED',
    },
  },
  {
    id: 'fam-4',
    name: 'Pradeep Pal',
    relationship: 'Self (Account Owner)',
    age: '35 years',
    dob: '1991-02-14',
    gender: 'Male',
    bloodGroup: 'O+',
    avatarFallback: 'PP',
    avatarBg: 'bg-primary/10 text-primary border-primary/20',
    progress: 89,
    completedDoses: 8,
    totalDoses: 9,
    status: 'UPCOMING',
    statusLabel: '1 Upcoming',
    statusVariant: 'secondary',
    nextVaccine: {
      name: 'Annual Influenza Shot (Quadrivalent)',
      due: 'Nov 15, 2026',
      relative: 'Due in 3 weeks',
      status: 'UPCOMING',
    },
  },
];

const ATTENTION_ITEMS = [
  {
    id: 'att-1',
    memberId: 'fam-1',
    memberName: 'Aarav Pal',
    relationship: 'Son (8 yrs)',
    vaccineName: 'Measles-Rubella (MR - Dose 1)',
    status: 'OVERDUE',
    dueDate: 'Oct 12, 2026',
    timeElapsed: '12 days overdue',
    description:
      'Recommended under Universal Immunization Programme (UIP). Critical for herd immunity against measles and rubella.',
    actionPrimary: 'Schedule Catch-Up',
    actionSecondary: 'Record Dose',
    clinicHint: 'Primary Health Center (Sector 8) or Pediatrician',
  },
  {
    id: 'att-2',
    memberId: 'fam-2',
    memberName: 'Anaya Pal',
    relationship: 'Daughter (4 yrs)',
    vaccineName: 'DPT Booster (Dose 1)',
    status: 'DUE',
    dueDate: 'Oct 29, 2026',
    timeElapsed: 'Due in 5 days',
    description:
      'Booster dose recommended between ages 4-6 to maintain protection against Diphtheria, Pertussis, and Tetanus.',
    actionPrimary: 'View Clinic Info',
    actionSecondary: 'Record Dose',
    clinicHint: 'City Child Care Clinic • Appointment Confirmed for Oct 29',
  },
];

const UPCOMING_VACCINATIONS = [
  {
    id: 'vax-1',
    memberId: 'fam-2',
    memberName: 'Anaya Pal',
    memberAge: '4 yrs',
    vaccineName: 'DPT Booster (Dose 1)',
    doseNumber: 'Booster 1',
    dueDate: 'Oct 29, 2026',
    relativeTime: 'In 5 days',
    status: 'DUE',
    clinic: 'City Child Care Clinic, Sector 14',
    category: 'Booster',
  },
  {
    id: 'vax-2',
    memberId: 'fam-1',
    memberName: 'Aarav Pal',
    memberAge: '8 yrs',
    vaccineName: 'Measles-Rubella (MR - Dose 1)',
    doseNumber: 'Dose 1',
    dueDate: 'Oct 12, 2026',
    relativeTime: '12 days overdue',
    status: 'OVERDUE',
    clinic: 'Primary Health Center North',
    category: 'Catch-up',
  },
  {
    id: 'vax-3',
    memberId: 'fam-4',
    memberName: 'Pradeep Pal',
    memberAge: '35 yrs',
    vaccineName: 'Annual Influenza (Quadrivalent)',
    doseNumber: 'Annual',
    dueDate: 'Nov 15, 2026',
    relativeTime: 'In 3 weeks',
    status: 'UPCOMING',
    clinic: 'Apollo Clinic & Diagnostic Hub',
    category: 'Seasonal',
  },
  {
    id: 'vax-4',
    memberId: 'fam-2',
    memberName: 'Anaya Pal',
    memberAge: '4 yrs',
    vaccineName: 'Oral Polio Vaccine (OPV Booster)',
    doseNumber: 'Booster',
    dueDate: 'Dec 10, 2026',
    relativeTime: 'In 7 weeks',
    status: 'UPCOMING',
    clinic: 'City Child Care Clinic, Sector 14',
    category: 'Routine',
  },
];

const REMINDERS = [
  {
    id: 'rem-1',
    title: "Anaya's DPT Booster Appointment",
    targetDate: 'Tomorrow, Oct 28 • 9:00 AM',
    channel: 'WhatsApp & SMS',
    badge: 'Tomorrow',
    active: true,
  },
  {
    id: 'rem-2',
    title: "Aarav's MR-1 Overdue Follow-up Notice",
    targetDate: 'Sent 2 days ago • Oct 22, 2026',
    channel: 'SMS & In-App Alert',
    badge: 'Overdue Alert',
    active: true,
  },
  {
    id: 'rem-3',
    title: 'Seasonal Flu Shot Window for Family',
    targetDate: 'Opens Nov 01, 2026',
    channel: 'Email & WhatsApp',
    badge: 'In 2 weeks',
    active: true,
  },
];

const RECENT_ACTIVITY = [
  {
    id: 'act-1',
    title: 'Oral Polio Vaccine (OPV) Booster logged',
    member: 'Anaya Pal',
    date: 'Oct 22, 2026',
    subtext: 'Verified by Dr. Sunita Sharma • Reg. #DL-8821',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'act-2',
    title: 'Automated WhatsApp reminder delivered',
    member: 'Aarav Pal',
    date: 'Oct 20, 2026',
    subtext: 'Sent to registered contact +91 98765-43210',
    icon: Bell,
    iconColor: 'text-primary bg-primary/10 border-primary/20',
  },
  {
    id: 'act-3',
    title: 'Official Immunization Certificate Downloaded',
    member: 'Meera Pal',
    date: 'Oct 18, 2026',
    subtext: 'Digitally signed record with SHA-256 validation',
    icon: FileCheck,
    iconColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    id: 'act-4',
    title: 'Aarav Pal added to family account',
    member: 'Aarav Pal',
    date: 'Oct 01, 2026',
    subtext: 'Historical vaccine records imported and verified',
    icon: UserPlus,
    iconColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
];

const AI_SUGGESTION_PROMPTS = [
  {
    label: 'Aarav missed his MR-1 dose',
    query: 'What is the catch-up protocol if my 8-year-old missed the Measles-Rubella (MR) booster?',
  },
  {
    label: 'DPT booster side effects',
    query: 'What are the expected side effects after a 4-year-old receives the DPT booster?',
  },
  {
    label: 'Co-administering Flu & DPT',
    query: 'Can my child receive an annual flu vaccine and a booster shot during the same clinic visit?',
  },
];

// ==========================================
// MAIN PATIENT DASHBOARD COMPONENT
// ==========================================

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // View state switcher: 'normal' | 'loading' | 'empty' | 'error'
  const [viewState, setViewState] = useState('normal');

  // Record Vaccination Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordSuccess, setRecordSuccess] = useState(false);
  const [recordForm, setRecordForm] = useState({
    memberId: 'fam-1',
    vaccineName: 'Measles-Rubella (MR - Dose 1)',
    dateAdministered: '2026-10-24',
    clinicName: 'Primary Health Center North',
    batchNumber: 'MR-2026-X84',
    injectionSite: 'Left Upper Arm (Deltoid)',
    notes: '',
  });

  const userName = user?.name ? user.name.split(' ')[0] : 'Pradeep';
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleOpenRecordModal = (prefillMemberId, prefillVaccine) => {
    if (prefillMemberId) {
      setRecordForm((prev) => ({
        ...prev,
        memberId: prefillMemberId,
        vaccineName: prefillVaccine || prev.vaccineName,
      }));
    }
    setRecordSuccess(false);
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    setRecordSuccess(true);
    setTimeout(() => {
      setIsRecordModalOpen(false);
      setRecordSuccess(false);
    }, 1500);
  };

  const handleAskAIWithPrompt = (promptQuery) => {
    navigate('/ai-assistant', { state: { prefilledQuery: promptQuery } });
  };

  // ==========================================
  // VIEW MODE: LOADING SKELETON
  // ==========================================
  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        {/* State Preview Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="font-semibold text-foreground">Interactive State Preview:</span>
            <span>Switch between dashboard display modes</span>
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
              Loading Skeleton
            </Button>
            <Button
              size="sm"
              variant={viewState === 'empty' ? 'default' : 'outline'}
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

        {/* Skeleton Header */}
        <div className="space-y-2 pb-4 border-b border-border/60">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        {/* Skeleton Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))}
        </div>

        {/* Skeleton Priority Banner */}
        <Card className="p-6 space-y-4 border-status-overdue/30 bg-status-overdue-bg/10">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-72" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </Card>

        {/* Skeleton Family Cards */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </Card>
            ))}
          </div>
        </div>

        {/* Skeleton Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: EMPTY STATE
  // ==========================================
  if (viewState === 'empty') {
    return (
      <div className="space-y-6">
        {/* State Preview Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="font-semibold text-foreground">Interactive State Preview:</span>
            <span>Switch between dashboard display modes</span>
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
              Loading Skeleton
            </Button>
            <Button
              size="sm"
              variant={viewState === 'empty' ? 'default' : 'outline'}
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

        <PageHeader
          title={`Good morning, ${userName}`}
          subtitle="Welcome to VaxAssist AI. Start by adding your family members to begin tracking immunization schedules."
          badge={
            <Badge variant="outline" className="border-border bg-secondary text-muted-foreground font-medium text-xs py-1 px-2.5">
              New Account
            </Badge>
          }
        />

        <EmptyState
          icon={Users}
          title="No family members registered yet"
          description="Track your children, spouse, or senior parents in one secure, unified healthcare dashboard. VaxAssist AI automatically calculates national schedules and alerts you when vaccines are due."
          actionLabel="+ Add First Family Member"
          onAction={() => navigate('/family')}
          secondaryActionLabel="Explore National UIP Schedule"
          onSecondaryAction={() => navigate('/schedule')}
          className="my-8 py-16"
        />
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: ERROR STATE
  // ==========================================
  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        {/* State Preview Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="font-semibold text-foreground">Interactive State Preview:</span>
            <span>Switch between dashboard display modes</span>
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
              Loading Skeleton
            </Button>
            <Button
              size="sm"
              variant={viewState === 'empty' ? 'default' : 'outline'}
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

        <PageHeader
          title={`Good morning, ${userName}`}
          subtitle="System synchronization is temporarily experiencing an interruption."
        />

        <ErrorState
          title="Unable to synchronize family records"
          description="We encountered an issue connecting to the immunization registry cache. Your offline data remains safe."
          onRetry={() => setViewState('normal')}
          className="my-12 py-12"
        />
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: NORMAL COMPLETE DASHBOARD
  // ==========================================
  return (
    <div className="space-y-8">
      {/* 0. INTERACTIVE STATE PREVIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Interactive View Modes:</span>
          <span className="hidden sm:inline">Preview the dashboard in different lifecycle states</span>
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
            Loading Skeleton
          </Button>
          <Button
            size="sm"
            variant={viewState === 'empty' ? 'default' : 'outline'}
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

      {/* 1. WELCOME HEADER */}
      <PageHeader
        title={`Good morning, ${userName}`}
        subtitle={`Here is your family vaccination overview for ${currentDateFormatted}. Tracking national schedules and real-time alerts.`}
        badge={
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary font-medium text-xs py-1 px-2.5 gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            Family Account • 4 Members
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleOpenRecordModal()}
              className="gap-2 font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Record Vaccination</span>
            </Button>
            <Button
              variant="outline"
              asChild
              className="gap-1.5 hidden sm:inline-flex"
            >
              <Link to="/family">
                <UserPlus className="h-4 w-4" />
                <span>Add Member</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* 2. OVERVIEW METRICS */}
      <section aria-label="Key Family Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Family Members"
            value="4"
            subtext="All profiles active & synced"
            icon={Users}
            accentColor="cyan"
            onClick={() => navigate('/family')}
          />
          <MetricCard
            title="Completed Doses"
            value="28"
            subtext="82% total family completion"
            icon={CheckCircle2}
            accentColor="success"
            badgeText="+2 this month"
            badgeVariant="outline"
            onClick={() => navigate('/vaccinations')}
          />
          <MetricCard
            title="Upcoming Doses"
            value="3"
            subtext="Within the next 30 days"
            icon={Calendar}
            accentColor="cyan"
            badgeText="Next in 5d"
            badgeVariant="secondary"
            onClick={() => navigate('/schedule')}
          />
          <MetricCard
            title="Attention Needed"
            value="2"
            subtext="1 overdue dose, 1 due soon"
            icon={AlertTriangle}
            accentColor="danger"
            badgeText="Action Req."
            badgeVariant="destructive"
          />
        </div>
      </section>

      {/* 3. PRIORITY / ATTENTION CARD */}
      <section aria-label="Vaccinations Requiring Attention">
        <Card className="border-status-overdue/40 bg-status-overdue-bg/20 shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-status-overdue/20 bg-status-overdue-bg/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-status-overdue text-white shrink-0 shadow-xs">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                    2 Vaccinations Require Your Attention
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                    Timely administration ensures protection against vaccine-preventable diseases under UIP guidelines.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="destructive" className="self-start sm:self-auto text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider">
                Immediate Action
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ATTENTION_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all hover:border-primary/40 hover:shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-foreground font-sans">
                            {item.memberName}
                          </h4>
                          <span className="text-xs text-muted-foreground font-medium">
                            • {item.relationship}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-primary mt-0.5">
                          {item.vaccineName}
                        </p>
                      </div>
                      <StatusBadge status={item.status} size="default" />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">
                        {item.status === 'OVERDUE' ? `Due Date: ${item.dueDate}` : `Due in: ${item.timeElapsed}`}
                      </span>
                      <span className="text-status-overdue font-semibold">({item.timeElapsed})</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/90 bg-secondary/60 rounded-lg p-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{item.clinicHint}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                    <Button
                      size="sm"
                      className="font-semibold text-xs h-8 flex-1"
                      onClick={() => navigate('/schedule')}
                    >
                      {item.actionPrimary}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => handleOpenRecordModal(item.memberId, item.vaccineName)}
                    >
                      <Check className="h-3.5 w-3.5 mr-1 text-status-completed" />
                      Log Dose
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. FAMILY OVERVIEW SECTION */}
      <section aria-label="Family Members Overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
              Tracked Family Members
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Individual vaccination progress, active milestones, and next required doses
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-primary hover:text-primary font-semibold text-xs sm:text-sm">
            <Link to="/family">
              <span>View All Members (4)</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FAMILY_MEMBERS.map((member) => (
            <Card
              key={member.id}
              className="transition-all duration-200 hover:border-primary/40 hover:shadow-xs flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className={`h-11 w-11 border ${member.avatarBg}`}>
                      <AvatarFallback className="font-bold text-sm">
                        {member.avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-foreground truncate font-sans">
                        {member.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.relationship} • {member.age}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Coverage</span>
                    <span className="font-bold text-foreground">{member.progress}%</span>
                  </div>
                  <Progress value={member.progress} className="h-2" />
                  <p className="text-[11px] text-muted-foreground">
                    {member.completedDoses} of {member.totalDoses} doses completed
                  </p>
                </div>

                <Separator />

                {/* Next Vaccine Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Next Dose:</span>
                    <StatusBadge status={member.nextVaccine.status} size="sm" />
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {member.nextVaccine.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {member.nextVaccine.relative}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="px-5 py-3 border-t border-border/60 bg-muted/20 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="w-full text-xs font-semibold justify-between h-8 px-2 hover:bg-background"
                >
                  <Link to={`/family/${member.id}`}>
                    <span>View Schedule</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. VACCINATION PROGRESS & HEALTHCARE TARGETS */}
      <section aria-label="Family Progress Summary">
        <Card className="border border-border/80 bg-linear-to-r from-card via-card to-primary/[0.03]">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Progress circle / stat */}
              <div className="lg:col-span-4 flex items-center gap-5 sm:border-r border-border/60 pr-0 lg:pr-6">
                <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-4 border-primary/20 bg-primary/5 shrink-0">
                  <span className="text-2xl sm:text-3xl font-extrabold text-primary font-sans">
                    82%
                  </span>
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs border-status-completed/40 bg-status-completed-bg text-status-completed-fg">
                    On Track • High Coverage
                  </Badge>
                  <h3 className="text-base font-bold text-foreground">
                    Family Immunization Index
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    28 of 34 total family vaccine milestones safely recorded
                  </p>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="lg:col-span-8 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/50">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Completed
                    </p>
                    <p className="text-xl font-bold text-status-completed mt-0.5 font-sans">
                      28 doses
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/50">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Upcoming
                    </p>
                    <p className="text-xl font-bold text-primary mt-0.5 font-sans">
                      3 doses
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/50">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Overdue
                    </p>
                    <p className="text-xl font-bold text-status-overdue mt-0.5 font-sans">
                      1 dose
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/50">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Catch-up Plan
                    </p>
                    <p className="text-xl font-bold text-status-catchup mt-0.5 font-sans">
                      Active
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Aligned with the Indian Universal Immunization Programme (UIP) & WHO guidelines for pediatric and adult health.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. TWO-COLUMN SPLIT: UPCOMING VACCINATIONS & REMINDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upcoming Vaccinations (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
                Upcoming Vaccinations
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Scheduled and pending doses across all registered members
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-primary hover:text-primary font-semibold text-xs sm:text-sm">
              <Link to="/schedule">
                <span>View Full Schedule</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Card className="border border-border/80 overflow-hidden">
            <div className="divide-y divide-border/60">
              {UPCOMING_VACCINATIONS.map((vax) => (
                <div
                  key={vax.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-muted/30"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground font-sans">
                        {vax.memberName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({vax.memberAge})
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                        {vax.category}
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-sm sm:text-base text-foreground">
                      {vax.vaccineName}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{vax.dueDate}</span>
                        <span className="text-foreground font-medium">({vax.relativeTime})</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{vax.clinic}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                    <StatusBadge status={vax.status} size="default" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-2.5"
                      onClick={() => handleOpenRecordModal(vax.memberId, vax.vaccineName)}
                    >
                      Log Dose
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <CardFooter className="p-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing 4 immediate priority and upcoming immunization appointments</span>
              <Button variant="link" size="sm" asChild className="text-xs h-auto p-0 font-semibold text-primary">
                <Link to="/schedule">Open Calendar View →</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Reminders & Alerts (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
                Reminders & Alerts
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Automated multi-channel notifications
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-primary hover:text-primary font-semibold text-xs sm:text-sm">
              <Link to="/reminders">
                <span>Manage</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Card className="border border-border/80">
            <CardContent className="p-4 sm:p-5 space-y-3">
              {REMINDERS.map((rem) => (
                <div
                  key={rem.id}
                  className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Bell className="h-4 w-4" />
                      </div>
                      <h4 className="font-semibold text-xs sm:text-sm text-foreground">
                        {rem.title}
                      </h4>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 font-medium">
                      {rem.badge}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pl-7">
                    <span>{rem.targetDate}</span>
                    <span className="font-medium text-primary/90 flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      {rem.channel}
                    </span>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs font-semibold gap-1.5 border-dashed"
                >
                  <Link to="/reminders">
                    <Plus className="h-3.5 w-3.5" />
                    Configure New Vaccination Alert
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 7. QUICK ACTIONS GRID */}
      <section aria-label="Dashboard Quick Actions" className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
            Quick Actions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Fast shortcuts for daily immunization administration and schedule reviews
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer border border-border/80 transition-all hover:border-primary/50 hover:shadow-xs group"
            onClick={() => handleOpenRecordModal()}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                <Syringe className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors font-sans">
                  Record Vaccination
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Log newly received dose, lot number, and healthcare provider info.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border border-border/80 transition-all hover:border-primary/50 hover:shadow-xs group"
            onClick={() => navigate('/family')}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors font-sans">
                  Add Family Member
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Register newborn, school-age child, spouse, or senior parents.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border border-border/80 transition-all hover:border-primary/50 hover:shadow-xs group"
            onClick={() => navigate('/schedule')}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors font-sans">
                  View Immunization Schedule
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Browse age-stratified timelines under National Immunization Programme.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border border-primary/30 bg-primary/[0.03] transition-all hover:border-primary/60 hover:shadow-xs group"
            onClick={() => navigate('/ai-assistant')}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors font-sora">
                  Ask VaxAssist AI
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Get immediate clinical guidance on catch-up schedules and contraindications.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 8. RECENT ACTIVITY TIMELINE */}
      <section aria-label="Recent Immunization Activity" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
              Recent Activity
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Audit trail of dose verifications, reminders, and profile updates
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-primary hover:text-primary font-semibold text-xs sm:text-sm">
            <Link to="/reports">
              <span>View Audit History</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Card className="border border-border/80">
          <CardContent className="p-4 sm:p-6">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {RECENT_ACTIVITY.map((act) => {
                const IconComponent = act.icon;
                return (
                  <div key={act.id} className="relative flex items-start gap-4">
                    {/* Timeline marker icon */}
                    <div
                      className={`absolute -left-6 p-1 rounded-full border bg-background shrink-0 ${act.iconColor}`}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h4 className="font-semibold text-sm text-foreground font-sans">
                          {act.title}
                        </h4>
                        <span className="text-xs text-muted-foreground font-mono">
                          {act.date}
                        </span>
                      </div>
                      <p className="text-xs text-primary font-medium">
                        Target Member: {act.member}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {act.subtext}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 9. AI ASSISTANT CTA */}
      <section aria-label="AI Vaccination Assistant">
        <AICard className="p-6 sm:p-8">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <AIHeader
                title="Have questions about missed doses or side effects?"
                description="VaxAssist AI provides evidence-grounded answers based on official UIP guidelines, WHO recommendations, and pediatric immunobiology."
                badge="Clinical AI Assistant"
              />

              <Button
                size="lg"
                className="gap-2 font-sora font-semibold shadow-md self-start md:self-auto shrink-0"
                onClick={() => navigate('/ai-assistant')}
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>Ask VaxAssist AI</span>
              </Button>
            </div>

            {/* Prompt Suggestion Chips */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sora">
                Suggested clinical inquiries for your family:
              </p>
              <div className="flex flex-wrap gap-2">
                {AI_SUGGESTION_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskAIWithPrompt(prompt.query)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary/20 bg-background hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all text-left cursor-pointer"
                  >
                    <MessageSquare className="h-3 w-3 text-primary shrink-0" />
                    <span>"{prompt.label}"</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Grounded Clinical Disclaimer */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/80 border border-border/80 text-xs text-muted-foreground leading-relaxed">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Clinical Grounding Notice:</strong> VaxAssist AI is designed to support, not replace, the relationship that exists between a patient and their physician. Guidance is synchronized with national immunization schedules. Always consult a licensed pediatrician or healthcare professional before administering vaccines.
              </span>
            </div>
          </div>
        </AICard>
      </section>

      {/* 10. RECORD VACCINATION DIALOG MODAL */}
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans">
              <Syringe className="h-5 w-5 text-primary" />
              Record Vaccination Dose
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Add verified vaccination details to update your family immunization record.
            </DialogDescription>
          </DialogHeader>

          {recordSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-status-completed-bg text-status-completed flex items-center justify-center mx-auto border border-status-completed/30">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">
                Vaccination Logged Successfully!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                The record for {FAMILY_MEMBERS.find((m) => m.id === recordForm.memberId)?.name || 'family member'} has been updated and synchronized with the schedule.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRecordSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="memberSelect" className="text-xs font-semibold">
                  Family Member *
                </Label>
                <Select
                  value={recordForm.memberId}
                  onValueChange={(val) => setRecordForm((prev) => ({ ...prev, memberId: val }))}
                >
                  <SelectTrigger id="memberSelect" className="text-sm">
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {FAMILY_MEMBERS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.relationship}, {m.age})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vaccineInput" className="text-xs font-semibold">
                    Vaccine Name *
                  </Label>
                  <Input
                    id="vaccineInput"
                    value={recordForm.vaccineName}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, vaccineName: e.target.value }))}
                    placeholder="e.g. MR - Dose 1"
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateAdmin" className="text-xs font-semibold">
                    Date Administered *
                  </Label>
                  <Input
                    id="dateAdmin"
                    type="date"
                    value={recordForm.dateAdministered}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, dateAdministered: e.target.value }))}
                    required
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="clinicInput" className="text-xs font-semibold">
                    Clinic / Facility Name
                  </Label>
                  <Input
                    id="clinicInput"
                    value={recordForm.clinicName}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, clinicName: e.target.value }))}
                    placeholder="e.g. City Child Clinic"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="batchInput" className="text-xs font-semibold">
                    Batch / Lot Number
                  </Label>
                  <Input
                    id="batchInput"
                    value={recordForm.batchNumber}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, batchNumber: e.target.value }))}
                    placeholder="e.g. MR-2026-X84"
                    className="text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="siteSelect" className="text-xs font-semibold">
                  Administration Site
                </Label>
                <Select
                  value={recordForm.injectionSite}
                  onValueChange={(val) => setRecordForm((prev) => ({ ...prev, injectionSite: val }))}
                >
                  <SelectTrigger id="siteSelect" className="text-sm">
                    <SelectValue placeholder="Select administration site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Left Upper Arm (Deltoid)">Left Upper Arm (Deltoid)</SelectItem>
                    <SelectItem value="Right Upper Arm (Deltoid)">Right Upper Arm (Deltoid)</SelectItem>
                    <SelectItem value="Left Anterolateral Thigh">Left Anterolateral Thigh</SelectItem>
                    <SelectItem value="Right Anterolateral Thigh">Right Anterolateral Thigh</SelectItem>
                    <SelectItem value="Oral Drops">Oral Drops</SelectItem>
                    <SelectItem value="Other / Clinical Site">Other / Clinical Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notesInput" className="text-xs font-semibold">
                  Clinical Notes / Mild Reactions (Optional)
                </Label>
                <Textarea
                  id="notesInput"
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Patient tolerated well, mild erythema noted at injection site."
                  rows={2}
                  className="text-sm"
                />
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
