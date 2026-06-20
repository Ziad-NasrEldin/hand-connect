# Herafy Deployment

Herafy deploys to Firebase Hosting with Firestore, Storage, Functions, and indexed queries.

## Required Commands

```powershell
npm run lint
npm test
npm run e2e
npm run build
firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting --project staging
```

Production deploys should happen only after staging smoke tests pass.
