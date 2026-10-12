import { NextRequest } from "next/server";
import { OrderController } from "@/be";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  return OrderController.handleGetOrders();
}
