
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  increment
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { onAuthStateChanged, getUserProfile, type UserProfile } from "@/lib/firebase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  User,
  BookOpen,
  History,
  Star,
  Send
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Submission, Feedback } from "@/types/submission";
import type { Course, Project } from "@/types/course";
import { format } from 'date-fns';

export default function TeacherReviewPage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [student, setStudent] = React.useState<UserProfile | null>(null);
  const [course, setCourse] = React.useState<Course | null>(null);
  const [project, setProject] = React.useState<Project | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [authLoading, setAuthLoading] = React.useState(true);

  const [teacherFeedback, setTeacherFeedback] = React.useState('');
  const [correctness, setCorrectness] = React.useState(100);
  const [clarity, setClarity] = React.useState(100);
  const [status, setStatus] = React.useState<'approved' | 'needs-revision'>('approved');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && profile.role === 'teacher') {
          setCurrentUser(profile);
          fetchData(id as string);
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
  }, [id, router, toast]);

  const fetchData = async (submissionId: string) => {
    if (!db) return;
    setIsLoading(true);
    try {
      const subDoc = await getDoc(doc(db, "submissions", submissionId));
      if (!subDoc.exists()) {
        toast({ variant: "destructive", title: "Error", description: "Submission not found." });
        router.push('/teach/submissions');
        return;
      }
      const subData = { id: subDoc.id, ...subDoc.data() } as Submission;
      setSubmission(subData);
      setStatus(subData.status === 'approved' ? 'approved' : 'needs-revision');

      // Fetch student info
      const studentDoc = await getDoc(doc(db, "users", subData.studentId));
      if (studentDoc.exists()) {
        setStudent(studentDoc.data());
      }

      // Fetch course info
      const courseDoc = await getDoc(doc(db, "courses", subData.courseId));
      if (courseDoc.exists()) {
        const cData = courseDoc.data() as Course;
        setCourse(cData);

        // Find project info within course modules
        let foundProject = null;
        if (cData.modules) {
          for (const module of cData.modules) {
            const p = module.projects?.find(proj => proj.id === subData.projectId);
            if (p) {
              foundProject = p;
              break;
            }
          }
        }
        setProject(foundProject);
      }
    } catch (error) {
      console.error("Error fetching review data:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load submission details." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReview = async () => {
    if (!db || !submission || !currentUser) return;
    if (!teacherFeedback.trim()) {
      toast({ variant: "destructive", title: "Missing Feedback", description: "Please provide some feedback comments." });
      return;
    }

    setIsSaving(true);
    try {
      const newFeedback: Feedback = {
        submissionId: submission.id!,
        reviewerId: currentUser.uid,
        reviewerName: currentUser.displayName || "Teacher",
        content: teacherFeedback,
        correctness,
        clarity,
        suggestions: [], // Manual suggestions could be added to UI later
        createdAt: new Date().toISOString(),
      };

      const submissionRef = doc(db, "submissions", submission.id!);
      await updateDoc(submissionRef, {
        status: status,
        feedback: arrayUnion(newFeedback),
        updatedAt: serverTimestamp()
      });

      // Update student progress if approved
      const progressRef = doc(db, "users", submission.studentId, "progress", submission.courseId);

      const updateData: any = {
        lastActivityAt: serverTimestamp(),
      };

      if (status === 'approved') {
        updateData.completedProjects = arrayUnion(submission.projectId);
      }

      try {
        await updateDoc(progressRef, updateData);
      } catch (err) {
        // If progress doc doesn't exist, create it (should rarely happen if they enrolled)
        await setDoc(progressRef, {
          ...updateData,
          courseId: submission.courseId,
          studentId: submission.studentId,
          completedLessons: [],
          overallCompletion: 0,
        }, { merge: true });
      }

      toast({ title: "Success", description: "Review saved successfully." });
      router.push('/teach/submissions');
    } catch (error) {
      console.error("Error saving review:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save review." });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = typeof date === 'object' && 'seconds' in date ? new Date(date.seconds * 1000) : new Date(date);
      return format(d, 'PPp');
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="h-64" />
        </Card>
      </div>
    );
  }

  if (!submission) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/teach/submissions">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Link>
        </Button>
        <Badge variant={submission.status === 'approved' ? 'default' : 'secondary'}>
          Current Status: {submission.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Submission Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Project Work</CardTitle>
              <CardDescription>
                Submitted by {student?.displayName || "Student"} for {project?.title || "Project"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-lg font-mono text-sm whitespace-pre-wrap border min-h-[200px]">
                {submission.content}
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t pt-4">
              Version {submission.version} • Submitted on {submission.createdAt ? format(new Date(typeof submission.createdAt === 'object' && 'seconds' in submission.createdAt ? (submission.createdAt as any).seconds * 1000 : submission.createdAt as string), 'PPPp') : 'Unknown'}
            </CardFooter>
          </Card>

          {/* History / Previous Feedback */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              Feedback History
            </h3>
            {submission.feedback?.map((f, idx) => (
              <Card key={idx} className={f.reviewerId === 'ai' ? "bg-blue-50/30 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900" : ""}>
                <CardHeader className="py-3 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      {f.reviewerId === 'ai' ? "🤖 AI Evaluator" : `👨‍🏫 ${f.reviewerName}`}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(f.createdAt)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-4 text-sm">
                  <p className="whitespace-pre-wrap">{f.content}</p>
                  <div className="mt-4 flex gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1">Correctness: <Badge variant="outline">{f.correctness}%</Badge></span>
                    <span className="flex items-center gap-1">Clarity: <Badge variant="outline">{f.clarity}%</Badge></span>
                  </div>
                  {f.skillImprovements && f.skillImprovements.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {f.skillImprovements.map((si, siIdx) => (
                        <Badge key={siIdx} variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px]">
                          <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                          {si.skillName} +{si.points}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        </div>

        {/* Right Column: Review Form */}
        <div className="space-y-6">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Your Review</CardTitle>
              <CardDescription>Provide expert feedback and update submission status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback Comments</Label>
                <Textarea
                  id="feedback"
                  placeholder="What did the student do well? What can they improve?"
                  className="min-h-[150px]"
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="correctness">Correctness (%)</Label>
                  <Input
                    id="correctness"
                    type="number"
                    min="0"
                    max="100"
                    value={correctness}
                    onChange={(e) => setCorrectness(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clarity">Clarity (%)</Label>
                  <Input
                    id="clarity"
                    type="number"
                    min="0"
                    max="100"
                    value={clarity}
                    onChange={(e) => setClarity(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Decision</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={status === 'approved' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setStatus('approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant={status === 'needs-revision' ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => setStatus('needs-revision')}
                  >
                    Request Revision
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleSaveReview}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Review
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{student?.displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{course?.title}</span>
              </div>
              <div className="border-t pt-4">
                <p className="font-semibold mb-1">Project Instructions:</p>
                <p className="text-muted-foreground text-xs line-clamp-6">{project?.instructions}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
