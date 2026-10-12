import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { generateOrderCode } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer,
      items,
      totalAmount,
      paymentMethod = "cod",
      assignedBatchId = "NET-VN-DN-2024-082",
      totalPlasticOffsetKg = 2.14,
      userId,
    } = body;

    const orderCode = generateOrderCode();
    const orderId = `ord-${Date.now()}`;

    const orderData = {
      orderId,
      orderCode,
      customer: customer || {
        fullName: "Khách hàng NÉT",
        phone: "0905000000",
        email: "eco@net.vn",
        address: "Đà Nẵng",
      },
      items: items || [],
      totalAmount: Number(totalAmount) || 1640000,
      paymentMethod,
      paymentStatus: paymentMethod === "vnpay" ? "pending" : "unpaid",
      fulfillmentStatus: "crafting",
      assignedBatchId,
      totalPlasticOffsetKg: Number(totalPlasticOffsetKg) || 2.14,
      createdAt: FieldValue.serverTimestamp(),
    };

    if (adminDb) {
      // 1. Save order into 'orders' collection
      await adminDb.collection("orders").doc(orderId).set(orderData);

      // 2. If user is logged in, update their eco metrics & add order to profile
      if (userId) {
        const userRef = adminDb.collection("users").doc(userId);
        await userRef.set(
          {
            ecoImpactKg: FieldValue.increment(Number(totalPlasticOffsetKg)),
            coralProtectedSqM: FieldValue.increment(3.2),
            totalOrdersCount: FieldValue.increment(1),
            lastOrderCode: orderCode,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tạo đơn hàng thành công",
      order: orderData,
    });
  } catch (error: any) {
    console.error("API /api/orders/checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi máy chủ khi tạo đơn hàng" },
      { status: 500 }
    );
  }
}
