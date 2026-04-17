'use server';

/**
 * @fileOverview A general purpose Q&A agent.
 *
 * - generalQA - A function that answers a user's question.
 * - GeneralQAInput - The input type for the generalQA function.
 * - GeneralQAOutput - The return type for the generalQA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneralQAInputSchema = z.object({
  query: z.string().describe('The user\'s question.'),
});
export type GeneralQAInput = z.infer<typeof GeneralQAInputSchema>;

const GeneralQAOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the user\'s question.'),
});
export type GeneralQAOutput = z.infer<typeof GeneralQAOutputSchema>;


export async function generalQA(input: GeneralQAInput): Promise<GeneralQAOutput> {
  return generalQAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generalQAPrompt',
  input: {schema: GeneralQAInputSchema},
  output: {schema: GeneralQAOutputSchema},
  prompt: `You are a helpful AI assistant on an e-learning platform called EduVerse.
  A user will ask you a question. Your task is to provide a clear, concise, and helpful answer.

  User's question: "{{query}}"`,
});

const generalQAFlow = ai.defineFlow(
  {
    name: 'generalQAFlow',
    inputSchema: GeneralQAInputSchema,
    outputSchema: GeneralQAOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
