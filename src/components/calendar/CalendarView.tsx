import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck2,
  Plus,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import {
  DAY_NAMES_SHORT,
  formatDurationMinutes,
  formatLongDate,
  getTodayDateString,
} from '../../utils/dateUtils';

interface CalendarViewProps {
  onOpenQuickAdd: () => void;
}

interface CalendarDayEvent {
  id: string;
  date: string;
  kind: 'assignment' | 'exam' | 'session';
  title: string;
  subtitle: string;
  courseColor: string;
  completed?: boolean;
  rawId: string;
}

export function CalendarView({ onOpenQuickAdd }: CalendarViewProps) {
  const { assignments, exams, studySessions, getCourseById, toggleAssignment } = useStudy();
  const { showToast } = useToast();

  const todayStr = getTodayDateString();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showAssignments, setShowAssignments] = useState(true);
  const [showExams, setShowExams] = useState(true);
  const [showSessions, setShowSessions] = useState(true);

  const allEvents = useMemo(() => {
    const map: Record<string, CalendarDayEvent[]> = {};
    const pushEvent = (evt: CalendarDayEvent) => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    };

    if (showAssignments) {
      assignments.forEach((task) => {
        const course = getCourseById(task.courseId);
        pushEvent({
          id: `cal_task_${task.id}`,
          rawId: task.id,
          date: task.dueDate,
          kind: 'assignment',
          title: task.title,
          subtitle: `${course?.code || 'Course'} · Due ${task.dueTime} · ${task.priority} priority`,
          courseColor: course?.color || '#2563EB',
          completed: task.completed,
        });
      });
    }

    if (showExams) {
      exams.forEach((exam) => {
        const course = getCourseById(exam.courseId);
        pushEvent({
          id: `cal_exam_${exam.id}`,
          rawId: exam.id,
          date: exam.examDate,
          kind: 'exam',
          title: exam.title,
          subtitle: `${course?.code || 'Course'} · ${exam.startTime} · ${exam.location}`,
          courseColor: course?.color || '#D97706',
          completed: exam.status === 'completed',
        });
      });
    }

    if (showSessions) {
      studySessions.forEach((sess) => {
        const course = getCourseById(sess.courseId);
        const dateKey = sess.startedAt.slice(0, 10);
        pushEvent({
          id: `cal_sess_${sess.id}`,
          rawId: sess.id,
          date: dateKey,
          kind: 'session',
          title: sess.title,
          subtitle: `${course?.code || 'Course'} · ${formatDurationMinutes(
            sess.durationMinutes
          )} study session`,
          courseColor: course?.color || '#0EA5E9',
        });
      });
    }

    return map;
  }, [assignments, exams, studySessions, getCourseById, showAssignments, showExams, showSessions]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ dateStr: string | null; dayNum: number | null }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ dateStr: null, dayNum: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ dateStr: `${viewYear}-${mStr}-${dStr}`, dayNum: d });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ dateStr: null, dayNum: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  const selectedEvents = allEvents[selectedDate] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-950 dark:text-white">
            Study Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track assignment deadlines, examinations, and logged study sessions across the month.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0D1A35] cursor-pointer">
          <input
            type="checkbox"
            checked={showAssignments}
            onChange={(e) => setShowAssignments(e.target.checked)}
            className="accent-blue-600 w-4 h-4"
          />
          <span>Assignments</span>
        </label>
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0D1A35] cursor-pointer">
          <input
            type="checkbox"
            checked={showExams}
            onChange={(e) => setShowExams(e.target.checked)}
            className="accent-blue-600 w-4 h-4"
          />
          <span>Exams</span>
        </label>
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0D1A35] cursor-pointer">
          <input
            type="checkbox"
            checked={showSessions}
            onChange={(e) => setShowSessions(e.target.checked)}
            className="accent-blue-600 w-4 h-4"
          />
          <span>Study Sessions</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monthly Grid */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#182B52] flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-base sm:text-lg text-slate-950 dark:text-white">
              {monthLabel}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-2 rounded-lg border border-slate-200 dark:border-[#233B6E] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14264A]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleJumpToday}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#233B6E] text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-2 rounded-lg border border-slate-200 dark:border-[#233B6E] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14264A]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-[#182B52] bg-slate-50/70 dark:bg-[#081226]/70">
            {DAY_NAMES_SHORT.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarCells.map((cell, idx) => {
              if (!cell.dateStr || !cell.dayNum) {
                return (
                  <div
                    key={`empty_${idx}`}
                    className="min-h-[68px] sm:min-h-[86px] border-b border-r border-slate-200/70 dark:border-[#16274B] bg-slate-50/40 dark:bg-[#060E20]/50"
                  />
                );
              }
              const events = allEvents[cell.dateStr] || [];
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateStr!)}
                  className={`min-h-[68px] sm:min-h-[86px] p-1.5 sm:p-2 text-left border-b border-r border-slate-200/70 dark:border-[#16274B] transition-colors flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                    isSelected
                      ? 'bg-blue-600/12 dark:bg-blue-500/20'
                      : 'hover:bg-slate-50 dark:hover:bg-[#102042]/60'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full font-mono text-xs flex items-center justify-center tabular-nums ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold'
                        : isSelected
                          ? 'text-blue-700 dark:text-sky-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {events.length > 0 && (
                    <div className="space-y-1 w-full">
                      <div className="flex flex-wrap gap-1 sm:hidden">
                        {events.slice(0, 4).map((evt) => (
                          <span
                            key={evt.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: evt.courseColor }}
                          />
                        ))}
                      </div>
                      <div className="hidden sm:flex flex-col gap-0.5">
                        {events.slice(0, 2).map((evt) => (
                          <div
                            key={evt.id}
                            className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-200 truncate"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: evt.courseColor }}
                            />
                            <span className="truncate">{evt.title}</span>
                          </div>
                        ))}
                        {events.length > 2 && (
                          <span className="text-[10px] font-mono text-slate-400">
                            +{events.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#182B52]">
            <p className="text-xs font-medium text-blue-600 dark:text-sky-400">Day Agenda</p>
            <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white mt-0.5">
              {formatLongDate(selectedDate)}
            </h2>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Clear schedule on this day
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No assignments, exams, or logged sessions on {selectedDate}.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-[#182B52]">
              {selectedEvents.map((evt) => (
                <li key={evt.id} className="px-5 py-4 flex items-start gap-3">
                  {evt.kind === 'assignment' ? (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={Boolean(evt.completed)}
                      onClick={() => {
                        toggleAssignment(evt.rawId);
                        showToast(
                          evt.completed ? 'Task reopened.' : 'Task marked complete!',
                          evt.completed ? 'info' : 'success'
                        );
                      }}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        evt.completed
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-400 dark:border-[#3D5E99] bg-white dark:bg-[#081226]'
                      }`}
                    >
                      {evt.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  ) : evt.kind === 'exam' ? (
                    <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        evt.kind === 'assignment' && evt.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {evt.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="capitalize font-medium">{evt.kind}</span> · {evt.subtitle}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
