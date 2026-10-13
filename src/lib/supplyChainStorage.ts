import { NetPack, ManufacturedBagItem, Order, BagBase, BagMeshColor } from "@/types";
import { BAG_BASES, BAG_COLORS } from "@/data/products";

const NET_PACKS_KEY = "net_packs_v1";
const MANUFACTURED_ITEMS_KEY = "net_manufactured_items_v1";
const ORDERS_STORAGE_KEY = "net_orders_v1";

// Initial seed data: Để trống hoàn toàn để hệ thống dùng 100% dữ liệu thực từ Cloud Firestore & Admin
const INITIAL_NET_PACKS: NetPack[] = [];
const INITIAL_MANUFACTURED_ITEMS: ManufacturedBagItem[] = [];

// Initial orders list: Empty by default so only real orders from DB & customers appear
const INITIAL_ORDERS: Order[] = [];

// -------------------------------------------------------------
// 1. NET PACK OPERATIONS
// -------------------------------------------------------------
export function getAllNetPacks(): NetPack[] {
  if (typeof window === "undefined") return INITIAL_NET_PACKS;
  try {
    const raw = localStorage.getItem(NET_PACKS_KEY);
    if (!raw) {
      localStorage.setItem(NET_PACKS_KEY, JSON.stringify(INITIAL_NET_PACKS));
      return INITIAL_NET_PACKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading net packs:", e);
    return INITIAL_NET_PACKS;
  }
}

export function saveNetPack(pack: NetPack): NetPack[] {
  if (typeof window === "undefined") return [pack, ...INITIAL_NET_PACKS];
  try {
    const all = getAllNetPacks();
    const index = all.findIndex((p) => p.packId === pack.packId);
    let updated: NetPack[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = pack;
    } else {
      updated = [pack, ...all];
    }
    localStorage.setItem(NET_PACKS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Error saving net pack:", e);
    return INITIAL_NET_PACKS;
  }
}

export function getNetPackById(packId: string): NetPack | undefined {
  const packs = getAllNetPacks();
  return packs.find((p) => p.packId.toLowerCase() === packId.trim().toLowerCase());
}

// -------------------------------------------------------------
// 2. FINISHED GOODS & SERIAL AUTO-GENERATION
// -------------------------------------------------------------
export function getManufacturedItems(): ManufacturedBagItem[] {
  if (typeof window === "undefined") return INITIAL_MANUFACTURED_ITEMS;
  try {
    const raw = localStorage.getItem(MANUFACTURED_ITEMS_KEY);
    if (!raw) {
      localStorage.setItem(MANUFACTURED_ITEMS_KEY, JSON.stringify(INITIAL_MANUFACTURED_ITEMS));
      return INITIAL_MANUFACTURED_ITEMS;
    }
    const parsed: ManufacturedBagItem[] = JSON.parse(raw);
    let changed = false;
    const cleaned = parsed.map((item) => {
      if (item.assignedOrderCode && ["NET-ORD-8821", "NET-ORD-8822", "NET-ORD-8823"].includes(item.assignedOrderCode)) {
        changed = true;
        return {
          ...item,
          status: "in_stock" as const,
          assignedOrderCode: undefined,
          isClaimed: false,
          warrantyStatus: "unactivated" as const,
          claimedBy: undefined,
        };
      }
      return item;
    });
    if (changed) {
      localStorage.setItem(MANUFACTURED_ITEMS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error("Error reading manufactured items:", e);
    return INITIAL_MANUFACTURED_ITEMS;
  }
}

export interface ManufactureParams {
  packId: string;
  bagBaseId: string;
  colorId: string;
  quantity: number;
  workshopName: string;
  customProduct?: {
    id: string;
    name: string;
    plasticOffsetKg?: number;
  };
}

export function manufactureBags(params: ManufactureParams): {
  success: boolean;
  message: string;
  newItems: ManufacturedBagItem[];
} {
  const packs = getAllNetPacks();
  const pack = packs.find((p) => p.packId === params.packId);
  if (!pack) {
    return { success: false, message: "Không tìm thấy Kiện Lưới nguồn!", newItems: [] };
  }

  // Đối chiếu mẫu túi từ sản phẩm Bộ Sưu Tập hoặc BAG_BASES
  const matchedBagBase = BAG_BASES.find((b) => b.id === params.bagBaseId);
  const bagName = params.customProduct?.name || matchedBagBase?.name || "Túi Lưới Tái Sinh";
  const netRequiredPerBag = Number(
    params.customProduct?.plasticOffsetKg || matchedBagBase?.plasticOffsetKg || 1.8
  );
  const targetBagId = params.customProduct?.id || matchedBagBase?.id || params.bagBaseId;

  const color = BAG_COLORS.find((c) => c.id === params.colorId) || BAG_COLORS[0];
  const totalNetNeeded = Number((netRequiredPerBag * params.quantity).toFixed(2));

  if (pack.remainingWeightKg < totalNetNeeded) {
    return {
      success: false,
      message: `Khối lượng lưới khả dụng trong Kiện (${pack.remainingWeightKg}kg) không đủ để sản xuất ${params.quantity} túi (cần ${totalNetNeeded}kg, định mức ~${netRequiredPerBag}kg/túi)! Vui lòng giảm số lượng hoặc nhập thêm kiện lưới ma mới.`,
      newItems: [],
    };
  }

  // Deduct weight from Pack
  const updatedRemaining = Number((pack.remainingWeightKg - totalNetNeeded).toFixed(2));
  pack.remainingWeightKg = updatedRemaining;
  pack.status = updatedRemaining <= 0 ? "depleted" : "in_production";
  saveNetPack(pack);

  // Generate unique serial numbers with precise timestamps
  const existingItems = getManufacturedItems();
  const packItemsCount = existingItems.filter((i) => i.sourcePackId === pack.packId).length;

  const now = new Date();
  const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Region abbreviation for serial ID
  let regionCode = "VN";
  if (pack.seaRegion.includes("Sơn Trà")) regionCode = "ST";
  else if (pack.seaRegion.includes("Nam Ô")) regionCode = "NO";
  else if (pack.seaRegion.includes("Cù Lao Chàm")) regionCode = "CLC";
  else if (pack.seaRegion.includes("Côn Đảo")) regionCode = "CD";

  // Extract number from pack ID, e.g. "PACK-DN-2024-082" -> "082"
  const packNumberMatch = pack.packId.match(/\d+$/);
  const packSuffix = packNumberMatch ? packNumberMatch[0] : "01";

  const newItems: ManufacturedBagItem[] = [];
  for (let i = 1; i <= params.quantity; i++) {
    const itemIndex = packItemsCount + i;
    const serialId = `NET-${regionCode}-${packSuffix}-${String(itemIndex).padStart(3, "0")}`;
    const barcode = `893882${packSuffix}${String(itemIndex).padStart(3, "0")}`;
    const nfcTagUid = `04:${packSuffix}:${String(itemIndex).padStart(2, "0")}:B2:C1`;

    newItems.push({
      serialId,
      sourcePackId: pack.packId,
      bagBaseId: targetBagId,
      bagName,
      colorId: color.id,
      colorName: color.name,
      manufacturedAt: dateFormatted,
      workshopName: params.workshopName || "Xưởng Thủ Công NÉT",
      seaRegion: pack.seaRegion,
      coordinates: pack.coordinates,
      plasticConsumedKg: netRequiredPerBag,
      status: "in_stock",
      qrUrl: `/passport/${encodeURIComponent(pack.packId)}?itemId=${encodeURIComponent(serialId)}`,
      barcode,
      nfcTagUid,
      isClaimed: false,
      warrantyStatus: "unactivated",
      warrantyMonths: 24,
    });
  }

  // Save new items
  const allItems = [...newItems, ...existingItems];
  if (typeof window !== "undefined") {
    localStorage.setItem(MANUFACTURED_ITEMS_KEY, JSON.stringify(allItems));
  }

  return {
    success: true,
    message: `Đã sản xuất thành công ${params.quantity} chiếc "${bagName}" (tiêu thụ ${totalNetNeeded}kg lưới từ ${pack.packId}) và cấp ${params.quantity} mã định danh & mã vạch độc bản!`,
    newItems,
  };
}

/**
 * Lấy số lượng túi thành phẩm thực tế đang có sẵn trong kho (in_stock, chưa bán, chưa claim)
 * cho một sản phẩm cụ thể (đối chiếu theo id, tên hoặc category)
 */
export function getInStockCountForProduct(
  productId: string,
  productName?: string,
  category?: string
): number {
  const items = getManufacturedItems();
  return items.filter(
    (item) =>
      item.status === "in_stock" &&
      !item.isClaimed &&
      (item.bagBaseId === productId ||
        (category && item.bagBaseId === category) ||
        (productName && item.bagName.trim().toLowerCase() === productName.trim().toLowerCase()))
  ).length;
}

export function getManufacturedItemBySerial(serialId: string): ManufacturedBagItem | undefined {
  const items = getManufacturedItems();
  return items.find((i) => i.serialId.toLowerCase() === serialId.trim().toLowerCase());
}

export function claimBagWarranty(
  serialId: string,
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    customerUid?: string;
  }
): { success: boolean; message: string; item?: ManufacturedBagItem } {
  const items = getManufacturedItems();
  const item = items.find((i) => i.serialId.toLowerCase() === serialId.trim().toLowerCase());
  if (!item) {
    return { success: false, message: "Không tìm thấy mã sản phẩm trong hệ thống!" };
  }

  const now = new Date();
  const activatedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const expiryYear = now.getFullYear() + Math.round((item.warrantyMonths || 24) / 12);
  const expiryDate = `${expiryYear}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  item.isClaimed = true;
  item.warrantyStatus = "active";
  item.warrantyActivatedAt = activatedDate;
  item.warrantyExpiresAt = expiryDate;
  item.claimedBy = customer;

  if (typeof window !== "undefined") {
    localStorage.setItem(MANUFACTURED_ITEMS_KEY, JSON.stringify(items));

    // Also sync to customer's personal wardrobe bag items (net_bag_items_v1)
    try {
      const rawUserBags = localStorage.getItem("net_bag_items_v1");
      const userBags = rawUserBags ? JSON.parse(rawUserBags) : [];
      const exists = userBags.some((b: any) => b.itemId === item.serialId);
      if (!exists) {
        userBags.unshift({
          itemId: item.serialId,
          parentBatchId: item.sourcePackId,
          itemIndex: 1,
          bagName: item.bagName,
          colorName: item.colorName,
          ownerUid: customer.customerUid || "guest-claim",
          ownerName: customer.fullName,
          ownerPhone: customer.phone,
          selectedCharms: [],
          poeticDedication: `Kỷ vật bảo hành điện tử chính hãng đến ${expiryDate}`,
          plasticOffsetKg: item.plasticConsumedKg,
          coralProtectedSqM: Number((item.plasticConsumedKg * 1.5).toFixed(1)),
          co2AvoidedKg: Number((item.plasticConsumedKg * 1.9).toFixed(1)),
          qrUrl: item.qrUrl,
          createdAt: activatedDate,
        });
        localStorage.setItem("net_bag_items_v1", JSON.stringify(userBags));
      }
    } catch (e) {}

    // Đồng bộ trực tiếp lên Cloud Firestore
    import("@/lib/firestoreService").then(({ syncSingleItemToFirestore }) => {
      syncSingleItemToFirestore(item).catch(() => {});
    });
  }

  return {
    success: true,
    message: `Đã kích hoạt bảo hành điện tử 24 tháng thành công cho ${customer.fullName}!`,
    item,
  };
}

export interface CreatePackWithPlanParams {
  packId: string;
  seaRegion: string;
  locationDetails: string;
  coordinates: { lat: number; lng: number };
  recoveryDate: string;
  totalWeightKg: number;
  depthMeters: number;
  diverTeam: string;
  netPolymer: string;
  notes?: string;
  // Factory Plan
  bagBaseId: string;
  colorId: string;
  quantity: number;
  workshopName: string;
}

export function createNetPackWithBatchPlan(params: CreatePackWithPlanParams): {
  success: boolean;
  message: string;
  pack: NetPack;
  newItems: ManufacturedBagItem[];
} {
  const bag = BAG_BASES.find((b) => b.id === params.bagBaseId) || BAG_BASES[0];
  const color = BAG_COLORS.find((c) => c.id === params.colorId) || BAG_COLORS[0];
  const netRequiredPerBag = bag.plasticOffsetKg;
  const totalNetNeeded = Number((netRequiredPerBag * params.quantity).toFixed(2));

  if (params.totalWeightKg < totalNetNeeded) {
    return {
      success: false,
      message: `Khối lượng kiện lưới (${params.totalWeightKg}kg) không đủ để sản xuất ${params.quantity} túi (cần ${totalNetNeeded}kg)!`,
      pack: null as any,
      newItems: [],
    };
  }

  const remainingKg = Number((params.totalWeightKg - totalNetNeeded).toFixed(2));

  // Determine Region Abbreviation
  let regionCode = "VN";
  if (params.seaRegion.includes("Sơn Trà")) regionCode = "ST";
  else if (params.seaRegion.includes("Nam Ô")) regionCode = "NO";
  else if (params.seaRegion.includes("Cù Lao Chàm")) regionCode = "CLC";
  else if (params.seaRegion.includes("Côn Đảo")) regionCode = "CD";

  const packNumberMatch = params.packId.match(/\d+$/);
  const packSuffix = packNumberMatch ? packNumberMatch[0] : "01";

  const serialRangeStart = `NET-${regionCode}-${packSuffix}-001`;
  const serialRangeEnd = `NET-${regionCode}-${packSuffix}-${String(params.quantity).padStart(3, "0")}`;
  const barcodeRangeStart = `893882${packSuffix}001`;
  const barcodeRangeEnd = `893882${packSuffix}${String(params.quantity).padStart(3, "0")}`;

  const newPack: NetPack = {
    packId: params.packId.trim().toUpperCase(),
    seaRegion: params.seaRegion,
    locationDetails: params.locationDetails,
    coordinates: params.coordinates,
    recoveryDate: params.recoveryDate,
    totalWeightKg: params.totalWeightKg,
    remainingWeightKg: remainingKg,
    depthMeters: params.depthMeters,
    diverTeam: params.diverTeam,
    netPolymer: params.netPolymer,
    status: remainingKg <= 0 ? "depleted" : "in_production",
    notes: params.notes,
    createdAt: new Date().toISOString(),
    producedBagModel: bag.name,
    producedBagCount: params.quantity,
    serialRangeStart,
    serialRangeEnd,
    barcodeRangeStart,
    barcodeRangeEnd,
  };

  saveNetPack(newPack);

  // Auto-generate items
  const now = new Date();
  const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const newItems: ManufacturedBagItem[] = [];

  for (let i = 1; i <= params.quantity; i++) {
    const serialId = `NET-${regionCode}-${packSuffix}-${String(i).padStart(3, "0")}`;
    const barcode = `893882${packSuffix}${String(i).padStart(3, "0")}`;
    const nfcTagUid = `04:${packSuffix}:${String(i).padStart(2, "0")}:B2:C1`;

    newItems.push({
      serialId,
      sourcePackId: newPack.packId,
      bagBaseId: bag.id,
      bagName: bag.name,
      colorId: color.id,
      colorName: color.name,
      manufacturedAt: dateFormatted,
      workshopName: params.workshopName || "Xưởng Thủ Công NÉT",
      seaRegion: newPack.seaRegion,
      coordinates: newPack.coordinates,
      plasticConsumedKg: netRequiredPerBag,
      status: "in_stock",
      qrUrl: `/passport/${encodeURIComponent(newPack.packId)}?itemId=${encodeURIComponent(serialId)}`,
      barcode,
      nfcTagUid,
      isClaimed: false,
      warrantyStatus: "unactivated",
      warrantyMonths: 24,
    });
  }

  const existingItems = getManufacturedItems();
  const allItems = [...newItems, ...existingItems];
  if (typeof window !== "undefined") {
    localStorage.setItem(MANUFACTURED_ITEMS_KEY, JSON.stringify(allItems));
  }

  return {
    success: true,
    message: `Đã nhập Kiện Lưới ${newPack.packId} thành công! Tự động cấp ${params.quantity} túi thành phẩm (${serialRangeStart} ➔ ${serialRangeEnd}) với mã vạch may lót tương ứng!`,
    pack: newPack,
    newItems,
  };
}

// -------------------------------------------------------------
// 3. ORDERS MANAGEMENT
// -------------------------------------------------------------
export function getAllOrders(): Order[] {
  if (typeof window === "undefined") return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed: Order[] = JSON.parse(raw);
    const cleaned = parsed.filter(
      (o) => !["NET-ORD-8821", "NET-ORD-8822", "NET-ORD-8823"].includes(o.orderCode)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error("Error reading orders:", e);
    return INITIAL_ORDERS;
  }
}

export function updateOrderStatus(orderId: string, status: Order["fulfillmentStatus"]): Order[] {
  const orders = getAllOrders();
  const updated = orders.map((o) => (o.orderId === orderId ? { ...o, fulfillmentStatus: status } : o));
  if (typeof window !== "undefined") {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function deleteOrderById(orderId: string): Order[] {
  const orders = getAllOrders().filter((o) => o.orderId !== orderId && o.orderCode !== orderId);
  if (typeof window !== "undefined") {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }
  return orders;
}

export function saveNewOrder(order: Order): Order[] {
  const orders = getAllOrders();
  const exists = orders.some((o) => o.orderId === order.orderId);
  const updated = exists
    ? orders.map((o) => (o.orderId === order.orderId ? order : o))
    : [order, ...orders];
  if (typeof window !== "undefined") {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function assignBagToOrder(orderId: string, serialId: string): { success: boolean; message: string } {
  const orders = getAllOrders();
  const order = orders.find((o) => o.orderId === orderId);
  if (!order) return { success: false, message: "Không tìm thấy đơn hàng!" };

  const items = getManufacturedItems();
  const bagItem = items.find((i) => i.serialId === serialId);
  if (!bagItem) return { success: false, message: "Không tìm thấy sản phẩm trong kho!" };

  // Update item status
  bagItem.status = "assigned_to_order";
  bagItem.assignedOrderCode = order.orderCode;
  if (typeof window !== "undefined") {
    localStorage.setItem(MANUFACTURED_ITEMS_KEY, JSON.stringify(items));
  }

  // Update order with assigned serial
  order.assignedBagSerialId = serialId;
  if (typeof window !== "undefined") {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }

  return {
    success: true,
    message: `Đã gán thành công mã túi ${serialId} cho đơn hàng #${order.orderCode}!`,
  };
}

// -------------------------------------------------------------
// 4. OVERALL SUPPLY CHAIN & SALES STATS
// -------------------------------------------------------------
export function getSupplyChainStats() {
  const packs = getAllNetPacks();
  const items = getManufacturedItems();
  const orders = getAllOrders();

  // Sales revenue
  const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === "paid" ? o.total : o.total), 0);
  const paidOrdersCount = orders.filter((o) => o.paymentStatus === "paid").length;
  const pendingOrdersCount = orders.filter((o) => o.fulfillmentStatus === "received").length;
  const craftingOrdersCount = orders.filter((o) => o.fulfillmentStatus === "crafting").length;
  const deliveringOrdersCount = orders.filter((o) => o.fulfillmentStatus === "delivering").length;
  const completedOrdersCount = orders.filter((o) => o.fulfillmentStatus === "delivered").length;

  // Raw Net Supply
  const totalNetPacksCount = packs.length;
  const totalNetWeightRecovered = packs.reduce((sum, p) => sum + p.totalWeightKg, 0);
  const remainingNetWeight = packs.reduce((sum, p) => sum + p.remainingWeightKg, 0);
  const consumedNetWeight = Number((totalNetWeightRecovered - remainingNetWeight).toFixed(1));

  // Manufactured Goods
  const totalBagsManufactured = items.length;
  const bagsInStock = items.filter((i) => i.status === "in_stock").length;
  const bagsSold = items.filter((i) => i.status !== "in_stock").length;

  return {
    totalRevenue,
    paidOrdersCount,
    totalOrdersCount: orders.length,
    pendingOrdersCount,
    craftingOrdersCount,
    deliveringOrdersCount,
    completedOrdersCount,
    totalNetPacksCount,
    totalNetWeightRecovered,
    remainingNetWeight,
    consumedNetWeight,
    totalBagsManufactured,
    bagsInStock,
    bagsSold,
  };
}

