
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge'; // Badge not used here, can be re-added if category/tags are implemented for blog
import { CalendarDays, UserCircle, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/types/blog'; // Updated import
import { Timestamp } from 'firebase/firestore';

interface BlogPostCardProps {
  post: BlogPost;
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const { id, slug, title, excerpt, createdAt, author, imageUrl, imageHint, status } = post;

  const formatDate = (timestamp: Timestamp | string) => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1">
      <CardHeader className="p-0 relative">
        <Link href={`/blog/${slug}`} className="block">
          <Image
            src={imageUrl || 'https://placehold.co/400x225.png'}
            alt={title}
            width={400}
            height={225}
            className="w-full h-48 object-cover"
            data-ai-hint={imageHint || 'blog abstract'}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl mb-2 leading-tight">
          <Link href={`/blog/${slug}`} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </CardTitle>
        <div className="flex items-center text-xs text-muted-foreground mb-2 space-x-3">
          <div className="flex items-center">
            <CalendarDays className="w-3.5 h-3.5 mr-1" />
            <span>{formatDate(createdAt)}</span>
          </div>
          <div className="flex items-center">
            <UserCircle className="w-3.5 h-3.5 mr-1" />
            <span>{author}</span>
          </div>
        </div>
        <CardDescription className="text-sm mb-3 h-20 overflow-hidden text-ellipsis">
          {excerpt}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/blog/${slug}`}>
            Read More <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
