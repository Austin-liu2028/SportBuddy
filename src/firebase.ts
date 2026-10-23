
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyALtGHH2eOCuuRihRaL9ArLXoAeGvhW4sE",
  authDomain: "sportbuddy-e56c7.firebaseapp.com",
  projectId: "sportbuddy-e56c7",
  storageBucket: "sportbuddy-e56c7.firebasestorage.app",
  messagingSenderId: "1009640726184",
  appId: "1:1009640726184:web:77c4282834c433a9bc6c9d",
  measurementId: "G-V6LQTFDM6L"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
