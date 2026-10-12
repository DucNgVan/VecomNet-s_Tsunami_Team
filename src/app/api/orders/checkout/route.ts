import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { OrderController } = await import("@/be");
    return await OrderController.handleCheckout(req);
  } catch (error: any) {
    console.error("[API Orders Checkout Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Lỗi xử lý đặt hàng trên máy chủ",
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
