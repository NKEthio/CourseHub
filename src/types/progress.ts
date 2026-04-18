
import type { Timestamp } from 'firebase/firestore';

export interface SkillLevel {
  skillName: string;
  level: number; // 0-100
}

export interface Progress {
  id?: string;
  studentId: string;
  courseId: string;
  skills: SkillLevel[];
  completedLessons: string[]; // lessonIds
  completedProjects: string[]; // projectIds
  revisionsCount: Record<string, number>; // projectId -> count
  lastActivityAt: Timestamp | string;
  overallCompletion: number; // 0-100
}
