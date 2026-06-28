
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, Star, AlertTriangle, Activity, Calendar, Loader2, Sparkles } from 'lucide-react';
import { generateParentReport, type ParentReportOutput } from '@/ai/flows/generate-parent-report';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ParentDashboardPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [report, setReport] = React.useState<ParentReportOutput | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // In a real app, we would fetch the child's actual progress data here
      // For the demo, we'll use realistic mock data to pass to the Genkit flow
      const mockInput = {
        studentName: "Alex",
        recentActivity: [
          { type: 'lesson' as const, title: 'Functions in Python', status: 'completed' },
          { type: 'project' as const, title: 'Weather App', status: 'submitted', feedback: 'Great use of API, but try to handle errors better.' },
          { type: 'lesson' as const, title: 'Data Types', status: 'completed' },
        ],
        skills: [
          { name: 'Python Programming', currentLevel: 75, improvement: 15 },
          { name: 'Problem Solving', currentLevel: 62, improvement: 8 },
          { name: 'AI Literacy', currentLevel: 45, improvement: 22 },
        ]
      };

      const result = await generateParentReport(mockInput);
      setReport(result);
      toast({
        title: "Report Generated",
        description: "AI has successfully analyzed your child's progress for this week.",
      });
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was an error generating the AI report. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Parent Dashboard</h1>
          <p className="text-muted-foreground">Monitor your child's learning journey and progress on EduVerse.</p>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Progress...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Weekly Report
            </>
          )}
        </Button>
      </header>

      {/* Weekly Report Summary */}
      <section>
        <Card className="shadow-lg border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {report ? "New AI Weekly Report" : "Latest Weekly Report"}
              </CardTitle>
              <CardDescription>
                {report ? `Generated on ${new Date().toLocaleDateString()}` : "Week of Oct 20 - Oct 26, 2024"}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {report ? "Just now" : "Generated 2 days ago"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground/80 leading-relaxed italic">
                {report ? report.summary : `Your child has shown consistent effort this week, particularly in the "Introduction to Python" course. They completed 3 mini-tasks and submitted 1 project with an improvement in code clarity compared to last week.`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold">Strengths</span>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {(report?.strengths || ['Logical problem solving', 'Consistent daily activity']).map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-semibold">Areas to Improve</span>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {(report?.areasToImprove || ['Documentation clarity', 'Handling edge cases']).map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold">Activity Level</span>
                </div>
                <Badge className={cn(
                  "border-none",
                  (report?.activityLevel || 'high') === 'high' ? "bg-green-100 text-green-700" :
                  (report?.activityLevel === 'medium' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700")
                )}>
                  {(report?.activityLevel || 'High').toUpperCase()}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {report ? `${report.metrics.lessonsCompleted} lessons, ${report.metrics.projectsSubmitted} projects` : "Active 5/7 days"}
                </p>
              </div>
            </div>
          </CardContent>
          {report && (
             <CardFooter className="bg-muted/30 py-3 flex justify-end">
                <p className="text-[10px] text-muted-foreground italic">Generated by EduVerse AI Progress Analyzer</p>
             </CardFooter>
          )}
        </Card>
      </section>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Skill Improvement
              </CardTitle>
              <CardDescription>Growth across different tech domains on EduVerse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Coding Fundamentals</span>
                  <span className="font-medium">+{report?.metrics.averageImprovement || 15}%</span>
                </div>
                <Progress value={report ? report.metrics.averageImprovement * 5 : 75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Problem Solving</span>
                  <span className="font-medium">+8%</span>
                </div>
                <Progress value={62} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>AI Tools Usage</span>
                  <span className="font-medium">+22%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Previous Reports
              </CardTitle>
              <CardDescription>Access historical performance data.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  'Week of Oct 13 - Oct 19',
                  'Week of Oct 06 - Oct 12',
                  'Week of Sep 29 - Oct 05'
                ].map((date, i) => (
                  <li key={i} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors cursor-pointer">
                    <span className="text-sm">{date}</span>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
