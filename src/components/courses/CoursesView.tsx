import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ClipboardCheck,
  Edit3,
  FileCheck2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { COURSE_COLOR_PALETTE } from '../../data/seedData';
import type { Course } from '../../types/studyx';
import {
  formatCountdownLabel,
  formatDurationMinutes,
  formatFriendlyDate,
} from '../../utils/dateUtils';

interface CoursesViewProps {
  initialSelectedCourseId?: string | null;
  onClearInitialSelection?: () => void;
  onCreateQuizForCourse: (courseId: string) => void;
  onOpenQuizInModule: (quizId: string) => void;
}

export function CoursesView({
  initialSelectedCourseId = null,
  onClearInitialSelection,
  onCreateQuizForCourse,
  onOpenQuizInModule,
}: CoursesViewProps) {
  const {
    courses,
    assignments,
    exams,
    quizzes,
    getCourseProgress,
    getQuizQuestions,
    getQuizAttempts,
    addCourse,
    updateCourse,
    deleteCourse,
    toggleAssignment,
  } = useStudy();
  const { showToast } = useToast();

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialSelectedCourseId);
  const [detailTab, setDetailTab] = useState<'assignments' | 'exams' | 'quizzes'>('assignments');

  // Create/Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COURSE_COLOR_PALETTE[0].hex);
  const [targetHours, setTargetHours] = useState(5);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  const openCreateModal = () => {
    setEditingCourse(null);
    setCode('');
    setName('');
    setDescription('');
    setColor(COURSE_COLOR_PALETTE[courses.length % COURSE_COLOR_PALETTE.length].hex);
    setTargetHours(5);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setCode(course.code);
    setName(course.name);
    setDescription(course.description);
    setColor(course.color);
    setTargetHours(course.targetHoursPerWeek);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Course name is required.');
      return;
    }
    if (editingCourse) {
      updateCourse(editingCourse.id, {
        code: code.trim().toUpperCase() || editingCourse.code,
        name: name.trim(),
        description: description.trim(),
        color,
        targetHoursPerWeek: Math.max(1, Number(targetHours) || 4),
      });
      showToast('Course updated.', 'success');
    } else {
      addCourse({
        code: code.trim().toUpperCase() || 'COURSE',
        name: name.trim(),
        description: description.trim() || 'Active student subject.',
        color,
        targetHoursPerWeek: Math.max(1, Number(targetHours) || 4),
      });
      showToast('Course created.', 'success');
    }
    setModalOpen(false);
  };

  const handleDeleteCourse = (courseId: string) => {
    deleteCourse(courseId);
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
      onClearInitialSelection?.();
    }
    setConfirmDeleteId(null);
    showToast('Course and linked items removed.', 'info');
  };

  // Detail View for a selected course
  if (selectedCourse) {
    const progress = getCourseProgress(selectedCourse.id);
    const courseAssignments = assignments
      .filter((a) => a.courseId === selectedCourse.id)
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate));
    const courseExams = exams
      .filter((e) => e.courseId === selectedCourse.id)
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
    const courseQuizzes = quizzes.filter((q) => q.courseId === selectedCourse.id);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedCourseId(null);
              onClearInitialSelection?.();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400"
          >
            <ArrowLeft className="w-4 h-4" />
            All Courses
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCreateQuizForCourse(selectedCourse.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white studyx-gradient-btn"
            >
              <Plus className="w-4 h-4" />
              Create Quiz for Course
            </button>
            <button
              type="button"
              onClick={() => openEditModal(selectedCourse)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-[#1E3562] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A]"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>

        {/* Course Header Summary */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedCourse.color }}
                />
                <span>{selectedCourse.code}</span>
                <span aria-hidden="true">·</span>
                <span>Target {selectedCourse.targetHoursPerWeek}h/week</span>
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-950 dark:text-white">
                {selectedCourse.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedCourse.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-5 sm:gap-7 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-[#182B52]">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Task Progress</p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
                  {progress.taskCompletionPercent}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Quiz Avg</p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
                  {progress.averageQuizScore !== null ? `${progress.averageQuizScore}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Studied</p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
                  {formatDurationMinutes(progress.studyMinutes)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Course Content Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl border border-slate-200 dark:border-[#1E3562] bg-slate-100/80 dark:bg-[#0D1A35]">
          {(
            [
              { id: 'assignments', label: `Assignments (${courseAssignments.length})` },
              { id: 'exams', label: `Exams (${courseExams.length})` },
              { id: 'quizzes', label: `Quizzes (${courseQuizzes.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDetailTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                detailTab === t.id
                  ? 'bg-white dark:bg-[#172B54] text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass overflow-hidden">
          {detailTab === 'assignments' && (
            <>
              {courseAssignments.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No assignments linked to {selectedCourse.code} yet. Use Quick Add to create one.
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-[#182B52]">
                  {courseAssignments.map((task) => (
                    <li key={task.id} className="px-6 py-4 flex items-start gap-3.5">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={task.completed}
                        onClick={() => {
                          toggleAssignment(task.id);
                          showToast(
                            task.completed ? 'Assignment reopened.' : 'Assignment marked complete!',
                            task.completed ? 'info' : 'success'
                          );
                        }}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          task.completed
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-[#34548C] bg-white dark:bg-[#081226]'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            task.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                          Due {formatFriendlyDate(task.dueDate)} {task.dueTime} · {task.priority} priority
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {detailTab === 'exams' && (
            <>
              {courseExams.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No exams linked to {selectedCourse.code} yet.
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-[#182B52]">
                  {courseExams.map((exam) => {
                    const countdown = formatCountdownLabel(exam.examDate);
                    return (
                      <li
                        key={exam.id}
                        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {exam.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {exam.examDate} at {exam.startTime} · {exam.location} ·{' '}
                            {exam.weightPercent}% of grade
                          </p>
                          {exam.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {exam.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-sky-400 whitespace-nowrap">
                          {exam.status === 'completed' ? 'Completed' : countdown.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {detailTab === 'quizzes' && (
            <>
              {courseQuizzes.length === 0 ? (
                <div className="p-10 text-center">
                  <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No quizzes created for {selectedCourse.code} yet
                  </p>
                  <button
                    type="button"
                    onClick={() => onCreateQuizForCourse(selectedCourse.id)}
                    className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white studyx-gradient-btn"
                  >
                    Create First Quiz for {selectedCourse.code}
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-[#182B52]">
                  {courseQuizzes.map((quiz) => {
                    const qCount = getQuizQuestions(quiz.id).length;
                    const attempts = getQuizAttempts(quiz.id);
                    const latest = attempts[0];
                    return (
                      <li
                        key={quiz.id}
                        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {quiz.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                            {qCount} questions · {attempts.length} attempt
                            {attempts.length === 1 ? '' : 's'}
                            {latest ? ` · Latest score ${latest.percentage}%` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenQuizInModule(quiz.id)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white studyx-gradient-btn whitespace-nowrap self-start sm:self-center"
                        >
                          Take Quiz
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-950 dark:text-white">
            Courses & Subjects
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your subjects, track per-course progress, and link assignments, exams, and
            quizzes.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-sm shadow-blue-600/20 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass text-center">
          <BookOpen className="w-9 h-9 text-blue-600 dark:text-sky-400 mx-auto mb-3" />
          <h2 className="font-display font-semibold text-lg text-slate-950 dark:text-white">
            Create your first course
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Courses organize every assignment, exam, quiz, focus session, and timetable block in
            STUDYX AI.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn"
          >
            Add First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course) => {
            const stats = getCourseProgress(course.id);
            return (
              <div
                key={course.id}
                className="p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {course.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(course)}
                        aria-label={`Edit ${course.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14264A] transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(course.id)}
                        aria-label={`Delete ${course.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h2 className="mt-2 font-display font-bold text-lg text-slate-950 dark:text-white">
                    {course.name}
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Task completion</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
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
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>
                      {stats.completedTasks}/{stats.totalTasks} tasks
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{stats.upcomingExams} upcoming exams</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {stats.quizCount} quiz{stats.quizCount === 1 ? '' : 'zes'}
                      {stats.averageQuizScore !== null ? ` (${stats.averageQuizScore}% avg)` : ''}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDurationMinutes(stats.studyMinutes)} studied</span>
                  </div>
                </div>

                {confirmDeleteId === course.id ? (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-rose-700 dark:text-rose-300 font-medium">
                      Delete course and its linked tasks, exams & quizzes?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-[#233B6E] text-slate-700 dark:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-200/80 dark:border-[#182B52] flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCourseId(course.id)}
                      className="text-sm font-semibold text-blue-600 dark:text-sky-400 hover:underline"
                    >
                      Open Course Space
                    </button>
                    <button
                      type="button"
                      onClick={() => onCreateQuizForCourse(course.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A]"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Add Quiz
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Course Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0B1730] shadow-2xl z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#16274B] flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-slate-950 dark:text-white">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="PHYS 201"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Classical Mechanics"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Syllabus highlights, professor, or semester focus..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Accent Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COURSE_COLOR_PALETTE.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setColor(swatch.hex)}
                        aria-label={swatch.name}
                        className={`w-8 h-8 rounded-lg transition-transform ${
                          color === swatch.hex
                            ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#0B1730] scale-105'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Weekly Study Target (hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={targetHours}
                    onChange={(e) => setTargetHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{formError}</p>
              )}

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
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
