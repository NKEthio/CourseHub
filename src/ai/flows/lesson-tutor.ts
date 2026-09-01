'use server';

// GenKit disabled / reserved for further improvement
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const LessonTutorInputSchema = z.object({
  lessonTitle: z.string().describe('The title of the current lesson or project.'),
  lessonContent: z.string().describe('The content or instructions of the current lesson or project.'),
  query: z.string().describe('The student\'s question about the lesson.'),
  history: z.array(MessageSchema).optional().describe('Previous messages in the conversation.'),
});

export type LessonTutorInput = z.infer<typeof LessonTutorInputSchema>;

const LessonTutorOutputSchema = z.object({
  answer: z.string().describe('The AI tutor\'s response to the student.'),
});

export type LessonTutorOutput = z.infer<typeof LessonTutorOutputSchema>;

export async function lessonTutor(input: LessonTutorInput): Promise<LessonTutorOutput> {
  // GenKit disabled / reserved for further improvement
  return {
    answer: `Regarding "${input.lessonTitle}": Here is a tip to help answer your question: review the main concepts in the lesson material for guidance on "${input.query}".`,
  };
}
