import { NetPack, ManufacturedBagItem, Order, BagBase, BagMeshColor } from "@/types";
import { BAG_BASES, BAG_COLORS } from "@/data/products";

const NET_PACKS_KEY = "net_packs_v1";
const MANUFACTURED_ITEMS_KEY = "net_manufactured_items_v1";
const ORDERS_STORAGE_KEY = "net_orders_v1";

// Initial seed data for Net Packs
const INITIAL_NET_PACKS: NetPack[] = [
  {
    packId: "PACK-DN-2024-082",
    seaRegion: "Rạn San Hô Bán Đảo Sơn Trà, Đà Nẵng",
    locationDetails: "Tọa độ rạn Bãi Bụt, độ sâu đáy 24m",
    coordinates: { lat: 16.1124, lng: 108.2619 },
    recoveryDate: "2026-09-18",
    totalWeightKg: 65,
    remainingWeightKg: 33,
    depthMeters: 24,
    diverTeam: "Danang SAS Volunteer Divers",
    netPolymer: "Nylon-6 (Polyamide)",
    status: "in_production",
    notes: "Lưới rê đánh bắt mực vô chủ chùm lên rạn san hô sừng hươu",
    createdAt: "2026-09-18T10:30:00Z",
  },
  {
    packId: "PACK-NO-2024-045",
    seaRegion: "Vùng Biển Nam Ô, Liên Chiểu, Đà Nẵng",
    locationDetails: "Mỏm đá Rạn Nam Ô, độ sâu 16m",
    coordinates: { lat: 16.1422, lng: 108.1255 },
    recoveryDate: "2026-09-28",
    totalWeightKg: 48,
    remainingWeightKg: 22,
    depthMeters: 16,
    diverTeam: "Hợp Tác Xã Ngư Dân Nam Ô",
    netPolymer: "Polyethylene & PA66",
    status: "in_production",
    notes: "Lưới cào đáy vướng rạn đá cổ, đã rửa sạch muối cơ học",
    createdAt: "2026-09-28T08:15:00Z",
  },
  {
    packId: "PACK-CLC-2024-019",
    seaRegion: "Khu Bảo Tồn Biển Cù Lao Chàm, Quảng Nam",
    locationDetails: "Khu vực Bãi Chồng - Hòn Lao, độ sâu 28m",
    coordinates: { lat: 15.9521, lng: 108.5142 },
    recoveryDate: "2026-10-02",
    totalWeightKg: 80,
    remainingWeightKg: 64,
    depthMeters: 28,
    diverTeam: "Đội Tuần Tra Bảo Tồn Biển Cù Lao Chàm",
    netPolymer: "Nylon-6 Marine High-Grade",
    status: "in_production",
    notes: "Lưới vây lớn giải cứu 8 cá thể đồi mồi và cá ngựa",
    createdAt: "2026-10-02T14:00:00Z",
  },
  {
    packId: "PACK-CD-2024-007",
    seaRegion: "Vườn Quốc Gia Côn Đảo, Bà Rịa - Vũng Tàu",
    locationDetails: "Hòn Bảy Cạnh, bãi đẻ rùa biển, độ sâu 12m",
    coordinates: { lat: 8.6833, lng: 106.6 },
    recoveryDate: "2026-10-05",
    totalWeightKg: 55,
    remainingWeightKg: 55,
    depthMeters: 12,
    diverTeam: "Kiểm Lâm VQG Côn Đảo & WWF",
    netPolymer: "Nylon Monofilament",
    status: "new",
    notes: "Lưới bén sợi trong suốt, đã khử trùng sinh thái",
    createdAt: "2026-10-05T09:00:00Z",
  },
];

