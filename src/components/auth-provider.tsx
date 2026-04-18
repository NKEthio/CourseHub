
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, getUserProfile, type AppUser } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import type { User as FirebaseAuthUser } from 'firebase/auth';

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged((firebaseUser: FirebaseAuthUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        getUserProfile(firebaseUser.uid).then((profile) => {
          if (profile) {
            setUser({
              ...firebaseUser,
              role: profile.role,
            } as AppUser);
          } else {
            setUser({
              ...firebaseUser,
              role: 'student',
            } as AppUser);
          }
          setIsLoading(false);
        }).catch((err) => {
          console.error("Error fetching user profile:", err);
          setUser({
            ...firebaseUser,
            role: 'student',
          } as AppUser);
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
