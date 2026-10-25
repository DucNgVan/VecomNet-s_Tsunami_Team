import { NextRequest, NextResponse } from "next/server";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as "products" | "avatars" | "articles" | "models") || "products";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy file tải lên" },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // Giới hạn tối đa 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Dung lượng file vượt quá giới hạn cho phép (Tối đa 10MB)." },
        { status: 400 }
      );
    }

    const is3dModel =
      file.name.toLowerCase().endsWith(".glb") ||
      file.name.toLowerCase().endsWith(".gltf") ||
      file.type === "model/gltf-binary" ||
      folder === "models";

    if (!file.type.startsWith("image/") && !is3dModel) {
      return NextResponse.json(
        { success: false, error: "Chỉ hỗ trợ file hình ảnh (PNG, JPG, WebP) hoặc mô hình 3D (.glb, .gltf)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Thử tải lên Cloudinary
    const cldResult = await uploadImageToCloudinary(buffer, folder, file.name);
    if (cldResult.success && cldResult.url) {
      return NextResponse.json({
        success: true,
        url: cldResult.url,
        publicId: cldResult.publicId,
        provider: "cloudinary",
        format: cldResult.format,
        width: cldResult.width,
        height: cldResult.height,
      });
    }

    // 2. Fallback lưu vào thư mục public/assets/uploads nếu chưa điền CLOUDINARY_API_KEY
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    try {
      const uploadDir = path.join(process.cwd(), "public", "assets", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilename = `${timestamp}_${cleanName}`;
      const localFilePath = path.join(uploadDir, localFilename);
      fs.writeFileSync(localFilePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/assets/uploads/${localFilename}`,
        provider: "local-fallback",
        warning:
          cldResult.error ||
          "Chưa cấu hình CLOUDINARY_API_KEY / SECRET, đã lưu tạm vào máy chủ cục bộ.",
      });
    } catch (fsErr: any) {
      console.warn("[Cloudinary API Fallback Error]:", fsErr);
    }

    // 3. Fallback an toàn ảnh Base64 nếu file nhỏ dưới 400KB
    if (buffer.length <= 400 * 1024) {
      return NextResponse.json({
        success: true,
        url: `data:${file.type};base64,${buffer.toString("base64")}`,
        provider: "base64",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          cldResult.error ||
          "Không thể upload hình ảnh lên Cloudinary. Vui lòng kiểm tra CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("[API Upload Cloudinary Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi xử lý tải ảnh" },
      { status: 500 }
    );
  }
}
