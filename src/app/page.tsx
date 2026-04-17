
import CourseCard, { type CourseCardProps } from '@/components/course/CourseCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import AIAssistant from '@/components/home/AIAssistant';

// Dummy data for featured courses
const featuredCourses: CourseCardProps[] = [
  {
    id: 'english-for-fun', // Specific ID for this course
    title: 'English for Fun',
    shortDescription: 'Learn English through engaging activities, games, and real-life conversations. Perfect for all ages!',
    teacherName: 'Ms. Lingua Franca',
    averageRating: 4.6,
    imageUrl: 'https://placehold.co/400x225.png',
    imageHint: 'language learning',
    category: 'Languages',
    price: 0, // This course is now free
    customLink: '/english', // Updated custom link to point to the English landing page
  },
  {
    id: 'cs50',
    title: 'CS50: Introduction to Computer Science',
    shortDescription: 'An introduction to the intellectual enterprises of computer science and the art of programming.',
    teacherName: 'David J. Malan',
    averageRating: 5.0,
    imageUrl: 'https://placehold.co/400x225.png',
    imageHint: 'computer science',
    category: 'Development',
    price: 0,
    level: 'Beginner',
  },
  {
    id: 'freecodecamp-js',
    title: 'JavaScript Algorithms and Data Structures',
    shortDescription: 'A comprehensive course covering the fundamentals of JavaScript, algorithms, and data structures.',
    teacherName: 'freeCodeCamp.org',
    averageRating: 4.8,
    imageUrl: 'https://placehold.co/400x225.png',
    imageHint: 'javascript code',
    category: 'Development',
    price: 0,
    level: 'Intermediate',
  },
  {
    id: 'crash-course-ai',
    title: 'Crash Course: Artificial Intelligence',
    shortDescription: 'Explore the fascinating world of AI, from machine learning to neural networks and beyond.',
    teacherName: 'CrashCourse',
    averageRating: 4.7,
    imageUrl: 'https://placehold.co/400x225.png',
    imageHint: 'artificial intelligence',
    category: 'AI',
    price: 0,
    level: 'Beginner',
  },
   {
    id: 'khan-academy-math',
    title: 'Khan Academy: Algebra Basics',
    shortDescription: 'Master the fundamentals of algebra with this in-depth course covering variables, equations, and functions.',
    teacherName: 'Sal Khan',
    averageRating: 4.9,
    imageUrl: 'https://placehold.co/400x225.png',
    imageHint: 'mathematics equations',
    category: 'Math',
    price: 0,
    level: 'Beginner',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16"> {/* Increased spacing between sections */}
      {/* Hero Section */}
      <section className="text-center py-20 md:py-28 bg-card border border-border rounded-xl shadow-xl"> {/* Enhanced hero styling */}
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary mb-6 leading-tight">
            Welcome to CourseHub
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-10 max-w-2xl mx-auto">
            Your journey to knowledge starts here. Explore a vast library of courses taught by industry experts.
          </p>
          <Button asChild size="lg" variant="default" className="text-lg px-8 py-6 shadow-md hover:shadow-lg transition-shadow">
            <Link href="/courses">
              Explore Courses <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section>
        <AIAssistant />
      </section>

      {/* Featured Courses Section */}
      <section>
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-10 text-center">
          Featured Courses
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"> {/* Increased gap */}
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      </section>

      {/* Call to Action for Teachers */}
      <section className="py-16 bg-card border border-border rounded-xl shadow-lg"> {/* Consistent styling with hero */}
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Become an Instructor</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-xl mx-auto">
            Share your knowledge and expertise with thousands of students. Create your course on CourseHub today!
          </p>
          <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 shadow hover:shadow-md transition-shadow">
            <Link href="/teach/apply"> {/* Assuming /teach/apply, adjust if different */}
              Start Teaching <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

       {/* Why Teach Section - Adding Image with data-ai-hint */}
      <section className="grid md:grid-cols-2 gap-8 items-center py-16">
        <div>
          <Image
            src="https://placehold.co/600x400.png"
            alt="Instructor teaching online"
            width={600}
            height={400}
            className="rounded-lg shadow-xl"
            data-ai-hint="teacher online" 
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-primary">Why Teach on CourseHub?</h2>
          <p className="text-lg text-muted-foreground">
            Join a vibrant community, reach a global audience, and make a real impact. We provide the tools and support you need to succeed.
          </p>
          {/* Add more benefit points here if needed */}
        </div>
      </section>
    </div>
  );
}
