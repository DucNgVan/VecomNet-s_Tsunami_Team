import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "../services/orderService";

export class OrderController {
  /**
   * POST /api/orders/checkout
   */
  static async handleCheckout(req: NextRequest) {
    try {
      const body = await req.json();
      const result = await OrderService.processCheckout(body);
      return NextResponse.json({
        success: true,
        message: "Đặt hàng thành công",
        order: result.order,
        vietQr: result.vietQr,
        emailDispatched: result.emailDispatched,
      });
    } catch (error: any) {
      console.error("[OrderController] Checkout error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }

  /**
   * GET /api/orders
   */
  static async handleGetOrders() {
    try {
      const orders = await OrderService.getOrders();
      return NextResponse.json({ success: true, count: orders.length, data: orders });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  /**
   * PATCH /api/orders/[id]
   */
  static async handleUpdateStatus(orderId: string, req: NextRequest) {
    try {
      const body = await req.json();
      const { fulfillmentStatus } = body;
      await OrderService.updateOrderStatus(orderId, fulfillmentStatus);
      return NextResponse.json({ success: true, message: "Cập nhật trạng thái thành công" });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }
}
