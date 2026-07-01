
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Sparkles, Trophy } from "lucide-react";
import { generateQuiz } from "@/ai/flows/generate-quiz";
import type { QuizQuestion } from "@/types/course";
import { cn } from "@/lib/utils";

interface LessonQuizProps {
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
  onComplete: (score: number) => void;
}

export default function LessonQuiz({ lessonId, lessonTitle, lessonContent, onComplete }: LessonQuizProps) {
  const [quiz, setQuiz] = React.useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [quizFinished, setQuizFinished] = React.useState(false);

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    try {
      const result = await generateQuiz({ lessonTitle, lessonContent });
      setQuiz(result.quiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setQuizFinished(true);
      const finalScore = Math.round((score / (quiz?.length || 1)) * 100);
      onComplete(finalScore);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !quiz) return;

    const isCorrect = selectedOption === quiz[currentQuestionIndex].correctOptionIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setIsSubmitted(true);
  };

  if (!quiz) {
    return (
      <Card className="bg-muted/50 border-dashed border-2">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Test Your Knowledge</CardTitle>
          <CardDescription>
            Ready to see how much you've learned? Generate a personalized quiz based on this lesson.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-8">
          <Button onClick={handleGenerateQuiz} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Quiz
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (quizFinished) {
    const finalScore = Math.round((score / quiz.length) * 100);
    return (
      <Card className="text-center py-8">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
          <CardDescription>You've finished the knowledge check for this lesson.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-5xl font-bold text-primary">{finalScore}%</div>
          <p className="text-muted-foreground">
            You got {score} out of {quiz.length} questions correct.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={() => {
            setQuiz(null);
            setCurrentQuestionIndex(0);
            setScore(0);
            setQuizFinished(false);
          }} variant="outline">
            Retake Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = quiz[currentQuestionIndex];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline">Question {currentQuestionIndex + 1} of {quiz.length}</Badge>
          <span className="text-xs text-muted-foreground">Score: {score}</span>
        </div>
        <CardTitle className="text-xl">{currentQuestion.questionText}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedOption?.toString()}
          onValueChange={(v) => setSelectedOption(parseInt(v))}
          disabled={isSubmitted}
          className="space-y-3"
        >
          {currentQuestion.options.map((option, index) => {
            const isCorrect = index === currentQuestion.correctOptionIndex;
            const isSelected = index === selectedOption;

            let itemClassName = "flex items-center space-x-3 space-y-0 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50";

            if (isSubmitted) {
              if (isCorrect) {
                itemClassName = "flex items-center space-x-3 space-y-0 p-4 border rounded-lg bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
              } else if (isSelected) {
                itemClassName = "flex items-center space-x-3 space-y-0 p-4 border rounded-lg bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
              }
            }

            return (
              <div key={index} className={itemClassName} onClick={() => !isSubmitted && setSelectedOption(index)}>
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-normal">
                  {option.text}
                </Label>
                {isSubmitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {isSubmitted && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500" />}
              </div>
            );
          })}
        </RadioGroup>

        {isSubmitted && (
          <Alert variant={selectedOption === currentQuestion.correctOptionIndex ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
                {selectedOption === currentQuestion.correctOptionIndex ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertTitle>
                    {selectedOption === currentQuestion.correctOptionIndex ? "Correct!" : "Incorrect"}
                </AlertTitle>
            </div>
            <AlertDescription>
              {selectedOption === currentQuestion.correctOptionIndex
                ? "Great job! You've grasped this concept."
                : `The correct answer was: ${currentQuestion.options[currentQuestion.correctOptionIndex].text}`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {!isSubmitted ? (
          <Button onClick={handleSubmitAnswer} disabled={selectedOption === null} className="w-full">
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} className="w-full">
            {currentQuestionIndex < quiz.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
