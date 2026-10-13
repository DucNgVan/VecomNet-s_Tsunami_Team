import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { ProductController } = await import("@/be");
    return await ProductController.handleGetProducts(req);
  } catch (error: any) {
    console.error("[API Products GET Error]:", error);
    return NextResponse.json(
      {
        success: true,
        count: 0,
        data: [],
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ProductController } = await import("@/be");
    return await ProductController.handleCreateProduct(req);
  } catch (error: any) {
    console.error("[API Products POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi tạo sản phẩm" },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
