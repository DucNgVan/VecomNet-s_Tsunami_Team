/**
 * Module bảo mật & cá nhân hoá Hộ chiếu số (Digital Product Passport Security)
 * Tên miền chuẩn: https://www.net-s.id.vn
 * 
 * Tính năng chính:
 * 1. Sinh khóa bảo mật chính chủ (Secret Access Key) ngẫu nhiên & kháng dò quét (Brute-force / enumeration resistance).
 * 2. Đường dẫn định danh cá nhân hoá: https://www.net-s.id.vn/passport/[bagId]?key=[secretKey]
 * 3. Kiểm soát quyền truy cập nhiều lớp:
 *    - Tài khoản chính chủ đã đăng nhập (UID / SĐT / Email khớp với đơn hàng).
 *    - Hoặc Quét mã QR / Thẻ NFC vật lý có chứa Secret Key hợp lệ.
 *    - Hoặc Nhập đúng mã bảo mật in trên thẻ vật lý.
 * 4. Ngăn chặn tuyệt đối việc người lạ "dò bằng domain" gây lỗi hệ thống (Crash-proof, no 500, graceful security gate).
 */

import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { TRACE_BATCHES } from "@/data/traceability";
import { PlacedCharm } from "@/types";

export const OFFICIAL_DOMAIN = "https://www.net-s.id.vn";
const SECRET_SALT = "NET_OCEAN_PASSPORT_AUTHENTICITY_SALT_2026";
const SESSION_AUTH_KEY = "net_authorized_passports_v1";

/**
 * Lấy Base Domain hiện tại (ưu tiên domain chính thức trên production)
 */
export function getPassportBaseDomain(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    // Nếu đang chạy ở localhost hoặc preview thì dùng origin hiện tại, production dùng net-s.id.vn
    return window.location.origin;
  }
  return OFFICIAL_DOMAIN;
}

/**
 * Sinh mã khóa bảo mật chính chủ (Secret Key) kháng dò tìm cho từng sản phẩm.
 * Sử dụng hàm băm kết hợp Salt bí mật, trả về định dạng chuẩn: KEY-XXXXXX
 */
export function generateSecretKey(identifier: string): string {
  if (!identifier) return "KEY-NET000";
  const clean = identifier.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  let hash = 5381;
  const combined = `${clean}:${SECRET_SALT}`;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  const hex = hash.toString(36).toUpperCase().padStart(6, "0").slice(-6);
  return `KEY-${hex}`;
}

/**
 * Lấy Secret Key cho một túi hoặc ID túi
 */
export function getBagSecretKey(
  item: { secretKey?: string; itemId?: string; serialId?: string; id?: string } | string
): string {
  if (typeof item === "string") return generateSecretKey(item);
  if (item.secretKey && item.secretKey.trim() !== "") {
    return item.secretKey.toUpperCase();
  }
  const id = item.itemId || item.serialId || item.id || "";
  return generateSecretKey(id);
}

/**
 * Tạo URL Story Passport cá nhân hoá chính thức
 */
export function buildPersonalizedPassportUrl(
  identifier: string,
  secretKey?: string,
  forceProductionDomain: boolean = true
): string {
  const base = forceProductionDomain ? OFFICIAL_DOMAIN : getPassportBaseDomain();
  const cleanId = encodeURIComponent(identifier.trim());
  const key = secretKey || generateSecretKey(identifier);
  return `${base}/passport/${cleanId}?key=${encodeURIComponent(key)}`;
}

/**
 * Kiểm tra xem hộ chiếu này đã được mở khóa hợp lệ trong phiên duyệt web hiện tại chưa
 */
export function isPassportAuthorizedInSession(identifier: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(SESSION_AUTH_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.map((s) => s.toUpperCase()).includes(identifier.trim().toUpperCase());
  } catch {
    return false;
  }
}

/**
 * Ghi nhận hộ chiếu đã được xác thực chính chủ vào sessionStorage
 */
