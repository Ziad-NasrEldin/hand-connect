# Firebase Social Login Playbook

Use this as a handoff for another AI or engineer implementing Kalima-style social login in another project.

## Goal

Implement social login using Firebase Authentication as the OAuth identity broker, while the app keeps its own backend users, roles, JWTs, refresh tokens, and permissions.

Firebase handles:

- Google or Facebook OAuth popup.
- Provider identity verification.
- Firebase ID token generation.

Your app backend handles:

- User creation.
- Role-specific registration fields.
- Account linking.
- App JWT/session issuing.
- Authorization and permissions.

## Billing Note

Basic Firebase social login usually does not require Blaze.

Firebase Spark/free tier is normally enough for:

- Google sign-in.
- Facebook sign-in.
- Email/password auth.

Blaze may be required if the project also uses:

- Cloud Functions.
- Paid Google Cloud APIs.
- Heavy phone/SMS auth.
- Identity Platform enterprise features.
- Other billable Firebase/GCP services.

Do not assume social login requires Blaze. Verify the actual Firebase feature being used.

## Architecture

Use this shape:

```txt
Frontend
  -> Firebase JS SDK
  -> signInWithPopup(GoogleAuthProvider)
  -> Firebase returns ID token
  -> POST ID token to backend

Backend
  -> Firebase Admin SDK
  -> verifyIdToken(idToken)
  -> extract uid/email/name/provider
  -> find/create/link app user
  -> issue app JWT + refresh token
```

Firebase is not the app session source. It only proves that Google/Facebook authenticated the user.

## Firebase Console Setup

1. Create or select a Firebase project.
2. Go to `Firebase Console -> Authentication -> Sign-in method`.
3. Enable the providers needed by the app, usually `Google` first and `Facebook` only if required.
4. For Google, enable the provider, set the support email, and save.
5. For Facebook, create a Meta app, get the App ID and App Secret, add the Firebase OAuth redirect URI into Meta app settings, then enable Facebook provider in Firebase.
6. Go to `Firebase Console -> Authentication -> Settings -> Authorized domains`.
7. Add `localhost`, the dev domain, and the production domain.

## Frontend Environment Variables

For Vite/React:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

For Next.js:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

These are public client config values. They are not the Firebase Admin private key.

## Frontend Firebase Module

Create a Firebase client module.

```js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
```

For Next.js, replace `import.meta.env.*` with `process.env.NEXT_PUBLIC_*`.

## Frontend Login Flow

When the user clicks `Continue with Google`:

```js
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  const response = await api.post("/auth/login/firebase", { idToken });

  saveAppSession(response.data.tokens);
  saveCurrentUser(response.data.user);
}
```

The backend should return the app's own tokens, not Firebase tokens.

## Frontend Registration Flow

For role-based apps, use two-step registration:

1. User authenticates with Google.
2. App fills name/email from Firebase.
3. User completes required app-specific fields.
4. Frontend sends the Firebase `idToken` plus app fields to backend.

```js
async function startGoogleRegistration() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  form.setValue("name", result.user.displayName || "");
  form.setValue("email", result.user.email || "");

  setFirebaseToken(idToken);
}

async function submitRegistration(values) {
  await api.post("/auth/register/student/firebase", {
    ...values,
    idToken: firebaseToken,
  });
}
```

## Backend Environment Variables

The backend needs Firebase Admin credentials.

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Optional local-only bypass:

```env
FIREBASE_AUTH_LOCAL_DEV_BYPASS=true
```

Do not use bypass in production.

## Backend Firebase Admin Setup

Node/Express example:

```ts
import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

function normalizePrivateKey(value?: string) {
  if (!value) return value;
  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n");
}

const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase service-account credentials are required.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const firebaseAuth = admin.auth();
```

## Backend Token Verification

Create a helper:

```ts
async function verifyFirebaseToken(idToken: string) {
  const decoded = await firebaseAuth.verifyIdToken(idToken);

  if (!decoded.email) {
    throw new Error("Firebase token does not contain an email");
  }

  let provider = "firebase";

  if (decoded.firebase?.sign_in_provider === "google.com") {
    provider = "google";
  }

  if (decoded.firebase?.sign_in_provider === "facebook.com") {
    provider = "facebook";
  }

  return {
    uid: decoded.uid,
    email: decoded.email.toLowerCase(),
    name: decoded.name || decoded.email.split("@")[0],
    emailVerified: decoded.email_verified || false,
    photoUrl: decoded.picture,
    provider,
  };
}
```

## Database Model

Add a table for external auth identities.

```prisma
model AuthIdentity {
  id             Int    @id @default(autoincrement())
  userId         Int
  provider       String
  providerUserId String
  providerEmail  String?

  user           User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerUserId])
}
```

Recommended providers:

```txt
local
firebase
google
facebook
```

Do not rely only on email for social identity. Use `provider + providerUserId` to prevent collisions and support account linking.

