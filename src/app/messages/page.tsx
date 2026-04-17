
// src/app/messages/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { onAuthStateChanged } from "@/lib/firebase/auth";
import { db, auth } from "@/lib/firebase/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import type { Conversation } from "@/types/messaging"; 
import { MessageSquare, User, AlertCircle, LogIn, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MessagesListPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<FirebaseAuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(false);
  const [errorConversations, setErrorConversations] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      if (!isLoadingAuth) setIsLoadingConversations(false); // Stop loading if auth is done and no user
      return;
    }

    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      setErrorConversations(null);
      try {
        if (!db) {
          setErrorConversations("Firestore is not available. Cannot load conversations.");
          setIsLoadingConversations(false);
          return;
        }
        const conversationsRef = collection(db, "conversations");
        const q = query(
          conversationsRef,
          where("participantIds", "array-contains", currentUser.uid),
          orderBy("updatedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedConversations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Conversation));
        setConversations(fetchedConversations);

      } catch (err) {
        console.error("Error fetching conversations:", err);
        setErrorConversations("Failed to load your conversations. Please try again.");
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();

  }, [currentUser, isLoadingAuth]);

  const getOtherParticipant = (conv: Conversation) => {
    if (!currentUser) return null;
    return conv.participantDetails.find(p => p.userId !== currentUser.uid);
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 86400 * 7) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };


  if (isLoadingAuth) {
    return (
      <div className="space-y-8 py-8 max-w-3xl mx-auto px-4">
        <Skeleton className="h-10 w-3/4 mb-4 rounded-md" />
        <Skeleton className="h-6 w-1/2 mb-6 rounded-md" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center py-12">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <CardHeader>
            <LogIn className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-2xl font-bold">Access Your Messages</CardTitle>
            <CardDescription>Please log in to view your conversations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/login?redirect=/messages">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Your Conversations</h1>
        <p className="text-muted-foreground">View and manage your messages.</p>
      </header>

      {/* Placeholder for new message/search users button - Future feature
      <div className="mb-6">
        <Button>
          <Mail className="mr-2 h-4 w-4" /> Start New Conversation (Coming Soon)
        </Button>
      </div> 
      */}

      {isLoadingConversations && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {!isLoadingConversations && errorConversations && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Conversations</AlertTitle>
          <AlertDescription>{errorConversations}</AlertDescription>
        </Alert>
      )}

      {!isLoadingConversations && !errorConversations && conversations.length === 0 && (
         <Card className="shadow-sm">
            <CardContent className="p-6">
                <div className="border-2 border-dashed border-border rounded-md p-12 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto h-16 w-16 mb-4" />
                    <p className="text-xl mb-2">No conversations yet.</p>
                    <p className="text-sm">When you start or receive messages, they will appear here.</p>
                    {/* Optional: Button to start a new conversation if that feature existed
                    <Button className="mt-4">
                        <Mail className="mr-2 h-4 w-4"/> Start a New Conversation
                    </Button> 
                    */}
                </div>
            </CardContent>
         </Card>
      )}

      {!isLoadingConversations && !errorConversations && conversations.length > 0 && (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const otherParticipant = getOtherParticipant(conv);
            return (
              <Link href={`/messages/${conv.id}`} key={conv.id} className="block">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer shadow-sm">
                  <CardContent className="p-4 flex items-start space-x-4">
                    <Avatar className="h-12 w-12 border">
                       <AvatarImage src={otherParticipant?.photoURL || undefined} alt={otherParticipant?.displayName || "User"} data-ai-hint="user avatar" />
                       <AvatarFallback className="text-lg">
                        {otherParticipant?.displayName?.charAt(0).toUpperCase() || <User />}
                       </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-semibold truncate text-foreground">
                          {otherParticipant?.displayName || "Unknown User"}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(conv.lastMessageSentAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessageText || "No messages yet..."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
       <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300">
          <AlertCircle className="inline h-4 w-4 mr-1.5 relative -top-px" />
          This is a basic messaging interface. Functionality to start new conversations and send messages will be added soon.
        </div>
    </div>
  );
}
