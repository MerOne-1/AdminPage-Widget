import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

async function createCollection(name) {
  try {
    const docRef = await addDoc(collection(db, name), {
      _init: true,
      createdAt: new Date()
    });
    console.log(`Created collection ${name} with document:`, docRef.id);
  } catch (error) {
    console.error(`Error creating collection ${name}:`, error);
  }
}

async function initialize() {
  const collections = ['serviceCategories', 'services', 'employees', 'bookings', 'clients'];
  
  for (const collectionName of collections) {
    console.log(`Creating collection: ${collectionName}`);
    await createCollection(collectionName);
  }
}

initialize().then(() => console.log('Done')).catch(console.error);
