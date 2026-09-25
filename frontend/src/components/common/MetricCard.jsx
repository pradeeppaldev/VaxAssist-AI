import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeVariant = "secondary",
  accentColor = "cyan",
  className,
  onClick,
}) {
  const accentStyles = {
    cyan: "border-l-4 border-l-primary",
    success: "border-l-4 border-l-status-completed",
    warning: "border-l-4 border-l-status-catchup",
    danger: "border-l-4 border-l-status-overdue",
    neutral: "border-l-4 border-l-muted-foreground",
  };

  return (
    <Card
      className={cn(
        "cursor-default transition-all duration-200 hover:shadow-xs",
        accentStyles[accentColor] || accentStyles.cyan,
        onClick && "cursor-pointer hover:border-primary/40 hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              {value}
            </span>
            {badgeText && (
              <Badge variant={badgeVariant} className="text-[10px] py-0 px-1.5 h-4">
                {badgeText}
              </Badge>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-muted-foreground truncate">
              {subtext}
            </p>
          )}
        </div>

        {Icon && (
          <div className="p-2.5 rounded-xl bg-secondary text-primary shrink-0 transition-transform group-hover:scale-105">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MetricCard;
