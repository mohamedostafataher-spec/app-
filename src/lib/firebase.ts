import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Config is loaded from a JSON file in this environment for security
const firebaseConfig = {
  apiKey: "AIzaSyDTzxOAk5mALzMrxnxeDSC8B4QCqLTph1s",
  authDomain: "gen-lang-client-0437461373.firebaseapp.com",
  projectId: "gen-lang-client-0437461373",
  storageBucket: "gen-lang-client-0437461373.firebasestorage.app",
  messagingSenderId: "605984038141",
  appId: "1:605984038141:web:529e9972e85347797af294"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

export default app;
