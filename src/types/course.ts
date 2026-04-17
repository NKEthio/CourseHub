
// src/types/course.ts
import type { Timestamp } from 'firebase/firestore';

export interface QuizOption {
  text: string;
}

export interface QuizQuestion {
  questionText: string;
  options: QuizOption[];
  correctOptionIndex: number; // Index of the correct option in the options array
}

export interface Course {
  id?: string; // Firestore document ID
  title: string;
  shortDescription: string;
  imageUrl: string; // URL to course thumbnail
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number; // 0 for free
  youtubeIntroLink?: string; // Optional
  teacherId: string;
  teacherName: string; // Display name of the teacher
  createdAt: Timestamp | string; // Firestore Timestamp or ISO string
  updatedAt: Timestamp | string; // Firestore Timestamp or ISO string
  status: 'draft' | 'published' | 'archived';
  enrollmentCount?: number;
  averageRating?: number;
  ratingCount?: number; // New: to store the number of ratings
}

export interface Lesson {
  id?: string; // Firestore document ID
  title: string;
  content: string; // Could be Markdown, HTML, or structured content
  videoUrl?: string;
  order: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  hasQuiz?: boolean;
  passingGrade?: number; // Percentage, e.g., 70
  unlocksNextLessonOnPass?: boolean;
  quiz?: QuizQuestion[]; // Array of quiz questions
}

export interface Review {
  id?: string; // userId will be used as document ID for reviews
  courseId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
  rating: number; // 1-5
  comment: string;
  createdAt: Timestamp;
}

export interface UserEnrolledCourse {
  courseId: string;
  enrollmentDate: Timestamp | string;
  courseTitle?: string; // Added for convenience
}
