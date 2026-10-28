"use client";

import { BAG_BASES } from "@/data/products";

// ============================================================================
// 1. DATA TYPES (Strictly matching the 26 requirements)
// ============================================================================

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: "bank_transfer" | "cash" | "vnpay" | "momo";
  type: "payment" | "refund";
  note?: string;
  recordedBy: string;
}

export interface OrderAuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface AdminOrderItem {
  id: string;
  title: string;
  type: "base_bag" | "charm" | "custom_charm";
  price: number;
  quantity: number;
  image?: string;
  conceptUrl?: string;
  referenceUrl?: string;
  bagBaseId?: string;
}

export type OrderType = "ready_made" | "custom_charm" | "b2b";

export type OrderFulfillmentStatus =
  // Ready-made flow (Req 7)
  | "received"
  | "confirmed"
  | "packaging"
  | "delivering"
  | "delivered"
  | "cancelled"
  // Custom charm flow (Req 8)
  | "quote_needed"
  | "waiting_approval"
  | "in_production";

export type PaymentStatus = "unpaid" | "deposit" | "paid" | "refunded";

export interface AdminOrder {
  orderId: string;
  orderCode: string;
  createdAt: string;
  updatedAt: string;
  orderType: OrderType;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    note?: string;
  };
  items: AdminOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paidAmount: number; // Tiền đã thu thực tế
  remainingAmount: number; // Còn lại
  paymentStatus: PaymentStatus;
  paymentHistory: PaymentRecord[];
  fulfillmentStatus: OrderFulfillmentStatus;
  customWorkflow?: {
    conceptDescription?: string;
    conceptUrl?: string;
    quotedPrice?: number;
    estimatedDeliveryDate?: string;
    quoteSentAt?: string;
    clientApprovalStatus?: "pending" | "approved" | "revision_requested";
    clientRevisionNotes?: string;
    approvedAt?: string;
    approvedVersionNumber?: number;
  };
  partnerId?: string;
  partnerCode?: string;
  delivery: {
    carrier?: string;
    trackingCode?: string;
    promisedDate?: string;
    actualDeliveryDate?: string;
  };
  assignedSerialIds?: string[];
  inventoryDeducted: boolean;
  auditHistory: OrderAuditEntry[];
}

export interface RawNetBatch {
  batchId: string;
  supplierSource: string; // Ngư dân / Cảng / Đội lặn
  seaRegion: string; // Địa điểm thu gom
  receiveDate: string;
  photoUrl?: string;
  initialWeightKg: number;
  weighingCondition: "wet" | "dry";
  status: "unprocessed" | "processed" | "depleted";
  processing?: {
    completedDate: string;
    usableDryKg: number; // Chỉ lượng này được cộng vào kho
    discardedWasteKg: number; // Rác / bùn / mục
    moistureLossKg?: number;
    notes?: string;
    processedAt: string;
  };
  usableDryStockKg: number; // Lưới khô còn trong kho
  reusableScrapsKg: number; // Vụn còn dùng được
  history: { date: string; action: string; changeKg: number; note: string }[];
}

export interface ProductionSlip {
  slipId: string;
  createdAt: string;
  workshopName: string;
  bagModelId: string;
  bagModelName: string;
  exportedBatches: { batchId: string; exportedKg: number }[];
  totalExportedKg: number;
  status: "in_production" | "completed";
  sewingResult?: {
    completedDate: string;
    passedBagsCount: number;
    netInPassedBagsKg: number;
    defectiveBagsCount: number;
    returnedRawNetKg: number; // Lưới dư nguyên trả kho
    reusableScrapsKg: number; // Vụn dùng tiếp
    discardedWasteKg: number; // Phế phẩm loại bỏ
    notes?: string;
  };
  weightAttributionMethod?: "actual" | "distributed";
  serialsCreated: boolean;
}

export interface BagSerialItem {
  serialId: string;
  slipId: string;
  batchId: string;
  bagModelId: string;
  bagName: string;
  netWeightKg: number;
  attributionMethod: "actual" | "distributed";
  manufacturedDate: string;
  status: "in_stock" | "assigned_to_order" | "delivered";
  assignedOrderCode?: string;
  passport?: {
    passportId: string;
    issuedAt: string;
    verifiedOrigin: string;
    netWeightKg: number;
    attributionMethod: string;
    charmStory?: string;
    personalStory?: string;
    allowPublicStory: boolean; // Khách đồng ý công khai
  };
}

