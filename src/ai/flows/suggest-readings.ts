'use server';

/**
 * @fileOverview An AI agent that suggests relevant readings for a given lesson.
 *
 * - suggestReadings - A function that suggests readings for a lesson.
 * - SuggestReadingsInput - The input type for the suggestReadings function.
 * - SuggestReadingsOutput - The return type for the suggestReadings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return suggestReadingsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReadingsPrompt',
  input: {schema: SuggestReadingsInputSchema},
  output: {schema: SuggestReadingsOutputSchema},
  prompt: `You are an AI assistant that suggests relevant readings (articles, videos, etc.) to complement a given lesson.

  Course Title: {{{courseTitle}}}
  Lesson Title: {{{lessonTitle}}}
  Lesson Content: {{{lessonContent}}}

  Please provide a list of suggested readings that would help the student deepen their understanding of the material.`,
});

const suggestReadingsFlow = ai.defineFlow(
  {
    name: 'suggestReadingsFlow',
    inputSchema: SuggestReadingsInputSchema,
    outputSchema: SuggestReadingsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
