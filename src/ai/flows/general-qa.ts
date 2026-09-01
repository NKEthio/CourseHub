'use server';

/**
 * @fileOverview A general purpose Q&A agent.
 * GenKit disabled / reserved for further improvement.
 */

import { z } from 'zod';

const GeneralQAInputSchema = z.object({
  query: z.string().describe('The user\'s question.'),
  availableCourses: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional().describe('A list of available courses on the platform to help provide better context and recommendations.'),
});
export type GeneralQAInput = z.infer<typeof GeneralQAInputSchema>;

const GeneralQAOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the user\'s question.'),
});
export type GeneralQAOutput = z.infer<typeof GeneralQAOutputSchema>;

export async function generalQA(input: GeneralQAInput): Promise<GeneralQAOutput> {
  // GenKit disabled / reserved for further improvement
  let responseText = `Thank you for asking: "${input.query}". EduVerse offers interactive courses and learning tracks to help you master new skills!`;
  if (input.availableCourses && input.availableCourses.length > 0) {
    responseText += ` Check out our featured course: ${input.availableCourses[0].title}.`;
  }
  return { answer: responseText };
}
