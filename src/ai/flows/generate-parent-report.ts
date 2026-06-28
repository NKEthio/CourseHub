'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParentReportInputSchema = z.object({
  studentName: z.string(),
  recentActivity: z.array(z.object({
    type: z.enum(['lesson', 'project']),
    title: z.string(),
    status: z.string(),
    feedback: z.string().optional(),
  })),
  skills: z.array(z.object({
    name: z.string(),
    improvement: z.number(), // percentage improvement
    currentLevel: z.number(),
  })),
});

export type ParentReportInput = z.infer<typeof ParentReportInputSchema>;

const ParentReportOutputSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  areasToImprove: z.array(z.string()),
  activityLevel: z.enum(['low', 'medium', 'high']),
  metrics: z.object({
    lessonsCompleted: z.number(),
    projectsSubmitted: z.number(),
    averageImprovement: z.number(),
  }),
});

export type ParentReportOutput = z.infer<typeof ParentReportOutputSchema>;

export async function generateParentReport(input: ParentReportInput): Promise<ParentReportOutput> {
  return generateParentReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateParentReportPrompt',
  input: { schema: ParentReportInputSchema },
  output: { schema: ParentReportOutputSchema },
  prompt: `You are an AI Progress Analyzer on the EduVerse platform.
  Your task is to generate a weekly progress report for a parent about their child's learning journey.

  Student: {{studentName}}

  Recent Activity:
  {{#each recentActivity}}
  - {{type}}: {{title}} ({{status}}) {{#if feedback}}Feedback: {{feedback}}{{/if}}
  {{/each}}

  Skills Progress:
  {{#each skills}}
  - {{name}}: {{currentLevel}}% (+{{improvement}}%)
  {{/each}}

  Based on this data, write a warm, encouraging, and informative report.
  - Summary: A 2-3 sentence overview of the week.
  - Strengths: 2-3 specific areas where the student excelled.
  - Areas to Improve: 1-2 specific suggestions for growth.
  - Activity Level: Determine if it was low, medium, or high based on completions.
  - Metrics: Calculate totals from the provided activity.`,
});

const generateParentReportFlow = ai.defineFlow(
  {
    name: 'generateParentReportFlow',
    inputSchema: ParentReportInputSchema,
    outputSchema: ParentReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
