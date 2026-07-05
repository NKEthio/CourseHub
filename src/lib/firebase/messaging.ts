
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit
} from "firebase/firestore";
import type { Conversation, Message, ParticipantDetail } from "@/types/messaging";

export async function getOrCreateConversation(
  currentUser: { uid: string; displayName: string | null; photoURL: string | null },
  otherUser: { uid: string; displayName: string | null; photoURL: string | null }
): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized");

  const conversationsRef = collection(db, "conversations");

  // Query for conversations where current user is a participant
  const q = query(
    conversationsRef,
    where("participantIds", "array-contains", currentUser.uid)
  );

  const querySnapshot = await getDocs(q);

  // Find a conversation that also includes the other user
  let conversationId: string | null = null;
  querySnapshot.forEach((doc) => {
    const data = doc.data() as Conversation;
    if (data.participantIds.includes(otherUser.uid) && data.participantIds.length === 2) {
      conversationId = doc.id;
    }
  });

  if (conversationId) {
    return conversationId;
  }

  // If no conversation exists, create a new one
  const newConversation: Omit<Conversation, 'id'> = {
    participantIds: [currentUser.uid, otherUser.uid],
    participantDetails: [
      {
        userId: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
      },
      {
        userId: otherUser.uid,
        displayName: otherUser.displayName,
        photoURL: otherUser.photoURL,
      },
    ],
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(conversationsRef, newConversation);
  return docRef.id;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const conversationRef = doc(db, "conversations", conversationId);

  const newMessage: Omit<Message, 'id'> = {
    conversationId,
    senderId,
    text,
    createdAt: serverTimestamp() as Timestamp,
  };

  // Add the message to the subcollection
  await addDoc(messagesRef, newMessage);

  // Update the conversation document with last message info
  await updateDoc(conversationRef, {
    lastMessageText: text,
    lastMessageSentAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
