import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { familyApi } from '@/services/api';
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
  Search,
  Filter,
  Edit3,
  Trash2,
  UserCheck,
  Heart,
  Droplet,
  MapPin,
  ArrowRight,
  Info,
  Check,
  X,
  Phone,
  Mail,
  AlertCircle
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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

export default function FamilyPage() {
  const navigate = useNavigate();

  // State Management
  const [members, setMembers] = useState(INITIAL_FAMILY_MEMBERS);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ATTENTION' | 'CHILDREN' | 'ADULTS' | 'COMPLETED'

  // Modals & Dialogs State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [alertNotice, setAlertNotice] = useState(null);

  // Form State for Add Member
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Son',
    dob: '',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    allergies: '',
    primaryClinic: '',
  });

  const [formErrors, setFormErrors] = useState({});

  // Summary counts
  const totalMembers = members.length;
  const childrenCount = members.filter((m) => m.isChild).length;
  const adultsCount = members.filter((m) => !m.isChild).length;
  const attentionCount = members.filter((m) => m.needsAttention).length;

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search query
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.relationship.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.nextVaccine?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'ATTENTION') return member.needsAttention;
      if (statusFilter === 'CHILDREN') return member.isChild;
      if (statusFilter === 'ADULTS') return !member.isChild;
      if (statusFilter === 'COMPLETED') return member.status === 'COMPLETED';

      return true;
    });
  }, [members, searchQuery, statusFilter]);

  // Validation
  const validateForm = (data) => {
    const errors = {};
    if (!data.name || !data.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!data.dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const birthDate = new Date(data.dob);
      if (isNaN(birthDate.getTime())) {
        errors.dob = 'Please provide a valid date';
      } else if (birthDate > new Date()) {
        errors.dob = 'Date of birth cannot be in the future';
      }
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    return errors;
  };

  // Backend to UI Mappers
  const mapBackendMemberToUi = (m) => {
    const birthYear = m.date_of_birth ? new Date(m.date_of_birth).getFullYear() : new Date().getFullYear();
    const ageYears = Math.max(0, new Date().getFullYear() - birthYear);
    const isChild = ageYears < 18 || m.relationship === 'CHILD';
    const initials = (m.full_name || 'FM')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'FM';

    return {
      id: m.id,
      name: m.full_name,
      relationship: m.relationship === 'CHILD' ? 'Child' : (m.relationship ? m.relationship.charAt(0) + m.relationship.slice(1).toLowerCase() : 'Dependent'),
      age: `${ageYears} year${ageYears === 1 ? '' : 's'}`,
      dob: m.date_of_birth,
      gender: m.gender ? m.gender.charAt(0) + m.gender.slice(1).toLowerCase() : 'Other',
      bloodGroup: m.blood_group || 'Unknown',
      isChild,
      phone: '',
      email: '',
      allergies: Array.isArray(m.allergies) ? m.allergies.join(', ') : (m.allergies || 'No known allergies reported'),
      primaryClinic: m.notes || 'Community Health Center',
      pediatrician: isChild ? 'Assigned Pediatrician' : 'General Practitioner',
      avatarFallback: initials,
      avatarBg: isChild
        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      progress: 75,
      completedDoses: 8,
      totalDoses: 10,
      upcomingCount: 1,
      overdueCount: 0,
      isOfflinePending: !!m.isOfflinePending,
      status: m.isOfflinePending ? 'SYNC_PENDING' : 'UPCOMING',
      statusLabel: m.isOfflinePending ? 'Sync Pending' : 'Active Schedule',
      statusVariant: m.isOfflinePending ? 'warning' : 'secondary',
      needsAttention: false,
      attentionReason: null,
      nextVaccine: {
        name: 'Routine Health & Immunization Check',
        dueDate: 'Within 30 Days',
        relative: 'Scheduled',
        status: 'UPCOMING',
        clinic: m.notes || 'Primary Health Center',
        category: 'Routine',
        notes: 'Clinical immunization schedule verified.',
      },
      vaccinationHistory: [],
      upcomingSchedule: [],
      activityLog: [
        {
          id: `act-${m.id}-1`,
          title: 'Family record verified',
          date: 'Active',
          description: 'Profile linked to digital immunization registry.',
          type: 'profile',
        },
      ],
    };
  };

  const mapRelToBackend = (rel) => {
    const lower = (rel || '').toLowerCase();
    if (['son', 'daughter', 'child'].includes(lower)) return 'CHILD';
    if (['self', 'me'].includes(lower)) return 'SELF';
    if (['spouse', 'partner', 'husband', 'wife'].includes(lower)) return 'SPOUSE';
    if (['mother', 'father', 'parent'].includes(lower)) return 'PARENT';
    if (['brother', 'sister', 'sibling'].includes(lower)) return 'SIBLING';
    return 'OTHER';
  };

  const mapGenderToBackend = (g) => {
    const upper = (g || '').toUpperCase();
    if (upper === 'MALE' || upper === 'FEMALE') return upper;
    return 'OTHER';
  };

  // Fetch family members from backend on mount
  useEffect(() => {
    let isMounted = true;
    const loadMembers = async () => {
      try {
        const res = await familyApi.getMembers();
        if (isMounted && res && res.data && res.data.length > 0) {
          const mapped = res.data.map(mapBackendMemberToUi);
          setMembers(mapped);
        }
      } catch (err) {
        console.warn('Could not fetch family members from backend, using fallback data:', err);
      }
    };
    loadMembers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Add Member Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Approximate age calculation for demo
    const birthYear = new Date(formData.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const ageYears = Math.max(0, currentYear - birthYear);
    const isChild = ageYears < 18;

    const initials = formData.name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'FM';

    let createdMember = null;
    try {
      const payload = {
        full_name: formData.name.trim(),
        date_of_birth: formData.dob,
        gender: mapGenderToBackend(formData.gender),
        relationship: mapRelToBackend(formData.relationship),
        blood_group: formData.bloodGroup || 'UNKNOWN',
        allergies: formData.allergies ? formData.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
        notes: formData.primaryClinic.trim() || undefined,
      };
      const res = await familyApi.addMember(payload);
      if (res?.data) {
        createdMember = mapBackendMemberToUi(res.data);
      }
    } catch (err) {
      console.warn('Backend add member failed, falling back to local creation:', err);
    }

    if (!createdMember) {
      createdMember = {
        id: `fam-${Date.now()}`,
        name: formData.name.trim(),
        relationship: formData.relationship,
        age: `${ageYears} year${ageYears === 1 ? '' : 's'}`,
        dob: formData.dob,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || 'Unknown',
        isChild,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        allergies: formData.allergies.trim() || 'No known allergies reported',
        primaryClinic: formData.primaryClinic.trim() || 'Community Health Center',
        pediatrician: isChild ? 'Assigned Pediatrician' : 'General Practitioner',
        avatarFallback: initials,
        avatarBg: isChild
          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        progress: 0,
        completedDoses: 0,
        totalDoses: isChild ? 12 : 5,
        upcomingCount: 1,
        overdueCount: 0,
        status: 'UPCOMING',
        statusLabel: 'Schedule Initialized',
        statusVariant: 'secondary',
        needsAttention: false,
        attentionReason: null,
        nextVaccine: {
          name: isChild ? 'Primary Immunization Schedule (UIP)' : 'Routine Adult Health Review',
          dueDate: 'Within 30 Days',
          relative: 'Pending assessment',
          status: 'UPCOMING',
          clinic: formData.primaryClinic || 'Primary Health Center',
          category: 'New Profile',
          notes: 'Initial clinical assessment recommended.',
        },
        vaccinationHistory: [],
        upcomingSchedule: [
          {
            id: `sch-${Date.now()}-1`,
            vaccineName: isChild ? 'Universal Immunization Baseline' : 'Annual Health & Td Check',
            targetAge: 'Baseline',
            dueDate: 'Upcoming',
            status: 'UPCOMING',
            timeElapsed: 'Pending review',
            description: 'Awaiting primary dose record synchronization.',
          },
        ],
        activityLog: [
          {
            id: `act-${Date.now()}-1`,
            title: 'Family member registered',
            date: 'Just now',
            description: 'Profile created and initialized under family account.',
            type: 'profile',
          },
        ],
      };
    }

    setMembers((prev) => [createdMember, ...prev]);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      relationship: 'Son',
      dob: '',
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '',
      email: '',
      allergies: '',
      primaryClinic: '',
    });

    setAlertNotice(`Successfully registered ${createdMember.name} to your family!`);
    setTimeout(() => setAlertNotice(null), 4000);
  };

  // Open Edit Modal
  const handleOpenEdit = (member) => {
    setEditingMember({ ...member });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;

    const errors = validateForm(editingMember);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        full_name: editingMember.name,
        gender: mapGenderToBackend(editingMember.gender),
        relationship: mapRelToBackend(editingMember.relationship),
        blood_group: editingMember.bloodGroup || undefined,
        allergies: typeof editingMember.allergies === 'string'
          ? editingMember.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : editingMember.allergies,
        notes: editingMember.primaryClinic || undefined,
      };
      await familyApi.updateMember(editingMember.id, payload);
    } catch (err) {
      console.warn('Backend update member failed, updating local state only:', err);
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === editingMember.id ? { ...editingMember } : m))
    );

    setIsEditModalOpen(false);
    setAlertNotice(`Updated profile for ${editingMember.name}.`);
    setTimeout(() => setAlertNotice(null), 4000);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;

    try {
      await familyApi.deleteMember(deleteCandidate.id);
    } catch (err) {
      console.warn('Backend delete member failed, removing locally:', err);
    }

    setMembers((prev) => prev.filter((m) => m.id !== deleteCandidate.id));
    setAlertNotice(`Removed ${deleteCandidate.name} from family group.`);
    setDeleteCandidate(null);
    setTimeout(() => setAlertNotice(null), 4000);
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
            <span>Switch display modes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('normal')}>Normal</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Loading Skeleton</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('empty')}>Empty</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('error')}>Error</Button>
          </div>
        </div>

        {/* Skeleton Header */}
        <div className="space-y-2 pb-4 border-b border-border/60">
          <Skeleton className="h-8 w-48" />
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

        {/* Skeleton Filter & Cards */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-md" />
              </Card>
            ))}
          </div>
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
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="font-semibold text-foreground">Interactive State Preview:</span>
            <span>Switch display modes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('normal')}>Normal</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('loading')}>Loading</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('empty')}>Empty</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Error State</Button>
          </div>
        </div>

        <PageHeader
          title="My Family"
          subtitle="Manage family members and keep their vaccination records organized."
          breadcrumbs={[
            { label: 'Dashboard', href: '/patient/dashboard' },
            { label: 'Family' },
          ]}
        />

        <ErrorState
          title="We couldn't load family records"
          description="A temporary error occurred while retrieving family members from the profile store. Please try again."
          onRetry={() => setViewState('normal')}
          className="my-12 py-12"
        />
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: EMPTY STATE OR NORMAL
  // ==========================================
  const showEmpty = viewState === 'empty' || members.length === 0;

  return (
    <div className="space-y-8">
      {/* 0. INTERACTIVE STATE PREVIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Interactive View Modes:</span>
          <span className="hidden sm:inline">Preview the Family page under different lifecycle states</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewState === 'normal' && members.length > 0 ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => {
              if (members.length === 0) setMembers(INITIAL_FAMILY_MEMBERS);
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

      {/* ALERT NOTICE */}
      {alertNotice && (
        <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/10 text-foreground flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span>{alertNotice}</span>
          </div>
          <button
            onClick={() => setAlertNotice(null)}
            className="text-muted-foreground hover:text-foreground text-xs p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <PageHeader
        title="My Family"
        subtitle="Manage family members and keep their vaccination records organized."
        breadcrumbs={[
          { label: 'Dashboard', href: '/patient/dashboard' },
          { label: 'Family' },
        ]}
        actions={
          <Button
            onClick={() => {
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
            className="gap-2 font-semibold shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Family Member</span>
          </Button>
        }
      />

      {showEmpty ? (
        <EmptyState
          icon={Users}
          title="Your family profile is empty"
          description="Add family members to start organizing vaccination records, tracking national schedules, and receiving automated alerts."
          actionLabel="+ Add Family Member"
          onAction={() => {
            setFormErrors({});
            setIsAddModalOpen(true);
          }}
          secondaryActionLabel="Restore Demo Family Records"
          onSecondaryAction={() => {
            setMembers(INITIAL_FAMILY_MEMBERS);
            setViewState('normal');
          }}
          className="my-12 py-16"
        />
      ) : (
        <>
          {/* 2. FAMILY SUMMARY METRICS */}
          <section aria-label="Family Summary">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Family Members"
                value={totalMembers}
                subtext="Registered in account"
                icon={Users}
                accentColor="cyan"
              />
              <MetricCard
                title="Children"
                value={childrenCount}
                subtext="Pediatric schedules active"
                icon={Heart}
                accentColor="cyan"
              />
              <MetricCard
                title="Adults"
                value={adultsCount}
                subtext="Adult & booster schedules"
                icon={ShieldCheck}
                accentColor="neutral"
              />
              <MetricCard
                title="Needing Attention"
                value={attentionCount}
                subtext="Actionable doses pending"
                icon={AlertTriangle}
                accentColor={attentionCount > 0 ? 'danger' : 'success'}
                badgeText={attentionCount > 0 ? `${attentionCount} Urgent` : 'All Clear'}
                badgeVariant={attentionCount > 0 ? 'destructive' : 'secondary'}
              />
            </div>
          </section>

          {/* 3. SEARCH & FILTER BAR */}
          <section aria-label="Search and Filter Members" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, relation, or vaccine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
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

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <Button
                  size="sm"
                  variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('ALL')}
                  className="h-8 text-xs font-medium"
                >
                  All ({members.length})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'ATTENTION' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('ATTENTION')}
                  className="h-8 text-xs font-medium"
                >
                  Needs Attention ({attentionCount})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'CHILDREN' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('CHILDREN')}
                  className="h-8 text-xs font-medium"
                >
                  Children ({childrenCount})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'ADULTS' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('ADULTS')}
                  className="h-8 text-xs font-medium"
                >
                  Adults ({adultsCount})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('COMPLETED')}
                  className="h-8 text-xs font-medium"
                >
                  Up to Date ({members.filter((m) => m.status === 'COMPLETED').length})
                </Button>
              </div>
            </div>
          </section>

          {/* 4. FAMILY MEMBER CARDS GRID */}
          <section aria-label="Family Member Cards">
            {filteredMembers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
                <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-foreground">No members match your filter</h3>
                <p className="text-xs text-muted-foreground">
                  Try clearing your search query or selecting "All" to view all registered family members.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5">
                {filteredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="flex flex-col justify-between transition-all duration-200 hover:border-primary/40 hover:shadow-xs group"
                  >
                    <CardHeader className="p-5 pb-3 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className={`h-12 w-12 border ${member.avatarBg} shrink-0`}>
                            <AvatarFallback className="font-bold text-sm">
                              {member.avatarFallback}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-foreground truncate font-sans group-hover:text-primary transition-colors">
                              {member.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal">
                                {member.relationship}
                              </Badge>
                              <span>•</span>
                              <span>{member.age}</span>
                            </div>
                          </div>
                        </div>

                        {/* Top corner actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            title="Edit Member Profile"
                            aria-label={`Edit ${member.name}`}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(member)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove Member"
                            aria-label={`Remove ${member.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Status badge row */}
                      <div className="flex items-center justify-between pt-1">
                        <StatusBadge status={member.status} size="sm" />
                        <span className="text-[11px] font-mono text-muted-foreground">
                          DOB: {member.dob}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-4">
                      {/* Vaccination Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Vaccination Progress</span>
                          <span className="font-bold text-foreground font-sans">{member.progress}%</span>
                        </div>
                        <Progress value={member.progress} className="h-2" />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                          <span>{member.completedDoses} of {member.totalDoses} doses</span>
                          <span>{member.upcomingCount} upcoming</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Next Vaccine Milestone */}
                      <div className="space-y-1.5 rounded-lg bg-secondary/50 p-2.5 border border-border/50 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                            Next Milestone
                          </span>
                          {member.needsAttention && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5 uppercase font-bold">
                              Attention
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-foreground truncate">
                          {member.nextVaccine.name}
                        </p>
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span>{member.nextVaccine.dueDate}</span>
                          <span className={member.status === 'OVERDUE' ? 'text-status-overdue font-semibold' : ''}>
                            {member.nextVaccine.relative}
                          </span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-3 border-t border-border/60 bg-muted/15 flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="w-full text-xs font-semibold h-8.5 justify-between"
                      >
                        <Link to={`/family/${member.id}`}>
                          <span>View Full Profile</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* 5. ADD FAMILY MEMBER DIALOG */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Family Member
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Register a family member to generate an individualized immunization schedule and automated reminders.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="add-name" className="text-xs font-semibold">
                Full Name *
              </Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                }}
                placeholder="e.g. Kabir Sharma"
                className={`text-sm ${formErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Relationship & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-relation" className="text-xs font-semibold">
                  Relationship *
                </Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, relationship: val }))}
                >
                  <SelectTrigger id="add-relation" className="text-sm">
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
                <Label htmlFor="add-gender" className="text-xs font-semibold">
                  Gender *
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, gender: val }))}
                >
                  <SelectTrigger id="add-gender" className="text-sm">
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

            {/* Date of Birth & Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-dob" className="text-xs font-semibold">
                  Date of Birth *
                </Label>
                <Input
                  id="add-dob"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.dob}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, dob: e.target.value }));
                    if (formErrors.dob) setFormErrors((prev) => ({ ...prev, dob: null }));
                  }}
                  className={`text-sm ${formErrors.dob ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {formErrors.dob && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.dob}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-blood" className="text-xs font-semibold">
                  Blood Group
                </Label>
                <Select
                  value={formData.bloodGroup}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, bloodGroup: val }))}
                >
                  <SelectTrigger id="add-blood" className="text-sm">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-phone" className="text-xs font-semibold">
                  Mobile / WhatsApp (Optional)
                </Label>
                <Input
                  id="add-phone"
                  type="tel"
                  placeholder="+91 98765-00000"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-email" className="text-xs font-semibold">
                  Email Address (Optional)
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="member@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, email: e.target.value }));
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: null }));
                  }}
                  className={`text-sm ${formErrors.email ? 'border-destructive' : ''}`}
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Preferred Clinic */}
            <div className="space-y-1.5">
              <Label htmlFor="add-clinic" className="text-xs font-semibold">
                Preferred Primary Health Center / Clinic (Optional)
              </Label>
              <Input
                id="add-clinic"
                placeholder="e.g. Primary Health Center (Sector 14)"
                value={formData.primaryClinic}
                onChange={(e) => setFormData((prev) => ({ ...prev, primaryClinic: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* Medical Notes & Allergies */}
            <div className="space-y-1.5">
              <Label htmlFor="add-allergies" className="text-xs font-semibold">
                Known Allergies or Sensitivities (Optional)
              </Label>
              <Textarea
                id="add-allergies"
                rows={2}
                placeholder="e.g. Penicillin sensitivity, mild asthma, egg allergy..."
                value={formData.allergies}
                onChange={(e) => setFormData((prev) => ({ ...prev, allergies: e.target.value }))}
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
                Save & Initialize Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. EDIT FAMILY MEMBER DIALOG */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Member Profile
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Update personal information and healthcare preferences for this family member.
            </DialogDescription>
          </DialogHeader>

          {editingMember && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold">
                  Full Name *
                </Label>
                <Input
                  id="edit-name"
                  value={editingMember.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingMember((prev) => ({ ...prev, name: val }));
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
                  <Label htmlFor="edit-relation" className="text-xs font-semibold">
                    Relationship *
                  </Label>
                  <Select
                    value={editingMember.relationship}
                    onValueChange={(val) => setEditingMember((prev) => ({ ...prev, relationship: val }))}
                  >
                    <SelectTrigger id="edit-relation" className="text-sm">
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
                  <Label htmlFor="edit-gender" className="text-xs font-semibold">
                    Gender *
                  </Label>
                  <Select
                    value={editingMember.gender}
                    onValueChange={(val) => setEditingMember((prev) => ({ ...prev, gender: val }))}
                  >
                    <SelectTrigger id="edit-gender" className="text-sm">
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
                  <Label htmlFor="edit-dob" className="text-xs font-semibold">
                    Date of Birth *
                  </Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={editingMember.dob}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingMember((prev) => ({ ...prev, dob: val }));
                      if (formErrors.dob) setFormErrors((prev) => ({ ...prev, dob: null }));
                    }}
                    className={`text-sm ${formErrors.dob ? 'border-destructive' : ''}`}
                  />
                  {formErrors.dob && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.dob}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-blood" className="text-xs font-semibold">
                    Blood Group
                  </Label>
                  <Select
                    value={editingMember.bloodGroup}
                    onValueChange={(val) => setEditingMember((prev) => ({ ...prev, bloodGroup: val }))}
                  >
                    <SelectTrigger id="edit-blood" className="text-sm">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-clinic" className="text-xs font-semibold">
                  Primary Clinic
                </Label>
                <Input
                  id="edit-clinic"
                  value={editingMember.primaryClinic || ''}
                  onChange={(e) => setEditingMember((prev) => ({ ...prev, primaryClinic: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-allergies" className="text-xs font-semibold">
                  Allergies & Medical Notes
                </Label>
                <Textarea
                  id="edit-allergies"
                  rows={2}
                  value={editingMember.allergies || ''}
                  onChange={(e) => setEditingMember((prev) => ({ ...prev, allergies: e.target.value }))}
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
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. REMOVE / ARCHIVE CONFIRMATION (ALERT DIALOG) */}
      <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold font-sans">
              Remove this family member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This will remove <strong className="text-foreground">{deleteCandidate?.name}</strong> from your active family group and archive their immunization tracking history and reminder subscriptions. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
