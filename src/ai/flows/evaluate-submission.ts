'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateSubmissionInputSchema = z.object({
  projectTitle: z.string(),
  projectInstructions: z.string(),
  submissionContent: z.string(),
  previousFeedback: z.string().optional().describe('Feedback from the previous submission, if any.'),
});

export type EvaluateSubmissionInput = z.infer<typeof EvaluateSubmissionInputSchema>;

const EvaluateSubmissionOutputSchema = z.object({
  correctness: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  feedback: z.string(),
  suggestions: z.array(z.string()),
  skillImprovements: z.array(z.object({
    skillName: z.string(),
    points: z.number().min(1).max(10),
  })).optional().describe('1-3 specific skills improved by this submission.'),
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

  {{#if previousFeedback}}
  PREVIOUS FEEDBACK:
  """
  {{previousFeedback}}
  """
  Please evaluate if the student has addressed the issues raised in the previous feedback and highlight their improvement.
  {{/if}}

  Analyze the submission for:
  1. Correctness: How well it follows instructions and meets goals.
  2. Clarity: How well-explained or well-structured the work is.
  3. Improvement: Provide actionable suggestions for growth.
  4. Skill Growth: Identify 1-3 specific skills (e.g., Logic, Syntax, Design, UI/UX, Documentation, Problem Solving) the student demonstrated or improved in this submission. Award 1-10 points per skill based on the quality and complexity.

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
