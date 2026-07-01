
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { suggestReadings } from "@/ai/flows/suggest-readings";
import { Badge } from "@/components/ui/badge";

interface SuggestedReadingsProps {
  lessonTitle: string;
  lessonContent: string;
  courseTitle: string;
}

export default function SuggestedReadings({ lessonTitle, lessonContent, courseTitle }: SuggestedReadingsProps) {
  const [readings, setReadings] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasFetched, setHasFetched] = React.useState(false);

  const handleFetchReadings = async () => {
    setIsLoading(true);
    try {
      const result = await suggestReadings({
        lessonTitle,
        lessonContent,
        courseTitle
      });
      setReadings(result.suggestedReadings);
      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching suggested readings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasFetched && !isLoading) {
    return (
        <Card className="bg-muted/30">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Deepen Your Understanding</p>
                            <p className="text-xs text-muted-foreground">Get AI-curated resources for this lesson.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleFetchReadings}>
                        <Sparkles className="mr-2 h-3 w-3" />
                        Suggest Readings
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Suggested Readings
        </CardTitle>
        <CardDescription>
          AI-powered recommendations to complement your learning.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Curating resources...</span>
          </div>
        ) : readings.length > 0 ? (
          <ul className="space-y-3">
            {readings.map((reading, index) => (
              <li key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors group">
                <div className="mt-1 p-1 bg-muted rounded group-hover:bg-primary/10 transition-colors">
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm leading-relaxed">{reading}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No specific readings found for this topic.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