export interface Partner {
  id: string;
  name: string;
  type: "hotel" | "tour" | "souvenir_shop" | "ambassador";
  contactPerson: string;
  phone: string;
  email?: string;
  referralCode: string;
  commissionRate: number; // e.g. 0.12 (12%)
  notes?: string;
  totalReconciledAmount?: number;
  lastReconciledAt?: string;
}

// ============================================================================
// 2. STORAGE KEYS & SEED DATA
// ============================================================================

const STORAGE_KEYS = {
  ORDERS: "net_admin_orders_v2",
  BATCHES: "net_admin_batches_v2",
  SLIPS: "net_admin_slips_v2",
  SERIALS: "net_admin_serials_v2",
  PARTNERS: "net_admin_partners_v2",
  CURRENT_ROLE: "net_admin_user_role",
};

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: "partner-01",
    name: "Furama Resort Đà Nẵng",
    type: "hotel",
    contactPerson: "Chị Lan Anh",
    phone: "0905123456",
    email: "lananh@furama.com",
    referralCode: "FURAMA-DN",
    commissionRate: 0.15,
    notes: "Khách sạn 5 sao Bãi Bụt, đối tác chương trình du lịch xanh",
  },
  {
    id: "partner-02",
    name: "Danang Eco Tour",
    type: "tour",
    contactPerson: "Anh Tuấn Minh",
    phone: "0914987654",
    email: "tuanminh@danangecotour.vn",
    referralCode: "ECO-TOUR",
    commissionRate: 0.12,
    notes: "Tour trải nghiệm lặn biển dọn rác và trekking Sơn Trà",
  },
  {
    id: "partner-03",
    name: "Cửa hàng Lưu niệm Phố Cổ Hội An",
    type: "souvenir_shop",
    contactPerson: "Cô Mai",
    phone: "0935555666",
    referralCode: "HOIAN-GIFT",
    commissionRate: 0.10,
    notes: "Điểm ký gửi túi tote và móc khoá tái chế tại Hội An",
  },
];

export const INITIAL_BATCHES: RawNetBatch[] = [
  {
    batchId: "NET-BATCH-2026-01",
    supplierSource: "Đội Thợ Lặn Vùng Vịnh Sơn Trà",
    seaRegion: "Rạn Bãi Bụt, Sơn Trà, Đà Nẵng",
    receiveDate: "2026-10-15",
    photoUrl: "/assets/banner-nets-recycle.png",
    initialWeightKg: 85,
    weighingCondition: "wet",
    status: "processed",
    processing: {
      completedDate: "2026-10-18",
      usableDryKg: 62.5,
      discardedWasteKg: 8.5,
      moistureLossKg: 14.0,
      notes: "Lưới bám rạn đá sâu 18m, sau khi giặt sấy đạt chuẩn kéo sợi/đan túi",
      processedAt: "2026-10-18 16:30",
    },
    usableDryStockKg: 44.5,
    reusableScrapsKg: 3.2,
    history: [
      { date: "2026-10-15", action: "Tiếp nhận lưới thô", changeKg: 85, note: "Cân ướt tại bến" },
      { date: "2026-10-18", action: "Xác nhận xử lý giặt sấy", changeKg: 62.5, note: "Nhập kho lưới khô dùng được" },
      { date: "2026-10-20", action: "Xuất may đợt 1 (NET-PROD-2026-01)", changeKg: -18.0, note: "Xuất xưởng may túi Tote" },
    ],
  },
  {
    batchId: "NET-BATCH-2026-02",
    supplierSource: "Hợp tác xã Ngư dân Rạn Nam Ô",
    seaRegion: "Ghềnh Nam Ô, Liên Chiểu, Đà Nẵng",
    receiveDate: "2026-10-22",
    photoUrl: "/assets/banner-nets-recycle.png",
    initialWeightKg: 45,
    weighingCondition: "wet",
    status: "unprocessed",
    usableDryStockKg: 0, // Chưa xử lý -> Chưa cộng vào kho
    reusableScrapsKg: 0,
    history: [
      { date: "2026-10-22", action: "Tiếp nhận lưới thô", changeKg: 45, note: "Cân ướt, đang chờ giặt phân loại" },
    ],
  },
];

