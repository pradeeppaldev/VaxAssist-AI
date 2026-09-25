import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingState({
  message = "Loading vaccination information...",
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card/50 p-12 text-center flex flex-col items-center justify-center space-y-3",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  );
}

export default LoadingState;
