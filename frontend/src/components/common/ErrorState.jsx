import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ErrorState({
  title = "Unable to load data",
  description = "An error occurred while loading this section. Please try again.",
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center flex flex-col items-center justify-center space-y-3 max-w-md mx-auto",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="gap-1.5 mt-2 border-destructive/30 hover:bg-destructive/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