export const INITIAL_SLIPS: ProductionSlip[] = [
  {
    slipId: "NET-PROD-2026-01",
    createdAt: "2026-10-20 09:00",
    workshopName: "Xưởng May Thủ Công NÉT (Đà Nẵng)",
    bagModelId: "net-tote-01",
    bagModelName: "Túi Lưới NÉT — Dáng Tote Cổ Điển",
    exportedBatches: [{ batchId: "NET-BATCH-2026-01", exportedKg: 18.0 }],
    totalExportedKg: 18.0,
    status: "completed",
    sewingResult: {
      completedDate: "2026-10-22 17:00",
      passedBagsCount: 10,
      netInPassedBagsKg: 15.0, // 1.5kg / túi
      defectiveBagsCount: 1,
      returnedRawNetKg: 1.5, // Dư nguyên trả kho
      reusableScrapsKg: 1.0, // Vụn dùng tiếp
      discardedWasteKg: 0.5, // Phế phẩm cắt góc
      notes: "May đạt 10 chiếc chuẩn form, 1 chiếc lỗi đường viền cắt vụn",
    },
    weightAttributionMethod: "distributed",
    serialsCreated: true,
  },
];

export const INITIAL_SERIALS: BagSerialItem[] = Array.from({ length: 10 }, (_, i) => {
  const indexStr = String(i + 1).padStart(3, "0");
  const serialId = `NET-ST-001-${indexStr}`;
  const isPassportIssued = i < 3;
  return {
    serialId,
    slipId: "NET-PROD-2026-01",
    batchId: "NET-BATCH-2026-01",
    bagModelId: "net-tote-01",
    bagName: "Túi Lưới NÉT — Dáng Tote Cổ Điển",
    netWeightKg: 1.5,
    attributionMethod: "distributed",
    manufacturedDate: "2026-10-22",
    status: isPassportIssued ? "assigned_to_order" : "in_stock",
    assignedOrderCode: isPassportIssued ? `NET-ORD-2026-00${i + 1}` : undefined,
    passport: isPassportIssued
      ? {
          passportId: `PASS-ST-${indexStr}`,
          issuedAt: "2026-10-23 10:00",
          verifiedOrigin: "Rạn Bãi Bụt, Sơn Trà, Đà Nẵng (NET-BATCH-2026-01)",
          netWeightKg: 1.5,
          attributionMethod: "Phân bổ đều từ Phiếu NET-PROD-2026-01",
          charmStory: "Móc khoá men lam Cloisonné hình Chim Lạc viền vàng thủ công",
          personalStory: i === 0 ? "Kỷ niệm chuyến đi biển Sơn Trà 2026 cùng gia đình." : undefined,
          allowPublicStory: i === 0,
        }
      : undefined,
  };
});

