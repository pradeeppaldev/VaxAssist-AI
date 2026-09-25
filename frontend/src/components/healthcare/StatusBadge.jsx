import React from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  HelpCircle,
  FileQuestion,
  ShieldCheck,
  Ban,
  PowerOff,
  XCircle,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const HEALTHCARE_STATUSES = {
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    variant: 'success',
    colorClasses: 'border-status-completed/30 bg-status-completed-bg text-status-completed-fg',
    iconClasses: 'text-status-completed',
  },
  UPCOMING: {
    label: 'Upcoming',
    icon: Calendar,
    variant: 'secondary',
    colorClasses: 'border-status-upcoming/30 bg-status-upcoming-bg text-status-upcoming-fg',
    iconClasses: 'text-status-upcoming',
  },
  DUE: {
    label: 'Due Now',
    icon: Clock,
    variant: 'info',
    colorClasses: 'border-status-due/30 bg-status-due-bg text-status-due-fg font-bold',
    iconClasses: 'text-status-due',
  },
  OVERDUE: {
    label: 'Overdue',
    icon: AlertTriangle,
    variant: 'overdue',
    colorClasses: 'border-status-overdue/40 bg-status-overdue-bg text-status-overdue-fg font-bold animate-pulse',
    iconClasses: 'text-status-overdue',
  },
  MISSED: {
    label: 'Missed Window',
    icon: AlertCircle,
    variant: 'secondary',
    colorClasses: 'border-status-missed/30 bg-status-missed-bg text-status-missed-fg',
    iconClasses: 'text-status-missed',
  },
  CATCH_UP_REQUIRED: {
    label: 'Catch-Up Needed',
    icon: Clock,
    variant: 'warning',
    colorClasses: 'border-status-catchup/40 bg-status-catchup-bg text-status-catchup-fg font-semibold',
    iconClasses: 'text-status-catchup',
  },
  CLINICAL_REVIEW: {
    label: 'Clinical Review',
    icon: HelpCircle,
    variant: 'review',
    colorClasses: 'border-status-review/40 bg-status-review-bg text-status-review-fg font-semibold',
    iconClasses: 'text-status-review',
  },
  ACTIVE: {
    label: 'Active',
    icon: CheckCircle2,
    variant: 'success',
    colorClasses: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium',
    iconClasses: 'text-emerald-600 dark:text-emerald-400',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    variant: 'warning',
    colorClasses: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium',
    iconClasses: 'text-amber-600 dark:text-amber-400',
  },
  SUSPENDED: {
    label: 'Suspended',
    icon: Ban,
    variant: 'danger',
    colorClasses: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium',
    iconClasses: 'text-rose-600 dark:text-rose-400',
  },
  INACTIVE: {
    label: 'Inactive',
    icon: PowerOff,
    variant: 'secondary',
    colorClasses: 'border-border bg-muted/60 text-muted-foreground font-medium',
    iconClasses: 'text-muted-foreground',
  },
  VERIFIED: {
    label: 'Verified',
    icon: ShieldCheck,
    variant: 'success',
    colorClasses: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium',
    iconClasses: 'text-emerald-600 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    variant: 'danger',
    colorClasses: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium',
    iconClasses: 'text-rose-600 dark:text-rose-400',
  },
  REQUIRES_REVIEW: {
    label: 'Requires Review',
    icon: HelpCircle,
    variant: 'review',
    colorClasses: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium',
    iconClasses: 'text-indigo-600 dark:text-indigo-400',
  },
};

/**
 * Normalized status badge with accessible icon and text styling.
 * Accepts string keys e.g. "COMPLETED", "CATCH-UP REQUIRED", "OVERDUE", etc.
 */
export function StatusBadge({ status, className, showIcon = true, size = 'default' }) {
  if (!status) return null;

  // Normalize string e.g. "CATCH-UP REQUIRED" or "CATCH_UP_REQUIRED" or "catch-up"
  const normalizedKey = String(status)
    .toUpperCase()
    .replace(/[-\s]+/g, '_');

  const config = HEALTHCARE_STATUSES[normalizedKey] || {
    label: status,
    icon: FileQuestion,
    variant: 'secondary',
    colorClasses: 'border-border bg-muted text-muted-foreground',
    iconClasses: 'text-muted-foreground',
  };

  const Icon = config.icon;
  const isSmall = size === 'sm';

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors select-none",
        isSmall ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        config.colorClasses,
        className
      )}
    >
      {showIcon && <Icon className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5", config.iconClasses)} aria-hidden="true" />}
      <span className="leading-none">{config.label}</span>
    </span>
  );
}

export default StatusBadge;
