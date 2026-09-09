import {getAuth, GoogleAuthProvider} from "firebase/auth"
import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "lernr-40cb7.firebaseapp.com",
  projectId: "lernr-40cb7",
  storageBucket: "lernr-40cb7.firebasestorage.app",
  messagingSenderId: "542747587522",
  appId: "1:542747587522:web:96f4a098923d4b7bda9c5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
export {auth,provider}