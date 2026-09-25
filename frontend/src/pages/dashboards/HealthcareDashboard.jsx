import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Stethoscope, 
  BadgeCheck, 
  Building2, 
  Users, 
  CheckCircle, 
  ClipboardList, 
  FileCheck, 
  Sparkles 
} from 'lucide-react';

export default function HealthcareDashboard() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 p-8 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-xs mb-3">
              <BadgeCheck className="h-3.5 w-3.5 text-teal-200" />
              <span>Verified Healthcare Professional Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Clinical Workspace &bull; {user?.name}
            </h1>
            <p className="mt-1 text-sm text-teal-100">
              Administer vaccines, certify administered doses, and view patient compliance records.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 border border-white/10 backdrop-blur-xs text-xs space-y-1.5 min-w-[220px]">
            <div className="flex items-center justify-between text-teal-100">
              <span>Status:</span>
              <span className="font-semibold text-emerald-300 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                {user?.account_status || 'ACTIVE'}
              </span>
            </div>
            {user?.license_number && (
              <div className="flex items-center justify-between text-teal-100 border-t border-white/10 pt-1">
                <span>License:</span>
                <span className="font-mono font-medium text-white">{user.license_number}</span>
              </div>
            )}
            {user?.clinic_or_hospital && (
              <div className="flex items-center justify-between text-teal-100 border-t border-white/10 pt-1">
                <span>Affiliation:</span>
                <span className="font-medium text-white truncate max-w-[120px]">{user.clinic_or_hospital}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Workflow Previews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Clinical Workflow Tools</h2>
          <span className="text-xs font-medium text-slate-500">Upcoming in Phases 3 – 8</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 w-fit">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Patient Registry Access</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lookup patients and families who have authorized clinical access to their vaccination profile.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-teal-600">
              Scheduled: Phase 3
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 w-fit">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Record &amp; Verify Doses</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Record administered vaccine batch numbers, manufacturer, dates, and sign digital certificates.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-emerald-600">
              Scheduled: Phase 4
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 w-fit">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Recommendation Agent</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clinical catch-up schedule assistance, dose interval verification, and precaution alerts.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-blue-600">
              Scheduled: Phase 8
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
