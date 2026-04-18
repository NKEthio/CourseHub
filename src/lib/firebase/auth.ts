
// src/lib/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile as updateFirebaseAuthProfile,
  type User,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy, type Timestamp, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

import type { User as FirebaseAuthUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null;
  createdAt?: Timestamp;
}

export interface AppUser extends FirebaseAuthUser {
  role: UserRole;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole,
  displayName: string
): Promise<{ user: User | null; error: Error | null }> {
  if (!auth) {
    return { user: null, error: new Error("Firebase Auth is not initialized.") };
  }
  if (!db) {
    return { user: null, error: new Error("Firestore is not initialized.") };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateFirebaseAuthProfile(user, { displayName });

    const userProfileData: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: role,
      photoURL: user.photoURL,
      createdAt: serverTimestamp() as Timestamp,
    };

    const userDocRef = doc(db, "users", user.uid);
    
    // This is a fire-and-forget write with error handling.
    // The UI can proceed while the write happens in the background.
    setDoc(userDocRef, userProfileData).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: userProfileData,
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    return { user, error: null };
  } catch (error) {
    // This catches errors from createUserWithEmailAndPassword, which are not permission errors.
    return { user: null, error: error as Error };
  }
}

// Sign In
export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  if (!auth) {
    return { user: null, error: new Error("Firebase Auth is not initialized. Check your Firebase configuration.") };
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

// Sign Out
export async function signOutUser(): Promise<{ error: Error | null }> {
  if (!auth) {
    return { error: new Error("Firebase Auth is not initialized. Check your Firebase configuration.") };
  }
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// Auth State Listener
export function onAuthStateChanged(callback: (user: User | null) => void) {
  if (!auth || typeof auth.onAuthStateChanged !== 'function') {
    console.error(
      "Firebase Auth service is not available or not correctly initialized. " +
      "Cannot set up onAuthStateChanged listener. " +
      "Please verify your Firebase configuration in .env.local and ensure the app is initialized correctly."
    );
    callback(null); 
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, callback);
}

// Get User Profile with Role from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  if (!db) {
    console.warn("Firestore is not initialized. Cannot fetch user profile.");
    return null;
  }
  const userDocRef = doc(db, "users", uid);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserProfile;
    } else {
      console.warn(`No profile document found for user ${uid}. They may need to complete registration.`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
    // Emitting a permission error here for reads is complex because reads often happen
    // inside component renders. We'll focus on writes first.
    return null;
  }
}

// Update User Display Name
export async function updateUserDisplayName(uid: string, newDisplayName: string): Promise<{ success: boolean; error: Error | null }> {
  if (!auth?.currentUser || auth.currentUser.uid !== uid) {
    return { success: false, error: new Error("User not authenticated or UID mismatch.") };
  }
  if (!db) {
     return { success: false, error: new Error("Firestore is not initialized.") };
  }
  try {
    await updateFirebaseAuthProfile(auth.currentUser, { displayName: newDisplayName });
    const userDocRef = doc(db, "users", uid);
    const updateData = { displayName: newDisplayName };
    
    updateDoc(userDocRef, updateData).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    return { success: true, error: null };
  } catch (error) {
    // This will catch errors from updateFirebaseAuthProfile, which are not permission errors
    console.error("Error updating display name:", error);
    return { success: false, error: error as Error };
  }
}

// Update User Role
export function updateUserRole(uid: string, newRole: UserRole) {
  if (!db) {
    throw new Error("Firestore is not initialized. Cannot update user role.");
  }
  
  const userDocRef = doc(db, "users", uid);
  const updateData = {
    role: newRole,
    updatedAt: serverTimestamp(),
  };

  updateDoc(userDocRef, updateData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'update',
      requestResourceData: updateData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

// Get all users (for admin)
export async function getAllUsers(): Promise<UserProfile[]> {
  if (!db) {
    console.error("Firestore is not initialized. Cannot fetch users.");
    return [];
  }
  try {
    const usersCollectionRef = collection(db, "users");
    const q = query(usersCollectionRef, orderBy("displayName", "asc"));
    const querySnapshot = await getDocs(q);
    const usersList: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      usersList.push({ uid: doc.id, ...doc.data() } as UserProfile);
    });
    return usersList;
  } catch (error) {
    console.error("Error fetching all users:", error);
    // This could be a permission error on the 'list' operation.
    // Implementing the full error handling for reads/lists is more involved
    // and will be handled separately if needed.
    return [];
  }
}
