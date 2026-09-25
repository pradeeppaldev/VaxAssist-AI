import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Activity, Terminal, ExternalLink } from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';

export default function Navbar() {
  const location = useLocation();
  const { isConnected, loading } = useHealthCheck(30000); // 30s auto-refresh

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-900 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg leading-tight tracking-tight font-extrabold text-blue-900">
              VaxAssist<span className="text-blue-600">.AI</span>
            </span>
            <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
              Phase 1 • Foundation
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/')
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overview
          </Link>
          <Link
            to="/system-test"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/system-test')
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>System Test</span>
          </Link>
        </nav>

        {/* Backend Status Badge & Docs */}
        <div className="flex items-center gap-3">
          <Link
            to="/system-test"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors"
            title="Backend status"
          >
            <span className="relative flex h-2 w-2">
              {loading ? (
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              ) : isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="h-2 w-2 rounded-full bg-rose-500" />
              )}
            </span>
            <span className="hidden sm:inline">
              Backend: {loading ? 'Checking...' : isConnected ? 'Online' : 'Disconnected'}
            </span>
          </Link>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 px-2 py-1 rounded transition-colors"
            title="FastAPI Swagger Documentation"
          >
            <span>API Docs</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
