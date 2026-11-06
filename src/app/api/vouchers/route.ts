import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_VOUCHERS } from "@/lib/voucherStorage";
import { Voucher } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/vouchers
 * Lấy danh sách voucher (có thể lọc publicOnly cho giao diện khách)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get("publicOnly") === "true";

    let vouchers: Voucher[] = DEFAULT_VOUCHERS;

    // Cố gắng đọc từ Firebase Firestore (nếu có config)
    try {
      const { adminDb } = await import("@/be/config/firebaseAdmin");
      if (adminDb) {
        const snap = await adminDb.collection("vouchers").get();
        if (!snap.empty) {
          const list: Voucher[] = [];
          snap.forEach((doc) => {
            list.push({ ...(doc.data() as Voucher), id: doc.id });
          });
          if (list.length > 0) {
            vouchers = list;
          }
        }
      }
    } catch (fsErr) {
      // Fallback to default vouchers
    }

    if (publicOnly) {
      vouchers = vouchers.filter((v) => v.isActive && v.isPublic);
    }

    return NextResponse.json({
      success: true,
      count: vouchers.length,
      data: vouchers,
    });
  } catch (error: any) {
    console.error("[API Vouchers GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi lấy danh sách voucher" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vouchers
 * Tạo hoặc cập nhật voucher từ Admin
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      title,
      description = "",
      discountType = "percentage",
      discountValue = 0,
      maxDiscountAmount,
      minOrderValue,
      minQuantity,
      applicableTarget = "all",
      customerTarget = "all",
      usageLimit,
      startDate,
      endDate,
      isActive = true,
      isPublic = true,
    } = body;

    if (!code || !title) {
      return NextResponse.json(
        { success: false, error: "Mã voucher và tên voucher là bắt buộc!" },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();
    const id = body.id || `vch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const voucherDoc: Voucher = {
      id,
      code: cleanCode,
      title: String(title).trim(),
      description: String(description).trim(),
      discountType,
      discountValue: Number(discountValue) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
      minQuantity: minQuantity ? Number(minQuantity) : undefined,
      applicableTarget,
      customerTarget,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      usedCount: Number(body.usedCount) || 0,
      startDate: startDate || "",
      endDate: endDate || "",
      isActive: Boolean(isActive),
      isPublic: Boolean(isPublic),
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    // Lưu vào Firestore nếu có
    try {
      const { adminDb } = await import("@/be/config/firebaseAdmin");
      if (adminDb) {
        await adminDb.collection("vouchers").doc(id).set(voucherDoc, { merge: true });
      }
    } catch (fsErr) {
      console.warn("Firestore save voucher notice:", fsErr);
    }

    return NextResponse.json({
      success: true,
      message: "Lưu voucher thành công",
      data: voucherDoc,
    });
  } catch (error: any) {
    console.error("[API Vouchers POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi tạo voucher" },
      { status: 500 }
    );
  }
}
