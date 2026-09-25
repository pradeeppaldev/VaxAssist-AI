import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';

export function ThemeToggle({ className }) {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform rotate-0 scale-100" />
      )}
    </Button>
  );
}

export default ThemeToggle;
