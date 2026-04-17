# Prata Aqua Profit Tracker — Secure Deployment Guide

## File Structure

```
/
├── Administration.html     ← Main app (no secrets inside)
├── firebase-config.js      ← Firebase project identifiers (safe to be public)
├── auth.js                 ← Firebase Auth logic (no passwords stored here)
├── setup-admin.html        ← ONE-TIME setup page (DELETE after use!)
└── README.md               ← This file
```

---

## Step 1 — Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Click **Authentication** → **Sign-in method**
3. Enable **Email/Password** provider
4. Click Save

---

## Step 2 — Enable Firestore Database

1. In Firebase Console → **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (you'll set rules in Step 4)
4. Pick your region → Done

---

## Step 3 — Run the One-Time Setup

1. Deploy all files to Netlify (or run locally)
2. Open `setup-admin.html` in your browser
3. You'll see your 3 users pre-filled (jimit, karan, smit)
   - Set **jimit** as **Admin** (can access Admin Panel)
   - Set karan and smit as **User** (can access Profit, Stock, etc.)
4. Enter each person's password
5. Enter the delete PIN (was `1163` — change if you want)
6. Click **Run Setup**
7. Wait for the log to show all green ✅

> ⚠️ **After setup succeeds, delete `setup-admin.html` from your Netlify site.**
> You can do this by removing the file and redeploying.

---

## Step 4 — Set Firestore Security Rules

In Firebase Console → Firestore → **Rules**, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Sales data — authenticated users can read/write
    match /sales/{docId} {
      allow read, write: if request.auth != null;
    }

    // Cost prices — authenticated users can read/write
    match /costPrices/{docId} {
      allow read, write: if request.auth != null;
    }

    // Stock records — authenticated users can read/write
    match /stockRecords/{docId} {
      allow read, write: if request.auth != null;
    }

    // App config (delete PIN) — authenticated users can read; DENY all writes
    match /appConfig/{docId} {
      allow read: if request.auth != null;
      allow write: if false;  // Only setup-admin.html can write this, and it's deleted
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

---

## How Authentication Works

| Old (insecure) | New (secure) |
|---|---|
| Passwords in HTML source | Passwords in Firebase Auth |
| `VALID_PASSWORDS = [...]` visible to anyone | Firebase email+password auth |
| DELETE_PIN hardcoded in JS | DELETE_PIN stored in Firestore |
| Anyone can read source → steal passwords | No passwords in source at all |

### User Emails (internal format)
Firebase Auth uses emails in this format (not real emails, never sent):
- Regular user: `user_jimit@prataaqua.internal`
- Admin user: `admin_jimit@prataaqua.internal`

The login UI only shows **Name** and **Password** fields — the email is constructed behind the scenes. Users never see the email format.

---

## Adding New Users Later

1. Temporarily re-upload `setup-admin.html`
2. Add the new user's row
3. Click Run Setup
4. Remove `setup-admin.html` again

Or use Firebase Console → Authentication → **Add user** directly (use the email format above).

---

## Resetting a Forgotten Password

Use Firebase Console → Authentication → find the user → **Reset password** (or set a new one directly).

---

## About the Firebase API Key

The `apiKey` in `firebase-config.js` is **not a secret**. Firebase client-side keys are designed to be public — they identify your project to Google's servers, similar to a public app ID. Security is enforced entirely by:
- **Firebase Authentication** (only registered users can log in)
- **Firestore Security Rules** (only authenticated users can read/write data)

This is Firebase's official architecture. See: https://firebase.google.com/docs/projects/api-keys
