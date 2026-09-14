# Budget

A personal budget tracker: monthly category targets, spend-vs-target donuts,
a total balance carried across completed months, and a transactions log with
list or calendar views. Backed by Firebase Auth (email/password) and
Firestore, scoped per user.

## Setup

1. `npm install`
2. Create a Firebase project, enable Email/Password auth and Firestore.
3. Copy `.env.local.example` to `.env.local` and fill in your Firebase web
   app config values.
4. Deploy `firestore.rules` to your project (or paste it into the Firestore
   Rules tab in the console).
5. `npm run dev` and open http://localhost:3000

## Deploy

Push to GitHub and import the repo into Vercel, adding the same environment
variables from `.env.local` in the Vercel project settings.

## Install on iPhone

Open the deployed URL in Safari, tap Share, then "Add to Home Screen."
