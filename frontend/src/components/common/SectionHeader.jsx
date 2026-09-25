import React from 'react';
import { cn } from '@/lib/utils';

export function SectionHeader({
  title,
  description,
  badge,
  actions,
  className,
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4", className)}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground font-sans">
            {title}
          </h2>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;
