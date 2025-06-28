import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzPNzP8A75hmkJJi9U6KCDc0CNJ3zikMY",
  authDomain: "safecity-369cf.firebaseapp.com",
  projectId: "safecity-369cf",
  storageBucket: "safecity-369cf.firebasestorage.app",
  messagingSenderId: "1081516475486",
  appId: "1:1081516475486:web:4f26e9301bec79dd7660cf",
  measurementId: "G-DBW9591HWJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize Analytics (only in production)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Only connect to emulators if not already connected
  try {
    // Firestore emulator
    if (!db._delegate._databaseId.projectId.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    // Auth emulator
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    
    // Storage emulator
    if (!storage._location.bucket.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
    
    // Functions emulator
    if (!functions._url?.includes('localhost')) {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    }
  } catch (error) {
    // Emulators already connected or not available
    console.log('Firebase emulators connection skipped:', error.message);
  }
}

export default app;