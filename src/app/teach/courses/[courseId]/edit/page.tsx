
// src/app/teach/courses/[courseId]/edit/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type SubmitHandler, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Loader2, BookOpen, PlusCircle, ArrowLeft, AlertCircle, Edit, Trash2, CheckCircle, HelpCircle, Percent, Lock, Unlock, GripVertical } from "lucide-react";
import { onAuthStateChanged, getUserProfile, type UserRole } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import type { Course, Lesson, QuizQuestion as QuizQuestionType, QuizOption as QuizOptionType } from "@/types/course";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
  displayName?: string | null;
}

const quizOptionSchema = z.object({
  text: z.string().min(1, "Option text cannot be empty."),
});

const quizQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text cannot be empty."),
  options: z.array(quizOptionSchema).min(2, "Each question must have at least two options."),
  correctOptionIndex: z.coerce.number({invalid_type_error: "A correct option must be selected."}).min(0, "A correct option must be selected."),
}).refine(data => data.correctOptionIndex < data.options.length, {
  message: "Selected correct option index is out of bounds. This usually means an option was deleted after being selected as correct.",
  path: ["correctOptionIndex"],
});


const lessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150, "Title can be at most 150 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  videoUrl: z.string().url("Please enter a valid URL for the video, or leave it empty.").optional().or(z.literal('')),
  hasQuiz: z.boolean().optional(),
  quizQuestions: z.array(quizQuestionSchema).optional(),
  passingGrade: z.coerce.number().min(0, "Passing grade cannot be negative").max(100, "Passing grade cannot exceed 100").optional(),
  unlocksNextLessonOnPass: z.boolean().optional(),
}).refine(data => {
  if (data.hasQuiz) {
    return data.passingGrade !== undefined &&
           data.unlocksNextLessonOnPass !== undefined &&
           Array.isArray(data.quizQuestions) && data.quizQuestions.length > 0;
  }
  return true;
}, {
  message: "If 'Has Quiz' is checked, you must add at least one question, set a passing grade, and specify unlock behavior.",
  path: ["hasQuiz"], // General path, specific errors handled by individual fields
});


