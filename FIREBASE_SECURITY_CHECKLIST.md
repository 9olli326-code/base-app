# Firebase Security Checklist — BASE

## MANUELL IN FIREBASE CONSOLE PRUEFEN:

### 1. API Key Restriction (JETZT MACHEN)
- Gehe zu: console.cloud.google.com → APIs & Services → Credentials
- Klicke auf deinen Browser API Key (AIzaSyAW4KVF...)
- Unter "Application restrictions": "HTTP referrers" waehlen
- Erlaubte Referrer hinzufuegen:
  - https://base-app.tech/*
  - https://base-app.tech
  - http://localhost:* (nur fuer Entwicklung)
- Speichern

### 2. Firebase Authentication Domains
- Firebase Console → Authentication → Settings → Authorized domains
- Sicherstellen dass NUR vorhanden:
  - base-app.tech
  - localhost
  - beastmode-17f0d.firebaseapp.com

### 3. Neue Firestore Security Rules
Firebase Console → Firestore → Rules → folgende Rules einfuegen:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /lexoffice_keys/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /profiles/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /feed/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }
    match /follows/{uid}/following/{targetUid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /likes/{postId}/likes/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /shared_routines/{routineId} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }
    match /creator_codes/{codeId} {
      allow read: if true;
      allow update: if request.auth != null;
    }
    match /fcm_tokens/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /conversations/{convId} {
      allow read, write: if request.auth != null;
      match /messages/{msgId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### 4. Netlify Env Vars hinzufuegen
- LEXOFFICE_SALT = base-app-2026-secure-salt
- (Falls noch nicht gesetzt: FIREBASE_SERVICE_ACCOUNT, FIREBASE_PROJECT_ID)
