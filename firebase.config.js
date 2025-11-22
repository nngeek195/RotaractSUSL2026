// firebase.config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// This is YOUR specific config object from your prompt
const firebaseConfig = {
    apiKey: "AIzaSyCAtQeU47lHk0gtWt5nh-2lT5i1_EF3EA0",
    authDomain: "rotaract-club-f7742.firebaseapp.com",
    projectId: "rotaract-club-f7742",
    storageBucket: "rotaract-club-f7742.firebasestorage.app",
    messagingSenderId: "243822771204",
    appId: "1:243822771204:web:78037a4769ba6d39e84951",
    measurementId: "G-SSSKZKPE98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);