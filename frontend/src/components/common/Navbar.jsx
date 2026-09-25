import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Activity, 
  ExternalLink, 
  User, 
  LogOut, 
  LayoutDashboard,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, loading: healthLoading } = useHealthCheck(30000);
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'HEALTHCARE_WORKER':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'PATIENT':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

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
              Phase 2 • Auth &amp; Roles
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

          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname.includes('/dashboard')
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          )}

          <Link
            to="/system-test"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/system-test')
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Diagnostics</span>
          </Link>
        </nav>

        {/* Right Section: Auth State & Backend Status */}
        <div className="flex items-center gap-3">
          {/* Health indicator */}
          <Link
            to="/system-test"
            className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 transition-colors"
            title="Backend status"
          >
            <span className="relative flex h-2 w-2">
              {healthLoading ? (
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
            <span>{healthLoading ? 'Testing...' : isConnected ? 'API Online' : 'API Offline'}</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900">{user?.name}</span>
                <span className={`text-[10px] font-mono font-medium px-1.5 rounded border ${getRoleBadge(user?.role)}`}>
                  {user?.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 px-3 py-1.5 text-xs font-semibold text-slate-700 transition shadow-2xs"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
