import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Building,
  Plus,
  ArrowRight,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Calendar as CalendarIcon,
  ChevronRight,
  Stethoscope,
  Eye,
  FileCheck
} from 'lucide-react';

// Common Components
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';

// shadcn UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
} from '@/components/ui/dialog';

// Mock Data
import {
  MOCK_TODAY_SCHEDULE,
  MOCK_HEALTHCARE_WORKER,
  MOCK_PATIENTS_REGISTRY,
} from '@/data/mockHealthcareData';

export default function HealthcareSchedulesPage() {
  // Testing state switcher
  const [viewState, setViewState] = useState('normal');

  // Active view tab: 'today' | 'upcoming'
  const [viewTab, setViewTab] = useState('today');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Schedule appointment state (allows interactive checking in / completing)
  const [scheduleList, setScheduleList] = useState(MOCK_TODAY_SCHEDULE);
  const [selectedSlotForAction, setSelectedSlotForAction] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Today Schedule
  const filteredTodaySchedule = useMemo(() => {
    return scheduleList.filter((slot) => {
      if (statusFilter !== 'ALL' && slot.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = slot.patientName.toLowerCase().includes(q);
        const matchVaccine = slot.vaccine.toLowerCase().includes(q);
        if (!matchName && !matchVaccine) return false;
      }
      return true;
    });
  }, [scheduleList, statusFilter, searchQuery]);

  // Mark status action
  const handleUpdateStatus = (slotId, newStatus) => {
    setScheduleList((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, status: newStatus } : s))
    );
    showToast(`Appointment status updated to "${newStatus}"`);
    setSelectedSlotForAction(null);
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
          title="Clinical Schedule & Immunization Sessions"
          description="Manage daily vaccination appointments, evaluate interval catch-ups, and track session queues."
        />

        <div className="my-12">
          <ErrorState
            title="We couldn't load clinical schedules"
            description="The appointment session server encountered a temporary error. Please try again."
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
            Empty (No Scheduled Patients)
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
          title="Clinical Schedule & Immunization Sessions"
          description="Manage daily vaccination appointments, evaluate interval catch-ups, and track session queues."
        />

        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground self-start sm:self-center font-mono bg-secondary/50 p-2.5 rounded-xl border border-border/80">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span>Today: 25 Sep 2026 (Wednesday)</span>
        </div>
      </div>

      {/* ==========================================
          VIEW MODE: LOADING STATE
      ========================================== */}
      {viewState === 'loading' && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {/* ==========================================
          VIEW MODE: EMPTY STATE
      ========================================== */}
      {viewState === 'empty' && (
        <div className="my-8">
          <EmptyState
            title="No vaccinations are scheduled for today"
            description="There are currently no patients booked in the Sector 14 Clinic vaccination session queue."
            actionLabel="View Patient Registry"
            onAction={() => window.location.href = '/healthcare/patients'}
          />
        </div>
      )}

      {/* ==========================================
          VIEW MODE: NORMAL WORKSPACE
      ========================================== */}
      {viewState === 'normal' && (
        <div className="space-y-6">
          {/* TABS: TODAY'S WORKSPACE VS UPCOMING CALENDAR */}
          <Tabs value={viewTab} onValueChange={setViewTab} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <TabsList className="bg-secondary/60 p-1 border border-border/80 rounded-xl">
                <TabsTrigger value="today" className="text-xs gap-1.5 font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Today's Workspace ({scheduleList.length} Sessions)</span>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="text-xs gap-1.5 font-semibold">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Upcoming Multi-Week Agenda</span>
                </TabsTrigger>
              </TabsList>

              {/* Search in Today's view */}
              {viewTab === 'today' && (
                <div className="flex items-center gap-2">
                  <div className="relative min-w-[200px]">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search session..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8.5 pl-8 text-xs w-full"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8.5 text-xs w-[130px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="Checked In">Checked In</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* TAB 1: SECTION 8 - TODAY'S WORKSPACE */}
            <TabsContent value="today" className="space-y-4">
              <div className="grid grid-cols-1 gap-3.5">
                {filteredTodaySchedule.map((slot) => (
                  <Card
                    key={slot.id}
                    className="p-4 sm:p-5 border border-border/80 shadow-2xs hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Time and Patient Particulars */}
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Time Pill */}
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-sm font-bold text-center shrink-0 min-w-[80px]">
                        {slot.time}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/healthcare/patients/${slot.patientId}`}
                            className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors font-sans"
                          >
                            {slot.patientName}
                          </Link>
                          <span className="text-xs text-muted-foreground">({slot.age})</span>
                          <Badge
                            variant={
                              slot.status === 'Checked In'
                                ? 'default'
                                : slot.status === 'Completed'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-[10px] font-medium"
                          >
                            {slot.status}
                          </Badge>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-primary">
                          {slot.vaccine}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground pt-0.5">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span>{slot.facility}</span>
                          </span>
                          {slot.notes && (
                            <>
                              <span>•</span>
                              <span className="italic">{slot.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8.5 text-xs gap-1"
                        asChild
                      >
                        <Link to={`/healthcare/patients/${slot.patientId}`}>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Patient File</span>
                        </Link>
                      </Button>

                      {slot.status !== 'Completed' ? (
                        <Button
                          size="sm"
                          className="h-8.5 text-xs gap-1 font-semibold"
                          onClick={() => handleUpdateStatus(slot.id, 'Completed')}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Mark Completed</span>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          <span>Dose Certified</span>
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB 2: UPCOMING MULTI-WEEK AGENDA */}
            <TabsContent value="upcoming" className="space-y-4">
              <Card className="border border-border/80 shadow-2xs divide-y divide-border/60">
                <div className="p-4 bg-muted/20">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground font-sora">
                    Forecast Calendar Schedule (Next 30 Days)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Projected cohort visits under Universal Immunization Programme
                  </p>
                </div>

                {/* Day Groups */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-primary font-mono pb-1 border-b border-border/40">
                    <span>Thursday, 26 September 2026</span>
                    <span>3 Bookings</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-secondary/40 flex justify-between items-center">
                      <div>
                        <strong>Vihaan Mehta (10 wks)</strong> — Pentavalent-2 &amp; Rotavirus-2
                      </div>
                      <span className="font-mono text-muted-foreground">10:00 AM</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-secondary/40 flex justify-between items-center">
                      <div>
                        <strong>Rohan Verma (6 mos)</strong> — PCV-3 Interval Follow-up
                      </div>
                      <span className="font-mono text-muted-foreground">11:30 AM</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-primary font-mono pb-1 border-b border-border/40">
                    <span>Monday, 29 September 2026</span>
                    <span>4 Bookings</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-secondary/40 flex justify-between items-center">
                      <div>
                        <strong>Ananya Sharma (4 mos)</strong> — 14-Week Pentavalent & OPV Session
                      </div>
                      <span className="font-mono text-muted-foreground">09:30 AM</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-secondary/40 flex justify-between items-center">
                      <div>
                        <strong>Priya Nair (5 yrs)</strong> — School Compliance Health Card
                      </div>
                      <span className="font-mono text-muted-foreground">02:00 PM</span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