// Initial seed data for Manufactured Items (with unique Serials and timestamps)
const INITIAL_MANUFACTURED_ITEMS: ManufacturedBagItem[] = [
  {
    serialId: "NET-ST-082-001",
    sourcePackId: "PACK-DN-2024-082",
    bagBaseId: "net-tote-01",
    bagName: "NÉT Tote Signature",
    colorId: "abyss-blue",
    colorName: "Xanh Thẳm Đại Dương",
    manufacturedAt: "2026-10-06 09:15",
    workshopName: "Làng nghề đan lưới Nam Ô",
    seaRegion: "Rạn San Hô Bán Đảo Sơn Trà, Đà Nẵng",
    coordinates: { lat: 16.1124, lng: 108.2619 },
    plasticConsumedKg: 1.6,
    status: "assigned_to_order",
    assignedOrderCode: "NET-ORD-8821",
    qrUrl: "/passport/PACK-DN-2024-082?itemId=NET-ST-082-001",
    barcode: "893882082001",
    nfcTagUid: "04:82:01:B2:C1",
    isClaimed: true,
    warrantyStatus: "active",
    warrantyMonths: 24,
    warrantyActivatedAt: "2026-10-09 10:20",
    warrantyExpiresAt: "2028-10-09",
    claimedBy: {
      fullName: "Lê Minh Thảo",
      phone: "0905 882 119",
      email: "thao.le@gmail.com",
    },
  },
  {
    serialId: "NET-ST-082-002",
    sourcePackId: "PACK-DN-2024-082",
    bagBaseId: "net-tote-01",
    bagName: "NÉT Tote Signature",
    colorId: "kelp-emerald",
    colorName: "Lục Tảo Biển Sâu",
    manufacturedAt: "2026-10-06 10:30",
    workshopName: "Làng nghề đan lưới Nam Ô",
    seaRegion: "Rạn San Hô Bán Đảo Sơn Trà, Đà Nẵng",
    coordinates: { lat: 16.1124, lng: 108.2619 },
    plasticConsumedKg: 1.6,
    status: "in_stock",
    qrUrl: "/passport/PACK-DN-2024-082?itemId=NET-ST-082-002",
    barcode: "893882082002",
    nfcTagUid: "04:82:02:B2:C1",
    isClaimed: false,
    warrantyStatus: "unactivated",
    warrantyMonths: 24,
  },
  {
    serialId: "NET-ST-082-003",
    sourcePackId: "PACK-DN-2024-082",
    bagBaseId: "net-crossbody-02",
    bagName: "NÉT Crossbody Mini",
    colorId: "coral-sand",
    colorName: "Cát San Hô Ánh Dương",
    manufacturedAt: "2026-10-07 14:00",
    workshopName: "Xưởng NÉT Sơn Trà Studio",
    seaRegion: "Rạn San Hô Bán Đảo Sơn Trà, Đà Nẵng",
    coordinates: { lat: 16.1124, lng: 108.2619 },
    plasticConsumedKg: 0.9,
    status: "in_stock",
    qrUrl: "/passport/PACK-DN-2024-082?itemId=NET-ST-082-003",
    barcode: "893882082003",
    nfcTagUid: "04:82:03:B2:C1",
    isClaimed: false,
    warrantyStatus: "unactivated",
    warrantyMonths: 24,
  },
  {
    serialId: "NET-NO-045-001",
    sourcePackId: "PACK-NO-2024-045",
    bagBaseId: "net-bucket-03",
    bagName: "NÉT Ocean Bucket",
    colorId: "abyss-blue",
    colorName: "Xanh Thẳm Đại Dương",
    manufacturedAt: "2026-10-08 11:20",
    workshopName: "Làng nghề đan lưới Nam Ô",
    seaRegion: "Vùng Biển Nam Ô, Liên Chiểu, Đà Nẵng",
    coordinates: { lat: 16.1422, lng: 108.1255 },
    plasticConsumedKg: 1.3,
    status: "assigned_to_order",
    assignedOrderCode: "NET-ORD-8822",
    qrUrl: "/passport/PACK-NO-2024-045?itemId=NET-NO-045-001",
    barcode: "893882045001",
    nfcTagUid: "04:45:01:B2:C1",
    isClaimed: true,
    warrantyStatus: "active",
    warrantyMonths: 24,
    warrantyActivatedAt: "2026-10-09 16:30",
    warrantyExpiresAt: "2028-10-09",
    claimedBy: {
      fullName: "Trần Anh Khoa",
      phone: "0912 345 678",
      email: "khoa.tran@gmail.com",
    },
  },
  {
    serialId: "NET-NO-045-002",
    sourcePackId: "PACK-NO-2024-045",
    bagBaseId: "net-clutch-04",
    bagName: "NÉT Evening Clutch",
    colorId: "ghost-pearl",
    colorName: "Bạc Lưới Ma Tinh Khiết",
    manufacturedAt: "2026-10-08 16:45",
    workshopName: "Xưởng NÉT Sơn Trà Studio",
    seaRegion: "Vùng Biển Nam Ô, Liên Chiểu, Đà Nẵng",
    coordinates: { lat: 16.1422, lng: 108.1255 },
    plasticConsumedKg: 0.7,
    status: "in_stock",
    qrUrl: "/passport/PACK-NO-2024-045?itemId=NET-NO-045-002",
    barcode: "893882045002",
    nfcTagUid: "04:45:02:B2:C1",
    isClaimed: false,
    warrantyStatus: "unactivated",
    warrantyMonths: 24,
  },
];

