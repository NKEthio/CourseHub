// src/lib/firebase/blog.ts
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { BlogPost } from '@/types/blog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const BLOG_COLLECTION = 'blogPosts';

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function createBlogPost(
  postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>
) {
  if (!db) throw new Error('Firestore not initialized.');
  
  const blogCollectionRef = collection(db, BLOG_COLLECTION);
  const fullPostData = {
    ...postData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  addDoc(blogCollectionRef, fullPostData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: blogCollectionRef.path, // Path of the collection for a 'create' operation
      operation: 'create',
      requestResourceData: fullPostData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export async function getBlogPosts(publishedOnly: boolean = false): Promise<BlogPost[]> {
  if (!db) return [];
  try {
    let q = query(collection(db, BLOG_COLLECTION), orderBy('createdAt', 'desc'));
    if (publishedOnly) {
      q = query(collection(db, BLOG_COLLECTION), where('status', '==', 'published'), orderBy('createdAt', 'desc'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
  } catch (error) {
    // Handling read errors is more complex and will be addressed if they arise.
    console.error("Error fetching blog posts: ", error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!db) return null;
    try {
        const q = query(collection(db, BLOG_COLLECTION), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) return null;

        const postDoc = querySnapshot.docs[0];
        const post = { id: postDoc.id, ...postDoc.data() } as BlogPost;
        
        // If the user is not an admin, don't show non-published posts
        // This is a client-side check. The real security is in the rules.
        // A proper implementation might check user role here.
        if (post.status !== 'published') {
            // For now, we just don't return it. An admin UI would need a different function.
            return null;
        }
        
        return post;
    } catch (error) {
        console.error(`Error fetching blog post by slug ${slug}: `, error);
        return null;
    }
}


export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, BLOG_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BlogPost;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching blog post by ID ${id}: `, error);
    return null;
  }
}

export function updateBlogPost(
  id: string,
  postData: Partial<Omit<BlogPost, 'id' | 'createdAt'>>
) {
  if (!db) throw new Error('Firestore not initialized.');

  const docRef = doc(db, BLOG_COLLECTION, id);
  const updateData = {
    ...postData,
    updatedAt: serverTimestamp(),
  };

  updateDoc(docRef, updateData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: updateData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function deleteBlogPost(id: string) {
  if (!db) throw new Error('Firestore not initialized.');
  
  const docRef = doc(db, BLOG_COLLECTION, id);

  deleteDoc(docRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
