import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Edit3,
  Trash2,
  Heart,
  Droplet,
  MapPin,
  FileText,
  User,
  Activity,
  Check,
  X,
  Syringe,
  AlertCircle,
  FileCheck,
  Bell,
  Download,
  Share2,
  ArrowRight
} from 'lucide-react';

// Design system & layout
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';

// shadcn UI Primitives
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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

// Centralized mock data
import {
  INITIAL_FAMILY_MEMBERS,
  RELATIONSHIP_OPTIONS,
  GENDER_OPTIONS,
  BLOOD_GROUPS,
} from '@/data/mockFamilyData';

export default function FamilyMemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find member from demo data or default to first member
  const initialMember = useMemo(() => {
    return INITIAL_FAMILY_MEMBERS.find((m) => m.id === id) || INITIAL_FAMILY_MEMBERS[0];
  }, [id]);

  const [member, setMember] = useState(initialMember);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'error'
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...initialMember });
  const [formErrors, setFormErrors] = useState({});
  const [successToast, setSuccessToast] = useState(null);

  // Quick record dose state
  const [recordDoseData, setRecordDoseData] = useState({
    vaccineName: initialMember?.nextVaccine?.name || 'DPT Booster',
    date: new Date().toISOString().split('T')[0],
    clinic: initialMember?.primaryClinic || 'City Child Clinic',
    batch: 'BT-2026-X01',
    site: 'Left Upper Arm (Deltoid)',
  });

  const validateEditForm = (data) => {
    const errors = {};
    if (!data.name || !data.name.trim()) errors.name = 'Full name is required';
    if (!data.dob) errors.dob = 'Date of birth is required';
    return errors;
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const errors = validateEditForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setMember({ ...editFormData });
    setIsEditModalOpen(false);
    setSuccessToast(`Updated profile details for ${editFormData.name}.`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleRecordDoseSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      id: `hist-${Date.now()}`,
      vaccineName: recordDoseData.vaccineName,
      dose: 'Newly Administered Dose',
      dateAdministered: recordDoseData.date,
      clinic: recordDoseData.clinic,
      administeredBy: 'Staff Practitioner',
      batchNumber: recordDoseData.batch,
      site: recordDoseData.site,
      status: 'COMPLETED',
    };

    setMember((prev) => ({
      ...prev,
      completedDoses: prev.completedDoses + 1,
      progress: Math.min(100, Math.round(((prev.completedDoses + 1) / prev.totalDoses) * 100)),
      vaccinationHistory: [newRecord, ...(prev.vaccinationHistory || [])],
      activityLog: [
        {
          id: `act-${Date.now()}`,
          title: `${recordDoseData.vaccineName} recorded`,
          date: 'Just now',
          description: `Administered at ${recordDoseData.clinic}. Batch ${recordDoseData.batch}.`,
          type: 'record',
        },
        ...(prev.activityLog || []),
      ],
      needsAttention: false,
    }));

    setIsRecordModalOpen(false);
    setSuccessToast(`Logged dose of ${recordDoseData.vaccineName} for ${member.name}.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleDeleteMember = () => {
    setIsDeleteAlertOpen(false);
    navigate('/family', { replace: true });
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
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('normal')}>Normal View</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Loading Skeleton</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('error')}>Error State</Button>
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
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
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('normal')}>Normal View</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('loading')}>Loading</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Error State</Button>
          </div>
        </div>

        <PageHeader
          title="Member Profile Unavailable"
          breadcrumbs={[
            { label: 'Dashboard', href: '/patient/dashboard' },
            { label: 'Family', href: '/family' },
            { label: 'Profile' },
          ]}
        />

        <ErrorState
          title="We couldn't load this family member"
          description="The requested profile records could not be retrieved from the synchronization cache."
          onRetry={() => setViewState('normal')}
          className="my-12 py-12"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 0. INTERACTIVE STATE PREVIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Interactive View Modes:</span>
          <span className="hidden sm:inline">Preview Member Profile under different lifecycle states</span>
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
            variant={viewState === 'error' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('error')}
          >
            Error State
          </Button>
        </div>
      </div>

      {/* SUCCESS TOAST ALERT */}
      {successToast && (
        <div className="p-3.5 rounded-xl border border-status-completed/30 bg-status-completed-bg text-status-completed-fg flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-status-completed" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-muted-foreground hover:text-foreground text-xs p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. BREADCRUMBS & PROFILE HEADER */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1 px-2 text-muted-foreground hover:text-foreground">
            <Link to="/family">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Family</span>
            </Link>
          </Button>
        </div>

        {/* Profile Header Hero Card */}
        <Card className="border border-border/80 shadow-xs overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <Avatar className={`h-16 w-16 sm:h-20 sm:w-20 border-2 ${member.avatarBg} shrink-0 text-xl font-bold shadow-xs`}>
                  <AvatarFallback>{member.avatarFallback}</AvatarFallback>
                </Avatar>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                      {member.name}
                    </h1>
                    <StatusBadge status={member.status} size="default" />
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {member.relationship}
                    </Badge>
                    <span>•</span>
                    <span>{member.age}</span>
                    <span>•</span>
                    <span>DOB: {member.dob}</span>
                    <span>•</span>
                    <span className="font-mono font-medium">Blood: {member.bloodGroup}</span>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{member.primaryClinic}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{member.pediatrician}</span>
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 font-semibold text-xs h-9"
                  onClick={() => setIsRecordModalOpen(true)}
                >
                  <Syringe className="h-4 w-4" />
                  <span>Record Dose</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-9"
                  onClick={() => {
                    setEditFormData({ ...member });
                    setFormErrors({});
                    setIsEditModalOpen(true);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setIsDeleteAlertOpen(true)}
                  title="Remove Member"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. OVERVIEW STATS ROW */}
      <section aria-label="Member Immunization Statistics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Vaccination Coverage"
            value={`${member.progress}%`}
            subtext={`${member.completedDoses} of ${member.totalDoses} doses recorded`}
            icon={ShieldCheck}
            accentColor={member.progress >= 90 ? 'success' : member.progress >= 70 ? 'cyan' : 'warning'}
          />
          <MetricCard
            title="Completed Doses"
            value={member.completedDoses}
            subtext="Verified on official registry"
            icon={CheckCircle2}
            accentColor="success"
          />
          <MetricCard
            title="Upcoming Doses"
            value={member.upcomingCount}
            subtext="Within next milestone window"
            icon={Calendar}
            accentColor="cyan"
          />
          <MetricCard
            title="Attention Required"
            value={member.needsAttention ? (member.overdueCount > 0 ? `${member.overdueCount} Overdue` : 'Due Soon') : '0'}
            subtext={member.needsAttention ? member.attentionReason : 'All immunizations on track'}
            icon={AlertTriangle}
            accentColor={member.needsAttention ? 'danger' : 'neutral'}
            badgeText={member.needsAttention ? 'Action Needed' : 'Up to Date'}
            badgeVariant={member.needsAttention ? 'destructive' : 'secondary'}
          />
        </div>
      </section>

      {/* 3. MEMBER TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-grid">
          <TabsTrigger value="overview" className="text-xs sm:text-sm font-semibold">Overview</TabsTrigger>
          <TabsTrigger value="vaccinations" className="text-xs sm:text-sm font-semibold">
            Vaccinations ({member.vaccinationHistory?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm font-semibold">
            Schedule ({member.upcomingSchedule?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs sm:text-sm font-semibold">Activity</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          {/* Priority attention card if needed */}
          {member.needsAttention && (
            <Card className="border-status-overdue/40 bg-status-overdue-bg/20">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-status-overdue text-white shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-foreground font-sans">
                      Vaccination Action Required
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {member.attentionReason} • {member.nextVaccine?.notes}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="font-semibold text-xs h-8.5 shrink-0 self-start sm:self-center"
                  onClick={() => setIsRecordModalOpen(true)}
                >
                  <Syringe className="h-3.5 w-3.5 mr-1.5" />
                  Record Administered Dose
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Demographics & Clinical Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold font-sans">
                    Demographic & Clinical Information
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Personal vitals, assigned clinical care team, and registered contact
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                      <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                        Full Name & Gender
                      </span>
                      <p className="font-bold text-sm text-foreground">
                        {member.name} ({member.gender})
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                      <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                        Date of Birth & Age
                      </span>
                      <p className="font-bold text-sm text-foreground">
                        {member.dob} ({member.age})
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                      <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                        Blood Group
                      </span>
                      <p className="font-bold text-sm text-primary font-mono">
                        {member.bloodGroup}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                      <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                        Registered Primary Clinic
                      </span>
                      <p className="font-bold text-sm text-foreground truncate">
                        {member.primaryClinic}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/50 space-y-1 sm:col-span-2">
                      <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                        Allergies & Medical Sensitivities
                      </span>
                      <p className="font-medium text-sm text-foreground">
                        {member.allergies || 'No known allergies reported.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Milestone Card */}
              <Card className="border border-primary/20 bg-linear-to-r from-card to-primary/[0.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold font-sans">
                      Next Scheduled Immunization
                    </CardTitle>
                    <StatusBadge status={member.nextVaccine?.status} size="sm" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-3">
                  <div>
                    <h4 className="font-bold text-lg text-foreground font-sans">
                      {member.nextVaccine?.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target Due Date: <strong className="text-foreground">{member.nextVaccine?.dueDate}</strong> ({member.nextVaccine?.relative})
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {member.nextVaccine?.notes}
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => setIsRecordModalOpen(true)}
                      className="text-xs font-semibold"
                    >
                      <Syringe className="h-3.5 w-3.5 mr-1.5" />
                      Record This Vaccine
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="text-xs"
                    >
                      <Link to="/ai-assistant" state={{ prefilledQuery: `What are the benefits and catch-up recommendations for ${member.nextVaccine?.name}?` }}>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Ask AI About This Dose
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Quick Summary & Recent Activity */}
            <div className="space-y-6">
              <Card className="border border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold font-sans">
                    Vaccination Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">National Target (UIP)</span>
                      <span className="font-bold text-foreground font-sans">{member.progress}%</span>
                    </div>
                    <Progress value={member.progress} className="h-2.5" />
                    <p className="text-[11px] text-muted-foreground">
                      {member.completedDoses} administered doses out of {member.totalDoses} expected for age
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Pediatrician:</span>
                      <span className="font-semibold text-foreground truncate max-w-[150px]">{member.pediatrician}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Emergency Contact:</span>
                      <span className="font-semibold text-foreground">{member.phone || '+91 98765-43210'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity for this member */}
              <Card className="border border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold font-sans">
                    Recent Member Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3">
                  {member.activityLog && member.activityLog.length > 0 ? (
                    member.activityLog.map((act) => (
                      <div key={act.id} className="text-xs p-2.5 rounded-lg bg-secondary/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{act.title}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{act.date}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{act.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No recent activity recorded.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: VACCINATIONS PREVIEW */}
        <TabsContent value="vaccinations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground font-sans">
                Vaccination Records Ledger
              </h3>
              <p className="text-xs text-muted-foreground">
                Verified administered vaccines with clinic stamps and lot numbers
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsRecordModalOpen(true)}
              className="gap-1.5 text-xs font-semibold h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log New Record</span>
            </Button>
          </div>

          <Card className="border border-border/80 overflow-hidden">
            {member.vaccinationHistory && member.vaccinationHistory.length > 0 ? (
              <div className="divide-y divide-border/60">
                {member.vaccinationHistory.map((rec) => (
                  <div key={rec.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-foreground font-sans">
                          {rec.vaccineName}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                          {rec.dose}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {rec.dateAdministered}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {rec.clinic}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">Batch: {rec.batchNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                      <StatusBadge status={rec.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <Syringe className="h-8 w-8 text-muted-foreground mx-auto" />
                <h4 className="font-semibold text-foreground">No immunization records logged yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click "Log New Record" to record your child or family member's historical vaccinations.
                </p>
                <Button size="sm" onClick={() => setIsRecordModalOpen(true)}>
                  Log First Vaccine
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 3: SCHEDULE PREVIEW */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground font-sans">
                Upcoming Vaccination Schedule
              </h3>
              <p className="text-xs text-muted-foreground">
                Target milestones under the Universal Immunization Programme (UIP)
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs h-8">
              <Link to="/schedule">View Full National Calendar</Link>
            </Button>
          </div>

          <Card className="border border-border/80 overflow-hidden">
            {member.upcomingSchedule && member.upcomingSchedule.length > 0 ? (
              <div className="divide-y divide-border/60">
                {member.upcomingSchedule.map((item) => (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-foreground font-sans">
                          {item.vaccineName}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] py-0 h-4">
                          Target: {item.targetAge}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">Due: {item.dueDate}</span>
                        <span className={item.status === 'OVERDUE' ? 'text-status-overdue font-semibold' : ''}>
                          ({item.timeElapsed})
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                      <StatusBadge status={item.status} size="default" />
                      <Button
                        size="sm"
                        onClick={() => {
                          setRecordDoseData((prev) => ({
                            ...prev,
                            vaccineName: item.vaccineName,
                          }));
                          setIsRecordModalOpen(true);
                        }}
                        className="text-xs h-8"
                      >
                        Record Dose
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-status-completed mx-auto" />
                <h4 className="font-semibold text-foreground">All scheduled vaccines up to date!</h4>
                <p className="text-xs text-muted-foreground">
                  No pending vaccinations for this age milestone.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 4: ACTIVITY LOG */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="border border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-sans">
                Activity & Audit History
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Chronological updates, notifications dispatched, and record modifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {member.activityLog && member.activityLog.length > 0 ? (
                  member.activityLog.map((act) => (
                    <div key={act.id} className="relative flex items-start gap-3">
                      <div className="absolute -left-6 p-1 rounded-full border bg-background shrink-0 text-primary border-primary/20">
                        <Activity className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground font-sans">
                            {act.title}
                          </h4>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            • {act.date}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {act.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No activity history available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 4. RECORD VACCINATION DOSE DIALOG */}
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans">
              <Syringe className="h-5 w-5 text-primary" />
              Record Vaccine for {member.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add details of the administered dose to update the immunization record.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordDoseSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rec-vax" className="text-xs font-semibold">Vaccine Name *</Label>
              <Input
                id="rec-vax"
                value={recordDoseData.vaccineName}
                onChange={(e) => setRecordDoseData((prev) => ({ ...prev, vaccineName: e.target.value }))}
                required
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rec-date" className="text-xs font-semibold">Date Administered *</Label>
                <Input
                  id="rec-date"
                  type="date"
                  value={recordDoseData.date}
                  onChange={(e) => setRecordDoseData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rec-batch" className="text-xs font-semibold">Batch / Lot #</Label>
                <Input
                  id="rec-batch"
                  value={recordDoseData.batch}
                  onChange={(e) => setRecordDoseData((prev) => ({ ...prev, batch: e.target.value }))}
                  className="text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-clinic" className="text-xs font-semibold">Clinic / Hospital Name</Label>
              <Input
                id="rec-clinic"
                value={recordDoseData.clinic}
                onChange={(e) => setRecordDoseData((prev) => ({ ...prev, clinic: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-site" className="text-xs font-semibold">Injection Site</Label>
              <Select
                value={recordDoseData.site}
                onValueChange={(val) => setRecordDoseData((prev) => ({ ...prev, site: val }))}
              >
                <SelectTrigger id="rec-site" className="text-sm">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Left Upper Arm (Deltoid)">Left Upper Arm (Deltoid)</SelectItem>
                  <SelectItem value="Right Upper Arm (Deltoid)">Right Upper Arm (Deltoid)</SelectItem>
                  <SelectItem value="Left Anterolateral Thigh">Left Anterolateral Thigh</SelectItem>
                  <SelectItem value="Right Anterolateral Thigh">Right Anterolateral Thigh</SelectItem>
                  <SelectItem value="Oral Drops">Oral Drops</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">Cancel</Button>
              </DialogClose>
              <Button type="submit" size="sm" className="font-semibold">
                Save & Update Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. EDIT PROFILE DIALOG */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Profile — {member.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update personal details, clinical facility, and allergy records.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-profile-name" className="text-xs font-semibold">Full Name *</Label>
              <Input
                id="edit-profile-name"
                value={editFormData.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditFormData((prev) => ({ ...prev, name: val }));
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                }}
                className={`text-sm ${formErrors.name ? 'border-destructive' : ''}`}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-profile-rel" className="text-xs font-semibold">Relationship *</Label>
                <Select
                  value={editFormData.relationship}
                  onValueChange={(val) => setEditFormData((prev) => ({ ...prev, relationship: val }))}
                >
                  <SelectTrigger id="edit-profile-rel" className="text-sm">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-profile-gender" className="text-xs font-semibold">Gender *</Label>
                <Select
                  value={editFormData.gender}
                  onValueChange={(val) => setEditFormData((prev) => ({ ...prev, gender: val }))}
                >
                  <SelectTrigger id="edit-profile-gender" className="text-sm">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-profile-dob" className="text-xs font-semibold">Date of Birth *</Label>
                <Input
                  id="edit-profile-dob"
                  type="date"
                  value={editFormData.dob}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditFormData((prev) => ({ ...prev, dob: val }));
                    if (formErrors.dob) setFormErrors((prev) => ({ ...prev, dob: null }));
                  }}
                  className={`text-sm ${formErrors.dob ? 'border-destructive' : ''}`}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-profile-blood" className="text-xs font-semibold">Blood Group</Label>
                <Select
                  value={editFormData.bloodGroup}
                  onValueChange={(val) => setEditFormData((prev) => ({ ...prev, bloodGroup: val }))}
                >
                  <SelectTrigger id="edit-profile-blood" className="text-sm">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-profile-clinic" className="text-xs font-semibold">Primary Clinic / Healthcare Center</Label>
              <Input
                id="edit-profile-clinic"
                value={editFormData.primaryClinic || ''}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, primaryClinic: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-profile-allergies" className="text-xs font-semibold">Allergies & Medical Sensitivities</Label>
              <Textarea
                id="edit-profile-allergies"
                rows={2}
                value={editFormData.allergies || ''}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, allergies: e.target.value }))}
                className="text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">Cancel</Button>
              </DialogClose>
              <Button type="submit" size="sm" className="font-semibold">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. REMOVE / ARCHIVE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold font-sans">
              Remove this family member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This will remove <strong className="text-foreground">{member.name}</strong> from your active family group and archive their immunization tracking history and reminder subscriptions. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
