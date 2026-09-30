import React from 'react';
import { Database, Sparkles, Activity } from 'lucide-react';
import { useDemoMode } from '@/context/DemoModeContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ModeToggle({ compact = false, className = '' }) {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleDemoMode}
          aria-label={isDemoMode ? 'Switch to Live Database Mode' : 'Switch to Demo Simulation Mode'}
          className={`group inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            isDemoMode
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
          } ${className}`}
        >
          {isDemoMode ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="font-semibold tracking-wide">Demo Mode</span>
              {!compact && (
                <span className="hidden sm:inline text-[10px] text-amber-600/80 dark:text-amber-400/80 border-l border-amber-500/30 pl-1.5 ml-0.5">
                  Sandbox
                </span>
              )}
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold tracking-wide">Live Mode</span>
              {!compact && (
                <span className="hidden sm:inline text-[10px] text-emerald-600/80 dark:text-emerald-400/80 border-l border-emerald-500/30 pl-1.5 ml-0.5">
                  Connected
                </span>
              )}
            </>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs max-w-xs p-2.5">
        {isDemoMode ? (
          <div>
            <p className="font-semibold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Demo Mode Active
            </p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
              Displaying realistic simulated clinical data. Mutations are stored locally and will not alter live MongoDB. Click to switch to Live Mode.
            </p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              Live Mode Active
            </p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
              Directly connected to FastAPI backend &amp; MongoDB Atlas. Shows genuine database records and empty states. Click to switch to Demo Mode.
            </p>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
