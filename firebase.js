import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCAANg8fCr6GFnBwFb3Y8Khu1EqYLFD4n8",
  authDomain: "truebuddy-62969.firebaseapp.com",
  projectId: "truebuddy-62969",
  storageBucket: "truebuddy-62969.firebasestorage.app",
  messagingSenderId: "79888978718",
  appId: "1:79888978718:web:6d91ae2bce9e6f2cc0ef0f",
  measurementId: "G-7NMNZMYEJQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const Recaptcha = RecaptchaVerifier;
export const signInPhone = signInWithPhoneNumber;
