import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Search,
  CheckCheck,
  Stethoscope
} from 'lucide-react';

import { useDemoMode } from '@/context/DemoModeContext';
import { notificationApi } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function HealthcareNotificationsPage() {
  const { isDemoMode, demoStore, markDemoHcwNotificationRead } = useDemoMode();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ACTION' | 'WARNING' | 'INFO' | 'UNREAD'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionToast, setActionToast] = useState(null);

  const showToast = (msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemoMode) {
      setNotifications(demoStore.hcwNotifications || []);
      setLoading(false);
      return;
    }

    // Live Mode: fetch from API
    try {
      const res = await notificationApi.getNotifications({ limit: 50 });
      if (res?.data) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to load notifications in live mode:', err);
      setError(err.message || 'Unable to load clinical notifications from server.');
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, demoStore.hcwNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notifId) => {
    if (isDemoMode) {
      markDemoHcwNotificationRead(notifId);
      showToast('Notification marked as read (Demo Mode).');
      return;
    }

    try {
      await notificationApi.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      showToast('Notification marked as read.');
    } catch (err) {
      console.error('Failed to mark read:', err);
      showToast('Error updating notification status.');
    }
  };

  const handleMarkAllRead = async () => {
    if (isDemoMode) {
      (demoStore.hcwNotifications || []).forEach((n) => {
        markDemoHcwNotificationRead(n.id);
      });
      showToast('All notifications marked as read (Demo Mode).');
      return;
    }

    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all read:', err);
      showToast('Error updating notifications.');
    }
  };

  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      const title = n.title || '';
      const msg = n.message || '';
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const isRead = isDemoMode ? n.isRead : n.is_read;
      if (filterType === 'UNREAD') return !isRead;

      const type = (n.type || n.notification_type || '').toUpperCase();
      if (filterType === 'ACTION') return type === 'ACTION' || type === 'OVERDUE';
      if (filterType === 'WARNING') return type === 'WARNING' || type === 'CRITICAL';
      if (filterType === 'INFO') return type === 'INFO' || type === 'SYSTEM' || type === 'REMINDER';

      return true;
    });
  }, [notifications, searchQuery, filterType, isDemoMode]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => (isDemoMode ? !n.isRead : !n.is_read)).length;
  }, [notifications, isDemoMode]);

  const actionRequiredCount = useMemo(() => {
    return notifications.filter((n) => {
      const type = (n.type || n.notification_type || '').toUpperCase();
      return type === 'ACTION' || type === 'OVERDUE' || type === 'WARNING';
    }).length;
  }, [notifications]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-xs py-2.5 px-4 rounded-xl shadow-lg border border-border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{actionToast}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Clinical Notifications & Alerts"
        description="Monitor clinic appointments, overdue vaccine follow-ups, adverse reaction reports, and cold-chain equipment telemetry."
        badgeText={isDemoMode ? "Demo Mode Active" : "Live Feed Connected"}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="text-xs h-9 gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark All as Read</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={loadNotifications}
              className="text-xs h-9 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border-border/80 bg-card">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Total Notifications</span>
          <p className="text-xl font-bold font-mono text-foreground mt-1">{notifications.length}</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Logged in stream</span>
        </Card>
        <Card className="p-4 border-border/80 bg-card">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Unread Alerts</span>
          <p className="text-xl font-bold font-mono text-primary mt-1">{unreadCount}</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Awaiting review</span>
        </Card>
        <Card className="p-4 border-border/80 bg-card">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Action Required</span>
          <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{actionRequiredCount}</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">High clinical priority</span>
        </Card>
        <Card className="p-4 border-border/80 bg-card">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Data Mode</span>
          <p className="text-base font-bold font-sans text-foreground mt-1 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {isDemoMode ? 'Demo Sandbox' : 'Live Database'}
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            {isDemoMode ? 'Simulated notifications' : 'Real-time MongoDB feed'}
          </span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search alerts by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8.5 bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={filterType === 'ALL' ? 'default' : 'outline'}
            className="h-8 text-xs px-2.5"
            onClick={() => setFilterType('ALL')}
          >
            All ({notifications.length})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'UNREAD' ? 'default' : 'outline'}
            className="h-8 text-xs px-2.5"
            onClick={() => setFilterType('UNREAD')}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'ACTION' ? 'default' : 'outline'}
            className="h-8 text-xs px-2.5"
            onClick={() => setFilterType('ACTION')}
          >
            Action Required
          </Button>
          <Button
            size="sm"
            variant={filterType === 'WARNING' ? 'default' : 'outline'}
            className="h-8 text-xs px-2.5"
            onClick={() => setFilterType('WARNING')}
          >
            Alerts &amp; Warnings
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Could not load clinical alerts"
          description={error}
          onRetry={loadNotifications}
        />
      )}

      {/* Empty State */}
      {!loading && !error && filteredNotifs.length === 0 && (
        <EmptyState
          icon={Bell}
          title={searchQuery || filterType !== 'ALL' ? "No matching notifications" : "No clinical notifications"}
          description={
            searchQuery || filterType !== 'ALL'
              ? "No alerts found matching your selected filters. Try resetting the filter."
              : "Your clinical notification feed is currently clear. Scheduled reminders and priority alerts will appear here."
          }
          actionLabel={searchQuery || filterType !== 'ALL' ? "Clear Filters" : undefined}
          onAction={searchQuery || filterType !== 'ALL' ? () => { setSearchQuery(''); setFilterType('ALL'); } : undefined}
        />
      )}

      {/* Notification List */}
      {!loading && !error && filteredNotifs.length > 0 && (
        <div className="space-y-3">
          {filteredNotifs.map((n) => {
            const isRead = isDemoMode ? n.isRead : n.is_read;
            const type = (n.type || n.notification_type || 'INFO').toUpperCase();
            const dateDisplay = n.date || (n.scheduled_for ? new Date(n.scheduled_for).toLocaleString() : 'Recent');

            let icon = Bell;
            let iconStyle = 'bg-primary/10 text-primary border-primary/20';
            let badgeVariant = 'secondary';
            let badgeText = 'General Notice';

            if (type === 'ACTION' || type === 'OVERDUE') {
              icon = AlertTriangle;
              iconStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
              badgeVariant = 'destructive';
              badgeText = 'Action Required';
            } else if (type === 'WARNING' || type === 'CRITICAL') {
              icon = ShieldAlert;
              iconStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
              badgeVariant = 'destructive';
              badgeText = 'Critical Alert';
            } else if (type === 'INFO' || type === 'SYSTEM') {
              icon = CheckCircle2;
              iconStyle = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
              badgeVariant = 'outline';
              badgeText = 'System Notice';
            }

            const IconComponent = icon;

            return (
              <Card
                key={n.id}
                className={`p-4 transition-all duration-200 border ${
                  !isRead
                    ? 'border-primary/40 bg-card shadow-2xs'
                    : 'border-border/70 bg-card/60 opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${iconStyle}`}>
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-xs sm:text-sm text-foreground ${!isRead ? 'font-bold' : 'font-medium'}`}>
                          {n.title}
                        </h4>
                        <Badge variant={badgeVariant} className="text-[10px] font-mono">
                          {badgeText}
                        </Badge>
                        {!isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground font-mono">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{dateDisplay}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1"
                        onClick={() => handleMarkAsRead(n.id)}
                      >
                        <Check className="h-3 w-3" />
                        <span>Mark Read</span>
                      </Button>
                    )}
                    {n.patient_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs gap-1 text-primary hover:text-primary"
                        asChild
                      >
                        <Link to={`/healthcare/patients/${n.patient_id}`}>
                          <span>View Patient</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
