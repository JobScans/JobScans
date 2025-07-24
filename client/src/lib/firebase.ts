import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "jobscans.firebaseapp.com",
  projectId: "jobscans",
  storageBucket: "jobscans.firebasestorage.app",
  messagingSenderId: "179978435562",
  appId: "1:179978435562:web:76b5284493712a6a6f9093",
  measurementId: "G-SLME4X87JC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();

export { auth };