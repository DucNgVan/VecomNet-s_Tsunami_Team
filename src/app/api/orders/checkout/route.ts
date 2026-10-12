import { NextRequest } from "next/server";
import { OrderController } from "@/be";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return OrderController.handleCheckout(req);
}
