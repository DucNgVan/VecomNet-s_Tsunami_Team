import { Voucher, CartItem, AppliedVoucherInfo } from "@/types";
import { formatVND } from "@/lib/utils";

export const VOUCHERS_STORAGE_KEY = "net_vouchers_v1";

export const DEFAULT_VOUCHERS: Voucher[] = [
  {
    id: "vch-charm-50k",
    code: "CHARM50K",
    title: "Voucher Đồng Giá Charm 50K",
    description: "Đồng giá 50.000đ cho mỗi charm khi mua từ 2 charm trở lên (áp dụng cho cả charm đơn và charm trên túi thiết kế).",
    discountType: "same_price_item",
    discountValue: 50000,
    minQuantity: 2,
    applicableTarget: "charm",
    customerTarget: "all",
    isActive: true,
    isPublic: true,
    usageLimit: 500,
    usedCount: 16,
    startDate: "2026-10-01",
    endDate: "2027-12-31",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "vch-opening-ceremony",
    code: "NETSOPENING",
    title: "NÉT Opening Ceremony - Giảm 10%",
    description: "Giảm 10% trên toàn bộ hoá đơn áp dụng cho khách hàng mới mua lần đầu tiên.",
    discountType: "percentage",
    discountValue: 10,
    maxDiscountAmount: 300000,
    minOrderValue: 200000,
    applicableTarget: "all",
    customerTarget: "new_customer",
    isActive: true,
    isPublic: true,
    usageLimit: 200,
    usedCount: 42,
    startDate: "2026-10-01",
    endDate: "2027-12-31",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "vch-free-shipping",
    code: "FREESHIP",
    title: "Miễn Phí Vận Chuyển Toàn Quốc",
    description: "Miễn phí 100% phí giao hàng cho đơn hàng có giá trị từ 450.000đ trở lên.",
    discountType: "free_shipping",
    discountValue: 0,
    minOrderValue: 450000,
    applicableTarget: "all",
    customerTarget: "all",
    isActive: true,
    isPublic: true,
    usageLimit: 1000,
    usedCount: 128,
    startDate: "2026-10-01",
    endDate: "2027-12-31",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "vch-companion-50k",
    code: "NETS50K",
    title: "Giảm 50.000đ Bạn Đồng Hành",
    description: "Tặng ngay 50.000đ cho đơn hàng có giá trị từ 500.000đ trở lên.",
    discountType: "fixed_amount",
    discountValue: 50000,
    minOrderValue: 500000,
    applicableTarget: "all",
    customerTarget: "all",
    isActive: true,
    isPublic: true,
    usageLimit: 300,
    usedCount: 65,
    startDate: "2026-10-01",
    endDate: "2027-12-31",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
];

/**
 * Lấy danh sách voucher từ localStorage (hoặc trả về dữ liệu mẫu)
 */
export function getStoredVouchers(): Voucher[] {
  if (typeof window === "undefined") {
    return DEFAULT_VOUCHERS;
  }

  try {
    const raw = localStorage.getItem(VOUCHERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(DEFAULT_VOUCHERS));
      return DEFAULT_VOUCHERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(DEFAULT_VOUCHERS));
      return DEFAULT_VOUCHERS;
    }
    return parsed;
  } catch (err) {
    console.warn("Failed to load vouchers from localStorage, using defaults:", err);
    return DEFAULT_VOUCHERS;
  }
}

/**
 * Lưu danh sách voucher vào localStorage
 */
export function saveStoredVouchers(vouchers: Voucher[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(vouchers));
  } catch (err) {
    console.error("Failed to save vouchers to localStorage:", err);
  }
}

/**
 * Tìm voucher theo mã code (không phân biệt chữ hoa thường)
 */
export function getVoucherByCode(code: string): Voucher | undefined {
  if (!code) return undefined;
  const list = getStoredVouchers();
  const normalized = code.trim().toUpperCase();
  return list.find((v) => v.code.toUpperCase() === normalized);
}

/**
 * Tạo mới hoặc cập nhật Voucher
 */
