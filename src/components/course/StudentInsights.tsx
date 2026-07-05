
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, Target, Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { generateStudentInsights, type StudentInsightsOutput, type StudentInsightsInput } from '@/ai/flows/generate-student-insights';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StudentInsightsProps {
  studentName: string;
  recentActivity: StudentInsightsInput['recentActivity'];
  skills: StudentInsightsInput['skills'];
}

export default function StudentInsights({ studentName, recentActivity, skills }: StudentInsightsProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [insights, setInsights] = React.useState<StudentInsightsOutput | null>(null);

  const handleGenerateInsights = async () => {
    if (recentActivity.length === 0 && skills.length === 0) {
      toast({
        title: "More Data Needed",
        description: "Complete some lessons or projects to get personalized AI insights!",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateStudentInsights({
        studentName,
        recentActivity,
        skills
      });
      setInsights(result);
      toast({
        title: "Insights Generated",
        description: "Your AI Mentor has analyzed your recent progress.",
      });
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was an error generating your AI insights. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            AI Learning Insights
          </CardTitle>
          <CardDescription>
            Personalized mentorship based on your recent activity.
          </CardDescription>
        </div>
        <Button
          onClick={handleGenerateInsights}
          disabled={isGenerating}
          variant={insights ? "outline" : "default"}
          size="sm"
          className={cn(
            !insights && "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none shadow-md"
          )}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : insights ? (
            <RefreshCw className="h-4 w-4 mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? "Analyzing..." : insights ? "Refresh" : "Generate Insights"}
        </Button>
      </CardHeader>

      <CardContent>
        {!insights && !isGenerating ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
            <div className="max-w-sm mx-auto">
              <p className="text-sm text-muted-foreground">
                Get a personalized analysis of your achievements and discover where to focus your energy next.
              </p>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="py-12 space-y-4">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-pulse" />
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="h-24 bg-muted rounded animate-pulse" />
              <div className="h-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : insights ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-lg text-foreground/90 leading-relaxed italic border-l-4 border-primary/30 pl-4 py-1">
                "{insights.summary}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background/50 p-4 rounded-xl border border-border/50 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Trophy className="h-4 w-4" />
                  <span>Key Achievements</span>
                </div>
                <ul className="space-y-2">
                  {insights.achievements.map((achievement, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background/50 p-4 rounded-xl border border-border/50 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                  <Target className="h-4 w-4" />
                  <span>Next Steps</span>
                </div>
                <ul className="space-y-2">
                  {insights.focusAreas.map((area, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 flex items-center gap-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-full">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary/70">Top Tip</p>
                <p className="text-sm font-medium">{insights.topTip}</p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
      {insights && (
        <CardFooter className="pt-0 flex justify-center">
          <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Insights curated by EduVerse AI Mentor
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
