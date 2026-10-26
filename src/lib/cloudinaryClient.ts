/**
 * Client Helper: Tải ảnh hoặc mô hình 3D trực tiếp lên CLOUDINARY
 * - Hỗ trợ dung lượng mô hình 3D (.glb, .gltf) lên đến 100MB
 * - Tải trực tiếp lên Cloudinary CDN bằng Signed Direct Upload:
 *   + Bypass hoàn toàn giới hạn 4.5MB của Vercel Serverless Function
 *   + Hiển thị tiến trình % chính xác (0% -> 100%) theo thời gian thực
 *   + Lưu trữ 100% trên Cloudinary theo đúng cấu hình tài khoản của bạn (yiowz9tn)
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

  if (onProgress) onProgress(5);

  // 1. Thử lấy chữ ký để tải trực tiếp lên Cloudinary CDN từ trình duyệt (Direct Signed Upload)
  try {
    const signRes = await fetch("/api/upload/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: isModel ? "models" : folder }),
    });

    if (signRes.ok) {
      const signData = await signRes.json();
      if (signData.success && signData.signature) {
        // Tải trực tiếp lên Cloudinary API bằng XMLHttpRequest để có tiến độ % mượt mà
        return await new Promise<{ url: string; publicId?: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`;

          xhr.open("POST", uploadUrl);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
              const pct = Math.round((e.loaded / e.total) * 100);
              onProgress(Math.min(99, Math.max(5, pct)));
            }
          };

          xhr.onload = () => {
            try {
              const resData = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300 && resData.secure_url) {
                if (onProgress) onProgress(100);
                resolve({
                  url: resData.secure_url,
                  publicId: resData.public_id,
                });
              } else {
                const errMsg = resData.error?.message || `Lỗi Cloudinary: HTTP ${xhr.status}`;
                console.warn("[Cloudinary Direct Upload Failed]:", errMsg);
                reject(new Error(errMsg));
              }
            } catch (parseErr: any) {
              reject(new Error("Lỗi đọc kết quả từ Cloudinary: " + parseErr.message));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Lỗi mạng khi tải trực tiếp lên Cloudinary"));
          };

          const directFormData = new FormData();
          directFormData.append("file", file);
          directFormData.append("api_key", signData.apiKey);
          directFormData.append("timestamp", signData.timestamp.toString());
          directFormData.append("signature", signData.signature);
          directFormData.append("folder", signData.folder);

          xhr.send(directFormData);
        });
      }
    }
  } catch (directErr: any) {
    console.warn(
      "[uploadToCloudinary] Direct signed upload notice, falling back to server route:",
      directErr
    );
  }

  // 2. Fallback: Tải qua Server API Route /api/upload/cloudinary (cho file nhỏ hoặc môi trường local)
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
    throw new Error(data.error || "Lỗi tải file lên Cloudinary");
  }

  if (onProgress) onProgress(100);

  return {
    url: data.url,
    publicId: data.publicId,
  };
}
