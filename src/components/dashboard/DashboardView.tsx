import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock,
  FileCheck2,
  Plus,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStudy } from '../../context/StudyContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import type { WorkspaceSection } from '../../types/studyx';
import {
  DAY_NAMES_FULL,
  DAY_NAMES_SHORT,
  formatCountdownLabel,
  formatDurationMinutes,
  formatFriendlyDate,
  formatHoursDecimal,
  formatIsoTimestamp,
  getDateStringOffset,
  getGreetingByHour,
  getTodayDateString,
} from '../../utils/dateUtils';

interface DashboardViewProps {
  onNavigate: (section: WorkspaceSection) => void;
  onOpenQuickAdd: () => void;
  onSelectCourse: (courseId: string) => void;
}

export function DashboardView({
  onNavigate,
  onOpenQuickAdd,
  onSelectCourse,
}: DashboardViewProps) {
  const {
    currentProfile,
    courses,
    assignments,
    exams,
    quizAttempts,
    quizzes,
    studySessions,
    timetableBlocks,
    getCourseById,
    getCourseProgress,
    toggleAssignment,
  } = useStudy();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const todayStr = getTodayDateString();
  const todayDow = new Date().getDay();

  // KPI metrics
  const totalStudyMinutes = useMemo(
    () => studySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
    [studySessions]
  );

  const completedTasksCount = useMemo(
    () => assignments.filter((a) => a.completed).length,
    [assignments]
  );

  const taskCompletionPct =
    assignments.length > 0 ? Math.round((completedTasksCount / assignments.length) * 100) : 0;

  const upcomingExams = useMemo(
    () =>
      exams
        .filter((e) => e.status === 'upcoming')
        .sort((a, b) => a.examDate.localeCompare(b.examDate)),
    [exams]
  );

  const avgQuizScore = useMemo(() => {
    if (quizAttempts.length === 0) return null;
    const sum = quizAttempts.reduce((acc, a) => acc + a.percentage, 0);
    return Math.round(sum / quizAttempts.length);
  }, [quizAttempts]);

  // Today's timetable blocks
  const todaysSchedule = useMemo(
    () =>
      timetableBlocks
        .filter((b) => b.dayOfWeek === todayDow)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [timetableBlocks, todayDow]
  );

  // Today's tasks (due today or top pending tasks so list is always immediately actionable)
  const todaysTasks = useMemo(() => {
    const dueToday = assignments.filter((a) => a.dueDate === todayStr);
    if (dueToday.length >= 3) {
      return dueToday.sort((a, b) => Number(a.completed) - Number(b.completed));
    }
    const others = assignments
      .filter((a) => a.dueDate !== todayStr)
      .sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        return a.dueDate.localeCompare(b.dueDate);
      });
    return [...dueToday, ...others].slice(0, 6);
  }, [assignments, todayStr]);

  // Upcoming pending assignments (next 7+ days)
  const upcomingAssignments = useMemo(
    () =>
      assignments
        .filter((a) => !a.completed)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4),
    [assignments]
  );

  // Weekly study hours chart (past 7 days including today)
  const weeklyChartData = useMemo(() => {
    const days = [];
    for (let offset = -6; offset <= 0; offset += 1) {
      const dateStr = getDateStringOffset(offset);
      const dateObj = new Date(`${dateStr}T12:00:00`);
      const mins = studySessions
        .filter((s) => s.startedAt.slice(0, 10) === dateStr)
        .reduce((acc, s) => acc + s.durationMinutes, 0);
      days.push({
        day: offset === 0 ? 'Today' : DAY_NAMES_SHORT[dateObj.getDay()],
        hours: Number((mins / 60).toFixed(2)),
        minutes: mins,
      });
    }
    return days;
  }, [studySessions]);

  // Combined recent activity feed
  const recentActivity = useMemo(() => {
    const items: Array<{
      id: string;
      timestamp: string;
      title: string;
      meta: string;
      kind: 'session' | 'quiz' | 'task';
      courseColor?: string;
    }> = [];

    studySessions.slice(0, 5).forEach((s) => {
      const course = getCourseById(s.courseId);
      items.push({
        id: `act_${s.id}`,
        timestamp: s.startedAt,
        title: s.title,
        meta: `${course?.code || 'Course'} · ${formatDurationMinutes(s.durationMinutes)} ${
          s.source === 'focus_timer' ? 'Focus Timer' : 'Logged Session'
        }`,
        kind: 'session',
        courseColor: course?.color,
      });
    });

    quizAttempts.slice(0, 4).forEach((att) => {
      const quiz = quizzes.find((q) => q.id === att.quizId);
      const course = getCourseById(att.courseId);
      items.push({
        id: `act_${att.id}`,
        timestamp: att.completedAt,
        title: `Quiz: ${quiz?.title || 'Course Quiz'}`,
        meta: `${course?.code || 'Course'} · Scored ${att.score}/${att.totalQuestions} (${att.percentage}%)`,
        kind: 'quiz',
        courseColor: course?.color,
      });
    });

    assignments
      .filter((a) => a.completed && a.completedAt)
      .slice(0, 4)
      .forEach((a) => {
        const course = getCourseById(a.courseId);
        items.push({
          id: `act_${a.id}`,
          timestamp: a.completedAt!,
          title: `Completed: ${a.title}`,
          meta: `${course?.code || 'Course'} · Assignment`,
          kind: 'task',
          courseColor: course?.color,
        });
      });

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [studySessions, quizAttempts, quizzes, assignments, getCourseById]);

  const handleToggleTask = (id: string, wasCompleted: boolean) => {
    toggleAssignment(id);
    showToast(
      wasCompleted ? 'Task reopened and progress updated.' : 'Task completed! Progress updated.',
      wasCompleted ? 'info' : 'success'
    );
  };

  const firstName = currentProfile?.fullName?.split(' ')[0] || 'Student';
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-sky-400">
            {DAY_NAMES_FULL[todayDow]} ·{' '}
            {new Date().toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <h1 className="mt-1 font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-950 dark:text-white">
            {getGreetingByHour()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {currentProfile?.major || 'Student Workspace'}
            {currentProfile?.academicYear ? ` · ${currentProfile.academicYear}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('focus')}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0D1A35] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A] transition-colors whitespace-nowrap"
          >
            Start Focus Timer
          </button>
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-sm shadow-blue-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Total Study Hours</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          </div>
          <p className="mt-3 font-mono font-semibold text-3xl text-slate-950 dark:text-white tabular-nums">
            {formatHoursDecimal(totalStudyMinutes)}h
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {studySessions.length} logged sessions across {courses.length} courses
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Task Completion</span>
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-3 font-mono font-semibold text-3xl text-slate-950 dark:text-white tabular-nums">
            {taskCompletionPct}%
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {completedTasksCount} of {assignments.length} assignments completed
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Upcoming Exams</span>
            <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-3 font-mono font-semibold text-3xl text-slate-950 dark:text-white tabular-nums">
            {upcomingExams.length}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            {upcomingExams[0]
              ? `Next: ${formatCountdownLabel(upcomingExams[0].examDate).label} (${
                  getCourseById(upcomingExams[0].courseId)?.code || 'Exam'
                })`
              : 'No upcoming exams scheduled'}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Average Quiz Score</span>
            <ClipboardCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="mt-3 font-mono font-semibold text-3xl text-slate-950 dark:text-white tabular-nums">
            {avgQuizScore !== null ? `${avgQuizScore}%` : '—'}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {quizAttempts.length} attempt{quizAttempts.length === 1 ? '' : 's'} across{' '}
            {quizzes.length} quizzes
          </p>
        </div>
      </div>

      {/* Main Bento Grid: Today's Tasks + Study Hours Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Tasks with Live Checkboxes */}
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#182B52] flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
                Today's Tasks
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check off completed tasks to update course & dashboard stats immediately
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assignments')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
            >
              All tasks <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todaysTasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No tasks scheduled yet
              </p>
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold text-white studyx-gradient-btn"
              >
                Add First Task
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200/80 dark:divide-[#182B52]">
              {todaysTasks.map((task) => {
                const course = getCourseById(task.courseId);
                return (
                  <li
                    key={task.id}
                    className="px-5 py-3.5 flex items-start gap-3.5 hover:bg-slate-50/70 dark:hover:bg-[#102042]/60 transition-colors"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.completed}
                      aria-label={`Mark "${task.title}" as ${
                        task.completed ? 'incomplete' : 'completed'
                      }`}
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        task.completed
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-[#34548C] bg-white dark:bg-[#081226] hover:border-blue-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium leading-snug transition-colors ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {course && (
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: course.color }}
                            />
                            {course.code}
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatFriendlyDate(task.dueDate)} {task.dueTime}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            task.priority === 'high'
                              ? 'text-rose-600 dark:text-rose-400 font-medium'
                              : task.priority === 'medium'
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-slate-500 dark:text-slate-400'
                          }
                        >
                          {task.priority === 'high'
                            ? 'High priority'
                            : task.priority === 'medium'
                              ? 'Medium priority'
                              : 'Low priority'}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Weekly Study Hours Chart */}
        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#182B52] flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
                Study Hours (Last 7 Days)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily goal: {currentProfile?.dailyGoalHours || 4}h
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline whitespace-nowrap"
            >
              Analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height={235}>
              <BarChart data={weeklyChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="studyBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#182B52' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  unit="h"
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.06)' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#0B1730' : '#FFFFFF',
                    borderColor: isDark ? '#1E3562' : '#E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                  }}
                  formatter={(value: unknown) => [`${value} hours`, 'Studied']}
                />
                <Bar dataKey="hours" fill="url(#studyBarGradient)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Second Row: Today's Study Schedule + Upcoming Assignments & Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Study Schedule */}
        <section className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#182B52] flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
                Today's Study Schedule
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {DAY_NAMES_FULL[todayDow]} timetable blocks
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('timetable')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline whitespace-nowrap"
            >
              Edit Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todaysSchedule.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarDays className="w-7 h-7 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No blocks scheduled for {DAY_NAMES_FULL[todayDow]}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="mt-3 text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline"
              >
                Open Smart Timetable
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/80 dark:divide-[#182B52]">
              {todaysSchedule.map((block) => {
                const course = getCourseById(block.courseId);
                return (
                  <div key={block.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: course?.color || '#2563EB' }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {block.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {course ? `${course.code} · ${course.name}` : 'General Study'} ·{' '}
                          <span className="capitalize">{block.type}</span>
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap shrink-0">
                      {block.startTime} – {block.endTime}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Assignments & Exams */}
        <section className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#182B52] flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
                Upcoming Exams & Deadlines
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prioritized chronologically across active courses
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline whitespace-nowrap"
            >
              Manage Exams <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-200/80 dark:divide-[#182B52]">
            {upcomingExams.slice(0, 3).map((exam) => {
              const course = getCourseById(exam.courseId);
              const countdown = formatCountdownLabel(exam.examDate);
              return (
                <div key={exam.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {exam.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Exam · {course?.code || 'Course'} · {exam.location} · {exam.weightPercent}% weight
                    </p>
                  </div>
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                      countdown.tone === 'soon'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-600 dark:text-sky-400'
                    }`}
                  >
                    {countdown.label}
                  </span>
                </div>
              );
            })}

            {upcomingAssignments.slice(0, 2).map((task) => {
              const course = getCourseById(task.courseId);
              const countdown = formatCountdownLabel(task.dueDate);
              return (
                <div key={task.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Assignment · {course?.code || 'Course'} · Due {formatFriendlyDate(task.dueDate)}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap shrink-0">
                    {countdown.label}
                  </span>
                </div>
              );
            })}

            {upcomingExams.length === 0 && upcomingAssignments.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                All caught up! No pending deadlines or upcoming exams.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Third Row: Course Progress Overview + Recent Study Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#182B52] flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
              Course Progress
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('courses')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline"
            >
              View Courses <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-200/80 dark:divide-[#182B52]">
            {courses.map((course) => {
              const stats = getCourseProgress(course.id);
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => onSelectCourse(course.id)}
                  className="w-full text-left px-6 py-4 hover:bg-slate-50/70 dark:hover:bg-[#102042]/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {course.code} — {course.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums shrink-0">
                      {stats.taskCompletionPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#14264A] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${stats.taskCompletionPercent}%`,
                        backgroundColor: course.color,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>
                      {stats.completedTasks}/{stats.totalTasks} tasks done
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDurationMinutes(stats.studyMinutes)} studied</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {stats.averageQuizScore !== null
                        ? `Quiz avg ${stats.averageQuizScore}%`
                        : `${stats.quizCount} quiz${stats.quizCount === 1 ? '' : 'zes'}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#182B52]">
            <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
              Recent Study Activity
            </h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Complete a task, quiz, or focus timer session to see recent activity here.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200/80 dark:divide-[#182B52]">
              {recentActivity.map((item) => (
                <li key={item.id} className="px-6 py-3.5 flex items-start gap-3">
                  <span
                    className="w-2 h-2 rounded-full mt-2 shrink-0"
                    style={{ backgroundColor: item.courseColor || '#2563EB' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.meta}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                    {formatIsoTimestamp(item.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
