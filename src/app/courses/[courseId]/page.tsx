
// src/app/courses/[courseId]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc, collection, query, orderBy, getDocs, Timestamp, updateDoc, setDoc, increment, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import type { Course, Lesson, Review, Project } from "@/types/course";
import dynamic from "next/dynamic";
const ProjectSubmission = dynamic(() => import("@/components/project/ProjectSubmission"), { ssr: false });
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, BookOpen, CalendarDays, DollarSign, Film, Info, ListChecks, Loader2, User, CheckCircle, BarChart3, UserPlus, Users, Star, MessageSquare, Send } from "lucide-react";
import { onAuthStateChanged, type User as FirebaseAuthUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [course, setCourse] = React.useState<Course | null>(null);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [currentUser, setCurrentUser] = React.useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = React.useState<{ displayName?: string | null, photoURL?: string | null } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isEnrolled, setIsEnrolled] = React.useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = React.useState(true);
  const [isEnrolling, setIsEnrolling] = React.useState(false);

  const [isLoadingReviews, setIsLoadingReviews] = React.useState(true);
  const [userHasReviewed, setUserHasReviewed] = React.useState(false);
  const [reviewRating, setReviewRating] = React.useState(0);
  const [reviewComment, setReviewComment] = React.useState("");
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as { displayName?: string | null, photoURL?: string | null });
        } else {
          setUserProfile({ displayName: user.displayName, photoURL: user.photoURL });
        }
      } else {
        setUserProfile(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchCourseData = React.useCallback(async () => {
    if (!courseId) {
      setError("Course ID is missing.");
      setIsLoading(false);
      setIsCheckingEnrollment(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const courseDocRef = doc(db, "courses", courseId);
      const courseDocSnap = await getDoc(courseDocRef);

      if (courseDocSnap.exists()) {
        const courseData = courseDocSnap.data() as Course;
        if (courseData.status !== 'published') {
          setError("This course is not currently available.");
          setCourse(null);
        } else {
          setCourse({ id: courseDocSnap.id, ...courseData });
        }
      } else {
        setError("Course not found.");
        setCourse(null);
      }
    } catch (err) {
      console.error("Error fetching course details:", err);
      setError("Failed to load course details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const fetchLessons = React.useCallback(async () => {
    if (!courseId || !course || course.status !== 'published') return;
    try {
      const lessonsCollectionRef = collection(db, "courses", courseId, "lessons");
      const q = query(lessonsCollectionRef, orderBy("order", "asc"));
      const lessonsSnapshot = await getDocs(q);
      const fetchedLessons: Lesson[] = lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
      setLessons(fetchedLessons);
    } catch (err) {
      console.error("Error fetching lessons:", err);
      // Non-critical, so don't set global error
      toast({ variant: "destructive", title: "Error", description: "Could not load lessons." });
    }
  }, [courseId, course, toast]);

  const fetchReviews = React.useCallback(async () => {
    if (!courseId || !course || course.status !== 'published') return;
    setIsLoadingReviews(true);
    try {
      const reviewsCollectionRef = collection(db, "courses", courseId, "reviews");
      const q = query(reviewsCollectionRef, orderBy("createdAt", "desc"));
      const reviewsSnapshot = await getDocs(q);
      const fetchedReviews: Review[] = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(fetchedReviews);

      if (currentUser && fetchedReviews.some(r => r.userId === currentUser.uid)) {
        setUserHasReviewed(true);
      } else {
        setUserHasReviewed(false);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast({ variant: "destructive", title: "Error", description: "Could not load reviews." });
    } finally {
      setIsLoadingReviews(false);
    }
  }, [courseId, course, currentUser, toast]);


  React.useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  React.useEffect(() => {
    if (course) {
      fetchLessons();
      fetchReviews();
    }
  }, [course, fetchLessons, fetchReviews]);


  React.useEffect(() => {
    if (!currentUser || !courseId || isLoading) {
      setIsCheckingEnrollment(currentUser ? true : false);
      if (!currentUser && !isAuthLoading) setIsCheckingEnrollment(false);
      return;
    }
    
    const checkEnrollment = async () => {
      setIsCheckingEnrollment(true);
      try {
        const enrollmentDocRef = doc(db, "users", currentUser.uid, "enrolledCourses", courseId);
        const enrollmentDocSnap = await getDoc(enrollmentDocRef);
        setIsEnrolled(enrollmentDocSnap.exists());
      } catch (err) {
        console.error("Error checking enrollment:", err);
        toast({ variant: "destructive", title: "Enrollment Check Failed", description: "Could not verify your enrollment status." });
      } finally {
        setIsCheckingEnrollment(false);
      }
    };
    checkEnrollment();
  }, [currentUser, courseId, isLoading, isAuthLoading, toast]);


  const handleEnroll = async () => {
    if (!currentUser) {
      toast({ variant: "default", title: "Login Required", description: "Please log in to enroll in courses." });
      router.push(`/auth/login?redirect=/courses/${courseId}`);
      return;
    }
    if (!course || !course.id || isEnrolled || isEnrolling) return;

    setIsEnrolling(true);

    const enrollmentData = {
      courseId: course.id,
      enrollmentDate: serverTimestamp(),
      courseTitle: course.title
    };
    const enrollmentDocRef = doc(db, "users", currentUser.uid, "enrolledCourses", course.id);
    const courseDocRef = doc(db, "courses", course.id);

    const batch = writeBatch(db);
    batch.set(enrollmentDocRef, enrollmentData);
    batch.update(courseDocRef, { enrollmentCount: increment(1) });
    
    batch.commit().then(() => {
      setIsEnrolled(true);
      setCourse(prev => prev ? ({ ...prev, enrollmentCount: (prev.enrollmentCount || 0) + 1 }) : null);
      toast({ title: "Enrollment Successful!", description: `You are now enrolled in "${course.title}".` });
      setIsEnrolling(false);
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: `BATCH WRITE: ${enrollmentDocRef.path} & ${courseDocRef.path}`, // Note: This is a simplified path for batches
        operation: 'create',
        requestResourceData: { enrollment: enrollmentData, courseIncrement: { enrollmentCount: 1 } },
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsEnrolling(false);
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !course || !course.id || !isEnrolled || userHasReviewed || reviewRating === 0 || !reviewComment.trim()) {
      toast({ variant: "destructive", title: "Cannot Submit Review", description: "Please ensure you are enrolled, have rated, and commented." });
      return;
    }
    setIsSubmittingReview(true);
    
    const reviewData: Review = {
      courseId: course.id,
      userId: currentUser.uid,
      userName: userProfile?.displayName || currentUser.email || "Anonymous User",
      userPhotoURL: userProfile?.photoURL || currentUser.photoURL,
      rating: reviewRating,
      comment: reviewComment.trim(),
      createdAt: Timestamp.now(),
    };
    
    const reviewDocRef = doc(db, "courses", course.id, "reviews", currentUser.uid);

    setDoc(reviewDocRef, reviewData).then(() => {
      toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
      setReviewRating(0);
      setReviewComment("");
      setUserHasReviewed(true);
      fetchReviews(); // Re-fetch reviews to show the new one
      setIsSubmittingReview(false);
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: reviewDocRef.path,
        operation: 'create',
        requestResourceData: reviewData,
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsSubmittingReview(false);
    });
  };


  if (isLoading || isAuthLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-12 w-3/4" /> <Skeleton className="h-6 w-1/2" />
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-40 w-full" /> <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" /> <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-6"> <Skeleton className="h-64 w-full rounded-lg" /> </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Loading Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild>
          <Link href="/courses"> <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Courses </Link>
        </Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
         <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Course Not Available</h2>
        <p className="text-muted-foreground mb-6">The course you are looking for could not be found or is not available.</p>
        <Button asChild>
          <Link href="/courses"> <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Courses </Link>
        </Button>
      </div>
    );
  }

  const formatDate = (dateValue: Timestamp | string | undefined) => {
    if (!dateValue) return "N/A";
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const enrollButtonText = () => {
    if (isCheckingEnrollment) return "Checking Status...";
    if (isEnrolling) return "Enrolling...";
    if (isEnrolled) return "Enrolled";
    return course.price && course.price > 0 ? `Enroll for $${course.price.toFixed(2)}` : "Enroll for Free";
  }


  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/courses"> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses </Link>
      </Button>

      <div className="grid md:grid-cols-3 gap-x-8 gap-y-10">
        <div className="md:col-span-2 space-y-8">
          <header className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary lg:text-5xl">{course.title}</h1>
            <p className="text-xl text-muted-foreground">{course.shortDescription}</p>
            <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-4 gap-y-2 pt-1">
                <div className="flex items-center"> <User className="mr-1.5 h-4 w-4" /> By {course.teacherName} </div>
                <div className="flex items-center"> <CalendarDays className="mr-1.5 h-4 w-4" /> Last updated: {formatDate(course.updatedAt)} </div>
                <div className="flex items-center"> <Star className="mr-1.5 h-4 w-4 text-accent fill-accent" /> {course.averageRating?.toFixed(1) || 'N/A'} ({course.ratingCount || 0} ratings)</div>
            </div>
          </header>

          <div className="aspect-video w-full relative overflow-hidden rounded-xl shadow-lg">
            <Image 
              src={course.imageUrl || "https://placehold.co/800x450.png"} 
              alt={course.title} 
              fill
              objectFit="cover" 
              data-ai-hint="course detail"
              priority
            />
          </div>

          <Card>
            <CardHeader> <CardTitle className="flex items-center text-2xl"> <Info className="mr-2 h-6 w-6 text-primary" /> About this course </CardTitle> </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>{course.shortDescription}</p>
              {course.youtubeIntroLink && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Course Introduction Video</h3>
                  <div className="aspect-video">
                    <iframe className="w-full h-full rounded-lg" src={`https://www.youtube.com/embed/${course.youtubeIntroLink.split('v=')[1]?.split('&')[0] || course.youtubeIntroLink.split('/').pop()}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl"> <ListChecks className="mr-2 h-6 w-6 text-primary" /> Course Content </CardTitle>
              <CardDescription>{lessons.length} lessons</CardDescription>
            </CardHeader>
            <CardContent>
              {lessons.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {lessons.map((lesson, index) => (
                    <AccordionItem value={`lesson-${index}`} key={lesson.id || index}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                           <span className={`flex items-center justify-center h-6 w-6 rounded-full ${index < lessons.length ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} text-xs font-semibold`}> {lesson.order} </span>
                          <span className="text-base font-medium">{lesson.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="prose dark:prose-invert max-w-none pl-12 pr-4 pb-4">
                        <p>{lesson.content}</p>
                        {lesson.videoUrl && (
                          <div className="mt-3">
                            <Button asChild variant="outline" size="sm">
                              <Link href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"> <Film className="mr-2 h-4 w-4" /> Watch Lesson Video </Link>
                            </Button>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {/* New: Project Section */}
                  {course.modules?.flatMap(m => m.projects).map((project, index) => (
                    <AccordionItem value={`project-${index}`} key={project.id || index}>
                       <AccordionTrigger className="hover:no-underline border-t">
                        <div className="flex items-center gap-3">
                           <span className="flex items-center justify-center h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-semibold"> P </span>
                          <span className="text-base font-medium">{project.title}</span>
                          <Badge variant="outline" className="ml-2">Project</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-6 pl-12 pr-4 pb-4">
                        <div className="prose dark:prose-invert max-w-none">
                          <p>{project.description}</p>
                          <h4>Instructions</h4>
                          <p>{project.instructions}</p>
                        </div>
                        {isEnrolled ? (
                          <ProjectSubmission
                            projectId={project.id || `p-${index}`}
                            projectTitle={project.title}
                            projectInstructions={project.instructions}
                          />
                        ) : (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Enrollment Required</AlertTitle>
                            <AlertDescription>Please enroll in the course to submit this project and receive AI feedback.</AlertDescription>
                          </Alert>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <BookOpen className="mx-auto h-10 w-10 mb-3" />
                  <p>No lessons have been added to this course yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl"><MessageSquare className="mr-2 h-6 w-6 text-primary" />Student Reviews ({reviews.length})</CardTitle>
              <CardDescription>See what other students are saying about this course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Leave a Review Form */}
              {currentUser && isEnrolled && !userHasReviewed && (
                <form onSubmit={handleReviewSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h3 className="text-lg font-semibold">Leave Your Review</h3>
                  <div>
                    <Label htmlFor="rating" className="mb-1 block">Your Rating</Label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 cursor-pointer transition-colors ${reviewRating >= star ? 'text-accent fill-accent' : 'text-muted-foreground hover:text-accent/70'}`}
                          onClick={() => setReviewRating(star)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="comment">Your Comment</Label>
                    <Textarea
                      id="comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your thoughts on the course..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}>
                    {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Review
                  </Button>
                </form>
              )}
              {currentUser && isEnrolled && userHasReviewed && (
                <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-700 dark:text-green-300">Review Submitted</AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-400">You've already reviewed this course. Thank you for your feedback!</AlertDescription>
                </Alert>
              )}
              {!currentUser && (
                 <Alert>
                    <Info className="h-4 w-4"/>
                    <AlertTitle>Log in to review</AlertTitle>
                    <AlertDescription>
                        Please <Link href={`/auth/login?redirect=/courses/${courseId}`} className="underline hover:text-primary">log in</Link> and enroll to leave a review.
                    </AlertDescription>
                 </Alert>
              )}
               {currentUser && !isEnrolled && (
                 <Alert>
                    <Info className="h-4 w-4"/>
                    <AlertTitle>Enroll to review</AlertTitle>
                    <AlertDescription>
                        You must be enrolled in this course to leave a review.
                    </AlertDescription>
                 </Alert>
              )}


              {/* Display Reviews List */}
              {isLoadingReviews && (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full rounded-md" />
                  <Skeleton className="h-20 w-full rounded-md" />
                </div>
              )}
              {!isLoadingReviews && reviews.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No reviews yet for this course. Be the first to leave one!</p>
              )}
              {!isLoadingReviews && reviews.length > 0 && (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id || review.userId} className="flex items-start space-x-4 p-4 border rounded-lg bg-card">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.userPhotoURL || `https://placehold.co/40x40.png`} alt={review.userName} data-ai-hint="user avatar"/>
                        <AvatarFallback>{review.userName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{review.userName}</h4>
                          <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="flex items-center my-1">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg sticky top-24">
            <CardHeader>
                <CardTitle className="text-2xl"> {course.price && course.price > 0 ? `$${course.price.toFixed(2)}` : "Free"} </CardTitle>
                 {course.price && course.price > 0 && <CardDescription>One-time payment</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              <Button size="lg" className="w-full" onClick={handleEnroll} disabled={isEnrolled || isCheckingEnrollment || isEnrolling || !currentUser}>
                {isEnrolling || isCheckingEnrollment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEnrolled ? <CheckCircle className="mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4" />)}
                {enrollButtonText()}
              </Button>
               {!currentUser && !isAuthLoading && (
                <p className="text-xs text-center text-muted-foreground">
                  <Link href={`/auth/login?redirect=/courses/${courseId}`} className="underline hover:text-primary">Log in</Link> or <Link href={`/auth/register?redirect=/courses/${courseId}`} className="underline hover:text-primary">Sign up</Link> to enroll.
                </p>
              )}
              <div className="space-y-2 text-sm">
                 <div className="flex items-center"> <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" /> Level: <Badge variant="secondary" className="ml-1">{course.level}</Badge> </div>
                <div className="flex items-center"> <ListChecks className="mr-2 h-4 w-4 text-muted-foreground" /> Lessons: {lessons.length} </div>
                 <div className="flex items-center"> <User className="mr-2 h-4 w-4 text-muted-foreground" /> Instructor: {course.teacherName} </div>
                 <div className="flex items-center"> <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> Category: <Badge variant="outline" className="ml-1">{course.category}</Badge> </div>
                <div className="flex items-center"> <Users className="mr-2 h-4 w-4 text-muted-foreground" /> Enrolled: {course.enrollmentCount || 0} students </div>
              </div>
            </CardContent>
            <CardFooter> <p className="text-xs text-muted-foreground text-center w-full">30-Day Money-Back Guarantee (if applicable)</p> </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
