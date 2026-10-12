import { adminDb } from "../config/firebaseAdmin";
import { BackendOrder } from "../models";

const COLLECTION_NAME = "orders";

// Bộ nhớ đệm đơn hàng thực tế
const memoryOrderStore = new Map<string, BackendOrder>();

export class OrderRepository {
  /**
   * Lưu hoặc cập nhật đơn hàng vào Firestore & Memory
   */
  static async save(order: BackendOrder): Promise<boolean> {
    memoryOrderStore.set(order.orderId, order);

    if (!adminDb) return true;
    try {
      await adminDb.collection(COLLECTION_NAME).doc(order.orderId).set(order, { merge: true });
      return true;
    } catch (error) {
      console.warn("[OrderRepo] Firestore save error:", error);
      return true;
    }
  }

  /**
   * Tìm đơn hàng theo Order ID
   */
  static async getById(orderId: string): Promise<BackendOrder | null> {
    if (memoryOrderStore.has(orderId)) {
      return memoryOrderStore.get(orderId)!;
    }

    if (!adminDb) return null;
    try {
      const doc = await adminDb.collection(COLLECTION_NAME).doc(orderId).get();
      if (!doc.exists) return null;
      const data = doc.data() as BackendOrder;
      memoryOrderStore.set(data.orderId, data);
      return data;
    } catch (error) {
      console.warn("[OrderRepo] getById error:", error);
      return null;
    }
  }

  /**
   * Tìm đơn hàng theo Order Code (ví dụ NET-ORD-8821)
   */
  static async getByCode(orderCode: string): Promise<BackendOrder | null> {
    for (const order of memoryOrderStore.values()) {
      if (order.orderCode === orderCode) return order;
    }

    if (!adminDb) return null;
    try {
      const snapshot = await adminDb
        .collection(COLLECTION_NAME)
        .where("orderCode", "==", orderCode)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      const data = snapshot.docs[0].data() as BackendOrder;
      memoryOrderStore.set(data.orderId, data);
      return data;
    } catch (error) {
      console.warn("[OrderRepo] getByCode error:", error);
      return null;
    }
  }

  /**
   * Lấy toàn bộ danh sách đơn hàng thực tế (CHỈ NHỮNG ĐƠN ĐÃ ĐẶT HOẶC CÓ TRONG DB)
   */
  static async getAll(limitCount: number = 100): Promise<BackendOrder[]> {
    if (!adminDb) {
      return Array.from(memoryOrderStore.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    try {
      const snapshot = await adminDb
        .collection(COLLECTION_NAME)
        .orderBy("createdAt", "desc")
        .limit(limitCount)
        .get();

      if (snapshot.empty) {
        return Array.from(memoryOrderStore.values());
      }

      const orders = snapshot.docs.map((doc) => doc.data() as BackendOrder);
      for (const o of orders) {
        memoryOrderStore.set(o.orderId, o);
      }
      return orders;
    } catch (error) {
      console.warn("[OrderRepo] getAll error, fallback to memory:", error);
      return Array.from(memoryOrderStore.values());
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
    const existing = await this.getById(orderId);
    if (existing) {
      const updated: BackendOrder = {
        ...existing,
        ...updates,
      };
      memoryOrderStore.set(orderId, updated);
    }

    if (!adminDb) return true;
    try {
      await adminDb.collection(COLLECTION_NAME).doc(orderId).update(updates);
      return true;
    } catch (error) {
      console.warn("[OrderRepo] updateStatus error:", error);
      return true;
    }
  }

  /**
   * Xóa đơn hàng khỏi hệ thống
   */
  static async delete(orderId: string): Promise<boolean> {
    memoryOrderStore.delete(orderId);
    if (!adminDb) return true;
    try {
      await adminDb.collection(COLLECTION_NAME).doc(orderId).delete();
      return true;
    } catch (error) {
      console.warn("[OrderRepo] delete error:", error);
      return true;
    }
  }
}
