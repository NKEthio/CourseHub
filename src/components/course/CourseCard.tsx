
import Image from 'next/image';
import Link from 'next/link';
import { Star, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface CourseCardProps {
  id: string;
  title: string;
  shortDescription: string;
  teacherName: string;
  averageRating: number;
  imageUrl: string;
  imageHint?: string; // Added for AI hint
  category?: string;
  price?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  customLink?: string; // New property for custom navigation
}

export default function CourseCard({
  id,
  title,
  shortDescription,
  teacherName,
  averageRating,
  imageUrl,
  imageHint,
  category,
  price,
  level,
  customLink, // Destructure the new prop
}: CourseCardProps) {
  const courseLink = customLink || `/courses/${id}`;

  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1">
      <CardHeader className="p-0 relative">
        <Link href={courseLink} className="block">
          <Image
            src={imageUrl || 'https://placehold.co/400x225.png'} // Fallback to placeholder
            alt={title}
            width={400}
            height={225}
            className="w-full h-48 object-cover"
            data-ai-hint={imageHint || "course thumbnail"} // Use provided hint or default
            priority={id === '1' || id === '2'} // Prioritize first few images on a list
          />
        </Link>
        {category && (
          <Badge variant="secondary" className="absolute top-3 right-3">
            {category}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-1 leading-tight">
          <Link href={courseLink} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm mb-2 h-16 overflow-hidden text-ellipsis">
          {shortDescription}
        </CardDescription>
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <User className="w-3 h-3 mr-1.5" />
          <span>{teacherName}</span>
        </div>
        <div className="flex items-center">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(averageRating) ? 'text-accent fill-accent' : 'text-muted-foreground'
                }`}
              />
            ))}
          <span className="ml-1.5 text-xs text-muted-foreground">({averageRating.toFixed(1)})</span>
        </div>
        {level && <Badge variant="outline" className="mt-2 text-xs">{level}</Badge>}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {price !== undefined && price > 0 && (
          <p className="text-lg font-semibold text-primary">${price.toFixed(2)}</p>
        )}
        {price === 0 && (
           <p className="text-lg font-semibold text-green-600">Free</p>
        )}
        <Button asChild size="sm" variant="default">
          <Link href={courseLink}>View Course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
