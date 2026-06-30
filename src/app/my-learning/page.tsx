
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
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { Course, UserEnrolledCourse } from "@/types/course";
import type { Progress as ProgressType, SkillLevel } from "@/types/progress";
import type { Submission } from "@/types/submission";
import CourseCard, { type CourseCardProps } from "@/components/course/CourseCard";
import { BookOpen, LogIn, Search, AlertCircle, LayoutDashboard, Code, TrendingUp, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  id: string;
  type: 'submission' | 'progress';
  title: string;
  description: string;
  status?: string;
  date: Timestamp | string | Date;
  projectId?: string;
  courseId: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<FirebaseAuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [enrolledCourses, setEnrolledCourses] = React.useState<CourseCardProps[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = React.useState(false);
  const [errorCourses, setErrorCourses] = React.useState<string | null>(null);

  const [progressData, setProgressData] = React.useState<ProgressType[]>([]);
  const [activeProjects, setActiveProjects] = React.useState<Submission[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<ActivityItem[]>([]);
  const [isLoadingExtra, setIsLoadingExtra] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
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
        if (!db) return;
        const enrolledCoursesRef = collection(db, "users", currentUser.uid, "enrolledCourses");
        const enrolledSnapshot = await getDocs(enrolledCoursesRef);
        
        if (enrolledSnapshot.empty) {
          setEnrolledCourses([]);
          setIsLoadingCourses(false);
          return;
        }

        const coursePromises = enrolledSnapshot.docs.map(async (enrollmentDoc) => {
          const enrolledData = enrollmentDoc.data() as UserEnrolledCourse;
          const courseDocRef = doc(db!, "courses", enrolledData.courseId);
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

        // Fetch Progress and Submissions
        fetchAdditionalData(fetchedCourses.map(c => c.id), fetchedCourses);

      } catch (err) {
        console.error("Error fetching enrolled courses:", err);
        setErrorCourses("Failed to load your enrolled courses. Please try again.");
      } finally {
        setIsLoadingCourses(false);
      }
    };

    const fetchAdditionalData = async (courseIds: string[], courses: CourseCardProps[]) => {
      if (courseIds.length === 0 || !db) return;
      setIsLoadingExtra(true);
      try {
        // Fetch progress for each course
        const progressPromises = courseIds.map(async (courseId) => {
          const progressRef = doc(db!, "users", currentUser!.uid, "progress", courseId);
          const progressSnap = await getDoc(progressRef);
          return progressSnap.exists() ? { id: progressSnap.id, ...progressSnap.data() } as ProgressType : null;
        });
        const progressResults = (await Promise.all(progressPromises)).filter(p => p !== null) as ProgressType[];
        setProgressData(progressResults);

        // Fetch recent submissions (Active Projects)
        const submissionsRef = collection(db!, "submissions");
        const qSubmissions = query(
          submissionsRef,
          where("studentId", "==", currentUser!.uid),
          orderBy("updatedAt", "desc"),
          limit(10)
        );
        const submissionsSnap = await getDocs(qSubmissions);
        const submissions = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));

        // Group by projectId to get the latest submission for each project
        const latestSubmissions: Record<string, Submission> = {};
        submissions.forEach(s => {
          if (!latestSubmissions[s.projectId]) {
            latestSubmissions[s.projectId] = s;
          }
        });
        setActiveProjects(Object.values(latestSubmissions));

        // Create Recent Activity Feed
        const activity: ActivityItem[] = [];

        submissions.forEach(s => {
          const course = courses.find(c => c.id === s.courseId);
          activity.push({
            id: `sub-${s.id}`,
            type: 'submission',
            title: 'Project Submission',
            description: `You submitted a revision for a project in ${course?.title || 'a course'}.`,
            status: s.status,
            date: s.updatedAt,
            projectId: s.projectId,
            courseId: s.courseId
          });
        });

        progressResults.forEach(p => {
            if (p.completedLessons && p.completedLessons.length > 0) {
                const course = courses.find(c => c.id === p.courseId);
                activity.push({
                    id: `prog-${p.id}`,
                    type: 'progress',
                    title: 'Course Progress',
                    description: `You reached ${p.overallCompletion}% completion in ${course?.title || 'a course'}.`,
                    date: p.lastActivityAt,
                    courseId: p.courseId
                });
            }
        });

        setRecentActivity(activity.sort((a, b) => {
            const dateA = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date).getTime();
            const dateB = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date).getTime();
            return dateB - dateA;
        }).slice(0, 5));

      } catch (err) {
        console.error("Error fetching extra dashboard data:", err);
      } finally {
        setIsLoadingExtra(false);
      }
    };

    fetchEnrolledCourses();
  }, [currentUser]);

  const aggregatedSkills = React.useMemo(() => {
    const skillsMap: Record<string, number> = {};
    progressData.forEach(p => {
      p.skills?.forEach(s => {
        if (!skillsMap[s.skillName] || skillsMap[s.skillName] < s.level) {
          skillsMap[s.skillName] = s.level;
        }
      });
    });
    return Object.entries(skillsMap).map(([name, level]) => ({ skillName: name, level }));
  }, [progressData]);

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
      
      {/* Active Projects & Progress Overview */}
      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Active Projects
              </CardTitle>
              <CardDescription>Build real projects to apply what you've learned.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExtra ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : activeProjects.length > 0 ? (
                <div className="space-y-4">
                  {activeProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/courses/${project.courseId}/learn?item=${project.projectId}`}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors group"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold group-hover:text-primary transition-colors">
                          {enrolledCourses.find(c => c.id === project.courseId)?.title || 'Course Project'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Updated {formatDate(project.updatedAt)}
                        </p>
                      </div>
                      <Badge variant={project.status === 'approved' ? 'default' : project.status === 'needs-revision' ? 'destructive' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-md p-8 text-center text-muted-foreground">
                  <p className="mb-2">No active projects at the moment.</p>
                  <p className="text-sm">Start a course module to unlock projects.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Learning Progress
              </CardTitle>
              <CardDescription>Track your growth and skill improvements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingExtra ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : aggregatedSkills.length > 0 ? (
                <div className="space-y-4">
                  {aggregatedSkills.map((skill) => (
                    <div key={skill.skillName} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{skill.skillName}</span>
                        <span className="text-muted-foreground">{skill.level}%</span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-md p-8 text-center text-muted-foreground">
                  <p className="mb-2">No skills tracked yet.</p>
                  <p className="text-sm">Complete lessons and resubmit projects to see your growth trends.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Recent Activity */}
      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Stay updated with your latest learning milestones.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingExtra ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                    {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="mt-1">
                                {activity.type === 'submission' ? <Code className="h-5 w-5 text-blue-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-sm">{activity.title}</h4>
                                    <span className="text-xs text-muted-foreground">{formatDate(activity.date)}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                                {activity.status && (
                                     <Badge variant="outline" className="mt-2 capitalize text-[10px] h-5">
                                        Status: {activity.status}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border-2 border-dashed border-border rounded-md p-12 text-center text-muted-foreground">
                    <p className="text-xl mb-2">No recent activity.</p>
                    <p>Complete your first lesson to see updates here!</p>
                </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
