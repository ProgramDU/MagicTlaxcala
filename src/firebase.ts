// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCzZ2cPtIJoQeg3ZPBcBWFbVX2rJ1KsFxM",
  authDomain: "magictlax-b6d7d.firebaseapp.com",
  projectId: "magictlax-b6d7d",
  storageBucket: "magictlax-b6d7d.firebasestorage.app",
  messagingSenderId: "260961148884",
  appId: "1:260961148884:web:189275b797962373ff0041"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