// -------------------------------------------------------------
// 5. AUTOMATIC INVENTORY DEDUCTION ON PURCHASE
// -------------------------------------------------------------
export function deductInventoryForOrder(order: Order): {
  success: boolean;
  assignedSerialIds: string[];
} {
  const items = getManufacturedItems();
  const assignedSerialIds: string[] = [];

  for (const cartItem of order.items) {
    const qty = cartItem.quantity || 1;
    for (let q = 0; q < qty; q++) {
      // Find an in-stock bag matching model or fallback
      let matchedIndex = items.findIndex(
        (i) =>
          i.status === "in_stock" &&
          (cartItem.title.toLowerCase().includes(i.bagName.toLowerCase()) ||
            i.bagName.toLowerCase().includes(cartItem.title.toLowerCase()))
      );

      // Fallback: any available in_stock item
      if (matchedIndex === -1) {
        matchedIndex = items.findIndex((i) => i.status === "in_stock");
      }

      if (matchedIndex !== -1) {
        const item = items[matchedIndex];
        item.status = "assigned_to_order";
        item.assignedOrderCode = order.orderCode;
        assignedSerialIds.push(item.serialId);

        // Async sync to Firestore
        if (typeof window !== "undefined") {
          import("@/lib/firestoreService").then(({ syncSingleItemToFirestore }) => {
            syncSingleItemToFirestore(item).catch(() => {});
          });
        }
      }
    }
  }

  if (assignedSerialIds.length > 0) {
    if (typeof window !== "undefined") {
      localStorage.setItem(MANUFACTURED_ITEMS_KEY, JSON.stringify(items));
    }
    order.assignedBagSerialId = assignedSerialIds[0];
  }

  return {
    success: assignedSerialIds.length > 0,
    assignedSerialIds,
  };
}

