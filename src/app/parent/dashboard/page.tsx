
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  TrendingUp,
  Star,
  AlertTriangle,
  Activity,
  Calendar,
  Loader2,
  Sparkles,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { generateParentReport, type ParentReportOutput } from '@/ai/flows/generate-parent-report';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { onAuthStateChanged, getUserProfile, type UserProfile } from '@/lib/firebase/auth';
import { getLinkedStudents, linkStudentToParent, fetchStudentDataForReport } from '@/lib/firebase/parent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ParentDashboardPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [linkedStudents, setLinkedStudents] = React.useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [report, setReport] = React.useState<ParentReportOutput | null>(null);

  // Link student state
  const [studentEmail, setStudentEmail] = React.useState("");
  const [isLinking, setIsLinking] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser(profile);
          if (profile.childrenIds && profile.childrenIds.length > 0) {
            const students = await getLinkedStudents(profile.childrenIds);
            setLinkedStudents(students);
            if (students.length > 0) {
              setSelectedStudentId(students[0].uid);
            }
          }
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !studentEmail) return;

    setIsLinking(true);
    const result = await linkStudentToParent(currentUser.uid, studentEmail);

    if (result.success) {
      toast({
        title: "Student Linked",
        description: "Successfully linked to your child's account.",
      });
      setStudentEmail("");
      setIsDialogOpen(false);

      // Refresh students
      const updatedProfile = await getUserProfile(currentUser.uid);
      if (updatedProfile?.childrenIds) {
        const students = await getLinkedStudents(updatedProfile.childrenIds);
        setLinkedStudents(students);
        if (!selectedStudentId && students.length > 0) {
          setSelectedStudentId(students[0].uid);
        }
      }
    } else {
      toast({
        variant: "destructive",
        title: "Linking Failed",
        description: result.error || "Could not link student. Please check the email.",
      });
    }
    setIsLinking(false);
  };

  const handleGenerateReport = async () => {
    if (!selectedStudentId) return;

    setIsGenerating(true);
    try {
      const studentData = await fetchStudentDataForReport(selectedStudentId);

      if (!studentData) {
        throw new Error("Failed to fetch student data");
      }

      const result = await generateParentReport(studentData);
      setReport(result);
      toast({
        title: "Report Generated",
        description: `AI has successfully analyzed ${studentData.studentName}'s progress for this week.`,
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

  const selectedStudent = linkedStudents.find(s => s.uid === selectedStudentId);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold">Please log in as a parent</h2>
            <p className="text-muted-foreground max-w-sm mt-2">
                You need to be logged in to access the parent dashboard and monitor your child's progress.
            </p>
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

        <div className="flex items-center gap-3">
          {linkedStudents.length > 0 && (
            <Select value={selectedStudentId || undefined} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Student" />
              </SelectTrigger>
              <SelectContent>
                {linkedStudents.map((student) => (
                  <SelectItem key={student.uid} value={student.uid}>
                    {student.displayName || student.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Link Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Link to Student</DialogTitle>
                <DialogDescription>
                  Enter your child's EduVerse email address to link their account and track their progress.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLinkStudent}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium">Student Email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="child@example.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLinking}>
                    {isLinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Link Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || !selectedStudentId}
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
        </div>
      </header>

      {linkedStudents.length === 0 ? (
        <section>
          <Card className="border-dashed border-2 py-12">
            <CardContent className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">No Students Linked Yet</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Connect your child's account to see their AI-powered weekly reports, skill growth, and activity levels.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Link Your First Student
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : (
        <>
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
                    {report ? `Generated for ${selectedStudent?.displayName} on ${new Date().toLocaleDateString()}` : `Select a student and click "Generate AI Weekly Report"`}
                  </CardDescription>
                </div>
                {report && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Just now
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {report ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Sparkles className="h-12 w-12 text-primary/30 mb-4" />
                    <p className="text-muted-foreground">
                      Click the button above to generate a new AI-powered analysis of {selectedStudent?.displayName || 'your child'}'s progress.
                    </p>
                  </div>
                )}
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
                    Skill Growth
                  </CardTitle>
                  <CardDescription>Overall performance levels for {selectedStudent?.displayName}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {report ? (
                    <div className="space-y-6">
                      {/* We use the report's metrics if available, otherwise would need to fetch skills separately */}
                      {/* For now, showing dummy based on report existence to encourage generation */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Average Improvement</span>
                          <span className="font-medium text-green-600">+{report.metrics.averageImprovement}%</span>
                        </div>
                        <Progress value={report.metrics.averageImprovement * 5} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Generate a report to see detailed skill-by-skill analysis.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center opacity-50">
                      <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm">Generate report for skill analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Student Profile
                  </CardTitle>
                  <CardDescription>Details about the linked student.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {(selectedStudent?.displayName || selectedStudent?.email || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{selectedStudent?.displayName || "Student"}</h3>
                      <p className="text-sm text-muted-foreground">{selectedStudent?.email}</p>
                      <Badge variant="secondary" className="mt-1">Active Learner</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold border-b pb-1">Quick Links</h4>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" disabled>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> View Completed Courses
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" disabled>
                      <FileText className="mr-2 h-4 w-4" /> View Project Portfolio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
