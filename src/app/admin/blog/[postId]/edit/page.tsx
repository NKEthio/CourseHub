
// src/app/admin/blog/[postId]/edit/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { onAuthStateChanged, getUserProfile } from "@/lib/firebase/auth";
import { getBlogPostById, updateBlogPost, generateSlug } from "@/lib/firebase/blog";
import type { BlogPost } from "@/types/blog";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { UserRole } from "@/lib/firebase/auth";
import { Loader2, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
  displayName?: string | null;
}

const editBlogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title must be 150 characters or less"),
  slug: z.string().min(3, "Slug is required").max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  excerpt: z.string().min(20, "Excerpt must be at least 20 characters").max(500, "Excerpt must be 500 characters or less"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  imageUrl: z.string().url("Please enter a valid image URL").min(1, "Image URL is required")
    .refine(val => val.startsWith('https://placehold.co/') || val.match(/\.(jpeg|jpg|gif|png)$/) != null, "Image URL must be a valid image link or a placehold.co URL."),
  imageHint: z.string().max(50, "Image hint must be 50 characters or less").optional(),
  status: z.enum(['draft', 'published'], { required_error: "Please select a status" }),
});

type EditBlogPostFormValues = z.infer<typeof editBlogPostSchema>;

export default function EditBlogPostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [isLoadingPost, setIsLoadingPost] = React.useState(true);
  const [initialPostData, setInitialPostData] = React.useState<BlogPost | null>(null);

  const form = useForm<EditBlogPostFormValues>({
    resolver: zodResolver(editBlogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      imageUrl: "",
      imageHint: "",
      status: "draft",
    },
  });
  
  const titleValue = form.watch("title");
  const currentSlug = form.getValues("slug");

  React.useEffect(() => {
    if (initialPostData && titleValue !== initialPostData.title && (currentSlug === generateSlug(initialPostData.title) || currentSlug === "")) {
      form.setValue("slug", generateSlug(titleValue), { shouldValidate: true });
    } else if (!initialPostData && titleValue && currentSlug === "") {
        form.setValue("slug", generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, form, initialPostData, currentSlug]);


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
        router.push(`/auth/login?redirect=/admin/blog/${postId}/edit`);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, toast, postId]);

  React.useEffect(() => {
    if (!currentUser || !postId) return;

    const fetchPost = async () => {
      setIsLoadingPost(true);
      const post = await getBlogPostById(postId);
      if (post) {
        if (post.authorId && post.authorId !== currentUser.uid && currentUser.role !== 'admin') {
            toast({ variant: "destructive", title: "Access Denied", description: "You can only edit your own posts." });
            router.push("/admin/blog");
            return;
        }
        setInitialPostData(post);
        form.reset({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          imageUrl: post.imageUrl,
          imageHint: post.imageHint || "",
          status: post.status,
        });
      } else {
        toast({ variant: "destructive", title: "Not Found", description: "Blog post not found." });
        router.push("/admin/blog");
      }
      setIsLoadingPost(false);
    };
    fetchPost();
  }, [currentUser, postId, router, toast, form]);

  const onSubmit: SubmitHandler<EditBlogPostFormValues> = (data) => {
    if (!currentUser || !postId) {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated or post ID missing." });
      return;
    }
    setIsSubmitting(true);
    
    const updateData: Partial<Omit<BlogPost, 'id' | 'createdAt'>> = {
      ...data,
    };

    try {
      updateBlogPost(postId, updateData);
      toast({
        title: "Blog Post Update Initiated",
        description: `Request to update "${data.title}" has been sent.`,
      });
      router.push("/admin/blog"); 
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Failed to Initiate Update",
        description: "An unexpected client-side error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingAuth || isLoadingPost || !currentUser || !initialPostData) {
    return (
      <div className="py-8">
         <Skeleton className="h-8 w-1/4 mb-6" />
        <Card className="w-full max-w-3xl mx-auto shadow-xl">
          <CardHeader>
            <Skeleton className="h-7 w-3/5" />
            <Skeleton className="h-5 w-4/5 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className={`h-${i === 3 ? 40 : 10} w-full`} /> {}
              </div>
            ))}
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
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
          <CardTitle className="text-2xl font-bold">Edit Blog Post</CardTitle>
          <CardDescription>Update the details for &quot;{initialPostData.title}&quot;.</CardDescription>
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
                    <FormDescription>This will be part of the URL. Be careful changing this for published posts.</FormDescription>
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
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select post status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Set whether the post is a draft or visible to the public.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
