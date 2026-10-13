import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Tải file (ảnh hoặc mô hình 3D .glb) trực tiếp lên Firebase Storage
 * Thư mục: products/images/... hoặc products/models/...
 */
export async function uploadProductFile(
  file: File,
  folder: "images" | "models",
  onProgress?: UploadProgressCallback
): Promise<string> {
  // 1. Kiểm tra kích thước file
  const maxSizeBytes = folder === "images" ? 15 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File quá lớn! Kích thước tối đa cho ${folder === "images" ? "ảnh" : "mô hình 3D"} là ${
        maxSizeBytes / (1024 * 1024)
      }MB.`
    );
  }

  // Thử xác thực Firebase ẩn danh nếu chưa đăng nhập (để thỏa mãn rule: request.auth != null)
  if (typeof window !== "undefined" && auth && !auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {
      // Bỏ qua nếu project chưa bật Anonymous Authentication
    }
  }

  // 2. Thử tải trực tiếp lên Firebase Storage Client SDK
  try {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `products/${folder}/${timestamp}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    return await new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(pct);
        },
        async (error) => {
          console.warn("[StorageService] Client SDK upload warning, trying server fallback:", error);
          // Thử fallback qua Server API nếu client upload bị lỗi
          try {
            const fallbackUrl = await uploadViaServerApi(file, folder, onProgress);
            resolve(fallbackUrl);
          } catch (serverErr: any) {
            reject(serverErr || error);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });
  } catch (clientError) {
    console.warn("[StorageService] Trying server-side upload fallback...");
    return await uploadViaServerApi(file, folder, onProgress);
  }
}

/**
 * Fallback: Tải file qua API server /api/upload
 */
async function uploadViaServerApi(
  file: File,
  folder: "images" | "models",
  onProgress?: UploadProgressCallback
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  if (onProgress) onProgress(50);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.url) {
    throw new Error(data.error || "Không thể tải file lên máy chủ");
  }

  if (onProgress) onProgress(100);
  return data.url;
}
