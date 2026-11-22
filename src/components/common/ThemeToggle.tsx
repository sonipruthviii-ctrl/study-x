import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg border border-slate-200 dark:border-[#1E3562] bg-white/80 dark:bg-[#0D1A35]/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4 text-sky-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
      {showLabel && (
        <span className="text-sm font-medium">{isDark ? 'Light mode' : 'Dark mode'}</span>
      )}
    </button>
  );
}
