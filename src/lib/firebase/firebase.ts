
// src/lib/firebase/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
// import { getAnalytics, type Analytics } from "firebase/analytics"; // Optional: uncomment if you need Analytics

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;
// let analytics: Analytics | undefined; // Optional

// Check if all required Firebase config keys are present and non-empty strings
const requiredKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId'];
const missingOrEmptyKeys = requiredKeys.filter(key => {
  const value = firebaseConfig[key];
  return typeof value !== 'string' || value.trim() === '';
});

if (missingOrEmptyKeys.length > 0) {
  console.error(
    `CRITICAL: Firebase configuration is incomplete or invalid in .env.local. Missing or empty for: ${missingOrEmptyKeys.join(', ')}. Please check your .env.local file and ensure it's loaded correctly. Firebase services will NOT be available.`
  );
  // Services (app, auth, db, storage) remain undefined
} else {
  try {
    const tempApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    
    // More robust check to ensure the app object is valid
    if (tempApp && typeof tempApp.name === 'string' && tempApp.name !== '') {
      app = tempApp; // Assign to exported variable only if valid

      // Initialize Auth only if app is valid
      try {
        const tempAuth = getAuth(app);
        // Perform a more robust check on the auth instance itself
        if (tempAuth && typeof tempAuth.onAuthStateChanged === 'function' && typeof tempAuth.signOut === 'function') {
          auth = tempAuth; // Assign to exported variable
        } else {
          console.error("CRITICAL: Firebase Auth service obtained but appears to be invalid/incomplete (e.g., missing critical methods). Auth features will not work as expected. Check Firebase config and initialization.");
          auth = undefined; // Ensure auth is undefined if not valid
        }
      } catch (e) {
        console.error("CRITICAL: Failed to initialize Firebase Auth:", e);
        auth = undefined; // Ensure auth is undefined on error
      }

      // Initialize Firestore only if app is valid
      try {
        db = getFirestore(app); // Assign to exported variable
      } catch (e) {
        console.error("Failed to initialize Firestore:", e);
        db = undefined;
      }

      // Initialize Storage only if app is valid
      try {
        storage = getStorage(app); // Assign to exported variable
      } catch (e) {
        console.error("Failed to initialize Firebase Storage:", e);
        storage = undefined;
      }

      // Optional: Initialize Analytics
      // if (typeof window !== 'undefined') { // Analytics only works on the client
      //   try {
      //     analytics = getAnalytics(app);
      //   } catch (e) {
      //     console.error("Failed to initialize Firebase Analytics:", e);
      //   }
      // }
    } else {
      console.error("CRITICAL: Firebase app object was not properly initialized or is invalid (e.g., missing app.name). Services will not be available.");
      // Ensure all services are undefined if app is bad
      app = undefined;
      auth = undefined;
      db = undefined;
      storage = undefined;
    }
  } catch (e) {
    console.error("CRITICAL: Firebase app initialization failed entirely:", e);
    // Ensure all services are explicitly undefined if app initialization itself fails
    app = undefined;
    auth = undefined;
    db = undefined;
    storage = undefined;
  }
}

export { app, auth, db, storage }; //, analytics };
