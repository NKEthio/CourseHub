'use server';

// GenKit disabled / reserved for further improvement
import { z } from 'zod';

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
  // GenKit disabled / reserved for further improvement
  return {
    correctness: 85,
    clarity: 90,
    feedback: `Great work on "${input.projectTitle}"! Your submission demonstrates good structure and effort. Keep refining your work.`,
    suggestions: [
      'Double check edge cases in your implementation.',
      'Enhance formatting and code comments for better readability.'
    ],
    skillImprovements: [
      { skillName: 'Problem Solving', points: 5 },
      { skillName: 'Code Quality', points: 5 }
    ]
  };
}
