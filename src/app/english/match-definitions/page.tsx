
// src/app/english/match-definitions/page.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, RefreshCw, Lightbulb, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface WordDefinitionPair {
  id: string;
  word: string;
  definition: string;
}

const allWordPairs: WordDefinitionPair[] = [
  { id: "wd1", word: "HAPPY", definition: "Feeling or showing pleasure or contentment." },
  { id: "wd2", word: "BRAVE", definition: "Ready to face and endure danger or pain; showing courage." },
  { id: "wd3", word: "EAGER", definition: "Wanting to do or have something very much." },
  { id: "wd4", word: "GENEROUS", definition: "Showing a readiness to give more of something, as money or time, than is strictly necessary or expected." },
  { id: "wd5", word: "LOYAL", definition: "Giving or showing firm and constant support or allegiance to a person or institution." },
  { id: "wd6", word: "CURIOUS", definition: "Eager to know or learn something." },
  { id: "wd7", word: "RELIABLE", definition: "Consistently good in quality or performance; able to be trusted." },
  { id: "wd8", word: "VERSATILE", definition: "Able to adapt or be adapted to many different functions or activities." },
];

const ITEMS_PER_SET = 4; // Number of word-definition pairs per game set

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function MatchDefinitionsPage() {
  const [currentSet, setCurrentSet] = React.useState<WordDefinitionPair[]>([]);
  const [shuffledDefinitions, setShuffledDefinitions] = React.useState<WordDefinitionPair[]>([]);
  
  const [selectedWord, setSelectedWord] = React.useState<WordDefinitionPair | null>(null);
  const [selectedDefinition, setSelectedDefinition] = React.useState<WordDefinitionPair | null>(null);
  
  const [matchedPairs, setMatchedPairs] = React.useState<string[]>([]); // Store IDs of matched words
  const [attempts, setAttempts] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [feedback, setFeedback] = React.useState<{type: "success" | "error" | "info", message: string} | null>(null);
  const [gameOver, setGameOver] = React.useState(false);

  const setupNewSet = React.useCallback(() => {
    const shuffledAll = shuffleArray(allWordPairs);
    const newCurrentSet = shuffledAll.slice(0, ITEMS_PER_SET);
    setCurrentSet(newCurrentSet);
    setShuffledDefinitions(shuffleArray(newCurrentSet)); // Shuffle copies for display
    
    setSelectedWord(null);
    setSelectedDefinition(null);
    setMatchedPairs([]);
    setAttempts(0);
    // Score is not reset here, it accumulates or you can decide to reset it.
    // If you want to reset score with each new set: setScore(0);
    setFeedback(null);
    setGameOver(false);
  }, []);

  React.useEffect(() => {
    setupNewSet();
  }, [setupNewSet]);

  const handleWordSelect = (wordPair: WordDefinitionPair) => {
    if (matchedPairs.includes(wordPair.id) || gameOver) return;
    setSelectedWord(wordPair);
    setSelectedDefinition(null); // Clear previous definition selection
    setFeedback(null);
  };

  const handleDefinitionSelect = (defPair: WordDefinitionPair) => {
    if (!selectedWord || matchedPairs.includes(defPair.id) || gameOver) return;
    
    setSelectedDefinition(defPair); // Keep definition selected for visual feedback
    setAttempts(prev => prev + 1);

    if (selectedWord.id === defPair.id) { // Correct match
      setFeedback({type: "success", message: `Correct! "${selectedWord.word}" means "${selectedWord.definition.substring(0,30)}...".`});
      setScore(prev => prev + 1);
      setMatchedPairs(prev => [...prev, selectedWord.id]);
      setSelectedWord(null); // Clear selection after match
      setSelectedDefinition(null);
      if (matchedPairs.length + 1 === ITEMS_PER_SET) {
        setGameOver(true);
        setFeedback({type: "info", message: `All pairs matched! Final score: ${score + 1} out of ${ITEMS_PER_SET}. Play again?`});
      }
    } else { // Incorrect match
      setFeedback({type: "error", message: "Not a match. Try again!"});
      // Optionally clear selectedWord here or after a timeout for another try with the same word
      setSelectedWord(null); // Clear word selection on wrong match
      setSelectedDefinition(null);
    }
  };

  if (currentSet.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
          <RefreshCw className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4">Loading game...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Match Words to Definitions</CardTitle>
          <CardDescription>Click a word, then click its definition. Good luck!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Score: <span className="font-bold text-lg text-accent">{score}</span> | Attempts: {attempts}</p>
            <p className="text-sm text-muted-foreground">Matched: {matchedPairs.length} of {ITEMS_PER_SET}</p>
          </div>

          {feedback && (
            <Alert variant={feedback.type === "error" ? "destructive" : (feedback.type === "success" ? "default" : "default")}
                   className={cn(
                     feedback.type === "success" ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : "",
                     feedback.type === "info" ? "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700" : ""
                   )}>
              {feedback.type === "success" && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
              {feedback.type === "error" && <XCircle className="h-4 w-4" />}
              {feedback.type === "info" && <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              <AlertDescription className={cn(
                feedback.type === "success" ? "text-green-700 dark:text-green-400" : "",
                feedback.type === "info" ? "text-blue-700 dark:text-blue-400" : ""
              )}>
                {feedback.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Words Column */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-center text-muted-foreground">Words</h3>
              {currentSet.map((pair) => (
                <Button
                  key={`word-${pair.id}`}
                  variant={selectedWord?.id === pair.id ? "default" : "outline"}
                  className={cn(
                    "w-full justify-start p-4 h-auto text-left",
                    matchedPairs.includes(pair.id) && "bg-green-200 dark:bg-green-700 hover:bg-green-300 dark:hover:bg-green-600 text-green-800 dark:text-green-100 border-green-400 dark:border-green-500 line-through",
                    selectedWord?.id === pair.id && "ring-2 ring-primary"
                  )}
                  onClick={() => handleWordSelect(pair)}
                  disabled={matchedPairs.includes(pair.id) || gameOver}
                >
                  {pair.word}
                </Button>
              ))}
            </div>

            {/* Definitions Column */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-center text-muted-foreground">Definitions</h3>
              {shuffledDefinitions.map((pair) => (
                <Button
                  key={`def-${pair.id}`}
                  variant={selectedDefinition?.id === pair.id && selectedWord ? "secondary" : "outline"}
                  className={cn(
                    "w-full justify-start p-4 h-auto text-left text-sm leading-snug whitespace-normal", // Added whitespace-normal
                     matchedPairs.includes(pair.id) && "bg-green-200 dark:bg-green-700 hover:bg-green-300 dark:hover:bg-green-600 text-green-800 dark:text-green-100 border-green-400 dark:border-green-500 opacity-50",
                     selectedDefinition?.id === pair.id && selectedWord && "ring-2 ring-accent" // Highlight selected definition
                  )}
                  onClick={() => handleDefinitionSelect(pair)}
                  disabled={matchedPairs.includes(pair.id) || gameOver || !selectedWord}
                >
                  {pair.definition}
                </Button>
              ))}
            </div>
          </div>

          {gameOver && (
            <Alert className="mt-6 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-700 dark:text-blue-300">Game Over!</AlertTitle>
              <AlertDescription className="text-blue-600 dark:text-blue-400">
                You've matched all the pairs for this set. Your final score is {score}. Click "New Set" to play again.
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t">
          <Button variant="ghost" asChild className="w-full sm:w-auto">
            <Link href="/english">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to English Games
            </Link>
          </Button>
          <Button onClick={() => {
            setupNewSet();
            // Reset score for a new game session if desired, or keep cumulative
            // setScore(0); 
          }} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" /> New Set / Reset
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
