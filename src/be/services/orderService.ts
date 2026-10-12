import { OrderRepository } from "../database/orderRepo";
import { ProductRepository } from "../database/productRepo";
import { InventoryRepository } from "../database/inventoryRepo";
import { BackendOrder } from "../models";
import { generateOrderCode } from "@/lib/utils";
import { calculateShippingFee } from "@/data/vietnamAddress";
import { sendOrderConfirmationEmail } from "@/lib/emailService";

export class OrderService {
  /**
   * Xử lý đặt hàng bảo mật phía máy chủ (Server-side Checkout)
   * - Kiểm tra tồn kho & số lượng
   * - Trừ số lượng sản phẩm trong database
   * - Lưu đơn hàng thực tế
   * - Gửi email & tạo VietQR
   */
  static async processCheckout(body: any): Promise<{
    order: BackendOrder;
    vietQr: any;
    emailDispatched: boolean;
  }> {
    const {
      customer,
      items = [],
      paymentMethod = "cod",
      assignedBatchId = "PACK-DN-2024-082",
      totalPlasticOffsetKg = 2.14,
      userId,
    } = body;

    if (!items || items.length === 0) {
      throw new Error("Giỏ hàng không có sản phẩm!");
    }

    // 1. Đối chiếu giá phía máy chủ & kiểm tra số lượng tồn kho từ Product Repository
    const productCatalog = await ProductRepository.getAll();
    let calculatedSubtotal = 0;

    const verifiedItems = items.map((cartItem: any) => {
      const matched = productCatalog.find(
        (p) =>
          p.id === cartItem.bagBaseId ||
          p.id === cartItem.id ||
          cartItem.title?.toLowerCase().includes(p.name.toLowerCase())
      );

      const verifiedPrice = matched ? matched.basePrice : Number(cartItem.price) || 1250000;
      const quantity = Math.max(1, Number(cartItem.quantity) || 1);
      calculatedSubtotal += verifiedPrice * quantity;

      return {
        ...cartItem,
        bagBaseId: matched ? matched.id : cartItem.bagBaseId,
        price: verifiedPrice,
        quantity,
      };
    });

    // 2. KIỂM TRA TỒN KHO: Chặn đặt hàng nếu sản phẩm hết hàng hoặc số lượng không đủ
    for (const item of verifiedItems) {
      const matched = productCatalog.find(
        (p) =>
          p.id === item.bagBaseId ||
          p.id === item.id ||
          item.title?.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matched) {
        if (!matched.inStock || matched.stockCount <= 0) {
          throw new Error(`Sản phẩm "${matched.name}" hiện đã hết hàng trong kho!`);
        }
        if (matched.stockCount < item.quantity) {
          throw new Error(
            `Sản phẩm "${matched.name}" chỉ còn ${matched.stockCount} chiếc trong kho, không đủ đáp ứng số lượng bạn đặt (${item.quantity})!`
          );
        }
      }
    }

    // 3. Tính phí vận chuyển tự động theo tỉnh/thành
    const province = customer?.city || "Đà Nẵng";
    const shippingFee = calculateShippingFee(calculatedSubtotal, province);
    const grandTotal = calculatedSubtotal + shippingFee;

    const orderCode = generateOrderCode();
    const orderId = `ord-${Date.now()}`;

    // 4. TRỪ SỐ LƯỢNG TỒN KHO SẢN PHẨM TRONG DATABASE THỰC TẾ
    for (const item of verifiedItems) {
      const matched = productCatalog.find(
        (p) =>
          p.id === item.bagBaseId ||
          p.id === item.id ||
          item.title?.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matched) {
        try {
          await ProductRepository.deductStock(matched.id, item.quantity);
        } catch (e) {
          console.warn(`[OrderService] Deduct product stock warning for ${matched.id}:`, e);
        }
      }
    }

    // 5. Tự động tìm và gán túi thành phẩm mẻ lưới trong kho
    let assignedSerialId: string | null = null;
    try {
      assignedSerialId = await InventoryRepository.deductItemForOrder(
        orderCode,
        verifiedItems[0]?.title
      );
    } catch (e) {
      console.warn("[OrderService] Deduct inventory warning:", e);
    }

    // 6. Sinh mã VietQR động
    const bankBin = "970422"; // MB Bank
    const bankAccountNo = "0905882119";
    const accountHolder = "NET OCEAN CRAFT";
    const transferMemo = `NET ${orderCode}`;
    const vietQrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccountNo}-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(
      transferMemo
    )}&accountName=${encodeURIComponent(accountHolder)}`;

    const vietQrData = {
      qrUrl: vietQrUrl,
      bankName: "Ngân hàng Quân Đội (MB Bank)",
      accountNo: bankAccountNo,
      accountHolder,
      transferMemo,
      amount: grandTotal,
    };

    const newOrder: BackendOrder = {
      orderId,
      orderCode,
      createdAt: new Date().toISOString(),
      customer: customer || {
        fullName: "Khách hàng NÉT",
        phone: "0905000000",
        email: "eco@net.vn",
        address: "Đà Nẵng",
        city: "Đà Nẵng",
      },
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      shippingFee,
      total: grandTotal,
      totalPlasticOffsetKg: Number(totalPlasticOffsetKg) || 2.14,
      assignedBatchId,
      assignedBagSerialId: assignedSerialId,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      fulfillmentStatus: "crafting",
      userId: userId || "guest",
      vietQr: vietQrData,
    };

    // 7. Lưu đơn hàng vào Database
    await OrderRepository.save(newOrder);

    // 8. Gửi email xác nhận hóa đơn tự động
    let emailDispatched = false;
    try {
      const emailRes = await sendOrderConfirmationEmail(newOrder as any);
      emailDispatched = emailRes.success;
    } catch (e) {
      console.warn("[OrderService] Email dispatch warning:", e);
    }

    return {
      order: newOrder,
      vietQr: vietQrData,
      emailDispatched,
    };
  }

  /**
   * Lấy danh sách đơn hàng thực tế
   */
  static async getOrders(): Promise<BackendOrder[]> {
    return OrderRepository.getAll();
  }

  /**
   * Cập nhật trạng thái đơn hàng (giao hàng / thanh toán)
   */
  static async updateOrderStatus(
    orderId: string,
    fulfillmentStatus?: BackendOrder["fulfillmentStatus"],
    paymentStatus?: BackendOrder["paymentStatus"]
  ): Promise<boolean> {
    return OrderRepository.updateStatus(orderId, {
      fulfillmentStatus,
      paymentStatus,
    });
  }

  /**
   * Xóa đơn hàng khỏi hệ thống
   */
  static async deleteOrder(orderId: string): Promise<boolean> {
    return OrderRepository.delete(orderId);
  }
}
