import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FolderOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = FolderOpen,
  title = "No data found",
  description = "There are no records to display at this moment.",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed border-border bg-card/60 p-8 sm:p-12 text-center max-w-lg mx-auto flex flex-col items-center justify-center space-y-4",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon className="h-7 w-7" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base sm:text-lg font-bold text-foreground">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-2 pt-2">
          {actionLabel && (
            <Button onClick={onAction} size="sm" variant="default" className="font-semibold">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button onClick={onSecondaryAction} size="sm" variant="outline">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
