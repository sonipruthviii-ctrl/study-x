import React, { useMemo, useState } from 'react';
import { Check, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import type { Assignment, PriorityLevel } from '../../types/studyx';
import {
  formatCountdownLabel,
  formatFriendlyDate,
  getTodayDateString,
} from '../../utils/dateUtils';

export function AssignmentsView() {
  const {
    courses,
    assignments,
    getCourseById,
    addAssignment,
    updateAssignment,
    toggleAssignment,
    deleteAssignment,
  } = useStudy();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Assignment | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [error, setError] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assignments
      .filter((task) => {
        if (statusFilter === 'pending' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;
        if (courseFilter !== 'all' && task.courseId !== courseFilter) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        if (q) {
          const course = getCourseById(task.courseId);
          const haystack = `${task.title} ${task.description} ${course?.name || ''} ${
            course?.code || ''
          }`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [assignments, statusFilter, courseFilter, priorityFilter, searchQuery, getCourseById]);

  const completedCount = assignments.filter((a) => a.completed).length;
  const pendingCount = assignments.length - completedCount;

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCourseId(courses[0]?.id || '');
    setDueDate(getTodayDateString());
    setDueTime('23:59');
    setPriority('medium');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (task: Assignment) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCourseId(task.courseId);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime);
    setPriority(task.priority);
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
      setError('Create a course first before adding assignments.');
      return;
    }
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (editingTask) {
      updateAssignment(editingTask.id, {
        courseId: resolvedCourseId,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        dueTime,
        priority,
      });
      showToast('Assignment updated.', 'success');
    } else {
      addAssignment({
        courseId: resolvedCourseId,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        dueTime,
        priority,
      });
      showToast('Assignment added.', 'success');
    }
    setModalOpen(false);
  };

  const handleToggle = (task: Assignment) => {
    toggleAssignment(task.id);
    showToast(
      task.completed
        ? `Reopened "${task.title}"`
        : `Completed "${task.title}" — progress updated!`,
      task.completed ? 'info' : 'success'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-950 dark:text-white">
            Assignments & Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 tabular-nums">
            {pendingCount} pending · {completedCount} completed · Every checkbox syncs instantly
            with dashboard & course stats
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-sm shadow-blue-600/20 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Assignment
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#081226] border border-slate-200 dark:border-[#16274B] self-start">
          {(
            [
              { id: 'all', label: `All (${assignments.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'completed', label: `Completed (${completedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-[#172B54] text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
          <div className="relative flex-1 sm:flex-initial sm:w-56 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            aria-label="Filter by course"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | PriorityLevel)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>
      </div>

      {/* Task List with Explicit Working Checkboxes */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No assignments match your current filter
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Adjust filters or add a new assignment linked to your courses.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200/80 dark:divide-[#182B52]">
            {filteredTasks.map((task) => {
              const course = getCourseById(task.courseId);
              const countdown = formatCountdownLabel(task.dueDate);
              return (
                <li
                  key={task.id}
                  className={`px-4 sm:px-6 py-4 flex items-start gap-3.5 transition-colors ${
                    task.completed
                      ? 'bg-slate-50/70 dark:bg-[#081329]/60'
                      : 'hover:bg-slate-50/80 dark:hover:bg-[#102042]/50'
                  }`}
                >
                  {/* Visible, Touch-Friendly Working Checkbox */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={task.completed}
                    aria-label={
                      task.completed
                        ? `Uncheck "${task.title}" to reopen`
                        : `Check "${task.title}" to mark completed`
                    }
                    onClick={() => handleToggle(task)}
                    className="min-w-[40px] min-h-[40px] -ml-2 -mt-2 flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
                  >
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-400 dark:border-[#3D5E99] bg-white dark:bg-[#081226] hover:border-blue-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p
                        className={`text-sm sm:text-base font-medium leading-snug ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-950 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.completed && (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Completed
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p
                        className={`mt-1 text-xs sm:text-sm leading-relaxed ${
                          task.completed
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {course && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: course.color }}
                          />
                          {course.code} · {course.name}
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-mono tabular-nums ${
                          !task.completed && countdown.tone === 'overdue'
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : ''
                        }`}
                      >
                        Due {formatFriendlyDate(task.dueDate)} at {task.dueTime}
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

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(task)}
                      aria-label={`Edit ${task.title}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14264A]"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteAssignment(task.id);
                        showToast('Assignment deleted.', 'info');
                      }}
                      aria-label={`Delete ${task.title}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add / Edit Assignment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0B1730] shadow-2xl z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#16274B] flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-slate-950 dark:text-white">
                {editingTask ? 'Edit Assignment' : 'New Assignment'}
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
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lab 4: Red-Black Tree Insertion"
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
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Deadline Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional rubric requirements or references"
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
                  {editingTask ? 'Save Changes' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