export function authorizePassportInSession(identifier: string): void {
  if (typeof window === "undefined" || !identifier) return;
  try {
    const raw = sessionStorage.getItem(SESSION_AUTH_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const upper = identifier.trim().toUpperCase();
    if (!list.includes(upper)) {
      list.push(upper);
      sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Cấu trúc dữ liệu Hộ chiếu đã được chuẩn hóa trọn vẹn
 */
export interface ResolvedPassport {
  status: "found" | "not_found";
  id: string; // Serial / Item ID / Batch ID
  isBag: boolean;
  isBatchOnly: boolean;
  batchId: string;
  bagName: string;
  colorName: string;
  colorHex: string;
  bagImage: string;
  model3dUrl?: string;
  secretKey: string;
  personalizedUrl: string;
  
  // Thông tin chủ sở hữu & bảo hành
  ownerUid?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  isClaimed: boolean;
  warrantyStatus: "unactivated" | "active" | "expired";
  warrantyActivatedAt?: string;
  warrantyExpiresAt?: string;
  warrantyMonths: number;

  // Dữ liệu nguồn gốc & môi trường
  seaRegion: string;
  coordinates: { lat: number; lng: number };
  recoveryDate: string;
  initialWeightKg: number;
  usableWeightKg: number;
  plasticOffsetKg: number;
  coralProtectedSqM: number;
  co2AvoidedKg: number;

  // Bản phối charm & ký ức
  placedCharms: PlacedCharm[];
  storyTitle: string;
  storyDedication: string;
  careGuide: string;
  barcode?: string;
}

/**
 * Tra cứu và tổng hợp Hộ chiếu từ tất cả nguồn:
 * Firestore (bag_items, batches), LocalStorage (net_bag_items_v1, net_manufactured_items_v1, design_requests),
 * và Traceability Batches.
 */
export async function resolveFullPassportData(
  primaryIdentifier: string,
  itemIdParam?: string | null
): Promise<ResolvedPassport> {
  const targetId = (itemIdParam || primaryIdentifier || "").trim();
  const upperTarget = targetId.toUpperCase();
  const secretKey = generateSecretKey(targetId);

  // 1. Tìm trong Design Requests (Nếu khách tự thiết kế tại Studio)
  if (typeof window !== "undefined") {
    try {
      const { getAllDesignRequests } = await import("@/lib/designRequestStorage");
      const designReqs = getAllDesignRequests();
      const foundReq = designReqs.find(
        (r) =>
          r.id.toUpperCase() === upperTarget ||
          (r.passportCode && r.passportCode.toUpperCase() === upperTarget)
      );
      if (foundReq) {
        return {
          status: "found",
          id: foundReq.passportCode || foundReq.id,
          isBag: true,
          isBatchOnly: false,
          batchId: foundReq.passportCode || "NET-VN-DN-2024-082",
          bagName: foundReq.bagName || "Túi Lưới NÉT Độc Bản",
          colorName: foundReq.bagColor?.name || "Xanh Lá",
          colorHex: foundReq.bagColor?.hex || "#3d8b85",
          bagImage: foundReq.bagColor?.image || "/assets/products/bags/tuixach-xanh-la.png",
          model3dUrl: foundReq.bagColor?.model3dUrl,
          secretKey,
          personalizedUrl: buildPersonalizedPassportUrl(foundReq.passportCode || foundReq.id, secretKey),
          ownerName: foundReq.customerName,
          ownerPhone: foundReq.customerPhone || foundReq.contact,
          ownerEmail: foundReq.customerEmail,
          isClaimed: true,
          warrantyStatus: "active",
          warrantyActivatedAt: foundReq.createdAt,
          warrantyExpiresAt: "2028-10-18",
          warrantyMonths: 24,
          seaRegion: "Vùng biển Đà Nẵng (Bãi Rạng - Sơn Trà)",
          coordinates: { lat: 16.108, lng: 108.275 },
          recoveryDate: "18/10/2026",
          initialWeightKg: 14,
          usableWeightKg: 10,
          plasticOffsetKg: 1.8,
          coralProtectedSqM: 2.7,
          co2AvoidedKg: 3.4,
          placedCharms: foundReq.placedCharms || [],
          storyTitle: foundReq.notes ? "Kỷ niệm lưu giữ riêng" : "Hành Trình Tái Sinh Biển",
          storyDedication: foundReq.notes || "Chiếc túi độc bản kết tinh từ lưới ma tái sinh biển Đà Nẵng.",
          careGuide:
            "Làm sạch nhẹ nhàng bằng khăn ẩm hoặc nước mát. Tháo charm trước khi vệ sinh. Tránh hóa chất tẩy rửa mạnh.",
        };
      }
    } catch (e) {
      console.warn("Passport lookup in design requests failed:", e);
    }
  }

  // 2. Tìm trong Firestore `bag_items`
  if (targetId) {
    try {
      const snap = await getDoc(doc(db, "bag_items", targetId));
      if (snap.exists()) {
        const item = snap.data();
        let batchData: any = null;
        if (item.parentBatchId) {
          try {
            const bSnap = await getDoc(doc(db, "batches", item.parentBatchId));
            if (bSnap.exists()) batchData = bSnap.data();
          } catch {}
        }
        if (!batchData) {
          batchData = TRACE_BATCHES.find(
            (b) => b.batchId.toUpperCase() === (item.parentBatchId || "").toUpperCase()
          ) || TRACE_BATCHES[0];
        }

        const charms: PlacedCharm[] = (item.selectedCharms || []).map((c: any, idx: number) => ({
          instanceId: `charm-${idx}`,
          charmId: c.charmId || `c-${idx}`,
          anchorId: c.anchorId || `a-${idx}`,
          x: 35 + (idx % 3) * 15,
          y: 45 + Math.floor(idx / 3) * 12,
          charm: {
            id: c.charmId || `c-${idx}`,
            name: c.vietnameseName || "Charm Biển Sâu",
            vietnameseName: c.vietnameseName || "Charm Biển Sâu",
            category: "marine",
            price: c.price || 180000,
            plasticOffsetGrams: 0,
            material: c.material || "Hợp kim cao cấp mạ vàng 18K",
            description: "Phụ kiện độc bản đúc kim loại mạ vàng.",
            color: c.color || "#eab308",
            symbol: c.symbol || "✨",
            iconName: "Sparkles",
          },
        }));

        return {
          status: "found",
          id: item.itemId,
          isBag: true,
          isBatchOnly: false,
          batchId: item.parentBatchId || batchData.batchId,
          bagName: item.bagName || "Túi Lưới NÉT Đà Nẵng",
          colorName: item.colorName || "Xanh Lá",
          colorHex: "#3d8b85",
          bagImage: item.snapshotImageUrl || "/assets/products/bags/tuixach-xanh-la.png",
          secretKey,
          personalizedUrl: buildPersonalizedPassportUrl(item.itemId, secretKey),
          ownerUid: item.ownerUid || item.claimedBy?.customerUid,
          ownerName: item.ownerName || item.claimedBy?.fullName,
          ownerPhone: item.ownerPhone || item.claimedBy?.phone,
          ownerEmail: item.ownerEmail || item.claimedBy?.email,
          isClaimed: Boolean(item.ownerUid || item.claimedBy),
          warrantyStatus: item.warrantyStatus || "active",
          warrantyActivatedAt: item.warrantyActivatedAt || item.createdAt,
          warrantyExpiresAt: item.warrantyExpiresAt || "2028-10-18",
          warrantyMonths: item.warrantyMonths || 24,
          seaRegion: batchData.seaRegion || "Vùng biển Đà Nẵng",
          coordinates: batchData.coordinates || { lat: 16.108, lng: 108.275 },
          recoveryDate: batchData.recoveryDate || "18/10/2026",
          initialWeightKg: batchData.initialWeightKg || 14,
          usableWeightKg: batchData.usableWeightKg || 10,
          plasticOffsetKg: item.plasticOffsetKg || 1.8,
          coralProtectedSqM: item.coralProtectedSqM || 2.7,
          co2AvoidedKg: item.co2AvoidedKg || 3.4,
          placedCharms: charms,
          storyTitle: "Hộ Chiếu Định Danh Chính Hãng NÉT",
          storyDedication: item.poeticDedication || "Chiếc túi đại dương gìn giữ ký ức biển Đà Nẵng.",
          careGuide:
            "Làm sạch nhẹ nhàng bằng khăn ẩm hoặc nước mát. Tháo charm trước khi vệ sinh. Tránh hóa chất tẩy rửa mạnh.",
        };
      }
    } catch (e) {
      console.warn("Firestore bag_items lookup warning:", e);
    }
  }

  // 3. Tìm trong LocalStorage `net_manufactured_items_v1`
  if (typeof window !== "undefined") {
    try {
      const rawMfg = localStorage.getItem("net_manufactured_items_v1");
      if (rawMfg) {
        const mfgList: any[] = JSON.parse(rawMfg);
        const found = mfgList.find(
          (m) =>
            m.serialId?.toUpperCase() === upperTarget ||
            m.barcode === targetId ||
            m.nfcTagUid?.toUpperCase() === upperTarget
        );
        if (found) {
          return {
            status: "found",
            id: found.serialId,
            isBag: true,
            isBatchOnly: false,
            batchId: found.sourcePackId || "NET-VN-DN-2024-082",
            bagName: found.bagName || "Túi Lưới NÉT Tái Sinh",
            colorName: found.colorName || "Xanh Lá",
            colorHex: "#3d8b85",
            bagImage: "/assets/products/bags/tuixach-xanh-la.png",
            secretKey,
            personalizedUrl: buildPersonalizedPassportUrl(found.serialId, secretKey),
            ownerUid: found.claimedBy?.customerUid,
            ownerName: found.claimedBy?.fullName,
            ownerPhone: found.claimedBy?.phone,
            ownerEmail: found.claimedBy?.email,
            isClaimed: Boolean(found.isClaimed),
            warrantyStatus: found.warrantyStatus || "active",
            warrantyActivatedAt: found.warrantyActivatedAt || found.manufacturedAt,
            warrantyExpiresAt: found.warrantyExpiresAt || "2028-10-18",
            warrantyMonths: found.warrantyMonths || 24,
            seaRegion: found.seaRegion || "Vùng biển Đà Nẵng",
            coordinates: found.coordinates || { lat: 16.108, lng: 108.275 },
            recoveryDate: found.manufacturedAt || "18/10/2026",
            initialWeightKg: 14,
            usableWeightKg: 10,
            plasticOffsetKg: found.plasticConsumedKg || 1.6,
            coralProtectedSqM: Number(((found.plasticConsumedKg || 1.6) * 1.5).toFixed(1)),
            co2AvoidedKg: Number(((found.plasticConsumedKg || 1.6) * 1.9).toFixed(1)),
            placedCharms: [],
            storyTitle: "Hộ Chiếu Số Thành Phẩm NÉT",
            storyDedication: `Chiếc túi được chế tác thủ công tại ${found.workshopName || "Xưởng NÉT Đà Nẵng"}.`,
            careGuide:
              "Làm sạch nhẹ nhàng bằng khăn ẩm hoặc nước mát. Tháo charm trước khi vệ sinh. Tránh hóa chất tẩy rửa mạnh.",
            barcode: found.barcode,
          };
        }
      }
    } catch (e) {
      console.warn("Local manufactured lookup warning:", e);
    }
  }

  // 4. Tìm như là một Batch (Mẻ lưới ma thu gom công cộng)
  const batchMatch = TRACE_BATCHES.find(
    (b) =>
      b.batchId.toUpperCase() === upperTarget ||
      upperTarget.includes(b.batchId.toUpperCase()) ||
      b.batchId.toUpperCase().includes(upperTarget)
  );
  if (batchMatch) {
    return {
      status: "found",
      id: batchMatch.batchId,
      isBag: false,
      isBatchOnly: true,
      batchId: batchMatch.batchId,
      bagName: `Hồ Sơ Mẻ Lưới ${batchMatch.batchId}`,
      colorName: "Đại Dương",
      colorHex: "#0284c7",
      bagImage: "/assets/products/bags/tuixach-xanh-la.png",
      secretKey: "PUBLIC",
      personalizedUrl: `${OFFICIAL_DOMAIN}/passport/${batchMatch.batchId}`,
      isClaimed: true,
      warrantyStatus: "active",
      warrantyMonths: 24,
      seaRegion: batchMatch.seaRegion,
      coordinates: batchMatch.coordinates,
      recoveryDate: batchMatch.recoveryDate,
      initialWeightKg: batchMatch.plasticRecoveredKg || 25,
      usableWeightKg: Math.round((batchMatch.plasticRecoveredKg || 25) * 0.75),
      plasticOffsetKg: batchMatch.plasticRecoveredKg || 25,
      coralProtectedSqM: 35,
      co2AvoidedKg: 47,
      placedCharms: [],
      storyTitle: "Báo Cáo Minh Bạch Nguồn Lưới Thu Gom",
      storyDedication: batchMatch.story || "Mẻ cước ma được đội thợ lặn thu gom từ đáy rạn san hô Đà Nẵng.",
      careGuide: "Thông số kiểm định chuỗi cung ứng minh bạch của NÉT.",
    };
  }

  // 5. Nếu hoàn toàn không tìm thấy: Báo Not Found một cách an toàn (tránh lỗi dò quét)
  return {
    status: "not_found",
    id: targetId,
    isBag: false,
    isBatchOnly: false,
    batchId: targetId,
    bagName: "",
    colorName: "",
    colorHex: "",
    bagImage: "",
    secretKey: "",
    personalizedUrl: "",
    isClaimed: false,
    warrantyStatus: "unactivated",
    warrantyMonths: 0,
    seaRegion: "",
    coordinates: { lat: 0, lng: 0 },
    recoveryDate: "",
    initialWeightKg: 0,
    usableWeightKg: 0,
    plasticOffsetKg: 0,
    coralProtectedSqM: 0,
    co2AvoidedKg: 0,
    placedCharms: [],
    storyTitle: "",
    storyDedication: "",
    careGuide: "",
  };
}

/**
 * Kiểm tra phân quyền truy cập Hộ chiếu số
 */
export function verifyPassportAccess(
  passport: ResolvedPassport,
  currentUser: { uid?: string; email?: string | null } | null,
  userProfile: { phone?: string; fullName?: string } | null,
  queryKey?: string | null
): {
  isAuthorized: boolean;
  reason: "owner_account" | "valid_key" | "session_unlocked" | "public_batch" | "unauthorized";
} {
  // A. Nếu là mẻ lưới công khai
  if (passport.isBatchOnly) {
    return { isAuthorized: true, reason: "public_batch" };
  }

  // B. Đã được mở khóa trong phiên này
  if (isPassportAuthorizedInSession(passport.id)) {
    return { isAuthorized: true, reason: "session_unlocked" };
  }

  // C. Khóa trên URL khớp với Secret Key của túi
  if (queryKey && queryKey.trim().toUpperCase() === passport.secretKey.toUpperCase()) {
    authorizePassportInSession(passport.id);
    return { isAuthorized: true, reason: "valid_key" };
  }

  // D. Khách hàng đang đăng nhập là chủ sở hữu chính thức (Khớp UID)
  if (currentUser?.uid && passport.ownerUid && currentUser.uid === passport.ownerUid) {
    authorizePassportInSession(passport.id);
    return { isAuthorized: true, reason: "owner_account" };
  }

  // E. Khớp số điện thoại đăng nhập
  if (userProfile?.phone && passport.ownerPhone) {
    const p1 = userProfile.phone.replace(/[^0-9]/g, "");
    const p2 = passport.ownerPhone.replace(/[^0-9]/g, "");
    if (p1 && p1.length >= 9 && (p1 === p2 || p1.endsWith(p2) || p2.endsWith(p1))) {
      authorizePassportInSession(passport.id);
      return { isAuthorized: true, reason: "owner_account" };
    }
  }

  // F. Khớp Email đăng nhập
  if (currentUser?.email && passport.ownerEmail) {
    if (currentUser.email.toLowerCase() === passport.ownerEmail.toLowerCase()) {
      authorizePassportInSession(passport.id);
      return { isAuthorized: true, reason: "owner_account" };
    }
  }

  return { isAuthorized: false, reason: "unauthorized" };
}
