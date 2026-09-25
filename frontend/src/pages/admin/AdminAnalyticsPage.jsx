import React, { useState, useMemo } from 'react';
import { 
  FileBarChart2, 
  Users, 
  Stethoscope, 
  Syringe, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Database, 
  Bell, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  RefreshCw, 
  Filter, 
  Layers, 
  Building2, 
  Sliders, 
  ShieldCheck, 
  Activity, 
  HelpCircle,
  Download,
  Info
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MOCK_ANALYTICS_METRICS,
  MOCK_VACCINATION_STATUS_DISTRIBUTION,
  MOCK_USER_GROWTH_DATA,
  MOCK_UPCOMING_VS_OVERDUE_WEEKLY,
  MOCK_CLINICIAN_ACTIVITY_RANKING,
  MOCK_AI_RAG_ANALYTICS,
} from '@/data/mockAnalyticsData';

export function AdminAnalyticsPage() {
  const [viewState, setViewState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'
  const [timeRange, setTimeRange] = useState('30d'); // '7d' | '30d' | '90d' | '12m'
  const [regimenFilter, setRegimenFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshNotice('Analytics telemetry updated from centralized registry. All aggregations fresh.');
      setTimeout(() => setRefreshNotice(null), 4000);
    }, 800);
  };

  if (viewState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="System Analytics & Compliance Intelligence" 
          subtitle="Platform-wide immunization coverage, patient cohort distributions, and AI assistant query telemetry."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Analytics' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <LoadingState text="Aggregating immunization registries, cold-chain compliance logs, and AI telemetry..." />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="System Analytics & Compliance Intelligence" 
          subtitle="Platform-wide immunization coverage, patient cohort distributions, and AI assistant query telemetry."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Analytics' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <ErrorState 
          title="Analytics Ingestion Pipeline Unavailable" 
          message="Could not connect to the real-time telemetry aggregation stream. Please retry."
          onRetry={() => setViewState('normal')}
        />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="System Analytics & Compliance Intelligence" 
          subtitle="Platform-wide immunization coverage, patient cohort distributions, and AI assistant query telemetry."
          breadcrumbs={[
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Analytics' }
          ]}
        />
        <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />
        <EmptyState 
          icon={FileBarChart2}
          title="No Analytics Data Recorded"
          description="There is currently no patient or clinical vaccination activity recorded in the system for this timeframe."
          actionText="Reset Timeframe"
          onAction={() => {
            setTimeRange('30d');
            setViewState('normal');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="System Analytics & Compliance Intelligence"
        subtitle="Platform-wide immunization coverage, patient cohort distributions, and AI assistant query telemetry."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'System Analytics' },
        ]}
        badge={
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-mono text-xs">
            Live Telemetry &bull; 97.2% Coverage
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshNotice('Analytics summary report prepared: PDF exported.')}
              className="text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Report</span>
            </Button>
          </div>
        }
      />

      {/* State Preview Inspector */}
      <StatePreviewToolbar viewState={viewState} setViewState={setViewState} />

      {/* Action Toast Alert Banner */}
      {refreshNotice && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-slideDown">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{refreshNotice}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshNotice(null)}
            className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Filter and Time Range Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-foreground">Time Window:</span>
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: '12m', label: '12 Months' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeRange === t.id
                    ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="w-48 ml-2">
            <Select value={regimenFilter} onValueChange={setRegimenFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Regimen Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Immunization Regimens</SelectItem>
                <SelectItem value="nis">Universal NIS (Govt UIP)</SelectItem>
                <SelectItem value="iap">IAP / ACVIP Private Regimens</SelectItem>
                <SelectItem value="endemic">Endemic Japanese Encephalitis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono self-end sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Last sync: {MOCK_ANALYTICS_METRICS.lastUpdated}</span>
        </div>
      </div>

      {/* 2. Top-Level Core Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Total Users"
          value={MOCK_ANALYTICS_METRICS.totalUsers.toLocaleString()}
          subtext="Registered accounts"
          icon={Users}
          badgeText={MOCK_ANALYTICS_METRICS.userGrowthRate}
          badgeVariant="success"
          accentColor="cyan"
        />
        <MetricCard
          title="Active Families"
          value={MOCK_ANALYTICS_METRICS.activePatientsFamilies.toLocaleString()}
          subtext="94.5% of network"
          icon={ShieldCheck}
          badgeText={MOCK_ANALYTICS_METRICS.patientGrowthRate}
          badgeVariant="success"
          accentColor="success"
        />
        <MetricCard
          title="Clinicians"
          value={MOCK_ANALYTICS_METRICS.healthcareWorkers}
          subtext="Verified prescribers"
          icon={Stethoscope}
          badgeText={MOCK_ANALYTICS_METRICS.workerGrowthRate}
          badgeVariant="info"
          accentColor="cyan"
        />
        <MetricCard
          title="Doses Logged"
          value={MOCK_ANALYTICS_METRICS.vaccinationRecords.toLocaleString()}
          subtext="Immunization records"
          icon={Syringe}
          badgeText={MOCK_ANALYTICS_METRICS.vaccinationGrowthRate}
          badgeVariant="success"
          accentColor="cyan"
        />
        <MetricCard
          title="Upcoming Doses"
          value={MOCK_ANALYTICS_METRICS.upcomingVaccinations}
          subtext="Next 14 days"
          icon={Calendar}
          badgeText="Due Soon"
          badgeVariant="info"
          accentColor="neutral"
        />
        <MetricCard
          title="Overdue Doses"
          value={MOCK_ANALYTICS_METRICS.overdueVaccinations}
          subtext="Requires outreach"
          icon={AlertTriangle}
          badgeText="Action"
          badgeVariant="danger"
          accentColor="danger"
        />
      </div>

      {/* 3. Visual Charts Grid (Row 1: User Growth + Vaccination Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth & Doses Administered Progression */}
        <Card className="border border-border shadow-xs lg:col-span-2">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Network Adoption & Dose Administration Growth
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Monthly progression of registered family cohorts and verified vaccinations.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono bg-secondary self-start sm:self-auto">
              Apr 2026 – Sep 2026
            </Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* SVG Bar / Area Visualization */}
            <div className="h-64 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-border/60">
              {MOCK_USER_GROWTH_DATA.map((item, idx) => {
                const maxDoses = 9000;
                const doseHeightPercent = Math.round((item.doses / maxDoses) * 100);
                const userHeightPercent = Math.round((item.total / 1400) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-default">
                    {/* Tooltip Hover value */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono bg-foreground text-background px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap pointer-events-none mb-1">
                      {item.doses.toLocaleString()} doses &bull; {item.total} users
                    </div>

                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Users Bar */}
                      <div
                        style={{ height: `${userHeightPercent}%` }}
                        className="w-1/2 max-w-[28px] rounded-t-md bg-secondary hover:bg-muted-foreground/30 transition-all relative"
                        title={`${item.total} Registered Users`}
                      />
                      {/* Doses Administered Bar */}
                      <div
                        style={{ height: `${doseHeightPercent}%` }}
                        className="w-1/2 max-w-[28px] rounded-t-md bg-primary hover:bg-primary/80 transition-all relative"
                        title={`${item.doses.toLocaleString()} Doses Logged`}
                      />
                    </div>

                    <span className="text-xs font-semibold text-muted-foreground font-mono mt-1">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-xs bg-primary" />
                  <span>Vaccine Doses Administered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-xs bg-secondary border border-border" />
                  <span>Registered Family Accounts</span>
                </div>
              </div>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                +14.2% MoM Expansion
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Vaccination Status Distribution (Ring/Donut visualization) */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold text-foreground">
              Immunization Status Split
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Total 8,420 registered vaccine milestones
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {/* Donut representation using responsive SVG */}
            <div className="flex items-center justify-center relative my-2">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="12" className="text-muted/30" fill="transparent" />
                
                {/* Completed Slice (78%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray="238.76"
                  strokeDashoffset="52.52" // (1 - 0.78) * 238.76
                  strokeLinecap="round"
                  fill="transparent"
                />

                {/* Upcoming Slice (14%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#0EA5E9"
                  strokeWidth="12"
                  strokeDasharray="33.42 205.34"
                  strokeDashoffset="-186.24"
                  fill="transparent"
                />
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-foreground font-sora">78.0%</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Complete</span>
              </div>
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="space-y-2.5 text-xs">
              {MOCK_VACCINATION_STATUS_DISTRIBUTION.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-foreground">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                    <Badge variant="outline" className="text-[10.5px] py-0 px-1.5 bg-card">
                      {item.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Visual Charts Grid (Row 2: Upcoming vs Overdue + Top Clinician Rankings) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming vs Overdue Weekly Trend */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Upcoming vs. Overdue Doses Trend
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Weekly window monitoring over past 8 weeks
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-mono">
              28 Currently Overdue
            </Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="h-56 w-full flex items-end gap-2 pt-4 pb-2 px-1 border-b border-border/60">
              {MOCK_UPCOMING_VS_OVERDUE_WEEKLY.map((wk, idx) => {
                const upcomingH = Math.round((wk.upcoming / 180) * 100);
                const overdueH = Math.round((wk.overdue / 180) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Upcoming bar */}
                      <div
                        style={{ height: `${upcomingH}%` }}
                        className="w-1/2 max-w-[18px] rounded-t-sm bg-sky-500/80 hover:bg-sky-500 transition-colors"
                        title={`${wk.upcoming} Upcoming Doses`}
                      />
                      {/* Overdue bar */}
                      <div
                        style={{ height: `${overdueH}%` }}
                        className="w-1/2 max-w-[18px] rounded-t-sm bg-rose-500/80 hover:bg-rose-500 transition-colors"
                        title={`${wk.overdue} Overdue Doses`}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">{wk.week}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-xs bg-sky-500" />
                  <span>Upcoming (Next 14 Days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-xs bg-rose-500" />
                  <span>Overdue (Action Required)</span>
                </div>
              </div>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">Overdue -26% in 8w</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Healthcare Facility Activity */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Healthcare Facility Compliance & Throughput
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Administered volume and adherence to scheduled delivery windows
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono bg-secondary">
              5 Key Centers
            </Badge>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-3">
            {MOCK_CLINICIAN_ACTIVITY_RANKING.map((fac, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-1.5 text-xs shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <h5 className="font-semibold text-foreground truncate">{fac.facility}</h5>
                    <p className="text-[11px] text-muted-foreground">{fac.city} &bull; Lead: {fac.leadDoctor}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-mono shrink-0">
                    {fac.onTimeRate} On-Time
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                  <span>{fac.administeredDoses} Vaccines Injected</span>
                  <span>{fac.activePatients} Active Families</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 5. AI Assistant & RAG Query Intelligence */}
      <Card className="border border-border shadow-xs bg-card/60">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                AI Assistant Intelligence & Clinical Grounding Analytics
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Semantic retrieval accuracy, frequent patient questions, and UIP rule validation.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-mono self-start sm:self-auto">
            {MOCK_AI_RAG_ANALYTICS.totalQueries.toLocaleString()} Total Inquiries
          </Badge>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            {/* KPI Column */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[11px] text-muted-foreground font-mono">Deterministic Grounding Rate</span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-sora">
                  {MOCK_AI_RAG_ANALYTICS.averageConfidence}
                </div>
                <p className="text-[10.5px] text-muted-foreground">Zero ungrounded hallucinations detected.</p>
              </div>

              <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[11px] text-muted-foreground font-mono">Average Retrieval Latency</span>
                <div className="text-xl font-bold text-foreground font-sora">
                  {MOCK_AI_RAG_ANALYTICS.averageLatencyMs}ms
                </div>
                <p className="text-[10.5px] text-muted-foreground">Vector lookup + Contextual citation generation.</p>
              </div>
            </div>

            {/* Top Query Topics */}
            <div className="lg:col-span-2 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                Most Frequent Clinical Topics Inquired by Families
              </span>
              <div className="space-y-2">
                {MOCK_AI_RAG_ANALYTICS.topTopics.map((top, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate pr-2">{top.topic}</span>
                      <span className="font-mono text-muted-foreground shrink-0">{top.count} queries ({top.percentage}%)</span>
                    </div>
                    <Progress value={top.percentage * 2.5} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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

export default AdminAnalyticsPage;
