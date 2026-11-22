export type PriorityLevel = 'low' | 'medium' | 'high';

export type WorkspaceSection =
  | 'dashboard'
  | 'courses'
  | 'assignments'
  | 'quizzes'
  | 'calendar'
  | 'exams'
  | 'focus'
  | 'timetable'
  | 'analytics';

export type PublicRoute = 'landing' | 'login' | 'register' | 'app';

export interface User {
  id: string;
  email: string;
  passwordDigest: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  major: string;
  academicYear: string;
  avatarUrl: string;
  dailyGoalHours: number;
}

export interface Course {
  id: string;
  userId: string;
  code: string;
  name: string;
  description: string;
  color: string;
  targetHoursPerWeek: number;
  createdAt: string;
}

export interface Assignment {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  priority: PriorityLevel;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface Exam {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number;
  location: string;
  weightPercent: number;
  notes: string;
  status: 'upcoming' | 'completed';
  createdAt: string;
}

export interface Quiz {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  courseId: string;
  quizId: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  durationMinutes: number;
  startedAt: string; // ISO string
  source: 'focus_timer' | 'manual';
}

export interface TimetableBlock {
  id: string;
  userId: string;
  courseId: string;
  dayOfWeek: number; // 0 = Sun ... 6 = Sat
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
  type: 'study' | 'lecture' | 'review';
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface StudyDatabase {
  version: number;
  users: User[];
  studentProfiles: StudentProfile[];
  courses: Course[];
  assignments: Assignment[];
  exams: Exam[];
  quizzes: Quiz[];
  quizQuestions: QuizQuestion[];
  quizAttempts: QuizAttempt[];
  studySessions: StudySession[];
  timetableBlocks: TimetableBlock[];
  contactMessages: ContactMessage[];
}
