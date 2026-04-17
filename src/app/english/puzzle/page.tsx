
// src/app/english/puzzle/page.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const wordsList = [
  { word: "APPLE", hint: "A common fruit, often red or green." },
  { word: "BANANA", hint: "A long, curved yellow fruit." },
  { word: "ORANGE", hint: "A citrus fruit and a color." },
  { word: "GRAPE", hint: "A small, round fruit that grows in bunches." },
  { word: "MANGO", hint: "A sweet tropical fruit with a large seed." },
  { word: "TABLE", hint: "A piece of furniture with a flat top." },
  { word: "CHAIR", hint: "Something you sit on." },
  { word: "HOUSE", hint: "A building where people live." },
  { word: "MOUSE", hint: "A small rodent, or a computer device." },
  { word: "WATER", hint: "A clear liquid essential for life." },
];

const scrambleWord = (word: string): string => {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Ensure the scrambled word is not the same as the original
  if (arr.join("") === word && word.length > 1) {
    return scrambleWord(word); // Recurse if it's the same
  }
  return arr.join("");
};

export default function EnglishPuzzlePage() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [currentWord, setCurrentWord] = React.useState(wordsList[0].word);
  const [currentHint, setCurrentHint] = React.useState(wordsList[0].hint);
  const [scrambledWord, setScrambledWord] = React.useState("");
  const [userInput, setUserInput] = React.useState("");
  const [message, setMessage] = React.useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [score, setScore] = React.useState(0);
  const [attempts, setAttempts] = React.useState(0);
  const [showHint, setShowHint] = React.useState(false);

  React.useEffect(() => {
    setScrambledWord(scrambleWord(currentWord));
    setUserInput("");
    setMessage(null);
    setShowHint(false);
    setAttempts(0);
  }, [currentWord]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value.toUpperCase());
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userInput.trim()) {
        setMessage({ type: "info", text: "Please enter your answer." });
        return;
    }
    
    setAttempts(prev => prev + 1);

    if (userInput === currentWord) {
      setMessage({ type: "success", text: "Correct! Well done!" });
      setScore((prevScore) => prevScore + (3 - attempts > 0 ? 3 - attempts : 1)); // Max 3 points, min 1
      // Automatically move to next word after a short delay
      setTimeout(handleNextWord, 1500);
    } else {
      setMessage({ type: "error", text: "Incorrect. Try again!" });
    }
  };

  const handleNextWord = () => {
    const nextIndex = (currentIndex + 1) % wordsList.length;
    setCurrentIndex(nextIndex);
    setCurrentWord(wordsList[nextIndex].word);
    setCurrentHint(wordsList[nextIndex].hint);
  };

  const handleSkipWord = () => {
    setMessage({ type: "info", text: `The word was: ${currentWord}`});
    setScore(prevScore => prevScore > 0 ? prevScore -1 : 0); // Penalize for skipping
     setTimeout(handleNextWord, 1500);
  }

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">English Word Scramble</CardTitle>
          <CardDescription>Unscramble the letters to form a meaningful English word.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Your Score: <span className="font-bold text-lg text-accent">{score}</span></p>
          </div>
          
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-4xl font-bold tracking-widest text-foreground select-none">
              {scrambledWord}
            </p>
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : (message.type === "success" ? "default" : "default")} 
                   className={message.type === "success" ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}>
              {message.type === "success" && <CheckCircle className="h-4 w-4" />}
              {message.type === "error" && <XCircle className="h-4 w-4" />}
              {message.type === "info" && <Lightbulb className="h-4 w-4" />}
              <AlertDescription className={message.type === "success" ? "text-green-700 dark:text-green-400" : ""}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="answer" className="sr-only">Your Answer</Label>
              <Input
                id="answer"
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Type your answer here"
                className="text-center text-lg py-6"
                aria-label="Your unscrambled word"
                disabled={message?.type === 'success'}
              />
            </div>
            <Button type="submit" className="w-full" disabled={message?.type === 'success'}>
              Check Answer
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowHint(prev => !prev)} size="sm" className="w-full sm:w-auto">
            <Lightbulb className="mr-2 h-4 w-4" /> {showHint ? "Hide" : "Show"} Hint
          </Button>
          <Button variant="secondary" onClick={handleSkipWord} size="sm" className="w-full sm:w-auto" disabled={message?.type === 'success'}>
            <RefreshCw className="mr-2 h-4 w-4" /> Skip Word
          </Button>
        </CardFooter>
      </Card>

      {showHint && (
          <Alert className="w-full max-w-md mt-4 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-700 dark:text-blue-300">Hint</AlertTitle>
            <AlertDescription className="text-blue-600 dark:text-blue-400">
              {currentHint}
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
