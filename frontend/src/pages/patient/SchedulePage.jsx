import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Syringe,
  Filter,
  Users,
  MapPin,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  Bell,
  Sparkles,
  Check,
  X,
  AlertCircle,
  RotateCcw,
  CalendarCheck2,
  Share2
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
import { Calendar } from '@/components/ui/calendar';
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

// Centralized mock data
import {
  INITIAL_FAMILY_MEMBERS,
  INITIAL_SCHEDULE_EVENTS,
} from '@/data/mockFamilyData';

export default function SchedulePage() {
  const navigate = useNavigate();

  // State Management
  const [events, setEvents] = useState(INITIAL_SCHEDULE_EVENTS);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'

  // Filter States
  const [selectedMemberId, setSelectedMemberId] = useState('ALL');
  const [timeRange, setTimeRange] = useState('ALL_UPCOMING'); // 'ALL_UPCOMING' | 'THIS_WEEK' | 'THIS_MONTH' | 'NEXT_3_MONTHS'
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);

  // Modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    reason: 'Clinic Slot Unavailable',
    notes: '',
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Summary Counts
  const summaryCounts = useMemo(() => {
    return {
      upcoming: events.filter((e) => e.status === 'UPCOMING').length,
      dueSoon: events.filter((e) => e.status === 'DUE').length,
      overdue: events.filter((e) => e.status === 'OVERDUE').length,
      catchUp: events.filter((e) => e.status === 'CATCH_UP_REQUIRED').length,
      completedThisMonth: 1, // Demo completed in current month
    };
  }, [events]);

  // Overdue and Catch-up items
  const overdueEvents = useMemo(() => {
    return events.filter((e) => e.status === 'OVERDUE');
  }, [events]);

  const catchUpEvents = useMemo(() => {
    return events.filter((e) => e.status === 'CATCH_UP_REQUIRED');
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Filter by member
    if (selectedMemberId !== 'ALL') {
      result = result.filter((e) => e.memberId === selectedMemberId);
    }

    // Filter by calendar selected day if active
    if (calendarSelectedDate) {
      const selectedDateStr = calendarSelectedDate instanceof Date
        ? calendarSelectedDate.toISOString().split('T')[0]
        : calendarSelectedDate;
      result = result.filter((e) => e.scheduledDate === selectedDateStr);
    }

    // Filter by time range
    if (timeRange === 'THIS_MONTH') {
      result = result.filter((e) => e.scheduledDate.startsWith('2026-10'));
    } else if (timeRange === 'THIS_WEEK') {
      result = result.filter((e) => e.status === 'DUE' || e.status === 'OVERDUE');
    } else if (timeRange === 'NEXT_3_MONTHS') {
      result = result.filter((e) =>
        e.scheduledDate.startsWith('2026-10') ||
        e.scheduledDate.startsWith('2026-11') ||
        e.scheduledDate.startsWith('2026-12')
      );
    }

    // Sort chronologically
    result.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    return result;
  }, [events, selectedMemberId, calendarSelectedDate, timeRange]);

  const handleOpenDetail = (event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleOpenReschedule = (event) => {
    setSelectedEvent(event);
    setRescheduleData({
      newDate: event.scheduledDate,
      reason: 'Clinic Slot Unavailable',
      notes: '',
    });
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEvent || !rescheduleData.newDate) return;

    const newDateObj = new Date(rescheduleData.newDate);
    const formatted = newDateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    setEvents((prev) =>
      prev.map((item) =>
        item.id === selectedEvent.id
          ? {
              ...item,
              scheduledDate: rescheduleData.newDate,
              formattedDate: formatted,
              countdown: `Rescheduled to ${formatted}`,
              status: 'UPCOMING',
              notes: `${item.notes} • Rescheduled: ${rescheduleData.reason}.`,
            }
          : item
      )
    );

    setIsRescheduleOpen(false);
    setIsDetailOpen(false);
    setToastMessage(`Rescheduled ${selectedEvent.vaccineName} for ${selectedEvent.memberName} to ${formatted}.`);
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
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
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
          <span className="text-xs font-semibold text-foreground">Interactive State Preview:</span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('normal')}>Normal</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('loading')}>Loading</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('empty')}>Empty</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Error State</Button>
          </div>
        </div>

        <PageHeader
          title="Vaccination Schedule"
          subtitle="Stay ahead of upcoming vaccinations for your family."
          breadcrumbs={[
            { label: 'Dashboard', href: '/patient/dashboard' },
            { label: 'Schedule' },
          ]}
        />

        <ErrorState
          title="We couldn't load your vaccination schedule"
          description="There was a temporary problem synchronizing upcoming milestones with the health authority registry."
          onRetry={() => setViewState('normal')}
          className="my-12 py-12"
        />
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: NORMAL OR EMPTY STATE
  // ==========================================
  const showEmpty = viewState === 'empty' || events.length === 0;

  return (
    <div className="space-y-8">
      {/* 0. INTERACTIVE STATE PREVIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Interactive View Modes:</span>
          <span className="hidden sm:inline">Preview the Schedule under different lifecycle states</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewState === 'normal' && events.length > 0 ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => {
              if (events.length === 0) setEvents(INITIAL_SCHEDULE_EVENTS);
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
        title="Vaccination Schedule"
        subtitle="Stay ahead of upcoming vaccinations for your family."
        breadcrumbs={[
          { label: 'Dashboard', href: '/patient/dashboard' },
          { label: 'Schedule' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 text-xs font-semibold h-9 hidden sm:inline-flex"
            >
              <Link to="/vaccinations">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                <span>View Vaccination History</span>
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="gap-2 font-semibold shadow-xs h-9 text-xs"
            >
              <Link to="/vaccinations">
                <Plus className="h-4 w-4" />
                <span>Add Vaccination Record</span>
              </Link>
            </Button>
          </div>
        }
      />

      {showEmpty ? (
        <EmptyState
          icon={CalendarDays}
          title="Your schedule is clear"
          description="No upcoming vaccination events are currently scheduled for your family members."
          actionLabel="+ Add Vaccination Record"
          onAction={() => navigate('/vaccinations')}
          secondaryActionLabel="Restore Demo Schedule"
          onSecondaryAction={() => {
            setEvents(INITIAL_SCHEDULE_EVENTS);
            setViewState('normal');
          }}
          className="my-12 py-16"
        />
      ) : (
        <>
          {/* 2. SCHEDULE SUMMARY METRICS */}
          <section aria-label="Schedule Summary Metrics">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Upcoming"
                value={summaryCounts.upcoming}
                subtext="Scheduled next 3 months"
                icon={CalendarIcon}
                accentColor="cyan"
              />
              <MetricCard
                title="Due Soon"
                value={summaryCounts.dueSoon}
                subtext="Next 7 days window"
                icon={Clock}
                accentColor="warning"
                badgeText={summaryCounts.dueSoon > 0 ? 'Action Req.' : null}
                badgeVariant="secondary"
              />
              <MetricCard
                title="Overdue"
                value={summaryCounts.overdue}
                subtext="Catch-up booster required"
                icon={AlertTriangle}
                accentColor={summaryCounts.overdue > 0 ? 'danger' : 'neutral'}
                badgeText={summaryCounts.overdue > 0 ? '1 Overdue' : 'All Clear'}
                badgeVariant={summaryCounts.overdue > 0 ? 'destructive' : 'secondary'}
              />
              <MetricCard
                title="Completed This Month"
                value={summaryCounts.completedThisMonth}
                subtext="Logged in October 2026"
                icon={CheckCircle2}
                accentColor="success"
                badgeText="+1 Verified"
                badgeVariant="outline"
              />
            </div>
          </section>

          {/* 3. OVERDUE SECTION (Section 10) */}
          {overdueEvents.length > 0 && (
            <section aria-label="Overdue Vaccinations">
              <Card className="border-status-overdue/40 bg-status-overdue-bg/20 shadow-2xs overflow-hidden">
                <CardHeader className="pb-3 border-b border-status-overdue/20 bg-status-overdue-bg/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-status-overdue text-white shrink-0">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base font-bold text-foreground font-sans">
                        Needs Attention ({overdueEvents.length} Overdue)
                      </CardTitle>
                    </div>
                    <Badge variant="destructive" className="text-xs uppercase font-bold">
                      Immediate Catch-Up
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-3">
                    {overdueEvents.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-border/80 bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-foreground font-sans">
                              {item.vaccineName}
                            </h4>
                            <StatusBadge status={item.status} size="sm" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Recipient: <strong className="text-foreground">{item.memberName}</strong> ({item.memberRelation})
                            {' • '}
                            <span className="text-status-overdue font-semibold">{item.countdown}</span>
                          </p>
                          <p className="text-xs text-muted-foreground pt-0.5">
                            {item.notes}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <Button
                            size="sm"
                            className="text-xs font-semibold h-8"
                            onClick={() => handleOpenDetail(item)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => handleOpenReschedule(item)}
                          >
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* 4. CATCH-UP SECTION (Section 11) */}
          {catchUpEvents.length > 0 && (
            <section aria-label="Catch-Up Immunizations">
              <Card className="border-amber-500/30 bg-amber-500/[0.04] shadow-2xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <RotateCcw className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base font-bold text-foreground font-sans">
                        Catch-Up Regimens Active
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs">
                      WHO / UIP Catch-Up Guidelines
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Accelerated intervals formulated to bring delayed immunization up to date without restarting completed series.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 pt-0">
                  <div className="space-y-3">
                    {catchUpEvents.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-border/80 bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-foreground font-sans">
                              {item.vaccineName}
                            </h4>
                            <StatusBadge status={item.status} size="sm" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.memberName} ({item.memberRelation}) • Scheduled Date: {item.formattedDate}
                          </p>
                          <p className="text-xs text-muted-foreground pt-0.5">
                            {item.notes}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => handleOpenDetail(item)}
                          >
                            Catch-Up Guide
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* 5. FILTER BAR (MEMBER & DATE RANGE) */}
          <section aria-label="Schedule Filters" className="p-4 rounded-2xl border border-border/80 bg-card shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Member filter */}
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger className="text-xs sm:text-sm font-medium h-9">
                    <SelectValue placeholder="All Family Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Family Members (4 Profiles)</SelectItem>
                    {INITIAL_FAMILY_MEMBERS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.relationship})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time range filter */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:inline">Range:</span>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="text-xs sm:text-sm font-medium h-9 w-44">
                    <SelectValue placeholder="Select Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_UPCOMING">All Upcoming</SelectItem>
                    <SelectItem value="THIS_WEEK">This Week</SelectItem>
                    <SelectItem value="THIS_MONTH">This Month (October)</SelectItem>
                    <SelectItem value="NEXT_3_MONTHS">Next 3 Months</SelectItem>
                  </SelectContent>
                </Select>

                {calendarSelectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-primary"
                    onClick={() => setCalendarSelectedDate(null)}
                  >
                    Clear Day Filter
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* 6. MAIN SPLIT: CALENDAR VIEW (LEFT) + UPCOMING SCHEDULE LIST (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Interactive Calendar (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h3 className="font-bold text-base text-foreground font-sans">
                  Monthly Schedule Calendar
                </h3>
                <p className="text-xs text-muted-foreground">
                  Days with dots indicate scheduled or overdue doses
                </p>
              </div>

              <Calendar
                selectedDate={calendarSelectedDate}
                onSelectDate={(date) => setCalendarSelectedDate(date)}
                events={events}
              />

              {/* Quick tip pill */}
              <div className="p-3 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  Tip: Tap any marked day in the calendar to filter events occurring on that date.
                </span>
              </div>
            </div>

            {/* Right: Upcoming Schedule List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground font-sans">
                    Chronological Immunization Milestones
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {filteredEvents.length} scheduled event{filteredEvents.length === 1 ? '' : 's'} matching criteria
                  </p>
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
                  <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto" />
                  <h4 className="font-semibold text-foreground text-sm">
                    No scheduled doses for the selected criteria
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Try choosing "All Family Members" or resetting your calendar date selection.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMemberId('ALL');
                      setTimeRange('ALL_UPCOMING');
                      setCalendarSelectedDate(null);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((item) => (
                    <Card
                      key={item.id}
                      className="p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-2xs group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Date Header */}
                          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                            <strong className="text-foreground">{item.formattedDate}</strong>
                            <span>•</span>
                            <span className={item.status === 'OVERDUE' ? 'text-status-overdue font-semibold' : ''}>
                              {item.countdown}
                            </span>
                          </div>

                          {/* Vaccine title */}
                          <h4 className="font-bold text-base text-foreground font-sans group-hover:text-primary transition-colors">
                            {item.vaccineName}
                          </h4>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <Badge variant="secondary" className="text-[10px] py-0 h-4">
                              {item.dose}
                            </Badge>
                            <span>•</span>
                            <span>Recipient: <strong className="text-foreground">{item.memberName}</strong> ({item.memberRelation})</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{item.clinic}</span>
                          </div>
                        </div>

                        {/* Status & Action */}
                        <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                          <StatusBadge status={item.status} size="sm" />

                          <div className="flex items-center gap-1.5 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 px-2.5"
                              onClick={() => handleOpenReschedule(item)}
                            >
                              Reschedule
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs h-8 px-2.5 font-semibold"
                              onClick={() => handleOpenDetail(item)}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 7. SCHEDULE DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-4">
                  <DialogTitle className="flex items-center gap-2 text-lg font-bold font-sans">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Scheduled Milestone Details
                  </DialogTitle>
                  <StatusBadge status={selectedEvent.status} size="sm" />
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Immunization window and clinical adherence information.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="p-3.5 rounded-xl bg-secondary/60 border border-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Vaccine & Milestone
                  </span>
                  <h4 className="text-base font-bold text-foreground font-sans">
                    {selectedEvent.vaccineName}
                  </h4>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                      {selectedEvent.dose}
                    </Badge>
                    <span>•</span>
                    <span>Category: {selectedEvent.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-0.5">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      Beneficiary Member
                    </span>
                    <p className="font-bold text-sm text-foreground">
                      {selectedEvent.memberName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedEvent.memberRelation}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-0.5">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      Target Due Date
                    </span>
                    <p className="font-bold text-sm text-foreground font-mono">
                      {selectedEvent.formattedDate}
                    </p>
                    <p className={`text-[11px] font-semibold ${selectedEvent.status === 'OVERDUE' ? 'text-status-overdue' : 'text-primary'}`}>
                      {selectedEvent.countdown}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                    Clinical Location & Guidance
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    {selectedEvent.clinic}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                    {selectedEvent.notes}
                  </p>
                </div>

                {selectedEvent.reminderSet && (
                  <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <div>
                        <span className="font-semibold text-foreground block">Automated Reminder Configured</span>
                        <span className="text-[11px] text-muted-foreground">{selectedEvent.reminderTime}</span>
                      </div>
                    </div>
                    <Button variant="link" size="sm" asChild className="text-xs h-auto p-0 font-semibold text-primary">
                      <Link to="/reminders">Manage →</Link>
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenReschedule(selectedEvent);
                  }}
                >
                  Reschedule Date
                </Button>
                <Button
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => {
                    setIsDetailOpen(false);
                    navigate('/vaccinations');
                  }}
                >
                  <Syringe className="h-3.5 w-3.5 mr-1" />
                  Log Administered Dose
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. RESCHEDULE MODAL (Section 13) */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <form onSubmit={handleRescheduleSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold font-sans">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  Reschedule Vaccination
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Adjust appointment date for {selectedEvent.vaccineName} ({selectedEvent.memberName}).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="reschedule-date" className="text-xs font-semibold">
                    New Target Vaccination Date *
                  </Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleData.newDate}
                    onChange={(e) => setRescheduleData((prev) => ({ ...prev, newDate: e.target.value }))}
                    required
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reschedule-reason" className="text-xs font-semibold">
                    Reason for Rescheduling
                  </Label>
                  <Select
                    value={rescheduleData.reason}
                    onValueChange={(val) => setRescheduleData((prev) => ({ ...prev, reason: val }))}
                  >
                    <SelectTrigger id="reschedule-reason" className="text-sm">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clinic Slot Unavailable">Clinic Slot Unavailable</SelectItem>
                      <SelectItem value="Minor Illness / Temporary Contraindication">Minor Illness / Temporary Fever</SelectItem>
                      <SelectItem value="Travel / Out of Station">Travel / Out of Station</SelectItem>
                      <SelectItem value="Pediatrician Recommendation">Pediatrician Recommendation</SelectItem>
                      <SelectItem value="Personal / Scheduling Conflict">Personal / Scheduling Conflict</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reschedule-notes" className="text-xs font-semibold">
                    Clinical Notes (Optional)
                  </Label>
                  <Textarea
                    id="reschedule-notes"
                    rows={2}
                    placeholder="e.g. Mild viral cold reported; doctor advised delaying by 5 days."
                    value={rescheduleData.notes}
                    onChange={(e) => setRescheduleData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" size="sm" className="font-semibold">
                  Confirm New Date
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
