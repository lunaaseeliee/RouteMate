# RouteMate — Fresh Firebase Reconnection

This project has been patched so RouteMate can be connected to a fresh Firebase project without changing the existing UI.

## 1. Create/register the Firebase web app
Create a new Firebase project, then register a Web app named RouteMate. Copy the Firebase web configuration values.

## 2. Create `.env`
Copy `.env.example` to `.env` and fill these values from Firebase Project Settings > Your apps > Web app:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_FIRESTORE_DATABASE_ID="(default)"`

The app now prefers the `.env` Firebase configuration. `firebase-applet-config.json` is retained only as an AI Studio fallback.

## 3. Authentication providers
In Firebase Authentication, enable:

- Email/Password
- Google
- Phone

For Phone Authentication, configure the SMS region policy to allow the countries you intend to support. Add your deployed app domain to Authorized domains.

## 4. Firestore
Create a Cloud Firestore database using the default database ID. Paste the included `firestore.rules` into Firestore > Rules and publish them.

The patched rules require a verified email and verified RouteMate phone profile before rides can be read or changed.

## 5. Expected RouteMate onboarding flow

### Email/password registration
Register -> Firebase verification email -> Verify Email screen -> Phone SMS verification -> Home

### Google sign-in
Google sign-in -> Phone SMS verification -> Home

Users who have not completed both verification steps should no longer reach the main RouteMate screens.

## 6. Test checklist

1. Register a completely new email/password user.
2. Confirm the app stays on email verification before the email is verified.
3. Click the Firebase verification email.
4. Return to RouteMate and continue to phone verification.
5. Verify the SMS OTP.
6. Confirm the user reaches Home only after both steps.
7. Confirm a `users/{uid}` document exists in Firestore.
8. Test Google sign-in with a new Google account and confirm it goes to phone verification before Home.
9. Test logout/login again.
10. Test posting and finding rides only after verification.

## Important
Do not put the Firebase service-account private key in this frontend project. The normal Firebase Web App config is client configuration; service-account credentials belong only in a trusted backend/server environment.
