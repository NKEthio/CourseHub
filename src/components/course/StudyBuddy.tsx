
"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Sparkles, Loader2, User, Bot } from "lucide-react";
import { lessonTutor } from "@/ai/flows/lesson-tutor";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StudyBuddyProps {
  lessonTitle: string;
  lessonContent: string;
}

export default function StudyBuddy({ lessonTitle, lessonContent }: StudyBuddyProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await lessonTutor({
        lessonTitle,
        lessonContent,
        query: userMessage,
        history: messages
      });

      setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (error) {
      console.error("Study Buddy error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform bg-gradient-to-br from-purple-600 to-blue-600 border-none"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 h-full">
        <SheetHeader className="p-6 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>AI Study Buddy</SheetTitle>
              <SheetDescription>
                Ask me anything about "{lessonTitle}"
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Hello! I'm your EduVerse Study Buddy.</p>
                <p className="text-xs text-muted-foreground">
                  I can help you understand the concepts in this lesson. What would you like to know?
                </p>
              </div>
            )}
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3 text-sm",
                  message.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "p-3 rounded-lg max-w-[80%]",
                  message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-6 border-t mt-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Powered by Genkit & EduVerse AI
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
