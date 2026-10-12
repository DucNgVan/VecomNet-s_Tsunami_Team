import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { OrderController } = await import("@/be");
    return await OrderController.handleUpdateStatus(params.id, req);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi cập nhật trạng thái đơn hàng" },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { OrderController } = await import("@/be");
    return await OrderController.handleUpdateStatus(params.id, req);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi cập nhật trạng thái đơn hàng" },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { OrderController } = await import("@/be");
    return await OrderController.handleDeleteOrder(params.id);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi xóa đơn hàng" },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
