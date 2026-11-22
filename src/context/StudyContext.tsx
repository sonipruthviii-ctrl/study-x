import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createInitialSeedDatabase,
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  hashPrototypePassword,
} from '../data/seedData';
import type {
  Assignment,
  ContactMessage,
  Course,
  Exam,
  PriorityLevel,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  StudentProfile,
  StudyDatabase,
  StudySession,
  TimetableBlock,
  User,
} from '../types/studyx';

const DB_STORAGE_KEY = 'studyx_ai_db_v1';
const SESSION_STORAGE_KEY = 'studyx_ai_session_user_id_v1';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadDatabase(): StudyDatabase {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StudyDatabase;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to clean seed
  }
  const seeded = createInitialSeedDatabase();
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // Ignore quota errors
  }
  return seeded;
}

export interface QuizQuestionDraft {
  id?: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface CourseProgressSummary {
  courseId: string;
  totalTasks: number;
  completedTasks: number;
  taskCompletionPercent: number;
  upcomingExams: number;
  quizCount: number;
  attemptCount: number;
  averageQuizScore: number | null;
  studyMinutes: number;
}

interface StudyContextValue {
  currentUser: User | null;
  currentProfile: StudentProfile | null;
  courses: Course[];
  assignments: Assignment[];
  exams: Exam[];
  quizzes: Quiz[];
  quizQuestions: QuizQuestion[];
  quizAttempts: QuizAttempt[];
  studySessions: StudySession[];
  timetableBlocks: TimetableBlock[];
  contactMessages: ContactMessage[];

