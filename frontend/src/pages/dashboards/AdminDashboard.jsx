import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';
import { 
  ShieldAlert, 
  Users, 
  Stethoscope, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  Power, 
  PowerOff,
  AlertTriangle,
  BadgeAlert
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers({
        search: searchTerm.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      if (res && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusUpdate = async (userId, newStatus, reason = null) => {
    try {
      await adminApi.updateUserStatus(userId, newStatus, reason);
      setSuccessMessage(`User status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
      setTimeout(() => setError(null), 4000);
    }
  };

  // Metrics calculation
  const totalUsers = users.length;
  const patientCount = users.filter((u) => u.role === 'PATIENT').length;
  const hwCount = users.filter((u) => u.role === 'HEALTHCARE_WORKER').length;
  const pendingHw = users.filter(
    (u) => u.role === 'HEALTHCARE_WORKER' && u.account_status === 'PENDING'
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> ACTIVE
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="h-3 w-3" /> PENDING
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" /> REJECTED
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
            <PowerOff className="h-3 w-3" /> INACTIVE
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>System Governance &bull; Phase 2</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Console
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Logged in as <strong>{user?.name}</strong> ({user?.email})
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Registered Users</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{totalUsers}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Patients / Families</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-600">{patientCount}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Healthcare Workers</span>
            <Stethoscope className="h-4 w-4 text-teal-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-teal-600">{hwCount}</div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Pending Approvals</span>
            <BadgeAlert className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600">{pendingHw.length}</div>
        </div>
      </div>

      {/* Healthcare Worker Approval Queue */}
      {pendingHw.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <BadgeAlert className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Healthcare Worker Verification Queue ({pendingHw.length})
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            Review submitted medical credentials before authorizing clinical access.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingHw.map((hw) => (
              <div key={hw.id} className="rounded-xl border border-amber-200 bg-white p-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{hw.name}</span>
                    <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-mono px-2 py-0.5 uppercase">Pending</span>
                  </div>
                  <div className="text-xs text-slate-600">{hw.email}</div>
                  <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-150 font-mono">
                    <div>License: <strong>{hw.license_number || 'N/A'}</strong></div>
                    <div>Clinic: <strong>{hw.clinic_or_hospital || 'Not provided'}</strong></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      const reason = window.prompt('Optional rejection reason:', 'Invalid credentials');
                      if (reason !== null) handleStatusUpdate(hw.id, 'REJECTED', reason);
                    }}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(hw.id, 'ACTIVE')}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition"
                  >
                    Approve Account
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">User Management Directory</h2>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none bg-white"
            >
              <option value="">All Roles</option>
              <option value="PATIENT">Patient</option>
              <option value="HEALTHCARE_WORKER">Healthcare Worker</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Credentials</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 italic">
                    {loading ? 'Loading user directory...' : 'No users match the search criteria.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'HEALTHCARE_WORKER'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(u.account_status)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {u.license_number ? (
                        <div>
                          <span>Lic: {u.license_number}</span>
                          {u.clinic_or_hospital && <div className="text-slate-400">{u.clinic_or_hospital}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {u.account_status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(u.id, 'ACTIVE')}
                            className="rounded px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const r = window.prompt('Rejection reason:');
                              if (r !== null) handleStatusUpdate(u.id, 'REJECTED', r);
                            }}
                            className="rounded px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px]"
                          >
                            Reject
                          </button>
                        </>
                      ) : u.account_status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusUpdate(u.id, 'INACTIVE')}
                          disabled={u.email === user?.email}
                          className="rounded px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 font-semibold text-[11px] disabled:opacity-30"
                          title={u.email === user?.email ? "Cannot deactivate yourself" : "Deactivate account"}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusUpdate(u.id, 'ACTIVE')}
                          className="rounded px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-[11px]"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
