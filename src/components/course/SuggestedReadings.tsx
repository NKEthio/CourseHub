
"use client";

import * as React from "react";
import { suggestReadings, type SuggestReadingsOutput } from "@/ai/flows/suggest-readings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SuggestedReadingsProps {
  courseTitle: string;
  lessonTitle: string;
  lessonContent: string;
}

export default function SuggestedReadings({
  courseTitle,
  lessonTitle,
  lessonContent,
}: SuggestedReadingsProps) {
  const [readings, setReadings] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await suggestReadings({
        courseTitle,
        lessonTitle,
        lessonContent,
      });
      setReadings(result.suggestedReadings);
      toast({
        title: "Readings Suggested",
        description: "AI has found some relevant resources for you.",
      });
    } catch (error) {
      console.error("Failed to suggest readings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch suggested readings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-8 border-dashed bg-muted/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Suggested Readings</CardTitle>
          </div>
          {readings.length === 0 && !isLoading && (
            <Button size="sm" onClick={handleGenerate} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Suggestions
            </Button>
          )}
        </div>
        <CardDescription>
          Expand your knowledge with these AI-curated external resources.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Finding resources...</span>
          </div>
        ) : readings.length > 0 ? (
          <ul className="grid gap-3">
            {readings.map((reading, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-background border shadow-sm hover:border-primary/50 transition-colors"
              >
                <div className="mt-1 bg-primary/10 p-1.5 rounded text-primary">
                  <ExternalLink className="h-3 w-3" />
                </div>
                <span className="text-sm leading-relaxed">{reading}</span>
              </li>
            ))}
            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="ghost" onClick={handleGenerate} className="text-xs">
                Regenerate suggestions
              </Button>
            </div>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4 italic">
            Click the button above to get personalized reading suggestions for this lesson.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
