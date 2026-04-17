
// src/app/english/snake/page.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, RefreshCw, Target, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const GRID_SIZE = 20;
const CELL_SIZE_PX = 18; 
const INITIAL_SNAKE_SPEED_MS = 250;
const LETTERS_PER_ROUND = 4;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
interface Segment { x: number; y: number; }
interface LetterOnBoard { x: number; y: number; char: string; }

const getRandomPosition = (snake: Segment[] = [], otherLetters: LetterOnBoard[] = []): Segment => {
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (
    snake.some(segment => segment.x === position.x && segment.y === position.y) ||
    otherLetters.some(letter => letter.x === position.x && letter.y === position.y)
  );
  return position;
};

const generateRandomLetters = (count: number): string[] => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letters = new Set<string>();
  while (letters.size < count) {
    letters.add(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }
  return Array.from(letters).sort();
};

export default function AlphabetSnakePage() {
  const [snake, setSnake] = React.useState<Segment[]>([{ x: 10, y: 10 }]);
  const [direction, setDirection] = React.useState<Direction>("RIGHT");
  const [lettersOnBoard, setLettersOnBoard] = React.useState<LetterOnBoard[]>([]);
  const [targetOrder, setTargetOrder] = React.useState<string[]>([]);
  const [currentTargetIndex, setCurrentTargetIndex] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const [gameStarted, setGameStarted] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{type: "success" | "error", message: string} | null>(null);

  const gameLoopRef = React.useRef<NodeJS.Timeout | null>(null);

  const setupNewRound = React.useCallback(() => {
    const newTargetOrder = generateRandomLetters(LETTERS_PER_ROUND);
    setTargetOrder(newTargetOrder);
    setCurrentTargetIndex(0);
    
    const newLetters: LetterOnBoard[] = [];
    const tempSnakeForPlacement = snake.length > 0 ? snake : [{ x: 10, y: 10 }];

    newTargetOrder.forEach(char => {
      const pos = getRandomPosition(tempSnakeForPlacement, newLetters);
      newLetters.push({ ...pos, char });
    });
    setLettersOnBoard(newLetters);
  }, [snake]);


  const resetGame = React.useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection("RIGHT");
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setFeedback(null);
    setupNewRound();
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(moveSnake, INITIAL_SNAKE_SPEED_MS);
  }, [setupNewRound]); 

  const startGame = () => {
    resetGame(); 
  };
  
  const moveSnake = React.useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake(prevSnake => {
      if (prevSnake.length === 0) { 
          setGameOver(true);
          setFeedback({ type: "error", message: "Game Over! Snake disappeared." });
          if (gameLoopRef.current) clearInterval(gameLoopRef.current);
          return [];
      }
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case "UP": head.y -= 1; break;
        case "DOWN": head.y += 1; break;
        case "LEFT": head.x -= 1; break;
        case "RIGHT": head.x += 1; break;
      }

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setFeedback({type: "error", message: "Game Over! Hit the wall."});
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        return prevSnake;
      }

      // Self collision
      for (let i = 1; i < newSnake.length; i++) {
        if (newSnake[i].x === head.x && newSnake[i].y === head.y) {
          setGameOver(true);
          setFeedback({type: "error", message: "Game Over! Hit yourself."});
          if (gameLoopRef.current) clearInterval(gameLoopRef.current);
          return prevSnake;
        }
      }
      
      newSnake.unshift(head); 

      const currentTargetChar = targetOrder[currentTargetIndex];
      let ateLetter = false;
      const letterIndexOnBoard = lettersOnBoard.findIndex(l => l.x === head.x && l.y === head.y);

      if (letterIndexOnBoard !== -1) {
        const eatenLetter = lettersOnBoard[letterIndexOnBoard];
        if (eatenLetter.char === currentTargetChar) {
          ateLetter = true;
          setScore(s => s + 10);
          setFeedback({type: "success", message: `Correct! Ate '${eatenLetter.char}'.`});
          
          const newLettersOnBoard = lettersOnBoard.filter((_, i) => i !== letterIndexOnBoard);
          setLettersOnBoard(newLettersOnBoard);

          if (currentTargetIndex + 1 >= targetOrder.length) { 
            setupNewRound(); 
          } else {
            setCurrentTargetIndex(idx => idx + 1);
          }
        } else { 
          setGameOver(true);
          setFeedback({type: "error", message: `Game Over! Ate '${eatenLetter.char}', expected '${currentTargetChar}'.`});
          if (gameLoopRef.current) clearInterval(gameLoopRef.current);
          return prevSnake; 
        }
      }

      if (!ateLetter) {
        newSnake.pop(); 
      }
      return newSnake;
    });
  }, [direction, gameOver, gameStarted, lettersOnBoard, targetOrder, currentTargetIndex, setupNewRound]);

  const handleDirectionChange = (newDirection: Direction) => {
    if (!gameStarted || gameOver) return;

    if (newDirection === "UP" && direction !== "DOWN") setDirection("UP");
    else if (newDirection === "DOWN" && direction !== "UP") setDirection("DOWN");
    else if (newDirection === "LEFT" && direction !== "RIGHT") setDirection("LEFT");
    else if (newDirection === "RIGHT" && direction !== "LEFT") setDirection("RIGHT");
  };
  
  const handleBoardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gameStarted || gameOver) return;

    const boardRect = event.currentTarget.getBoundingClientRect();
    // Calculate click coordinates relative to the board element
    const clickX = event.clientX - boardRect.left;
    const clickY = event.clientY - boardRect.top;

    const centerX = boardRect.width / 2;
    const centerY = boardRect.height / 2;

    const relativeX = clickX - centerX; // Click X relative to center
    const relativeY = clickY - centerY; // Click Y relative to center

    let newDir: Direction | null = null;

    // Determine primary axis of click relative to center (diamond shape)
    if (Math.abs(relativeX) > Math.abs(relativeY)) { // More horizontal than vertical
      if (relativeX > 0) {
        newDir = "RIGHT";
      } else {
        newDir = "LEFT";
      }
    } else { // More vertical than horizontal, or equally distant
      if (relativeY > 0) {
        newDir = "DOWN";
      } else {
        newDir = "UP";
      }
    }
    
    if (newDir) {
      handleDirectionChange(newDir);
    }
  };


  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": handleDirectionChange("UP"); break;
        case "ArrowDown": handleDirectionChange("DOWN"); break;
        case "ArrowLeft": handleDirectionChange("LEFT"); break;
        case "ArrowRight": handleDirectionChange("RIGHT"); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, gameStarted, gameOver]); 
  
  React.useEffect(() => {
    if (gameStarted && !gameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(moveSnake, INITIAL_SNAKE_SPEED_MS);
    } else if (gameOver || !gameStarted) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, gameStarted, gameOver]);


  const currentTargetLetter = targetOrder[currentTargetIndex];

  return (
    <div className="container mx-auto py-4 px-4 flex flex-col items-center">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Alphabet Snake</CardTitle>
          <CardDescription>Guide the snake to eat letters in alphabetical order. Use arrow keys or click on the board quadrants to move.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-center text-lg gap-2 sm:gap-4">
            <div>Score: <span className="font-bold text-accent">{score}</span></div>
            {gameStarted && !gameOver && currentTargetLetter && (
              <div className="flex items-center">
                Next Letter: <Target className="w-5 h-5 mx-1.5 text-blue-500" /> 
                <span className="font-bold text-2xl text-blue-600">{currentTargetLetter}</span>
              </div>
            )}
          </div>

          {feedback && (
            <Alert variant={feedback.type === "error" ? "destructive" : "default"}
                   className={cn(feedback.type === "success" ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : "")}>
              {feedback.type === "success" ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> : <XCircle className="h-4 w-4"/>}
              <AlertDescription className={cn(feedback.type === "success" ? "text-green-700 dark:text-green-400" : "")}>
                {feedback.message}
              </AlertDescription>
            </Alert>
          )}

          <div 
            className="grid border-2 border-primary bg-muted/30 shadow-inner overflow-hidden mx-auto cursor-pointer"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
              width: `${GRID_SIZE * CELL_SIZE_PX}px`,
              height: `${GRID_SIZE * CELL_SIZE_PX}px`,
              position: 'relative', 
            }}
            onClick={handleBoardClick} // Added click handler here
            role="button" // Added for accessibility
            tabIndex={0} // Added for accessibility
            aria-label="Game board control area"
          >
            {snake.map((segment, index) => (
              <div
                key={index}
                className={cn(
                  "absolute rounded pointer-events-none", // Added pointer-events-none to snake and letters
                  index === 0 ? "bg-primary/90" : "bg-primary/70",
                  index === 0 && "ring-1 ring-primary-foreground/50"
                )}
                style={{
                  left: `${segment.x * CELL_SIZE_PX}px`,
                  top: `${segment.y * CELL_SIZE_PX}px`,
                  width: `${CELL_SIZE_PX}px`,
                  height: `${CELL_SIZE_PX}px`,
                }}
              />
            ))}
            {lettersOnBoard.map((letter, index) => (
              <div
                key={`letter-${index}-${letter.char}`}
                className={cn(
                    "absolute flex items-center justify-center font-bold text-sm rounded pointer-events-none", // Added pointer-events-none
                    letter.char === currentTargetLetter ? "bg-accent text-accent-foreground animate-pulse" : "bg-card text-card-foreground border border-muted-foreground"
                )}
                style={{
                  left: `${letter.x * CELL_SIZE_PX}px`,
                  top: `${letter.y * CELL_SIZE_PX}px`,
                  width: `${CELL_SIZE_PX}px`,
                  height: `${CELL_SIZE_PX}px`,
                }}
              >
                {letter.char}
              </div>
            ))}
          </div>
          
          {/* On-screen arrow buttons REMOVED */}

          {!gameStarted && (
            <Button onClick={startGame} className="w-full sm:w-auto mx-auto mt-4">
              Start Game
            </Button>
          )}
          {gameOver && (
            <Button onClick={resetGame} className="w-full sm:w-auto mx-auto mt-4">
              <RefreshCw className="mr-2 h-4 w-4" /> Restart Game
            </Button>
          )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t">
           <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/english">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to English Games
            </Link>
          </Button>
          {gameStarted && !gameOver && (
             <Button variant="secondary" onClick={() => {
                setGameOver(true);
                setFeedback({type: "error", message: "Game Ended."});
                if (gameLoopRef.current) clearInterval(gameLoopRef.current);
             }} className="w-full sm:w-auto">
                End Game
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
