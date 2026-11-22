import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Clock,
  FileCheck2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Table2,
  X,
} from 'lucide-react';
import type { WorkspaceSection } from '../../types/studyx';
import { StudyxLogo } from '../common/StudyxLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { useStudy } from '../../context/StudyContext';

interface WorkspaceShellProps {
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  onOpenQuickAdd: () => void;
  onBackToLanding: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: WorkspaceSection;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'courses', label: 'Courses', shortLabel: 'Courses', icon: BookOpen },
  { id: 'assignments', label: 'Assignments', shortLabel: 'Tasks', icon: CheckSquare },
  { id: 'quizzes', label: 'Quizzes', shortLabel: 'Quizzes', icon: ClipboardCheck },
  { id: 'calendar', label: 'Calendar', shortLabel: 'Calendar', icon: CalendarDays },
  { id: 'exams', label: 'Exams', shortLabel: 'Exams', icon: FileCheck2 },
  { id: 'focus', label: 'Focus Timer', shortLabel: 'Focus', icon: Clock },
  { id: 'timetable', label: 'Smart Timetable', shortLabel: 'Timetable', icon: Table2 },
  { id: 'analytics', label: 'Progress & Analytics', shortLabel: 'Analytics', icon: BarChart3 },
];

const MOBILE_BOTTOM_IDS: WorkspaceSection[] = [
  'dashboard',
  'courses',
  'assignments',
  'quizzes',
  'focus',
];

export function WorkspaceShell({
  activeSection,
  onSelectSection,
  onOpenQuickAdd,
  onBackToLanding,
  onLogout,
  children,
}: WorkspaceShellProps) {
  const { currentProfile, currentUser } = useStudy();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const activeNav = NAV_ITEMS.find((item) => item.id === activeSection) ?? NAV_ITEMS[0];

  const initials = (currentProfile?.fullName || 'ST')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleNavClick = (section: WorkspaceSection) => {
    onSelectSection(section);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060D1F] text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-[#16274B] bg-white dark:bg-[#081226] z-30">
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-[#16274B]">
          <StudyxLogo onClick={() => onSelectSection('dashboard')} />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Workspace navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600/12 dark:bg-blue-500/20 text-blue-700 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#102042] hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-blue-600 dark:text-sky-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-slate-200 dark:border-[#16274B] space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            {currentProfile?.avatarUrl && !avatarError ? (
              <img
                src={currentProfile.avatarUrl}
                alt={currentProfile.fullName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#233B6E] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full studyx-gradient-btn text-white text-xs font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {currentProfile?.fullName || 'Student'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentProfile?.major || currentUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToLanding}
              title="View Landing Page"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-[#1E3562] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#112246] transition-colors whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5" />
              Landing
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Hamburger Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[84vw] bg-white dark:bg-[#081226] border-r border-slate-200 dark:border-[#16274B] h-full flex flex-col z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-[#16274B]">
              <StudyxLogo onClick={() => handleNavClick('dashboard')} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation drawer"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600/12 dark:bg-blue-500/20 text-blue-700 dark:text-sky-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#102042]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-[#16274B] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <ThemeToggle showLabel className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onBackToLanding();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium border border-slate-200 dark:border-[#1E3562] text-slate-700 dark:text-slate-200"
                >
                  <Home className="w-3.5 h-3.5" />
                  Landing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onLogout();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 border-b border-slate-200/80 dark:border-[#16274B] studyx-glass px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#112246]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <StudyxLogo onClick={() => onSelectSection('dashboard')} />
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 dark:text-slate-500">Workspace</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-display font-semibold text-slate-950 dark:text-white truncate">
                {activeNav.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold text-white studyx-gradient-btn shadow-sm shadow-blue-600/25 transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add</span>
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Compact, Touch-Friendly, ≤15% Sticky Cap) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 border-t border-slate-200 dark:border-[#16274B] bg-white/95 dark:bg-[#081226]/95 backdrop-blur-md grid grid-cols-5 px-1"
      >
        {MOBILE_BOTTOM_IDS.map((id) => {
          const item = NAV_ITEMS.find((n) => n.id === id)!;
          const Icon = item.icon;
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleNavClick(id)}
              className={`flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-none whitespace-nowrap">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
