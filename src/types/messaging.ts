
// src/types/messaging.ts
import type { Timestamp } from 'firebase/firestore';

export interface ParticipantDetail {
  userId: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface Conversation {
  id?: string; // Firestore document ID
  participantIds: string[]; // Array of user IDs for querying
  participantDetails: ParticipantDetail[]; // Denormalized participant info for display
  lastMessageText?: string;
  lastMessageSentAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Optional: unread counts for each participant, e.g., unreadCounts: { [userId: string]: number }
}

export interface Message {
  id?: string; // Firestore document ID
  conversationId: string; // To know which conversation it belongs to (though it's in a subcollection)
  senderId: string;
  // senderName and senderPhotoURL are not stored on the message directly
  // to reduce data duplication. They can be retrieved from Conversation.participantDetails
  text: string;
  createdAt: Timestamp;
  // Optional: imageUrl, readBy (array of userIds who read it)
}
