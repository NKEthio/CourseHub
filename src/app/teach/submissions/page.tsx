
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { onAuthStateChanged, getUserProfile, type UserRole, type UserProfile } from "@/lib/firebase/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ClipboardList, Eye, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Submission } from "@/types/submission";
import type { Course } from "@/types/course";
import { format } from 'date-fns';

interface SubmissionWithDetails {
  id: string;
  projectId: string;
  courseId: string;
  studentId: string;
  content: string;
  version: number;
  status: string;
  feedback?: any[];
  createdAt: any;
  updatedAt: any;
  studentName: string;
  courseTitle: string;
}

export default function TeacherSubmissionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = React.useState<SubmissionWithDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && profile.role === 'teacher') {
          setCurrentUser(profile);
          fetchSubmissions(firebaseUser.uid);
        } else {
          toast({ variant: "destructive", title: "Access Denied", description: "You must be a teacher to view this page." });
          router.push('/teach');
        }
      } else {
        router.push('/auth/login');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  const fetchSubmissions = async (teacherId: string) => {
    if (!db) return;
    setIsLoading(true);
    try {
      // 1. Get all courses for this teacher
      const coursesRef = collection(db, "courses");
      const qCourses = query(coursesRef, where("teacherId", "==", teacherId));
      const coursesSnap = await getDocs(qCourses);
      const teacherCourseIds = coursesSnap.docs.map(doc => doc.id);
      const courseMap = new Map();
      coursesSnap.docs.forEach(doc => courseMap.set(doc.id, (doc.data() as Course).title));

      if (teacherCourseIds.length === 0) {
        setSubmissions([]);
        setIsLoading(false);
        return;
      }

      // 2. Get submissions for these courses
      // Note: Firestore 'in' query supports up to 30 values.
      // If a teacher has >30 courses, this might need chunking.
      const submissionsRef = collection(db, "submissions");
      const qSubmissions = query(
        submissionsRef,
        where("courseId", "in", teacherCourseIds),
        orderBy("updatedAt", "desc")
      );
      const submissionsSnap = await getDocs(qSubmissions);

      const rawSubmissions = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // 3. Fetch student names
      const studentIds = Array.from(new Set(rawSubmissions.map(s => s.studentId)));
      const studentMap = new Map();

      await Promise.all(studentIds.map(async (sid) => {
        const userDoc = await getDoc(doc(db!, "users", sid));
        if (userDoc.exists()) {
          studentMap.set(sid, userDoc.data().displayName || userDoc.data().email || "Unknown Student");
        } else {
          studentMap.set(sid, "Deleted Student");
        }
      }));

      // 4. Combine data
      const enrichedSubmissions: SubmissionWithDetails[] = rawSubmissions.map(sub => ({
        ...sub,
        studentName: studentMap.get(sub.studentId) || "Unknown",
        courseTitle: courseMap.get(sub.courseId) || "Unknown Course"
      }));

      setSubmissions(enrichedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load submissions." });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Student Submissions
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and provide feedback on your students' project submissions.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            Showing the latest work from your courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : submissions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.studentName}</TableCell>
                      <TableCell>{submission.courseTitle}</TableCell>
                      <TableCell>v{submission.version}</TableCell>
                      <TableCell>
                        {submission.updatedAt ? format(new Date(typeof submission.updatedAt === 'object' && 'seconds' in submission.updatedAt ? (submission.updatedAt as any).seconds * 1000 : submission.updatedAt as string), 'PP') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          submission.status === 'approved' ? 'default' :
                          submission.status === 'needs-revision' ? 'destructive' :
                          'secondary'
                        }>
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/teach/submissions/${submission.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No submissions yet</h3>
              <p className="text-muted-foreground">Your students haven't submitted any projects in your courses.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
