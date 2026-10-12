import { adminDb } from "../config/firebaseAdmin";
import { BackendProduct } from "../models";
import { BAG_BASES, BAG_COLORS } from "@/data/products";

const COLLECTION_NAME = "products";

// Chuyển đổi dữ liệu catalogue ban đầu thành sản phẩm Backend
function seedInitialProducts(): BackendProduct[] {
  return BAG_BASES.map((b) => ({
    id: b.id,
    name: b.name,
    category: b.id.includes("tote")
      ? "tote"
      : b.id.includes("bucket")
      ? "bucket"
      : b.id.includes("clutch")
      ? "clutch"
      : "crossbody",
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
    stockCount: 45,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export class ProductRepository {
  /**
   * Lấy toàn bộ danh sách sản phẩm (nếu database trống thì tự động nạp danh mục gốc)
   */
  static async getAll(): Promise<BackendProduct[]> {
    if (!adminDb) {
      return seedInitialProducts();
    }

    try {
      const snapshot = await adminDb.collection(COLLECTION_NAME).get();
      if (snapshot.empty) {
        // Tự động seed sản phẩm vào Firestore nếu chưa có
        const initialProducts = seedInitialProducts();
        for (const p of initialProducts) {
          await adminDb.collection(COLLECTION_NAME).doc(p.id).set(p);
        }
        return initialProducts;
      }

      return snapshot.docs.map((doc) => doc.data() as BackendProduct);
    } catch (error) {
      console.warn("[ProductRepo] Firestore read error, returning initial:", error);
      return seedInitialProducts();
    }
  }

  /**
   * Lấy chi tiết 1 sản phẩm theo ID
   */
  static async getById(id: string): Promise<BackendProduct | null> {
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
      return doc.data() as BackendProduct;
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
      inStock: productData.inStock !== false,
      stockCount: Number(productData.stockCount) || 50,
      isActive: productData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (adminDb) {
      await adminDb.collection(COLLECTION_NAME).doc(id).set(newProduct);
    }

    return newProduct;
  }

  /**
   * Cập nhật thông tin sản phẩm (giá tiền, trạng thái tồn kho, mô tả)
   */
  static async update(id: string, updates: Partial<BackendProduct>): Promise<BackendProduct | null> {
    const current = await this.getById(id);
    if (!current) return null;

    const updated: BackendProduct = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (adminDb) {
      await adminDb.collection(COLLECTION_NAME).doc(id).set(updated, { merge: true });
    }

    return updated;
  }

  /**
   * Xóa sản phẩm khỏi database
   */
  static async delete(id: string): Promise<boolean> {
    if (adminDb) {
      await adminDb.collection(COLLECTION_NAME).doc(id).delete();
    }
    return true;
  }
}
