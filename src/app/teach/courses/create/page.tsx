
// src/app/teach/courses/create/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged, getUserProfile, type UserRole } from "@/lib/firebase/auth";
import { db, auth } from "@/lib/firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
  displayName?: string | null;
}

const courseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be 100 characters or less"),
  shortDescription: z.string().min(20, "Description must be at least 20 characters").max(300, "Description must be 300 characters or less"),
  imageUrl: z.string().url("Please enter a valid image URL").min(1, "Image URL is required")
    .refine(val => val.startsWith('https://placehold.co/') || val.match(/\.(jpeg|jpg|gif|png)$/) != null, "Image URL must be a valid image link or a placehold.co URL."),
  category: z.string().min(3, "Category is required").max(50),
  level: z.enum(["Beginner", "Intermediate", "Advanced"], { required_error: "Please select a course level" }),
  price: z.coerce.number().min(0, "Price cannot be negative").optional(), // Coerce to number
  youtubeIntroLink: z.string().url("Please enter a valid YouTube URL").optional().or(z.literal('')),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function CreateCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      shortDescription: "",
      imageUrl: "https://placehold.co/400x225.png",
      category: "",
      level: undefined,
      price: 0,
      youtubeIntroLink: "",
    },
  });

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && profile.role === 'teacher') {
          setCurrentUser({ 
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            ...profile 
          } as AppUser);
        } else {
          toast({ variant: "destructive", title: "Access Denied", description: "You must be a teacher to create courses." });
          router.push('/teach');
        }
      } else {
        toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to create a course." });
        router.push('/auth/login');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);


  const onSubmit: SubmitHandler<CourseFormValues> = (data) => {
    if (!currentUser || !currentUser.uid) {
        toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
        return;
    }
    setIsSubmitting(true);
    
    const courseData = {
      ...data,
      price: data.price || 0,
      teacherId: currentUser.uid,
      teacherName: currentUser.displayName || currentUser.email || "Unnamed Teacher",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'draft' as 'draft' | 'published' | 'archived',
      enrollmentCount: 0,
      averageRating: 0,
      ratingCount: 0,
    };
    
    const coursesCollectionRef = collection(db, "courses");

    addDoc(coursesCollectionRef, courseData).then((docRef) => {
      toast({
        title: "Course Created!",
        description: `"${data.title}" has been successfully created as a draft.`,
      });
      router.push(`/teach/courses/${docRef.id}/edit`);
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: coursesCollectionRef.path,
        operation: 'create',
        requestResourceData: courseData,
      });
      errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
      setIsSubmitting(false);
    });
  };
  
  if (authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying teacher status...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
       <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
          <p className="text-destructive">Redirecting...</p>
       </div>
    );
  }


  return (
    <div className="py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create a New Course</CardTitle>
          <CardDescription>Fill in the details below to start building your course.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Next.js 14" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief summary of your course (max 300 characters)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Thumbnail Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.png or https://placehold.co/400x225.png" {...field} />
                    </FormControl>
                    <FormDescription>Use a direct link to an image (e.g., JPG, PNG) or a placehold.co URL.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Web Development, Data Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course difficulty level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter 0 for a free course" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormDescription>Enter 0 if the course is free.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="youtubeIntroLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Introduction Video URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Course and Add Lessons
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
