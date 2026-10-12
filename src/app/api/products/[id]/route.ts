import { NextRequest } from "next/server";
import { ProductController } from "@/be";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return ProductController.handleGetProductById(params.id);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return ProductController.handleUpdateProduct(params.id, req);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return ProductController.handleDeleteProduct(params.id);
}
