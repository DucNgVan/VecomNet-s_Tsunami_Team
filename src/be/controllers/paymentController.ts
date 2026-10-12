import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "../services/paymentService";

export class PaymentController {
  /**
   * POST /api/payment/webhook
   */
  static async handleWebhook(req: NextRequest) {
    try {
      const body = await req.json();
      const result = await PaymentService.processWebhook(body);
      return NextResponse.json(result);
    } catch (error: any) {
      console.error("[PaymentController] Webhook error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}
