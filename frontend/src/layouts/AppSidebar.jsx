import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  LifeBuoy, 
  HelpCircle,
  Stethoscope,
  Users,
  Settings,
  LogOut
} from 'lucide-react';
import { ROLE_NAVIGATION } from './navigationConfig';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AppSidebar({ className, onNavClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const role = user?.role || 'PATIENT';
  const roleConfig = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.PATIENT;

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border w-64 select-none",
        className
      )}
    >
      {/* Role Context Header */}
      <div className="p-4 border-b border-border/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground font-mono">
              WORKSPACE
            </span>
          </div>
          <Badge variant={roleConfig.badgeVariant} className="text-[10px]">
            {roleConfig.badgeText}
          </Badge>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[11px] font-semibold text-muted-foreground px-3 mb-2 uppercase tracking-wider font-mono">
          Main Menu
        </div>

        {roleConfig.items.map((item) => {
          const Icon = item.icon;
          const isAI = item.isAI;
          const isActive = location.pathname === item.href || (item.href !== '/patient/dashboard' && item.href !== '/healthcare/dashboard' && item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));

          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavClick}
              className={({ isActive: navActive }) => {
                const active = navActive || isActive;
                return cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary font-semibold shadow-2xs border-l-3 border-l-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  isAI && !active && "hover:border-primary/30"
                );
              }}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : isAI
                      ? "text-primary/70 group-hover:text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className={cn(isAI && "font-sora tracking-tight")}>
                  {item.title}
                </span>
              </div>

              {isAI && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary tracking-wider uppercase font-mono">
                  AI
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer Help & System Context */}
      <div className="p-3 border-t border-border/80 bg-muted/20 space-y-2">
        <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs font-sans">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>VaxAssist Grounding</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Deterministic schedules aligned with Universal Immunization Programme (UIP).
          </p>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
