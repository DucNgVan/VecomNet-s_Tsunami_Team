import { NextRequest } from "next/server";
import { OrderController } from "@/be";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return OrderController.handleUpdateStatus(params.id, req);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return OrderController.handleUpdateStatus(params.id, req);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return OrderController.handleDeleteOrder(params.id);
}
