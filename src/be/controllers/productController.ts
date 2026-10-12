import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "../services/productService";

export class ProductController {
  /**
   * GET /api/products
   */
  static async handleGetProducts(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const forAdmin = searchParams.get("admin") === "true";

      const products = forAdmin
        ? await ProductService.getAllProductsForAdmin()
        : await ProductService.getActiveProducts();

      return NextResponse.json({ success: true, count: products.length, data: products });
    } catch (error: any) {
      console.warn("[ProductController] handleGetProducts fallback:", error);
      const fallback = ProductService.getFallbackProducts();
      return NextResponse.json({
        success: true,
        count: fallback.length,
        data: fallback,
        fallback: true,
      });
    }
  }

  /**
   * POST /api/products
   */
  static async handleCreateProduct(req: NextRequest) {
    try {
      const body = await req.json();
      const product = await ProductService.createProduct(body);
      return NextResponse.json({ success: true, message: "Tạo sản phẩm thành công", data: product });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }

  /**
   * GET /api/products/[id]
   */
  static async handleGetProductById(id: string) {
    try {
      const product = await ProductService.getProductDetails(id);
      if (!product) {
        return NextResponse.json({ success: false, error: "Không tìm thấy sản phẩm" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: product });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  /**
   * PUT /api/products/[id]
   */
  static async handleUpdateProduct(id: string, req: NextRequest) {
    try {
      const body = await req.json();
      const updated = await ProductService.updateProduct(id, body);
      return NextResponse.json({ success: true, message: "Cập nhật sản phẩm thành công", data: updated });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }

  /**
   * DELETE /api/products/[id]
   */
  static async handleDeleteProduct(id: string) {
    try {
      await ProductService.deleteProduct(id);
      return NextResponse.json({ success: true, message: "Đã xóa sản phẩm thành công" });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}
