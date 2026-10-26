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

    const is3dModel =
      file.name.toLowerCase().endsWith(".glb") ||
      file.name.toLowerCase().endsWith(".gltf") ||
      file.type === "model/gltf-binary" ||
      folder === "models";

    const MAX_FILE_SIZE = is3dModel ? 100 * 1024 * 1024 : 20 * 1024 * 1024; // 100MB cho mô hình 3D, 20MB cho hình ảnh
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Dung lượng file vượt quá giới hạn cho phép (Tối đa ${is3dModel ? "100MB" : "20MB"}).`,
        },
        { status: 400 }
      );
    }

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

    // Nếu Cloudinary thất bại, trả về lỗi trực tiếp để Admin biết cấu hình hoặc kiểm tra credentials
    // Tuyệt đối KHÔNG lưu đường dẫn cục bộ (/assets/uploads) vì trên Vercel file cục bộ sẽ bị lỗi 404
    return NextResponse.json(
      {
        success: false,
        error:
          cldResult.error ||
          "Không thể upload file lên Cloudinary. Vui lòng kiểm tra CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.",
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
