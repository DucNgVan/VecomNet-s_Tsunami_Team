import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App | undefined;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

function parseServiceAccountKey(raw: string | undefined): any | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  // 1. Thử parse trực tiếp nếu bắt đầu bằng dấu ngoặc nhọn
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // ignore
    }
  }

  // 2. Thử decode base64
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

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "netsvecomnet";

  const parsedKey = parseServiceAccountKey(serviceAccountKey);

  // CHỈ KHỞI TẠO FIREBASE ADMIN KHI CÓ SERVICE ACCOUNT KEY HỢP LỆ
  // Tránh lỗi gRPC metadata lookup timeout (500 Internal Server Error) trên Vercel Serverless
  if (parsedKey) {
    if (!getApps().length) {
      // Sửa lỗi kí tự xuống dòng escaped \n trong private_key
      if (parsedKey.private_key && typeof parsedKey.private_key === "string") {
        parsedKey.private_key = parsedKey.private_key.replace(/\\n/g, "\n");
      }

      app = initializeApp({
        credential: cert(parsedKey),
        projectId: parsedKey.project_id || projectId,
      });
    } else {
      app = getApps()[0];
    }

    if (app) {
      adminDbInstance = getFirestore(app);
      adminAuthInstance = getAuth(app);
    }
  } else {
    if (serviceAccountKey && serviceAccountKey.trim().length > 0) {
      console.warn(
        "[Backend Config] FIREBASE_SERVICE_ACCOUNT_KEY không đúng định dạng JSON service account. Đang chạy chế độ Fallback."
      );
    }
    adminDbInstance = null;
    adminAuthInstance = null;
  }
} catch (error) {
  console.warn("[Backend Config] Firebase Admin init notice (running in fallback mode):", error);
  adminDbInstance = null;
  adminAuthInstance = null;
}

export const adminDb = adminDbInstance;
export const adminAuth = adminAuthInstance;
export default app;