type LessonFormValues = z.infer<typeof lessonSchema>;

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [course, setCourse] = React.useState<Course | null>(null);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lessonsLoading, setLessonsLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [isAddLessonDialogOpen, setIsAddLessonDialogOpen] = React.useState(false);
  const [isSubmittingLesson, setIsSubmittingLesson] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);

  const lessonForm = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      content: "",
      videoUrl: "",
      hasQuiz: false,
      quizQuestions: [],
      passingGrade: 70,
      unlocksNextLessonOnPass: false,
    },
  });

  const { fields: quizQuestionFields, append: appendQuizQuestion, remove: removeQuizQuestion } = useFieldArray({
    control: lessonForm.control,
    name: "quizQuestions",
  });

  const watchHasQuiz = lessonForm.watch("hasQuiz");

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && profile.role === 'teacher') {
          setCurrentUser({ uid: firebaseUser.uid, ...profile } as AppUser);
        } else {
          toast({ variant: "destructive", title: "Access Denied", description: "You must be a teacher to edit courses." });
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

  const fetchCourseAndLessons = React.useCallback(async () => {
    if (!courseId || !currentUser || authLoading) return;
    if (!course) setLoading(true);
    setLessonsLoading(true);
    try {
      const courseDocRef = doc(db, "courses", courseId);
      const courseDocSnap = await getDoc(courseDocRef);
      if (courseDocSnap.exists()) {
        const courseData = courseDocSnap.data() as Course;
        if (courseData.teacherId !== currentUser.uid) {
          toast({ variant: "destructive", title: "Access Denied", description: "You are not authorized to edit this course." });
          router.push('/teach/dashboard'); return;
        }
        setCourse({ id: courseDocSnap.id, ...courseData });
      } else {
        toast({ variant: "destructive", title: "Not Found", description: "Course not found." });
        router.push("/teach/dashboard"); return;
      }
      if (!course) setLoading(false);
      const lessonsCollectionRef = collection(db, "courses", courseId, "lessons");
      const q = query(lessonsCollectionRef, orderBy("order", "asc")); 
      const lessonsSnapshot = await getDocs(q);
      const fetchedLessons: Lesson[] = lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
      setLessons(fetchedLessons);
    } catch (error) {
      console.error("Error fetching course or lessons: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch course/lesson details." });
      if (!course) setLoading(false);
    } finally {
      if (!course) setLoading(false);
      setLessonsLoading(false);
    }
  }, [courseId, currentUser, router, toast, authLoading, course]); 

  React.useEffect(() => {
    fetchCourseAndLessons();
  }, [fetchCourseAndLessons]);

  const handleAddLessonSubmit: SubmitHandler<LessonFormValues> = async (data) => {
    if (!courseId || !currentUser) {
      toast({ variant: "destructive", title: "Error", description: "Cannot add lesson. Course or user not found." });
      return;
    }
    setIsSubmittingLesson(true);

    const lessonsCollectionRef = collection(db, "courses", courseId, "lessons");
    const newOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 1 : 1;

    const lessonData: Partial<Omit<Lesson, 'id'>> = {
      title: data.title,
      content: data.content,
      videoUrl: data.videoUrl || "",
      order: newOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      hasQuiz: data.hasQuiz || false,
    };

    if (data.hasQuiz) {
      lessonData.passingGrade = data.passingGrade;
      lessonData.unlocksNextLessonOnPass = data.unlocksNextLessonOnPass || false;
      lessonData.quiz = data.quizQuestions?.map(q => ({
        questionText: q.questionText,
        options: q.options.map(opt => ({ text: opt.text })),
        correctOptionIndex: q.correctOptionIndex,
      })) || [];
    } else {
      lessonData.passingGrade = undefined;
      lessonData.unlocksNextLessonOnPass = undefined;
      lessonData.quiz = undefined;
    }

    addDoc(lessonsCollectionRef, lessonData).then(() => {
      toast({ title: "Lesson Added", description: `"${data.title}" has been successfully added.` });
      lessonForm.reset({
        title: "", content: "", videoUrl: "", hasQuiz: false,
        quizQuestions: [], passingGrade: 70, unlocksNextLessonOnPass: false,
      });
      setIsAddLessonDialogOpen(false);
      fetchCourseAndLessons();
      setIsSubmittingLesson(false);
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: lessonsCollectionRef.path,
        operation: 'create',
        requestResourceData: lessonData,
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsSubmittingLesson(false);
    });
  };
  
  const handlePublishCourse = async () => {
    if (!course || !course.id) return;
    setIsPublishing(true);

    const courseDocRef = doc(db, "courses", course.id);
    const updateData = { status: 'published', updatedAt: serverTimestamp() };

    updateDoc(courseDocRef, updateData).then(() => {
      const updatedCourse = { ...course, status: 'published' as 'published', updatedAt: Timestamp.now() };
      setCourse(updatedCourse);
      toast({ title: "Course Published!", description: `"${course.title}" is now live.` });
      setIsPublishing(false);
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: courseDocRef.path,
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsPublishing(false);
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Course Not Found</h2>
        <Button asChild className="mt-4"><Link href="/teach/dashboard">Go to Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/teach/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
          </Button>
          <h1 className="text-3xl font-bold text-primary">Edit Course: {course.title}</h1>
          <p className="text-muted-foreground">Status: 
            <span className={`font-semibold ml-1 ${course.status === 'published' ? 'text-green-600' : 'text-orange-500'}`}>
              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
            </span>
          </p>
        </div>
        {course.status === 'draft' && (
          <Button onClick={handlePublishCourse} disabled={isPublishing || lessons.length === 0}>
            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}Publish Course
          </Button>
        )}
        {course.status === 'published' && (
          <Button variant="secondary" disabled className="cursor-default">
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />Published
          </Button>
        )}
      </div>
      {course.status === 'draft' && lessons.length === 0 && (
        <Alert variant="default" className="bg-accent/20 border-accent/50">
          <BookOpen className="h-4 w-4 text-accent" /><AlertTitle className="text-accent">Add Lessons to Publish</AlertTitle>
          <AlertDescription>Your course needs at least one lesson before it can be published.</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Course Details</CardTitle><CardDescription>Basic information.</CardDescription></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Title: <span className="font-medium text-foreground">{course.title}</span></p>
              <p className="text-sm text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{course.category}</span></p>
              <Button variant="outline" size="sm" className="mt-4" disabled><Edit className="mr-2 h-3 w-3" />Edit Details (Soon)</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Lessons ({lessons.length})</CardTitle><CardDescription>Manage course content.</CardDescription></div>
              <Dialog open={isAddLessonDialogOpen} onOpenChange={(isOpen) => { setIsAddLessonDialogOpen(isOpen); if (!isOpen) lessonForm.reset(); }}>
                <DialogTrigger asChild><Button variant="default"><PlusCircle className="mr-2 h-4 w-4" />Add Lesson</Button></DialogTrigger>
                <DialogContent className="sm:max-w-2xl"> {/* Increased width for quiz form */}
                  <DialogHeader>
                    <DialogTitle>Add New Lesson to &quot;{course.title}&quot;</DialogTitle>
                    <DialogDescription>Fill in lesson details. Add quiz questions if needed.</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] pr-6"> {/* ScrollArea for long forms */}
                    <Form {...lessonForm}>
                      <form onSubmit={lessonForm.handleSubmit(handleAddLessonSubmit)} className="space-y-6 py-4">
                        <FormField control={lessonForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Lesson Title</FormLabel><FormControl><Input placeholder="e.g., Intro to Variables" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={lessonForm.control} name="content" render={({ field }) => (<FormItem><FormLabel>Lesson Content</FormLabel><FormControl><Textarea placeholder="Explain concepts..." {...field} rows={5} /></FormControl><FormDescription>Markdown supported.</FormDescription><FormMessage /></FormItem>)} />
                        <FormField control={lessonForm.control} name="videoUrl" render={({ field }) => (<FormItem><FormLabel>Video URL (Optional)</FormLabel><FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        
                        <FormField control={lessonForm.control} name="hasQuiz" render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>This lesson includes a quiz</FormLabel></div>
                          </FormItem>
                        )} />

                        {watchHasQuiz && (
                          <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                            <FormField control={lessonForm.control} name="passingGrade" render={({ field }) => (<FormItem><FormLabel>Passing Grade (%)</FormLabel><FormControl><Input type="number" placeholder="70" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={lessonForm.control} name="unlocksNextLessonOnPass" render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="font-normal">Require passing to unlock next lesson</FormLabel></FormItem>)} />
                            
                            <h4 className="text-md font-semibold pt-2">Quiz Questions</h4>
                            {quizQuestionFields.map((questionField, questionIndex) => (
                              <Card key={questionField.id} className="p-4 bg-background shadow-md">
                                <FormField control={lessonForm.control} name={`quizQuestions.${questionIndex}.questionText`} render={({ field }) => (
                                  <FormItem><FormLabel>Question {questionIndex + 1}</FormLabel><FormControl><Textarea placeholder="Enter question text" {...field} rows={2}/></FormControl><FormMessage /></FormItem>)} />
                                
                                <FormLabel className="mt-3 mb-1 block text-sm font-medium">Options & Correct Answer</FormLabel>
                                <Controller
                                  control={lessonForm.control}
                                  name={`quizQuestions.${questionIndex}.correctOptionIndex`}
                                  render={({ field: radioField }) => (
                                    <RadioGroup onValueChange={radioField.onChange} value={radioField.value?.toString()} className="space-y-2 mt-1">
                                      <OptionsArray control={lessonForm.control} questionIndex={questionIndex} radioValue={radioField.value} />
                                    </RadioGroup>
                                  )}
                                />
                                 <FormMessage>{lessonForm.formState.errors.quizQuestions?.[questionIndex]?.correctOptionIndex?.message}</FormMessage>
                                 <FormMessage>{lessonForm.formState.errors.quizQuestions?.[questionIndex]?.options?.message}</FormMessage>


                                <Button type="button" variant="destructive" size="sm" onClick={() => removeQuizQuestion(questionIndex)} className="mt-3">Remove Question</Button>
                              </Card>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendQuizQuestion({ questionText: "", options: [{ text: "" }, { text: "" }], correctOptionIndex: -1 })}>Add Question</Button>
                            <FormMessage>{lessonForm.formState.errors.quizQuestions?.message || lessonForm.formState.errors.quizQuestions?.root?.message}</FormMessage>
                          </div>
                        )}
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                          <Button type="submit" disabled={isSubmittingLesson}>{isSubmittingLesson && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Lesson</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {lessonsLoading && <div className="space-y-3 py-3"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>}
              {!lessonsLoading && lessons.length === 0 && (
                <div className="border-2 border-dashed rounded-md p-6 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-10 w-10 mb-3" /><p className="font-semibold">No lessons yet for &quot;{course.title}&quot;.</p>
                </div>
              )}
              {!lessonsLoading && lessons.length > 0 && (
                <ul className="space-y-3 mt-3">
                  {lessons.map((lesson, index) => (
                    <li key={lesson.id || index} className="flex items-start justify-between p-3 border rounded-md bg-card hover:bg-muted/50">
                      <div className="w-full">
                        <div className="flex justify-between items-center w-full">
                            <h4 className="font-medium text-base flex items-center">
                                {lesson.order}. {lesson.title}
                                {lesson.quiz && lesson.quiz.length > 0 && <HelpCircle className="ml-2 h-4 w-4 text-blue-500" title="Contains a quiz" />}
                            </h4>
                            <div className="flex gap-2 self-start sm:self-center">
                                <Button variant="outline" size="sm" className="h-7 px-2 py-1" disabled><Edit className="mr-1 h-3 w-3" />Edit</Button>
                                <Button variant="destructive" size="sm" className="h-7 px-2 py-1" disabled><Trash2 className="mr-1 h-3 w-3" />Del</Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-full prose prose-sm dark:prose-invert">{lesson.content.substring(0,100)}{lesson.content.length > 100 ? '...' : ''}</p>
                        {lesson.videoUrl && <p className="text-xs text-blue-500 hover:underline mt-0.5"><a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">Video Link</a></p>}
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {lesson.hasQuiz && (<div className="flex items-center gap-1 p-1 bg-blue-100 dark:bg-blue-900/30 rounded-md"><HelpCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />Quiz
                            {lesson.passingGrade !== undefined && <span className="flex items-center ml-0.5 text-blue-700 dark:text-blue-300">(<Percent className="h-2.5 w-2.5 mr-0.5" />{lesson.passingGrade})</span>}</div>)}
                          {lesson.hasQuiz && lesson.unlocksNextLessonOnPass && (<div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-orange-900/30 rounded-md"><Lock className="h-3 w-3 text-orange-600 dark:text-orange-400" />Unlocks Next</div>)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1 space-y-6">
            <Card className="shadow-md"><CardHeader><CardTitle>Course Preview</CardTitle></CardHeader>
                <CardContent>
                    <div className="aspect-[16/9] bg-muted rounded-lg overflow-hidden flex items-center justify-center mb-3 shadow">
                        <img src={course.imageUrl || 'https://placehold.co/400x225.png'} alt={`Preview of ${course.title}`} className="object-cover w-full h-full" data-ai-hint="course preview" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x225.png'; }}/>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight text-primary">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-2 h-12 overflow-hidden">{course.shortDescription}</p>
                    <div className="text-xs space-y-0.5">
                        <p><span className="font-medium">Category:</span> {course.category}</p>
                        <p><span className="font-medium">Price:</span> {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}</p>
                    </div>
                </CardContent>
            </Card>
             <Card className="shadow-md"><CardHeader><CardTitle>Settings & Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" disabled><BookOpen className="mr-2 h-4 w-4" />View as Student (Soon)</Button>
                    <Button variant="destructive" className="w-full justify-start" disabled><Trash2 className="mr-2 h-4 w-4" />Delete Course (Soon)</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

// Helper component for rendering options array in react-hook-form
function OptionsArray({ control, questionIndex, radioValue }: { control: any, questionIndex: number, radioValue: any }) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: `quizQuestions.${questionIndex}.options`,
  });

  return (
    <div className="space-y-2 pl-2">
      {fields.map((optionField, optionIndex) => (
        <div key={optionField.id} className="flex items-center space-x-2">
          <FormControl>
             <RadioGroupItem value={optionIndex.toString()} id={`q${questionIndex}-opt${optionIndex}`} />
          </FormControl>
          <FormField
            control={control}
            name={`quizQuestions.${questionIndex}.options.${optionIndex}.text`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl><Input placeholder={`Option ${optionIndex + 1}`} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(optionIndex)} className="h-8 w-8" disabled={fields.length <= 2}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "" })} className="mt-2">
        Add Option
      </Button>
    </div>
  );
}
