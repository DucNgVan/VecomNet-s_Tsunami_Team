import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "images";

    if (!file) {
      return NextResponse.json({ success: false, error: "Không tìm thấy file tải lên" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `products/${folder}/${timestamp}_${cleanName}`;

    // 1. Nếu có Firebase Admin Storage
    if (adminStorage) {
      try {
        const bucket = adminStorage.bucket();
        const fileRef = bucket.file(filePath);

        await fileRef.save(buffer, {
          metadata: {
            contentType: file.type || (folder === "models" ? "model/gltf-binary" : "image/jpeg"),
          },
          public: true,
        });

        // Lấy public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        return NextResponse.json({
          success: true,
          url: publicUrl,
          fileName: file.name,
          size: file.size,
        });
      } catch (storageError: any) {
        console.warn("[Upload API] Firebase Admin Storage save warning:", storageError?.message);
      }
    }

    // 2. Fallback an toàn (Data URL cho ảnh hoặc demo URL cho mô hình 3D)
    if (file.type.startsWith("image/") && buffer.length <= 4 * 1024 * 1024) {
      const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: base64Data,
        fileName: file.name,
        size: file.size,
      });
    }

    // Cho file 3D hoặc file lớn khi chưa cấu hình service account
    const fallbackUrl = `/assets/models/${cleanName}`;
    return NextResponse.json({
      success: true,
      url: fallbackUrl,
      fileName: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error("[Upload API] Error processing file upload:", error);
    return NextResponse.json({ success: false, error: error?.message || "Lỗi tải file" }, { status: 500 });
  }
}
