/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { StudyProvider, useStudy } from './context/StudyContext';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { WorkspaceShell } from './components/layout/WorkspaceShell';
import { DashboardView } from './components/dashboard/DashboardView';
import { CoursesView } from './components/courses/CoursesView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { QuizzesView } from './components/quizzes/QuizzesView';
import { CalendarView } from './components/calendar/CalendarView';
import { ExamsView } from './components/exams/ExamsView';
import { FocusTimerView } from './components/focus/FocusTimerView';
import { TimetableView } from './components/timetable/TimetableView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { QuickAddModal } from './components/modals/QuickAddModal';
import type { PublicRoute, WorkspaceSection } from './types/studyx';

function StudyxRouter() {
  const { currentUser, loginDemo, logout } = useStudy();
  const { showToast } = useToast();

  const [route, setRoute] = useState<PublicRoute>(() => (currentUser ? 'app' : 'landing'));
  const [section, setSection] = useState<WorkspaceSection>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Cross-view deep link intents
  const [selectedCourseIntent, setSelectedCourseIntent] = useState<string | null>(null);
  const [createQuizCourseIntent, setCreateQuizCourseIntent] = useState<string | null>(null);
  const [takeQuizIntent, setTakeQuizIntent] = useState<string | null>(null);

  // Protect workspace route if user signs out or session clears
  useEffect(() => {
    if (route === 'app' && !currentUser) {
      setRoute('login');
    }
  }, [route, currentUser]);

  const handleLaunchDemo = () => {
    loginDemo();
    setSection('dashboard');
    setRoute('app');
    showToast('Signed in to Alex Rivera demo workspace.', 'success');
  };

  const handleLogout = () => {
    logout();
    setRoute('landing');
    setSection('dashboard');
    showToast('Signed out of STUDYX AI.', 'info');
  };

  if (route === 'landing') {
    return (
      <LandingPage
        isAuthenticated={Boolean(currentUser)}
        onOpenWorkspace={() => setRoute('app')}
        onNavigateLogin={() => setRoute('login')}
        onNavigateRegister={() => setRoute('register')}
        onLaunchDemo={handleLaunchDemo}
      />
    );
  }

  if (route === 'login' || route === 'register') {
    return (
      <AuthPage
        mode={route}
        onSwitchMode={(next) => setRoute(next)}
        onBackToLanding={() => setRoute('landing')}
        onAuthSuccess={() => {
          setSection('dashboard');
          setRoute('app');
        }}
      />
    );
  }

  // Protected Student Workspace
  if (!currentUser) {
    return (
      <AuthPage
        mode="login"
        onSwitchMode={(next) => setRoute(next)}
        onBackToLanding={() => setRoute('landing')}
        onAuthSuccess={() => {
          setSection('dashboard');
          setRoute('app');
        }}
      />
    );
  }

  return (
    <>
      <WorkspaceShell
        activeSection={section}
        onSelectSection={(next) => {
          setSection(next);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenQuickAdd={() => setQuickAddOpen(true)}
        onBackToLanding={() => setRoute('landing')}
        onLogout={handleLogout}
      >
        {section === 'dashboard' && (
          <DashboardView
            onNavigate={(next) => setSection(next)}
            onOpenQuickAdd={() => setQuickAddOpen(true)}
            onSelectCourse={(courseId) => {
              setSelectedCourseIntent(courseId);
              setSection('courses');
            }}
          />
        )}

        {section === 'courses' && (
          <CoursesView
            initialSelectedCourseId={selectedCourseIntent}
            onClearInitialSelection={() => setSelectedCourseIntent(null)}
            onCreateQuizForCourse={(courseId) => {
              setCreateQuizCourseIntent(courseId);
              setSection('quizzes');
            }}
            onOpenQuizInModule={(quizId) => {
              setTakeQuizIntent(quizId);
              setSection('quizzes');
            }}
          />
        )}

        {section === 'assignments' && <AssignmentsView />}

        {section === 'quizzes' && (
          <QuizzesView
            initialCreateCourseId={createQuizCourseIntent}
            initialTakeQuizId={takeQuizIntent}
            onConsumeInitialIntent={() => {
              setCreateQuizCourseIntent(null);
              setTakeQuizIntent(null);
            }}
          />
        )}

        {section === 'calendar' && <CalendarView onOpenQuickAdd={() => setQuickAddOpen(true)} />}

        {section === 'exams' && <ExamsView />}

        {section === 'focus' && <FocusTimerView />}

        {section === 'timetable' && <TimetableView />}

        {section === 'analytics' && <AnalyticsView />}
      </WorkspaceShell>

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <StudyProvider>
          <StudyxRouter />
        </StudyProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
