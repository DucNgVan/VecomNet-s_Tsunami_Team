/**
 * Client Helper: Tải ảnh hoặc mô hình 3D trực tiếp lên Cloudinary / Firebase Storage
 * - Hỗ trợ dung lượng mô hình 3D (.glb, .gltf) lên đến 100MB
 * - Tự động tải trực tiếp qua Firebase Storage Client SDK cho file lớn để tránh giới hạn 4.5MB của Vercel Serverless
 */
export async function uploadToCloudinary(
  file: File,
  folder: "products" | "avatars" | "articles" | "models" = "products",
  onProgress?: (progressPercent: number) => void
): Promise<{ url: string; publicId?: string }> {
  const isModel =
    file.name.toLowerCase().endsWith(".glb") ||
    file.name.toLowerCase().endsWith(".gltf") ||
    folder === "models";

  const maxSizeBytes = isModel ? 100 * 1024 * 1024 : 20 * 1024 * 1024; // 100MB cho 3D, 20MB cho ảnh
  if (file.size > maxSizeBytes) {
    throw new Error(
      `Kích thước file vượt quá ${isModel ? "100MB" : "20MB"}. Vui lòng chọn file nhẹ hơn.`
    );
  }

  // 1. Đối với mô hình 3D hoặc file > 4MB:
  // Tải trực tiếp lên Firebase Storage Client SDK để bypass giới hạn 4.5MB của Vercel Serverless Function
  if (isModel || file.size > 4 * 1024 * 1024) {
    try {
      const { uploadProductFile } = await import("@/lib/storageService");
      const firebaseUrl = await uploadProductFile(
        file,
        isModel ? "models" : "images",
        onProgress
      );
      if (firebaseUrl) {
        if (onProgress) onProgress(100);
        return {
          url: firebaseUrl,
          publicId: `fb_${Date.now()}`,
        };
      }
    } catch (fbErr: any) {
      console.warn(
        "[uploadToCloudinary] Direct Firebase Storage upload notice, falling back to server route:",
        fbErr
      );
    }
  }

  // 2. Tải qua Server API Route /api/upload/cloudinary
  if (onProgress) onProgress(30);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  if (onProgress) onProgress(60);

  const res = await fetch("/api/upload/cloudinary", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.url) {
    // Nếu Server route lỗi và chưa tải qua Firebase Storage thành công, thử lại qua Firebase Storage
    try {
      const { uploadProductFile } = await import("@/lib/storageService");
      const fallbackFbUrl = await uploadProductFile(
        file,
        isModel ? "models" : "images",
        onProgress
      );
      if (fallbackFbUrl) {
        if (onProgress) onProgress(100);
        return {
          url: fallbackFbUrl,
          publicId: `fb_${Date.now()}`,
        };
      }
    } catch (secondErr) {
      console.error("[uploadToCloudinary] Secondary Firebase fallback also failed:", secondErr);
    }

    throw new Error(data.error || "Lỗi tải file lên hệ thống lưu trữ");
  }

  if (onProgress) onProgress(100);

  return {
    url: data.url,
    publicId: data.publicId,
  };
}