export function saveVoucher(voucherData: Partial<Voucher> & { code: string; title: string }): Voucher[] {
  const list = getStoredVouchers();
  const cleanCode = voucherData.code.trim().toUpperCase();
  const now = new Date().toISOString();

  let updatedList: Voucher[];
  const existingIndex = list.findIndex(
    (v) => (voucherData.id && v.id === voucherData.id) || v.code.toUpperCase() === cleanCode
  );

  if (existingIndex > -1) {
    const existing = list[existingIndex];
    const updated: Voucher = {
      ...existing,
      ...voucherData,
      code: cleanCode,
      updatedAt: now,
    };
    updatedList = [...list];
    updatedList[existingIndex] = updated;
  } else {
    const newVoucher: Voucher = {
      id: voucherData.id || `vch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      title: voucherData.title.trim(),
      description: voucherData.description?.trim() || "",
      discountType: voucherData.discountType || "percentage",
      discountValue: Number(voucherData.discountValue) || 0,
      maxDiscountAmount: voucherData.maxDiscountAmount ? Number(voucherData.maxDiscountAmount) : undefined,
      minOrderValue: voucherData.minOrderValue ? Number(voucherData.minOrderValue) : undefined,
      minQuantity: voucherData.minQuantity ? Number(voucherData.minQuantity) : undefined,
      applicableTarget: voucherData.applicableTarget || "all",
      customerTarget: voucherData.customerTarget || "all",
      usageLimit: voucherData.usageLimit ? Number(voucherData.usageLimit) : undefined,
      usedCount: Number(voucherData.usedCount) || 0,
      startDate: voucherData.startDate || "",
      endDate: voucherData.endDate || "",
      isActive: voucherData.isActive !== false,
      isPublic: voucherData.isPublic !== false,
      createdAt: voucherData.createdAt || now,
      updatedAt: now,
    };
    updatedList = [newVoucher, ...list];
  }

  saveStoredVouchers(updatedList);
  return updatedList;
}

/**
 * Xóa Voucher theo ID
 */
export function deleteVoucher(id: string): Voucher[] {
  const list = getStoredVouchers();
  const updated = list.filter((v) => v.id !== id);
  saveStoredVouchers(updated);
  return updated;
}

/**
 * Bật / tắt trạng thái kích hoạt của voucher
 */
export function toggleVoucherStatus(id: string, isActive: boolean): Voucher[] {
  const list = getStoredVouchers();
  const updated = list.map((v) => (v.id === id ? { ...v, isActive, updatedAt: new Date().toISOString() } : v));
  saveStoredVouchers(updated);
  return updated;
}

/**
 * Tăng số lượt đã sử dụng của voucher
 */
export function incrementVoucherUsage(code: string): void {
  if (!code) return;
  const list = getStoredVouchers();
  const normalized = code.trim().toUpperCase();
  const updated = list.map((v) => {
    if (v.code.toUpperCase() === normalized) {
      return { ...v, usedCount: (v.usedCount || 0) + 1, updatedAt: new Date().toISOString() };
    }
    return v;
  });
  saveStoredVouchers(updated);
}

/**
 * Bóc tách danh sách và số lượng Charm trong giỏ hàng
 * Bao gồm cả charm mua lẻ và charm gắn trên các túi thiết kế (custom_bag)
 */
export function extractCartCharms(items: CartItem[]): {
  totalCharmCount: number;
  totalCharmPrice: number;
  charmUnits: { name: string; price: number; quantity: number }[];
} {
  let totalCharmCount = 0;
  let totalCharmPrice = 0;
  const charmUnits: { name: string; price: number; quantity: number }[] = [];

  for (const item of items) {
    if (item.type === "charm_single") {
      const qty = item.quantity || 1;
      const unitPrice = item.price || 0;
      totalCharmCount += qty;
      totalCharmPrice += unitPrice * qty;
      charmUnits.push({
        name: item.title,
        price: unitPrice,
        quantity: qty,
      });
    } else if (item.type === "custom_bag") {
      const placedCharms = item.details?.configuration?.placedCharms;
      const bagQty = item.quantity || 1;
      if (placedCharms && placedCharms.length > 0) {
        for (const pc of placedCharms) {
          const unitPrice = pc.charm?.price || 60000;
          totalCharmCount += bagQty;
          totalCharmPrice += unitPrice * bagQty;
          charmUnits.push({
            name: pc.charm?.vietnameseName || pc.charm?.name || "Charm trên túi",
            price: unitPrice,
            quantity: bagQty,
          });
        }
      } else if (item.details?.charmsCount && item.details.charmsCount > 0) {
        const count = item.details.charmsCount * bagQty;
        const estimatedUnitPrice = 60000;
        totalCharmCount += count;
        totalCharmPrice += estimatedUnitPrice * count;
        charmUnits.push({
          name: "Charm thiết kế",
          price: estimatedUnitPrice,
          quantity: count,
        });
      }
    }
  }

  return { totalCharmCount, totalCharmPrice, charmUnits };
}

/**
 * Kiểm tra xem khách hàng có phải là khách mới hay không
 * (Dựa vào số lượng đơn đã đặt qua email, SĐT hoặc userId)
 */
export function checkIsNewCustomer(email?: string, phone?: string, userId?: string): boolean {
  if (typeof window === "undefined") return true;

  try {
    // 1. Kiểm tra đơn hàng trong admin storage / local storage
    const rawOrders = localStorage.getItem("net_admin_orders_v1");
    if (rawOrders) {
      const orders = JSON.parse(rawOrders);
      if (Array.isArray(orders) && orders.length > 0) {
        const hasPastOrder = orders.some((o: any) => {
          if (userId && o.userId && o.userId !== "guest" && o.userId === userId) return true;
          if (email && o.customer?.email && o.customer.email.trim().toLowerCase() === email.trim().toLowerCase()) return true;
          if (phone && o.customer?.phone && o.customer.phone.trim().replace(/\D/g, "") === phone.trim().replace(/\D/g, "")) return true;
          return false;
        });
        if (hasPastOrder) return false;
      }
    }

    // 2. Kiểm tra profile trong localStorage
    const rawProfile = localStorage.getItem("net_member_profile");
    if (rawProfile) {
      const profile = JSON.parse(rawProfile);
      if (profile?.totalOrdersCount && profile.totalOrdersCount > 0) {
        return false;
      }
    }
  } catch (e) {
    console.warn("checkIsNewCustomer check notice:", e);
  }

  return true;
}

/**
 * Kiểm tra điều kiện áp dụng và tính toán số tiền giảm giá chính xác
 */
export function validateAndCalculateVoucher(
  voucher: Voucher,
  params: {
    items: CartItem[];
    subtotal: number;
    shippingFee: number;
    isNewCustomer?: boolean;
    customerEmail?: string;
    customerPhone?: string;
    userId?: string;
  }
): {
  eligible: boolean;
  discountAmount: number;
  isFreeShipping: boolean;
  reason?: string;
} {
  const { items, subtotal, shippingFee, isNewCustomer } = params;

  // 1. Trạng thái kích hoạt
  if (!voucher.isActive) {
    return {
      eligible: false,
      discountAmount: 0,
      isFreeShipping: false,
      reason: "Mã giảm giá hiện đang tạm ngưng sử dụng.",
    };
  }

  // 2. Kiểm tra ngày hiệu lực
  const todayStr = new Date().toISOString().slice(0, 10);
  if (voucher.startDate && voucher.startDate > todayStr) {
    return {
      eligible: false,
      discountAmount: 0,
      isFreeShipping: false,
      reason: `Mã giảm giá chỉ có hiệu lực từ ngày ${voucher.startDate}.`,
    };
  }
  if (voucher.endDate && voucher.endDate < todayStr) {
    return {
      eligible: false,
      discountAmount: 0,
      isFreeShipping: false,
      reason: `Mã giảm giá đã hết hạn sử dụng vào ngày ${voucher.endDate}.`,
    };
  }

  // 3. Giới hạn lượt sử dụng
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    return {
      eligible: false,
      discountAmount: 0,
      isFreeShipping: false,
      reason: "Mã giảm giá đã đạt giới hạn lượt sử dụng tối đa.",
    };
  }

  // 4. Giá trị đơn hàng tối thiểu
  if (voucher.minOrderValue && subtotal < voucher.minOrderValue) {
    const diff = voucher.minOrderValue - subtotal;
    return {
      eligible: false,
      discountAmount: 0,
      isFreeShipping: false,
      reason: `Đơn hàng tối thiểu ${formatVND(voucher.minOrderValue)} (còn thiếu ${formatVND(diff)}).`,
    };
  }

  // 5. Kiểm tra đối tượng khách hàng (Khách hàng mới mua lần đầu)
  if (voucher.customerTarget === "new_customer") {
    // Nếu truyền isNewCustomer rõ ràng hoặc kiểm tra
    let isNew = isNewCustomer;
    if (isNew === undefined) {
      isNew = checkIsNewCustomer(params.customerEmail, params.customerPhone, params.userId);
    }
    if (isNew === false) {
      return {
        eligible: false,
        discountAmount: 0,
        isFreeShipping: false,
        reason: "Voucher này chỉ áp dụng cho khách hàng mới mua lần đầu tiên.",
      };
    }
  }

  // 6. Kiểm tra loại sản phẩm áp dụng và số lượng tối thiểu
  const charmData = extractCartCharms(items);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (voucher.applicableTarget === "charm") {
    const minRequiredCharms = voucher.minQuantity || 1;
    if (charmData.totalCharmCount < minRequiredCharms) {
      return {
        eligible: false,
        discountAmount: 0,
        isFreeShipping: false,
        reason: `Cần mua từ ${minRequiredCharms} charm trở lên để áp dụng voucher này (giỏ hàng hiện có ${charmData.totalCharmCount} charm).`,
      };
    }
  } else if (voucher.minQuantity && totalItemCount < voucher.minQuantity) {
    return {
      eligible: false,
      discountAmount: 0,
      isFreeShipping: false,
      reason: `Cần mua tối thiểu ${voucher.minQuantity} sản phẩm trong đơn hàng.`,
    };
  }

  // 7. TÍNH TOÁN SỐ TIỀN GIẢM GIÁ (Discount Amount)
  let calculatedDiscount = 0;
  let isFreeShipping = false;

  switch (voucher.discountType) {
    case "same_price_item": {
      // VÍ DỤ: Voucher đồng giá 50k charm khi mua từ 2 charm trở lên
      // Mọi charm có giá > 50.000đ sẽ được giảm phần chênh lệch về đúng 50.000đ
      const targetPrice = Number(voucher.discountValue) || 50000;
      let totalCharmSavings = 0;

      for (const cu of charmData.charmUnits) {
        if (cu.price > targetPrice) {
          totalCharmSavings += (cu.price - targetPrice) * cu.quantity;
        }
      }

      if (totalCharmSavings <= 0) {
        return {
          eligible: false,
          discountAmount: 0,
          isFreeShipping: false,
          reason: `Các charm trong giỏ hàng đều có giá bằng hoặc thấp hơn mức đồng giá ${formatVND(targetPrice)}.`,
        };
      }

      calculatedDiscount = totalCharmSavings;
      break;
    }

    case "percentage": {
      // VÍ DỤ: Voucher opening ceremony giảm 10% trên toàn bộ hoá đơn
      let baseAmount = subtotal;
      if (voucher.applicableTarget === "charm") {
        baseAmount = charmData.totalCharmPrice;
      } else if (voucher.applicableTarget === "bag") {
        baseAmount = items
          .filter((it) => it.type === "base_bag" || it.type === "custom_bag" || it.type === "combo")
          .reduce((sum, it) => sum + it.price * it.quantity, 0);
      }

      const percent = Number(voucher.discountValue) || 0;
      let rawDiscount = Math.round(baseAmount * (percent / 100));

      if (voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0) {
        rawDiscount = Math.min(rawDiscount, voucher.maxDiscountAmount);
      }

      calculatedDiscount = Math.min(rawDiscount, subtotal);
      break;
    }

    case "fixed_amount": {
      // Giảm trực tiếp số tiền cố định (vd 50.000đ)
      const amount = Number(voucher.discountValue) || 0;
      calculatedDiscount = Math.min(amount, subtotal);
      break;
    }

    case "free_shipping": {
      // Miễn phí vận chuyển
      isFreeShipping = true;
      calculatedDiscount = shippingFee;
      break;
    }

    default:
      calculatedDiscount = 0;
  }

  if (calculatedDiscount <= 0 && !isFreeShipping) {
    return {
      eligible: false,
      discountAmount: 0,
      isFreeShipping: false,
      reason: "Mức giảm không áp dụng được cho đơn hàng này.",
    };
  }

  return {
    eligible: true,
    discountAmount: calculatedDiscount,
    isFreeShipping,
  };
}
