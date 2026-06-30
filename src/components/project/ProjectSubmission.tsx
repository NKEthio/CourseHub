
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { evaluateSubmission, type EvaluateSubmissionOutput } from '@/ai/flows/evaluate-submission';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { auth, db } from '@/lib/firebase/firebase';
import { doc, setDoc, collection, serverTimestamp, arrayUnion, query, where, orderBy, getDocs, updateDoc, increment } from 'firebase/firestore';
import type { Submission, Feedback } from '@/types/submission';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from 'date-fns';

interface ProjectSubmissionProps {
  projectId: string;
  courseId: string;
  projectTitle: string;
  projectInstructions: string;
}

export default function ProjectSubmission({ projectId, courseId, projectTitle, projectInstructions }: ProjectSubmissionProps) {
  const [content, setContent] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<EvaluateSubmissionOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);

  React.useEffect(() => {
    const fetchHistory = async () => {
      const user = auth?.currentUser;
      if (user && db) {
        try {
          const q = query(
            collection(db, "submissions"),
            where("studentId", "==", user.uid),
            where("projectId", "==", projectId),
            orderBy("createdAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
          setSubmissions(history);
          if (history.length > 0) {
            // Set the most recent AI feedback as initial feedback if it exists
            const lastSubmission = history[0];
            const lastAiFeedback = lastSubmission.feedback?.find(f => f.reviewerId === 'ai');
            if (lastAiFeedback) {
              setFeedback({
                correctness: lastAiFeedback.correctness,
                clarity: lastAiFeedback.clarity,
                feedback: lastAiFeedback.content,
                suggestions: lastAiFeedback.suggestions,
              });
            }
          }
        } catch (err) {
          console.error("Error fetching submission history:", err);
        } finally {
          setIsLoadingHistory(false);
        }
      } else {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [projectId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const previousFeedback = submissions.length > 0
        ? submissions[0].feedback?.find(f => f.reviewerId === 'ai')?.content
        : undefined;

      const result = await evaluateSubmission({
        projectTitle,
        projectInstructions,
        submissionContent: content,
        previousFeedback,
      });
      setFeedback(result);

      // Save to Firestore if user is logged in
      const user = auth?.currentUser;
      if (user && db) {
        const submissionRef = doc(collection(db, "submissions"));
        const submissionId = submissionRef.id;

        const feedbackData: Feedback = {
          submissionId,
          reviewerId: 'ai',
          reviewerName: 'AI Evaluator',
          content: result.feedback,
          correctness: result.correctness,
          clarity: result.clarity,
          suggestions: result.suggestions,
          createdAt: new Date().toISOString(),
        };

        const nextVersion = (submissions[0]?.version || 0) + 1;

        const submissionData: Submission = {
          id: submissionId,
          projectId,
          courseId,
          studentId: user.uid,
          content: content,
          version: nextVersion,
          status: result.correctness >= 70 ? 'approved' : 'needs-revision',
          feedback: [feedbackData],
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        };

        await setDoc(submissionRef, submissionData);
        setSubmissions([submissionData, ...submissions]);

        // Update progress
        const progressRef = doc(db, "users", user.uid, "progress", courseId);

        const baseUpdateData: any = {
          lastActivityAt: serverTimestamp(),
        };

        if (result.correctness >= 70) {
          baseUpdateData.completedProjects = arrayUnion(projectId);
        }

        try {
          const updateObj = { ...baseUpdateData };
          if (nextVersion > 1) {
            updateObj[`revisionsCount.${projectId}`] = increment(1);
          }
          await updateDoc(progressRef, updateObj);
        } catch (err) {
          // If updateDoc fails (e.g. document doesn't exist yet), use setDoc with merge
          await setDoc(progressRef, {
            ...baseUpdateData,
            revisionsCount: nextVersion > 1 ? { [projectId]: nextVersion - 1 } : {}
          }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Error submitting project:", err);
      setError("Failed to get AI feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-1/3 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="h-24"></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {submissions.length > 0 && (
        <Card className="shadow-sm border-muted">
          <CardHeader className="py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Submission History
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            <Accordion type="single" collapsible className="w-full">
              {submissions.map((sub, idx) => (
                <AccordionItem key={sub.id || idx} value={sub.id || `v${sub.version}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <Badge variant={sub.status === 'approved' ? 'default' : 'secondary'}>
                        Version {sub.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {sub.createdAt ? format(new Date(typeof sub.createdAt === 'object' && 'seconds' in sub.createdAt ? sub.createdAt.seconds * 1000 : sub.createdAt as string), 'PPp') : 'Just now'}
                      </span>
                      {sub.status === 'approved' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="bg-muted/50 p-3 rounded text-sm font-mono whitespace-pre-wrap border">
                      {sub.content}
                    </div>
                    {sub.feedback && sub.feedback.map((f, fIdx) => (
                      <div key={fIdx} className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm">{f.reviewerName}</span>
                          <div className="flex gap-4 text-xs font-medium">
                            <span>Correctness: {f.correctness}%</span>
                            <span>Clarity: {f.clarity}%</span>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80">{f.content}</p>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Submit Your Work</CardTitle>
          <CardDescription>Enter your project solution below to receive instant AI feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your code or text here..."
            className="min-h-[200px] font-mono"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setContent('')} disabled={isSubmitting}>
            Clear
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit for Feedback
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {feedback && (
        <Card className="shadow-xl border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                AI Feedback Received
              </CardTitle>
              <Badge variant="outline" className="bg-background">AI Evaluator</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Correctness</span>
                  <span className="text-muted-foreground">{feedback.correctness}%</span>
                </div>
                <Progress value={feedback.correctness} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Clarity</span>
                  <span className="text-muted-foreground">{feedback.clarity}%</span>
                </div>
                <Progress value={feedback.clarity} className="h-2" />
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h4 className="text-base font-semibold">Evaluation</h4>
              <p className="text-foreground/80 leading-relaxed">{feedback.feedback}</p>
            </div>

            {feedback.suggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-base font-semibold">Suggestions for Improvement</h4>
                <ul className="grid gap-2">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-foreground/80 bg-background/50 p-2 rounded border border-border">
                      <Badge variant="secondary" className="mt-0.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] shrink-0">
                        {index + 1}
                      </Badge>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
