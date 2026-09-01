'use server';

/**
 * @fileOverview An AI agent that suggests relevant readings for a given lesson.
 * GenKit disabled / reserved for further improvement.
 */

import { z } from 'zod';

const SuggestReadingsInputSchema = z.object({
  lessonTitle: z.string().describe('The title of the lesson.'),
  lessonContent: z.string().describe('The content of the lesson.'),
  courseTitle: z.string().describe('The title of the course.'),
});
export type SuggestReadingsInput = z.infer<typeof SuggestReadingsInputSchema>;

const SuggestReadingsOutputSchema = z.object({
  suggestedReadings: z
    .array(z.string())
    .describe('An array of suggested readings (articles, videos, etc.) to complement the lesson.'),
});
export type SuggestReadingsOutput = z.infer<typeof SuggestReadingsOutputSchema>;

export async function suggestReadings(input: SuggestReadingsInput): Promise<SuggestReadingsOutput> {
  // GenKit disabled / reserved for further improvement
  return {
    suggestedReadings: [
      `Supplementary overview for ${input.lessonTitle}`,
      `Practice resources and reference documentation for ${input.courseTitle}`,
    ],
  };
}
