import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import type { TimetableBlock } from '../../types/studyx';
import { DAY_NAMES_FULL, DAY_NAMES_SHORT } from '../../utils/dateUtils';

interface ProposedSchedule {
  summary: string;
  blocks: Array<Omit<TimetableBlock, 'id' | 'userId'>>;
}

export function TimetableView() {
  const {
    courses,
    exams,
    assignments,
    timetableBlocks,
    getCourseById,
    addTimetableBlock,
    deleteTimetableBlock,
    replaceTimetableBlocks,
  } = useStudy();
  const { showToast } = useToast();

  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(new Date().getDay());

  // Manual block modal
  const [modalOpen, setModalOpen] = useState(false);
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [dayOfWeek, setDayOfWeek] = useState<number>(new Date().getDay());
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:30');
  const [title, setTitle] = useState('');
  const [blockType, setBlockType] = useState<'study' | 'lecture' | 'review'>('study');
  const [formError, setFormError] = useState<string | null>(null);

  // AI Smart Timetable Generator state
  const [dailyHours, setDailyHours] = useState(3);
  const [preferredWindow, setPreferredWindow] = useState<'morning' | 'afternoon' | 'evening'>(
    'afternoon'
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ProposedSchedule | null>(null);

  const blocksByDay = useMemo(() => {
    const grouped: Record<number, TimetableBlock[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    timetableBlocks.forEach((b) => {
      if (!grouped[b.dayOfWeek]) grouped[b.dayOfWeek] = [];
      grouped[b.dayOfWeek].push(b);
    });
    Object.keys(grouped).forEach((k) => {
      grouped[Number(k)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [timetableBlocks]);

  const orderedDays = [1, 2, 3, 4, 5, 6, 0]; // Mon -> Sun

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const resolvedCourse = courses.some((c) => c.id === courseId) ? courseId : courses[0]?.id || '';
    if (!resolvedCourse) {
      setFormError('Create a course first.');
      return;
    }
    if (!title.trim()) {
      setFormError('Enter a title for this study block.');
      return;
    }
    if (startTime >= endTime) {
      setFormError('End time must be after start time.');
      return;
    }
    addTimetableBlock({
      courseId: resolvedCourse,
      dayOfWeek,
      startTime,
      endTime,
      title: title.trim(),
      type: blockType,
    });
    setTitle('');
    setModalOpen(false);
    showToast('Timetable block added.', 'success');
  };

  const handleGenerateSmartSchedule = async () => {
    if (courses.length === 0) {
      setAiError('Add at least one course before generating a smart timetable.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setProposal(null);
    try {
      const response = await fetch('/api/ai/generate-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses: courses.map((c) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            targetHoursPerWeek: c.targetHoursPerWeek,
          })),
          upcomingExams: exams
            .filter((e) => e.status === 'upcoming')
            .map((e) => ({
              title: e.title,
              courseName: getCourseById(e.courseId)?.name,
              examDate: e.examDate,
            })),
          pendingAssignments: assignments
            .filter((a) => !a.completed)
            .map((a) => ({
              title: a.title,
              priority: a.priority,
              dueDate: a.dueDate,
            })),
          dailyHours,
          preferredWindow,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not generate a smart timetable.');
      }
      setProposal({
        summary: data.summary,
        blocks: data.blocks,
      });
      showToast('AI timetable proposal ready for review.', 'info');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Smart timetable generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyProposal = () => {
    if (!proposal) return;
    replaceTimetableBlocks(proposal.blocks);
    setProposal(null);
    showToast('Smart weekly timetable applied!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-950 dark:text-white">
            Smart Timetable
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Structure your weekly study blocks manually or generate an AI-balanced plan tailored to
            your upcoming exams and deadlines.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCourseId(courses[0]?.id || '');
            setFormError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </button>
      </div>

      {/* Optional AI Smart Timetable Generator Bar */}
      <div className="p-5 sm:p-6 rounded-2xl border border-blue-500/30 bg-blue-50/70 dark:bg-[#0D1E42]/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl studyx-gradient-btn text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
                AI Smart Timetable Assistant
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                Balances your {courses.length} courses,{' '}
                {exams.filter((e) => e.status === 'upcoming').length} upcoming exams, and{' '}
                {assignments.filter((a) => !a.completed).length} open assignments into a clean week.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Daily study hours"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-[#243E73] bg-white dark:bg-[#081226] text-xs sm:text-sm text-slate-900 dark:text-white"
            >
              <option value={2}>2 hrs / day</option>
              <option value={3}>3 hrs / day</option>
              <option value={4}>4 hrs / day</option>
              <option value={5}>5 hrs / day</option>
              <option value={6}>6 hrs / day</option>
            </select>

            <select
              aria-label="Preferred study window"
              value={preferredWindow}
              onChange={(e) =>
                setPreferredWindow(e.target.value as 'morning' | 'afternoon' | 'evening')
              }
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-[#243E73] bg-white dark:bg-[#081226] text-xs sm:text-sm text-slate-900 dark:text-white"
            >
              <option value="morning">Morning focus</option>
              <option value="afternoon">Afternoon focus</option>
              <option value="evening">Evening focus</option>
            </select>

            <button
              type="button"
              disabled={aiLoading || courses.length === 0}
              onClick={handleGenerateSmartSchedule}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white studyx-gradient-btn disabled:opacity-60 whitespace-nowrap"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Planning...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Smart Week
                </>
              )}
            </button>
          </div>
        </div>

        {aiError && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{aiError} You can continue editing blocks manually below.</span>
          </div>
        )}

        {proposal && (
          <div className="p-4 rounded-xl border border-blue-500/40 bg-white dark:bg-[#081226] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                  Proposed Smart Timetable ({proposal.blocks.length} blocks)
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">
                  {proposal.summary}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProposal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-[#233B6E] text-slate-600 dark:text-slate-300"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleApplyProposal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white studyx-gradient-btn"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Schedule
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-[#182B52]">
              {proposal.blocks.map((b, i) => {
                const c = getCourseById(b.courseId);
                return (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1B315E] text-xs"
                  >
                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {DAY_NAMES_SHORT[b.dayOfWeek]} · {b.startTime}–{b.endTime}
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white truncate mt-0.5">
                      {b.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {c?.code || 'Course'} · {b.type}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Day Selector */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
        {orderedDays.map((dow) => (
          <button
            key={dow}
            type="button"
            onClick={() => setSelectedMobileDay(dow)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              selectedMobileDay === dow
                ? 'studyx-gradient-btn text-white'
                : 'border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0D1A35] text-slate-600 dark:text-slate-300'
            }`}
          >
            {DAY_NAMES_SHORT[dow]} ({blocksByDay[dow].length})
          </button>
        ))}
      </div>

      {/* Mobile Single-Day View */}
      <div className="md:hidden rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#182B52] font-display font-semibold text-sm text-slate-950 dark:text-white">
          {DAY_NAMES_FULL[selectedMobileDay]}
        </div>
        {blocksByDay[selectedMobileDay].length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No study blocks on {DAY_NAMES_FULL[selectedMobileDay]}.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-[#182B52]">
            {blocksByDay[selectedMobileDay].map((block) => {
              const course = getCourseById(block.courseId);
              return (
                <div key={block.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-blue-600 dark:text-sky-400 tabular-nums">
                      {block.startTime} – {block.endTime}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {block.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: course?.color || '#2563EB' }}
                      />
                      {course?.code || 'Course'} · <span className="capitalize">{block.type}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteTimetableBlock(block.id);
                      showToast('Timetable block removed.', 'info');
                    }}
                    aria-label={`Remove ${block.title}`}
                    className="p-2 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop 7-Day Timetable Columns */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {orderedDays.map((dow) => {
          const isToday = dow === new Date().getDay();
          const dayBlocks = blocksByDay[dow];
          return (
            <div
              key={dow}
              className={`rounded-2xl border overflow-hidden flex flex-col min-h-[280px] ${
                isToday
                  ? 'border-blue-500/60 bg-blue-50/40 dark:bg-[#0E1E42]/80'
                  : 'border-slate-200 dark:border-[#1B315E] studyx-glass'
              }`}
            >
              <div className="px-3.5 py-3 border-b border-slate-200 dark:border-[#182B52] flex items-center justify-between">
                <span className="font-display font-semibold text-sm text-slate-950 dark:text-white">
                  {DAY_NAMES_SHORT[dow]}
                </span>
                {isToday && (
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-sky-400">
                    Today
                  </span>
                )}
              </div>

              <div className="p-2.5 space-y-2.5 flex-1">
                {dayBlocks.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">
                    Open day
                  </p>
                ) : (
                  dayBlocks.map((block) => {
                    const course = getCourseById(block.courseId);
                    return (
                      <div
                        key={block.id}
                        className="p-3 rounded-xl border border-slate-200/90 dark:border-[#20386A] bg-white dark:bg-[#081226] space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                            {block.startTime}–{block.endTime}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteTimetableBlock(block.id);
                              showToast('Block removed.', 'info');
                            }}
                            aria-label={`Remove ${block.title}`}
                            className="opacity-70 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                          {block.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: course?.color || '#2563EB' }}
                          />
                          <span className="truncate">{course?.code || 'Study'}</span>
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Timetable Block Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0B1730] shadow-2xl z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#16274B] flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-slate-950 dark:text-white">
                Add Timetable Block
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBlock} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Block Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Graph Theory Problem Sprint"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Course
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} · {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white"
                  >
                    {orderedDays.map((d) => (
                      <option key={d} value={d}>
                        {DAY_NAMES_FULL[d]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={blockType}
                    onChange={(e) =>
                      setBlockType(e.target.value as 'study' | 'lecture' | 'review')
                    }
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white"
                  >
                    <option value="study">Study</option>
                    <option value="lecture">Lecture</option>
                    <option value="review">Review</option>
                  </select>
                </div>
              </div>

              {formError && <p className="text-xs text-rose-600 dark:text-rose-400">{formError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white studyx-gradient-btn"
                >
                  Save Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
