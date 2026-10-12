import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App | undefined;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "netsvecomnet";

  // CHỈ KHỞI TẠO FIREBASE ADMIN KHI CÓ SERVICE ACCOUNT KEY HỢP LỆ
  // Tránh lỗi gRPC metadata lookup timeout (500 Internal Server Error) trên Vercel Serverless
  if (serviceAccountKey && serviceAccountKey.trim().length > 0) {
    if (!getApps().length) {
      let rawKey = serviceAccountKey.trim();
      // Hỗ trợ base64 nếu key được encode
      if (!rawKey.startsWith("{") && !rawKey.startsWith("[")) {
        try {
          rawKey = Buffer.from(rawKey, "base64").toString("utf-8");
        } catch {
          // ignore
        }
      }

      const parsedKey = JSON.parse(rawKey);

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
    // Không có private key -> Chuyển sang chế độ Fallback an toàn (không crash serverless lambda)
    // Dữ liệu sản phẩm và kho sẽ phục vụ từ seed catalog
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
