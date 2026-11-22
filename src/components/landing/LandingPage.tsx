import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Inbox,
  Layers,
  Mail,
  Menu,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { StudyxLogo } from '../common/StudyxLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { HERO_IMAGE_PATH } from '../../data/seedData';
import { formatIsoTimestamp } from '../../utils/dateUtils';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onLaunchDemo: () => void;
  isAuthenticated: boolean;
  onOpenWorkspace: () => void;
}

export function LandingPage({
  onNavigateLogin,
  onNavigateRegister,
  onLaunchDemo,
  isAuthenticated,
  onOpenWorkspace,
}: LandingPageProps) {
  const { contactMessages, submitContactMessage, markContactMessageRead, deleteContactMessage } =
    useStudy();
  const { showToast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  // Contact form + Admin Inbox state
  const [contactTab, setContactTab] = useState<'form' | 'inbox'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const unreadCount = contactMessages.filter((m) => !m.read).length;

  const validateContact = (): boolean => {
    const errors: Record<string, string> = {};
    if (name.trim().length < 2) {
      errors.name = 'Please enter your full name (at least 2 characters).';
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (message.trim().length < 10) {
      errors.message = 'Please write a message of at least 10 characters.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedNotice(false);
    if (!validateContact()) return;

    submitContactMessage({ name, email, subject, message });
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setFormErrors({});
    setSubmittedNotice(true);
    showToast('Message saved to the local prototype Admin Inbox.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060D1F] text-slate-900 dark:text-slate-100">
      {/* Top Navigation Bar — 3-Zone Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-[#16274B] studyx-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <StudyxLogo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#features"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              How it works
            </a>
            <a
              href="#about"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
            <a
              href="#contact"
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              Contact
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <ThemeToggle />
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg studyx-gradient-btn shadow-sm shadow-blue-600/25 transition-all whitespace-nowrap shrink-0"
              >
                Open Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg studyx-gradient-btn shadow-sm shadow-blue-600/25 transition-all whitespace-nowrap shrink-0"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#1E3562] text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-[#16274B] bg-white dark:bg-[#09132A] px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-1">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How it works', href: '#how-it-works' },
                { label: 'About', href: '#about' },
                { label: 'Contact', href: '#contact' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#112246]"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-[#16274B] flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenWorkspace();
                  }}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white rounded-lg studyx-gradient-btn"
                >
                  Open Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateLogin();
                    }}
                    className="w-full py-2.5 px-4 text-sm font-medium rounded-lg border border-slate-200 dark:border-[#1E3562] text-slate-800 dark:text-slate-100"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateRegister();
                    }}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white rounded-lg studyx-gradient-btn"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative studyx-hero-mesh border-b border-slate-200/70 dark:border-[#142547]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-blue-600 dark:text-sky-400 mb-4">
                Student Productivity Workspace · Courses, Quizzes & Smart Scheduling
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-950 dark:text-white leading-[1.08] text-balance"
                style={{ fontSize: 'clamp(2.35rem, 4.4vw, 3.85rem)' }}
              >
                Make space for what's next.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Bring your courses, assignment checklists, exam countdowns, course-linked quizzes,
                focus timer, and smart weekly timetable into one calm workspace built for deep
                academic focus.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={isAuthenticated ? onOpenWorkspace : onNavigateRegister}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-lg shadow-blue-600/25 transition-all whitespace-nowrap shrink-0"
                >
                  {isAuthenticated ? 'Continue to Dashboard' : 'Get Started Free'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onLaunchDemo}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-slate-300 dark:border-[#233B6E] bg-white/80 dark:bg-[#0D1A35]/80 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#13254A] transition-colors whitespace-nowrap shrink-0"
                >
                  Launch Demo Student Account
                </button>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                <span>Course-linked MCQ quizzes</span>
                <span aria-hidden="true">·</span>
                <span>Live task completion sync</span>
                <span aria-hidden="true">·</span>
                <span>Optional AI quiz & timetable builder</span>
              </div>
            </div>

            <div className="lg:col-span-6 flex">
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1E3562] bg-[#0B1733] min-h-[280px] sm:min-h-[360px] lg:h-full shadow-2xl shadow-blue-950/20">
                {!heroImageError ? (
                  <img
                    src={HERO_IMAGE_PATH}
                    alt="Minimalist university study desk with laptop and ambient twilight blue lighting"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-10 bg-gradient-to-br from-[#0B1733] via-[#10244D] to-[#1D4ED8]/40 text-center">
                    <GraduationCap className="w-12 h-12 text-sky-400 mb-3" />
                    <p className="font-display font-semibold text-white text-lg">
                      STUDYX AI Workspace
                    </p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#060D1F]/95 via-[#060D1F]/65 to-transparent p-6">
                  <p className="text-xs font-medium text-sky-300 mb-1">
                    Unified Academic Workflow
                  </p>
                  <p className="text-sm sm:text-base font-medium text-white leading-snug max-w-md">
                    Every checked task, focus timer block, and quiz score updates your course
                    progress automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Quantitative Strip below Hero Split */}
          <div className="mt-12 pt-10 border-t border-slate-200/80 dark:border-[#16274B] grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: '9 Modules', label: 'Connected under every course profile' },
              { value: '4-Option', label: 'Interactive MCQ quizzes with instant review' },
              { value: '25 / 50m', label: 'Focus timer logging directly to study hours' },
              { value: '7-Day', label: 'Smart timetable balancing exams & tasks' },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-display font-bold text-2xl sm:text-3xl text-slate-950 dark:text-white tabular-nums">
                  {item.value}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-snug">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section — Asymmetric Bento Hierarchy */}
      <section id="features" className="py-18 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-medium text-blue-600 dark:text-sky-400 mb-2">Features</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-slate-950 dark:text-white text-balance">
              Everything required to stay ahead of every syllabus
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
              Built around a relational course model so your assignments, exams, quizzes, focus
              sessions, and analytics always stay synchronized.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Marquee Card 1 */}
            <div className="lg:col-span-7 p-7 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-sky-400 flex items-center justify-center mb-5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-xl text-slate-950 dark:text-white">
                  Course-Linked Quiz Studio & AI Generator
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Create custom 4-option multiple-choice quizzes linked directly to any course, or
                  draft questions from your lecture topic using Gemini AI. Take interactive quizzes,
                  review correct and incorrect choices immediately, and track attempt history per
                  subject.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-[#182B52] flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Editable MCQ options</span>
                <span aria-hidden="true">·</span>
                <span>Answer explanations</span>
                <span aria-hidden="true">·</span>
                <span>Historical score tracking</span>
              </div>
            </div>

            {/* Secondary Card 2 */}
            <div className="lg:col-span-5 p-7 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-xl text-slate-950 dark:text-white">
                  Live Assignment Checklists
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Organize tasks by deadline, priority, and course. Checking or unchecking any item
                  instantly updates course progress bars, dashboard completion counts, and analytics.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-[#182B52] text-xs text-slate-500 dark:text-slate-400">
                Persisted automatically in your local workspace store
              </div>
            </div>

            {/* Secondary Card 3 */}
            <div className="lg:col-span-5 p-7 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-xl text-slate-950 dark:text-white">
                  Focus Timer & Study Analytics
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Run Pomodoro or custom deep-work intervals tied to a specific course. Completed
                  sessions flow straight into your total study hours and weekly distribution charts.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-[#182B52] text-xs text-slate-500 dark:text-slate-400">
                Start, pause, resume, reset, and save sessions anytime
              </div>
            </div>

            {/* Marquee Card 4 */}
            <div className="lg:col-span-7 p-7 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-sky-400 flex items-center justify-center mb-5">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-xl text-slate-950 dark:text-white">
                  Smart Weekly Timetable, Calendar & Exam Countdowns
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  View every assignment deadline, upcoming exam, and logged session on one
                  interactive monthly calendar. Build your weekly study timetable manually or let
                  Gemini propose a balanced schedule weighted toward upcoming midterms.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-[#182B52] flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Monthly agenda calendar</span>
                <span aria-hidden="true">·</span>
                <span>Exam readiness tracking</span>
                <span aria-hidden="true">·</span>
                <span>One-click AI weekly scheduling</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-18 lg:py-24 border-y border-slate-200/80 dark:border-[#142547] bg-white/60 dark:bg-[#09132A]/70"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-medium text-blue-600 dark:text-sky-400 mb-2">How it works</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-slate-950 dark:text-white text-balance">
              Four steps from scattered syllabi to steady momentum
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: '01.',
                title: 'Add your active courses',
                body: 'Create color-coded spaces for each class with descriptions and weekly hour targets.',
              },
              {
                num: '02.',
                title: 'Map tasks & exam dates',
                body: 'Capture assignments, priorities, and exam dates so deadlines surface automatically on your dashboard and calendar.',
              },
              {
                num: '03.',
                title: 'Focus & self-test',
                body: 'Run course-linked focus timer sessions and build or AI-generate practice quizzes to verify comprehension.',
              },
              {
                num: '04.',
                title: 'Review progress weekly',
                body: 'Track study hours, quiz accuracy trends, and per-course completion rates in one analytics view.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="pt-6 border-t border-slate-300/80 dark:border-[#1E3562]"
              >
                <p className="font-mono text-sm font-semibold text-blue-600 dark:text-sky-400 mb-3 tabular-nums">
                  {step.num}
                </p>
                <h3 className="font-display font-semibold text-lg text-slate-950 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-18 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <p className="text-sm font-medium text-blue-600 dark:text-sky-400 mb-2">About STUDYX AI</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-slate-950 dark:text-white text-balance">
                Designed for clarity during exam season
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-5 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Students routinely juggle four to six disconnected apps—a calendar, a task list, a
                flashcard tool, a Pomodoro timer, and a spreadsheet for exam dates. STUDYX AI brings
                every study workflow into a single relational architecture where courses serve as the
                backbone.
              </p>
              <p>
                This interactive prototype faithfully mirrors the relational schema of our Flask,
                SQLAlchemy, and SQLite design—modeling users, student profiles, courses, assignments,
                exams, quizzes, quiz questions, quiz attempts, study sessions, and timetables right
                in your browser with optional live AI generation for practice quizzes and weekly
                schedules.
              </p>
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-5 rounded-xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
                  <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-semibold text-sm mb-1.5">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                    Relational Local Prototype
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    All records persist cleanly in browser localStorage with full multi-account
                    isolation and cascading course links.
                  </p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
                  <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-semibold text-sm mb-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                    Responsive Everywhere
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Full desktop sidebar workspace and touch-friendly mobile drawer with bottom
                    navigation and dark/light themes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section + Prototype Admin Inbox */}
      <section
        id="contact"
        className="py-18 lg:py-24 border-t border-slate-200/80 dark:border-[#142547] bg-white/60 dark:bg-[#09132A]/70"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-blue-600 dark:text-sky-400 mb-2">Contact</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-slate-950 dark:text-white">
                Questions, feedback, or pilot requests
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Submit an inquiry below or switch to the Admin Inbox to verify how messages are
                captured and managed in this prototype.
              </p>
            </div>

            {/* Segmented Control */}
            <div className="inline-flex items-center p-1 rounded-xl border border-slate-200 dark:border-[#1E3562] bg-slate-100/80 dark:bg-[#0D1A35] self-start">
              <button
                type="button"
                onClick={() => setContactTab('form')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  contactTab === 'form'
                    ? 'bg-white dark:bg-[#172B54] text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4" />
                Contact Form
              </button>
              <button
                type="button"
                onClick={() => setContactTab('inbox')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  contactTab === 'inbox'
                    ? 'bg-white dark:bg-[#172B54] text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Inbox className="w-4 h-4" />
                Admin Inbox ({contactMessages.length})
              </button>
            </div>
          </div>

          {contactTab === 'form' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
                <form onSubmit={handleContactSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                      >
                        Full Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jordan Taylor"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      {formErrors.name && (
                        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                      >
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jordan@university.edu"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      {formErrors.email && (
                        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                    >
                      Subject <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Feature question or campus inquiry"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us how you're using STUDYX AI or what you'd like to see next..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y"
                    />
                    {formErrors.message && (
                      <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                        {formErrors.message}
                      </p>
                    )}
                  </div>

                  {submittedNotice && (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          Your message was stored locally in the prototype Admin Inbox. No real
                          external email was dispatched.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContactTab('inbox')}
                        className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap shrink-0"
                      >
                        View in Admin Inbox
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-md shadow-blue-600/20 transition-all whitespace-nowrap shrink-0"
                    >
                      Save Message to Inbox
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {unreadCount} unread in Admin Inbox
                    </p>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-slate-950 dark:text-white font-display font-semibold text-lg mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                    Prototype Delivery Notice
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    This prototype intentionally does not pretend to send real SMTP emails. Every
                    form submission is validated and stored directly in your browser's local
                    relational store so reviewers can immediately inspect incoming entries in the{' '}
                    <button
                      type="button"
                      onClick={() => setContactTab('inbox')}
                      className="text-blue-600 dark:text-sky-400 font-medium hover:underline"
                    >
                      Admin Inbox
                    </button>
                    .
                  </p>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    When connected to a production backend or transactional email API (such as
                    Postmark, Resend, or SendGrid), this form routes straight to your live support
                    address.
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-200 dark:border-[#182B52] space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      Demo Student Email:
                    </span>{' '}
                    <span className="font-mono text-xs">alex.rivera@studyx.edu</span>
                  </p>
                  <p>
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      Storage Engine:
                    </span>{' '}
                    Browser localStorage (relational prototype)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-[#182B52] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-base text-slate-950 dark:text-white">
                    Prototype Admin Inbox
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Locally stored submissions from the Contact Form · {unreadCount} unread
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContactTab('form')}
                  className="text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline"
                >
                  Submit new test message
                </button>
              </div>

              {contactMessages.length === 0 ? (
                <div className="p-10 text-center">
                  <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No messages in the Admin Inbox yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Submit the contact form to verify local message storage.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-[#182B52]">
                  {contactMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-5 sm:px-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                        !msg.read ? 'bg-blue-50/50 dark:bg-blue-950/25' : ''
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            {msg.name}
                          </span>
                          <span className="font-mono">{msg.email}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatIsoTimestamp(msg.createdAt)}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              msg.read
                                ? 'text-slate-500 dark:text-slate-400'
                                : 'font-semibold text-blue-600 dark:text-sky-400'
                            }
                          >
                            {msg.read ? 'Read' : 'Unread'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {msg.subject}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {msg.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => markContactMessageRead(msg.id, !msg.read)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A] transition-colors whitespace-nowrap"
                        >
                          {msg.read ? 'Mark Unread' : 'Mark Read'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteContactMessage(msg.id);
                            showToast('Message removed from Admin Inbox.', 'info');
                          }}
                          aria-label={`Delete message from ${msg.name}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-[#142547] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <StudyxLogo />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Make space for what's next. Student productivity prototype.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-sky-400">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-sky-400">
              How it works
            </a>
            <a href="#about" className="hover:text-blue-600 dark:hover:text-sky-400">
              About
            </a>
            <a href="#contact" className="hover:text-blue-600 dark:hover:text-sky-400">
              Contact
            </a>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="hover:text-blue-600 dark:hover:text-sky-400"
            >
              Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
