// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlQXPdDmpeiuJjEw2x4fr8jYv6PsZMyEE",
  authDomain: "shopifyproject-af43b.firebaseapp.com",
  projectId: "shopifyproject-af43b",
  storageBucket: "shopifyproject-af43b.firebasestorage.app",
  messagingSenderId: "828202704376",
  appId: "1:828202704376:web:7e298a27eaa8efa8380a0d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };