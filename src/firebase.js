// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyCFovjF4sUZ7gboaSRqOIwiawr5ooAWwLU",
    authDomain: "cenesa-87c4d.firebaseapp.com",
    projectId: "cenesa-87c4d",
    storageBucket: "cenesa-87c4d.firebasestorage.app",
    messagingSenderId: "619803512436",
    appId: "1:619803512436:web:0bf2f7b484e6d03d4b8b21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { db, auth };

