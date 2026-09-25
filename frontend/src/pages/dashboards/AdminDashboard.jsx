import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  Clock, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  ExternalLink, 
  Activity, 
  FileText, 
  Check, 
  RotateCcw, 
  Building2, 
  Award, 
  FileCheck, 
  Eye, 
  RefreshCw, 
  Sliders, 
  Search, 
  HelpCircle,
  Sparkles,
  Thermometer,
  Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/healthcare/StatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MOCK_ADMIN_METRICS,
  MOCK_SYSTEM_ALERTS,
  MOCK_HEALTHCARE_WORKERS_ADMIN,
  MOCK_ADMIN_AUDIT_LOGS,
  MOCK_KNOWLEDGE_BASE_SUMMARY
} from '@/data/mockAdminData';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Interactive View States for testing and inspection
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'

  // Dynamic state for approvals queue
  const [pendingWorkers, setPendingWorkers] = useState(
    MOCK_HEALTHCARE_WORKERS_ADMIN.filter(hw => hw.verificationStatus === 'PENDING')
  );
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [confirmApprovalDialog, setConfirmApprovalDialog] = useState(false);
  const [confirmRejectDialog, setConfirmRejectDialog] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState(null);

  // System Alerts local state
  const [alerts, setAlerts] = useState(MOCK_SYSTEM_ALERTS);

  const handleOpenReview = (worker) => {
    setSelectedWorker(worker);
    setReviewDialogOpen(true);
  };

  const handleApproveWorker = () => {
    if (!selectedWorker) return;
    setPendingWorkers(prev => prev.filter(w => w.id !== selectedWorker.id));
    setActionSuccessNotice(`Successfully approved Dr. ${selectedWorker.name.replace('Dr. ', '')} and issued clinical signing privileges.`);
    setConfirmApprovalDialog(false);
    setReviewDialogOpen(false);
    setTimeout(() => setActionSuccessNotice(null), 5000);
  };

  const handleRejectWorker = () => {
    if (!selectedWorker) return;
    setPendingWorkers(prev => prev.filter(w => w.id !== selectedWorker.id));
    setActionSuccessNotice(`Application for ${selectedWorker.name} has been rejected. Notification dispatched.`);
    setConfirmRejectDialog(false);
    setReviewDialogOpen(false);
    setTimeout(() => setActionSuccessNotice(null), 5000);
  };

  const handleDismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="System Administration & Governance" 
          subtitle="Real-time monitoring, clinical credentials verification, and security telemetry."
          badge={<Badge variant="outline" className="font-mono text-xs">Admin Console</Badge>}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <LoadingState text="Loading system metrics, approval queue, and audit logs..." />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="System Administration & Governance" 
          subtitle="Real-time monitoring, clinical credentials verification, and security telemetry."
          badge={<Badge variant="outline" className="font-mono text-xs">Admin Console</Badge>}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <ErrorState 
          title="Failed to load administrative telemetry" 
          message="Could not establish connection to the primary governance sync server. Please verify network or retry."
          onRetry={() => setViewState('normal')}
        />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="System Administration & Governance" 
          subtitle="Real-time monitoring, clinical credentials verification, and security telemetry."
          badge={<Badge variant="outline" className="font-mono text-xs">Admin Console</Badge>}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <EmptyState 
          icon={ShieldAlert}
          title="No Administrative Activity Pending"
          description="All healthcare workers verified, no cold-chain alerts, and system health is optimal."
          actionText="Reset to Normal View"
          onAction={() => setViewState('normal')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <PageHeader
        title="System Administration & Governance"
        subtitle="Universal immunization compliance, healthcare worker credentialing, and RAG knowledge status."
        badge={
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-mono text-xs">
            System Admin &bull; Tier 1
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/users">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" />
                <span>User Directory</span>
              </Button>
            </Link>
            <Link to="/admin/healthcare-workers">
              <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Approvals ({pendingWorkers.length})</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* State Preview Toolbar */}
      <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />

      {/* Action Success Alert Notification */}
      {actionSuccessNotice && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-slideDown">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccessNotice}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActionSuccessNotice(null)}
            className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* 1. System Alerts Banner (Cold-chain, API Sync, License Renewal) */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Active System Alerts ({alerts.length})</span>
            </div>
            <span className="text-[11px] text-muted-foreground">Automated compliance monitoring</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alerts.map((alert) => {
              const isWarning = alert.severity === 'warning';
              const isDanger = alert.severity === 'destructive';
              const isInfo = alert.severity === 'info';

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 text-xs space-y-2.5 transition-all shadow-2xs relative ${
                    isDanger 
                      ? 'border-rose-500/30 bg-rose-500/5 text-rose-950 dark:text-rose-100' 
                      : isWarning 
                      ? 'border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-100'
                      : 'border-blue-500/30 bg-blue-500/5 text-blue-950 dark:text-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      {isDanger && <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                      {isWarning && <Thermometer className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                      {isInfo && <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      <span className="truncate">{alert.type}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] py-0 px-1.5 uppercase font-mono ${
                        isDanger ? 'border-rose-400 text-rose-600 dark:text-rose-300' :
                        isWarning ? 'border-amber-400 text-amber-600 dark:text-amber-300' :
                        'border-blue-400 text-blue-600 dark:text-blue-300'
                      }`}
                    >
                      {alert.status}
                    </Badge>
                  </div>

                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                    {alert.description}
                  </p>

                  <div className="pt-1 flex items-center justify-between border-t border-border/40 text-[11px] text-muted-foreground">
                    <span>{alert.timeAgo}</span>
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="hover:underline text-foreground font-medium text-[11px]"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Primary 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Total Users"
          value={MOCK_ADMIN_METRICS.totalUsers.toLocaleString()}
          subtext="Platform accounts"
          icon={Users}
          badgeText="+12 this wk"
          badgeVariant="secondary"
          accentColor="cyan"
        />
        <MetricCard
          title="Patients / Family"
          value={MOCK_ADMIN_METRICS.patientsFamilies.toLocaleString()}
          subtext="94.5% of network"
          icon={Shield}
          badgeText="Active"
          badgeVariant="success"
          accentColor="success"
        />
        <MetricCard
          title="Healthcare Workers"
          value={MOCK_ADMIN_METRICS.healthcareWorkers}
          subtext="Verified clinicians"
          icon={Stethoscope}
          badgeText="Verified"
          badgeVariant="info"
          accentColor="cyan"
        />
        <MetricCard
          title="Pending Approvals"
          value={pendingWorkers.length}
          subtext="Requires verification"
          icon={Clock}
          badgeText="Queue"
          badgeVariant={pendingWorkers.length > 0 ? "warning" : "secondary"}
          accentColor={pendingWorkers.length > 0 ? "warning" : "neutral"}
        />
        <MetricCard
          title="Knowledge Docs"
          value={MOCK_ADMIN_METRICS.knowledgeDocuments}
          subtext="2,450 RAG chunks"
          icon={Database}
          badgeText="Grounded"
          badgeVariant="info"
          accentColor="cyan"
        />
        <MetricCard
          title="System Alerts"
          value={alerts.length}
          subtext="Telemetry notices"
          icon={ShieldAlert}
          badgeText={alerts.length > 0 ? "Needs Review" : "Optimal"}
          badgeVariant={alerts.length > 0 ? "danger" : "secondary"}
          accentColor={alerts.length > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* 3. Pending Approvals Quick-Action Queue */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                Healthcare Worker Approvals Queue
              </CardTitle>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-mono">
                {pendingWorkers.length} Pending Verification
              </Badge>
            </div>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Review practitioner medical council credentials and authorize digital vaccine administration signing.
            </CardDescription>
          </div>
          <Link to="/admin/healthcare-workers">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full sm:w-auto">
              <span>View All Practitioners</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {pendingWorkers.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium text-foreground">All healthcare worker applications are reviewed</p>
              <p className="text-xs text-muted-foreground">New doctor registrations will automatically queue here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {pendingWorkers.slice(0, 4).map((worker) => (
                <div 
                  key={worker.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {worker.name}
                        </span>
                        <StatusBadge status={worker.verificationStatus} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {worker.title} &bull; <span className="font-medium text-foreground/80">{worker.facility}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10.5px]">
                          Reg: {worker.licenseNumber}
                        </span>
                        <span>{worker.medicalCouncil}</span>
                        <span>&bull; Submitted {worker.submittedAgo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenReview(worker)}
                      className="gap-1.5 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Review Credentials</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {pendingWorkers.length > 4 && (
          <CardFooter className="p-3 bg-muted/20 border-t border-border/60 text-center justify-center">
            <Link to="/admin/healthcare-workers" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              <span>{pendingWorkers.length - 4} more applications awaiting review in directory</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        )}
      </Card>

      {/* 4. Dual Grid: Knowledge Base & RAG Telemetry + Administrative Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Knowledge-Base & RAG Grounding Summary */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                  Knowledge Base & RAG Indexing
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Universal Immunization Programme Grounding Sources
                </CardDescription>
              </div>
            </div>
            <Link to="/admin/knowledge-base">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                <span>Manage</span>
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Vector metrics */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                <div className="text-lg font-bold text-foreground font-sora">
                  {MOCK_KNOWLEDGE_BASE_SUMMARY.totalDocs}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">Indexed Docs</div>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                <div className="text-lg font-bold text-foreground font-sora">
                  {MOCK_KNOWLEDGE_BASE_SUMMARY.indexedChunks.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">Vector Chunks</div>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  100% Grounded
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">UIP Determinism</div>
              </div>
            </div>

            {/* Active Sources List */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                Indexed Grounding Documents
              </div>
              <div className="space-y-1.5">
                {MOCK_KNOWLEDGE_BASE_SUMMARY.activeSources.map((source, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-lg border border-border/60 bg-card/60 flex items-center justify-between text-xs hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate text-foreground/90 font-medium">{source.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground font-mono">{source.chunks} chunks</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0">
                        {source.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>Embedding Model: <strong className="text-foreground font-mono">{MOCK_KNOWLEDGE_BASE_SUMMARY.embeddingModel}</strong> (768d)</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">Sync: 04:00 AM</span>
            </div>
          </CardContent>
        </Card>

        {/* Administrative Audit Actions */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-secondary text-foreground">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                  Administrative Audit Stream
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Immutable record of governance decisions and security actions
                </CardDescription>
              </div>
            </div>
            <Link to="/admin/audit-logs">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <span>All Logs</span>
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-4 sm:p-5">
            <div className="space-y-3">
              {MOCK_ADMIN_AUDIT_LOGS.map((log) => (
                <div 
                  key={log.id}
                  className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5 text-xs hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-xs">
                        {log.action}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] py-0 px-1.5 ${
                          log.status === 'Success' ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10' :
                          log.status === 'Warning' ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' :
                          'border-blue-500/30 text-blue-600 bg-blue-500/10'
                        }`}
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">{log.timeAgo}</span>
                  </div>

                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    {log.details}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 font-mono pt-1 border-t border-border/30">
                    <span className="truncate">Target: {log.target}</span>
                    <span className="shrink-0">{log.admin}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Credential Review Dialog (Quick Action from Dashboard) */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedWorker && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold">
                    Medical Practitioner Verification
                  </DialogTitle>
                  <StatusBadge status={selectedWorker.verificationStatus} size="sm" />
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Review applicant credentials against state medical council registry before authorizing clinical privileges.
                </DialogDescription>
              </DialogHeader>

              {/* Practitioner Summary Card */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-start gap-4">
                <img
                  src={selectedWorker.avatar}
                  alt={selectedWorker.name}
                  className="h-12 w-12 rounded-full object-cover border border-border shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <h4 className="font-bold text-sm text-foreground">{selectedWorker.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedWorker.title}</p>
                  <p className="text-xs text-foreground/90 font-medium flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{selectedWorker.facility} &bull; {selectedWorker.department}</span>
                  </p>
                </div>
              </div>

              {/* Credentials & Registration Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border/80 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase font-mono">Medical Council</span>
                  <div className="font-semibold text-foreground">{selectedWorker.medicalCouncil}</div>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase font-mono">License Number</span>
                  <div className="font-mono font-bold text-primary">{selectedWorker.licenseNumber}</div>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-card space-y-1 col-span-2">
                  <span className="text-[11px] text-muted-foreground uppercase font-mono">Educational Qualifications</span>
                  <div className="font-medium text-foreground">{selectedWorker.degree}</div>
                </div>
              </div>

              {/* Attached Verification Documents */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Submitted Documents ({selectedWorker.documents?.length || 0})
                </span>
                <div className="space-y-2">
                  {selectedWorker.documents?.map((doc, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl border border-border/80 bg-card flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-[11px] text-muted-foreground">{doc.type} &bull; {doc.size}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-secondary shrink-0">
                        {doc.verified ? 'Registry Matched' : 'Pending Check'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedWorker.notes && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-semibold block mb-0.5">Verification Notes:</span>
                  <span>{selectedWorker.notes}</span>
                </div>
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => setReviewDialogOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setConfirmRejectDialog(true)}
                  className="text-xs gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject Application</span>
                </Button>
                <Button 
                  onClick={() => setConfirmApprovalDialog(true)}
                  className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve & Authorize Signing</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert for Approval */}
      <AlertDialog open={confirmApprovalDialog} onOpenChange={setConfirmApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Healthcare Worker?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              This action will grant <strong>{selectedWorker?.name}</strong> full clinical privileges in VaxAssist AI, including digital vaccination certificate signing, batch administration logging, and patient record access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApproveWorker}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Alert for Rejection */}
      <AlertDialog open={confirmRejectDialog} onOpenChange={setConfirmRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Practitioner Application?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-destructive font-medium">
              Are you sure you want to reject the application for <strong>{selectedWorker?.name}</strong>? An official rejection notice citing licensing discrepancy will be logged in the immutable audit registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectWorker}
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Inspection State Preview Toolbar
 */
function StatePreviewToolbar({ viewState, setViewState }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-dashed border-border bg-muted/30 text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>UI State Inspector:</span>
      </div>
      <div className="flex items-center gap-1">
        {['normal', 'loading', 'empty', 'error'].map((st) => (
          <button
            key={st}
            onClick={() => setViewState(st)}
            className={`px-2.5 py-1 rounded-md capitalize font-medium text-xs transition-colors ${
              viewState === st 
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                : 'bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
}
