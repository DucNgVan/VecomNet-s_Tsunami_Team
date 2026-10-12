import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App | undefined;

if (!getApps().length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "netsvecomnet";

    if (serviceAccountKey) {
      try {
        const parsedKey = JSON.parse(serviceAccountKey);
        app = initializeApp({
          credential: cert(parsedKey),
          projectId,
        });
      } catch (e) {
        app = initializeApp({ projectId });
      }
    } else {
      app = initializeApp({ projectId });
    }
  } catch (error) {
    console.warn("[Backend Config] Firebase Admin init notice:", error);
  }
} else {
  app = getApps()[0];
}

let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

try {
  if (app) {
    adminDbInstance = getFirestore(app);
    adminAuthInstance = getAuth(app);
  }
} catch (e) {
  console.warn("[Backend Config] Firestore / Auth init fallback:", e);
}

export const adminDb = adminDbInstance;
export const adminAuth = adminAuthInstance;
export default app;
