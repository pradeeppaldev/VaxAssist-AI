import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  User, 
  Eye, 
  Download, 
  RefreshCw, 
  Sliders, 
  FileText, 
  Globe, 
  Laptop, 
  Activity, 
  Lock, 
  Database, 
  Stethoscope, 
  Bell, 
  Key, 
  Cpu,
  ArrowUpRight
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  MOCK_AUDIT_METRICS,
  MOCK_AUDIT_LOGS_LIST,
} from '@/data/mockAnalyticsData';

const ITEMS_PER_PAGE = 6;

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState(MOCK_AUDIT_LOGS_LIST);
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Sheet state
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  // Filtered & Paginated Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== 'ALL' && log.result !== statusFilter) return false;
      if (roleFilter !== 'ALL' && log.actorRole !== roleFilter) return false;
      if (resourceFilter !== 'ALL' && log.resource !== resourceFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesActor = log.actor.toLowerCase().includes(q) || log.actorEmail.toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q) || log.actionLabel.toLowerCase().includes(q);
        const matchesResource = log.resource.toLowerCase().includes(q) || log.resourceId.toLowerCase().includes(q) || (log.resourceName && log.resourceName.toLowerCase().includes(q));
        const matchesIp = log.ipAddress && log.ipAddress.includes(q);
        const matchesDetails = log.details && log.details.toLowerCase().includes(q);
        return matchesActor || matchesAction || matchesResource || matchesIp || matchesDetails;
      }

      return true;
    });
  }, [logs, statusFilter, roleFilter, resourceFilter, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
    setDetailSheetOpen(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setRoleFilter('ALL');
    setResourceFilter('ALL');
    setCurrentPage(1);
  };

  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Security & Immutable Audit Trail" 
          subtitle="Cryptographically chained event logs of administrative decisions, clinical signing, and system telemetry."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Audit Logs' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <LoadingState text="Verifying SHA-256 chain signatures and loading audit event registry..." />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Security & Immutable Audit Trail" 
          subtitle="Cryptographically chained event logs of administrative decisions, clinical signing, and system telemetry."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Audit Logs' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <ErrorState 
          title="Audit Ledger Storage Unavailable" 
          message="Could not retrieve immutable audit journal from cold storage. Integrity verification timed out."
          onRetry={() => setViewState('normal')}
        />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Security & Immutable Audit Trail" 
          subtitle="Cryptographically chained event logs of administrative decisions, clinical signing, and system telemetry."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Audit Logs' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <EmptyState 
          icon={History}
          title="No Audit Logs Recorded"
          description="There are currently no security or administrative actions recorded in the immutable ledger."
          actionText="Reset Audit Ledger"
          onAction={() => setViewState('normal')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Security & Immutable Audit Trail"
        subtitle="Cryptographically chained event logs of administrative decisions, clinical signing authorizations, and system telemetry under IT Act Section 65B."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Audit Logs' },
        ]}
        badge={
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            <span>SHA-256 Chained &bull; Tamper-Proof</span>
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setToastNotice('Audit signature validation passed: 100% block hashes verified.')}
              className="text-xs gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Verify Hashes</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setToastNotice('Export prepared: Encrypted audit archive (CSV + SHA256SUMS) generated.')}
              className="text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Audit Archive</span>
            </Button>
          </div>
        }
      />

      {/* State Preview Toolbar */}
      <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />

      {/* Toast Notice Banner */}
      {toastNotice && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-slideDown">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{toastNotice}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setToastNotice(null)}
            className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* 2. Top-Level Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Log Entries"
          value={MOCK_AUDIT_METRICS.totalLogs.toLocaleString()}
          subtext="Lifetime audit records"
          icon={History}
          badgeText="Chained"
          badgeVariant="secondary"
          accentColor="cyan"
        />
        <MetricCard
          title="Events Today"
          value={MOCK_AUDIT_METRICS.logsToday}
          subtext="24-hour activity window"
          icon={Activity}
          badgeText="+8 vs avg"
          badgeVariant="info"
          accentColor="cyan"
        />
        <MetricCard
          title="Security Incidents"
          value={MOCK_AUDIT_METRICS.securityEvents}
          subtext="Quarantines & suspensions"
          icon={ShieldAlert}
          badgeText="Managed"
          badgeVariant="warning"
          accentColor="warning"
        />
        <MetricCard
          title="Compliance Retention"
          value="7 Years"
          subtext="IT Act Section 65B"
          icon={Lock}
          badgeText="Statutory"
          badgeVariant="success"
          accentColor="success"
        />
      </div>

      {/* 3. Compact Recent System Activity Section */}
      <Card className="border border-border shadow-xs bg-card/60">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Recent Administrative Events Stream
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Real-time governance actions, credential approvals, and cold-chain interventions
              </CardDescription>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Stream
          </span>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {logs.slice(0, 4).map((log) => (
              <div 
                key={log.id} 
                onClick={() => handleOpenDetails(log)}
                className="p-3 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] font-bold text-primary">{log.id}</span>
                  <span className="text-[10.5px] text-muted-foreground font-mono">{log.timeAgo}</span>
                </div>
                <h5 className="font-semibold text-foreground line-clamp-1">{log.actionLabel}</h5>
                <p className="text-[11px] text-muted-foreground line-clamp-1">Target: {log.resourceName || log.resourceId}</p>
                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10.5px] text-muted-foreground font-mono">
                  <span className="truncate max-w-[120px]">{log.actor}</span>
                  <AuditResultBadge result={log.result} size="xs" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Search and Filters Bar */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search audit trail by actor, action code, resource ID, IP address, or details..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs sm:text-sm h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Result Filter */}
            <div className="w-full sm:w-36">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Results</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actor Role Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={roleFilter}
                onValueChange={(val) => {
                  setRoleFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actors</SelectItem>
                  <SelectItem value="ADMIN">System Administrator</SelectItem>
                  <SelectItem value="HEALTHCARE_WORKER">Healthcare Worker</SelectItem>
                  <SelectItem value="PATIENT">Patient / Family</SelectItem>
                  <SelectItem value="SYSTEM_AGENT">Automated Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resource Type Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={resourceFilter}
                onValueChange={(val) => {
                  setResourceFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Resources</SelectItem>
                  <SelectItem value="HealthcareWorker">Healthcare Worker</SelectItem>
                  <SelectItem value="VaccineBatch">Vaccine Batch</SelectItem>
                  <SelectItem value="KnowledgeBaseDoc">Knowledge Guideline</SelectItem>
                  <SelectItem value="UserAccount">User Account</SelectItem>
                  <SelectItem value="VaccineCertificate">Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL' || resourceFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. Audit Trail Table & Mobile Cards */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">
            Immutable Audit Trail Ledger
          </CardTitle>
          <span className="text-xs font-mono text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} logged events
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Search}
                title="No audit events found"
                description="No immutable log records matched your query or active filters."
                actionText="Reset All Filters"
                onAction={handleClearFilters}
              />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[170px] font-semibold text-xs text-foreground">Timestamp (UTC)</TableHead>
                      <TableHead className="w-[200px] font-semibold text-xs text-foreground">Actor & Role</TableHead>
                      <TableHead className="w-[220px] font-semibold text-xs text-foreground">Action Performed</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Target Resource</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Result</TableHead>
                      <TableHead className="font-semibold text-xs text-foreground">Client IP & Origin</TableHead>
                      <TableHead className="text-right font-semibold text-xs text-foreground pr-6">Inspect</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5 text-xs font-mono text-muted-foreground">
                          <div className="font-semibold text-foreground">{log.timestamp.split(' ')[0]}</div>
                          <div className="text-[11px] text-muted-foreground/80">{log.timestamp.split(' ')[1]} {log.timeAgo}</div>
                        </TableCell>

                        <TableCell className="py-3.5 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-medium text-foreground block truncate max-w-[180px]">
                              {log.actor}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono truncate block">
                              {log.actorEmail}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-xs text-foreground block">
                              {log.actionLabel}
                            </span>
                            <span className="font-mono text-[10.5px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded inline-block">
                              {log.action}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-medium text-foreground block truncate max-w-[160px]">
                              {log.resourceName || log.resource}
                            </span>
                            <span className="font-mono text-[11px] text-primary block truncate">
                              ID: {log.resourceId}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <AuditResultBadge result={log.result} />
                        </TableCell>

                        <TableCell className="py-3.5 text-xs font-mono text-muted-foreground">
                          <div>{log.ipAddress}</div>
                          <span className="text-[10.5px] text-muted-foreground/80">{log.location}</span>
                        </TableCell>

                        <TableCell className="py-3.5 text-right pr-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(log)}
                            className="h-8 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Payload</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Stack (<768px) */}
              <div className="md:hidden divide-y divide-border/60">
                {paginatedLogs.map((log) => (
                  <div key={log.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-primary">{log.id}</span>
                        <h4 className="font-bold text-sm text-foreground">{log.actionLabel}</h4>
                      </div>
                      <AuditResultBadge result={log.result} />
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {log.details}
                    </p>

                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Actor:</span>
                        <span className="text-foreground truncate max-w-[180px]">{log.actor}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Resource:</span>
                        <span className="text-primary truncate max-w-[180px]">{log.resourceId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">IP / Location:</span>
                        <span>{log.ipAddress} &bull; {log.location}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetails(log)}
                      className="w-full text-xs gap-1.5 h-8 mt-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect Cryptographic Payload</span>
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <CardFooter className="p-4 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx + 1}
                  variant={currentPage === idx + 1 ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(idx + 1)}
                  className="h-8 w-8 p-0 text-xs font-mono"
                >
                  {idx + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* 6. Audit Log Details Viewer Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-card">
          {selectedLog && (
            <>
              <div className="p-5 border-b border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{selectedLog.id}</span>
                  <AuditResultBadge result={selectedLog.result} />
                </div>
                <SheetTitle className="text-base font-bold text-foreground">
                  {selectedLog.actionLabel}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground font-mono">
                  Machine Code: {selectedLog.action}
                </SheetDescription>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Event Description */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Action Description
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed p-3 rounded-xl border border-border bg-muted/10">
                    {selectedLog.details}
                  </p>
                </div>

                {/* Actor & Session Grid */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Origin & Actor Identity
                  </span>
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Actor:</span>
                      <span className="font-semibold text-foreground">{selectedLog.actor}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-muted-foreground">Account Email:</span>
                      <span>{selectedLog.actorEmail}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Role Authority:</span>
                      <Badge variant="outline" className="text-[10px] font-mono bg-secondary">
                        {selectedLog.actorRole}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="text-primary font-bold">{selectedLog.ipAddress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Geo Location:</span>
                      <span>{selectedLog.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>Device / User-Agent:</span>
                      <span className="truncate max-w-[200px]">{selectedLog.device}</span>
                    </div>
                  </div>
                </div>

                {/* Target Resource Meta */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                    Target Resource
                  </span>
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Resource Type:</span>
                      <span className="font-semibold text-foreground">{selectedLog.resource}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Resource Identifier:</span>
                      <span className="text-primary font-bold">{selectedLog.resourceId}</span>
                    </div>
                    {selectedLog.resourceName && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Resource Name:</span>
                        <span className="text-foreground truncate max-w-[220px]">{selectedLog.resourceName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Structured JSON Payload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                      Structured Payload & State Diff
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">JSON Schema v2.1</span>
                  </div>
                  <pre className="p-3.5 rounded-xl border border-border bg-muted/40 text-[11px] font-mono text-foreground overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedLog.payload || {}, null, 2)}
                  </pre>
                </div>

                {/* Cryptographic Compliance Seal */}
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1 text-xs text-muted-foreground font-mono">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Lock className="h-4 w-4" />
                    <span>IT Act Section 65B Digital Certificate Valid</span>
                  </div>
                  <p className="text-[10.5px] leading-relaxed">
                    Immutable SHA-256 ledger block verified against central compliance notary. Timestamp signed with hardware token.
                  </p>
                </div>
              </div>

              <SheetFooter className="p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailSheetOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setToastNotice(`Cryptographic proof for ${selectedLog.id} exported to clipboard.`);
                  }}
                  className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Proof</span>
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Result Badge Helper
 */
function AuditResultBadge({ result, size = 'default' }) {
  const isSmall = size === 'xs';
  if (result === 'SUCCESS') {
    return (
      <Badge variant="outline" className={`bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-mono gap-1 ${isSmall ? 'text-[10px] py-0 px-1.5' : 'text-[11px]'}`}>
        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        <span>Success</span>
      </Badge>
    );
  }
  if (result === 'WARNING') {
    return (
      <Badge variant="outline" className={`bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-mono gap-1 ${isSmall ? 'text-[10px] py-0 px-1.5' : 'text-[11px]'}`}>
        <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        <span>Warning</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 font-mono gap-1 ${isSmall ? 'text-[10px] py-0 px-1.5' : 'text-[11px]'}`}>
      <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
      <span>Failed</span>
    </Badge>
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

export default AdminAuditLogsPage;
