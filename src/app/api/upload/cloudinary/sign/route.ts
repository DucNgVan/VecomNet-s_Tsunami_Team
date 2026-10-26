import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const folder = body.folder || "products";
    const cloudName = (
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      "yiowz9tn"
    ).trim();
    const apiKey = (
      process.env.CLOUDINARY_API_KEY || "735861348376536"
    ).trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET
      ? process.env.CLOUDINARY_API_SECRET.trim()
      : undefined;

    if (!apiSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "CLOUDINARY_API_SECRET chưa được cấu hình trên máy chủ",
        },
        { status: 400 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folderPath = `vecomnets/${folder}`;

    // Tạo chữ ký Cloudinary an toàn cho client tải trực tiếp lên Cloudinary CDN
    const paramsToSign = {
      folder: folderPath,
      timestamp: timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder: folderPath,
    });
  } catch (err: any) {
    console.error("[Cloudinary Sign Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Lỗi tạo chữ ký Cloudinary" },
      { status: 500 }
    );
  }
}
