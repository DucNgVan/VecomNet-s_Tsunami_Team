import { adminDb } from "../config/firebaseAdmin";
import { BackendProduct } from "../models";
import { BAG_BASES, BAG_COLORS } from "@/data/products";

const COLLECTION_NAME = "products";

// Bộ nhớ đệm sản phẩm trong RAM (đảm bảo đồng bộ ngay cả khi chưa kết nối Firestore)
const memoryProductStore = new Map<string, BackendProduct>();

// Chuyển đổi dữ liệu catalogue ban đầu thành sản phẩm Backend
function seedInitialProducts(): BackendProduct[] {
  if (memoryProductStore.size > 0) {
    return Array.from(memoryProductStore.values());
  }

  const initial = BAG_BASES.map((b) => ({
    id: b.id,
    name: b.name,
    category: b.id.includes("tote")
      ? ("tote" as const)
      : b.id.includes("bucket")
      ? ("bucket" as const)
      : b.id.includes("clutch")
      ? ("clutch" as const)
      : ("crossbody" as const),
    basePrice: b.basePrice,
    description: b.description,
    plasticOffsetKg: b.plasticOffsetKg,
    coralProtectedSqM: Number((b.plasticOffsetKg * 1.5).toFixed(1)),
    co2AvoidedKg: Number((b.plasticOffsetKg * 1.9).toFixed(1)),
    imageUrl: b.thumbnail,
    model3dUrl: b.modelPath,
    defaultColor: b.defaultColorId,
    availableColors: BAG_COLORS.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      story: c.story,
    })),
    inStock: true,
    stockCount: 50, // Mặc định 50 sản phẩm trong kho
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  for (const p of initial) {
    memoryProductStore.set(p.id, p);
  }

  return initial;
}

export class ProductRepository {
  /**
   * Dữ liệu dự phòng tĩnh khi DB chưa kết nối
   */
  static getFallbackProducts(): BackendProduct[] {
    return seedInitialProducts();
  }

  /**
   * Lấy toàn bộ danh sách sản phẩm (nếu Firestore trống thì tự động nạp danh mục gốc)
   */
  static async getAll(): Promise<BackendProduct[]> {
    if (!adminDb) {
      return seedInitialProducts();
    }

    try {
      const snapshot = await adminDb.collection(COLLECTION_NAME).get();
      if (!snapshot || snapshot.empty) {
        // Tự động seed sản phẩm vào Firestore nếu chưa có
        const initialProducts = seedInitialProducts();
        for (const p of initialProducts) {
          await adminDb.collection(COLLECTION_NAME).doc(p.id).set(p);
        }
        return initialProducts;
      }

      const products = snapshot.docs.map((doc) => doc.data() as BackendProduct);
      // Đồng bộ vào memory store
      for (const p of products) {
        memoryProductStore.set(p.id, p);
      }
      return products;
    } catch (error) {
      console.warn("[ProductRepo] Firestore query failed, falling back to seed catalog:", error);
      return seedInitialProducts();
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
      const list = seedInitialProducts();
      return list.find((p) => p.id === id) || null;
    }

    try {
      const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
      if (!doc.exists) {
        const list = seedInitialProducts();
        return list.find((p) => p.id === id) || null;
      }
      const data = doc.data() as BackendProduct;
      memoryProductStore.set(data.id, data);
      return data;
    } catch (error) {
      console.warn("[ProductRepo] getById error:", error);
      const list = seedInitialProducts();
      return list.find((p) => p.id === id) || null;
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
