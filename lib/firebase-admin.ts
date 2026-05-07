import * as admin from 'firebase-admin';

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export function createFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  if (!firebaseAdminConfig.privateKey || !firebaseAdminConfig.clientEmail) {
    throw new Error('Firebase Admin credentials are missing in environment variables.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(firebaseAdminConfig),
  });
}

export const adminDb = () => {
  const app = createFirebaseAdminApp();
  return admin.firestore(app);
};

export const adminAuth = () => {
  const app = createFirebaseAdminApp();
  return admin.auth(app);
};
