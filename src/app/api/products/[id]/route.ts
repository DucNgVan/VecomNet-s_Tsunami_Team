import { NextRequest } from "next/server";
import { ProductController } from "@/be";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";

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
  if (!verifyAdminAuth(req)) {
    return unauthorizedResponse("Yêu cầu quyền Quản trị viên để cập nhật sản phẩm.");
  }
  return ProductController.handleUpdateProduct(params.id, req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminAuth(req)) {
    return unauthorizedResponse("Yêu cầu quyền Quản trị viên để xóa sản phẩm.");
  }
  return ProductController.handleDeleteProduct(params.id);
}
