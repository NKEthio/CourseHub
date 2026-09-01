'use server';

// GenKit disabled / reserved for further improvement
import { z } from 'zod';

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
    improvement: z.number(),
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
  // GenKit disabled / reserved for further improvement
  const lessonsCompleted = input.recentActivity.filter(a => a.type === 'lesson' && a.status === 'completed').length;
  const projectsSubmitted = input.recentActivity.filter(a => a.type === 'project').length;

  return {
    summary: `${input.studentName} has made steady progress on EduVerse this week, showing good engagement with lessons and projects.`,
    strengths: ['Consistent participation in coursework', 'Strong core skill performance'],
    areasToImprove: ['Reviewing completed project feedback to build advanced skills'],
    activityLevel: lessonsCompleted + projectsSubmitted > 3 ? 'high' : 'medium',
    metrics: {
      lessonsCompleted,
      projectsSubmitted,
      averageImprovement: 10,
    },
  };
}
