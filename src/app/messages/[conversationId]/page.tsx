
// src/app/messages/[conversationId]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { onAuthStateChanged } from "@/lib/firebase/auth";
import { db, auth } from "@/lib/firebase/firebase";
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { Conversation, Message, ParticipantDetail } from "@/types/messaging";
import { ArrowLeft, Send, User, Loader2, AlertCircle, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const router = useRouter();

  const [currentUser, setCurrentUser] = React.useState<FirebaseAuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  
  const [conversation, setConversation] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // For sending new messages (to be implemented)
  // const [newMessage, setNewMessage] = React.useState("");
  // const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    if (!currentUser || !conversationId) {
      if (!isLoadingAuth) setIsLoadingConversation(false); // If auth check done, and no user/id, stop loading
      return;
    }

    setIsLoadingConversation(true);
    const convRef = doc(db, "conversations", conversationId);
    const unsubscribeConv = onSnapshot(convRef, (docSnap) => {
      if (docSnap.exists()) {
        const convData = { id: docSnap.id, ...docSnap.data() } as Conversation;
        // Verify user is part of this conversation
        if (!convData.participantIds.includes(currentUser.uid)) {
          setError("Access denied. You are not a participant in this conversation.");
          setConversation(null);
        } else {
          setConversation(convData);
          setError(null);
        }
      } else {
        setError("Conversation not found.");
        setConversation(null);
      }
      setIsLoadingConversation(false);
    }, (err) => {
      console.error("Error fetching conversation:", err);
      setError("Failed to load conversation details.");
      setIsLoadingConversation(false);
    });

    return () => unsubscribeConv();
  }, [currentUser, conversationId, isLoadingAuth]);


  React.useEffect(() => {
    if (!conversation || !conversation.id) {
       if (!isLoadingConversation) setIsLoadingMessages(false); // If conv check done, and no conv, stop loading messages
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    const messagesRef = collection(db, "conversations", conversation.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(50)); // Get last 50 messages

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(fetchedMessages);
      setIsLoadingMessages(false);
    }, (err) => {
      console.error("Error fetching messages:", err);
      // setError("Failed to load messages."); // Avoid overriding conversation error
      setIsLoadingMessages(false);
    });

    return () => unsubscribeMessages();
  }, [conversation, isLoadingConversation]);

  const getParticipantDetails = (senderId: string): ParticipantDetail | undefined => {
    return conversation?.participantDetails.find(p => p.userId === senderId);
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const otherParticipant = React.useMemo(() => {
    if (!conversation || !currentUser) return null;
    return conversation.participantDetails.find(p => p.userId !== currentUser.uid);
  }, [conversation, currentUser]);


  if (isLoadingAuth || (isLoadingConversation && !error) ) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <header className="p-4 border-b flex items-center sticky top-0 bg-background z-10">
           <Skeleton className="h-8 w-8 rounded-full mr-3" />
           <Skeleton className="h-6 w-40" />
        </header>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-3/4 rounded-md" />
          <Skeleton className="h-12 w-1/2 rounded-md self-end ml-auto" />
          <Skeleton className="h-12 w-3/4 rounded-md" />
        </div>
        <footer className="p-4 border-t sticky bottom-0 bg-background">
          <Skeleton className="h-10 w-full rounded-md" />
        </footer>
      </div>
    );
  }
  
  if (!currentUser && !isLoadingAuth) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center py-12">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <CardHeader>
            <LogIn className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-2xl font-bold">Access Conversation</CardTitle>
            <CardDescription>Please log in to view this conversation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href={`/auth/login?redirect=/messages/${conversationId}`}>Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline">
          <Link href="/messages"> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Messages </Link>
        </Button>
      </div>
    );
  }
  
  if (!conversation && !isLoadingConversation) {
     return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Conversation Not Found</h2>
        <p className="text-muted-foreground mb-6">The conversation may have been deleted or does not exist.</p>
         <Button asChild variant="outline">
          <Link href="/messages"> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Messages </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto border-x"> {/* Max width and centered, border for chat-like feel */}
      <header className="p-3 sm:p-4 border-b flex items-center sticky top-0 bg-card z-10 shadow-sm">
        <Button variant="ghost" size="icon" className="mr-2" asChild>
          <Link href="/messages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        {otherParticipant && (
            <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src={otherParticipant.photoURL || undefined} alt={otherParticipant.displayName || "User"} data-ai-hint="user avatar"/>
                <AvatarFallback>{otherParticipant.displayName?.charAt(0).toUpperCase() || <User/>}</AvatarFallback>
            </Avatar>
        )}
        <h2 className="text-lg font-semibold text-foreground truncate">
          {otherParticipant?.displayName || "Conversation"}
        </h2>
      </header>

      <ScrollArea className="flex-1 p-3 sm:p-4 bg-background">
        <div className="space-y-4">
          {isLoadingMessages && messages.length === 0 && (
            <>
              <Skeleton className="h-16 w-3/4 rounded-lg" />
              <Skeleton className="h-12 w-1/2 rounded-lg self-end ml-auto" />
              <Skeleton className="h-14 w-2/3 rounded-lg" />
            </>
          )}
          {!isLoadingMessages && messages.length === 0 && (
             <div className="text-center py-10 text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 mb-3"/>
                <p>No messages yet. Start the conversation!</p>
             </div>
          )}
          {messages.map((msg) => {
            const senderDetails = getParticipantDetails(msg.senderId);
            const isCurrentUser = msg.senderId === currentUser?.uid;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end space-x-2 max-w-[85%]",
                  isCurrentUser ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
                )}
              >
                {!isCurrentUser && senderDetails && (
                  <Avatar className="h-8 w-8 self-start">
                     <AvatarImage src={senderDetails.photoURL || undefined} alt={senderDetails.displayName || ""} data-ai-hint="participant avatar"/>
                     <AvatarFallback>{senderDetails.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                )}
                 {!isCurrentUser && !senderDetails && ( // Fallback if details somehow missing
                    <Avatar className="h-8 w-8 self-start">
                        <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                    </Avatar>
                 )}
                <div
                  className={cn(
                    "p-3 rounded-xl shadow-sm",
                    isCurrentUser
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card border border-border rounded-bl-none"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={cn(
                      "text-xs mt-1",
                      isCurrentUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                    )}>
                    {formatDate(msg.createdAt)}
                    {!isCurrentUser && senderDetails && <span className="font-medium ml-1.5">{senderDetails.displayName}</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <footer className="p-3 sm:p-4 border-t sticky bottom-0 bg-card shadow-sm">
        <form 
          // onSubmit={handleSendMessage} 
          className="flex items-center space-x-2"
        >
          <Input
            type="text"
            // value={newMessage}
            // onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message... (Sending disabled)"
            className="flex-1"
            autoComplete="off"
            disabled // Sending not implemented yet
          />
          <Button type="submit" 
            // disabled={isSending || !newMessage.trim()}
            disabled // Sending not implemented yet
            >
            {/* {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} */}
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </footer>
        <div className="p-4 bg-blue-50 border-t border-blue-200 text-sm text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300">
          <AlertCircle className="inline h-4 w-4 mr-1.5 relative -top-px" />
          This is a basic messaging interface. Functionality to send messages is not yet implemented.
          Currently, loading real conversations from the database is partially implemented for display.
        </div>
    </div>
  );
}
