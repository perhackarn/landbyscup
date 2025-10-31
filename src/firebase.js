import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB0C2ecPKLnbIMzWuj9LHcZa_fa9c47GzM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "landbys-cup-2288f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "landbys-cup-2288f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "landbys-cup-2288f.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function loginWithEmail(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
}

export {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  signOut,
  onAuthStateChanged
};