export const INITIAL_ADMIN_ORDERS: AdminOrder[] = [
  {
    orderId: "ord-001",
    orderCode: "NET-ORD-2026-001",
    createdAt: "2026-10-25 14:30",
    updatedAt: "2026-10-26 09:15",
    orderType: "ready_made",
    customer: {
      fullName: "Nguyễn Thị Mai",
      phone: "0905112233",
      email: "mainguyen@gmail.com",
      address: "124 Trần Phú, Hải Châu",
      city: "Đà Nẵng",
      note: "Giao trong giờ hành chính",
    },
    items: [
      {
        id: "item-01",
        title: "Túi Lưới NÉT — Dáng Tote Cổ Điển (Xanh Biển)",
        type: "base_bag",
        price: 490000,
        quantity: 1,
        bagBaseId: "net-tote-01",
        image: "/assets/products/tote-green.jpg",
      },
      {
        id: "item-02",
        title: "Charm Men Lam Cá Voi Xanh",
        type: "charm",
        price: 150000,
        quantity: 1,
        image: "/assets/charms/whale.png",
      },
    ],
    subtotal: 640000,
    shippingFee: 30000,
    total: 670000,
    paidAmount: 670000,
    remainingAmount: 0,
    paymentStatus: "paid",
    paymentHistory: [
      {
        id: "pay-01",
        date: "2026-10-25 14:32",
        amount: 670000,
        method: "bank_transfer",
        type: "payment",
        note: "Chuyển khoản QR Techcombank",
        recordedBy: "Thu Ngân (Online)",
      },
    ],
    fulfillmentStatus: "packaging",
    partnerId: "partner-01",
    partnerCode: "FURAMA-DN",
    delivery: {
      carrier: "Viettel Post",
      trackingCode: "VT789324561",
      promisedDate: "2026-10-28",
    },
    assignedSerialIds: ["NET-ST-001-001"],
    inventoryDeducted: true,
    auditHistory: [
      { timestamp: "2026-10-25 14:30", actor: "Khách hàng", action: "Đặt hàng trực tuyến", details: "Tạo đơn qua web" },
      { timestamp: "2026-10-25 15:00", actor: "Admin", action: "Xác nhận đơn", details: "Kiểm kho & giữ mã NET-ST-001-001" },
      { timestamp: "2026-10-26 09:15", actor: "Admin", action: "Chuyển đóng gói", details: "Đang đóng hộp kèm thư tay NÉT" },
    ],
  },
  {
    orderId: "ord-002",
    orderCode: "NET-ORD-2026-002",
    createdAt: "2026-10-27 10:15",
    updatedAt: "2026-10-27 16:45",
    orderType: "custom_charm",
    customer: {
      fullName: "Trần Anh Quân",
      phone: "0918776655",
      email: "quanta@gmail.com",
      address: "45 Lê Lợi, Quận 1",
      city: "Hồ Chí Minh",
      note: "Làm charm độc bản tặng sinh nhật bạn gái",
    },
    items: [
      {
        id: "item-03",
        title: "Túi Lưới NÉT — Dáng Hobo Bo Tròn",
        type: "base_bag",
        price: 590000,
        quantity: 1,
        bagBaseId: "net-hobo-02",
        image: "/assets/products/hobo-terracotta.jpg",
      },
      {
        id: "item-04",
        title: "Charm Custom: Bé Mèo Cầm Nón Lá",
        type: "custom_charm",
        price: 250000,
        quantity: 1,
        conceptUrl: "/assets/charms/lotus.png",
      },
    ],
    subtotal: 840000,
    shippingFee: 35000,
    total: 875000,
    paidAmount: 500000,
    remainingAmount: 375000,
    paymentStatus: "deposit",
    paymentHistory: [
      {
        id: "pay-02",
        date: "2026-10-27 11:00",
        amount: 500000,
        method: "bank_transfer",
        type: "payment",
        note: "Đặt cọc thiết kế charm độc bản",
        recordedBy: "Admin",
      },
    ],
    fulfillmentStatus: "waiting_approval",
    customWorkflow: {
      conceptDescription: "Bé mèo tam thể đội nón lá Việt Nam, phong cách men lam Cloisonné viền vàng đồng",
      quotedPrice: 250000,
      estimatedDeliveryDate: "2026-11-05",
      quoteSentAt: "2026-10-27 16:00",
      clientApprovalStatus: "pending",
      approvedVersionNumber: 1,
    },
    delivery: {
      promisedDate: "2026-11-05",
    },
    inventoryDeducted: false,
    auditHistory: [
      { timestamp: "2026-10-27 10:15", actor: "Khách hàng", action: "Gửi yêu cầu Custom", details: "Mô tả bé mèo nón lá" },
      { timestamp: "2026-10-27 16:00", actor: "Admin", action: "Gửi báo giá & concept", details: "Báo giá 250.000đ, hẹn 05/11" },
    ],
  },
  {
    orderId: "ord-003",
    orderCode: "NET-ORD-2026-003",
    createdAt: "2026-10-28 08:10",
    updatedAt: "2026-10-28 08:10",
    orderType: "custom_charm",
    customer: {
      fullName: "Lê Hoàng Yến",
      phone: "0988223344",
      email: "yenlh@outlook.com",
      address: "88 Cầu Giấy",
      city: "Hà Nội",
      note: "Cần tư vấn phối hoa sen viền vàng",
    },
    items: [
      {
        id: "item-05",
        title: "Charm Custom: Hoa Sen Men Ngọc Độc Bản",
        type: "custom_charm",
        price: 0,
        quantity: 1,
      },
    ],
    subtotal: 0,
    shippingFee: 0,
    total: 0,
    paidAmount: 0,
    remainingAmount: 0,
    paymentStatus: "unpaid",
    paymentHistory: [],
    fulfillmentStatus: "quote_needed",
    customWorkflow: {
      conceptDescription: "Bông sen ngọc 5 cánh, đính ngọc trai nhân tạo, viền đồng",
      clientApprovalStatus: "pending",
    },
    delivery: {},
    inventoryDeducted: false,
    auditHistory: [
      { timestamp: "2026-10-28 08:10", actor: "Khách hàng", action: "Tạo yêu cầu custom mới", details: "Đang chờ Admin báo giá" },
    ],
  },
];

