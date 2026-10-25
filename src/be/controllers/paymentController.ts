import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "../services/paymentService";

export class PaymentController {
  /**
   * POST /api/payment/webhook
   */
  static async handleWebhook(req: NextRequest) {
    try {
      const webhookSecret =
        process.env.PAYMENT_WEBHOOK_SECRET || process.env.PAYOS_CHECKSUM_KEY;
      const signature =
        req.headers.get("x-signature") ||
        req.headers.get("secure-token") ||
        req.headers.get("x-webhook-secret");

      const body = await req.json();

      // Nếu có cài đặt bí mật webhook trên server, bắt buộc kiểm tra chữ ký
      if (webhookSecret) {
        const bodySignature = body?.signature || signature;
        const isValid = PaymentService.verifySignature(
          body,
          bodySignature,
          webhookSecret
        );
        if (!isValid) {
          console.warn("[PaymentController] Từ chối webhook do chữ ký không hợp lệ!");
          return NextResponse.json(
            { success: false, error: "Chữ ký webhook không hợp lệ (Invalid Signature)" },
            { status: 401 }
          );
        }
      }

      const result = await PaymentService.processWebhook(body);
      return NextResponse.json(result);
    } catch (error: any) {
      console.error("[PaymentController] Webhook error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}
