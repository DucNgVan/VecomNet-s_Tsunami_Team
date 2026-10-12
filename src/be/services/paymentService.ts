import { OrderRepository } from "../database/orderRepo";

export class PaymentService {
  /**
   * Xử lý tín hiệu Webhook từ ngân hàng hoặc cổng thanh toán PayOS / SeAPay
   */
  static async processWebhook(payload: any): Promise<{
    success: boolean;
    message: string;
    matchedOrderCode?: string;
  }> {
    const data = payload.data || payload;
    const memo = String(data.description || data.memo || data.content || "").toUpperCase();
    const amount = Number(data.amount) || 0;
    const isSuccess = payload.success !== false && (payload.code === "00" || data.status === "PAID" || Boolean(amount));

    // Tìm mã đơn hàng từ nội dung chuyển khoản, e.g. "NET ORD-8821" -> "NET-ORD-8821"
    const matchedOrderCode = memo.match(/NET[ -]?[A-Z0-9-]+/i)?.[0]?.replace(/\s+/g, "-");

    if (matchedOrderCode && isSuccess) {
      const order = await OrderRepository.getByCode(matchedOrderCode);
      if (order) {
        await OrderRepository.updateStatus(order.orderId, {
          paymentStatus: "paid",
          paidAt: new Date().toISOString(),
        });

        console.log(`[PaymentService] Tự động cập nhật đơn #${matchedOrderCode} sang ĐÃ THANH TOÁN`);
        return {
          success: true,
          message: `Xác thực thanh toán đơn hàng #${matchedOrderCode} thành công`,
          matchedOrderCode,
        };
      }
    }

    return {
      success: true,
      message: "Webhook đã được tiếp nhận",
      matchedOrderCode,
    };
  }
}
