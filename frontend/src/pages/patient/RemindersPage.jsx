import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Smartphone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Filter,
  Search,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Settings2,
  History,
  Send,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

// Centralized mock data
import {
  INITIAL_FAMILY_MEMBERS,
  INITIAL_REMINDERS_DATA,
  INITIAL_REMINDER_PREFERENCES,
} from '@/data/mockFamilyData';

export default function RemindersPage() {
  const navigate = useNavigate();

  // State Management
  const [reminders, setReminders] = useState(INITIAL_REMINDERS_DATA);
  const [preferences, setPreferences] = useState(INITIAL_REMINDER_PREFERENCES);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history' | 'preferences'

  // Filters
  const [selectedMemberId, setSelectedMemberId] = useState('ALL');
  const [selectedChannel, setSelectedChannel] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    memberId: 'fam-1',
    vaccineName: 'Measles-Rubella (MR - Dose 1)',
    dueVaccinationDate: '2026-10-30',
    leadTime: '3_days',
    channel: 'WhatsApp & SMS',
    notes: 'Please remember vaccination health card and arrive 10 min early.',
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Summary Metrics
  const activeCount = reminders.filter((r) => r.status === 'SCHEDULED').length;
  const deliveredCount = reminders.filter((r) => r.status === 'DELIVERED').length;
  const acknowledgedCount = reminders.filter((r) => r.status === 'ACKNOWLEDGED').length;

  // Filtered Reminders
  const filteredReminders = useMemo(() => {
    let result = [...reminders];

    if (selectedMemberId !== 'ALL') {
      result = result.filter((r) => r.memberId === selectedMemberId);
    }

    if (selectedChannel !== 'ALL') {
      result = result.filter((r) => r.channel.toLowerCase().includes(selectedChannel.toLowerCase()));
    }

    return result;
  }, [reminders, selectedMemberId, selectedChannel]);

  const upcomingReminders = useMemo(() => {
    return filteredReminders.filter((r) => r.status === 'SCHEDULED');
  }, [filteredReminders]);

  const reminderHistory = useMemo(() => {
    return filteredReminders.filter((r) => r.status === 'DELIVERED' || r.status === 'ACKNOWLEDGED');
  }, [filteredReminders]);

  const handleSendTestAlert = (reminder) => {
    setToastMessage(`Test notification sent for "${reminder.vaccineName}" to registered channels.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAcknowledge = (id) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'ACKNOWLEDGED' } : r))
    );
    setToastMessage('Reminder acknowledged. Thank you for staying proactive!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const memberObj = INITIAL_FAMILY_MEMBERS.find((m) => m.id === addForm.memberId);

    const newReminder = {
      id: `rem-${Date.now()}`,
      vaccineName: addForm.vaccineName,
      memberId: addForm.memberId,
      memberName: memberObj ? memberObj.name : 'Family Member',
      memberRelation: memberObj ? `${memberObj.relationship} (${memberObj.age})` : 'Dependent',
      dueVaccinationDate: addForm.dueVaccinationDate,
      reminderDate: 'Configured scheduled time',
      timeLabel: 'Active Schedule',
      type: 'Custom Milestone Alert',
      channel: addForm.channel,
      status: 'SCHEDULED',
      contactTarget: preferences.primaryPhone,
      notes: addForm.notes,
    };

    setReminders((prev) => [newReminder, ...prev]);
    setIsAddModalOpen(false);
    setToastMessage(`Configured new reminder for ${newReminder.memberName}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setToastMessage('Notification preferences saved successfully.');
    setTimeout(() => setToastMessage(null), 3500);
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
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
          title="Reminders & Alerts"
          subtitle="Automated multi-channel notifications and milestone reminders for your family."
          breadcrumbs={[
            { label: 'Dashboard', href: '/patient/dashboard' },
            { label: 'Reminders' },
          ]}
        />

        <ErrorState
          title="We couldn't load your reminders"
          description="A temporary error occurred while retrieving active notification queues. Please try again."
          onRetry={() => setViewState('normal')}
          className="my-12 py-12"
        />
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: NORMAL OR EMPTY STATE
  // ==========================================
  const showEmpty = viewState === 'empty' || reminders.length === 0;

  return (
    <div className="space-y-8">
      {/* 0. INTERACTIVE STATE PREVIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Interactive View Modes:</span>
          <span className="hidden sm:inline">Preview the Reminders page under different lifecycle states</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewState === 'normal' && reminders.length > 0 ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => {
              if (reminders.length === 0) setReminders(INITIAL_REMINDERS_DATA);
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
        title="Reminders & Alerts"
        subtitle="Automated multi-channel notifications and milestone reminders for your family."
        breadcrumbs={[
          { label: 'Dashboard', href: '/patient/dashboard' },
          { label: 'Reminders' },
        ]}
        actions={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 font-semibold shadow-xs h-9 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Configure New Reminder</span>
          </Button>
        }
      />

      {showEmpty ? (
        <EmptyState
          icon={Bell}
          title="No reminders yet"
          description="Reminder activity and scheduled alerts will appear here when configured for your family."
          actionLabel="+ Configure New Reminder"
          onAction={() => setIsAddModalOpen(true)}
          secondaryActionLabel="Restore Demo Reminders"
          onSecondaryAction={() => {
            setReminders(INITIAL_REMINDERS_DATA);
            setViewState('normal');
          }}
          className="my-12 py-16"
        />
      ) : (
        <>
          {/* 2. REMINDERS SUMMARY METRICS */}
          <section aria-label="Reminders Summary">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Active Reminders"
                value={activeCount}
                subtext="Upcoming scheduled alerts"
                icon={Bell}
                accentColor="cyan"
              />
              <MetricCard
                title="Dispatched"
                value={deliveredCount}
                subtext="Successfully delivered"
                icon={Send}
                accentColor="success"
              />
              <MetricCard
                title="Acknowledged"
                value={acknowledgedCount}
                subtext="Confirmed by family"
                icon={CheckCircle2}
                accentColor="success"
              />
              <MetricCard
                title="Active Channels"
                value="3 Channels"
                subtext="WhatsApp, SMS & Email"
                icon={Smartphone}
                accentColor="cyan"
                badgeText="All Active"
                badgeVariant="outline"
              />
            </div>
          </section>

          {/* 3. TABS: UPCOMING REMINDERS, HISTORY, AND PREFERENCES */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabsList className="grid grid-cols-3 w-full sm:w-auto sm:inline-grid">
                <TabsTrigger value="upcoming" className="text-xs sm:text-sm font-semibold">
                  Upcoming ({upcomingReminders.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm font-semibold">
                  History ({reminderHistory.length})
                </TabsTrigger>
                <TabsTrigger value="preferences" className="text-xs sm:text-sm font-semibold">
                  Preferences
                </TabsTrigger>
              </TabsList>

              {/* Quick filter row for active tab if upcoming or history */}
              {activeTab !== 'preferences' && (
                <div className="flex items-center gap-2">
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger className="text-xs h-8.5 w-44">
                      <SelectValue placeholder="All Family Members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Family Members</SelectItem>
                      {INITIAL_FAMILY_MEMBERS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger className="text-xs h-8.5 w-36">
                      <SelectValue placeholder="All Channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Channels</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* TAB 1: UPCOMING REMINDERS (Section 15) */}
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingReminders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto" />
                  <h4 className="font-semibold text-foreground text-sm">No upcoming reminders in this view</h4>
                  <p className="text-xs text-muted-foreground">
                    Try clearing your member or channel filter, or configure a new reminder.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSelectedMemberId('ALL')}>
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingReminders.map((rem) => (
                    <Card
                      key={rem.id}
                      className="p-5 flex flex-col justify-between space-y-4 transition-all hover:border-primary/40 hover:shadow-2xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge variant="outline" className="text-[10px] font-mono mb-1">
                              {rem.type}
                            </Badge>
                            <h4 className="font-bold text-base text-foreground font-sans">
                              {rem.vaccineName}
                            </h4>
                            <p className="text-xs text-primary font-medium">
                              Recipient: {rem.memberName} ({rem.memberRelation})
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs font-semibold shrink-0">
                            {rem.timeLabel}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs rounded-xl bg-secondary/50 p-3 border border-border/50">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                              Dispatch Alert At
                            </span>
                            <strong className="text-foreground font-mono">{rem.reminderDate}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                              Vaccine Due Date
                            </span>
                            <span className="text-foreground font-mono font-medium">{rem.dueVaccinationDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Smartphone className="h-3.5 w-3.5 text-primary" />
                            {rem.channel}
                          </span>
                          <span className="font-mono text-[11px]">{rem.contactTarget}</span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {rem.notes}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-muted-foreground hover:text-foreground p-0"
                          onClick={() => handleSendTestAlert(rem)}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send Test Alert
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 font-semibold"
                          onClick={() => handleAcknowledge(rem.id)}
                        >
                          <Check className="h-3 w-3 mr-1 text-status-completed" />
                          Acknowledge
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: REMINDER HISTORY (Section 17) */}
            <TabsContent value="history" className="space-y-4">
              <Card className="border border-border/80 overflow-hidden">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Reminder Event</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Recipient</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Sent Date & Time</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Channel</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Delivery Destination</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reminderHistory.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-medium text-xs">
                            <span className="font-bold text-foreground block font-sans">{rec.vaccineName}</span>
                            <span className="text-[10px] text-muted-foreground">{rec.type}</span>
                          </TableCell>
                          <TableCell className="text-xs text-foreground font-semibold">
                            {rec.memberName}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {rec.reminderDate}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Smartphone className="h-3 w-3 text-primary" />
                              {rec.channel}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {rec.contactTarget}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-bold ${
                                rec.status === 'ACKNOWLEDGED'
                                  ? 'border-status-completed/40 bg-status-completed-bg text-status-completed-fg'
                                  : 'border-primary/40 bg-primary/10 text-primary'
                              }`}
                            >
                              {rec.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile History View */}
                <div className="block md:hidden divide-y divide-border/60">
                  {reminderHistory.map((rec) => (
                    <div key={rec.id} className="p-4 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-foreground font-sans">{rec.vaccineName}</h4>
                          <span className="text-muted-foreground text-[11px]">{rec.memberName} • {rec.type}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {rec.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                        <span>{rec.reminderDate}</span>
                        <span>{rec.channel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 3: REMINDER PREFERENCES (Section 16) */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className="border border-border/80">
                <CardHeader>
                  <CardTitle className="text-base font-bold font-sans">
                    Multi-Channel Notification Channels
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Control how and when VaxAssist AI alerts your family about upcoming or overdue immunizations.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSavePreferences} className="p-6 pt-0 space-y-6">
                  {/* Delivery Channel Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card">
                      <div className="space-y-0.5 pr-4">
                        <Label htmlFor="whatsapp-toggle" className="font-bold text-sm text-foreground block cursor-pointer">
                          WhatsApp Notifications
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Direct instant messages with pre-vaccination preparation cards and Google Maps clinic directions.
                        </p>
                      </div>
                      <Switch
                        id="whatsapp-toggle"
                        checked={preferences.whatsappEnabled}
                        onCheckedChange={(val) => setPreferences((prev) => ({ ...prev, whatsappEnabled: val }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card">
                      <div className="space-y-0.5 pr-4">
                        <Label htmlFor="sms-toggle" className="font-bold text-sm text-foreground block cursor-pointer">
                          SMS Text Alerts
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Carrier-delivered SMS reminders guaranteeing delivery even when cellular data is disabled.
                        </p>
                      </div>
                      <Switch
                        id="sms-toggle"
                        checked={preferences.smsEnabled}
                        onCheckedChange={(val) => setPreferences((prev) => ({ ...prev, smsEnabled: val }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card">
                      <div className="space-y-0.5 pr-4">
                        <Label htmlFor="email-toggle" className="font-bold text-sm text-foreground block cursor-pointer">
                          Email Vaccination Calendars
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Calendar .ics invites, monthly vaccination roundups, and printable PDF immunization records.
                        </p>
                      </div>
                      <Switch
                        id="email-toggle"
                        checked={preferences.emailEnabled}
                        onCheckedChange={(val) => setPreferences((prev) => ({ ...prev, emailEnabled: val }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Timing & Escalation Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="timing-select" className="text-xs font-semibold">
                        Default Reminder Timing
                      </Label>
                      <Select
                        value={preferences.timing}
                        onValueChange={(val) => setPreferences((prev) => ({ ...prev, timing: val }))}
                      >
                        <SelectTrigger id="timing-select" className="text-sm">
                          <SelectValue placeholder="Select Timing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1_day">1 day before appointment</SelectItem>
                          <SelectItem value="3_days">3 days before appointment (Recommended)</SelectItem>
                          <SelectItem value="7_days">7 days before appointment (1 week)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">
                        Lead time gives parents sufficient opportunity to book PHC sessions or consult pediatricians.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-semibold">
                        Urgent Alerts & Summaries
                      </Label>
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Overdue Escalation Alerts</span>
                          <Switch
                            checked={preferences.overdueEscalation}
                            onCheckedChange={(val) => setPreferences((prev) => ({ ...prev, overdueEscalation: val }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Weekly Family Health Summary</span>
                          <Switch
                            checked={preferences.weeklySummary}
                            onCheckedChange={(val) => setPreferences((prev) => ({ ...prev, weeklySummary: val }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="primary-phone" className="text-xs font-semibold">
                        Primary Mobile / WhatsApp Number
                      </Label>
                      <Input
                        id="primary-phone"
                        value={preferences.primaryPhone}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, primaryPhone: e.target.value }))}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="primary-email" className="text-xs font-semibold">
                        Primary Notification Email
                      </Label>
                      <Input
                        id="primary-email"
                        type="email"
                        value={preferences.primaryEmail}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, primaryEmail: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" size="sm" className="font-semibold">
                      Save Reminder Preferences
                    </Button>
                  </div>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* 4. CONFIGURE NEW REMINDER DIALOG */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans">
              <Bell className="h-5 w-5 text-primary" />
              Configure Vaccination Alert
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set automated notifications for an upcoming pediatric or adult dose.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="rem-member" className="text-xs font-semibold">
                Family Member *
              </Label>
              <Select
                value={addForm.memberId}
                onValueChange={(val) => setAddForm((prev) => ({ ...prev, memberId: val }))}
              >
                <SelectTrigger id="rem-member" className="text-sm">
                  <SelectValue placeholder="Select Member" />
                </SelectTrigger>
                <SelectContent>
                  {INITIAL_FAMILY_MEMBERS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.relationship})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rem-vaccine" className="text-xs font-semibold">
                Vaccine Milestone *
              </Label>
              <Input
                id="rem-vaccine"
                value={addForm.vaccineName}
                onChange={(e) => setAddForm((prev) => ({ ...prev, vaccineName: e.target.value }))}
                required
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rem-due-date" className="text-xs font-semibold">
                  Vaccine Due Date *
                </Label>
                <Input
                  id="rem-due-date"
                  type="date"
                  value={addForm.dueVaccinationDate}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, dueVaccinationDate: e.target.value }))}
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rem-lead" className="text-xs font-semibold">
                  Send Reminder
                </Label>
                <Select
                  value={addForm.leadTime}
                  onValueChange={(val) => setAddForm((prev) => ({ ...prev, leadTime: val }))}
                >
                  <SelectTrigger id="rem-lead" className="text-sm">
                    <SelectValue placeholder="Lead time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_day">1 day before</SelectItem>
                    <SelectItem value="3_days">3 days before</SelectItem>
                    <SelectItem value="7_days">7 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rem-channel" className="text-xs font-semibold">
                Delivery Channel
              </Label>
              <Select
                value={addForm.channel}
                onValueChange={(val) => setAddForm((prev) => ({ ...prev, channel: val }))}
              >
                <SelectTrigger id="rem-channel" className="text-sm">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp & SMS">WhatsApp & SMS (Recommended)</SelectItem>
                  <SelectItem value="WhatsApp Only">WhatsApp Only</SelectItem>
                  <SelectItem value="SMS Only">SMS Only</SelectItem>
                  <SelectItem value="Email & SMS">Email & SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rem-notes" className="text-xs font-semibold">
                Custom Alert Note
              </Label>
              <Textarea
                id="rem-notes"
                rows={2}
                value={addForm.notes}
                onChange={(e) => setAddForm((prev) => ({ ...prev, notes: e.target.value }))}
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
                Schedule Notification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
