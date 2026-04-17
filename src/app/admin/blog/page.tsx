
// src/app/admin/blog/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { onAuthStateChanged, getUserProfile } from "@/lib/firebase/auth";
import { getBlogPosts, deleteBlogPost } from "@/lib/firebase/blog";
import type { BlogPost } from "@/types/blog";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { UserRole } from "@/lib/firebase/auth";
import { PlusCircle, Edit, Trash2, Loader2, Newspaper, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Timestamp } from "firebase/firestore";

interface AppUser extends FirebaseAuthUser {
  role?: UserRole;
}

export default function AdminBlogManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [blogPosts, setBlogPosts] = React.useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = React.useState(true);
  const [postToDelete, setPostToDelete] = React.useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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
        router.push("/auth/login?redirect=/admin/blog");
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  const fetchPosts = React.useCallback(async () => {
    setIsLoadingPosts(true);
    const posts = await getBlogPosts(false); // Fetch all posts (drafts and published)
    setBlogPosts(posts);
    setIsLoadingPosts(false);
  }, []);

  React.useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser, fetchPosts]);

  const handleDeletePost = () => {
    if (!postToDelete || !postToDelete.id) return;
    setIsDeleting(true);
    
    try {
      deleteBlogPost(postToDelete.id);
      toast({ title: "Post Deletion Initiated", description: `Request to delete "${postToDelete.title}" has been sent.` });
      
      // Optimistic UI update
      setBlogPosts(prevPosts => prevPosts.filter(p => p.id !== postToDelete.id));

    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error Deleting Post", description: "Could not initiate post deletion." });
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };
  
  const formatDate = (timestamp: Timestamp | string | undefined) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };


  if (isLoadingAuth || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
       <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/admin">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>
      </Button>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-primary flex items-center">
            <Newspaper className="mr-3 h-8 w-8" /> Blog Post Management
            </h1>
            <p className="text-muted-foreground">Create, edit, and manage all blog posts.</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
          <CardDescription>A list of all blog posts on the platform, including drafts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPosts ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : blogPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No blog posts found. Create one to get started!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      <Link href={`/blog/${post.slug}`} target="_blank" className="hover:underline" title={post.title}>
                        {post.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate" title={post.slug}>{post.slug}</TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(post.createdAt)}</TableCell>
                    <TableCell>{formatDate(post.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild className="mr-2">
                        <Link href={`/admin/blog/${post.id}/edit`}>
                          <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setPostToDelete(post)}>
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        {postToDelete && postToDelete.id === post.id && (
                           <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the blog post
                                titled &quot;{postToDelete.title}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeletePost} disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Post
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        )}
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
