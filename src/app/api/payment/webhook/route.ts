import { NextRequest } from "next/server";
import { PaymentController } from "@/be";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return PaymentController.handleWebhook(req);
}
