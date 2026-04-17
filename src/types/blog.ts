
// src/types/blog.ts
import type { Timestamp } from 'firebase/firestore';

export interface BlogPost {
  id?: string; // Firestore document ID
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Content as string (can be HTML or Markdown)
  author: string; // Author's display name
  authorId?: string; // UID of the author
  imageUrl: string;
  imageHint?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'draft' | 'published'; // Blog post status
  // Add tags or categories later if needed:
  // category?: string; 
  // tags?: string[];
}
