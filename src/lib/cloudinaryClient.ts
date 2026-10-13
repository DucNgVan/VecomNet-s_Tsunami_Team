/**
 * Client Helper: Tải ảnh trực tiếp lên Cloudinary thông qua Server API Route
 */
export async function uploadToCloudinary(
  file: File,
  folder: "products" | "avatars" | "articles" = "products",
  onProgress?: (progressPercent: number) => void
): Promise<{ url: string; publicId?: string }> {
  const maxSizeBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxSizeBytes) {
    throw new Error("Kích thước file ảnh vượt quá 15MB. Vui lòng chọn ảnh nhẹ hơn.");
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
