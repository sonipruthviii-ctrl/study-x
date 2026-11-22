import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'studyx-ai' });
  });

  app.post('/api/ai/generate-quiz', async (req, res) => {
    try {
      const { courseName, courseDescription, topic, questionCount = 5 } = req.body ?? {};
      if (!courseName || typeof courseName !== 'string' || !topic || typeof topic !== 'string') {
        res.status(400).json({ error: 'Please provide both a course name and a quiz topic.' });
        return;
      }

      const clampedCount = Math.min(Math.max(Number(questionCount) || 5, 2), 10);
      const ai = getGeminiClient();

      const prompt = [
        `Create a university-level multiple-choice quiz for the course "${courseName.trim()}".`,
        courseDescription ? `Course context: ${String(courseDescription).trim()}` : '',
        `Focus topic: ${topic.trim()}`,
        `Generate exactly ${clampedCount} distinct, well-crafted multiple-choice questions.`,
        `Each question must have exactly 4 plausible options, a 0-based correctIndex (0, 1, 2, or 3), and a concise 1-sentence explanation of why the correct option is right.`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert academic assessment designer for STUDYX AI. Produce accurate, unambiguous multiple-choice questions strictly matching the requested JSON schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Concise, descriptive quiz title.',
              },
              description: {
                type: Type.STRING,
                description: 'Short 1-sentence summary of what the quiz tests.',
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    prompt: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                  },
                  required: ['prompt', 'options', 'correctIndex', 'explanation'],
                },
              },
            },
            required: ['title', 'description', 'questions'],
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: 'The AI returned an empty response. Please try again.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        title: string;
        description: string;
        questions: Array<{
          prompt: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        }>;
      };

      const sanitizedQuestions = (parsed.questions || [])
        .filter((q) => q && typeof q.prompt === 'string' && Array.isArray(q.options) && q.options.length >= 4)
        .map((q) => ({
          prompt: q.prompt.trim(),
          options: q.options.slice(0, 4).map((o) => String(o).trim()),
          correctIndex: Math.min(Math.max(Number(q.correctIndex) || 0, 0), 3),
          explanation: String(q.explanation || '').trim(),
        }));

      if (sanitizedQuestions.length === 0) {
        res.status(502).json({ error: 'Could not extract valid multiple-choice questions. Please try again.' });
        return;
      }

      res.json({
        title: parsed.title?.trim() || `${topic.trim()} Practice Quiz`,
        description: parsed.description?.trim() || `Practice assessment covering ${topic.trim()}.`,
        questions: sanitizedQuestions,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate quiz with AI.';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/ai/generate-timetable', async (req, res) => {
    try {
      const {
        courses = [],
        upcomingExams = [],
        pendingAssignments = [],
        dailyHours = 3,
        preferredWindow = 'afternoon',
      } = req.body ?? {};

      if (!Array.isArray(courses) || courses.length === 0) {
        res.status(400).json({ error: 'Add at least one course before generating a smart timetable.' });
        return;
      }

      const ai = getGeminiClient();

      const courseListText = courses
        .map((c: { id: string; code?: string; name: string; targetHoursPerWeek?: number }) =>
          `- id: "${c.id}", name: "${c.code ? `${c.code} ${c.name}` : c.name}", targetHoursPerWeek: ${c.targetHoursPerWeek || 4}`
        )
        .join('\n');

      const examText =
        Array.isArray(upcomingExams) && upcomingExams.length > 0
          ? upcomingExams
              .map((e: { title: string; courseName?: string; examDate: string }) => `- ${e.title} (${e.courseName || 'Course'}) on ${e.examDate}`)
              .join('\n')
          : 'None scheduled';

      const taskText =
        Array.isArray(pendingAssignments) && pendingAssignments.length > 0
          ? pendingAssignments
              .slice(0, 8)
              .map((t: { title: string; priority: string; dueDate: string }) => `- ${t.title} [priority: ${t.priority}, due: ${t.dueDate}]`)
              .join('\n')
          : 'None pending';

      const windowHint =
        preferredWindow === 'morning'
          ? 'primarily between 08:00 and 13:00'
          : preferredWindow === 'evening'
            ? 'primarily between 17:00 and 21:30'
            : 'primarily between 13:00 and 18:30';

      const prompt = [
        `Design a balanced 7-day student study timetable (dayOfWeek 0 = Sunday, 1 = Monday ... 6 = Saturday).`,
        `Target about ${Math.min(Math.max(Number(dailyHours) || 3, 1), 8)} hours of focused study per day, scheduled ${windowHint}.`,
        `Prioritize courses that have upcoming exams or high-priority assignments.`,
        `Ensure NO overlapping blocks on the same day. Use 24-hour HH:MM format (e.g., "09:00", "10:30").`,
        `Return between 8 and 14 realistic study blocks across the week.`,
        `Courses (you MUST use exact courseId values from this list):`,
        courseListText,
        `Upcoming Exams:`,
        examText,
        `Pending Assignments:`,
        taskText,
      ].join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an academic study planner for STUDYX AI. Create realistic, non-overlapping weekly study schedules strictly matching the requested JSON schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Brief 1-sentence rationale explaining how the schedule balances priorities.',
              },
              blocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    courseId: { type: Type.STRING },
                    dayOfWeek: { type: Type.INTEGER },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    title: { type: Type.STRING },
                    type: { type: Type.STRING },
                  },
                  required: ['courseId', 'dayOfWeek', 'startTime', 'endTime', 'title', 'type'],
                },
              },
            },
            required: ['summary', 'blocks'],
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: 'The AI returned an empty schedule. Please try again.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        summary: string;
        blocks: Array<{
          courseId: string;
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          title: string;
          type: string;
        }>;
      };

      const validCourseIds = new Set(courses.map((c: { id: string }) => c.id));
      const fallbackCourseId = courses[0].id;
      const validTypes = new Set(['study', 'lecture', 'review']);

      const sanitizedBlocks = (parsed.blocks || [])
        .filter((b) => b && typeof b.title === 'string' && typeof b.startTime === 'string' && typeof b.endTime === 'string')
        .map((b) => ({
          courseId: validCourseIds.has(b.courseId) ? b.courseId : fallbackCourseId,
          dayOfWeek: Math.min(Math.max(Number(b.dayOfWeek) || 1, 0), 6),
          startTime: b.startTime.slice(0, 5),
          endTime: b.endTime.slice(0, 5),
          title: b.title.trim(),
          type: (validTypes.has(b.type) ? b.type : 'study') as 'study' | 'lecture' | 'review',
        }));

      if (sanitizedBlocks.length === 0) {
        res.status(502).json({ error: 'Could not generate valid timetable blocks. Please try again.' });
        return;
      }

      res.json({
        summary: parsed.summary?.trim() || 'Balanced weekly plan aligned with your active courses and deadlines.',
        blocks: sanitizedBlocks,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate timetable with AI.';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`STUDYX AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
