import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  History,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { type QuizQuestionDraft, useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import type { Quiz, QuizAttempt } from '../../types/studyx';
import { formatIsoTimestamp } from '../../utils/dateUtils';

interface QuizzesViewProps {
  initialCreateCourseId?: string | null;
  initialTakeQuizId?: string | null;
  onConsumeInitialIntent?: () => void;
}

type QuizScreen = 'list' | 'builder' | 'take' | 'result' | 'history';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function createBlankQuestion(): QuizQuestionDraft {
  return {
    prompt: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
  };
}

export function QuizzesView({
  initialCreateCourseId = null,
  initialTakeQuizId = null,
  onConsumeInitialIntent,
}: QuizzesViewProps) {
  const {
    courses,
    quizzes,
    quizAttempts,
    getCourseById,
    getQuizQuestions,
    getQuizAttempts,
    saveQuiz,
    deleteQuiz,
    submitQuizAttempt,
  } = useStudy();
  const { showToast } = useToast();

  const [screen, setScreen] = useState<QuizScreen>('list');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Builder state
  const [editingQuizId, setEditingQuizId] = useState<string | undefined>(undefined);
  const [builderCourseId, setBuilderCourseId] = useState<string>(courses[0]?.id || '');
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderQuestions, setBuilderQuestions] = useState<QuizQuestionDraft[]>([
    createBlankQuestion(),
  ]);
  const [builderError, setBuilderError] = useState<string | null>(null);

  // AI Quiz Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(4);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Interactive Quiz Runner state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);

  // Handle cross-view launch intents from CoursesView
  useEffect(() => {
    if (initialCreateCourseId) {
      setEditingQuizId(undefined);
      setBuilderCourseId(initialCreateCourseId);
      setBuilderTitle('');
      setBuilderDescription('');
      setBuilderQuestions([createBlankQuestion()]);
      setBuilderError(null);
      setAiError(null);
      setScreen('builder');
      onConsumeInitialIntent?.();
    } else if (initialTakeQuizId) {
      const questions = getQuizQuestions(initialTakeQuizId);
      if (questions.length > 0) {
        setActiveQuizId(initialTakeQuizId);
        setSelectedAnswers(new Array(questions.length).fill(-1));
        setCurrentQuestionIdx(0);
        setScreen('take');
      }
      onConsumeInitialIntent?.();
    }
  }, [initialCreateCourseId, initialTakeQuizId, getQuizQuestions, onConsumeInitialIntent]);

  const filteredQuizzes = useMemo(
    () =>
      courseFilter === 'all' ? quizzes : quizzes.filter((q) => q.courseId === courseFilter),
    [quizzes, courseFilter]
  );

  const courseQuizStats = useMemo(() => {
    return courses.map((course) => {
      const cQuizzes = quizzes.filter((q) => q.courseId === course.id);
      const cAttempts = quizAttempts.filter((a) => a.courseId === course.id);
      const avg =
        cAttempts.length > 0
          ? Math.round(cAttempts.reduce((s, a) => s + a.percentage, 0) / cAttempts.length)
          : null;
      return {
        course,
        quizCount: cQuizzes.length,
        attemptCount: cAttempts.length,
        avgScore: avg,
      };
    });
  }, [courses, quizzes, quizAttempts]);

  const openNewBuilder = (preselectedCourseId?: string) => {
    setEditingQuizId(undefined);
    setBuilderCourseId(preselectedCourseId || courses[0]?.id || '');
    setBuilderTitle('');
    setBuilderDescription('');
    setBuilderQuestions([createBlankQuestion()]);
    setBuilderError(null);
    setAiError(null);
    setAiTopic('');
    setScreen('builder');
  };

  const openEditBuilder = (quiz: Quiz) => {
    const questions = getQuizQuestions(quiz.id);
    setEditingQuizId(quiz.id);
    setBuilderCourseId(quiz.courseId);
    setBuilderTitle(quiz.title);
    setBuilderDescription(quiz.description);
    setBuilderQuestions(
      questions.length > 0
        ? questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            options: [...q.options] as [string, string, string, string],
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          }))
        : [createBlankQuestion()]
    );
    setBuilderError(null);
    setAiError(null);
    setScreen('builder');
  };

  const startQuiz = (quizId: string) => {
    const questions = getQuizQuestions(quizId);
    if (questions.length === 0) {
      showToast('Add at least one question before taking this quiz.', 'error');
      return;
    }
    setActiveQuizId(quizId);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setCurrentQuestionIdx(0);
    setScreen('take');
  };

  const openHistory = (quizId: string) => {
    setActiveQuizId(quizId);
    setScreen('history');
  };

  const handleGenerateWithAI = async () => {
    const selectedCourse = getCourseById(builderCourseId);
    if (!selectedCourse) {
      setAiError('Select a course first.');
      return;
    }
    if (!aiTopic.trim()) {
      setAiError('Enter a topic or chapter name so Gemini knows what to test.');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: `${selectedCourse.code} ${selectedCourse.name}`,
          courseDescription: selectedCourse.description,
          topic: aiTopic.trim(),
          questionCount: aiCount,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not generate quiz questions right now.');
      }

      if (!builderTitle.trim() && data.title) {
        setBuilderTitle(data.title);
      }
      if (!builderDescription.trim() && data.description) {
        setBuilderDescription(data.description);
      }
      const generated: QuizQuestionDraft[] = (data.questions || []).map(
        (q: {
          prompt: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        }) => ({
          prompt: q.prompt,
          options: [q.options[0], q.options[1], q.options[2], q.options[3]],
          correctIndex: Math.min(Math.max(Number(q.correctIndex) || 0, 0), 3) as 0 | 1 | 2 | 3,
          explanation: q.explanation || '',
        })
      );

      if (generated.length === 0) {
        throw new Error('No valid questions were returned. Please try another topic.');
      }

      // Replace blank initial question or append to existing drafted questions
      const hasOnlyBlank =
        builderQuestions.length === 1 &&
        !builderQuestions[0].prompt.trim() &&
        builderQuestions[0].options.every((o) => !o.trim());

      setBuilderQuestions(hasOnlyBlank ? generated : [...builderQuestions, ...generated]);
      showToast(`Drafted ${generated.length} questions with Gemini AI. Review and save!`, 'success');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI quiz generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    setBuilderError(null);

    if (!builderCourseId || !courses.some((c) => c.id === builderCourseId)) {
      setBuilderError('Please select a valid course for this quiz.');
      return;
    }
    if (!builderTitle.trim()) {
      setBuilderError('Please enter a quiz title.');
      return;
    }
    if (builderQuestions.length === 0) {
      setBuilderError('Add at least one multiple-choice question.');
      return;
    }

    for (let i = 0; i < builderQuestions.length; i += 1) {
      const q = builderQuestions[i];
      if (!q.prompt.trim()) {
        setBuilderError(`Question ${i + 1} needs a question prompt.`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setBuilderError(`Question ${i + 1} must have all 4 answer options filled in.`);
        return;
      }
    }

    saveQuiz({
      quizId: editingQuizId,
      courseId: builderCourseId,
      title: builderTitle,
      description: builderDescription,
      questions: builderQuestions,
    });

    showToast(editingQuizId ? 'Quiz updated and saved.' : 'Quiz created and linked to course!', 'success');
    setScreen('list');
  };

  const updateQuestionField = (
    idx: number,
    updater: (q: QuizQuestionDraft) => QuizQuestionDraft
  ) => {
    setBuilderQuestions((prev) => prev.map((item, i) => (i === idx ? updater(item) : item)));
  };

  const handleSubmitAttempt = () => {
    if (!activeQuizId) return;
    const unansweredCount = selectedAnswers.filter((a) => a === -1).length;
    if (unansweredCount > 0) {
      showToast(
        `Please answer all questions (${unansweredCount} remaining) before submitting.`,
        'error'
      );
      return;
    }
    const attempt = submitQuizAttempt(activeQuizId, selectedAnswers);
    if (attempt) {
      setLatestAttempt(attempt);
      setScreen('result');
      showToast(`Quiz graded: ${attempt.score}/${attempt.totalQuestions} (${attempt.percentage}%)`, 'success');
    }
  };

  // === BUILDER SCREEN ===
  if (screen === 'builder') {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setScreen('list')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quizzes
          </button>
        </div>

        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-950 dark:text-white">
            {editingQuizId ? 'Edit Course Quiz' : 'Create Course Quiz'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Link this quiz to a course, craft 4-option multiple-choice questions, or draft starter
            questions with AI.
          </p>
        </div>

        {/* Optional AI Quiz Generator Panel */}
        <div className="p-5 sm:p-6 rounded-2xl border border-blue-500/30 bg-blue-50/70 dark:bg-[#0D1E42]/80 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl studyx-gradient-btn text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base text-slate-950 dark:text-white">
                Optional AI Question Generator
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                Enter a topic for the selected course and generate editable 4-option questions with
                explanations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g., Dynamic programming state transitions, SVD, or Memory consolidation"
              className="sm:col-span-7 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#243E73] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              aria-label="Number of questions to generate"
              value={aiCount}
              onChange={(e) => setAiCount(Number(e.target.value))}
              className="sm:col-span-2 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#243E73] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>3 Qs</option>
              <option value={4}>4 Qs</option>
              <option value={5}>5 Qs</option>
              <option value={6}>6 Qs</option>
            </select>
            <button
              type="button"
              disabled={aiLoading || courses.length === 0}
              onClick={handleGenerateWithAI}
              className="sm:col-span-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn disabled:opacity-60 whitespace-nowrap"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Drafting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{aiError} You can still add and edit questions manually below.</span>
            </div>
          )}
        </div>

        {/* Manual / Editable Quiz Form */}
        <form onSubmit={handleSaveQuiz} className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Linked Course
                </label>
                <select
                  value={builderCourseId}
                  onChange={(e) => setBuilderCourseId(e.target.value)}
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
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={builderTitle}
                  onChange={(e) => setBuilderTitle(e.target.value)}
                  placeholder="Midterm Review: Graph Algorithms"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description (optional)
              </label>
              <input
                type="text"
                value={builderDescription}
                onChange={(e) => setBuilderDescription(e.target.value)}
                placeholder="Brief note on topics covered in this quiz"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            {builderQuestions.map((question, qIndex) => (
              <div
                key={qIndex}
                className="p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-blue-600 dark:text-sky-400">
                    Question {qIndex + 1}
                  </span>
                  {builderQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setBuilderQuestions((prev) => prev.filter((_, idx) => idx !== qIndex))
                      }
                      className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Question Prompt
                  </label>
                  <textarea
                    rows={2}
                    value={question.prompt}
                    onChange={(e) =>
                      updateQuestionField(qIndex, (q) => ({ ...q, prompt: e.target.value }))
                    }
                    placeholder="Write your multiple-choice question here..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Answer Options (select the correct answer)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {OPTION_LETTERS.map((letter, optIdx) => {
                      const isCorrect = question.correctIndex === optIdx;
                      return (
                        <div
                          key={letter}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border transition-colors ${
                            isCorrect
                              ? 'border-emerald-500/60 bg-emerald-500/10'
                              : 'border-slate-200 dark:border-[#233B6E] bg-white/70 dark:bg-[#081226]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestionField(qIndex, (q) => ({
                                ...q,
                                correctIndex: optIdx as 0 | 1 | 2 | 3,
                              }))
                            }
                            aria-label={`Mark option ${letter} as correct answer`}
                            className={`w-8 h-8 rounded-lg text-xs font-mono font-bold shrink-0 transition-colors ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-[#13254A] text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white'
                            }`}
                          >
                            {letter}
                          </button>
                          <input
                            type="text"
                            value={question.options[optIdx]}
                            onChange={(e) => {
                              const nextOptions = [...question.options] as [
                                string,
                                string,
                                string,
                                string,
                              ];
                              nextOptions[optIdx] = e.target.value;
                              updateQuestionField(qIndex, (q) => ({ ...q, options: nextOptions }));
                            }}
                            placeholder={`Option ${letter}`}
                            className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Answer Explanation (shown during post-quiz review)
                  </label>
                  <input
                    type="text"
                    value={question.explanation}
                    onChange={(e) =>
                      updateQuestionField(qIndex, (q) => ({ ...q, explanation: e.target.value }))
                    }
                    placeholder="Explain why the selected option is correct..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#233B6E] bg-white dark:bg-[#081226] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {builderError && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm">
              {builderError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setBuilderQuestions((prev) => [...prev, createBlankQuestion()])}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-300 dark:border-[#233B6E] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A]"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setScreen('list')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-md shadow-blue-600/20"
              >
                {editingQuizId ? 'Update Quiz' : 'Save Quiz'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // === INTERACTIVE QUIZ TAKER SCREEN ===
  if (screen === 'take' && activeQuizId) {
    const quiz = quizzes.find((q) => q.id === activeQuizId);
    const questions = getQuizQuestions(activeQuizId);
    const course = quiz ? getCourseById(quiz.courseId) : undefined;
    const currentQ = questions[currentQuestionIdx];

    if (!quiz || !currentQ) {
      setScreen('list');
      return null;
    }

    const answeredCount = selectedAnswers.filter((a) => a !== -1).length;
    const progressPct = Math.round(((currentQuestionIdx + 1) / questions.length) * 100);

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setScreen('list')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Quiz
          </button>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass space-y-6">
          <div>
            <p className="text-xs font-medium text-blue-600 dark:text-sky-400">
              {course ? `${course.code} · ${course.name}` : 'Course Quiz'}
            </p>
            <h1 className="mt-1 font-display font-bold text-xl sm:text-2xl text-slate-950 dark:text-white">
              {quiz.title}
            </h1>
            <div className="mt-4 w-full h-2 rounded-full bg-slate-200 dark:bg-[#14264A] overflow-hidden">
              <div
                className="h-full studyx-gradient-btn transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
              Question {currentQuestionIdx + 1} of {questions.length}
            </p>
            <h2 className="font-display font-semibold text-lg sm:text-xl text-slate-950 dark:text-white leading-snug">
              {currentQ.prompt}
            </h2>

            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQuestionIdx] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setSelectedAnswers((prev) =>
                        prev.map((val, qI) => (qI === currentQuestionIdx ? idx : val))
                      )
                    }
                    className={`w-full text-left p-4 rounded-xl border flex items-center gap-3.5 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600/12 dark:bg-blue-500/20 text-slate-950 dark:text-white'
                        : 'border-slate-200 dark:border-[#233B6E] bg-white/80 dark:bg-[#081226] text-slate-800 dark:text-slate-200 hover:border-blue-400 dark:hover:border-sky-500'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-[#13254A] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {OPTION_LETTERS[idx]}
                    </span>
                    <span className="text-sm sm:text-base">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Stepper Pills & Nav Controls */}
          <div className="pt-5 border-t border-slate-200 dark:border-[#182B52] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
              {questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentQuestionIdx(i)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-colors ${
                    i === currentQuestionIdx
                      ? 'bg-blue-600 text-white'
                      : selectedAnswers[i] !== -1
                        ? 'bg-blue-600/15 text-blue-700 dark:text-sky-300'
                        : 'bg-slate-100 dark:bg-[#13254A] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              {currentQuestionIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIdx((i) => Math.min(questions.length - 1, i + 1))
                  }
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white studyx-gradient-btn"
                >
                  Next Question
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitAttempt}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-md shadow-blue-600/20"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === RESULT & ANSWER REVIEW SCREEN ===
  if (screen === 'result' && activeQuizId && latestAttempt) {
    const quiz = quizzes.find((q) => q.id === activeQuizId);
    const questions = getQuizQuestions(activeQuizId);
    const course = quiz ? getCourseById(quiz.courseId) : undefined;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setScreen('list')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400"
          >
            <ArrowLeft className="w-4 h-4" />
            All Quizzes
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openHistory(activeQuizId)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-200"
            >
              <History className="w-4 h-4" />
              View All Attempts
            </button>
            <button
              type="button"
              onClick={() => startQuiz(activeQuizId)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white studyx-gradient-btn"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </button>
          </div>
        </div>

        {/* Score Summary Card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-medium text-blue-600 dark:text-sky-400">
              {course ? `${course.code} · ${course.name}` : 'Course Quiz'} · Graded Result
            </p>
            <h1 className="mt-1 font-display font-bold text-2xl sm:text-3xl text-slate-950 dark:text-white">
              {quiz?.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {latestAttempt.percentage >= 80
                ? 'Strong mastery! Review explanations below to lock in key concepts.'
                : 'Good practice run. Inspect the highlighted answers below and retake to improve your score.'}
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="font-mono font-bold text-4xl sm:text-5xl text-blue-600 dark:text-sky-400 tabular-nums">
              {latestAttempt.percentage}%
            </p>
            <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-300 tabular-nums">
              {latestAttempt.score} / {latestAttempt.totalQuestions} correct
            </p>
          </div>
        </div>

        {/* Question-by-Question Review */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const chosenIdx = latestAttempt.answers[idx];
            const isRight = chosenIdx === q.correctIndex;
            return (
              <div
                key={q.id}
                className="p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display font-semibold text-base text-slate-950 dark:text-white">
                    {idx + 1}. {q.prompt}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                      isRight
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isRight ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" /> Incorrect
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isCorrectOpt = optIdx === q.correctIndex;
                    const isChosenOpt = optIdx === chosenIdx;
                    let cls =
                      'border-slate-200 dark:border-[#1E3562] bg-white/60 dark:bg-[#081226] text-slate-700 dark:text-slate-300';
                    if (isCorrectOpt) {
                      cls =
                        'border-emerald-500/60 bg-emerald-500/12 text-emerald-900 dark:text-emerald-200 font-medium';
                    } else if (isChosenOpt && !isCorrectOpt) {
                      cls =
                        'border-rose-500/60 bg-rose-500/12 text-rose-900 dark:text-rose-200 font-medium';
                    }
                    return (
                      <div
                        key={optIdx}
                        className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 ${cls}`}
                      >
                        <span>
                          <span className="font-mono font-semibold mr-2">
                            {OPTION_LETTERS[optIdx]}.
                          </span>
                          {opt}
                        </span>
                        {isCorrectOpt && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                            Correct answer
                          </span>
                        )}
                        {isChosenOpt && !isCorrectOpt && (
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                            Your choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/80 dark:border-[#182B52]">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Explanation:
                    </span>{' '}
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // === ATTEMPT HISTORY SCREEN ===
  if (screen === 'history' && activeQuizId) {
    const quiz = quizzes.find((q) => q.id === activeQuizId);
    const course = quiz ? getCourseById(quiz.courseId) : undefined;
    const attempts = getQuizAttempts(activeQuizId);

    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setScreen('list')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400"
          >
            <ArrowLeft className="w-4 h-4" />
            All Quizzes
          </button>
          <button
            type="button"
            onClick={() => startQuiz(activeQuizId)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white studyx-gradient-btn"
          >
            <Play className="w-4 h-4" />
            Take Quiz Again
          </button>
        </div>

        <div>
          <p className="text-xs font-medium text-blue-600 dark:text-sky-400">
            {course ? `${course.code} · ${course.name}` : 'Course'} · Attempt History
          </p>
          <h1 className="mt-1 font-display font-bold text-2xl text-slate-950 dark:text-white">
            {quiz?.title}
          </h1>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass overflow-hidden">
          {attempts.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No attempts recorded for this quiz yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-[#182B52]">
              {attempts.map((att, index) => (
                <div
                  key={att.id}
                  className="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Attempt #{attempts.length - index}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {formatIsoTimestamp(att.completedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="font-mono text-base font-bold text-slate-950 dark:text-white tabular-nums">
                        {att.percentage}%
                      </p>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {att.score}/{att.totalQuestions} correct
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLatestAttempt(att);
                        setScreen('result');
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A]"
                    >
                      Review Answers
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === MAIN QUIZZES LIST SCREEN ===
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-950 dark:text-white">
            Course-Linked Quizzes
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Build 4-option multiple-choice quizzes for any course, test your recall, and track
            scores by subject.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNewBuilder(courseFilter !== 'all' ? courseFilter : undefined)}
          disabled={courses.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn shadow-sm shadow-blue-600/20 disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Quiz
        </button>
      </div>

      {/* Course Quiz Results Summary Strip */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {courseQuizStats.map(({ course, quizCount, attemptCount, avgScore }) => {
            const isSelected = courseFilter === course.id;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => setCourseFilter(isSelected ? 'all' : course.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600/10 dark:bg-blue-500/20'
                    : 'border-slate-200 dark:border-[#1B315E] studyx-glass hover:border-blue-400/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                    {course.code}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-950 dark:text-white tabular-nums">
                    {avgScore !== null ? `${avgScore}%` : '—'}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {course.name}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {quizCount} quiz{quizCount === 1 ? '' : 'zes'} · {attemptCount} attempt
                  {attemptCount === 1 ? '' : 's'}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Indicator */}
      {courseFilter !== 'all' && (
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>
            Showing quizzes for{' '}
            <strong className="text-slate-900 dark:text-white">
              {getCourseById(courseFilter)?.name}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setCourseFilter('all')}
            className="text-blue-600 dark:text-sky-400 font-medium hover:underline"
          >
            Show all courses
          </button>
        </div>
      )}

      {/* Quiz Cards */}
      {filteredQuizzes.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass text-center">
          <ClipboardCheck className="w-9 h-9 text-blue-600 dark:text-sky-400 mx-auto mb-3" />
          <h2 className="font-display font-semibold text-lg text-slate-950 dark:text-white">
            No quizzes found
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Create a custom quiz for any course or draft questions with Gemini AI to start testing
            your understanding.
          </p>
          <button
            type="button"
            disabled={courses.length === 0}
            onClick={() => openNewBuilder(courseFilter !== 'all' ? courseFilter : undefined)}
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white studyx-gradient-btn disabled:opacity-50"
          >
            Create First Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredQuizzes.map((quiz) => {
            const course = getCourseById(quiz.courseId);
            const qCount = getQuizQuestions(quiz.id).length;
            const attempts = getQuizAttempts(quiz.id);
            const latest = attempts[0];
            const best =
              attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null;

            return (
              <div
                key={quiz.id}
                className="p-6 rounded-2xl border border-slate-200 dark:border-[#1B315E] studyx-glass flex flex-col justify-between gap-5"
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
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditBuilder(quiz)}
                        aria-label={`Edit ${quiz.title}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14264A]"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteQuiz(quiz.id);
                          showToast('Quiz deleted.', 'info');
                        }}
                        aria-label={`Delete ${quiz.title}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h2 className="mt-2 font-display font-bold text-lg text-slate-950 dark:text-white">
                    {quiz.title}
                  </h2>
                  {quiz.description && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>{qCount} questions</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {attempts.length} attempt{attempts.length === 1 ? '' : 's'}
                    </span>
                    {best !== null && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Best {best}%
                        </span>
                      </>
                    )}
                    {latest && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Latest {latest.percentage}%</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/80 dark:border-[#182B52] flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => startQuiz(quiz.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white studyx-gradient-btn"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Take Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => openHistory(quiz.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-[#233B6E] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14264A]"
                  >
                    <History className="w-3.5 h-3.5" />
                    Previous Attempts ({attempts.length})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
