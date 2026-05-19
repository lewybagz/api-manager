import admin from "firebase-admin";

let app: admin.app.App | null = null;

export function getAdminApp(): admin.app.App {
  if (app) return app;

  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (raw) {
      const credential = JSON.parse(raw) as admin.ServiceAccount;
      app = admin.initializeApp({
        credential: admin.credential.cert(credential),
      });
    } else {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } else {
    app = admin.app();
  }

  return app;
}

export function getFirestore(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}

export function getAuth(): admin.auth.Auth {
  return getAdminApp().auth();
}

export const FieldValue = admin.firestore.FieldValue;
