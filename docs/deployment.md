# Herafy Deployment

Herafy deploys the web app and Vercel API routes to Vercel.
Firebase remains the backend provider for Auth, Firestore, Storage, Functions, rules, and indexes.
Firebase Hosting is disabled and must not be used for web deployments.

## Vercel Project Settings

Set the Vercel framework preset to Vite.
Use `npm run build` as the build command.
Use `dist` as the output directory.
The committed `vercel.json` keeps the SPA fallback on `/index.html` while leaving `/api/*` for Vercel Functions.
The production domain should resolve through Vercel DNS records only.
If `h3rafy.com` redirects to `www.h3rafy.com`, Cloudflare must also have a `www` record pointed at Vercel.

Configure these environment variables in Vercel for preview and production:

```bash
VITE_HAND_CONNECT_DATA_SOURCE=firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Required Commands

```bash
npm run lint
npm test
npm run e2e
npm run build
npm run deploy:preview
```

Production deploys should happen only after staging smoke tests pass.

```bash
npm run deploy:production
```

Firebase backend resources are deployed separately when rules, indexes, Storage, or Cloud Functions change.

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage,functions --project staging
```
