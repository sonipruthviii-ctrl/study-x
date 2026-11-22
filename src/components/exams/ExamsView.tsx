import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck2,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import type { Exam } from '../../types/studyx';
import {
  formatCountdownLabel,
  formatLongDate,
  getTodayDateString,
} from '../../utils/dateUtils';

export function ExamsView() {
  const {
    courses,
    exams,
    getCourseById,
    addExam,
    updateExam,
    toggleExamStatus,
    deleteExam,
  } = useStudy();
  const { showToast } = useToast();

  const [statusTab, setStatusTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [courseFilter, setCourseFilter] = useState('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [location, setLocation] = useState('');
  const [weightPercent, setWeightPercent] = useState(20);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredExams = useMemo(() => {
    return exams
      .filter((e) => {
        if (statusTab !== 'all' && e.status !== statusTab) return false;
        if (courseFilter !== 'all' && e.courseId !== courseFilter) return false;
        return true;
      })
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
  }, [exams, statusTab, courseFilter]);

  const upcomingCount = exams.filter((e) => e.status === 'upcoming').length;
  const completedCount = exams.filter((e) => e.status === 'completed').length;

  const openCreateModal = () => {
    setEditingExam(null);
    setCourseId(courses[0]?.id || '');
    setTitle('');
    setExamDate(getTodayDateString());
    setStartTime('10:00');
    setDurationMinutes(90);
    setLocation('');
    setWeightPercent(20);
    setNotes('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setCourseId(exam.courseId);
    setTitle(exam.title);
    setExamDate(exam.examDate);
    setStartTime(exam.startTime);
    setDurationMinutes(exam.durationMinutes);
    setLocation(exam.location);
    setWeightPercent(exam.weightPercent);
    setNotes(exam.notes);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const resolvedCourseId = courses.some((c) => c.id === courseId)
      ? courseId
      : courses[0]?.id || '';
    if (!resolvedCourseId) {
      setError('Create a course first before scheduling an exam.');
      return;
    }
    if (!title.trim()) {
      setError('Exam title is required.');
      return;
    }

    if (editingExam) {
      updateExam(editingExam.id, {
        courseId: resolvedCourseId,
        title: title.trim(),
        examDate,
        startTime,
        durationMinutes: Math.max(15, Number(durationMinutes) || 90),
        location: location.trim() || 'TBA',
        weightPercent: Math.min(100, Math.max(1, Number(weightPercent) || 20)),
        notes: notes.trim(),
      });
      showToast('Exam details updated.', 'success');
    } else {
      addExam({
        courseId: resolvedCourseId,
        title: title.trim(),
        examDate,
        startTime,
        durationMinutes: Math.max(15, Number(durationMinutes) || 90),
        location: location.trim() || 'TBA',
        weightPercent: Math.min(100, Math.max(1, Number(weightPercent) || 20)),
        notes: notes.trim(),
      });
      showToast('Exam added to your schedule.', 'success');
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-950 dark:text-white">
            Exam Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 tabular-nums">
            {upcomingCount} upcoming · {completedCount} completed · Track countdowns, weights, and
            syllabus notes
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule Exam
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0D1A35] border border-slate-200 dark:border-[#1E3562]">
          {(
            [
              { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
              { id: 'completed', label: `Completed (${completedCount})` },
              { id: 'all', label: `All (${exams.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                statusTab === tab.id
                  ? 'bg-white dark:bg-[#172B54] text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          aria-label="Filter exams by course"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Exam Cards */}
      {filteredExams.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass text-center">
          <FileCheck2 className="w-9 h-9 text-blue-600 dark:text-sky-400 mx-auto mb-3" />
          <p className="font-display font-semibold text-base text-slate-950 dark:text-white">
            No exams in this view
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Schedule an exam to track countdowns and factor it into your Smart Timetable.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredExams.map((exam) => {
            const course = getCourseById(exam.courseId);
            const countdown = formatCountdownLabel(exam.examDate);
            const isCompleted = exam.status === 'completed';

            return (
              <div
                key={exam.id}
                className="p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: course?.color || '#2563EB' }}
                      />
                      <span>{course ? `${course.code} · ${course.name}` : 'Course'}</span>
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums whitespace-nowrap ${
                        isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : countdown.tone === 'soon'
                            ? 'text-amber-600 dark:text-amber-400'
                            : countdown.tone === 'overdue'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-blue-600 dark:text-sky-400'
                      }`}
                    >
                      {isCompleted ? 'Completed' : countdown.label}
                    </span>
                  </div>

                  <h2 className="mt-2 font-display font-bold text-lg text-slate-950 dark:text-white">
                    {exam.title}
                  </h2>

                  <div className="mt-3 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-2 font-mono text-xs tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {formatLongDate(exam.examDate)} · {exam.startTime} ({exam.durationMinutes} min)
                    </p>
                    <p className="flex items-center gap-2 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {exam.location} · Weight: {exam.weightPercent}% of final grade
                    </p>
                  </div>

                  {exam.notes && (
                    <p className="mt-3 pt-3 border-t border-slate-200/80 dark:border-[#182B52] text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {exam.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-[#182B52] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      toggleExamStatus(exam.id);
                      showToast(
                        isCompleted ? 'Exam moved back to upcoming.' : 'Exam marked completed!',
                        'success'
                      );
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isCompleted ? 'Mark as Upcoming' : 'Mark as Completed'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(exam)}
                      aria-label={`Edit ${exam.title}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14264A]"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteExam(exam.id);
                        showToast('Exam removed.', 'info');
                      }}
                      aria-label={`Delete ${exam.title}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exam Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0B1730] shadow-2xl z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#16274B] flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-slate-950 dark:text-white">
                {editingExam ? 'Edit Exam' : 'Schedule New Exam'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Final Examination: Comprehensive"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Course
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
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
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Auditorium B"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Weight %
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={weightPercent}
                    onChange={(e) => setWeightPercent(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Topics & Study Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allowed sheets, chapters covered, practice exam links..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

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
                  {editingExam ? 'Save Changes' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
