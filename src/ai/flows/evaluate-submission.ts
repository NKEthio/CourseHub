'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateSubmissionInputSchema = z.object({
  projectTitle: z.string(),
  projectInstructions: z.string(),
  submissionContent: z.string(),
});

export type EvaluateSubmissionInput = z.infer<typeof EvaluateSubmissionInputSchema>;

const EvaluateSubmissionOutputSchema = z.object({
  correctness: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  feedback: z.string(),
  suggestions: z.array(z.string()),
});

export type EvaluateSubmissionOutput = z.infer<typeof EvaluateSubmissionOutputSchema>;

export async function evaluateSubmission(input: EvaluateSubmissionInput): Promise<EvaluateSubmissionOutput> {
  return evaluateSubmissionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateSubmissionPrompt',
  input: {schema: EvaluateSubmissionInputSchema},
  output: {schema: EvaluateSubmissionOutputSchema},
  prompt: `You are an AI Evaluator on the EduVerse platform.
  Your role is to review student submissions and provide structured feedback.

  Project: {{projectTitle}}
  Instructions: {{projectInstructions}}
  Student Submission: {{submissionContent}}

  Analyze the submission for:
  1. Correctness: How well it follows instructions and meets goals.
  2. Clarity: How well-explained or well-structured the work is.
  3. Improvement: Provide actionable suggestions for growth.

  Be encouraging but precise.`,
});

const evaluateSubmissionFlow = ai.defineFlow(
  {
    name: 'evaluateSubmissionFlow',
    inputSchema: EvaluateSubmissionInputSchema,
    outputSchema: EvaluateSubmissionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
