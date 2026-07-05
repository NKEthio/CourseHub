
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, TrendingUp, Star, AlertTriangle, Activity, Calendar, Loader2, Sparkles, UserPlus, Baby } from 'lucide-react';
import { generateParentReport, type ParentReportOutput } from '@/ai/flows/generate-parent-report';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { onAuthStateChanged, getUserProfile, type UserProfile } from '@/lib/firebase/auth';
import { linkStudentToParent, getStudentActivityData } from '@/lib/firebase/parent';

export default function ParentDashboardPage() {
  const { toast } = useToast();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [report, setReport] = React.useState<ParentReportOutput | null>(null);

  const [studentEmail, setStudentEmail] = React.useState('');
  const [isLinking, setIsLinking] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLinking(true);
    try {
      const result = await linkStudentToParent(user.uid, studentEmail);
      if (result.success) {
        toast({
          title: "Student Linked",
          description: `Successfully linked to ${studentEmail}.`,
        });
        // Refresh profile to get updated childrenIds
        const profile = await getUserProfile(user.uid);
        setUser(profile);
        setStudentEmail('');
      } else {
        toast({
          variant: "destructive",
          title: "Linking Failed",
          description: result.error,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!user || !user.childrenIds || user.childrenIds.length === 0) {
      toast({
        variant: "destructive",
        title: "No Linked Student",
        description: "Please link a student to your account first.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // For simplicity, we'll generate a report for the first linked child
      const studentData = await getStudentActivityData(user.childrenIds[0]);
      const result = await generateParentReport(studentData);
      setReport(result);
      toast({
        title: "Report Generated",
        description: `AI has analyzed ${studentData.studentName}'s progress.`,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'parent') {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">Please log in as a parent to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Parent Dashboard</h1>
          <p className="text-muted-foreground">Monitor your child's learning journey and progress on EduVerse.</p>
        </div>
        <div className="flex gap-2">
           <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || !user.childrenIds?.length}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Weekly Report
              </>
            )}
          </Button>
        </div>
      </header>

      {!user.childrenIds?.length && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-primary" />
              Get Started
            </CardTitle>
            <CardDescription>Link your child's student account to start receiving weekly AI progress reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLinkStudent} className="flex gap-4 max-w-md">
              <Input
                placeholder="Child's school email..."
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={isLinking}>
                {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Link Student
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Weekly Report Summary */}
      {report && (
        <section>
          <Card className="shadow-lg border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  New AI Weekly Report
                </CardTitle>
                <CardDescription>
                  Generated on {new Date().toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Just now
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-foreground/80 leading-relaxed italic">
                  {report.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-semibold">Strengths</span>
                  </div>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {report.strengths.map((s, i) => (
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
                    {report.areasToImprove.map((s, i) => (
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
                    report.activityLevel === 'high' ? "bg-green-100 text-green-700" :
                    (report.activityLevel === 'medium' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700")
                  )}>
                    {report.activityLevel.toUpperCase()}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {report.metrics.lessonsCompleted} lessons, {report.metrics.projectsSubmitted} projects
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 py-3 flex justify-end">
                <p className="text-[10px] text-muted-foreground italic">Generated by EduVerse AI Progress Analyzer</p>
             </CardFooter>
          </Card>
        </section>
      )}

      {/* Placeholder if no report generated yet but student linked */}
      {user.childrenIds && user.childrenIds.length > 0 && !report && (
        <section className="text-center py-12 border-2 border-dashed rounded-lg">
           <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
           <h3 className="text-lg font-medium">No Report Generated Yet</h3>
           <p className="text-muted-foreground mb-6">Click the button above to generate a new AI progress report for your child.</p>

           <div className="mt-8 max-w-md mx-auto p-4 bg-muted/50 rounded-lg text-left">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Baby className="h-4 w-4" /> Linked Students
              </h4>
              <div className="text-xs text-muted-foreground">
                {user.childrenIds.length} student(s) linked to this account.
              </div>
           </div>
        </section>
      )}

      {/* Progress Overview (Static for now, would be better to fetch from Genkit too) */}
      {report && (
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
                    <span>Average Growth</span>
                    <span className="font-medium">+{report.metrics.averageImprovement}%</span>
                  </div>
                  <Progress value={Math.min(100, report.metrics.averageImprovement * 5)} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground italic mt-4">
                  Detailed skill breakdowns are available in the full report above.
                </p>
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
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <p className="text-sm">No historical reports found.</p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
