// ─────────────────────────────────────────────────────────────────────────────
// firebase-config.js
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: Firebase client-side API keys are NOT secret.
// They identify your Firebase project to Google's servers, similar to a
// public app ID. Real security is enforced through Firebase Security Rules
// (in your Firebase Console → Firestore → Rules).
//
// The keys below are intentionally public-facing. What you must protect:
//   ✅  Firebase Security Rules — restrict who can read/write data
//   ✅  Firebase Authentication — only authenticated users can access protected data
//   ❌  NEVER store admin passwords, PINs, or secrets in HTML/JS source files
// ─────────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
    apiKey: "AIzaSyA8Tsfny9BFYUmRfQENHN4rSyagTLtLIyA",
    authDomain: "prata-aqua-profit-tracke-63.firebaseapp.com",
    projectId: "prata-aqua-profit-tracke-63",
    storageBucket: "prata-aqua-profit-tracke-63.firebasestorage.app",
    messagingSenderId: "1018064835758",
    appId: "1:1018064835758:web:52c3023ac35c116fc4893f"
};
