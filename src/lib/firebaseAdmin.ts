import { getApps, getApp, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

function parseServiceAccountKey(raw: string | undefined): any | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // ignore
    }
  }

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf-8").trim();
    if (decoded.startsWith("{")) {
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // ignore
  }

  return null;
}

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

    const parsedKey = parseServiceAccountKey(serviceAccountKeyJson);

    if (parsedKey) {
      if (parsedKey.private_key && typeof parsedKey.private_key === "string") {
        parsedKey.private_key = parsedKey.private_key.replace(/\\n/g, "\n");
      }
      return initializeApp({
        credential: cert(parsedKey),
        projectId: parsedKey.project_id || projectId,
        storageBucket: `${parsedKey.project_id || projectId}.firebasestorage.app`,
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

    // Không khởi tạo khi không có credentials hợp lệ để tránh lỗi metadata server timeout trên Vercel
    return null;
  } catch (error) {
    console.warn("Firebase Admin init warning:", error);
    return null;
  }
}

const adminApp = initAdminApp();

export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export const adminAuth = null;
export const adminStorage: Storage | null = adminApp ? getStorage(adminApp) : null;
export { adminApp };
