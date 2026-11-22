import React, { useState } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Info, Lock, UserCheck } from 'lucide-react';
import { StudyxLogo } from '../common/StudyxLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD, useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';

interface AuthPageProps {
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
  onBackToLanding: () => void;
  onAuthSuccess: () => void;
}

export function AuthPage({
  mode,
  onSwitchMode,
  onBackToLanding,
  onAuthSuccess,
}: AuthPageProps) {
  const { login, loginDemo, register } = useStudy();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [academicYear, setAcademicYear] = useState('Sophomore');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'login') {
      if (password.length < 6) {
        setError('Please enter your password.');
        return;
      }
      const res = login(email, password);
      if (!res.ok) {
        setError(res.error || 'Unable to sign in.');
        return;
      }
      showToast('Welcome back to STUDYX AI.', 'success');
      onAuthSuccess();
      return;
    }

    // Registration validation
    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError('Password must be at least 8 characters and include both letters and numbers.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    const res = register({
      fullName,
      email,
      password,
      major,
      academicYear,
    });
    if (!res.ok) {
      setError(res.error || 'Could not create account.');
      return;
    }
    showToast('Prototype student account created!', 'success');
    onAuthSuccess();
  };

  const handleDemoSignIn = () => {
    loginDemo();
    showToast('Signed in as Alex Rivera (Demo Student).', 'success');
    onAuthSuccess();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060D1F] studyx-hero-mesh flex flex-col">
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <StudyxLogo onClick={onBackToLanding} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-5">
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#1E3562] studyx-glass shadow-xl shadow-blue-950/10">
            <div className="mb-6">
              <h1 className="font-display font-bold text-2xl text-slate-950 dark:text-white tracking-tight">
                {mode === 'login' ? 'Sign in to STUDYX AI' : 'Create your student account'}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {mode === 'login'
                  ? 'Access your courses, tasks, quizzes, and study analytics.'
                  : 'Set up your personal academic workspace in seconds.'}
              </p>
            </div>

            {mode === 'login' && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  className="w-full py-2.5 px-4 rounded-xl border border-blue-500/40 bg-blue-600/10 dark:bg-blue-500/15 hover:bg-blue-600/15 dark:hover:bg-blue-500/25 text-blue-700 dark:text-sky-300 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  One-Click Demo Student Sign-In
                </button>
                <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {DEMO_USER_EMAIL} / {DEMO_USER_PASSWORD}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-fullname"
                      className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="auth-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="auth-major"
                        className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                      >
                        Major / Track
                      </label>
                      <input
                        id="auth-major"
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="Computer Science"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="auth-year"
                        className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                      >
                        Academic Level
                      </label>
                      <select
                        id="auth-year"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="High School">High School</option>
                        <option value="Freshman">Freshman</option>
                        <option value="Sophomore">Sophomore</option>
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                        <option value="Graduate">Graduate</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                >
                  Student Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div className="space-y-1.5 text-xs">
                    <p
                      className={`flex items-center gap-1.5 ${
                        hasMinLength
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> At least 8 characters
                    </p>
                    <p
                      className={`flex items-center gap-1.5 ${
                        hasLetter && hasNumber
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Contains at least one letter and one number
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-confirm-password"
                      className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4" />
                {mode === 'login' ? 'Sign In' : 'Create Prototype Account'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#182B52] text-center text-sm text-slate-600 dark:text-slate-400">
              {mode === 'login' ? (
                <>
                  New to STUDYX AI?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      onSwitchMode('register');
                    }}
                    className="font-semibold text-blue-600 dark:text-sky-400 hover:underline"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      onSwitchMode('login');
                    }}
                    className="font-semibold text-blue-600 dark:text-sky-400 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Transparent Prototype vs Real Auth Distinction */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1B315E] bg-white/75 dark:bg-[#0A162F]/80 text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                Prototype Authentication Mode:
              </span>{' '}
              Credentials and sessions are stored locally in your browser's{' '}
              <span className="font-mono">localStorage</span> to demonstrate registration, route
              protection, and multi-user isolation. Production deployments replace this with
              server-side salted hashing (Argon2/bcrypt) and secure HttpOnly session cookies.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
