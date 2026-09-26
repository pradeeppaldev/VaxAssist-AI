import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Comparison({
  badge = 'The Healthcare Challenge',
  title = "Vaccination information shouldn't be scattered.",
  subtitle = 'Traditional paper immunization cards and fragmented clinic records create confusion, missed milestone windows, and clinical blind spots.',
  className,
}) {
  const leftSide = {
    eyebrow: 'THE SCATTERED REALITY',
    title: 'Paper cards get lost, milestones get overlooked.',
    description:
      'When health records are stored in paper booklets or across different clinics, families are left guessing which doses are pending and when boosters are required.',
    points: [
      'Physical vaccination booklets are frequently lost, water-damaged, or unavailable during travel.',
      'Managing schedules for multiple children and elderly parents becomes overwhelmingly chaotic.',
      'Families miss crucial immunization windows due to lack of proactive reminders.',
      'Confusing internet advice causes hesitation over intervals and contraindications.',
    ],
  };

  const rightSide = {
    eyebrow: 'THE VAXASSIST STANDARD',
    title: 'Deterministic schedules, automated alerts, total clarity.',
    description:
      'VaxAssist calculates exact milestone dates directly from date of birth, tracks multiple family dependents, and pairs records with verified clinical guidance.',
    points: [
      'Permanent digital immunization ledger accessible from any device at any time.',
      'Unified household overview with dynamic age calculation for each dependent.',
      'Automated milestone reminders prevent missed booster windows before they occur.',
      'Answers grounded in authoritative national immunization manuals and WHO standards.',
    ],
  };

  return (
    <section className={cn('container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl', className)}>
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto mb-12 sm:mb-14">
        {badge && (
          <Badge
            variant="outline"
            className="border-primary/30 text-primary text-xs uppercase tracking-wider font-mono px-3 py-1"
          >
            {badge}
          </Badge>
        )}
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Comparison Grid (Comparison-4 style) */}
      <div className="relative">
        {/* Central VS Badge (visible on desktop) */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border border-border/80 bg-background/95 backdrop-blur-xs shadow-md items-center justify-center font-mono text-xs font-bold text-muted-foreground select-none pointer-events-none">
          VS
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* LEFT: The Scattered Reality */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-3xl border border-rose-500/25 bg-gradient-to-b from-card via-card to-rose-500/[0.02] dark:to-rose-500/[0.04] p-7 sm:p-9 flex flex-col justify-between transition-colors hover:border-rose-500/45 shadow-2xs group"
          >
            <div className="space-y-4">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold tracking-wider uppercase w-fit select-none">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{leftSide.eyebrow}</span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2.5">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground font-sans tracking-tight">
                  {leftSide.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {leftSide.description}
                </p>
              </div>
            </div>

            {/* Points List */}
            <div className="border-t border-rose-500/15 pt-6 mt-6 space-y-3.5">
              {leftSide.points.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <div className="p-1 rounded-full bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                    <X className="h-3 w-3" />
                  </div>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: The VaxAssist Standard */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.08 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-3xl border border-primary/35 bg-gradient-to-b from-card via-card to-primary/[0.03] dark:to-primary/[0.05] p-7 sm:p-9 flex flex-col justify-between transition-colors hover:border-primary/55 shadow-2xs hover:shadow-primary/5 group"
          >
            <div className="space-y-4">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-bold tracking-wider uppercase w-fit select-none">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>{rightSide.eyebrow}</span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2.5">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground font-sans tracking-tight">
                  {rightSide.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rightSide.description}
                </p>
              </div>
            </div>

            {/* Points List */}
            <div className="border-t border-primary/20 pt-6 mt-6 space-y-3.5">
              {rightSide.points.map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Comparison;
