import React from 'react';
import { Sparkles, Bot, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AIHeader({ title, description, badge = "AI Assistant", className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1 font-mono text-[10px] tracking-wide uppercase px-2 py-0.5">
          <Sparkles className="h-3 w-3 text-primary animate-pulse" />
          <span>{badge}</span>
        </Badge>
      </div>
      <h2 className="font-sora text-xl sm:text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export function AICard({ className, children, ...props }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-primary/20 bg-linear-to-b from-card to-primary/[0.02] shadow-sm hover:border-primary/40 transition-all",
        className
      )}
      {...props}
    >
      <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      {children}
    </Card>
  );
}

export function AIHighlight({ title, children, icon: Icon = Sparkles, className }) {
  return (
    <div className={cn("rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm space-y-2", className)}>
      <div className="flex items-center gap-2 text-foreground font-sora font-semibold text-xs tracking-wide uppercase">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span>{title}</span>
      </div>
      <div className="text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export function AISourceCitation({ title, source, page, confidence, className }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-border bg-card/80 p-2.5 text-xs transition-colors hover:border-primary/30",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-1 rounded bg-primary/10 text-primary shrink-0">
          <FileText className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 truncate">
          <div className="font-medium text-foreground truncate">{title}</div>
          <div className="text-[10px] text-muted-foreground truncate">{source} {page ? `• Page ${page}` : ''}</div>
        </div>
      </div>
      {confidence && (
        <Badge variant="outline" className="text-[10px] shrink-0 border-status-completed/30 bg-status-completed-bg text-status-completed-fg">
          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
          {confidence}% Match
        </Badge>
      )}
    </div>
  );
}
