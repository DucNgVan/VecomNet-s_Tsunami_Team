import { adminDb } from "../config/firebaseAdmin";
import { BackendInventoryItem, BackendNetPack } from "../models";

const BATCHES_COLLECTION = "batches";
const BAG_ITEMS_COLLECTION = "bag_items";

export class InventoryRepository {
  /**
   * Lấy danh sách Kiện Lưới (Raw Net Packs)
   */
  static async getAllNetPacks(): Promise<BackendNetPack[]> {
    if (!adminDb) return [];
    try {
      const snapshot = await adminDb.collection(BATCHES_COLLECTION).get();
      return snapshot.docs.map((doc) => doc.data() as BackendNetPack);
    } catch (e) {
      console.warn("[InventoryRepo] getAllNetPacks error:", e);
      return [];
    }
  }

  /**
   * Lưu hoặc cập nhật Kiện Lưới
   */
  static async saveNetPack(pack: BackendNetPack): Promise<boolean> {
    if (!adminDb) return true;
    try {
      await adminDb.collection(BATCHES_COLLECTION).doc(pack.packId).set(pack, { merge: true });
      return true;
    } catch (e) {
      console.warn("[InventoryRepo] saveNetPack error:", e);
      return false;
    }
  }

  /**
   * Lấy danh sách Túi Thành Phẩm (Manufactured Goods)
   */
  static async getAllBagItems(): Promise<BackendInventoryItem[]> {
    if (!adminDb) return [];
    try {
      const snapshot = await adminDb.collection(BAG_ITEMS_COLLECTION).get();
      return snapshot.docs.map((doc) => doc.data() as BackendInventoryItem);
    } catch (e) {
      console.warn("[InventoryRepo] getAllBagItems error:", e);
      return [];
    }
  }

  /**
   * Lấy chi tiết túi theo mã Serial ID
   */
  static async getBagItemBySerial(serialId: string): Promise<BackendInventoryItem | null> {
    if (!adminDb) return null;
    try {
      const doc = await adminDb.collection(BAG_ITEMS_COLLECTION).doc(serialId).get();
      if (!doc.exists) return null;
      return doc.data() as BackendInventoryItem;
    } catch (e) {
      console.warn("[InventoryRepo] getBagItemBySerial error:", e);
      return null;
    }
  }

  /**
   * Cập nhật thông tin túi (trạng thái kho, kích hoạt bảo hành điện tử)
   */
  static async updateBagItem(serialId: string, updates: Partial<BackendInventoryItem>): Promise<boolean> {
    if (!adminDb) return true;
    try {
      await adminDb.collection(BAG_ITEMS_COLLECTION).doc(serialId).set(updates, { merge: true });
      return true;
    } catch (e) {
      console.warn("[InventoryRepo] updateBagItem error:", e);
      return false;
    }
  }

  /**
   * Tự động tìm túi in_stock và trừ kho khi có đơn hàng
   */
  static async deductItemForOrder(orderCode: string, bagNameMatch?: string): Promise<string | null> {
    if (!adminDb) return null;
    try {
      const snapshot = await adminDb
        .collection(BAG_ITEMS_COLLECTION)
        .where("status", "==", "in_stock")
        .get();

      if (snapshot.empty) return null;

      let itemDoc = snapshot.docs[0];

      if (bagNameMatch && bagNameMatch.trim() !== "") {
        const cleanMatch = bagNameMatch.trim().toLowerCase();
        const found = snapshot.docs.find((d) => {
          const data = d.data();
          const bagName = String(data.bagName || "").toLowerCase();
          const bagBaseId = String(data.bagBaseId || "").toLowerCase();
          return (
            (bagName !== "" && (cleanMatch.includes(bagName) || bagName.includes(cleanMatch))) ||
            (bagBaseId !== "" && (cleanMatch.includes(bagBaseId) || bagBaseId.includes(cleanMatch)))
          );
        });

        if (!found) {
          // Không có túi nào khớp dáng túi trong kho -> Trả về null để chặn bán nhầm
          return null;
        }
        itemDoc = found;
      }

      const serialId = itemDoc.id;

      await itemDoc.ref.update({
        status: "assigned_to_order",
        assignedOrderCode: orderCode,
        updatedAt: new Date().toISOString(),
      });

      return serialId;
    } catch (e) {
      console.warn("[InventoryRepo] deductItemForOrder error:", e);
      return null;
    }
  }
}
