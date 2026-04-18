
import type { Timestamp } from 'firebase/firestore';

export interface Report {
  id?: string;
  studentId: string;
  parentId: string;
  startDate: Timestamp | string;
  endDate: Timestamp | string;
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  activityLevel: 'low' | 'medium' | 'high';
  metrics: {
    lessonsCompleted: number;
    projectsSubmitted: number;
    averageImprovement: number;
  };
  createdAt: Timestamp | string;
}
