
// src/app/teach/page.tsx
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenText, Users, TrendingUp, Edit3, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { onAuthStateChanged, getUserProfile, type UserRole } from '@/lib/firebase/auth';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
}

export default function TeachPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser({ ...firebaseUser, role: profile.role, displayName: profile.displayName } as AppUser);
        } else {
          // Fallback if profile is somehow not found, treat as student or basic user
          setCurrentUser({ ...firebaseUser, role: 'student' } as AppUser);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const isTeacher = currentUser && currentUser.role === 'teacher';

  return (
    <div className="space-y-12 py-8">
      <section className="text-center">
        {isTeacher ? (
          <>
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-6">
              Welcome Back, {currentUser?.displayName || 'Teacher'}!
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
              Manage your courses, engage with students, and continue inspiring learners on CourseHub.
            </p>
            <Button asChild size="lg" variant="default">
              <Link href="/teach/dashboard">
                Go to Your Teacher Dashboard
              </Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-6">
              Share Your Expertise with the World
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
              Become an instructor on CourseHub and empower learners globally. Create engaging courses, build your community, and earn by sharing your passion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="default">
                <Link href="/auth/register?role=teacher">
                  Become an Instructor
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/teach/dashboard">
                  Go to Teacher Dashboard
                </Link>
              </Button>
            </div>
          </>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <Image
            src="https://placehold.co/600x400.png"
            alt="Instructor teaching online"
            width={600}
            height={400}
            className="rounded-lg shadow-xl"
            data-ai-hint="teacher online course"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-primary">Why Teach on CourseHub?</h2>
          <div className="flex items-start gap-4">
            <BookOpenText className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold">Inspire Learners</h3>
              <p className="text-muted-foreground">Teach what you love and help students achieve their goals.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Users className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold">Build Your Community</h3>
              <p className="text-muted-foreground">Connect with students from around the world and build your brand.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <TrendingUp className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold">Earn Revenue</h3>
              <p className="text-muted-foreground">Monetize your expertise with our competitive revenue sharing model.</p>
            </div>
          </div>
           <div className="flex items-start gap-4">
            <Edit3 className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold">Powerful Tools</h3>
              <p className="text-muted-foreground">Utilize our intuitive platform to create and manage your courses with ease.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl shadow-sm p-8 md:p-12">
        <CardHeader className="text-center p-0 mb-6">
          <CardTitle className="text-3xl font-bold text-primary">Ready to Get Started?</CardTitle>
          <CardDescription className="text-lg text-muted-foreground max-w-xl mx-auto mt-2">
            {isTeacher ? "Manage your courses or explore new features." : "Join our community of instructors and start making an impact today."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center p-0">
          <p className="mb-6 text-muted-foreground">
            {isTeacher ? "Head to your dashboard to manage your existing courses or create new ones. We're always adding new tools to help you succeed!" : "Creating a course is simple. We provide you with the tools and support you need to succeed."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isTeacher && (
               <Button asChild size="lg">
                  <Link href="/auth/register?role=teacher">
                  Sign Up as a Teacher
                  </Link>
              </Button>
            )}
            <Button asChild size="lg" variant={isTeacher ? "default" : "secondary"}>
                <Link href="/teach/dashboard">
                Access Your Dashboard
                </Link>
            </Button>
          </div>
        </CardContent>
      </section>
    </div>
  );
}
