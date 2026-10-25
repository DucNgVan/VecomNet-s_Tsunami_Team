import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return unauthorizedResponse("Yêu cầu quyền Quản trị viên để truy xuất danh sách đơn hàng.");
    }

    const { OrderController } = await import("@/be");
    return await OrderController.handleGetOrders();
  } catch (error: any) {
    console.error("[API Orders GET Error]:", error);
    return NextResponse.json(
      { success: true, count: 0, data: [], fallback: true },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { OrderController } = await import("@/be");
    return await OrderController.handleCreateOrder(req);
  } catch (error: any) {
    console.error("[API Orders POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi tạo đơn hàng" },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
