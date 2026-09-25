import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions,
  className,
}) {
  return (
    <div className={cn("space-y-4 pb-2 border-b border-border/60", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.label}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href || '#'}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              {title}
            </h1>
            {badge && (
              <div className="shrink-0">{badge}</div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
