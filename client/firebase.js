import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {getFirestore} from "firebase/firestore"
// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAIAhWqOYzxDP84Rvzqj1PNmOHwznubSKk",
  authDomain: "agriguard-97c2d.firebaseapp.com",
  projectId: "agriguard-97c2d",
  storageBucket: "agriguard-97c2d.firebasestorage.app",
  messagingSenderId: "191933093962",
  appId: "1:191933093962:web:99b1f12ae65c8be461aeb3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return user;
  } catch (error) {
    console.error("Error during Google Sign-In:", error.message);
  }
};

export { signInWithGoogle,db };
