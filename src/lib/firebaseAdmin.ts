import { getApps, getApp, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

function initAdminApp(): App | null {
  const apps = getApps();
  if (apps.length > 0) {
    return getApp();
  }

  try {
    const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "netsvecomnet";

    if (serviceAccountKeyJson) {
      const parsedKey = JSON.parse(serviceAccountKeyJson);
      return initializeApp({
        credential: cert(parsedKey),
        storageBucket: `${projectId}.firebasestorage.app`,
      });
    }

    if (clientEmail && privateKey) {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: `${projectId}.firebasestorage.app`,
      });
    }

    return initializeApp({
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
    });
  } catch (error) {
    console.warn("Firebase Admin init warning:", error);
    return null;
  }
}

const adminApp = initAdminApp();

export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;
export const adminStorage: Storage | null = adminApp ? getStorage(adminApp) : null;
export { adminApp };
