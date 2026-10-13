/**
 * Client Helper: Tải ảnh hoặc mô hình 3D trực tiếp lên Cloudinary thông qua Server API Route
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

  const maxSizeBytes = isModel ? 50 * 1024 * 1024 : 15 * 1024 * 1024; // 50MB cho 3D, 15MB cho ảnh
  if (file.size > maxSizeBytes) {
    throw new Error(
      `Kích thước file vượt quá ${isModel ? "50MB" : "15MB"}. Vui lòng chọn file nhẹ hơn.`
    );
  }

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
    throw new Error(data.error || "Lỗi tải ảnh lên Cloudinary");
  }

  if (onProgress) onProgress(100);

  return {
    url: data.url,
    publicId: data.publicId,
  };
}
