import { adminDb } from "../config/firebaseAdmin";
import { BackendProduct } from "../models";

const COLLECTION_NAME = "products";

// Bộ nhớ đệm sản phẩm trong RAM
const memoryProductStore = new Map<string, BackendProduct>();

export class ProductRepository {
  /**
   * Dữ liệu dự phòng tĩnh khi DB chưa kết nối
   */
  static getFallbackProducts(): BackendProduct[] {
    return Array.from(memoryProductStore.values());
  }

  /**
   * Lấy toàn bộ danh sách sản phẩm từ Firestore
   */
  static async getAll(): Promise<BackendProduct[]> {
    if (!adminDb) {
      return Array.from(memoryProductStore.values());
    }

    try {
      const snapshot = await adminDb.collection(COLLECTION_NAME).get();
      if (!snapshot || snapshot.empty) {
        return [];
      }

      const products = snapshot.docs.map((doc) => doc.data() as BackendProduct);
      // Đồng bộ vào memory store
      memoryProductStore.clear();
      for (const p of products) {
        memoryProductStore.set(p.id, p);
      }
      return products;
    } catch (error) {
      console.warn("[ProductRepo] Firestore query notice:", error);
      return Array.from(memoryProductStore.values());
    }
  }

  /**
   * Lấy chi tiết 1 sản phẩm theo ID
   */
  static async getById(id: string): Promise<BackendProduct | null> {
    if (memoryProductStore.has(id)) {
      return memoryProductStore.get(id)!;
    }

    if (!adminDb) {
      return null;
    }

    try {
      const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
      if (!doc.exists) {
        return null;
      }
      const data = doc.data() as BackendProduct;
      memoryProductStore.set(data.id, data);
      return data;
    } catch (error) {
      console.warn("[ProductRepo] getById error:", error);
      return null;
    }
  }

  /**
   * Thêm sản phẩm mới vào hệ thống
   */
  static async create(productData: Partial<BackendProduct>): Promise<BackendProduct> {
    const id = productData.id || `product-${Date.now()}`;
    const stockCount = Number(productData.stockCount) >= 0 ? Number(productData.stockCount) : 50;
    const newProduct: BackendProduct = {
      id,
      name: productData.name || "Sản phẩm NÉT mới",
      category: productData.category || "tote",
      basePrice: Number(productData.basePrice) || 1250000,
      description: productData.description || "Thiết kế đan thủ công từ lưới ma tái sinh",
      plasticOffsetKg: Number(productData.plasticOffsetKg) || 1.8,
      coralProtectedSqM: Number(((productData.plasticOffsetKg || 1.8) * 1.5).toFixed(1)),
      co2AvoidedKg: Number(((productData.plasticOffsetKg || 1.8) * 1.9).toFixed(1)),
      imageUrl: productData.imageUrl || "/assets/products/tote-blue.png",
      model3dUrl: productData.model3dUrl || "/models/net-tote.glb",
      defaultColor: productData.defaultColor || "ocean-abyss",
      availableColors: productData.availableColors || [],
      inStock: stockCount > 0 && productData.inStock !== false,
      stockCount,
      isActive: productData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryProductStore.set(id, newProduct);

    if (adminDb) {
      try {
        await adminDb.collection(COLLECTION_NAME).doc(id).set(newProduct);
      } catch (err) {
        console.warn("[ProductRepo] Firestore create error:", err);
      }
    }

    return newProduct;
  }

  /**
   * Cập nhật thông tin sản phẩm (giá tiền, số lượng tồn kho, mô tả)
   */
  static async update(id: string, updates: Partial<BackendProduct>): Promise<BackendProduct | null> {
    const current = await this.getById(id);
    if (!current) return null;

    const nextStockCount =
      updates.stockCount !== undefined ? Number(updates.stockCount) : current.stockCount;
    const nextInStock =
      updates.inStock !== undefined
        ? updates.inStock && nextStockCount > 0
        : nextStockCount > 0;

    const updated: BackendProduct = {
      ...current,
      ...updates,
      stockCount: nextStockCount,
      inStock: nextInStock,
      updatedAt: new Date().toISOString(),
    };

    memoryProductStore.set(id, updated);

    if (adminDb) {
      try {
        await adminDb.collection(COLLECTION_NAME).doc(id).set(updated, { merge: true });
      } catch (err) {
        console.warn("[ProductRepo] Firestore update error:", err);
      }
    }

    return updated;
  }

  /**
   * Trừ số lượng tồn kho sản phẩm khi khách đặt hàng
   */
  static async deductStock(
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; newStock: number; error?: string }> {
    const all = await this.getAll();
    const product = all.find(
      (p) =>
        p.id === productId ||
        p.name.toLowerCase() === productId.toLowerCase() ||
        productId.toLowerCase().includes(p.name.toLowerCase())
    );

    if (!product) {
      return { success: false, newStock: 0, error: "Không tìm thấy sản phẩm trong kho!" };
    }

    if (product.stockCount < quantity) {
      return {
        success: false,
        newStock: product.stockCount,
        error: `Sản phẩm "${product.name}" chỉ còn ${product.stockCount} chiếc trong kho, không đủ số lượng (${quantity})!`,
      };
    }

    const newStock = Math.max(0, product.stockCount - quantity);
    await this.update(product.id, {
      stockCount: newStock,
      inStock: newStock > 0,
    });

    return {
      success: true,
      newStock,
    };
  }

  /**
   * Xóa sản phẩm khỏi database
   */
  static async delete(id: string): Promise<boolean> {
    memoryProductStore.delete(id);
    if (adminDb) {
      try {
        await adminDb.collection(COLLECTION_NAME).doc(id).delete();
      } catch (err) {
        console.warn("[ProductRepo] Firestore delete error:", err);
      }
    }
    return true;
  }
}
