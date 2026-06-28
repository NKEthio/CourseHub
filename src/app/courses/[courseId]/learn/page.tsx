
"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  Timestamp,
  setDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { onAuthStateChanged } from "@/lib/firebase/auth";
import type { User as FirebaseAuthUser } from "firebase/auth";
import type { Course, Lesson, Project } from "@/types/course";
import type { Progress } from "@/types/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  FileText,
  Lock,
  Menu,
  Loader2,
  CheckCircle,
  Circle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProjectSubmission from "@/components/project/ProjectSubmission";
import { cn } from "@/lib/utils";

type ContentItem = {
  id: string;
  type: 'lesson' | 'project';
  title: string;
  content?: string;
  videoUrl?: string;
  instructions?: string;
  order: number;
};

export default function LearnPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [course, setCourse] = React.useState<Course | null>(null);
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(searchParams.get("item") || null);
  const [progress, setProgress] = React.useState<Progress | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isEnrolled, setIsEnrolled] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  // Auth & Enrollment Check
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user: FirebaseAuthUser | null) => {
      setCurrentUser(user);
      if (user && db) {
        const enrollmentDoc = await getDoc(doc(db, "users", user.uid, "enrolledCourses", courseId));
        if (!enrollmentDoc.exists()) {
          toast({ variant: "destructive", title: "Not Enrolled", description: "You must be enrolled to access this course." });
          router.push(`/courses/${courseId}`);
          return;
        }
        setIsEnrolled(true);

        // Listen for progress
        const progressRef = doc(db, "users", user.uid, "progress", courseId);
        const unsubProgress = onSnapshot(progressRef, (docSnap) => {
          if (docSnap.exists()) {
            setProgress(docSnap.data() as Progress);
          } else {
            // Initialize progress if it doesn't exist
            const initialProgress = {
              studentId: user.uid,
              courseId: courseId,
              skills: [],
              completedLessons: [],
              completedProjects: [],
              revisionsCount: {},
              lastActivityAt: serverTimestamp(),
              overallCompletion: 0
            };
            setDoc(progressRef, initialProgress);
          }
        });
        return () => unsubProgress();
      } else if (!user) {
        router.push(`/auth/login?redirect=/courses/${courseId}/learn`);
      }
    });
    return () => unsubscribe();
  }, [courseId, router, toast]);

  // Fetch Course Data
  React.useEffect(() => {
    if (!isEnrolled || !db) return;

    const fetchData = async () => {
      try {
        const courseDoc = await getDoc(doc(db as any, "courses", courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data() as Course;
          setCourse(courseData);

          // Fetch Lessons
          const lessonsSnap = await getDocs(query(collection(db as any, "courses", courseId, "lessons"), orderBy("order", "asc")));
          const lessons: ContentItem[] = lessonsSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              type: 'lesson',
              title: data.title,
              content: data.content,
              videoUrl: data.videoUrl,
              order: data.order
            };
          });

          // Fetch Projects
          const projectsSnap = await getDocs(query(collection(db as any, "courses", courseId, "projects"), orderBy("order", "asc")));
          const projects: ContentItem[] = projectsSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              type: 'project',
              title: data.title,
              instructions: data.instructions,
              order: data.order
            };
          });

          const allItems = [...lessons, ...projects].sort((a, b) => a.order - b.order);
          setItems(allItems);

          if (!activeItemId && allItems.length > 0) {
            setActiveItemId(allItems[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching course data:", err);
        toast({ variant: "destructive", title: "Error", description: "Failed to load course content." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId, isEnrolled, toast]);

  const activeItem = items.find(i => i.id === activeItemId);

  const handleMarkAsComplete = async () => {
    if (!currentUser || !activeItem || activeItem.type !== 'lesson' || !db) return;

    const progressRef = doc(db, "users", currentUser.uid, "progress", courseId);
    const updatedCompletedLessons = [...(progress?.completedLessons || [])];
    if (!updatedCompletedLessons.includes(activeItem.id)) {
      updatedCompletedLessons.push(activeItem.id);

      const overallCompletion = Math.round((updatedCompletedLessons.length + (progress?.completedProjects?.length || 0)) / items.length * 100);

      await setDoc(progressRef, {
        completedLessons: updatedCompletedLessons,
        overallCompletion,
        lastActivityAt: serverTimestamp()
      }, { merge: true });

      toast({ title: "Lesson Completed!", description: "Progress updated." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/courses/${courseId}`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Badge variant="outline">{progress?.overallCompletion || 0}% Complete</Badge>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <h2 className="font-bold text-lg px-2">{course?.title}</h2>
            <div className="space-y-1">
              {items.map((item) => {
                const isCompleted = item.type === 'lesson'
                  ? progress?.completedLessons.includes(item.id)
                  : progress?.completedProjects.includes(item.id);
                const isActive = activeItemId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveItemId(item.id);
                      router.push(`?item=${item.id}`, { scroll: false });
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                      !isActive && isCompleted && "text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    ) : isActive ? (
                      <Circle className="h-4 w-4 shrink-0" />
                    ) : (
                      item.type === 'lesson' ? <PlayCircle className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate flex-1 text-left">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeItem ? (
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                {activeItem.type}
              </div>
              <h1 className="text-3xl font-bold">{activeItem.title}</h1>
            </div>

            {activeItem.type === 'lesson' ? (
              <div className="space-y-6">
                {activeItem.videoUrl && (
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                     <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${activeItem.videoUrl.split('v=')[1]?.split('&')[0] || activeItem.videoUrl.split('/').pop()}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
                <div className="prose dark:prose-invert max-w-none">
                  {activeItem.content}
                </div>
                <div className="pt-8 border-t flex justify-end">
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleMarkAsComplete}
                      disabled={progress?.completedLessons.includes(activeItem.id)}
                    >
                      {progress?.completedLessons.includes(activeItem.id) ? (
                        <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Completed</>
                      ) : (
                        "Mark as Completed"
                      )}
                    </Button>
                    {items.indexOf(activeItem) < items.length - 1 && (
                      <Button
                        size="lg"
                        onClick={() => {
                          const nextItem = items[items.indexOf(activeItem) + 1];
                          setActiveItemId(nextItem.id);
                          router.push(`?item=${nextItem.id}`, { scroll: false });
                        }}
                      >
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-muted p-6 rounded-lg border">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project Instructions
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{activeItem.instructions}</p>
                </div>
                <ProjectSubmission
                  projectId={activeItem.id}
                  courseId={courseId}
                  projectTitle={activeItem.title}
                  projectInstructions={activeItem.instructions || ''}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a lesson or project to start learning.
          </div>
        )}
      </main>
    </div>
  );
}
