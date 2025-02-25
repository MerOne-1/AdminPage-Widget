import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAPvgVEb4mQT_ztsZG7MVQ8tgj1VOlA4iU",
  authDomain: "widget-v2-2dee9.firebaseapp.com",
  projectId: "widget-v2-2dee9",
  storageBucket: "widget-v2-2dee9.firebasestorage.app",
  messagingSenderId: "634987876869",
  appId: "1:634987876869:web:59ce3fa9e7e5819350826c",
  measurementId: "G-1B6B44V6FR"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
