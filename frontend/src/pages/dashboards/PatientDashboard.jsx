import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  ShieldCheck, 
  Calendar, 
  BellRing, 
  Bot, 
  FileText, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-xs mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
              <span>Role: Patient &bull; Family Care Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Manage your household's digital vaccination records, due dates, and AI assistance.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 border border-white/10 backdrop-blur-xs text-xs space-y-1">
            <div className="text-blue-200">Account Status:</div>
            <div className="font-semibold text-emerald-300 text-sm flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              {user?.account_status || 'ACTIVE'}
            </div>
            <div className="text-blue-200 text-[11px] truncate max-w-[200px]">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Family Health Modules</h2>
          <span className="text-xs font-medium text-slate-500">Upcoming in Phases 3 – 8</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Phase 3 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 w-fit">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Family Profiles</h3>
              <p className="text-xs text-slate-500 mt-1">
                Add children, parents, and dependants to manage records under one unified household account.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-blue-600">
              Scheduled: Phase 3
            </div>
          </div>

          {/* Phase 4 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 w-fit">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Vaccination Timeline</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deterministic calculation of upcoming, due, overdue, and completed immunization doses.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-emerald-600">
              Scheduled: Phase 4
            </div>
          </div>

          {/* Phase 6 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 w-fit">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Smart Reminders</h3>
              <p className="text-xs text-slate-500 mt-1">
                Automated multi-channel notifications before upcoming or overdue vaccination windows.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-amber-600">
              Scheduled: Phase 6
            </div>
          </div>

          {/* Phase 8 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 w-fit">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">AI Care Assistant</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ask questions grounded in WHO/CDC guidelines and receive personalized catch-up suggestions.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-purple-600">
              Scheduled: Phase 8
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
