import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Database, 
  BookOpen,
  BellRing,
  FileSpreadsheet,
  BrainCircuit,
  Lock
} from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';

export default function HomePage() {
  const { isConnected, loading } = useHealthCheck();

  const roles = [
    {
      role: 'PATIENT / FAMILY',
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: 'Family Focus',
      description: 'Manage family profiles, store vaccination histories, track due/overdue milestones, receive automated alerts, and request AI assistance.',
    },
    {
      role: 'HEALTHCARE_WORKER',
      icon: Stethoscope,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'Clinical Portal',
      description: 'Access authorized patient records, record administered doses, verify vaccination entries, and generate clinical catch-up summaries.',
    },
    {
      role: 'ADMIN',
      icon: ShieldAlert,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: 'System Governance',
      description: 'Manage users, review healthcare provider credentials, curate approved RAG knowledge documents, inspect audit logs and monitor system health.',
    },
  ];

  const agents = [
    {
      name: 'Monitoring Agent',
      desc: 'Proactively scans schedules to detect upcoming, due, overdue, and missed vaccination milestones.',
      icon: Activity,
    },
    {
      name: 'Reminder Agent',
      desc: 'Orchestrates in-app, email, and scheduled alerts based on deterministic monitoring events.',
      icon: BellRing,
    },
    {
      name: 'Knowledge / RAG Agent',
      desc: 'Answers user questions grounded in official WHO/CDC guidelines using ChromaDB vector search.',
      icon: BookOpen,
    },
    {
      name: 'Recommendation Agent',
      desc: 'Calculates personalized catch-up plans and travel vaccination guidance based on schedule rules.',
      icon: BrainCircuit,
    },
    {
      name: 'Report Generation Agent',
      desc: 'Synthesizes vaccination certificates, family summaries, and compliance audit reports.',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50 to-white pt-16 pb-12 border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              Phase 1 Foundation Active &bull; Architecture Established
            </div>

            <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Digital Vaccination Tracking, Reminders &amp;{' '}
              <span className="text-blue-600">AI Care Coordination</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-slate-600">
              VaxAssist AI helps families digitally track immunization records, calculates deterministic schedules, 
              delivers timely reminders, and connects specialized multi-agent AI assistants grounded in verified clinical knowledge.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/system-test"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Activity className="h-5 w-5" />
                <span>Test Backend Connection</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <span>Interactive OpenAPI Docs</span>
              </a>
            </div>

            {/* Connection Status Banner */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${loading ? 'bg-amber-400' : isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="font-medium text-slate-800">
                  Backend API: {loading ? 'Checking...' : isConnected ? 'Connected (FastAPI 1.0.0)' : 'Not Connected'}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <Link to="/system-test" className="text-xs font-semibold text-blue-600 hover:underline">
                View Diagnostics &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 User Roles Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Unified Platform for Three Core Roles
          </h2>
          <p className="mt-2 text-slate-600">
            A single React web application delivering role-specific workflows and protected dashboards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-lg border ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.role}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{item.description}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs text-slate-400 font-medium">
                  <Lock className="h-3.5 w-3.5 mr-1" />
                  <span>Configured for Phase 2 Role Auth</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5 AI Agents Preview */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                <Cpu className="h-4 w-4" />
                <span>Multi-Agent AI Layer (Phases 7 &bull; 8 &bull; 9)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                5 Specialized AI Agents + Central Orchestrator
              </h2>
            </div>
            <p className="text-sm text-slate-500 max-w-md">
              Connected through an orchestration layer and grounded in deterministic data and approved RAG knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((ag, idx) => {
              const Icon = ag.icon;
              return (
                <div 
                  key={idx}
                  className="rounded-lg border border-slate-150 bg-slate-50/70 p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-md bg-white border border-slate-200 text-blue-600 shadow-xs">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">{ag.name}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ag.desc}</p>
                </div>
              );
            })}
            <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Deterministic Core</span>
              </div>
              <p className="text-xs text-blue-600/90 leading-relaxed">
                Schedule calculations remain strictly mathematical and guideline-driven; AI agents assist workflows without guessing dates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Blueprint */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div>
              <span className="text-xs font-mono uppercase text-blue-400">Frontend Tier</span>
              <p className="mt-1 font-semibold text-white">React 18 + Vite</p>
              <p className="text-xs text-slate-400 mt-1">Tailwind CSS &bull; shadcn/ui &bull; React Router</p>
            </div>
            <div>
              <span className="text-xs font-mono uppercase text-emerald-400">Backend API</span>
              <p className="mt-1 font-semibold text-white">FastAPI + Python</p>
              <p className="text-xs text-slate-400 mt-1">Pydantic &bull; CORS &bull; Async Lifespan</p>
            </div>
            <div>
              <span className="text-xs font-mono uppercase text-amber-400">Database Layer</span>
              <p className="mt-1 font-semibold text-white">MongoDB + Motor</p>
              <p className="text-xs text-slate-400 mt-1">Async driver &bull; 9 Core Data Models</p>
            </div>
            <div>
              <span className="text-xs font-mono uppercase text-purple-400">AI / Knowledge</span>
              <p className="mt-1 font-semibold text-white">ChromaDB + LangChain</p>
              <p className="text-xs text-slate-400 mt-1">RAG &bull; 5 Agents &bull; Orchestrator</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
