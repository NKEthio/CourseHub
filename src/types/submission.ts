
import type { Timestamp } from 'firebase/firestore';

export interface Feedback {
  id?: string;
  submissionId: string;
  reviewerId: string; // 'ai' or teacherId
  reviewerName: string;
  content: string;
  correctness: number; // 0-100
  clarity: number; // 0-100
  suggestions: string[];
  createdAt: Timestamp | string;
}

export interface Submission {
  id?: string;
  projectId: string;
  courseId: string;
  studentId: string;
  content: string; // code, text, or file URL
  version: number;
  status: 'pending' | 'reviewed' | 'needs-revision' | 'approved';
  feedback?: Feedback[];
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
