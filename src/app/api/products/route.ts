import { NextRequest } from "next/server";
import { ProductController } from "@/be";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return ProductController.handleGetProducts(req);
}

export async function POST(req: NextRequest) {
  return ProductController.handleCreateProduct(req);
}
