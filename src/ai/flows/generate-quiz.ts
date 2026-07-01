'use server';

/**
 * @fileOverview An AI flow that generates a quiz for a given lesson.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuizOptionSchema = z.object({
  text: z.string().describe('The text of the option.'),
});

const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  options: z.array(QuizOptionSchema).min(2).max(4).describe('The possible answers.'),
  correctOptionIndex: z.number().int().describe('The zero-based index of the correct option.'),
});

const GenerateQuizInputSchema = z.object({
  lessonTitle: z.string().describe('The title of the lesson.'),
  lessonContent: z.string().describe('The content of the lesson.'),
});

const GenerateQuizOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('An array of quiz questions generated from the lesson.'),
});

export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

const quizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an educational AI assistant that creates high-quality multiple-choice quizzes for students.

  Based on the following lesson content, generate a quiz with 3 to 5 questions that test the student's understanding of the key concepts.

  Each question should have 3 or 4 options, and only one correct answer.

  Lesson Title: {{{lessonTitle}}}
  Lesson Content: {{{lessonContent}}}

  Ensure the questions vary in difficulty and cover different aspects of the lesson.`,
});

export const generateQuiz = ai.defineFlow(
  {
    name: 'generateQuiz',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const { output } = await quizPrompt(input);
    if (!output) {
      throw new Error('Failed to generate quiz');
    }
    return output;
  }
);
