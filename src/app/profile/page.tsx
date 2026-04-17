
// src/app/profile/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { onAuthStateChanged, getUserProfile } from "@/lib/firebase/auth";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { UserRole } from "@/lib/firebase/auth";
import { User, Mail, ShieldCheck, Edit, LogIn, Briefcase, School, LayoutDashboard } from "lucide-react";

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
  displayName?: string | null;
  photoURL?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser({ 
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            ...profile 
          });
        } else {
          // Fallback if Firestore profile somehow fails, use Auth data
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'student' // Default role if not found
          });
        }
      } else {
        router.push("/auth/login"); // Redirect if not logged in
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="space-y-8 py-12">
        <header className="text-center">
          <Skeleton className="h-10 w-1/2 mx-auto mb-4 rounded-md" />
          <Skeleton className="h-6 w-1/3 mx-auto rounded-md" />
        </header>
        <Card className="w-full max-w-2xl mx-auto shadow-xl">
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-5 w-64 rounded-md mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-full rounded-md" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-full rounded-md" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-md mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    // This case should be handled by redirect, but as a fallback
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center py-12">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <CardHeader>
            <LogIn className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-2xl font-bold">Access Your Profile</CardTitle>
            <CardDescription>Please log in to view your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-12">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
          My Profile
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
          View and manage your account details and settings.
        </p>
      </header>

      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="items-center text-center border-b pb-6">
          <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} data-ai-hint="profile avatar"/>
            <AvatarFallback className="text-3xl">
              {(currentUser.displayName || currentUser.email || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{currentUser.displayName || "User"}</CardTitle>
          <CardDescription>{currentUser.email}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center text-sm">
            <User className="mr-3 h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Full Name:</span>
            <span className="ml-2 font-medium">{currentUser.displayName || "Not set"}</span>
          </div>
          <div className="flex items-center text-sm">
            <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Email:</span>
            <span className="ml-2 font-medium">{currentUser.email}</span>
          </div>
          <div className="flex items-center text-sm">
            <ShieldCheck className="mr-3 h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Role:</span>
            <span className="ml-2 font-medium capitalize">{currentUser.role || "Student"}</span>
          </div>
          
          <Button asChild className="w-full mt-6">
            <Link href="/settings">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile & Settings
            </Link>
          </Button>

          {currentUser.role === 'student' && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/my-learning">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Go to My Dashboard
              </Link>
            </Button>
          )}
          {currentUser.role === 'teacher' && (
             <Button asChild variant="outline" className="w-full">
              <Link href="/teach/dashboard">
                <Briefcase className="mr-2 h-4 w-4" /> Teacher Dashboard
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
