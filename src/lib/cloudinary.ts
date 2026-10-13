import { v2 as cloudinary } from "cloudinary";

// Cấu hình Cloudinary Server SDK
const cloudName = (
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  "yiowz9tn"
).trim();
const apiKey = process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.trim() : undefined;
const apiSecret = process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.trim() : undefined;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export { cloudinary };

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Upload buffer lên Cloudinary với thư mục tương ứng (hỗ trợ ảnh và mô hình 3D .glb)
 * @param buffer - File nhị phân dạng Buffer
 * @param folder - 'products' | 'avatars' | 'articles' | 'models'
 * @param filename - Tên file gốc để lấy public_id
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: "products" | "avatars" | "articles" | "models" = "products",
  filename?: string
): Promise<CloudinaryUploadResult> {
  // Nếu chưa có API KEY hoặc SECRET trên môi trường server
  if (!apiKey || !apiSecret) {
    console.warn(
      "[Cloudinary] CLOUDINARY_API_KEY hoặc CLOUDINARY_API_SECRET chưa được cấu hình trong .env.local"
    );
    return {
      success: false,
      url: "",
      error: "CLOUDINARY_API_KEY hoặc CLOUDINARY_API_SECRET chưa được cấu hình trong .env.local",
    };
  }

  return new Promise((resolve) => {
    const isModel =
      filename?.toLowerCase().endsWith(".glb") ||
      filename?.toLowerCase().endsWith(".gltf") ||
      folder === "models";

    const cleanName = filename
      ? filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
      : `${isModel ? "model" : "img"}_${Date.now()}`;

    const uploadOptions: any = {
      folder: `vecomnets/${folder}`,
      public_id: `${Date.now()}_${cleanName}`,
      resource_type: isModel ? "auto" : "image",
    };

    // Chỉ áp dụng biến đổi nén/cắt khuôn mặt cho hình ảnh 2D thông thường, KHÔNG áp dụng cho file nhị phân 3D
    if (!isModel) {
      uploadOptions.transformation =
        folder === "avatars"
          ? [
              { width: 400, height: 400, crop: "thumb", gravity: "face" },
              { quality: "auto", fetch_format: "auto" },
            ]
          : [{ quality: "auto", fetch_format: "auto" }];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          console.error("[Cloudinary Upload Error]:", error);
          resolve({
            success: false,
            url: "",
            error: error?.message || "Lỗi upload lên Cloudinary",
          });
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}
