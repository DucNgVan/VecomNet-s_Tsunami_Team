import { adminDb } from "../config/firebaseAdmin";
import { BackendOrder } from "../models";

const COLLECTION_NAME = "orders";

export class OrderRepository {
  /**
   * Lưu hoặc cập nhật đơn hàng vào Firestore
   */
  static async save(order: BackendOrder): Promise<boolean> {
    if (!adminDb) return true;
    try {
      await adminDb.collection(COLLECTION_NAME).doc(order.orderId).set(order, { merge: true });
      return true;
    } catch (error) {
      console.warn("[OrderRepo] Firestore save error:", error);
      return false;
    }
  }

  /**
   * Tìm đơn hàng theo Order ID
   */
  static async getById(orderId: string): Promise<BackendOrder | null> {
    if (!adminDb) return null;
    try {
      const doc = await adminDb.collection(COLLECTION_NAME).doc(orderId).get();
      if (!doc.exists) return null;
      return doc.data() as BackendOrder;
    } catch (error) {
      console.warn("[OrderRepo] getById error:", error);
      return null;
    }
  }

  /**
   * Tìm đơn hàng theo Order Code (ví dụ NET-ORD-8821)
   */
  static async getByCode(orderCode: string): Promise<BackendOrder | null> {
    if (!adminDb) return null;
    try {
      const snapshot = await adminDb
        .collection(COLLECTION_NAME)
        .where("orderCode", "==", orderCode)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as BackendOrder;
    } catch (error) {
      console.warn("[OrderRepo] getByCode error:", error);
      return null;
    }
  }

  /**
   * Lấy toàn bộ danh sách đơn hàng
   */
  static async getAll(limitCount: number = 100): Promise<BackendOrder[]> {
    if (!adminDb) return [];
    try {
      const snapshot = await adminDb
        .collection(COLLECTION_NAME)
        .orderBy("createdAt", "desc")
        .limit(limitCount)
        .get();

      return snapshot.docs.map((doc) => doc.data() as BackendOrder);
    } catch (error) {
      console.warn("[OrderRepo] getAll error:", error);
      return [];
    }
  }

  /**
   * Cập nhật trạng thái thanh toán hoặc gia công đơn hàng
   */
  static async updateStatus(
    orderId: string,
    updates: {
      paymentStatus?: BackendOrder["paymentStatus"];
      fulfillmentStatus?: BackendOrder["fulfillmentStatus"];
      paidAt?: string;
    }
  ): Promise<boolean> {
    if (!adminDb) return true;
    try {
      await adminDb.collection(COLLECTION_NAME).doc(orderId).update(updates);
      return true;
    } catch (error) {
      console.warn("[OrderRepo] updateStatus error:", error);
      return false;
    }
  }
}
