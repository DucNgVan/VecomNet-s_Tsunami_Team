import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_VOUCHERS, validateAndCalculateVoucher } from "@/lib/voucherStorage";
import { Voucher } from "@/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/vouchers/validate
 * Kiểm tra tính hợp lệ và tính mức giảm giá
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, items = [], subtotal = 0, shippingFee = 0, customerEmail, customerPhone, userId, isNewCustomer } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp mã voucher!" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    let voucher: Voucher | undefined = DEFAULT_VOUCHERS.find((v) => v.code.toUpperCase() === cleanCode);

    // Cố gắng tìm trong Firestore
    try {
      const { adminDb } = await import("@/be/config/firebaseAdmin");
      if (adminDb) {
        const snap = await adminDb.collection("vouchers").where("code", "==", cleanCode).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          voucher = { ...(doc.data() as Voucher), id: doc.id };
        }
      }
    } catch (fsErr) {
      // Use in-memory default
    }

    if (!voucher) {
      return NextResponse.json(
        {
          success: false,
          error: `Mã giảm giá "${cleanCode}" không tồn tại hoặc đã hết hạn!`,
        },
        { status: 404 }
      );
    }

    // Kiểm tra xem khách hàng có đơn hàng nào trước đây hay không (nếu là voucher new_customer)
    let evaluatedIsNewCustomer = isNewCustomer;
    if (voucher.customerTarget === "new_customer" && evaluatedIsNewCustomer === undefined) {
      try {
        const { adminDb } = await import("@/be/config/firebaseAdmin");
        if (adminDb) {
          if (userId && userId !== "guest") {
            const userOrdersSnap = await adminDb.collection("orders").where("userId", "==", userId).limit(1).get();
            if (!userOrdersSnap.empty) evaluatedIsNewCustomer = false;
          }
          if (evaluatedIsNewCustomer !== false && customerEmail) {
            const emailSnap = await adminDb.collection("orders").where("customer.email", "==", customerEmail.trim().toLowerCase()).limit(1).get();
            if (!emailSnap.empty) evaluatedIsNewCustomer = false;
          }
          if (evaluatedIsNewCustomer !== false && customerPhone) {
            const cleanPhone = customerPhone.trim().replace(/\D/g, "");
            const phoneSnap = await adminDb.collection("orders").where("customer.phone", "==", cleanPhone).limit(1).get();
            if (!phoneSnap.empty) evaluatedIsNewCustomer = false;
          }
        }
      } catch (e) {
        // Fallback
      }
    }

    const result = validateAndCalculateVoucher(voucher, {
      items,
      subtotal,
      shippingFee,
      isNewCustomer: evaluatedIsNewCustomer,
      customerEmail,
      customerPhone,
      userId,
    });

    if (!result.eligible) {
      return NextResponse.json({
        success: false,
        eligible: false,
        error: result.reason || "Voucher không đủ điều kiện áp dụng cho đơn hàng này.",
        voucher: {
          code: voucher.code,
          title: voucher.title,
          description: voucher.description,
        },
      });
    }

    return NextResponse.json({
      success: true,
      eligible: true,
      discountAmount: result.discountAmount,
      isFreeShipping: result.isFreeShipping,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        title: voucher.title,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
      },
    });
  } catch (error: any) {
    console.error("[API Vouchers Validate Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi kiểm tra mã giảm giá" },
      { status: 500 }
    );
  }
}
