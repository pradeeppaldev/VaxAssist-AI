import React from 'react';
import { ShieldCheck, Heart, Terminal } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>
            <strong>VaxAssist AI</strong> &bull; Digital Vaccination Tracking & Reminder System
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>React 18 + Vite + Tailwind</span>
          <span>&bull;</span>
          <span>FastAPI + MongoDB</span>
          <span>&bull;</span>
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-600">
            Phase 1
          </span>
        </div>
      </div>
    </footer>
  );
}
