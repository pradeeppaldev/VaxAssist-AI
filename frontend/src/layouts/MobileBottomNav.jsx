import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAVIGATION } from './navigationConfig';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role || 'PATIENT';
  const roleConfig = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.PATIENT;
  const items = roleConfig.mobileItems || [];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <NavLink
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors select-none",
              isActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn("relative p-1 rounded-lg", isActive && "bg-primary/10")}>
              <Icon className="h-4 w-4" />
              {item.isAI && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </div>
            <span className={cn("mt-0.5 truncate max-w-[64px]", item.isAI && "font-sora")}>
              {item.title}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