// Initial mock orders if none exist
const INITIAL_ORDERS: Order[] = [
  {
    orderId: "ord-seed-01",
    orderCode: "NET-ORD-8821",
    createdAt: "2026-10-09T08:30:00Z",
    customer: {
      fullName: "Lê Minh Thảo",
      phone: "0905 882 119",
      email: "thao.le@gmail.com",
      address: "42 Trần Phú, P. Thạch Thang",
      city: "Đà Nẵng",
      note: "Gói quà giúp mình tặng đối tác nước ngoài",
    },
    items: [
      {
        cartItemId: "item-1",
        type: "custom_bag",
        title: "NÉT Tote Signature (Xanh Thẳm)",
        price: 1470000,
        quantity: 1,
        image: "/assets/products/tote-blue.png",
        plasticOffsetKg: 1.85,
        details: {
          colorName: "Xanh Thẳm Đại Dương",
          charmsCount: 2,
          charmsList: ["Rồng Lửa Vươn Khơi", "Giọt Sáng Lân Tinh"],
        },
      },
    ],
    subtotal: 1470000,
    shippingFee: 0,
    total: 1470000,
    totalPlasticOffsetKg: 1.85,
    assignedBatchId: "PACK-DN-2024-082",
    assignedBagSerialId: "NET-ST-082-001",
    paymentMethod: "bank_transfer",
    paymentStatus: "paid",
    fulfillmentStatus: "delivering",
  },
  {
    orderId: "ord-seed-02",
    orderCode: "NET-ORD-8822",
    createdAt: "2026-10-09T14:15:00Z",
    customer: {
      fullName: "Trần Anh Khoa",
      phone: "0912 345 678",
      email: "khoa.tran@gmail.com",
      address: "128 Nguyễn Đình Chiểu, Q.3",
      city: "TP. Hồ Chí Minh",
    },
    items: [
      {
        cartItemId: "item-2",
        type: "base_bag",
        title: "NÉT Ocean Bucket (Xanh Thẳm)",
        price: 1050000,
        quantity: 1,
        image: "/assets/products/bucket-blue.png",
        plasticOffsetKg: 1.3,
        details: { colorName: "Xanh Thẳm Đại Dương" },
      },
    ],
    subtotal: 1050000,
    shippingFee: 30000,
    total: 1080000,
    totalPlasticOffsetKg: 1.3,
    assignedBatchId: "PACK-NO-2024-045",
    assignedBagSerialId: "NET-NO-045-001",
    paymentMethod: "cod",
    paymentStatus: "pending",
    fulfillmentStatus: "crafting",
  },
  {
    orderId: "ord-seed-03",
    orderCode: "NET-ORD-8823",
    createdAt: "2026-10-10T09:45:00Z",
    customer: {
      fullName: "Nguyễn Hải Yến",
      phone: "0988 776 554",
      email: "haiyen.nguyen@esg.vn",
      address: "Tòa Keangnam Hanoi Landmark, Cầu Giấy",
      city: "Hà Nội",
      note: "Giao trong giờ hành chính",
    },
    items: [
      {
        cartItemId: "item-3",
        type: "combo",
        title: "Set Đại Dương Tái Sinh (Tote + 3 Charm)",
        price: 1890000,
        quantity: 1,
        image: "/assets/products/combo-tote-deluxe.png",
        plasticOffsetKg: 2.1,
      },
    ],
    subtotal: 1890000,
    shippingFee: 0,
    total: 1890000,
    totalPlasticOffsetKg: 2.1,
    assignedBatchId: "PACK-CLC-2024-019",
    paymentMethod: "vnpay",
    paymentStatus: "paid",
    fulfillmentStatus: "received",
  },
];

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
    return JSON.parse(raw);
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
}

export function manufactureBags(params: ManufactureParams): {
  success: boolean;
  message: string;
  newItems: ManufacturedBagItem[];
} {
  const packs = getAllNetPacks();
  const pack = packs.find((p) => p.packId === params.packId);
  if (!pack) {
    return { success: false, message: "Không tìm thấy Pack Lưới nguồn!", newItems: [] };
  }

  const bag = BAG_BASES.find((b) => b.id === params.bagBaseId) || BAG_BASES[0];
  const color = BAG_COLORS.find((c) => c.id === params.colorId) || BAG_COLORS[0];
  const netRequiredPerBag = bag.plasticOffsetKg;
  const totalNetNeeded = Number((netRequiredPerBag * params.quantity).toFixed(2));

  if (pack.remainingWeightKg < totalNetNeeded) {
    return {
      success: false,
      message: `Khối lượng lưới khả dụng trong Pack (${pack.remainingWeightKg}kg) không đủ để sản xuất ${params.quantity} túi (cần ${totalNetNeeded}kg)!`,
      newItems: []
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
      bagBaseId: bag.id,
      bagName: bag.name,
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
    message: `Đã chế tạo thành công ${params.quantity} chiếc ${bag.name} và cấp ${params.quantity} mã định danh & mã vạch độc bản!`,
    newItems,
  };
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
    return JSON.parse(raw);
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

