
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { evaluateSubmission, type EvaluateSubmissionOutput } from '@/ai/flows/evaluate-submission';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ProjectSubmissionProps {
  projectId: string;
  projectTitle: string;
  projectInstructions: string;
}

export default function ProjectSubmission({ projectId, projectTitle, projectInstructions }: ProjectSubmissionProps) {
  const [content, setContent] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<EvaluateSubmissionOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await evaluateSubmission({
        projectTitle,
        projectInstructions,
        submissionContent: content,
      });
      setFeedback(result);
    } catch (err) {
      console.error("Error submitting project:", err);
      setError("Failed to get AI feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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
