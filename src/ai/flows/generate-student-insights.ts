'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudentInsightsInputSchema = z.object({
  studentName: z.string(),
  recentActivity: z.array(z.object({
    type: z.enum(['submission', 'progress']),
    title: z.string(),
    description: z.string(),
    status: z.string().optional(),
  })),
  skills: z.array(z.object({
    skillName: z.string(),
    level: z.number(),
  })),
});

export type StudentInsightsInput = z.infer<typeof StudentInsightsInputSchema>;

const StudentInsightsOutputSchema = z.object({
  summary: z.string().describe('A 2-3 sentence personalized summary of recent progress.'),
  achievements: z.array(z.string()).describe('2-3 specific achievements based on activity and skills.'),
  focusAreas: z.array(z.string()).describe('1-2 areas where the student can improve or focus next.'),
  topTip: z.string().describe('A short, motivational, and actionable tip for the student.'),
});

export type StudentInsightsOutput = z.infer<typeof StudentInsightsOutputSchema>;

export async function generateStudentInsights(input: StudentInsightsInput): Promise<StudentInsightsOutput> {
  return generateStudentInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudentInsightsPrompt',
  input: { schema: StudentInsightsInputSchema },
  output: { schema: StudentInsightsOutputSchema },
  prompt: `You are an AI Learning Mentor on the EduVerse platform.
  Your goal is to provide encouraging and personalized learning insights to a student.

  Student: {{studentName}}

  Recent Activity:
  {{#each recentActivity}}
  - {{type}}: {{title}} - {{description}} {{#if status}} (Status: {{status}}){{/if}}
  {{/each}}

  Current Skills:
  {{#each skills}}
  - {{skillName}}: {{level}}%
  {{/each}}

  Based on this data, provide:
  1. Summary: A warm and personalized overview of their week or recent progress.
  2. Achievements: Highlight 2-3 specific milestones or strengths shown in their work.
  3. Focus Areas: Suggest 1-2 practical things they should focus on next to keep growing.
  4. Top Tip: A single, punchy, motivational tip related to their learning journey.

  Be supportive, insightful, and clear. Avoid generic praise; try to reference their specific activities or skills.`,
});

const generateStudentInsightsFlow = ai.defineFlow(
  {
    name: 'generateStudentInsightsFlow',
    inputSchema: StudentInsightsInputSchema,
    outputSchema: StudentInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate student insights');
    }
    return output;
  }
);
