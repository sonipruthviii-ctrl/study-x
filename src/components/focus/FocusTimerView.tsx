import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { formatDurationMinutes, formatIsoTimestamp } from '../../utils/dateUtils';

type TimerPreset = 'pomodoro' | 'deep' | 'break' | 'custom';

const PRESET_MINUTES: Record<Exclude<TimerPreset, 'custom'>, number> = {
  pomodoro: 25,
  deep: 50,
  break: 5,
};

export function FocusTimerView() {
  const { courses, studySessions, getCourseById, addStudySession, deleteStudySession } = useStudy();
  const { showToast } = useToast();

  const [preset, setPreset] = useState<TimerPreset>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState(35);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [sessionTitle, setSessionTitle] = useState('Focused Study Block');

  const intervalRef = useRef<number | null>(null);

  const activeCourseId = courses.some((c) => c.id === selectedCourseId)
    ? selectedCourseId
    : courses[0]?.id || '';

  const applyDuration = (minutes: number) => {
    const secs = Math.max(1, minutes) * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setStatus('idle');
  };

  const selectPreset = (next: TimerPreset) => {
    setPreset(next);
    if (next === 'custom') {
      applyDuration(customMinutes);
    } else {
      applyDuration(PRESET_MINUTES[next]);
    }
  };

  useEffect(() => {
    if (status !== 'running') {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setStatus('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status]);

  // Automatically log focus session upon timer completion (excluding breaks)
  useEffect(() => {
    if (status === 'finished' && preset !== 'break' && activeCourseId) {
      const loggedMins = Math.max(1, Math.round(totalSeconds / 60));
      addStudySession({
        courseId: activeCourseId,
        title: sessionTitle.trim() || 'Focus Timer Session',
        durationMinutes: loggedMins,
        source: 'focus_timer',
      });
      showToast(`Completed ${loggedMins}m focus session and updated your study hours!`, 'success');
    } else if (status === 'finished' && preset === 'break') {
      showToast('Break complete — ready for your next focus block.', 'info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleStartOrResume = () => {
    if (remainingSeconds <= 0) {
      setRemainingSeconds(totalSeconds);
    }
    setStatus('running');
  };

  const handlePause = () => {
    setStatus('paused');
  };

  const handleReset = () => {
    setStatus('idle');
    setRemainingSeconds(totalSeconds);
  };

  const handleLogPartialSession = () => {
    const elapsedSeconds = totalSeconds - remainingSeconds;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    if (!activeCourseId) {
      showToast('Create a course first to link study sessions.', 'error');
      return;
    }
    addStudySession({
      courseId: activeCourseId,
      title: sessionTitle.trim() || 'Focus Timer Session',
      durationMinutes: elapsedMinutes,
      source: 'focus_timer',
    });
    setStatus('idle');
    setRemainingSeconds(totalSeconds);
    showToast(`Saved ${elapsedMinutes}m session to your study log.`, 'success');
  };

  const minutesDisplay = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const secondsDisplay = String(remainingSeconds % 60).padStart(2, '0');
  const elapsedSeconds = totalSeconds - remainingSeconds;
  const progressRatio = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  // SVG Ring Geometry
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progressRatio);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-950 dark:text-white">
          Focus Timer
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Stay in deep focus with start, pause, resume, and reset controls. Completed focus sessions
          log straight into your course study hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Focus Timer Console */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col items-center">
          {/* Preset Segmented Bar */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#081226] border border-slate-200 dark:border-[#16274B]">
            {(
              [
                { id: 'pomodoro', label: 'Focus 25m' },
                { id: 'deep', label: 'Deep 50m' },
                { id: 'break', label: 'Break 5m' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectPreset(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  preset === item.id
                    ? 'bg-white dark:bg-[#172B54] text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="mt-4 flex items-center gap-3 text-sm">
              <label htmlFor="custom-focus-mins" className="text-slate-600 dark:text-slate-300">
                Minutes:
              </label>
              <input
                id="custom-focus-mins"
                type="number"
                min={1}
                max={180}
                value={customMinutes}
                onChange={(e) => {
                  const val = Math.min(180, Math.max(1, Number(e.target.value) || 1));
                  setCustomMinutes(val);
                  applyDuration(val);
                }}
                className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-center font-mono text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Circular Progress Dial */}
          <div className="relative my-8 w-60 h-60 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
              <defs>
                <linearGradient id="focusRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <circle
                cx="120"
                cy="120"
                r={radius}
                strokeWidth="10"
                fill="none"
                className="stroke-slate-200 dark:stroke-[#14264A]"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                strokeWidth="10"
                fill="none"
                stroke="url(#focusRingGrad)"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono font-bold text-5xl tracking-tight text-slate-950 dark:text-white tabular-nums">
                {minutesDisplay}:{secondsDisplay}
              </span>
              <span className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {status === 'running'
                  ? 'Session in progress'
                  : status === 'paused'
                    ? 'Paused'
                    : status === 'finished'
                      ? 'Completed'
                      : 'Ready to focus'}
              </span>
            </div>
          </div>

          {/* Controls: Start / Pause / Resume / Reset */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {status === 'running' ? (
              <button
                type="button"
                onClick={handlePause}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartOrResume}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-md shadow-blue-600/25 transition-all"
              >
                <Play className="w-4 h-4" />
                {status === 'paused' ? 'Resume' : 'Start Focus'}
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A]"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>

            {preset !== 'break' && elapsedSeconds >= 60 && status !== 'finished' && (
              <button
                type="button"
                onClick={handleLogPartialSession}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
              >
                <Save className="w-4 h-4" />
                Save Session ({Math.max(1, Math.round(elapsedSeconds / 60))}m)
              </button>
            )}
          </div>

          {/* Course Link & Focus Intention */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#182B52] w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Linked Course
              </label>
              <select
                value={activeCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Focus Objective
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="What are you working on?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Logged Study Sessions History */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#182B52] flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
                Recent Study Sessions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {studySessions.length} total sessions recorded
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          </div>

          {studySessions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Complete a focus timer block to log your first study session.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-[#182B52] max-h-[480px] overflow-y-auto">
              {studySessions.slice(0, 12).map((session) => {
                const course = getCourseById(session.courseId);
                return (
                  <li
                    key={session.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: course?.color || '#2563EB' }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {course?.code || 'Course'} · {formatIsoTimestamp(session.startedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-sky-400 tabular-nums">
                        {formatDurationMinutes(session.durationMinutes)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          deleteStudySession(session.id);
                          showToast('Session removed from log.', 'info');
                        }}
                        aria-label={`Delete session ${session.title}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
