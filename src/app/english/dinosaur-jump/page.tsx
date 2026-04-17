
// src/app/english/dinosaur-jump/page.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, RefreshCw, Rabbit, Target, CheckCircle, XCircle, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const GAME_AREA_HEIGHT_PX = 256; // Corresponds to h-64
const GROUND_Y_PX = 10; // Dinosaur's bottom relative to game area bottom
const JUMP_HEIGHT_PX = 80;
const JUMP_DURATION_MS = 750; // Increased from 500ms
const OBSTACLE_SPEED_PX_PER_FRAME = 3; // Speed at which obstacles move left
const OBSTACLE_SPAWN_INTERVAL_MS = 2000; // How often new obstacles might spawn
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface Obstacle {
  id: string;
  char: string;
  xPosition: number;
}

const getRandomLetter = (exclude: string[] = []): string => {
  let letter;
  do {
    letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  } while (exclude.includes(letter));
  return letter;
};

const getPrecedingLetter = (target: string): string | null => {
    if (target === 'A') return null; // 'A' has no preceding letter in this context
    const targetIndex = ALPHABET.indexOf(target);
    if (targetIndex > 0) {
        return ALPHABET[targetIndex - 1];
    }
    return null;
}

export default function DinosaurJumpPage() {
  const [gameStarted, setGameStarted] = React.useState(false);
  const [gameOver, setGameOver] = React.useState(false);
  const [score, setScore] = React.useState(0);

  const [dinosaurY, setDinosaurY] = React.useState(GROUND_Y_PX); // bottom position
  const [isJumping, setIsJumping] = React.useState(false);
  
  const [obstacles, setObstacles] = React.useState<Obstacle[]>([]);
  const [targetLetter, setTargetLetter] = React.useState('');
  const [precedingLetterToJump, setPrecedingLetterToJump] = React.useState<string | null>(null);

  const [feedback, setFeedback] = React.useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const gameAreaRef = React.useRef<HTMLDivElement>(null);
  const gameLoopRef = React.useRef<number | null>(null);
  const obstacleSpawnTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const DINOSAUR_WIDTH = 40;
  const DINOSAUR_HEIGHT = 40;
  const DINOSAUR_X_POSITION = 50; // Fixed X position for the dinosaur
  const OBSTACLE_WIDTH = 32;
  const OBSTACLE_HEIGHT = 32;

  const setupNewTarget = React.useCallback(() => {
    const newTarget = getRandomLetter(targetLetter ? [targetLetter] : []); // Avoid same target consecutively
    setTargetLetter(newTarget);
    const newPreceding = getPrecedingLetter(newTarget);
    setPrecedingLetterToJump(newPreceding);
    
    setObstacles([]); // Clear existing obstacles
    if (newPreceding && gameAreaRef.current) {
        const initialX = gameAreaRef.current.offsetWidth + Math.random() * 100 + 50; // Spawn further out
         setObstacles([{ id: `obs-${Date.now()}`, char: newPreceding, xPosition: initialX }]);
    }
  }, [targetLetter]); // Removed gameAreaRef.current from deps, it's stable via ref

  const gameLoop = React.useCallback(() => {
    if (!gameStarted || gameOver) return; // Safety check, though useEffect should manage this

    setObstacles(prevObstacles => 
      prevObstacles.map(obs => ({
        ...obs,
        xPosition: obs.xPosition - OBSTACLE_SPEED_PX_PER_FRAME
      })).filter(obs => obs.xPosition > -OBSTACLE_WIDTH) 
    );

    let currentGameOver = false; // Local flag to prevent multiple gameOver triggers in one frame

    obstacles.forEach(obstacle => {
      if (currentGameOver) return;

      const dinosaurActualY = GROUND_Y_PX + (isJumping ? JUMP_HEIGHT_PX : 0);
      
      if (
        DINOSAUR_X_POSITION < obstacle.xPosition + OBSTACLE_WIDTH &&
        DINOSAUR_X_POSITION + DINOSAUR_WIDTH > obstacle.xPosition &&
        dinosaurActualY < GROUND_Y_PX + OBSTACLE_HEIGHT &&
        dinosaurActualY + DINOSAUR_HEIGHT > GROUND_Y_PX
      ) {
        const dinosaurBottom = dinosaurActualY;
        const obstacleTop = GROUND_Y_PX + OBSTACLE_HEIGHT;

        if (isJumping && dinosaurBottom >= obstacleTop - 5) { 
            if (obstacle.char === precedingLetterToJump) {
                setScore(s => s + 10);
                setFeedback({ type: "success", message: `Nice! Jumped over ${obstacle.char}.` });
                setObstacles(prev => prev.filter(o => o.id !== obstacle.id));
                setupNewTarget();
            } else {
                setFeedback({ type: "error", message: `Game Over! Jumped over ${obstacle.char}, but ${precedingLetterToJump || 'the target'} was needed.` });
                setGameOver(true);
                currentGameOver = true;
            }
        } else if (!isJumping) { 
            setFeedback({ type: "error", message: `Game Over! Collided with ${obstacle.char}.` });
            setGameOver(true);
            currentGameOver = true;
        }
      } else if (obstacle.char === precedingLetterToJump && obstacle.xPosition < DINOSAUR_X_POSITION - OBSTACLE_WIDTH && !isJumping) {
        setFeedback({ type: "error", message: `Game Over! Missed the jump for ${precedingLetterToJump}.` });
        setGameOver(true);
        currentGameOver = true;
      }
    });

    if (!currentGameOver && gameStarted && !gameOver) { // Check state vars too for recursive call
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameStarted, gameOver, obstacles, isJumping, precedingLetterToJump, setupNewTarget]);


  const resetGame = React.useCallback(() => {
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (obstacleSpawnTimerRef.current) clearInterval(obstacleSpawnTimerRef.current);
    gameLoopRef.current = null;
    obstacleSpawnTimerRef.current = null;
    
    setScore(0);
    setDinosaurY(GROUND_Y_PX);
    setIsJumping(false);
    setFeedback(null);
    setupNewTarget(); // Sets initial obstacles
    
    setGameOver(false);
    setGameStarted(true); // This will trigger the useEffect to start the loops
  }, [setupNewTarget]);

  React.useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);

      if (obstacleSpawnTimerRef.current) clearInterval(obstacleSpawnTimerRef.current); // Clear previous before setting new
      obstacleSpawnTimerRef.current = setInterval(() => {
        if (gameAreaRef.current && !gameOver && gameStarted) { // Check component's gameOver and gameStarted state
          setObstacles(prev => {
            if (!gameAreaRef.current) return prev; // Guard for gameAreaRef
            const lettersOnScreen = prev.map(o => o.char);
            // Use current state values for targetLetter and precedingLetterToJump directly from React state
            let randomChar = getRandomLetter([targetLetter, precedingLetterToJump || '', ...lettersOnScreen]);
            if (prev.length < 3 && randomChar) { 
               return [...prev, { id: `obs-${Date.now()}`, char: randomChar, xPosition: gameAreaRef.current.offsetWidth + 50 }];
            }
            return prev;
          });
        }
      }, OBSTACLE_SPAWN_INTERVAL_MS + Math.random() * 500); // Slightly reduced randomness for consistency

    } else {
      // Game is not started or is over, clear animation frame and interval
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      if (obstacleSpawnTimerRef.current) {
        clearInterval(obstacleSpawnTimerRef.current);
        obstacleSpawnTimerRef.current = null;
      }
    }

    return () => { // Cleanup function for the useEffect
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (obstacleSpawnTimerRef.current) clearInterval(obstacleSpawnTimerRef.current);
      gameLoopRef.current = null;
      obstacleSpawnTimerRef.current = null;
    };
  }, [gameStarted, gameOver, gameLoop, targetLetter, precedingLetterToJump]); // Add targetLetter and precedingLetterToJump as deps for interval


  const handleJump = React.useCallback(() => {
    if (!isJumping && gameStarted && !gameOver) {
      setIsJumping(true);
      setTimeout(() => {
        setIsJumping(false);
      }, JUMP_DURATION_MS);
    }
  }, [isJumping, gameStarted, gameOver]);

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault(); 
        if (!gameStarted && !gameOver) {
            resetGame();
        } else if (gameStarted && !gameOver) {
            handleJump();
        } else if (gameOver) {
            resetGame();
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleJump, gameStarted, gameOver, resetGame]);
  
  React.useEffect(() => { // Ensure timers are cleared on unmount, though useEffect above should cover it.
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (obstacleSpawnTimerRef.current) clearInterval(obstacleSpawnTimerRef.current);
    };
  }, []);


  return (
    <div className="container mx-auto py-4 px-4 flex flex-col items-center">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Dinosaur Jumping Game</CardTitle>
          <CardDescription className="text-muted-foreground">
            Jump over the correct preceding letter to score points!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center text-lg">
            <div>Score: <span className="font-bold text-accent">{score}</span></div>
          </div>

          {feedback && (
            <Alert variant={feedback.type === "error" ? "destructive" : feedback.type === "success" ? "default" : "default"}
                   className={cn(feedback.type === "success" ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : "", feedback.type === "info" ? "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700" : "")}>
              {feedback.type === "success" && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
              {feedback.type === "error" && <XCircle className="h-4 w-4" />}
              {feedback.type === "info" && <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              <AlertDescription className={cn(feedback.type === "success" ? "text-green-700 dark:text-green-400" : "", feedback.type === "info" ? "text-blue-700 dark:text-blue-400" : "")}>
                {feedback.message}
              </AlertDescription>
            </Alert>
          )}
          {gameStarted && !gameOver && targetLetter && precedingLetterToJump && (
            <CardDescription className="text-center mb-2">
                Target: <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{targetLetter}</span> |
                Jump for: <span className="text-xl font-bold text-green-600 dark:text-green-400">{precedingLetterToJump}</span>
                <br />
                Press Spacebar or Click/Tap to Jump when <strong className="text-green-600 dark:text-green-400">{precedingLetterToJump}</strong> approaches.
            </CardDescription>
          )}
           {gameStarted && !gameOver && targetLetter && !precedingLetterToJump && (
            <CardDescription className="text-center mb-2">
                Target: <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{targetLetter}</span>
                <br />
                No preceding letter to jump for target <strong className="text-blue-600 dark:text-blue-400">{targetLetter}</strong>. Prepare for the next one!
            </CardDescription>
          )}


          {/* Game Area */}
          <div
            ref={gameAreaRef}
            className="w-full h-64 bg-muted/30 border-2 border-primary rounded-lg relative overflow-hidden cursor-pointer shadow-inner"
            onClick={() => {
                 if (!gameStarted && !gameOver) {
                    resetGame();
                } else if (gameStarted && !gameOver) {
                    handleJump();
                } else if (gameOver) {
                    resetGame();
                }
            }}
            tabIndex={0}
            role="button"
            aria-label="Game area, click or press Spacebar to jump or start/restart game"
          >
            {/* Ground Line */}
            <div className="absolute bottom-10 left-0 w-full h-1 bg-foreground/30"></div>

            {/* Dinosaur */}
            <div
              className="absolute w-10 h-10 bg-accent rounded-sm transition-transform duration-100 ease-linear" // Removed transform style, handled by isJumping
              style={{
                left: `${DINOSAUR_X_POSITION}px`,
                bottom: `${dinosaurY}px`,
                transform: `translateY(-${isJumping ? JUMP_HEIGHT_PX : 0}px)`, // Apply jump transform here
              }}
              data-ai-hint="dinosaur character"
            ></div>
            {/* Obstacles */}
            {obstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                className="absolute bottom-10 w-8 h-8 bg-destructive text-destructive-foreground flex items-center justify-center rounded-sm font-bold"
                style={{ left: `${obstacle.xPosition}px` }}
              >
                {obstacle.char}
              </div>
            ))}

            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 rounded-md">
                <h2 className="text-4xl font-extrabold text-white mb-3">GAME OVER</h2>
                <p className="text-lg text-gray-200">Press Space or Click to Restart</p>
              </div>
            )}
          </div>

          {!gameStarted && !gameOver && (
            <Button onClick={resetGame} className="w-full sm:w-auto mx-auto mt-3">
              Start Game
            </Button>
          )}
          {gameOver && (
            <Button onClick={resetGame} className="w-full sm:w-auto mx-auto mt-3">
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
        </CardFooter>
      </Card>
    </div>
  );
}
