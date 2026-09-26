import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function LegalPageLayout({
  badge = 'Policy & Legal',
  title,
  subtitle,
  lastUpdated = 'September 2026',
  tableOfContents = [],
  children,
}) {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-1.5 font-mono">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>Last Updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/5 text-primary uppercase tracking-wider font-mono text-[11px] px-2.5 py-0.5"
        >
          {badge}
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
            {subtitle}
          </p>
        )}
      </motion.div>

      {/* Main Grid with Optional Table of Contents */}
      <div className={`grid grid-cols-1 ${tableOfContents.length > 0 ? 'lg:grid-cols-12 gap-8' : 'gap-6'} items-start`}>
        {/* Table of Contents Sidebar */}
        {tableOfContents.length > 0 && (
          <aside className="lg:col-span-4 sticky top-24 space-y-4 order-2 lg:order-1">
            <Card className="border border-border/80 bg-card/60 backdrop-blur-xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold font-sora uppercase tracking-wider text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Table of Contents</span>
                </div>
                <nav className="space-y-1 text-xs">
                  {tableOfContents.map((item, idx) => (
                    <a
                      key={idx}
                      href={`#${item.id}`}
                      className="flex items-center justify-between p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <span className="truncate">{item.title}</span>
                      <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                    </a>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground">Questions or clarifications?</p>
              <p className="leading-relaxed">
                Reach our team anytime through the{' '}
                <Link to="/contact" className="text-primary underline underline-offset-2">
                  Contact Center
                </Link>
                .
              </p>
            </div>
          </aside>
        )}

        {/* Content Body */}
        <div className={`${tableOfContents.length > 0 ? 'lg:col-span-8' : 'w-full'} space-y-8 order-1 lg:order-2`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default LegalPageLayout;
