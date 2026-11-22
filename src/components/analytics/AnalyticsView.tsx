import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStudy } from '../../context/StudyContext';
import { useTheme } from '../../context/ThemeContext';
import {
  DAY_NAMES_SHORT,
  formatDurationMinutes,
  formatHoursDecimal,
  getDateStringOffset,
} from '../../utils/dateUtils';

export function AnalyticsView() {
  const {
    courses,
    assignments,
    quizAttempts,
    quizzes,
    studySessions,
    getCourseProgress,
  } = useStudy();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const totalMinutes = useMemo(
    () => studySessions.reduce((acc, s) => acc + s.durationMinutes, 0),
    [studySessions]
  );

  const completedTasks = assignments.filter((a) => a.completed).length;
  const completionRate =
    assignments.length > 0 ? Math.round((completedTasks / assignments.length) * 100) : 0;

  const avgQuizScore = useMemo(() => {
    if (quizAttempts.length === 0) return null;
    return Math.round(
      quizAttempts.reduce((acc, a) => acc + a.percentage, 0) / quizAttempts.length
    );
  }, [quizAttempts]);

  // 7-day trend
  const dailyTrend = useMemo(() => {
    const out = [];
    for (let offset = -6; offset <= 0; offset += 1) {
      const dateStr = getDateStringOffset(offset);
      const dt = new Date(`${dateStr}T12:00:00`);
      const mins = studySessions
        .filter((s) => s.startedAt.slice(0, 10) === dateStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      out.push({
        label: offset === 0 ? 'Today' : DAY_NAMES_SHORT[dt.getDay()],
        hours: Number((mins / 60).toFixed(2)),
      });
    }
    return out;
  }, [studySessions]);

  // Study hours by course
  const courseStudyData = useMemo(() => {
    return courses.map((course) => {
      const progress = getCourseProgress(course.id);
      return {
        code: course.code,
        name: course.name,
        hours: Number((progress.studyMinutes / 60).toFixed(2)),
        target: course.targetHoursPerWeek,
        color: course.color,
        completion: progress.taskCompletionPercent,
        avgQuiz: progress.averageQuizScore,
        attempts: progress.attemptCount,
        completedTasks: progress.completedTasks,
        totalTasks: progress.totalTasks,
        studyMinutes: progress.studyMinutes,
      };
    });
  }, [courses, getCourseProgress]);

  // Chronological quiz attempt trend
  const quizTrendData = useMemo(() => {
    return [...quizAttempts]
      .reverse()
      .map((att, idx) => {
        const quiz = quizzes.find((q) => q.id === att.quizId);
        return {
          attempt: `#${idx + 1}`,
          title: quiz?.title || 'Quiz',
          score: att.percentage,
        };
      });
  }, [quizAttempts, quizzes]);

  const tooltipStyle = {
    backgroundColor: isDark ? '#0B1730' : '#FFFFFF',
    borderColor: isDark ? '#1E3562' : '#E2E8F0',
    borderRadius: '12px',
    fontSize: '12px',
    color: isDark ? '#F1F5F9' : '#0F172A',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-950 dark:text-white">
          Study Progress & Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Live metrics computed from your completed assignments, focus sessions, and course quiz
          attempts.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Study Time</p>
          <p className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-slate-950 dark:text-white tabular-nums">
            {formatHoursDecimal(totalMinutes)}h
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {studySessions.length} sessions
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Task Completion</p>
          <p className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-slate-950 dark:text-white tabular-nums">
            {completionRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {completedTasks} / {assignments.length} done
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Quiz Accuracy</p>
          <p className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-slate-950 dark:text-white tabular-nums">
            {avgQuizScore !== null ? `${avgQuizScore}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {quizAttempts.length} graded attempts
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Courses</p>
          <p className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-slate-950 dark:text-white tabular-nums">
            {courses.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {quizzes.length} linked quizzes
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Study Hours Area Chart */}
        <section className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
            Daily Study Volume (Past 7 Days)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-5">
            Hours logged across Focus Timer and manual study sessions
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaElectric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#182B52' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="label"
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
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [`${v} hrs`, 'Studied']}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  fill="url(#areaElectric)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Study Hours by Course */}
        <section className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
            Study Hours by Course
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-5">
            Distribution of logged study time per subject
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseStudyData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#182B52' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="code"
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
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [`${v} hrs`, 'Logged']}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {courseStudyData.map((entry) => (
                    <Cell key={entry.code} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Quiz Performance Trend + Course Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
            Quiz Score Progression
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-5">
            Chronological accuracy across all submitted quiz attempts
          </p>
          {quizTrendData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              Complete a course quiz to visualize score trends.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizTrendData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? '#182B52' : '#E2E8F0'}
                  />
                  <XAxis
                    dataKey="attempt"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: unknown) => [`${v}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#38BDF8', strokeWidth: 2, stroke: '#2563EB' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#182B52]">
            <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
              Course Performance Matrix
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#182B52] text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Course</th>
                  <th className="py-3 px-4 text-right">Tasks</th>
                  <th className="py-3 px-4 text-right">Study Time</th>
                  <th className="py-3 px-5 text-right">Quiz Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-[#182B52] text-sm">
                {courseStudyData.map((row) => (
                  <tr
                    key={row.code}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#102042]/50 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {row.code}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {row.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-200 tabular-nums whitespace-nowrap">
                      {row.completedTasks}/{row.totalTasks} ({row.completion}%)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-200 tabular-nums whitespace-nowrap">
                      {formatDurationMinutes(row.studyMinutes)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-blue-600 dark:text-sky-400 tabular-nums whitespace-nowrap">
                      {row.avgQuiz !== null ? `${row.avgQuiz}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
