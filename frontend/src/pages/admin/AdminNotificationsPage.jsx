import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Radio, 
  RefreshCw, 
  Eye, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Sliders, 
  Calendar, 
  User, 
  Check, 
  Download, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
import {
  MOCK_NOTIFICATION_METRICS,
  MOCK_NOTIFICATIONS_LIST,
} from '@/data/mockAnalyticsData';

const ITEMS_PER_PAGE = 6;

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS_LIST);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);

  // New notification form
  const [createForm, setCreateForm] = useState({
    title: '',
    channel: 'WHATSAPP',
    recipientType: 'All Registered Families',
    recipientTarget: '1,180 Family Accounts',
    priority: 'NORMAL',
    category: 'Campaign Announcement',
    body: '',
  });

  // Action feedback notice
  const [toastNotice, setToastNotice] = useState(null);

  // Filtered & Paginated Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      // Channel filter
      if (channelFilter !== 'ALL' && item.type !== channelFilter) return false;
      // Priority filter
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;

      // Free-text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesRecipient = item.recipient.toLowerCase().includes(q);
        const matchesTarget = item.recipientTarget.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesBody = item.body.toLowerCase().includes(q);
        return matchesTitle || matchesRecipient || matchesTarget || matchesCategory || matchesBody;
      }

      return true;
    });
  }, [notifications, statusFilter, channelFilter, priorityFilter, searchQuery]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      type: createForm.channel,
      channelLabel:
        createForm.channel === 'WHATSAPP'
          ? 'WhatsApp Direct'
          : createForm.channel === 'SMS'
          ? 'Priority SMS'
          : createForm.channel === 'EMAIL'
          ? 'Official Email'
          : 'Mobile Push',
      title: createForm.title || 'Administrative Immunization Update',
      body: createForm.body,
      recipient: createForm.recipientType,
      recipientTarget: createForm.recipientTarget,
      recipientType: 'System Audience',
      status: 'SENT',
      createdAt: 'Just now',
      sentAt: 'Just now',
      deliveryLatency: '0.9s',
      openRate: 'Dispatched',
      priority: createForm.priority,
      category: createForm.category,
    };

    setNotifications((prev) => [newEntry, ...prev]);
    setCreateDialogOpen(false);
    setToastNotice(`Notification "${newEntry.title}" queued and dispatched to ${newEntry.recipientTarget}.`);
    setTimeout(() => setToastNotice(null), 5000);
  };

  const handleRetryNotification = (notif) => {
    setToastNotice(`Retrying transmission for "${notif.title}" via secondary carrier route...`);
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notif.id
            ? {
                ...item,
                status: 'SENT',
                sentAt: 'Just now',
                deliveryLatency: '1.8s',
                openRate: 'Delivered',
                failureReason: null,
              }
            : item
        )
      );
      setToastNotice(`Successfully delivered notification ${notif.id} on retry.`);
      if (selectedNotif?.id === notif.id) {
        setSelectedNotif((prev) => ({ ...prev, status: 'SENT', sentAt: 'Just now', failureReason: null }));
      }
    }, 1200);
  };

  const handleOpenDetails = (notif) => {
    setSelectedDoc(notif); // safe fallback
    setSelectedNotif(notif);
    setDetailsSheetOpen(true);
  };

  const setSelectedDoc = () => {}; // no-op guard

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setChannelFilter('ALL');
    setPriorityFilter('ALL');
    setCurrentPage(1);
  };

  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Notification Dispatch Queue & Communications" 
          subtitle="Monitor automated vaccination reminders, cold-chain escalations, and administrative broadcasts."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Notifications' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <LoadingState text="Loading multi-channel notification queues and delivery telemetry..." />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Notification Dispatch Queue & Communications" 
          subtitle="Monitor automated vaccination reminders, cold-chain escalations, and administrative broadcasts."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Notifications' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <ErrorState 
          title="Notification Gateway Offline" 
          message="Could not connect to SMS/WhatsApp dispatch gateway. Outbound queues are buffered."
          onRetry={() => setViewState('normal')}
        />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Notification Dispatch Queue & Communications" 
          subtitle="Monitor automated vaccination reminders, cold-chain escalations, and administrative broadcasts."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Notifications' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <EmptyState 
          icon={Bell}
          title="No Notifications Dispatched"
          description="The notification dispatch queue is empty. You can send a test notification or broadcast to platform users."
          actionText="Create Notification"
          onAction={() => {
            setViewState('normal');
            setCreateDialogOpen(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header */}
      <PageHeader
        title="Notification Dispatch Queue & Messaging"
        subtitle="Monitor automated vaccination reminders, clinical alerts, cold-chain escalations, and multi-channel broadcasts."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Notifications Queue' },
        ]}
        badge={
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-mono text-xs">
            {MOCK_NOTIFICATION_METRICS.deliverySuccessRate} Delivery Rate
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setToastNotice('Queue synchronized: 4 channels healthy (SMS, WhatsApp, Email, Push).')}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync Queues</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Notification</span>
            </Button>
          </div>
        }
      />

      {/* State Preview Toolbar */}
      <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />

      {/* Toast Notice Banner */}
      {toastNotice && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-slideDown">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{toastNotice}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setToastNotice(null)}
            className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* 2. Top-Level Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Dispatched"
          value={MOCK_NOTIFICATION_METRICS.total.toLocaleString()}
          subtext="Lifetime notifications"
          icon={Bell}
          badgeText="All Channels"
          badgeVariant="secondary"
          accentColor="cyan"
        />
        <MetricCard
          title="Delivered (Sent)"
          value={MOCK_NOTIFICATION_METRICS.sent.toLocaleString()}
          subtext="97.5% success rate"
          icon={CheckCircle2}
          badgeText="Optimal"
          badgeVariant="success"
          accentColor="success"
        />
        <MetricCard
          title="Pending / Queued"
          value={MOCK_NOTIFICATION_METRICS.pending}
          subtext="Next dispatch window"
          icon={Clock}
          badgeText="Queued"
          badgeVariant="warning"
          accentColor="warning"
        />
        <MetricCard
          title="Failed Dispatches"
          value={MOCK_NOTIFICATION_METRICS.failed}
          subtext="Carrier routing issues"
          icon={AlertTriangle}
          badgeText={MOCK_NOTIFICATION_METRICS.failed > 0 ? "Review Needed" : "Clean"}
          badgeVariant={MOCK_NOTIFICATION_METRICS.failed > 0 ? "danger" : "secondary"}
          accentColor={MOCK_NOTIFICATION_METRICS.failed > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* 3. Search and Filters Bar */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, recipient name, phone, email, or category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs sm:text-sm h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="SENT">Delivered (Sent)</SelectItem>
                  <SelectItem value="QUEUED">Queued / Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Channel Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={channelFilter}
                onValueChange={(val) => {
                  setChannelFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Channels</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp Direct</SelectItem>
                  <SelectItem value="SMS">Priority SMS</SelectItem>
                  <SelectItem value="EMAIL">Official Email</SelectItem>
                  <SelectItem value="PUSH">App Push</SelectItem>
                  <SelectItem value="BROADCAST">System Broadcast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="w-full sm:w-36">
              <Select
                value={priorityFilter}
                onValueChange={(val) => {
                  setPriorityFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High Priority</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || statusFilter !== 'ALL' || channelFilter !== 'ALL' || priorityFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Notifications Table & Mobile Cards */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">
            Outbound Dispatch Logs
          </CardTitle>
          <span className="text-xs font-mono text-muted-foreground">
            Showing {filteredNotifications.length} of {notifications.length} messages
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Search}
                title="No notifications match this filter"
                description="Try broadening your search or resetting channel and status filters."
                actionText="Reset Filters"
                onAction={handleClearFilters}
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[80px] font-semibold text-xs text-foreground">Channel</TableHead>
                      <TableHead className="w-[300px] font-semibold text-xs text-foreground">Message Title & Summary</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Recipient & Category</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Delivery Status</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Dispatch Timestamp</TableHead>
                      <TableHead className="text-right font-semibold text-xs text-foreground pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedNotifications.map((notif) => (
                      <TableRow key={notif.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5">
                          <ChannelBadge channel={notif.type} />
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="space-y-0.5 max-w-[280px]">
                            <button
                              onClick={() => handleOpenDetails(notif)}
                              className="font-semibold text-sm text-foreground hover:text-primary transition-colors text-left line-clamp-1 cursor-pointer"
                            >
                              {notif.title}
                            </button>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {notif.body}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-medium text-foreground block truncate max-w-[180px]">
                              {notif.recipient}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono truncate block">
                              {notif.recipientTarget}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <DeliveryStatusBadge status={notif.status} latency={notif.deliveryLatency} />
                        </TableCell>

                        <TableCell className="py-3.5 text-xs text-muted-foreground font-mono">
                          <div>{notif.sentAt}</div>
                          <span className="text-[10.5px] text-muted-foreground/80">{notif.openRate}</span>
                        </TableCell>

                        <TableCell className="py-3.5 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDetails(notif)}
                              className="h-8 px-2 text-xs gap-1"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Details</span>
                            </Button>

                            {notif.status === 'FAILED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetryNotification(notif)}
                                className="h-8 px-2 text-xs gap-1 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Retry</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Stack (<768px) */}
              <div className="md:hidden divide-y divide-border/60">
                {paginatedNotifications.map((notif) => (
                  <div key={notif.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ChannelBadge channel={notif.type} />
                        <span className="font-mono text-xs font-semibold text-muted-foreground">{notif.id}</span>
                      </div>
                      <DeliveryStatusBadge status={notif.status} />
                    </div>

                    <div className="space-y-1">
                      <h4
                        onClick={() => handleOpenDetails(notif)}
                        className="font-bold text-sm text-foreground hover:text-primary cursor-pointer"
                      >
                        {notif.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notif.body}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-1 border-t border-border/40">
                      <span>To: {notif.recipient}</span>
                      <span>{notif.sentAt}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(notif)}
                        className="flex-1 text-xs gap-1.5 h-8"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </Button>
                      {notif.status === 'FAILED' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRetryNotification(notif)}
                          className="flex-1 text-xs gap-1.5 h-8"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Retry Transmission</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <CardFooter className="p-4 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx + 1}
                  variant={currentPage === idx + 1 ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(idx + 1)}
                  className="h-8 w-8 p-0 text-xs font-mono"
                >
                  {idx + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* 5. Create Administrative Notification Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <span>Create Administrative Notification</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Dispatch multi-channel automated immunization alerts, campaign broadcasts, or system notices.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Notification Title / Subject *</Label>
              <Input
                required
                placeholder="e.g. National Pulse Polio Campaign Scheduled This Sunday"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Delivery Channel *</Label>
                <Select
                  value={createForm.channel}
                  onValueChange={(val) => setCreateForm({ ...createForm, channel: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp Direct</SelectItem>
                    <SelectItem value="SMS">Priority SMS</SelectItem>
                    <SelectItem value="EMAIL">Email Digest</SelectItem>
                    <SelectItem value="PUSH">App Push Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Priority Level</Label>
                <Select
                  value={createForm.priority}
                  onValueChange={(val) => setCreateForm({ ...createForm, priority: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High (Immediate Override)</SelectItem>
                    <SelectItem value="NORMAL">Normal Priority</SelectItem>
                    <SelectItem value="LOW">Low (Batch Digest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Audience *</Label>
                <Select
                  value={createForm.recipientType}
                  onValueChange={(val) => {
                    const target =
                      val === 'All Registered Families'
                        ? '1,180 Family Accounts'
                        : val === 'Healthcare Workers'
                        ? '62 Clinician Desks'
                        : 'Cohort Under 2 Years';
                    setCreateForm({ ...createForm, recipientType: val, recipientTarget: target });
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Registered Families">All Registered Families</SelectItem>
                    <SelectItem value="Healthcare Workers">Healthcare Workers Only</SelectItem>
                    <SelectItem value="Delayed Doses Cohort">Delayed Doses Cohort</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Message Category</Label>
                <Input
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Message Body *</Label>
              <Textarea
                required
                placeholder="Compose message text. Variables like {{ChildName}} and {{Vaccine}} are supported..."
                value={createForm.body}
                onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })}
                className="h-24 text-xs leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Dispatch Notification</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Notification Details Sheet */}
      <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card">
          {selectedNotif && (
            <>
              <div className="p-5 border-b border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{selectedNotif.id}</span>
                  <DeliveryStatusBadge status={selectedNotif.status} />
                </div>
                <SheetTitle className="text-base font-bold text-foreground">
                  {selectedNotif.title}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Category: {selectedNotif.category} &bull; Priority: {selectedNotif.priority}
                </SheetDescription>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Failure Alert if Failed */}
                {selectedNotif.status === 'FAILED' && (
                  <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 space-y-2 text-xs text-rose-900 dark:text-rose-200">
                    <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Carrier Dispatch Failure</span>
                    </div>
                    <p className="leading-relaxed">{selectedNotif.failureReason}</p>
                    <Button
                      size="sm"
                      onClick={() => handleRetryNotification(selectedNotif)}
                      className="text-xs bg-rose-600 text-white hover:bg-rose-700 h-8 gap-1.5"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Retry Transmission Now</span>
                    </Button>
                  </div>
                )}

                {/* Message Body Content Card */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Message Body (Rendered Payload)
                  </span>
                  <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs text-foreground leading-relaxed font-mono">
                    "{selectedNotif.body}"
                  </div>
                </div>

                {/* Recipient Details Grid */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Recipient Information
                  </span>
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Target Recipient:</span>
                      <span className="font-semibold text-foreground">{selectedNotif.recipient}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-muted-foreground">Destination:</span>
                      <span className="font-bold text-primary">{selectedNotif.recipientTarget}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Audience Type:</span>
                      <span>{selectedNotif.recipientType}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Telemetry */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Transmission Telemetry
                  </span>
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Delivery Channel:</span>
                      <span className="font-semibold text-foreground">{selectedNotif.channelLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created At:</span>
                      <span>{selectedNotif.createdAt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sent Timestamp:</span>
                      <span className="text-foreground">{selectedNotif.sentAt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Latency:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedNotif.deliveryLatency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Read Receipt:</span>
                      <span>{selectedNotif.openRate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsSheetOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                {selectedNotif.status === 'FAILED' && (
                  <Button
                    size="sm"
                    onClick={() => handleRetryNotification(selectedNotif)}
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Dispatch</span>
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Channel Icon & Badge Helper
 */
function ChannelBadge({ channel }) {
  if (channel === 'WHATSAPP') {
    return (
      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-mono">
        <MessageSquare className="h-3 w-3" />
        <span>WhatsApp</span>
      </Badge>
    );
  }
  if (channel === 'SMS') {
    return (
      <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 gap-1 font-mono">
        <Smartphone className="h-3 w-3" />
        <span>SMS</span>
      </Badge>
    );
  }
  if (channel === 'EMAIL') {
    return (
      <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 gap-1 font-mono">
        <Mail className="h-3 w-3" />
        <span>Email</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 gap-1 font-mono">
      <Radio className="h-3 w-3" />
      <span>Push</span>
    </Badge>
  );
}

/**
 * Delivery Status Badge Helper
 */
function DeliveryStatusBadge({ status, latency }) {
  if (status === 'SENT') {
    return (
      <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-mono">
        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        <span>Sent</span>
        {latency && latency !== '—' && <span className="opacity-70 text-[10px]">({latency})</span>}
      </Badge>
    );
  }
  if (status === 'QUEUED') {
    return (
      <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-mono animate-pulse">
        <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        <span>Queued</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px] bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 font-mono">
      <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
      <span>Failed</span>
    </Badge>
  );
}

/**
 * Inspection State Preview Toolbar
 */
function StatePreviewToolbar({ viewState, setViewState }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-dashed border-border bg-muted/30 text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>UI State Inspector:</span>
      </div>
      <div className="flex items-center gap-1">
        {['normal', 'loading', 'empty', 'error'].map((st) => (
          <button
            key={st}
            onClick={() => setViewState(st)}
            className={`px-2.5 py-1 rounded-md capitalize font-medium text-xs transition-colors ${
              viewState === st 
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                : 'bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AdminNotificationsPage;
