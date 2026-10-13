import { v2 as cloudinary } from "cloudinary";

// Cấu hình Cloudinary Server SDK
const cloudName =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  "netsvecomnet";
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

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
 * Upload buffer lên Cloudinary với thư mục tương ứng
 * @param buffer - File nhị phân dạng Buffer
 * @param folder - 'products' | 'avatars' | 'articles'
 * @param filename - Tên file gốc để lấy public_id
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: "products" | "avatars" | "articles" = "products",
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
    const cleanName = filename
      ? filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
      : `img_${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `vecomnets/${folder}`,
        public_id: `${Date.now()}_${cleanName}`,
        resource_type: "image",
        transformation:
          folder === "avatars"
            ? [
                { width: 400, height: 400, crop: "thumb", gravity: "face" },
                { quality: "auto", fetch_format: "auto" },
              ]
            : [{ quality: "auto", fetch_format: "auto" }],
      },
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
