
// src/app/admin/blog/create/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { onAuthStateChanged, getUserProfile } from "@/lib/firebase/auth";
import { createBlogPost, generateSlug } from "@/lib/firebase/blog";
import type { BlogPost } from "@/types/blog";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { UserRole } from "@/lib/firebase/auth";
import { Loader2, ArrowLeft } from "lucide-react";

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
  displayName?: string | null;
}

const blogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be 150 characters or less"),
  slug: z.string().min(3, "Slug is required").max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  excerpt: z.string().min(20, "Excerpt must be at least 20 characters").max(500, "Excerpt must be 500 characters or less"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  imageUrl: z.string().url("Please enter a valid image URL").min(1, "Image URL is required")
    .refine(val => val.startsWith('https://placehold.co/') || val.match(/\.(jpeg|jpg|gif|png)$/) != null, "Image URL must be a valid image link or a placehold.co URL."),
  imageHint: z.string().max(50, "Image hint must be 50 characters or less").optional(),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

export default function CreateBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      imageUrl: "https://placehold.co/800x450.png",
      imageHint: "",
    },
  });

  const titleValue = form.watch("title");
  React.useEffect(() => {
    if (titleValue) {
      form.setValue("slug", generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, form]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile && profile.role === 'admin') {
          setCurrentUser({ ...user, ...profile });
        } else {
          toast({ variant: "destructive", title: "Access Denied", description: "You are not authorized." });
          router.push("/admin");
        }
      } else {
        router.push("/auth/login?redirect=/admin/blog/create");
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  const onSubmit: SubmitHandler<BlogPostFormValues> = (data) => {
    if (!currentUser || !currentUser.uid) {
      toast({ variant: "destructive", title: "Error", description: "Admin user not authenticated." });
      return;
    }
    setIsSubmitting(true);
    
    const newPostData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      author: currentUser.displayName || currentUser.email || "Admin",
      authorId: currentUser.uid,
      status: 'draft', // New posts are drafts by default
    };

    try {
      createBlogPost(newPostData);
      toast({
        title: "Blog Post Creation Initiated",
        description: `Request to create "${data.title}" has been sent.`,
      });
      // We can't get the ID here anymore since it's fire-and-forget
      // So we just go back to the list page.
      router.push(`/admin/blog`);
    } catch (e) {
      // This will only catch client-side errors before the call, not server errors
      console.error(e);
      toast({
        variant: "destructive",
        title: "Failed to Initiate Creation",
        description: "An unexpected client-side error occurred.",
      });
      setIsSubmitting(false);
    }
    // isSubmitting will be false even if the request is in-flight.
    // This is part of the optimistic UI approach.
    // A better implementation might disable the button until navigation happens.
    // For now, we rely on quick navigation.
  };
  
  if (isLoadingAuth || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-8">
       <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/admin/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog Management
        </Link>
      </Button>
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Blog Post</CardTitle>
          <CardDescription>Fill in the details for your new article.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Your amazing blog post title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="your-amazing-blog-post-title" {...field} />
                    </FormControl>
                    <FormDescription>This will be part of the URL. Auto-generated from title.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short summary that appears in lists..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write your full blog post here. HTML or Markdown is supported." {...field} rows={15} />
                    </FormControl>
                    <FormDescription>Supports HTML. For Markdown, ensure your display component can parse it.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.png or https://placehold.co/800x450.png" {...field} />
                    </FormControl>
                    <FormDescription>Direct link to the main image for this post.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image AI Hint (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., technology abstract" {...field} />
                    </FormControl>
                    <FormDescription>One or two keywords for AI image search if applicable.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Post
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
