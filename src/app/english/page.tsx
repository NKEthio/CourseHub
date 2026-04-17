
// src/app/english/page.tsx
"use client";

import * as React from "react";
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, PlayCircle, Puzzle, BookMarked, Worm, Rabbit } from 'lucide-react';
import { cn } from "@/lib/utils";

const playlistItems = [
  { id: 'puzzle', title: 'Word Scramble', description: 'Unscramble the letters to form a word.', icon: Puzzle, component: <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg"><Puzzle className="h-16 w-16 text-muted-foreground"/></div>, href: '/english/puzzle' },
  { id: 'match-definitions', title: 'Match Definitions', description: 'Match words to their correct definitions.', icon: BookMarked, component: <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg"><BookMarked className="h-16 w-16 text-muted-foreground"/></div>, href: '/english/match-definitions' },
  { id: 'snake', title: 'Alphabet Snake', description: 'Guide the snake to eat letters in order.', icon: Worm, component: <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg"><Worm className="h-16 w-16 text-muted-foreground"/></div>, href: '/english/snake' },
  { id: 'dinosaur-jump', title: 'Dinosaur Jump', description: 'Jump over the correct preceding letters.', icon: Rabbit, component: <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg"><Rabbit className="h-16 w-16 text-muted-foreground"/></div>, href: '/english/dinosaur-jump' },
];

function EnglishPlaylist() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentVideoId = searchParams.get('video') || playlistItems[0].id;

  const currentVideoIndex = playlistItems.findIndex(item => item.id === currentVideoId);
  const currentVideo = playlistItems[currentVideoIndex];

  const handleSetVideo = (videoId: string) => {
    router.push(`${pathname}?video=${videoId}`);
  };

  const handleNext = () => {
    const nextIndex = (currentVideoIndex + 1) % playlistItems.length;
    handleSetVideo(playlistItems[nextIndex].id);
  };

  const handlePrev = () => {
    const prevIndex = (currentVideoIndex - 1 + playlistItems.length) % playlistItems.length;
    handleSetVideo(playlistItems[prevIndex].id);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">English for Fun</CardTitle>
          <CardDescription>An interactive series of games and activities to make learning English enjoyable.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content & Video Player */}
            <div className="lg:w-2/3 w-full">
              <div className="aspect-video bg-card border rounded-lg shadow-inner flex items-center justify-center mb-4 p-4 relative">
                {/* Instead of an iframe, we link to the actual game page */}
                 <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-4">{currentVideo.title}</h2>
                    <p className="text-muted-foreground mb-6">{currentVideo.description}</p>
                    <Button asChild size="lg">
                        <Link href={currentVideo.href}>
                            <PlayCircle className="mr-2 h-5 w-5" /> Play Game
                        </Link>
                    </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Button onClick={handlePrev} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Activity {currentVideoIndex + 1} of {playlistItems.length}
                </div>
                <Button onClick={handleNext} variant="outline">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Playlist Sidebar */}
            <div className="lg:w-1/3 w-full">
              <h3 className="text-xl font-semibold mb-4">Course Playlist</h3>
              <ScrollArea className="h-96 w-full rounded-md border">
                <div className="p-4 space-y-3">
                  {playlistItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleSetVideo(item.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        currentVideoId === item.id
                          ? "bg-primary/10 border-primary text-primary-foreground"
                          : "bg-card hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("h-6 w-6 flex-shrink-0", currentVideoId === item.id ? "text-primary" : "text-muted-foreground")} />
                        <div>
                          <h4 className={cn("font-semibold", currentVideoId === item.id ? "text-primary" : "text-foreground")}>
                            {index + 1}. {item.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EnglishPlaylistPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <EnglishPlaylist />
    </React.Suspense>
  );
}
