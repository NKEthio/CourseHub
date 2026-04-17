
// src/app/my-learning/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { onAuthStateChanged } from "@/lib/firebase/auth";
import { db, auth } from "@/lib/firebase/firebase";
import { collection, getDocs, doc, getDoc, query } from "firebase/firestore";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { Course, UserEnrolledCourse } from "@/types/course";
import CourseCard, { type CourseCardProps } from "@/components/course/CourseCard";
import { BookOpen, LogIn, Search, AlertCircle, LayoutDashboard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<FirebaseAuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [enrolledCourses, setEnrolledCourses] = React.useState<CourseCardProps[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = React.useState(false);
  const [errorCourses, setErrorCourses] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!currentUser) {
      setEnrolledCourses([]); // Clear courses if user logs out
      return;
    }

    const fetchEnrolledCourses = async () => {
      setIsLoadingCourses(true);
      setErrorCourses(null);
      try {
        const enrolledCoursesRef = collection(db, "users", currentUser.uid, "enrolledCourses");
        const enrolledSnapshot = await getDocs(enrolledCoursesRef);
        
        if (enrolledSnapshot.empty) {
          setEnrolledCourses([]);
          setIsLoadingCourses(false);
          return;
        }

        const coursePromises = enrolledSnapshot.docs.map(async (enrollmentDoc) => {
          const enrolledData = enrollmentDoc.data() as UserEnrolledCourse;
          const courseDocRef = doc(db, "courses", enrolledData.courseId);
          const courseDocSnap = await getDoc(courseDocRef);
          if (courseDocSnap.exists()) {
            const courseData = courseDocSnap.data() as Course;
            return {
              id: courseDocSnap.id,
              title: courseData.title,
              shortDescription: courseData.shortDescription,
              teacherName: courseData.teacherName,
              averageRating: courseData.averageRating || 0,
              imageUrl: courseData.imageUrl,
              category: courseData.category,
              price: courseData.price,
              level: courseData.level,
            } as CourseCardProps;
          }
          return null;
        });

        const fetchedCourses = (await Promise.all(coursePromises)).filter(course => course !== null) as CourseCardProps[];
        setEnrolledCourses(fetchedCourses);

      } catch (err) {
        console.error("Error fetching enrolled courses:", err);
        setErrorCourses("Failed to load your enrolled courses. Please try again.");
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchEnrolledCourses();
  }, [currentUser]);

  if (isLoadingAuth) {
    return (
      <div className="space-y-8 py-8">
        <header className="text-center">
          <Skeleton className="h-10 w-3/4 mx-auto mb-4 rounded-md" />
          <Skeleton className="h-6 w-1/2 mx-auto rounded-md" />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-48 w-full rounded" />
                <Skeleton className="h-6 w-3/4 rounded mt-2" />
                <Skeleton className="h-4 w-1/2 rounded mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 rounded" />
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
            <CardTitle className="text-2xl font-bold">Access Your Dashboard</CardTitle>
            <CardDescription>Please log in to see your enrolled courses and progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/login">Log In</Link>
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              New here?{" "}
              <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
          Student Dashboard
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
          Welcome back, {currentUser.displayName || currentUser.email}! Here are your courses, progress, and activity.
        </p>
      </header>

      <section>
        {isLoadingCourses && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: enrolledCourses.length || 3 }).map((_, index) => (
               <div key={index} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-4 w-1/4 rounded" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-1/3 rounded" />
                  <Skeleton className="h-8 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoadingCourses && errorCourses && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Enrolled Courses</AlertTitle>
            <AlertDescription>{errorCourses}</AlertDescription>
          </Alert>
        )}

        {!isLoadingCourses && !errorCourses && enrolledCourses.length === 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Your Enrolled Courses</CardTitle>
              <CardDescription>Continue your learning journey from your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-md p-12 text-center text-muted-foreground">
                <BookOpen className="mx-auto h-16 w-16 mb-4" />
                <p className="text-xl mb-2">You are not enrolled in any courses yet.</p>
                <p className="mb-6">Once you enroll in a course, it will appear on your dashboard.</p>
                <Button asChild>
                  <Link href="/courses">
                    <Search className="mr-2 h-4 w-4" /> Explore Courses
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!isLoadingCourses && !errorCourses && enrolledCourses.length > 0 && (
           <>
            <h2 className="text-2xl font-semibold mb-6">Your Enrolled Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => (
                <CourseCard key={course.id} {...course} />
                ))}
            </div>
           </>
        )}
      </section>
      
      {/* Placeholder for Progress Tracking - Future Implementation */}
      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Track your learning achievements.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-md p-12 text-center text-muted-foreground">
              <LayoutDashboard className="mx-auto h-16 w-16 mb-4" /> {/* Changed icon */}
              <p className="text-xl mb-2">Course progress tracking is coming soon!</p>
              <p>You'll be able to see how far you've come in each course.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Placeholder for Recent Activity - Future Implementation */}
      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Stay updated with your learning interactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-md p-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto h-16 w-16 mb-4" /> {/* Changed icon */}
              <p className="text-xl mb-2">Recent activity feed is coming soon!</p>
              <p>You'll see updates on new lessons, discussions, and more.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
