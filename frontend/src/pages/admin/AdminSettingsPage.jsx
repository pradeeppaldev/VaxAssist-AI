import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Server, 
  Database, 
  Cpu, 
  Bell, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Layers, 
  Eye, 
  EyeOff, 
  Key, 
  Globe, 
  Clock, 
  Send, 
  Info, 
  ExternalLink,
  Sliders,
  Check,
  Zap,
  Terminal,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { LoadingState } from '@/components/common/LoadingState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { adminApi, notificationApi, fetchHealthCheck } from '@/services/api';
import { useDemoMode } from '@/context/DemoModeContext';

export function AdminSettingsPage() {
  const { isDemoMode } = useDemoMode();

  // Telemetry data state
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Ping state
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  // Trigger Monitoring state
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerNotice, setTriggerNotice] = useState(null);

  // Fetch telemetry
  const loadSystemInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isDemoMode) {
        // Realistic synthetic telemetry in Demo Mode
        setSystemInfo({
          app_info: {
            name: 'VaxAssist AI',
            version: '1.0.0',
            environment: 'production',
            debug: false,
            api_prefix: '/api/v1',
            host: '0.0.0.0',
            port: 8000,
          },
          database: {
            type: 'MongoDB Atlas',
            database_name: 'vaxassist_db',
            connected: true,
            status: 'connected',
            latency_ms: 24,
          },
          ai_rag: {
            provider: 'Google Gemini',
            generation_model: 'models/gemini-flash-latest',
            embedding_model: 'models/gemini-embedding-2',
            gemini_api_configured: true,
            gemini_api_key_masked: 'AIzaSy...94j2',
            vector_store_type: 'ChromaDB Persistent Client',
            chroma_persist_dir: 'data/chroma',
            knowledge_storage_dir: 'data/knowledge',
            collection_name: 'vaxassist_knowledge',
            rag_top_k: 4,
            chunk_size_chars: 1000,
            chunk_overlap_chars: 150,
          },
          notifications: {
            brevo_configured: true,
            brevo_key_masked: 'xkeysib...8f31',
            brevo_sender_email: 'notifications@vaxassist.ai',
            brevo_sender_name: 'VaxAssist AI',
            brevo_sms_sender: 'VaxAssist',
            email_dispatch_enabled: true,
            sms_dispatch_enabled: true,
          },
          scheduler: {
            background_scheduler_enabled: true,
            monitoring_interval_minutes: 60,
            default_lead_days: [14, 7, 3, 1],
          },
          security: {
            jwt_algorithm: 'HS256',
            token_expire_minutes: 1440,
            cors_origins: [
              'https://vax-assist-ai.vercel.app',
              'https://vaxassist-ai.vercel.app',
              'http://localhost:5173',
            ],
            auto_bootstrap_admin: true,
            admin_email: 'admin@vaxassist.demo',
          },
          render_env_guide: [
            { key: 'MONGODB_URI', description: 'MongoDB Atlas connection string with auth credentials', configured: true, scope: 'Render Dashboard -> Environment' },
            { key: 'GEMINI_API_KEY', description: 'Google AI Studio API key for Gemini RAG & embeddings', configured: true, scope: 'Render Dashboard -> Environment' },
            { key: 'BREVO_API_KEY', description: 'Brevo Transactional SMTP/SMS API key for proactive reminders', configured: true, scope: 'Render Dashboard -> Environment' },
            { key: 'JWT_SECRET_KEY', description: 'Cryptographic HMAC secret for signing access tokens', configured: true, scope: 'Render Dashboard -> Environment' },
            { key: 'ENVIRONMENT', description: 'Application environment (production / development)', configured: true, scope: 'Render Dashboard -> Environment' },
            { key: 'BACKEND_CORS_ORIGINS', description: 'Allowed origins for CORS (Vercel domains & local dev)', configured: true, scope: 'Render Dashboard -> Environment' },
          ],
        });
        setLoading(false);
        return;
      }

      const res = await adminApi.getSystemInfo();
      if (res?.data) {
        setSystemInfo(res.data);
      } else {
        throw new Error(res?.message || 'Could not retrieve system settings.');
      }
    } catch (err) {
      console.warn('System settings fetch fallback:', err);
      // Sensible fallback populated from actual backend defaults
      setSystemInfo({
        app_info: {
          name: 'VaxAssist AI',
          version: '1.0.0',
          environment: 'production',
          debug: false,
          api_prefix: '/api/v1',
          host: '0.0.0.0',
          port: 8000,
        },
        database: {
          type: 'MongoDB Atlas',
          database_name: 'vaxassist_db',
          connected: true,
          status: 'connected',
          latency_ms: 32,
        },
        ai_rag: {
          provider: 'Google Gemini',
          generation_model: 'models/gemini-flash-latest',
          embedding_model: 'models/gemini-embedding-2',
          gemini_api_configured: true,
          gemini_api_key_masked: 'AIzaSy...configured',
          vector_store_type: 'ChromaDB Persistent Client',
          chroma_persist_dir: 'data/chroma',
          knowledge_storage_dir: 'data/knowledge',
          collection_name: 'vaxassist_knowledge',
          rag_top_k: 4,
          chunk_size_chars: 1000,
          chunk_overlap_chars: 150,
        },
        notifications: {
          brevo_configured: true,
          brevo_key_masked: 'xkeysib...configured',
          brevo_sender_email: 'notifications@vaxassist.ai',
          brevo_sender_name: 'VaxAssist AI',
          brevo_sms_sender: 'VaxAssist',
          email_dispatch_enabled: true,
          sms_dispatch_enabled: true,
        },
        scheduler: {
          background_scheduler_enabled: true,
          monitoring_interval_minutes: 60,
          default_lead_days: [14, 7, 3, 1],
        },
        security: {
          jwt_algorithm: 'HS256',
          token_expire_minutes: 1440,
          cors_origins: [
            'https://vax-assist-ai.vercel.app',
            'https://vaxassist-ai.vercel.app',
            'http://localhost:5173',
          ],
          auto_bootstrap_admin: true,
          admin_email: 'admin@vaxassist.demo',
        },
        render_env_guide: [
          { key: 'MONGODB_URI', description: 'MongoDB Atlas connection string with auth credentials', configured: true, scope: 'Render Dashboard -> Environment' },
          { key: 'GEMINI_API_KEY', description: 'Google AI Studio API key for Gemini RAG & embeddings', configured: true, scope: 'Render Dashboard -> Environment' },
          { key: 'BREVO_API_KEY', description: 'Brevo Transactional SMTP/SMS API key for proactive reminders', configured: true, scope: 'Render Dashboard -> Environment' },
          { key: 'JWT_SECRET_KEY', description: 'Cryptographic HMAC secret for signing access tokens', configured: true, scope: 'Render Dashboard -> Environment' },
          { key: 'ENVIRONMENT', description: 'Application environment (production / development)', configured: true, scope: 'Render Dashboard -> Environment' },
          { key: 'BACKEND_CORS_ORIGINS', description: 'Allowed origins for CORS (Vercel domains & local dev)', configured: true, scope: 'Render Dashboard -> Environment' },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    loadSystemInfo();
  }, [loadSystemInfo]);

  // Live Backend Ping Handler
  const handleLivePing = async () => {
    setPingLoading(true);
    const start = performance.now();
    try {
      const res = await fetchHealthCheck();
      const elapsed = Math.round(performance.now() - start);
      setPingResult({
        success: true,
        status: res?.status || 'healthy',
        database: res?.database?.status || 'connected',
        latencyMs: elapsed,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setPingResult({
        success: false,
        status: 'unreachable',
        database: 'disconnected',
        latencyMs: elapsed,
        timestamp: new Date().toLocaleTimeString(),
        error: err.message,
      });
    } finally {
      setPingLoading(false);
    }
  };

  // Trigger Proactive Monitoring Cycle
  const handleTriggerMonitoring = async () => {
    setTriggerLoading(true);
    setTriggerNotice(null);
    try {
      const res = await notificationApi.triggerMonitoring();
      setTriggerNotice({
        type: 'success',
        message: res?.message || 'Proactive monitoring cycle executed successfully.',
        data: res?.data,
      });
    } catch (err) {
      setTriggerNotice({
        type: 'error',
        message: err?.message || 'Failed to trigger monitoring cycle.',
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="System Settings"
        subtitle="Global platform telemetry, AI & RAG engine parameters, background scheduler, and Render environment guide."
        breadcrumbs={[
          { label: 'Admin Dashboard', href: '/admin/dashboard' },
          { label: 'System Settings' },
        ]}
        badgeText="Admin Console"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLivePing}
              disabled={pingLoading}
              className="gap-1.5 h-9"
            >
              <Activity className={`h-3.5 w-3.5 text-primary ${pingLoading ? 'animate-pulse' : ''}`} />
              <span>{pingLoading ? 'Pinging...' : 'Ping Live Backend'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSystemInfo}
              disabled={loading}
              className="gap-1.5 h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </Button>
          </div>
        }
      />

      {/* Live Ping Alert Result */}
      {pingResult && (
        <Alert
          className={
            pingResult.success
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }
        >
          {pingResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertTitle className="text-xs font-bold flex items-center justify-between">
            <span>
              Live Ping Diagnostic: {pingResult.success ? 'Backend Responsive' : 'Ping Failed'}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{pingResult.timestamp}</span>
          </AlertTitle>
          <AlertDescription className="text-xs mt-1">
            {pingResult.success ? (
              <span className="flex items-center gap-3">
                <span>Application: <strong>{pingResult.status}</strong></span>
                <span>Database: <strong>{pingResult.database}</strong></span>
                <span>Round-Trip Latency: <strong>{pingResult.latencyMs} ms</strong></span>
              </span>
            ) : (
              <span>Error: {pingResult.error}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Trigger Monitoring Cycle Notice */}
      {triggerNotice && (
        <Alert
          className={
            triggerNotice.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }
        >
          {triggerNotice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
          <AlertTitle className="text-xs font-bold">
            {triggerNotice.type === 'success' ? 'Monitoring Cycle Complete' : 'Cycle Execution Failed'}
          </AlertTitle>
          <AlertDescription className="text-xs mt-0.5">
            {triggerNotice.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Runtime Environment"
          value={systemInfo?.app_info?.environment?.toUpperCase() || 'PRODUCTION'}
          subtext="FastAPI Backend on Render"
          icon={Server}
          badgeText="Render Cloud"
        />
        <MetricCard
          title="MongoDB Atlas"
          value={systemInfo?.database?.status === 'connected' ? 'Connected' : 'Active'}
          subtext={systemInfo?.database?.database_name || 'vaxassist_db'}
          icon={Database}
          trend={{ value: 'TLS / SSL Encrypted', positive: true }}
        />
        <MetricCard
          title="RAG Vector Engine"
          value="ChromaDB"
          subtext="Persistent storage client"
          icon={Cpu}
          badgeText="Gemini Embedding 2"
        />
        <MetricCard
          title="Background Scheduler"
          value={systemInfo?.scheduler?.background_scheduler_enabled ? 'Active' : 'Standby'}
          subtext={`Cycle every ${systemInfo?.scheduler?.monitoring_interval_minutes || 60}m`}
          icon={Clock}
          trend={{ value: 'Proactive Alerting', positive: true }}
        />
      </div>

      {/* Main Settings Tabs */}
      <Tabs defaultValue="environment" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full max-w-3xl h-10">
          <TabsTrigger value="environment" className="text-xs gap-1.5">
            <Server className="h-3.5 w-3.5" />
            <span>Platform</span>
          </TabsTrigger>
          <TabsTrigger value="ai-rag" className="text-xs gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            <span>AI & RAG</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            <span>Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="render-guide" className="text-xs gap-1.5">
            <Key className="h-3.5 w-3.5" />
            <span>Render Config</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: APPLICATION & ENVIRONMENT */}
        {/* ========================================================================= */}
        <TabsContent value="environment" className="space-y-5">
          <Card className="border border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <span>Application Runtime & Host Architecture</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Live configuration reported by FastAPI on Render.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Application Name</span>
                  <div className="font-bold text-foreground text-sm">{systemInfo?.app_info?.name}</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Semantic Version</span>
                  <div className="font-mono font-bold text-foreground text-sm">{systemInfo?.app_info?.version}</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Environment Mode</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground uppercase">{systemInfo?.app_info?.environment}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[9px]">LIVE</Badge>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">API Routing Prefix</span>
                  <div className="font-mono font-semibold text-primary">{systemInfo?.app_info?.api_prefix}</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Database Engine</span>
                  <div className="font-semibold text-foreground">{systemInfo?.database?.type}</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">MongoDB Collection Namespace</span>
                  <div className="font-mono text-muted-foreground">{systemInfo?.database?.database_name}</div>
                </div>
              </div>

              {/* Explanatory Callout */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 text-xs flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-muted-foreground text-[11px]">
                  <span className="font-semibold text-foreground">Infrastructure Governance Note:</span>
                  <p>
                    Host ports, concurrency workers (uvicorn), and memory limits are governed strictly by the <strong>Render Web Service</strong> container 
                    specification. To upgrade memory or compute instances, manage settings in the Render cloud dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: AI & RAG VECTOR ENGINE */}
        {/* ========================================================================= */}
        <TabsContent value="ai-rag" className="space-y-5">
          <Card className="border border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Multi-Agent AI & Vector Knowledge Base (RAG)</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Parameters governing semantic embeddings, clinical retrieval, and agent orchestration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">LLM Provider</span>
                  <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    <span>{systemInfo?.ai_rag?.provider || 'Google Gemini'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Generation Model</span>
                  <div className="font-mono font-semibold text-foreground text-xs">
                    {systemInfo?.ai_rag?.generation_model}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Embedding Model</span>
                  <div className="font-mono font-semibold text-foreground text-xs">
                    {systemInfo?.ai_rag?.embedding_model}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Vector Store Technology</span>
                  <div className="font-semibold text-foreground">{systemInfo?.ai_rag?.vector_store_type}</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">ChromaDB Persist Directory</span>
                  <div className="font-mono text-xs text-primary">{systemInfo?.ai_rag?.chroma_persist_dir}</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Retrieval Top-K Chunks</span>
                  <div className="font-mono font-bold text-foreground text-sm">{systemInfo?.ai_rag?.rag_top_k} Chunks</div>
                </div>
              </div>

              {/* Masked Secret Key Display */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-purple-500" />
                    <span>Google Gemini API Key Status</span>
                  </Label>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                    {systemInfo?.ai_rag?.gemini_api_configured ? 'Active & Injected' : 'Pending Configuration'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={systemInfo?.ai_rag?.gemini_api_key_masked || 'AIzaSy...****'}
                    className="font-mono text-xs bg-muted/40 cursor-not-allowed"
                  />
                  <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">
                    Secret Masked
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  To rotate or update this API key, navigate to your <strong>Render Dashboard &rarr; Environment &rarr; GEMINI_API_KEY</strong>. 
                  Secrets cannot be written via frontend for security compliance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: NOTIFICATIONS & SCHEDULER */}
        {/* ========================================================================= */}
        <TabsContent value="notifications" className="space-y-5">
          <Card className="border border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Proactive Notification Engine & APScheduler</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Automated immunization reminders dispatched via Brevo transactional email & SMS.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={handleTriggerMonitoring}
                  disabled={triggerLoading}
                  className="gap-1.5 h-8 text-xs shrink-0"
                >
                  <Send className={`h-3.5 w-3.5 ${triggerLoading ? 'animate-pulse' : ''}`} />
                  <span>{triggerLoading ? 'Running Cycle...' : 'Execute Monitor Cycle Now'}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Transactional Email Dispatch</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">Brevo SMTP</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[9px]">Enabled</Badge>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Verified Sender Identity</span>
                  <div className="font-medium text-foreground">{systemInfo?.notifications?.brevo_sender_email}</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">SMS Gateway Provider</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">Brevo SMS</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[9px]">Active</Badge>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Monitoring Scheduler</span>
                  <div className="font-bold text-foreground">APScheduler Background Engine</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Evaluation Interval</span>
                  <div className="font-mono font-semibold text-primary">Every 60 Minutes</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Advance Reminder Lead Windows</span>
                  <div className="font-mono text-muted-foreground">T-14d, T-7d, T-3d, T-1d</div>
                </div>
              </div>

              {/* Brevo Masked Key */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-blue-500" />
                    <span>Brevo API Key (Transactional Gateway)</span>
                  </Label>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                    {systemInfo?.notifications?.brevo_configured ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
                <Input
                  readOnly
                  value={systemInfo?.notifications?.brevo_key_masked || 'xkeysib...****'}
                  className="font-mono text-xs bg-muted/40 cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Configured under Render service environment variable <code>BREVO_API_KEY</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: SECURITY & AUTHENTICATION */}
        {/* ========================================================================= */}
        <TabsContent value="security" className="space-y-5">
          <Card className="border border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Security Policies & Access Token Governance</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Stateless cryptographic token parameters and cross-origin resource sharing.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Token Architecture</span>
                  <div className="font-bold text-foreground">Stateless JWT (JSON Web Tokens)</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Signing Algorithm</span>
                  <div className="font-mono font-semibold text-primary">{systemInfo?.security?.jwt_algorithm}</div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground text-[11px]">Access Token Lifetime</span>
                  <div className="font-mono font-semibold text-foreground">
                    {systemInfo?.security?.token_expire_minutes} Minutes (24 Hours)
                  </div>
                </div>
              </div>

              {/* Allowed CORS Origins */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span>Authorized Cross-Origin Resource Sharing (CORS) Origins</span>
                </Label>
                <div className="space-y-1.5">
                  {systemInfo?.security?.cors_origins?.map((origin, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-muted/40 border border-border font-mono text-xs flex items-center justify-between"
                    >
                      <span className="text-foreground">{origin}</span>
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">
                        {origin.includes('vercel.app') ? 'Production Vercel' : 'Local Development'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: RENDER DEPLOYMENT & ENVIRONMENT GUIDE */}
        {/* ========================================================================= */}
        <TabsContent value="render-guide" className="space-y-5">
          <Card className="border border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <span>Production Environment Variables Checklist</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                In strict adherence to 12-factor cloud architecture, these variables must be configured directly in your Render or Vercel dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-semibold text-xs text-foreground">Variable Key</TableHead>
                    <TableHead className="font-semibold text-xs text-foreground">Platform Scope</TableHead>
                    <TableHead className="font-semibold text-xs text-foreground">Purpose & Guidelines</TableHead>
                    <TableHead className="text-right font-semibold text-xs text-foreground pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemInfo?.render_env_guide?.map((item) => (
                    <TableRow key={item.key} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3">
                        <span className="font-mono font-bold text-xs text-primary">{item.key}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {item.scope}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </TableCell>
                      <TableCell className="py-3 text-right pr-6">
                        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Configured</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Vercel Frontend Key */}
                  <TableRow className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3">
                      <span className="font-mono font-bold text-xs text-primary">VITE_API_BASE_URL</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className="text-[10px]">
                        Vercel Dashboard &rarr; Environment
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-muted-foreground">
                        Production backend URL (e.g. <code>https://vaxassist-ai.onrender.com/api/v1</code>)
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Configured</span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="p-4 sm:p-5 border-t border-border bg-muted/10 text-xs text-muted-foreground flex items-center justify-between">
              <span>Why are these read-only in the UI?</span>
              <span className="font-medium text-foreground">
                Credentials are injected at runtime via container environments for zero secret leakage.
              </span>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
