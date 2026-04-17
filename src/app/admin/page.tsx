
// src/app/admin/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { onAuthStateChanged, getUserProfile } from "@/lib/firebase/auth";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { UserRole } from "@/lib/firebase/auth";
import { LayoutDashboard, Users, BookOpen, Settings, AlertCircle, LogIn, ShieldAlert, Newspaper } from "lucide-react";

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
  displayName?: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthorized, setIsAuthorized] = React.useState(false);

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
          if (profile.role === 'admin') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } else {
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'student' 
          });
          setIsAuthorized(false);
        }
      } else {
        setCurrentUser(null);
        setIsAuthorized(false);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-7 w-3/4 rounded-md" />
                <Skeleton className="h-5 w-1/2 rounded-md mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center py-12">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <CardHeader>
            <LogIn className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-2xl font-bold">Admin Access Required</CardTitle>
            <CardDescription>Please log in to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/login?redirect=/admin">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center py-12">
        <Card className="w-full max-w-md p-8 shadow-xl bg-destructive/10 border-destructive">
          <CardHeader>
            <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
            <CardDescription className="text-destructive-foreground/80">
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="lg" className="w-full" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard Content
  return (
    <div className="space-y-8 py-12">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
          Admin Dashboard
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
          Welcome, {currentUser.displayName || currentUser.email}! Manage your platform.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> User Management
            </CardTitle>
            <CardDescription>View and manage platform users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> Course Management
            </CardTitle>
            <CardDescription>Oversee and manage all courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>Manage Courses (Coming Soon)</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-primary" /> Blog Management
            </CardTitle>
            <CardDescription>Create, edit, and delete blog posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/blog">Manage Blog Posts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" /> Site Settings
            </CardTitle>
            <CardDescription>Configure global platform settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>Platform Settings (Coming Soon)</Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Platform Analytics</CardTitle>
            <CardDescription>Overview of site activity and performance.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="border-2 border-dashed border-border rounded-md p-12 text-center text-muted-foreground">
                <LayoutDashboard className="mx-auto h-16 w-16 mb-4"/>
                <p className="text-xl">Analytics dashboard coming soon.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
