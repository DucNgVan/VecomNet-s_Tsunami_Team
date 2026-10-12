import { ProductRepository } from "../database/productRepo";
import { BackendProduct } from "../models";

export class ProductService {
  /**
   * Danh mục dự phòng tĩnh
   */
  static getFallbackProducts(): BackendProduct[] {
    return ProductRepository.getFallbackProducts();
  }

  /**
   * Lấy danh sách sản phẩm hiển thị trên Shop
   */
  static async getActiveProducts(): Promise<BackendProduct[]> {
    const all = await ProductRepository.getAll();
    return all.filter((p) => p.isActive);
  }

  /**
   * Lấy toàn bộ sản phẩm cho Quản trị viên Admin
   */
  static async getAllProductsForAdmin(): Promise<BackendProduct[]> {
    return ProductRepository.getAll();
  }

  /**
   * Chi tiết sản phẩm
   */
  static async getProductDetails(id: string): Promise<BackendProduct | null> {
    return ProductRepository.getById(id);
  }

  /**
   * Tạo sản phẩm mới
   */
  static async createProduct(payload: Partial<BackendProduct>): Promise<BackendProduct> {
    if (!payload.name || !payload.basePrice) {
      throw new Error("Tên sản phẩm và giá bán là bắt buộc!");
    }
    return ProductRepository.create(payload);
  }

  /**
   * Cập nhật thông tin sản phẩm
   */
  static async updateProduct(id: string, updates: Partial<BackendProduct>): Promise<BackendProduct> {
    const updated = await ProductRepository.update(id, updates);
    if (!updated) {
      throw new Error(`Không tìm thấy sản phẩm với ID: ${id}`);
    }
    return updated;
  }

  /**
   * Xóa sản phẩm
   */
  static async deleteProduct(id: string): Promise<boolean> {
    return ProductRepository.delete(id);
  }
}
