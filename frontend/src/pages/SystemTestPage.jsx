import React from 'react';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Server, 
  Globe, 
  Clock, 
  Check, 
  Copy,
  Layers,
  FileCode2
} from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { API_BASE_URL } from '../services/api';

export default function SystemTestPage() {
  const { data, latency, loading, error, lastChecked, refresh, isConnected } = useHealthCheck();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDbConnected = data?.database?.status === 'connected';

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <Activity className="h-4 w-4" />
            <span>Diagnostics &amp; Verification</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            System Communication Test
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Verify bidirectional frontend &rarr; FastAPI communication and MongoDB database connectivity.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Testing...' : 'Retest Connection'}</span>
        </button>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backend API Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
              <Server className="h-5 w-5 text-blue-600" />
              <span>FastAPI Backend</span>
            </div>
            {loading ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Checking...
              </span>
            ) : isConnected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">
                <XCircle className="h-3 w-3" /> Unreachable
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Service:</span>
              <span className="font-medium text-slate-800">{data?.service || 'VaxAssist AI'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">API Version:</span>
              <span className="font-mono text-slate-800">{data?.version || '1.0.0'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Endpoint:</span>
              <span className="font-mono text-slate-600 text-[11px] truncate max-w-[160px]" title={`${API_BASE_URL}/health`}>
                /api/v1/health
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Latency:</span>
              <span className="font-mono font-medium text-blue-600">
                {latency !== null ? `${latency} ms` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
              <Database className="h-5 w-5 text-emerald-600" />
              <span>MongoDB</span>
            </div>
            {loading ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Checking...
              </span>
            ) : isDbConnected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                <AlertTriangle className="h-3 w-3" /> Standby / Offline
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Database Name:</span>
              <span className="font-mono text-slate-800">{data?.database?.database || 'vaxassist_db'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Ping Result:</span>
              <span className="font-medium text-slate-800">{data?.database?.status || 'untested'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Driver:</span>
              <span className="text-slate-800">Motor (AsyncIO)</span>
            </div>
          </div>
        </div>

        {/* Runtime Environment Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
              <Globe className="h-5 w-5 text-purple-600" />
              <span>Client &bull; Environment</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
              Phase 1
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Client Host:</span>
              <span className="font-mono text-slate-800">{window.location.host}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Environment:</span>
              <span className="font-mono text-slate-800">{data?.environment || 'development'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Last Checked:</span>
              <span className="font-mono text-slate-600">
                {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Setup Notice if DB is disconnected */}
      {!loading && !isDbConnected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm text-amber-900">
              <p className="font-semibold">MongoDB Service Connection Notice</p>
              <p className="text-xs leading-relaxed text-amber-800">
                {data?.database?.message || 
                  'MongoDB is currently offline or unreachable at the configured URI. The FastAPI backend is running properly in decoupled mode.'}
              </p>
              <div className="rounded-md bg-white/70 border border-amber-200 p-3 font-mono text-xs text-slate-800">
                <span className="text-slate-500"># To enable local MongoDB:</span><br/>
                Start MongoDB service via Windows Services or run <code className="bg-amber-100 px-1 rounded">mongod</code><br/>
                <span className="text-slate-500"># Or configure a MongoDB Atlas cloud URI in:</span><br/>
                <code className="bg-amber-100 px-1 rounded">backend/.env &rarr; MONGODB_URI="mongodb+srv://..."</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Payload Viewer */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FileCode2 className="h-4 w-4 text-blue-600" />
            <span>FastAPI Live Health Response (JSON)</span>
          </div>

          <button
            onClick={handleCopy}
            disabled={!data}
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto max-h-96">
          {loading && !data ? (
            <p className="text-slate-500 italic">// Requesting GET /api/v1/health from FastAPI backend...</p>
          ) : error ? (
            <div className="text-rose-400">
              <p className="font-semibold">// Connection Error:</p>
              <p>{error}</p>
              <p className="mt-2 text-slate-400">// Ensure the FastAPI backend is running on http://127.0.0.1:8000</p>
            </div>
          ) : (
            <pre>{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
