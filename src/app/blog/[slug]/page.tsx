
// src/app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { BlogPost } from '@/types/blog'; // Updated import
import { getBlogPosts, getBlogPostBySlug } from '@/lib/firebase/blog'; // Firebase fetch functions
import BlogLayout from '@/components/blog/BlogLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Badge } from '@/components/ui/badge'; // Badge not used here
import { CalendarDays, UserCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export async function generateStaticParams() {
  const posts = await getBlogPosts(true); // Fetch only published posts for static generation
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post || post.status !== 'published') {
    notFound();
  }

  const formatDate = (timestamp: Timestamp | string) => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };


  return (
    <BlogLayout title={post.title} description={post.excerpt}>
      <article className="prose prose-lg dark:prose-invert mx-auto max-w-4xl bg-card p-6 sm:p-8 rounded-xl shadow-md">
        <header className="mb-8">
          {post.imageUrl && (
            <div className="mb-6 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={post.imageUrl}
                alt={post.title}
                width={800}
                height={450}
                className="w-full h-auto object-cover"
                priority // Prioritize loading the main blog image
                data-ai-hint={post.imageHint || "blog article"}
              />
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary mb-3">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <UserCircle className="mr-1.5 h-4 w-4" />
              <span>{post.author}</span>
            </div>
          </div>
        </header>

        <div dangerouslySetInnerHTML={{ __html: post.content }} />

        <footer className="mt-12 border-t pt-6">
          <div className="flex items-center gap-3">
            <Avatar>
              {/* Placeholder for author avatar, can be linked to user profile photoURL if authorId is used */}
              <AvatarImage src={`https://placehold.co/40x40.png?text=${post.author.charAt(0)}`} alt={post.author} data-ai-hint="author avatar" />
              <AvatarFallback>{post.author.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{post.author}</p>
              <p className="text-xs text-muted-foreground">Author</p>
            </div>
          </div>
        </footer>
      </article>
    </BlogLayout>
  );
}
