import { NextRequest } from "next/server";
import { PassportController } from "@/be";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return PassportController.handleClaimWarranty(req);
}
