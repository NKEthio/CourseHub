
// src/app/courses/page.tsx
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation"; // Import useSearchParams
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import CourseCard, { type CourseCardProps } from "@/components/course/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@/types/course";
import { AlertCircle, SearchX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function Courses() {
  const searchParams = useSearchParams(); // Get search params
  const searchQuery = searchParams.get("q"); // Get the 'q' parameter

  const [allCourses, setAllCourses] = React.useState<CourseCardProps[]>([]);
  const [filteredCourses, setFilteredCourses] = React.useState<CourseCardProps[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const coursesCollectionRef = collection(db, "courses");
        const q = query(coursesCollectionRef, where("status", "==", "published"));
        const querySnapshot = await getDocs(q);

        const fetchedCourses: CourseCardProps[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as Course;
          return {
            id: doc.id,
            title: data.title,
            shortDescription: data.shortDescription,
            teacherName: data.teacherName,
            averageRating: data.averageRating || 0,
            imageUrl: data.imageUrl,
            category: data.category,
            price: data.price,
            level: data.level,
          };
        });
        setAllCourses(fetchedCourses);
      } catch (err) {
        console.error("Error fetching courses: ", err);
        setError("Failed to load courses. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  React.useEffect(() => {
    if (isLoading) return; // Don't filter until courses are loaded

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const results = allCourses.filter(course =>
        course.title.toLowerCase().includes(lowercasedQuery) ||
        course.shortDescription.toLowerCase().includes(lowercasedQuery) ||
        (course.teacherName && course.teacherName.toLowerCase().includes(lowercasedQuery)) ||
        (course.category && course.category.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredCourses(results);
    } else {
      setFilteredCourses(allCourses); // If no search query, show all courses
    }
  }, [searchQuery, allCourses, isLoading]);

  const displayCourses = searchQuery ? filteredCourses : allCourses;

  return (
    <div className="space-y-8 py-8">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
          {searchQuery ? `Search Results for "${searchQuery}"` : "Explore Our Courses"}
        </h1>
        {!searchQuery && (
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Find your next learning adventure from our diverse catalog of courses.
          </p>
        )}
         {searchQuery && !isLoading && (
           <p className="text-md text-muted-foreground">
            Found {displayCourses.length} course{displayCourses.length === 1 ? "" : "s"}.
          </p>
        )}
      </header>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-4 w-1/4 rounded" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-1/3 rounded" />
                <Skeleton className="h-8 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
         <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Courses</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && displayCourses.length === 0 && (
        <div className="text-center py-10">
            <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">
            {searchQuery ? `No courses found matching "${searchQuery}".` : "No courses available at the moment."}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try a different search term or browse all courses." : "Please check back later."}
          </p>
        </div>
      )}

      {!isLoading && !error && displayCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Courses />
    </React.Suspense>
  );
}
