import React, { useState } from 'react';
import {
  FileBarChart2,
  FileCheck,
  History,
  AlertTriangle,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Clock,
  Printer,
  RotateCcw
} from 'lucide-react';

// Common Components
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';

// shadcn UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Mock Data
import { MOCK_CLINICAL_REPORTS_LIST, MOCK_HEALTHCARE_WORKER } from '@/data/mockHealthcareData';

export default function HealthcareReportsPage() {
  // Testing state switcher
  const [viewState, setViewState] = useState('normal');

  // Preview Report State
  const [selectedReportPreview, setSelectedReportPreview] = useState(null);
  const [downloadToast, setDownloadToast] = useState(null);

  const triggerDownloadSimulation = (title) => {
    setDownloadToast(`Preparing clinical audit export for "${title}"...`);
    setTimeout(() => {
      setDownloadToast(`Downloaded "${title}" (Clinical PDF)`);
      setTimeout(() => setDownloadToast(null), 3000);
    }, 900);
  };

  // ==========================================
  // VIEW MODE: ERROR STATE
  // ==========================================
  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
          <span className="text-xs font-semibold text-foreground">Interactive State Preview:</span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('normal')}>Normal</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('loading')}>Loading</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => setViewState('empty')}>Empty</Button>
            <Button size="sm" variant="default" className="h-7 text-xs px-2.5">Error State</Button>
          </div>
        </div>

        <PageHeader
          title="Clinical Audit & Vaccination Reports"
          description="Generate cohort coverage statistics, cold-chain traceability logs, and certified administration audit summaries."
        />

        <div className="my-12">
          <ErrorState
            title="We couldn't load clinical reports"
            description="The report generation service encountered a temporary error. Please try again."
            onRetry={() => setViewState('normal')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 0. INTERACTIVE STATE PREVIEW TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-secondary/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Interactive View Modes:</span>
          <span className="hidden sm:inline">Preview states for testing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewState === 'normal' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('normal')}
          >
            Normal View
          </Button>
          <Button
            size="sm"
            variant={viewState === 'loading' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('loading')}
          >
            Loading
          </Button>
          <Button
            size="sm"
            variant={viewState === 'empty' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('empty')}
          >
            Empty
          </Button>
          <Button
            size="sm"
            variant={viewState === 'error' ? 'default' : 'outline'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewState('error')}
          >
            Error State
          </Button>
        </div>
      </div>

      {/* Floating Download Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-xs py-2.5 px-4 rounded-xl shadow-lg border border-border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{downloadToast}</span>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Clinical Audit & Vaccination Reports"
          description="Generate cohort coverage statistics, cold-chain traceability logs, and certified administration audit summaries."
        />

        <Badge variant="outline" className="text-xs font-mono self-start sm:self-center">
          Sector 14 Clinic Hub
        </Badge>
      </div>

      {/* ==========================================
          VIEW MODE: LOADING STATE
      ========================================== */}
      {viewState === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      )}

      {/* ==========================================
          VIEW MODE: EMPTY STATE
      ========================================== */}
      {viewState === 'empty' && (
        <div className="my-8">
          <EmptyState
            title="No clinical reports generated"
            description="There are currently no compiled clinical audit summaries for this reporting quarter."
            actionLabel="Compile Sector Audit"
            onAction={() => setViewState('normal')}
          />
        </div>
      )}

      {/* ==========================================
          VIEW MODE: NORMAL WORKSPACE
      ========================================== */}
      {viewState === 'normal' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {MOCK_CLINICAL_REPORTS_LIST.map((rpt) => (
            <Card
              key={rpt.id}
              className="border border-border/80 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <FileBarChart2 className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {rpt.status}
                  </Badge>
                </div>

                <div>
                  <CardTitle className="text-base font-bold text-foreground font-sans">
                    {rpt.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {rpt.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="py-2 text-xs space-y-1.5 border-t border-border/60 bg-muted/10 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Target Metric:</span>
                  <span className="font-bold text-primary">{rpt.coverageScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Cohort Scope:</span>
                  <span className="text-foreground">{rpt.cohortSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Reporting Period:</span>
                  <span className="text-foreground">{rpt.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Last Updated:</span>
                  <span className="text-muted-foreground">{rpt.lastGenerated}</span>
                </div>
              </CardContent>

              <CardFooter className="p-3 pt-2.5 border-t border-border/60 bg-card flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 gap-1.5 flex-1"
                  onClick={() => setSelectedReportPreview(rpt)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Clinical Preview</span>
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => triggerDownloadSimulation(rpt.title)}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* ==============================================================
          REPORT PREVIEW MODAL
      ============================================================== */}
      <Dialog open={!!selectedReportPreview} onOpenChange={(open) => !open && setSelectedReportPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedReportPreview && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-primary/40 text-primary text-[10px] font-mono">
                    Official UIP Audit Report
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Sector 14 Primary Health Hub
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold font-sora pt-1">
                  {selectedReportPreview.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Period: {selectedReportPreview.period} • Attending: {MOCK_HEALTHCARE_WORKER.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-1 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Cohort Compliance</span>
                    <span className="text-base font-bold font-mono text-primary">{selectedReportPreview.coverageScore}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Scope Evaluated</span>
                    <span className="text-foreground font-medium">{selectedReportPreview.cohortSize}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground font-sora">
                    Clinical Executive Summary
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed">
                    This official audit compiles all recorded administrations, digital signatures, and batch lot numbers reported under Dr. Sunita Sharma. Data reflects 100% cold-chain traceability for verified infant and pediatric vaccines under the Universal Immunization Programme (UIP).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border/80 bg-muted/20 text-[11px] text-muted-foreground leading-relaxed">
                  <strong>Notice:</strong> This document is generated for clinical quality assurance and district health officer review. All patient identities are protected under clinical health privacy rules.
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReportPreview(null)}
                >
                  Close Preview
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    triggerDownloadSimulation(selectedReportPreview.title);
                    setSelectedReportPreview(null);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Signed PDF</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
