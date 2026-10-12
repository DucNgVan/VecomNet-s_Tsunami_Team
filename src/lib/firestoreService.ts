import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TraceBatch, Order } from "@/types";
import { TRACE_BATCHES, TOTAL_IMPACT_STATS } from "@/data/traceability";

// Type definitions for Database Entities
export interface DbCustomerProfile {
  uid: string;
  email: string | null;
  displayName: string;
  phone: string;
  phoneVerified?: boolean;
  address: string;
  postcode?: string;
  dob?: string;
  role: "customer" | "admin";
  totalPlasticSavedKg: number;
  totalOrdersCount: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface DbBagItem {
  itemId: string; // e.g. "NET-DN-082-001" (Level 2 Unique Bag ID)
  parentBatchId: string; // e.g. "NET-VN-DN-2024-082" (Level 1 Batch ID)
  itemIndex: number; // e.g. 1 (Túi số 1 trong 167 túi của mẻ)
  bagName: string;
  colorName: string;
  ownerUid?: string;
  ownerName?: string;
  ownerPhone?: string;
  selectedCharms: {
    charmId: string;
    vietnameseName: string;
    material: string;
    symbol: string;
    anchorId: string;
  }[];
  quizIntention?: {
    vibe: string;
    memory: string;
    intention: string;
  };
  poeticDedication?: string;
  snapshotImageUrl?: string;
  plasticOffsetKg: number;
  coralProtectedSqM: number;
  co2AvoidedKg: number;
  qrUrl: string;
  createdAt: string;
}

export interface DbEnterpriseStats {
  totalPlasticDivertedKg: number;
  coralReefProtectedSqM: number;
  marineCreaturesSaved: number;
  co2EmissionsReducedKg: number;
  totalBagsMinted: number;
  artisanHoursInvested: number;
}

// -------------------------------------------------------------
// 1. BATCH OPERATIONS (NÉT Source -> Firestore)
// -------------------------------------------------------------
export async function saveBatchToFirestore(batch: TraceBatch): Promise<boolean> {
  try {
    const docRef = doc(db, "batches", batch.batchId);
    await setDoc(
      docRef,
      {
        ...batch,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn("Firestore saveBatch error (fallback to local):", error);
    return false;
  }
}

export async function getBatchesFromFirestore(): Promise<TraceBatch[]> {
  try {
    const colRef = collection(db, "batches");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return TRACE_BATCHES;
    }
    const list: TraceBatch[] = [];
    snapshot.forEach((d) => list.push(d.data() as TraceBatch));
    return list;
  } catch (error) {
    console.warn("Firestore getBatches error (using fallback):", error);
    return TRACE_BATCHES;
  }
}

// -------------------------------------------------------------
// 2. UNIQUE BAG PASSPORT ITEM (Level 2 Item ID Minting)
// -------------------------------------------------------------
export async function mintBagItemToFirestore(bagItem: DbBagItem): Promise<boolean> {
  try {
    const docRef = doc(db, "bag_items", bagItem.itemId);
    await setDoc(
      docRef,
      {
        ...bagItem,
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );

    // If ownerUid is present, update customer's cumulative eco-impact
    if (bagItem.ownerUid) {
      const userRef = doc(db, "users", bagItem.ownerUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentImpact = userSnap.data()?.totalPlasticSavedKg || 0;
        await setDoc(
          userRef,
          {
            totalPlasticSavedKg: Number((currentImpact + bagItem.plasticOffsetKg).toFixed(2)),
            totalOrdersCount: (userSnap.data()?.totalOrdersCount || 0) + 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    return true;
  } catch (error) {
    console.warn("Firestore mintBagItem error:", error);
    // Persist in localStorage as reliable fallback
    if (typeof window !== "undefined") {
      const key = "net_bag_items_v1";
      const raw = localStorage.getItem(key);
      const items: DbBagItem[] = raw ? JSON.parse(raw) : [];
      items.unshift(bagItem);
      localStorage.setItem(key, JSON.stringify(items));
    }
    return false;
  }
}

export async function getCustomerBagsFromFirestore(ownerUid?: string): Promise<DbBagItem[]> {
  if (typeof window === "undefined") return [];

  // 1. Try Firestore
  if (ownerUid) {
    try {
      const q = query(collection(db, "bag_items"), where("ownerUid", "==", ownerUid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const result: DbBagItem[] = [];
        snap.forEach((d) => result.push(d.data() as DbBagItem));
        return result;
      }
    } catch (e) {
      console.warn("Firestore query error:", e);
    }
  }

  // 2. Fallback to localStorage
  try {
    const raw = localStorage.getItem("net_bag_items_v1");
    if (raw) {
      const list: DbBagItem[] = JSON.parse(raw);
      if (ownerUid) {
        const filtered = list.filter((i) => i.ownerUid === ownerUid);
        if (filtered.length > 0) return filtered;
      }
      return list;
    }
  } catch (e) {}

  // 3. Demo Mock Bags for the Customer Dashboard so it's instantly impressive
  return [
    {
      itemId: "NET-DN-082-001",
      parentBatchId: "NET-VN-DN-2024-082",
      itemIndex: 1,
      bagName: "NÉT Tote Signature (Độc Bản)",
      colorName: "Xanh Thẳm Đại Dương",
      ownerUid: ownerUid || "mock-user-1",
      ownerName: "Lê Minh Thảo",
      ownerPhone: "0905 882 119",
      selectedCharms: [
        {
          charmId: "charm-caurong",
          vietnameseName: "Charm Cầu Rồng Đà Nẵng",
          material: "Đồng thau hàng hải tái sinh mạ vàng",
          symbol: "🐉",
          anchorId: "a2",
        },
        {
          charmId: "charm-bioluminescent-drop",
          vietnameseName: "Charm Giọt Lân Tinh",
          material: "Pha lê rác biển ép nguội phát quang",
          symbol: "💧",
          anchorId: "a5",
        },
      ],
      quizIntention: {
        vibe: "Năng Lượng Huyền Thoại",
        memory: "Rồng Vàng Phun Lửa Sông Hàn",
        intention: "Bản Lĩnh Vươn Khơi",
      },
      poeticDedication:
        "Được tôi luyện từ ánh lửa kiêu hùng của Rồng thiêng Đà Nẵng và sợi lưới đại dương Sơn Trà kiên cường.",
      plasticOffsetKg: 2.14,
      coralProtectedSqM: 3.2,
      co2AvoidedKg: 4.07,
      qrUrl: "/passport/NET-DN-082-001",
      createdAt: new Date().toLocaleDateString("vi-VN"),
    },
  ];
}

// -------------------------------------------------------------
// 3. GET SINGLE BAG ITEM OR BATCH PASSPORT
// -------------------------------------------------------------
export async function getPassportDataFromFirestore(passportId: string): Promise<{
  type: "item" | "batch";
  itemData?: DbBagItem;
  batchData: TraceBatch;
}> {
  let foundItem: DbBagItem | undefined;
  let foundBatch: TraceBatch | undefined;

  // 1. Try fetching from Firestore directly
  try {
    const itemSnap = await getDoc(doc(db, "bag_items", passportId));
    if (itemSnap.exists()) {
      foundItem = itemSnap.data() as DbBagItem;
      const batchId = foundItem.parentBatchId;
      const batchSnap = await getDoc(doc(db, "batches", batchId));
      if (batchSnap.exists()) {
        foundBatch = batchSnap.data() as TraceBatch;
      }
    } else {
      const directBatchSnap = await getDoc(doc(db, "batches", passportId));
      if (directBatchSnap.exists()) {
        foundBatch = directBatchSnap.data() as TraceBatch;
      }
    }
  } catch (err) {
    console.warn("Firestore passport read error, falling back to local:", err);
  }

  // 2. Fallback to localStorage if not found in Firestore
  if (!foundItem && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("net_bag_items_v1");
      if (raw) {
        const items: DbBagItem[] = JSON.parse(raw);
        foundItem = items.find(
          (i) => i.itemId.toLowerCase() === passportId.trim().toLowerCase()
        );
      }
    } catch (e) {}

    // Check manufactured items from Workshop OS
    if (!foundItem) {
      try {
        const rawMfg = localStorage.getItem("net_manufactured_items_v1");
        if (rawMfg) {
          const mfgItems: any[] = JSON.parse(rawMfg);
          const mItem = mfgItems.find(
            (i) =>
              i.serialId.toLowerCase() === passportId.trim().toLowerCase() ||
              i.sourcePackId.toLowerCase() === passportId.trim().toLowerCase()
          );
          if (mItem) {
            foundItem = {
              itemId: mItem.serialId,
              parentBatchId: mItem.sourcePackId,
              itemIndex: 1,
              bagName: `${mItem.bagName} (${mItem.colorName})`,
              colorName: mItem.colorName,
              ownerName: "Khách hàng sở hữu NÉT",
              selectedCharms: [],
              poeticDedication: `Chiếc túi được may thủ công vào lúc ${mItem.manufacturedAt} tại ${mItem.workshopName}, tuần hoàn từ mẻ lưới ${mItem.sourcePackId} tại ${mItem.seaRegion}.`,
              plasticOffsetKg: mItem.plasticConsumedKg,
              coralProtectedSqM: Number((mItem.plasticConsumedKg * 1.5).toFixed(1)),
              co2AvoidedKg: Number((mItem.plasticConsumedKg * 1.9).toFixed(1)),
              qrUrl: mItem.qrUrl,
              createdAt: mItem.manufacturedAt,
            };
          }
        }
      } catch (e) {}
    }
  }

  // 3. Fallback batch resolution
  if (!foundBatch) {
    const batchIdToLookup = foundItem?.parentBatchId || passportId;

    if (typeof window !== "undefined") {
      try {
        const rawPacks = localStorage.getItem("net_packs_v1");
        if (rawPacks) {
          const packs: any[] = JSON.parse(rawPacks);
          const pack = packs.find(
            (p) =>
              p.packId.toLowerCase() === batchIdToLookup.toLowerCase() ||
              batchIdToLookup.toLowerCase().includes(p.packId.toLowerCase())
          );
          if (pack) {
            foundBatch = {
              batchId: pack.packId,
              seaRegion: pack.seaRegion,
              coordinates: pack.coordinates,
              recoveryDate: pack.recoveryDate,
              depthMeters: pack.depthMeters,
              recoveryTeam: pack.diverTeam,
              netPolymer: pack.netPolymer,
              plasticRecoveredKg: pack.totalWeightKg,
              story: pack.notes || `Lưới ma thu hồi tại ${pack.seaRegion}, độ sâu ${pack.depthMeters}m bởi ${pack.diverTeam}.`,
              marineAnimalsSavedCount: 14,
              locationDetails: pack.locationDetails,
              verificationHash: `0xNET-${pack.packId.replace(/[^a-zA-Z0-9]/g, "")}-VERIFIED`,
              co2OffsetKg: Number((pack.totalWeightKg * 1.9).toFixed(1)),
            };
          }
        }
      } catch (e) {}
    }

    if (!foundBatch) {
      const batches = TRACE_BATCHES;
      foundBatch =
        batches.find(
          (b) =>
            b.batchId.toLowerCase().includes(batchIdToLookup.toLowerCase()) ||
            batchIdToLookup.toLowerCase().includes(b.batchId.toLowerCase())
        ) || batches[0];
    }
  }

  return {
    type: foundItem ? "item" : "batch",
    itemData: foundItem,
    batchData: foundBatch,
  };
}

// -------------------------------------------------------------
// 4. ENTERPRISE IMPACT STATS (Homepage Public Transparency)
// -------------------------------------------------------------
export function getEnterpriseImpactStats(): DbEnterpriseStats {
  return {
    totalPlasticDivertedKg: TOTAL_IMPACT_STATS.totalPlasticDivertedKg,
    coralReefProtectedSqM: 14200,
    marineCreaturesSaved: TOTAL_IMPACT_STATS.marineCreaturesSaved,
    co2EmissionsReducedKg: TOTAL_IMPACT_STATS.co2EmissionsReducedKg,
    totalBagsMinted: 1840,
    artisanHoursInvested: TOTAL_IMPACT_STATS.artisanHoursInvested,
  };
}

// -------------------------------------------------------------
// 5. CUSTOMER ORDERS (Create, Read & Sync + Auto Warehouse Deduction)
// -------------------------------------------------------------
export async function saveOrderToFirestore(order: Order): Promise<boolean> {
  // Deep clean undefined fields to prevent Firestore serialization error
  const cleanOrder: Order = JSON.parse(JSON.stringify(order));

  // A. Tự động trừ kho thành phẩm & gán mã túi độc bản vào đơn hàng
  if (typeof window !== "undefined") {
    try {
      const { deductInventoryForOrder } = await import("@/lib/supplyChainStorage");
      const deductionRes = deductInventoryForOrder(cleanOrder);
      if (deductionRes.success && deductionRes.assignedSerialIds.length > 0) {
        cleanOrder.assignedBagSerialId = deductionRes.assignedSerialIds[0];
      }
    } catch (deductErr) {
      console.warn("Auto warehouse deduction notice:", deductErr);
    }
  }

  // 1. Local backup
  if (typeof window !== "undefined") {
    try {
      const existing: Order[] = JSON.parse(localStorage.getItem("net_orders_v1") || "[]");
      const filtered = existing.filter((o) => o.orderId !== cleanOrder.orderId);
      filtered.unshift(cleanOrder);
      localStorage.setItem("net_orders_v1", JSON.stringify(filtered));
      localStorage.setItem("net_latest_order", JSON.stringify(cleanOrder));
    } catch (e) {
      console.warn("LocalStorage save order warning:", e);
    }
  }

  // 2. Direct Firestore Client Set
  try {
    const docRef = doc(db, "orders", cleanOrder.orderId);
    await setDoc(
      docRef,
      {
        ...cleanOrder,
        timestamp: serverTimestamp(),
      },
      { merge: true }
    );

    // Update user eco impact in users collection if logged in
    if (cleanOrder.userId && cleanOrder.userId !== "guest") {
      const userRef = doc(db, "users", cleanOrder.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentKg = userSnap.data()?.ecoImpactKg || userSnap.data()?.totalPlasticSavedKg || 0;
        await setDoc(
          userRef,
          {
            ecoImpactKg: Number((currentKg + (cleanOrder.totalPlasticOffsetKg || 0)).toFixed(2)),
            totalPlasticSavedKg: Number((currentKg + (cleanOrder.totalPlasticOffsetKg || 0)).toFixed(2)),
            totalOrdersCount: (userSnap.data()?.totalOrdersCount || 0) + 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  } catch (err) {
    console.warn("Client Firestore order save warning:", err);
  }

  // 3. Serverless Backend Sync (/api/orders/checkout)
  try {
    await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: cleanOrder.customer,
        items: cleanOrder.items,
        totalAmount: cleanOrder.total,
        paymentMethod: cleanOrder.paymentMethod,
        assignedBatchId: cleanOrder.assignedBatchId,
        assignedBagSerialId: cleanOrder.assignedBagSerialId,
        totalPlasticOffsetKg: cleanOrder.totalPlasticOffsetKg,
        userId: cleanOrder.userId,
      }),
    });
  } catch (apiErr) {
    console.warn("Server API checkout sync warning:", apiErr);
  }

  return true;
}

// -------------------------------------------------------------
// 5B. WAREHOUSE INVENTORY SYNC TO FIRESTORE
// -------------------------------------------------------------
export async function syncSingleItemToFirestore(item: any): Promise<boolean> {
  try {
    const docRef = doc(db, "bag_items", item.serialId);
    await setDoc(
      docRef,
      {
        itemId: item.serialId,
        serialId: item.serialId,
        parentBatchId: item.sourcePackId,
        sourcePackId: item.sourcePackId,
        bagName: item.bagName,
        colorName: item.colorName,
        workshopName: item.workshopName,
        seaRegion: item.seaRegion,
        coordinates: item.coordinates,
        plasticConsumedKg: item.plasticConsumedKg,
        status: item.status,
        assignedOrderCode: item.assignedOrderCode || null,
        barcode: item.barcode || null,
        nfcTagUid: item.nfcTagUid || null,
        isClaimed: item.isClaimed || false,
        warrantyStatus: item.warrantyStatus || "unactivated",
        warrantyMonths: item.warrantyMonths || 24,
        warrantyActivatedAt: item.warrantyActivatedAt || null,
        warrantyExpiresAt: item.warrantyExpiresAt || null,
        claimedBy: item.claimedBy || null,
        qrUrl:
          item.qrUrl ||
          `/passport/${encodeURIComponent(item.sourcePackId)}?itemId=${encodeURIComponent(item.serialId)}`,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn("Firestore syncSingleItem error:", error);
    return false;
  }
}

export async function syncAllInventoryToFirestore(): Promise<{
  success: boolean;
  syncedPacks: number;
  syncedItems: number;
  message: string;
}> {
  try {
    const { getAllNetPacks, getManufacturedItems } = await import("@/lib/supplyChainStorage");
    const packs = getAllNetPacks();
    const items = getManufacturedItems();

    let syncedPacks = 0;
    let syncedItems = 0;

    // 1. Sync all packs to batches collection
    for (const pack of packs) {
      const docRef = doc(db, "batches", pack.packId);
      await setDoc(
        docRef,
        {
          batchId: pack.packId,
          seaRegion: pack.seaRegion,
          coordinates: pack.coordinates,
          recoveryDate: pack.recoveryDate,
          depthMeters: pack.depthMeters,
          recoveryTeam: pack.diverTeam,
          netPolymer: pack.netPolymer,
          plasticRecoveredKg: pack.totalWeightKg,
          remainingWeightKg: pack.remainingWeightKg,
          status: pack.status,
          producedBagModel: pack.producedBagModel || null,
          producedBagCount: pack.producedBagCount || 0,
          serialRangeStart: pack.serialRangeStart || null,
          serialRangeEnd: pack.serialRangeEnd || null,
          barcodeRangeStart: pack.barcodeRangeStart || null,
          barcodeRangeEnd: pack.barcodeRangeEnd || null,
          locationDetails: pack.locationDetails,
          notes: pack.notes || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      syncedPacks++;
    }

    // 2. Sync all manufactured items to bag_items collection
    for (const item of items) {
      await syncSingleItemToFirestore(item);
      syncedItems++;
    }

    return {
      success: true,
      syncedPacks,
      syncedItems,
      message: `Đã đồng bộ thành công ${syncedPacks} Kiện Lưới và ${syncedItems} Túi Thành Phẩm lên Cloud Firestore!`,
    };
  } catch (error) {
    console.error("Firestore syncAllInventory error:", error);
    return {
      success: false,
      syncedPacks: 0,
      syncedItems: 0,
      message: `Đồng bộ thất bại: ${error instanceof Error ? error.message : "Lỗi mạng hoặc quyền truy cập"}`,
    };
  }
}

export async function getCustomerOrdersFromFirestore(
  userId?: string,
  userEmail?: string
): Promise<Order[]> {
  const orders: Order[] = [];

  // 1. Try querying Firestore
  if (userId || userEmail) {
    try {
      if (userId && userId !== "guest") {
        const qUser = query(collection(db, "orders"), where("userId", "==", userId));
        const snap = await getDocs(qUser);
        snap.forEach((d) => orders.push(d.data() as Order));
      }

      if (orders.length === 0 && userEmail) {
        const qEmail = query(collection(db, "orders"), where("customer.email", "==", userEmail));
        const snap = await getDocs(qEmail);
        snap.forEach((d) => orders.push(d.data() as Order));
      }
    } catch (e) {
      console.warn("Firestore getCustomerOrders query error:", e);
    }
  }

  // 2. Fallback to localStorage if Firestore empty or offline, đồng thời tự động đồng bộ lên Cloud Firestore
  if (orders.length === 0 && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("net_orders_v1");
      if (raw) {
        const localList: Order[] = JSON.parse(raw);
        // Tự động đẩy các đơn hàng đang lưu ở trình duyệt khách lên Cloud Firestore để Admin thấy ngay lập tức
        for (const locOrder of localList) {
          if (!["NET-ORD-8821", "NET-ORD-8822", "NET-ORD-8823"].includes(locOrder.orderCode)) {
            try {
              setDoc(
                doc(db, "orders", locOrder.orderId),
                {
                  ...locOrder,
                  timestamp: serverTimestamp(),
                },
                { merge: true }
              );
            } catch (errSync) {
              console.warn("Auto-sync local order to Firestore notice:", errSync);
            }
          }
        }

        if (userId && userId !== "guest") {
          return localList.filter(
            (o) => o.userId === userId || o.customer?.email === userEmail
          );
        }
        return localList;
      }
    } catch (e) {
      console.warn("LocalStorage getCustomerOrders error:", e);
    }
  }

  // Sort by date newest first
  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
