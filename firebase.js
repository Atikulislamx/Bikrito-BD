/**
 * firebase.js
 * Firebase configuration and initialization for Bikrito-BD.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use an existing one).
 * 3. Add a Web App and copy the firebaseConfig values below.
 * 4. Enable Firestore Database (production mode).
 * 5. Enable Authentication → Google Sign-In provider.
 * 6. Apply the Firestore security rules from the README.
 */

// TODO: Replace these placeholder values with your actual Firebase project config.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Warn developers if placeholder values are still present
if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
  console.warn(
    '[Bikrito-BD] Firebase is using placeholder config values. ' +
    'Replace them in firebase.js with your actual Firebase project credentials. ' +
    'See README.md for setup instructions.'
  );
}

// Firestore instance (real-time database)
const db = firebase.firestore();

// Firebase Auth instance
const auth = firebase.auth();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