// ============================================================================
// 3. STORAGE GETTERS & SETTERS (Local-first with high reliability)
// ============================================================================

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Orders
export function getAdminOrders(): AdminOrder[] {
  return readStorage<AdminOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ADMIN_ORDERS);
}

export function saveAdminOrder(order: AdminOrder): AdminOrder[] {
  const all = getAdminOrders();
  const idx = all.findIndex((o) => o.orderId === order.orderId);
  const updated = idx >= 0 ? all.map((o) => (o.orderId === order.orderId ? order : o)) : [order, ...all];
  writeStorage(STORAGE_KEYS.ORDERS, updated);
  return updated;
}

export function deleteAdminOrder(orderId: string): AdminOrder[] {
  const all = getAdminOrders().filter((o) => o.orderId !== orderId);
  writeStorage(STORAGE_KEYS.ORDERS, all);
  return all;
}

// Batches
export function getAdminBatches(): RawNetBatch[] {
  return readStorage<RawNetBatch[]>(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
}

export function saveAdminBatch(batch: RawNetBatch): RawNetBatch[] {
  const all = getAdminBatches();
  const idx = all.findIndex((b) => b.batchId === batch.batchId);
  const updated = idx >= 0 ? all.map((b) => (b.batchId === batch.batchId ? batch : b)) : [batch, ...all];
  writeStorage(STORAGE_KEYS.BATCHES, updated);
  return updated;
}

// Production Slips
export function getAdminSlips(): ProductionSlip[] {
  return readStorage<ProductionSlip[]>(STORAGE_KEYS.SLIPS, INITIAL_SLIPS);
}

export function saveAdminSlip(slip: ProductionSlip): ProductionSlip[] {
  const all = getAdminSlips();
  const idx = all.findIndex((s) => s.slipId === slip.slipId);
  const updated = idx >= 0 ? all.map((s) => (s.slipId === slip.slipId ? slip : s)) : [slip, ...all];
  writeStorage(STORAGE_KEYS.SLIPS, updated);
  return updated;
}

// Serials & Passports
export function getAdminSerials(): BagSerialItem[] {
  return readStorage<BagSerialItem[]>(STORAGE_KEYS.SERIALS, INITIAL_SERIALS);
}

export function saveAdminSerial(serial: BagSerialItem): BagSerialItem[] {
  const all = getAdminSerials();
  const idx = all.findIndex((s) => s.serialId === serial.serialId);
  const updated = idx >= 0 ? all.map((s) => (s.serialId === serial.serialId ? serial : s)) : [serial, ...all];
  writeStorage(STORAGE_KEYS.SERIALS, updated);
  return updated;
}

// Partners
export function getAdminPartners(): Partner[] {
  return readStorage<Partner[]>(STORAGE_KEYS.PARTNERS, INITIAL_PARTNERS);
}

export function saveAdminPartner(partner: Partner): Partner[] {
  const all = getAdminPartners();
  const idx = all.findIndex((p) => p.id === partner.id);
  const updated = idx >= 0 ? all.map((p) => (p.id === partner.id ? partner : p)) : [partner, ...all];
  writeStorage(STORAGE_KEYS.PARTNERS, updated);
  return updated;
}

export function deleteAdminPartner(partnerId: string): Partner[] {
  const all = getAdminPartners().filter((p) => p.id !== partnerId);
  writeStorage(STORAGE_KEYS.PARTNERS, all);
  return all;
}

// Role Switcher (Req 25)
export type AdminRole = "admin" | "orders_staff" | "warehouse_staff";

export function getAdminRole(): AdminRole {
  if (typeof window === "undefined") return "admin";
  return (localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) as AdminRole) || "admin";
}

export function setAdminRole(role: AdminRole): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, role);
}

// Reset sandbox (Req 26)
export function resetAdminSandboxData(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ADMIN_ORDERS));
  localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
  localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(INITIAL_SLIPS));
  localStorage.setItem(STORAGE_KEYS.SERIALS, JSON.stringify(INITIAL_SERIALS));
  localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(INITIAL_PARTNERS));
}
