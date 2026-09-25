import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ModulePlaceholderPage({
  title,
  subtitle,
  icon: Icon = Clock,
  badgeText = "Foundation Ready",
  badgeVariant = "outline",
  roleName = "Patient / Family",
  breadcrumbs = [],
  phaseNote,
  aiEnhanced = false,
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        badge={
          <Badge variant={badgeVariant} className={cn("text-xs gap-1 font-mono", aiEnhanced && "border-primary/40 bg-primary/10 text-primary")}>
            {aiEnhanced && <Sparkles className="h-3 w-3 text-primary animate-pulse" />}
            <span>{badgeText}</span>
          </Badge>
        }
      />

      <Card className={cn("border-border/80 bg-card", aiEnhanced && "border-primary/20 bg-linear-to-b from-card to-primary/[0.02]")}>
        <CardContent className="p-8 sm:p-12 text-center">
          <EmptyState
            icon={Icon}
            title={`${title} Module`}
            description={
              phaseNote ||
              `The UI/UX foundation and routing for ${title} are established. The complete data structures and interactions will be connected in an upcoming prompt.`
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default ModulePlaceholderPage;
