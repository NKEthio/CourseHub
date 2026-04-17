// src/components/home/AIAssistant.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generalQA, type GeneralQAOutput } from '@/ai/flows/general-qa';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AIAssistant() {
  const { toast } = useToast();
  const [question, setQuestion] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) {
      toast({
        variant: 'destructive',
        title: 'Input Required',
        description: 'Please ask a question.',
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setAnswer(null);

    try {
      const result = await generalQA({ query: question });
      setAnswer(result.answer);
    } catch (error) {
      console.error('AI assistant error:', error);
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: 'Could not get an answer at this time. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-border">
      <CardHeader className="text-center">
        <Sparkles className="mx-auto h-10 w-10 text-accent mb-2" />
        <CardTitle className="text-3xl md:text-4xl font-bold text-primary">AI Assistant</CardTitle>
        <CardDescription className="text-lg text-foreground/80 max-w-2xl mx-auto">
          Have a question? Ask our AI anything, from course topics to general knowledge!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
          <Textarea
            placeholder="e.g., 'What is the capital of France?' or 'Explain the difference between HTML and CSS.'"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="text-base"
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Ask Your Question
          </Button>
        </form>

        {hasSearched && (
          <div className="mt-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-center mb-4">
              {isLoading ? 'Thinking...' : 'Here is my answer:'}
            </h3>
            {isLoading && (
              <div className="p-4 space-y-3 animate-pulse">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-5/6 bg-muted rounded"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
              </div>
            )}
            {!isLoading && answer && (
              <Alert className="bg-background/80">
                <BrainCircuit className="h-4 w-4" />
                <AlertTitle>AI Response</AlertTitle>
                <AlertDescription className="prose prose-sm dark:prose-invert max-w-none">
                  {answer}
                </AlertDescription>
              </Alert>
            )}
            {!isLoading && !answer && (
              <p className="text-center text-muted-foreground mt-6">
                I couldn&apos;t generate an answer for that. Please try rephrasing your question.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