// -------------------------------------------------------------
// 6. EXPORT INVENTORY TO CSV / EXCEL
// -------------------------------------------------------------
export function exportInventoryToCSV(): void {
  if (typeof window === "undefined") return;
  const items = getManufacturedItems();

  const headers = [
    "Mã Serial (Serial ID)",
    "Mã Vạch May Lót (Barcode 128)",
    "Dáng Túi",
    "Màu Sắc",
    "Kiện Lưới Nguồn",
    "Vùng Biển Trục Vớt",
    "Thời Điểm May",
    "Xưởng May",
    "Trạng Thái Kho",
    "Mã Đơn Hàng Gán",
    "Bảo Hành NFC",
    "Tên Chủ Sở Hữu",
    "SĐT Chủ Sở Hữu",
    "Hạn Bảo Hành Đến",
    "NFC Chip UID",
    "Nhựa Thu Hồi (kg)",
  ];

  const rows = items.map((i) => [
    `"${i.serialId}"`,
    `"${i.barcode || ""}"`,
    `"${i.bagName}"`,
    `"${i.colorName}"`,
    `"${i.sourcePackId}"`,
    `"${i.seaRegion}"`,
    `"${i.manufacturedAt}"`,
    `"${i.workshopName}"`,
    `"${i.status === "in_stock" ? "Còn trong kho" : "Đã xuất kho theo đơn"}"`,
    `"${i.assignedOrderCode || ""}"`,
    `"${i.isClaimed ? "Đã kích hoạt" : "Chưa kích hoạt"}"`,
    `"${i.claimedBy?.fullName || ""}"`,
    `"${i.claimedBy?.phone || ""}"`,
    `"${i.warrantyExpiresAt || ""}"`,
    `"${i.nfcTagUid || ""}"`,
    `"${i.plasticConsumedKg}"`,
  ]);

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  link.setAttribute("download", `NET_Kiem_Ke_Kho_Thanh_Pham_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Reset sạch toàn bộ kho và kiện lưới trong LocalStorage về mảng rỗng
 */
export function clearLocalSupplyChainData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(NET_PACKS_KEY);
    localStorage.removeItem(MANUFACTURED_ITEMS_KEY);
    localStorage.setItem(NET_PACKS_KEY, JSON.stringify([]));
    localStorage.setItem(MANUFACTURED_ITEMS_KEY, JSON.stringify([]));
  }
}


