import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { COURSE_COLOR_PALETTE } from '../../data/seedData';
import type { PriorityLevel } from '../../types/studyx';
import { getTodayDateString } from '../../utils/dateUtils';

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'task' | 'exam' | 'course' | 'session';
}

export function QuickAddModal({ open, onClose, defaultTab = 'task' }: QuickAddModalProps) {
  const { courses, addAssignment, addExam, addCourse, addStudySession } = useStudy();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'task' | 'exam' | 'course' | 'session'>(defaultTab);
  const firstCourseId = courses[0]?.id || '';

  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourseId, setTaskCourseId] = useState(firstCourseId);
  const [taskDueDate, setTaskDueDate] = useState(getTodayDateString());
  const [taskDueTime, setTaskDueTime] = useState('23:59');
  const [taskPriority, setTaskPriority] = useState<PriorityLevel>('medium');
  const [taskDescription, setTaskDescription] = useState('');

  // Exam state
  const [examTitle, setExamTitle] = useState('');
  const [examCourseId, setExamCourseId] = useState(firstCourseId);
  const [examDate, setExamDate] = useState(getTodayDateString());
  const [examTime, setExamTime] = useState('10:00');
  const [examLocation, setExamLocation] = useState('');
  const [examWeight, setExamWeight] = useState(20);

  // Course state
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseColor, setCourseColor] = useState(COURSE_COLOR_PALETTE[0].hex);

  // Study Session state
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionCourseId, setSessionCourseId] = useState(firstCourseId);
  const [sessionMinutes, setSessionMinutes] = useState(45);

  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const activeCourseId = (current: string) =>
    courses.some((c) => c.id === current) ? current : courses[0]?.id || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === 'task') {
      const cid = activeCourseId(taskCourseId);
      if (!cid) {
        setError('Create a course first before adding an assignment.');
        return;
      }
      if (!taskTitle.trim()) {
        setError('Please enter a task title.');
        return;
      }
      addAssignment({
        courseId: cid,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        dueDate: taskDueDate,
        dueTime: taskDueTime,
        priority: taskPriority,
      });
      setTaskTitle('');
      setTaskDescription('');
      showToast('Assignment added to your schedule.', 'success');
      onClose();
      return;
    }

    if (tab === 'exam') {
      const cid = activeCourseId(examCourseId);
      if (!cid) {
        setError('Create a course first before scheduling an exam.');
        return;
      }
      if (!examTitle.trim()) {
        setError('Please enter an exam title.');
        return;
      }
      addExam({
        courseId: cid,
        title: examTitle.trim(),
        examDate,
        startTime: examTime,
        durationMinutes: 90,
        location: examLocation.trim() || 'TBA',
        weightPercent: Number(examWeight) || 20,
        notes: '',
      });
      setExamTitle('');
      setExamLocation('');
      showToast('Exam scheduled and linked to course.', 'success');
      onClose();
      return;
    }

    if (tab === 'course') {
      if (!courseName.trim()) {
        setError('Please enter a course name.');
        return;
      }
      addCourse({
        code: courseCode.trim().toUpperCase() || 'COURSE',
        name: courseName.trim(),
        description: courseDescription.trim() || 'Active student course.',
        color: courseColor,
        targetHoursPerWeek: 5,
      });
      setCourseCode('');
      setCourseName('');
      setCourseDescription('');
      showToast('New course created.', 'success');
      onClose();
      return;
    }

    const cid = activeCourseId(sessionCourseId);
    if (!cid) {
      setError('Create a course first before logging a study session.');
      return;
    }
    if (!sessionTitle.trim()) {
      setError('Please enter what you studied.');
      return;
    }
    addStudySession({
      courseId: cid,
      title: sessionTitle.trim(),
      durationMinutes: Number(sessionMinutes) || 30,
      source: 'manual',
    });
    setSessionTitle('');
    showToast('Study session logged to your progress.', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1E3562] bg-white dark:bg-[#0B1730] shadow-2xl overflow-hidden z-10">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#16274B] flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-slate-950 dark:text-white">
            Quick Add
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#081226] border border-slate-200 dark:border-[#16274B]">
            {(
              [
                { id: 'task', label: 'Task' },
                { id: 'exam', label: 'Exam' },
                { id: 'course', label: 'Course' },
                { id: 'session', label: 'Session' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setError(null);
                }}
                className={`py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-white dark:bg-[#172B54] text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'task' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Task / Assignment Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Complete Chapter 5 problem set"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Course
                  </label>
                  <select
                    value={activeCourseId(taskCourseId)}
                    onChange={(e) => setTaskCourseId(e.target.value)}
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
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as PriorityLevel)}
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
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Submission link or key deliverables"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {tab === 'exam' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Midterm Examination"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Course
                  </label>
                  <select
                    value={activeCourseId(examCourseId)}
                    onChange={(e) => setExamCourseId(e.target.value)}
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
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={examWeight}
                    onChange={(e) => setExamWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Room / Location
                </label>
                <input
                  type="text"
                  value={examLocation}
                  onChange={(e) => setExamLocation(e.target.value)}
                  placeholder="Science Hall 204"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {tab === 'course' && (
            <>
              <div className="grid grid-cols-3 gap-3.5">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="BIO 210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Molecular Biology"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Key topics, instructor, or syllabus goals"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Course Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_COLOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setCourseColor(c.hex)}
                      aria-label={c.name}
                      className={`w-8 h-8 rounded-lg transition-transform ${
                        courseColor === c.hex
                          ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#0B1730] scale-105'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'session' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Session Focus Topic
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Review lecture slides and practice proofs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Course
                  </label>
                  <select
                    value={activeCourseId(sessionCourseId)}
                    onChange={(e) => setSessionCourseId(e.target.value)}
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
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={sessionMinutes}
                    onChange={(e) => setSessionMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
