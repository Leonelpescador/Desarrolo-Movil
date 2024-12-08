import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
  apiKey: "AIzaSyALy6T_2seohKKXiOSXSFyatyJxyw_WRLA",
  authDomain: "mobilestart-5f616.firebaseapp.com",
  databaseURL: "https://mobilestart-5f616-default-rtdb.firebaseio.com",
  projectId: "mobilestart-5f616",
  storageBucket: "mobilestart-5f616.firebasestorage.app",
  messagingSenderId: "91931916562",
  appId: "1:91931916562:web:37a988a0cc562c5fb49bcb"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };



