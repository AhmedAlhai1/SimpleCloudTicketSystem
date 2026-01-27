// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGnLvJFoVp6z7Toi4u5loQV3qSR5YJn9I",
  authDomain: "simple-ticket-system-34f2f.firebaseapp.com",
  projectId: "simple-ticket-system-34f2f",
  storageBucket: "simple-ticket-system-34f2f.firebasestorage.app",
  messagingSenderId: "828911731066",
  appId: "1:828911731066:web:cf5b7567d1279c4c67d6c3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize the Database (Firestore) and export it
export const db = getFirestore(app);