  login: (email: string, password: string) => { ok: boolean; error?: string };
  loginDemo: () => void;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    major: string;
    academicYear: string;
  }) => { ok: boolean; error?: string };
  logout: () => void;

  getCourseById: (courseId: string) => Course | undefined;
  getCourseProgress: (courseId: string) => CourseProgressSummary;
  getQuizQuestions: (quizId: string) => QuizQuestion[];
  getQuizAttempts: (quizId: string) => QuizAttempt[];

  addCourse: (data: Omit<Course, 'id' | 'userId' | 'createdAt'>) => Course | null;
  updateCourse: (courseId: string, data: Partial<Omit<Course, 'id' | 'userId' | 'createdAt'>>) => void;
  deleteCourse: (courseId: string) => void;

  addAssignment: (data: {
    courseId: string;
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: PriorityLevel;
  }) => Assignment | null;
  updateAssignment: (
    assignmentId: string,
    data: Partial<Omit<Assignment, 'id' | 'userId' | 'createdAt'>>
  ) => void;
  toggleAssignment: (assignmentId: string) => void;
  deleteAssignment: (assignmentId: string) => void;

  addExam: (data: Omit<Exam, 'id' | 'userId' | 'createdAt' | 'status'>) => Exam | null;
  updateExam: (examId: string, data: Partial<Omit<Exam, 'id' | 'userId' | 'createdAt'>>) => void;
  toggleExamStatus: (examId: string) => void;
  deleteExam: (examId: string) => void;

  saveQuiz: (data: {
    quizId?: string;
    courseId: string;
    title: string;
    description: string;
    questions: QuizQuestionDraft[];
  }) => Quiz | null;
  deleteQuiz: (quizId: string) => void;
  submitQuizAttempt: (quizId: string, answers: number[]) => QuizAttempt | null;

  addStudySession: (data: {
    courseId: string;
    title: string;
    durationMinutes: number;
    source: 'focus_timer' | 'manual';
    startedAt?: string;
  }) => StudySession | null;
  deleteStudySession: (sessionId: string) => void;

  addTimetableBlock: (data: Omit<TimetableBlock, 'id' | 'userId'>) => TimetableBlock | null;
  updateTimetableBlock: (blockId: string, data: Partial<Omit<TimetableBlock, 'id' | 'userId'>>) => void;
  deleteTimetableBlock: (blockId: string) => void;
  replaceTimetableBlocks: (blocks: Array<Omit<TimetableBlock, 'id' | 'userId'>>) => void;

  submitContactMessage: (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => ContactMessage;
  markContactMessageRead: (messageId: string, read?: boolean) => void;
  deleteContactMessage: (messageId: string) => void;
  resetDemoWorkspace: () => void;
}

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<StudyDatabase>(() => loadDatabase());
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Ignore storage write errors
    }
  }, [db]);

  useEffect(() => {
    try {
      if (sessionUserId) {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionUserId);
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write errors
    }
  }, [sessionUserId]);

  const currentUser = useMemo(
    () => db.users.find((u) => u.id === sessionUserId) ?? null,
    [db.users, sessionUserId]
  );

  const currentProfile = useMemo(
    () =>
      currentUser
        ? db.studentProfiles.find((p) => p.userId === currentUser.id) ?? null
        : null,
    [db.studentProfiles, currentUser]
  );

  const courses = useMemo(
    () => (currentUser ? db.courses.filter((c) => c.userId === currentUser.id) : []),
    [db.courses, currentUser]
  );

  const assignments = useMemo(
    () => (currentUser ? db.assignments.filter((a) => a.userId === currentUser.id) : []),
    [db.assignments, currentUser]
  );

  const exams = useMemo(
    () => (currentUser ? db.exams.filter((e) => e.userId === currentUser.id) : []),
    [db.exams, currentUser]
  );

  const quizzes = useMemo(
    () => (currentUser ? db.quizzes.filter((q) => q.userId === currentUser.id) : []),
    [db.quizzes, currentUser]
  );

  const userQuizIds = useMemo(() => new Set(quizzes.map((q) => q.id)), [quizzes]);

  const quizQuestions = useMemo(
    () => db.quizQuestions.filter((qq) => userQuizIds.has(qq.quizId)),
    [db.quizQuestions, userQuizIds]
  );

  const quizAttempts = useMemo(
    () =>
      currentUser
        ? db.quizAttempts
            .filter((att) => att.userId === currentUser.id)
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        : [],
    [db.quizAttempts, currentUser]
  );

  const studySessions = useMemo(
    () =>
      currentUser
        ? db.studySessions
            .filter((s) => s.userId === currentUser.id)
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        : [],
    [db.studySessions, currentUser]
  );

  const timetableBlocks = useMemo(
    () => (currentUser ? db.timetableBlocks.filter((b) => b.userId === currentUser.id) : []),
    [db.timetableBlocks, currentUser]
  );

  const contactMessages = useMemo(
    () =>
      [...db.contactMessages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [db.contactMessages]
  );

  const login = useCallback(
    (email: string, password: string): { ok: boolean; error?: string } => {
      const normalized = email.trim().toLowerCase();
      const user = db.users.find((u) => u.email.toLowerCase() === normalized);
      if (!user) {
        return { ok: false, error: 'No prototype account found with that email address.' };
      }
      if (user.passwordDigest !== hashPrototypePassword(password)) {
        return { ok: false, error: 'Incorrect password. Please try again or use Demo Student Sign-In.' };
      }
      setSessionUserId(user.id);
      return { ok: true };
    },
    [db.users]
  );

  const loginDemo = useCallback(() => {
    const existingDemo = db.users.find((u) => u.email.toLowerCase() === DEMO_USER_EMAIL);
    if (existingDemo) {
      setSessionUserId(existingDemo.id);
      return;
    }
    const fresh = createInitialSeedDatabase();
    setDb(fresh);
    setSessionUserId(fresh.users[0].id);
  }, [db.users]);

  const register = useCallback(
    (payload: {
      fullName: string;
      email: string;
      password: string;
      major: string;
      academicYear: string;
    }): { ok: boolean; error?: string } => {
      const normalized = payload.email.trim().toLowerCase();
      if (db.users.some((u) => u.email.toLowerCase() === normalized)) {
        return { ok: false, error: 'An account with this email already exists in local storage.' };
      }
      const userId = generateId('user');
      const newUser: User = {
        id: userId,
        email: normalized,
        passwordDigest: hashPrototypePassword(payload.password),
        createdAt: new Date().toISOString(),
      };
      const newProfile: StudentProfile = {
        id: generateId('profile'),
        userId,
        fullName: payload.fullName.trim(),
        major: payload.major.trim() || 'General Studies',
        academicYear: payload.academicYear.trim() || 'Undergraduate',
        avatarUrl: '',
        dailyGoalHours: 3,
      };
      // Seed one starter course so the student immediately sees how course linking works
      const starterCourseId = generateId('course');
      const starterCourse: Course = {
        id: starterCourseId,
        userId,
        code: 'STUDY 101',
        name: 'Core Study Foundations',
        description: 'Your starter course space. Edit this course or create courses for your active classes.',
        color: '#2563EB',
        targetHoursPerWeek: 4,
        createdAt: new Date().toISOString(),
      };

      setDb((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        studentProfiles: [...prev.studentProfiles, newProfile],
        courses: [...prev.courses, starterCourse],
      }));
      setSessionUserId(userId);
      return { ok: true };
    },
    [db.users]
  );

  const logout = useCallback(() => {
    setSessionUserId(null);
  }, []);

  const getCourseById = useCallback(
    (courseId: string) => courses.find((c) => c.id === courseId),
    [courses]
  );

  const getCourseProgress = useCallback(
    (courseId: string): CourseProgressSummary => {
      const courseTasks = assignments.filter((a) => a.courseId === courseId);
      const completedTasks = courseTasks.filter((a) => a.completed).length;
      const totalTasks = courseTasks.length;
      const taskCompletionPercent =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const upcomingExams = exams.filter(
        (e) => e.courseId === courseId && e.status === 'upcoming'
      ).length;

      const courseQuizzes = quizzes.filter((q) => q.courseId === courseId);
      const courseAttempts = quizAttempts.filter((a) => a.courseId === courseId);
      const averageQuizScore =
        courseAttempts.length > 0
          ? Math.round(
              courseAttempts.reduce((sum, a) => sum + a.percentage, 0) / courseAttempts.length
            )
          : null;

      const studyMinutes = studySessions
        .filter((s) => s.courseId === courseId)
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      return {
        courseId,
        totalTasks,
        completedTasks,
        taskCompletionPercent,
        upcomingExams,
        quizCount: courseQuizzes.length,
        attemptCount: courseAttempts.length,
        averageQuizScore,
        studyMinutes,
      };
    },
    [assignments, exams, quizzes, quizAttempts, studySessions]
  );

  const getQuizQuestions = useCallback(
    (quizId: string) => quizQuestions.filter((q) => q.quizId === quizId),
    [quizQuestions]
  );

  const getQuizAttempts = useCallback(
    (quizId: string) => quizAttempts.filter((a) => a.quizId === quizId),
    [quizAttempts]
  );

  const addCourse = useCallback(
    (data: Omit<Course, 'id' | 'userId' | 'createdAt'>) => {
      if (!currentUser) return null;
      const created: Course = {
        ...data,
        id: generateId('course'),
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      setDb((prev) => ({ ...prev, courses: [...prev.courses, created] }));
      return created;
    },
    [currentUser]
  );

  const updateCourse = useCallback(
    (courseId: string, data: Partial<Omit<Course, 'id' | 'userId' | 'createdAt'>>) => {
      setDb((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => (c.id === courseId ? { ...c, ...data } : c)),
      }));
    },
    []
  );

  const deleteCourse = useCallback((courseId: string) => {
    setDb((prev) => {
      const removedQuizIds = new Set(
        prev.quizzes.filter((q) => q.courseId === courseId).map((q) => q.id)
      );
      return {
        ...prev,
        courses: prev.courses.filter((c) => c.id !== courseId),
        assignments: prev.assignments.filter((a) => a.courseId !== courseId),
        exams: prev.exams.filter((e) => e.courseId !== courseId),
        quizzes: prev.quizzes.filter((q) => q.courseId !== courseId),
        quizQuestions: prev.quizQuestions.filter((qq) => !removedQuizIds.has(qq.quizId)),
        quizAttempts: prev.quizAttempts.filter((att) => att.courseId !== courseId),
        studySessions: prev.studySessions.filter((s) => s.courseId !== courseId),
        timetableBlocks: prev.timetableBlocks.filter((b) => b.courseId !== courseId),
      };
    });
  }, []);

  const addAssignment = useCallback(
    (data: {
      courseId: string;
      title: string;
      description: string;
      dueDate: string;
      dueTime: string;
      priority: PriorityLevel;
    }) => {
      if (!currentUser) return null;
      const created: Assignment = {
        ...data,
        id: generateId('task'),
        userId: currentUser.id,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };
      setDb((prev) => ({ ...prev, assignments: [created, ...prev.assignments] }));
      return created;
    },
    [currentUser]
  );

  const updateAssignment = useCallback(
    (assignmentId: string, data: Partial<Omit<Assignment, 'id' | 'userId' | 'createdAt'>>) => {
      setDb((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) => (a.id === assignmentId ? { ...a, ...data } : a)),
      }));
    },
    []
  );

  const toggleAssignment = useCallback((assignmentId: string) => {
    setDb((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        const nextCompleted = !a.completed;
        return {
          ...a,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : null,
        };
      }),
    }));
  }, []);

  const deleteAssignment = useCallback((assignmentId: string) => {
    setDb((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.id !== assignmentId),
    }));
  }, []);

  const addExam = useCallback(
    (data: Omit<Exam, 'id' | 'userId' | 'createdAt' | 'status'>) => {
      if (!currentUser) return null;
      const created: Exam = {
        ...data,
        id: generateId('exam'),
        userId: currentUser.id,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      };
      setDb((prev) => ({ ...prev, exams: [...prev.exams, created] }));
      return created;
    },
    [currentUser]
  );

  const updateExam = useCallback(
    (examId: string, data: Partial<Omit<Exam, 'id' | 'userId' | 'createdAt'>>) => {
      setDb((prev) => ({
        ...prev,
        exams: prev.exams.map((e) => (e.id === examId ? { ...e, ...data } : e)),
      }));
    },
    []
  );

  const toggleExamStatus = useCallback((examId: string) => {
    setDb((prev) => ({
      ...prev,
      exams: prev.exams.map((e) =>
        e.id === examId
          ? { ...e, status: e.status === 'upcoming' ? 'completed' : 'upcoming' }
          : e
      ),
    }));
  }, []);

  const deleteExam = useCallback((examId: string) => {
    setDb((prev) => ({
      ...prev,
      exams: prev.exams.filter((e) => e.id !== examId),
    }));
  }, []);

  const saveQuiz = useCallback(
    (data: {
      quizId?: string;
      courseId: string;
      title: string;
      description: string;
      questions: QuizQuestionDraft[];
    }) => {
      if (!currentUser) return null;
      const now = new Date().toISOString();
      const targetId = data.quizId || generateId('quiz');
      const existing = db.quizzes.find((q) => q.id === targetId);

      const savedQuiz: Quiz = {
        id: targetId,
        userId: currentUser.id,
        courseId: data.courseId,
        title: data.title.trim(),
        description: data.description.trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      const savedQuestions: QuizQuestion[] = data.questions.map((q) => ({
        id: q.id || generateId('qq'),
        quizId: targetId,
        prompt: q.prompt.trim(),
        options: [
          q.options[0].trim(),
          q.options[1].trim(),
          q.options[2].trim(),
          q.options[3].trim(),
        ],
        correctIndex: q.correctIndex,
        explanation: q.explanation.trim(),
      }));

      setDb((prev) => ({
        ...prev,
        quizzes: existing
          ? prev.quizzes.map((q) => (q.id === targetId ? savedQuiz : q))
          : [savedQuiz, ...prev.quizzes],
        quizQuestions: [
          ...prev.quizQuestions.filter((qq) => qq.quizId !== targetId),
          ...savedQuestions,
        ],
        // Keep attempt courseIds synchronized if quiz course changed
        quizAttempts: prev.quizAttempts.map((att) =>
          att.quizId === targetId ? { ...att, courseId: data.courseId } : att
        ),
      }));

      return savedQuiz;
    },
    [currentUser, db.quizzes]
  );

  const deleteQuiz = useCallback((quizId: string) => {
    setDb((prev) => ({
      ...prev,
      quizzes: prev.quizzes.filter((q) => q.id !== quizId),
      quizQuestions: prev.quizQuestions.filter((qq) => qq.quizId !== quizId),
      quizAttempts: prev.quizAttempts.filter((att) => att.quizId !== quizId),
    }));
  }, []);

  const submitQuizAttempt = useCallback(
    (quizId: string, answers: number[]) => {
      if (!currentUser) return null;
      const quiz = db.quizzes.find((q) => q.id === quizId);
      if (!quiz) return null;
      const questions = db.quizQuestions.filter((qq) => qq.quizId === quizId);
      if (questions.length === 0) return null;

      let score = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctIndex) {
          score += 1;
        }
      });

      const attempt: QuizAttempt = {
        id: generateId('attempt'),
        userId: currentUser.id,
        courseId: quiz.courseId,
        quizId: quiz.id,
        answers,
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        completedAt: new Date().toISOString(),
      };

      setDb((prev) => ({
        ...prev,
        quizAttempts: [attempt, ...prev.quizAttempts],
      }));

      return attempt;
    },
    [currentUser, db.quizzes, db.quizQuestions]
  );

  const addStudySession = useCallback(
    (data: {
      courseId: string;
      title: string;
      durationMinutes: number;
      source: 'focus_timer' | 'manual';
      startedAt?: string;
    }) => {
      if (!currentUser) return null;
      const created: StudySession = {
        id: generateId('sess'),
        userId: currentUser.id,
        courseId: data.courseId,
        title: data.title.trim(),
        durationMinutes: Math.max(1, Math.round(data.durationMinutes)),
        startedAt: data.startedAt || new Date().toISOString(),
        source: data.source,
      };
      setDb((prev) => ({ ...prev, studySessions: [created, ...prev.studySessions] }));
      return created;
    },
    [currentUser]
  );

  const deleteStudySession = useCallback((sessionId: string) => {
    setDb((prev) => ({
      ...prev,
      studySessions: prev.studySessions.filter((s) => s.id !== sessionId),
    }));
  }, []);

  const addTimetableBlock = useCallback(
    (data: Omit<TimetableBlock, 'id' | 'userId'>) => {
      if (!currentUser) return null;
      const created: TimetableBlock = {
        ...data,
        id: generateId('tt'),
        userId: currentUser.id,
      };
      setDb((prev) => ({ ...prev, timetableBlocks: [...prev.timetableBlocks, created] }));
      return created;
    },
    [currentUser]
  );

  const updateTimetableBlock = useCallback(
    (blockId: string, data: Partial<Omit<TimetableBlock, 'id' | 'userId'>>) => {
      setDb((prev) => ({
        ...prev,
        timetableBlocks: prev.timetableBlocks.map((b) =>
          b.id === blockId ? { ...b, ...data } : b
        ),
      }));
    },
    []
  );

  const deleteTimetableBlock = useCallback((blockId: string) => {
    setDb((prev) => ({
      ...prev,
      timetableBlocks: prev.timetableBlocks.filter((b) => b.id !== blockId),
    }));
  }, []);

  const replaceTimetableBlocks = useCallback(
    (blocks: Array<Omit<TimetableBlock, 'id' | 'userId'>>) => {
      if (!currentUser) return;
      const nextBlocks: TimetableBlock[] = blocks.map((b) => ({
        ...b,
        id: generateId('tt'),
        userId: currentUser.id,
      }));
      setDb((prev) => ({
        ...prev,
        timetableBlocks: [
          ...prev.timetableBlocks.filter((b) => b.userId !== currentUser.id),
          ...nextBlocks,
        ],
      }));
    },
    [currentUser]
  );

  const submitContactMessage = useCallback(
    (data: { name: string; email: string; subject: string; message: string }) => {
      const created: ContactMessage = {
        id: generateId('msg'),
        name: data.name.trim(),
        email: data.email.trim(),
        subject: data.subject.trim() || 'General Inquiry',
        message: data.message.trim(),
        createdAt: new Date().toISOString(),
        read: false,
      };
      setDb((prev) => ({
        ...prev,
        contactMessages: [created, ...prev.contactMessages],
      }));
      return created;
    },
    []
  );

  const markContactMessageRead = useCallback((messageId: string, read = true) => {
    setDb((prev) => ({
      ...prev,
      contactMessages: prev.contactMessages.map((m) =>
        m.id === messageId ? { ...m, read } : m
      ),
    }));
  }, []);

  const deleteContactMessage = useCallback((messageId: string) => {
    setDb((prev) => ({
      ...prev,
      contactMessages: prev.contactMessages.filter((m) => m.id !== messageId),
    }));
  }, []);

  const resetDemoWorkspace = useCallback(() => {
    const fresh = createInitialSeedDatabase();
    setDb(fresh);
    setSessionUserId(fresh.users[0].id);
  }, []);

  const value: StudyContextValue = {
    currentUser,
    currentProfile,
    courses,
    assignments,
    exams,
    quizzes,
    quizQuestions,
    quizAttempts,
    studySessions,
    timetableBlocks,
    contactMessages,
    login,
    loginDemo,
    register,
    logout,
    getCourseById,
    getCourseProgress,
    getQuizQuestions,
    getQuizAttempts,
    addCourse,
    updateCourse,
    deleteCourse,
    addAssignment,
    updateAssignment,
    toggleAssignment,
    deleteAssignment,
    addExam,
    updateExam,
    toggleExamStatus,
    deleteExam,
    saveQuiz,
    deleteQuiz,
    submitQuizAttempt,
    addStudySession,
    deleteStudySession,
    addTimetableBlock,
    updateTimetableBlock,
    deleteTimetableBlock,
    replaceTimetableBlocks,
    submitContactMessage,
    markContactMessageRead,
    deleteContactMessage,
    resetDemoWorkspace,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return ctx;
}

export { DEMO_USER_EMAIL, DEMO_USER_PASSWORD };
