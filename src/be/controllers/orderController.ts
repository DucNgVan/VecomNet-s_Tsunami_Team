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
   * POST /api/orders (Tạo đơn hàng thủ công từ Admin)
   */
  static async handleCreateOrder(req: NextRequest) {
    try {
      const body = await req.json();
      const result = await OrderService.processCheckout(body);
      return NextResponse.json({ success: true, message: "Tạo đơn hàng thành công", data: result.order });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }

  /**
   * PATCH /api/orders/[id] hoặc PUT /api/orders/[id]
   */
  static async handleUpdateStatus(orderId: string, req: NextRequest) {
    try {
      const body = await req.json();
      const { fulfillmentStatus, paymentStatus } = body;
      await OrderService.updateOrderStatus(orderId, fulfillmentStatus, paymentStatus);
      return NextResponse.json({ success: true, message: "Cập nhật trạng thái thành công" });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }

  /**
   * DELETE /api/orders/[id]
   */
  static async handleDeleteOrder(orderId: string) {
    try {
      await OrderService.deleteOrder(orderId);
      return NextResponse.json({ success: true, message: "Xóa đơn hàng thành công" });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }
}
