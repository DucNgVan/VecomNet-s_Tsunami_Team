import { NextRequest, NextResponse } from "next/server";
import { BAG_BASES } from "@/data/products";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { ProductController } = await import("@/be");
    return await ProductController.handleGetProducts(req);
  } catch (error: any) {
    console.error("[API Products GET Error]:", error);
    // Trả về danh mục phôi túi dự phòng thay vì để Vercel 500 HTML
    return NextResponse.json(
      {
        success: true,
        count: BAG_BASES.length,
        data: BAG_BASES.map((b) => ({
          id: b.id,
          name: b.name,
          basePrice: b.basePrice,
          description: b.description,
          plasticOffsetKg: b.plasticOffsetKg,
          imageUrl: b.image,
          model3dUrl: b.model3dUrl || "/assets/models/tuixach.glb",
          inStock: true,
          stockCount: 50,
          isActive: true,
        })),
        fallback: true,
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
