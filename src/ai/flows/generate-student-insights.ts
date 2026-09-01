'use server';

// GenKit disabled / reserved for further improvement
import { z } from 'zod';

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
  // GenKit disabled / reserved for further improvement
  return {
    summary: `Great progress, ${input.studentName}! You have been actively working through your courses on EduVerse.`,
    achievements: [
      'Completed key lesson milestones this week',
      'Consistently developing core skill competencies',
    ],
    focusAreas: ['Continue practicing interactive exercises in upcoming modules'],
    topTip: 'Consistency is key—keep up the great daily momentum!',
  };
}
