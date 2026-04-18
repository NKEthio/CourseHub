
// src/app/teach/dashboard/page.tsx
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, BookCopy, DollarSign, Edit, Loader2, MessageSquare, PlusCircle, Settings, Users, AlertCircle, ClipboardList, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { onAuthStateChanged, getUserProfile, type UserRole, type AppUser } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import type { Course } from "@/types/course";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CourseWithId extends Course {
  id: string;
}

// Dummy data for dashboard widgets - will be replaced by real data eventually
const dashboardStats = [
  { title: 'Total Students', value: '0', icon: Users, trend: '' },
  { title: 'Active Courses', value: '0', icon: BookCopy, trend: '' },
  { title: 'Monthly Earnings', value: '$0', icon: DollarSign, trend: '' },
  { title: 'Pending Reviews', value: '0', icon: MessageSquare, trend: '' },
];

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [courses, setCourses] = React.useState<CourseWithId[]>([]);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [coursesLoading, setCoursesLoading] = React.useState(true);
  const [coursesError, setCoursesError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState(dashboardStats);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && profile.role === 'teacher') {
          setCurrentUser({ ...profile } as AppUser);
        } else {
          toast({ variant: "destructive", title: "Access Denied", description: "You must be a teacher to view this page." });
          router.push('/teach');
        }
      } else {
        toast({ variant: "destructive", title: "Authentication Required", description: "Please log in." });
        router.push('/auth/login');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  React.useEffect(() => {
    if (!currentUser || authLoading) return;

    const fetchCourses = async () => {
      if (!db) return;
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const coursesCollectionRef = collection(db, "courses");
        const q = query(coursesCollectionRef, where("teacherId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedCourses: CourseWithId[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as Course;
          return {
            ...data,
            id: doc.id,
          };
        });
        setCourses(fetchedCourses);

        // Update dashboard stats based on fetched courses
        const publishedCourses = fetchedCourses.filter(c => c.status === 'published').length;
        setStats(prevStats => prevStats.map(stat => 
            stat.title === 'Active Courses' ? {...stat, value: publishedCourses.toString()} : stat
        ));

      } catch (err) {
        console.error("Error fetching courses: ", err);
        setCoursesError("Failed to load your courses. Please try again later.");
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [currentUser, authLoading]);

  if (authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 py-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser?.displayName || currentUser?.email}! Manage your courses and students.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/profile/settings"> {/* Assuming a settings page, adjust as needed */}
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/teach/courses/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Course
            </Link>
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend && <p className="text-xs text-muted-foreground">{stat.trend} from last month</p>}
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Quick Actions & Course List */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Overview of your published and draft courses.</CardDescription>
          </CardHeader>
          <CardContent>
            {coursesLoading && (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!coursesLoading && coursesError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Courses</AlertTitle>
                <AlertDescription>
                  {coursesError}
                </AlertDescription>
              </Alert>
            )}
            {!coursesLoading && !coursesError && courses.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-md p-8 text-center text-muted-foreground">
                <BookCopy className="mx-auto h-12 w-12 mb-4" />
                <p className="mb-2">You haven&apos;t created any courses yet.</p>
                <Button asChild>
                  <Link href="/teach/courses/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Link>
                </Button>
              </div>
            )}
            {!coursesLoading && !coursesError && courses.length > 0 && (
              <ul className="space-y-4">
                {courses.map((course) => (
                  <li key={course.id} className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-semibold text-lg text-primary">{course.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                          {course.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Last updated: {course.updatedAt instanceof Timestamp ? course.updatedAt.toDate().toLocaleDateString() : new Date(course.updatedAt).toLocaleDateString()}
                        </span>
                         <span className="text-xs text-muted-foreground">
                          Level: {course.level}
                        </span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/teach/courses/${course.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progress Trends
            </CardTitle>
            <CardDescription>See how your students are improving.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="border-2 border-dashed border-border rounded-md p-8 text-center text-muted-foreground h-60 flex flex-col justify-center items-center">
                <BarChart className="mx-auto h-12 w-12 mb-4" />
                <p>Improvement analytics coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Student Submissions */}
      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Flagged Submissions
            </CardTitle>
            <CardDescription>Review student work that requires your attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-md p-12 text-center text-muted-foreground">
              <p className="text-xl mb-2">No submissions flagged for review.</p>
              <p>AI is currently handling initial feedback for all active projects.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity or Announcements */}
      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest enrollments, reviews, and messages.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display.</p>
            {/* Placeholder for activity feed */}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
