'use server';

/**
 * @fileOverview An AI flow that generates a quiz for a given lesson.
 * GenKit disabled / reserved for further improvement.
 */

import { z } from 'zod';

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

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  // GenKit disabled / reserved for further improvement
  return {
    quiz: [
      {
        questionText: `What is the key takeaway of "${input.lessonTitle}"?`,
        options: [
          { text: 'Understanding core principles and practice' },
          { text: 'Memorizing definitions without applying them' },
          { text: 'Skipping exercise questions' },
        ],
        correctOptionIndex: 0,
      },
    ],
  };
}
