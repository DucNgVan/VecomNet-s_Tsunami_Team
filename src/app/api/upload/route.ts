import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebaseAdmin";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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
        const downloadToken = crypto.randomUUID();

        await fileRef.save(buffer, {
          metadata: {
            contentType: file.type || (folder === "models" ? "model/gltf-binary" : "application/octet-stream"),
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
        });

        // Lấy Firebase Storage URL kèm download token bảo mật
        const bucketName = bucket.name || "netsvecomnet.firebasestorage.app";
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;
        
        return NextResponse.json({
          success: true,
          url: publicUrl,
          fileName: file.name,
          size: file.size,
          storage: "firebase-admin",
        });
      } catch (storageError: any) {
        console.warn("[Upload API] Firebase Admin Storage save warning:", storageError?.message);
      }
    }

    // 2. Lưu trực tiếp vào thư mục public/assets/uploads nếu chạy môi trường Node.js / Local dev
    try {
      const uploadDir = path.join(process.cwd(), "public", "assets", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilename = `${timestamp}_${cleanName}`;
      const localFilePath = path.join(uploadDir, localFilename);
      fs.writeFileSync(localFilePath, buffer);

      const fileUrl = `/assets/uploads/${localFilename}`;
      return NextResponse.json({
        success: true,
        url: fileUrl,
        fileName: file.name,
        size: file.size,
        storage: "local-disk",
      });
    } catch (fsWriteError: any) {
      console.warn("[Upload API] Local filesystem save notice:", fsWriteError?.message);
    }

    // 3. Fallback cho ảnh nhỏ dạng Data URL (chỉ áp dụng nếu dung lượng dưới 400KB để không làm tràn 1MB document của Firestore)
    if (file.type.startsWith("image/") && buffer.length <= 400 * 1024) {
      const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: base64Data,
        fileName: file.name,
        size: file.size,
        storage: "base64",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Không thể lưu file. Vui lòng kiểm tra quyền thư mục hoặc cấu hình Firebase Service Account.",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("[Upload API] Error processing file upload:", error);
    return NextResponse.json({ success: false, error: error?.message || "Lỗi tải file" }, { status: 500 });
  }
}