## Backend Login Endpoint

Route:

```txt
POST /auth/login/firebase
```

Body:

```json
{
  "idToken": "firebase-id-token"
}
```

Flow:

```ts
async function loginFirebase(idToken: string) {
  const firebaseUser = await verifyFirebaseToken(idToken);

  const user = await findUserByAuthIdentity(
    firebaseUser.provider,
    firebaseUser.uid
  );

  if (!user) {
    throw new Error("No account found with this provider. Please register first.");
  }

  const tokens = await issueAppTokens(user.id);

  return {
    user: mapUser(user),
    tokens,
    linkedProviders: mapLinkedProviders(user.authIdentities),
  };
}
```

## Backend Registration Endpoint

Example routes:

```txt
POST /auth/register/student/firebase
POST /auth/register/teacher/firebase
POST /auth/register/parent/firebase
```

Flow:

```ts
async function registerStudentFirebase(input) {
  const firebaseUser = await verifyFirebaseToken(input.idToken);

  await ensureEmailNotExists(firebaseUser.email);

  const user = await db.user.create({
    data: {
      name: firebaseUser.name,
      email: firebaseUser.email,
      emailVerified: true,
      profilePictureUrl: firebaseUser.photoUrl,
      role: "student",

      authIdentities: {
        create: {
          provider: firebaseUser.provider,
          providerUserId: firebaseUser.uid,
          providerEmail: firebaseUser.email,
        },
      },

      studentProfile: {
        create: {
          levelId: input.levelId,
          phone: input.phone,
        },
      },
    },
  });

  const tokens = await issueAppTokens(user.id);

  return {
    user,
    tokens,
  };
}
```

## Account Linking

For logged-in users, support linking a Google account to an existing password account.

Route:

```txt
POST /auth/link/firebase
```

Body:

```json
{
  "idToken": "firebase-id-token"
}
```

Flow:

```ts
async function linkFirebaseAccount(currentUserId, idToken) {
  const firebaseUser = await verifyFirebaseToken(idToken);

  const existingUser = await findUserByAuthIdentity(
    firebaseUser.provider,
    firebaseUser.uid
  );

  if (existingUser && existingUser.id !== currentUserId) {
    throw new Error("This social account is already linked to another user.");
  }

  await createAuthIdentity({
    userId: currentUserId,
    provider: firebaseUser.provider,
    providerUserId: firebaseUser.uid,
    providerEmail: firebaseUser.email,
  });

  return {
    message: "Account linked successfully",
  };
}
```

## Account Unlinking

Support unlinking providers, but protect users from locking themselves out.

Rules:

- Do not allow unlinking the only login method.
- If removing local/password auth, ensure another provider exists.
- If removing Google/Facebook, ensure password or another provider exists.

## Required API Endpoints

Minimum useful set:

```txt
POST /auth/login
POST /auth/register
POST /auth/login/firebase
POST /auth/register/:role/firebase
POST /auth/link/firebase
POST /auth/unlink
GET  /auth/linked-providers
```

## Common Mistakes

- Do not send Firebase Admin private key to frontend.
- Do not trust frontend-provided email/name without verifying the Firebase ID token.
- Do not create app sessions directly from the frontend Firebase user.
- Do not use email alone as the social identity key.
- Do not allow account linking without checking if provider identity is already linked elsewhere.
- Do not leave Firebase local bypass enabled in production.
- Do not forget Firebase authorized domains.
- Do not forget to enable the provider in Firebase Console.
- Do not assume Blaze is required for basic social login.

## Verification Checklist

Frontend:

```txt
Google button appears.
Popup opens.
User can select Google account.
Firebase returns user.
Frontend obtains idToken.
Frontend posts idToken to backend.
```

Backend:

```txt
Backend verifies idToken using Firebase Admin SDK.
Backend extracts uid/email/provider.
Registration creates user + auth identity.
Login finds user by provider + uid.
Backend returns app JWT/refresh token.
Protected routes work using app JWT.
```

Firebase Console:

```txt
Authentication enabled.
Google provider enabled.
Authorized domains include local and production domains.
Frontend Firebase config matches project.
Backend service account belongs to same Firebase project.
```

Production:

```txt
FIREBASE_PROJECT_ID set.
FIREBASE_CLIENT_EMAIL set.
FIREBASE_PRIVATE_KEY set.
No local bypass enabled.
OAuth redirect/domain settings correct.
```

## Implementation Order

1. Configure Firebase project and enable Google provider.
2. Add frontend Firebase client SDK config.
3. Add Google button using `signInWithPopup`.
4. Send Firebase `idToken` to backend.
5. Add backend Firebase Admin SDK config.
6. Implement `verifyFirebaseToken`.
7. Add `auth_identities` table.
8. Implement Firebase registration.
9. Implement Firebase login.
10. Implement account linking/unlinking.
11. Test locally.
12. Test production domain authorization.
