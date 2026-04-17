// ─────────────────────────────────────────────────────────────────────────────
// auth.js
// Handles all authentication for Prata Aqua Profit Tracker.
// Replaces hardcoded VALID_PASSWORDS and DELETE_PIN with Firebase Auth.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection, addDoc, getDocs, updateDoc,
    deleteDoc, doc, setDoc, getDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// ── Init ─────────────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Expose globals for legacy inline scripts in Administration.html ───────────
window._db = db;
window._auth = auth;
window._fs = { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc, getDoc, query, orderBy };

// ─────────────────────────────────────────────────────────────────────────────
// USER ROLES
// Each Firebase Auth user has an email in the format:
//   user_<name>@prataaqua.internal    ← regular user (can view protected pages)
//   admin_<name>@prataaqua.internal   ← admin (extra admin panel access)
//
// The DELETE PIN is stored as a Firestore document in collection "appConfig",
// document "security", field "deletePin". Only authenticated users can read it
// (enforced by Firestore Security Rules).
// ─────────────────────────────────────────────────────────────────────────────

let _currentUser    = null;
let _isAdmin        = false;
let _deletePin      = null;   // loaded from Firestore after login
let _pendingTarget  = null;   // the section being unlocked

// ── Auth state watcher ────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    _currentUser = user;
    if (user) {
        _isAdmin = user.email.startsWith("admin_");
        await _loadDeletePin();
        window.dispatchEvent(new CustomEvent("auth-changed", { detail: { user, isAdmin: _isAdmin } }));
    } else {
        _isAdmin  = false;
        _deletePin = null;
        window.dispatchEvent(new CustomEvent("auth-changed", { detail: { user: null, isAdmin: false } }));
    }
});

// ── Load the delete PIN from Firestore ────────────────────────────────────────
async function _loadDeletePin() {
    try {
        const snap = await getDoc(doc(db, "appConfig", "security"));
        if (snap.exists()) {
            _deletePin = snap.data().deletePin || null;
        }
    } catch (e) {
        console.warn("Could not load delete PIN:", e.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API  (used by Administration.html instead of hardcoded checks)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign in with email + password via Firebase Auth.
 * @param {string} email    e.g. "user_jimit@prataaqua.internal"
 * @param {string} password
 * @returns {{ ok: boolean, isAdmin: boolean, error?: string }}
 */
export async function signIn(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const isAdm = cred.user.email.startsWith("admin_");
        await _loadDeletePin();
        return { ok: true, isAdmin: isAdm };
    } catch (err) {
        let msg = "Wrong password or email.";
        if (err.code === "auth/user-not-found") msg = "User not found.";
        if (err.code === "auth/wrong-password")  msg = "Incorrect password.";
        if (err.code === "auth/invalid-email")   msg = "Invalid email format.";
        if (err.code === "auth/too-many-requests") msg = "Too many attempts. Try again later.";
        return { ok: false, error: msg };
    }
}

/**
 * Sign in using just a display name and password.
 * Tries user_<name> first, then admin_<name> if that fails.
 * This keeps the UI simple (no email field shown to end users).
 * @param {string} name      e.g. "jimit"
 * @param {string} password
 * @returns {{ ok: boolean, isAdmin: boolean, error?: string }}
 */
export async function signInByName(name, password) {
    // Sanitise: lowercase, strip spaces
    const safe = name.trim().toLowerCase().replace(/\s+/g, "_");
    // Try regular user email first
    const userEmail  = `user_${safe}@prataaqua.internal`;
    const adminEmail = `admin_${safe}@prataaqua.internal`;

    let result = await signIn(userEmail, password);
    if (!result.ok) {
        // Try admin email
        result = await signIn(adminEmail, password);
    }
    return result;
}

/**
 * Sign out the current user.
 */
export async function logOut() {
    await signOut(auth);
}

/**
 * Returns true if there is a currently signed-in user.
 */
export function isLoggedIn() {
    return !!_currentUser;
}

/**
 * Returns true if the current user is an admin.
 */
export function isAdmin() {
    return _isAdmin;
}

/**
 * Verify the delete PIN (loaded from Firestore).
 * @param {string} pin
 * @returns {boolean}
 */
export function verifyDeletePin(pin) {
    if (!_deletePin) return false;
    return pin === _deletePin;
}

// ── Expose to window so inline <script> in HTML can also call these ───────────
window._auth_api = {
    signIn,
    signInByName,
    logOut,
    isLoggedIn,
    isAdmin: () => _isAdmin,
    verifyDeletePin,
};

// ── Fire firebase-ready once Firestore + Auth are both initialised ─────────────
// (Replaces the old firebase-ready event from the inline module script)
window.dispatchEvent(new Event("firebase-ready"));
