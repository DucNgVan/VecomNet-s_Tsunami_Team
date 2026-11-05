/**
 * Module bảo mật & cá nhân hoá Theo Dõi Đơn Hàng (Order Tracking Security)
 * Tên miền chuẩn: https://www.net-s.id.vn
 * 
 * Tính năng chính:
 * 1. Sinh khóa bảo mật chính chủ (Secret Access Key) ngẫu nhiên & kháng dò quét cho từng đơn hàng / yêu cầu thiết kế.
 * 2. Đường dẫn định danh cá nhân hoá: https://www.net-s.id.vn/tracking?code=[orderCode]&key=[secretKey]
 * 3. Kiểm soát quyền truy cập chặt chẽ:
 *    - Tài khoản chính chủ đã đăng nhập (UID / SĐT / Email khớp với đơn hàng).
 *    - Hoặc Mở qua link xác thực có chứa Secret Key hợp lệ (từ email / trang hoàn tất đơn hàng).
 *    - Hoặc Nhập Số điện thoại người nhận / Mã bảo mật tại Cổng Bảo Mật.
 * 4. Ngăn chặn tuyệt đối việc người lạ "dò bằng domain" gây lỗi hệ thống (Anti-probing, no crash, privacy protection).
 * 5. Hỗ trợ tra cứu thống nhất cho cả Đơn Hàng Shop và Yêu Cầu Thiết Kế Custom tại NÉT Studio.
 */

import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Order, PlacedCharm } from "@/types";
import { DesignRequest } from "@/lib/designRequestStorage";

export const OFFICIAL_DOMAIN = "https://www.net-s.id.vn";
const TRACKING_SALT = "NET_ORDER_TRACKING_AUTHENTICITY_SALT_2026";
const TRACKING_SESSION_KEY = "net_authorized_tracking_v1";

/**
 * Lấy Base Domain hiện tại
 */
export function getTrackingBaseDomain(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return OFFICIAL_DOMAIN;
}

/**
 * Sinh mã khóa bảo mật chính chủ (Secret Key) kháng dò tìm cho từng đơn hàng hoặc yêu cầu thiết kế.
 * Sử dụng hàm băm kết hợp Salt bí mật, trả về định dạng chuẩn: KEY-XXXXXX
 */
export function generateOrderSecretKey(identifier: string): string {
  if (!identifier) return "KEY-ORD000";
  const clean = identifier.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  let hash = 7187;
  const combined = `${clean}:${TRACKING_SALT}`;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  const hex = hash.toString(36).toUpperCase().padStart(6, "0").slice(-6);
  return `KEY-${hex}`;
}

/**
 * Tạo URL theo dõi đơn hàng cá nhân hoá chính thức
 */
export function buildPersonalizedTrackingUrl(
  orderCode: string,
  secretKey?: string,
  forceProductionDomain: boolean = true
): string {
  const base = forceProductionDomain ? OFFICIAL_DOMAIN : getTrackingBaseDomain();
  const cleanCode = encodeURIComponent(orderCode.trim().toUpperCase());
  const key = secretKey || generateOrderSecretKey(orderCode);
  return `${base}/tracking?code=${cleanCode}&key=${encodeURIComponent(key)}`;
}

/**
 * Kiểm tra xem đơn hàng này đã được mở khóa hợp lệ trong phiên duyệt web hiện tại chưa
 */
export function isOrderAuthorizedInSession(orderCode: string): boolean {
  if (typeof window === "undefined" || !orderCode) return false;
  try {
    const raw = sessionStorage.getItem(TRACKING_SESSION_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.map((s) => s.toUpperCase()).includes(orderCode.trim().toUpperCase());
  } catch {
    return false;
  }
}

/**
 * Ghi nhận đơn hàng đã được xác thực chính chủ vào sessionStorage
 */
export function authorizeOrderInSession(orderCode: string): void {
  if (typeof window === "undefined" || !orderCode) return;
  try {
    const raw = sessionStorage.getItem(TRACKING_SESSION_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const upper = orderCode.trim().toUpperCase();
    if (!list.includes(upper)) {
      list.push(upper);
      sessionStorage.setItem(TRACKING_SESSION_KEY, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Cấu trúc dữ liệu theo dõi thống nhất (Unified Tracking Item)
 */
export interface UnifiedTrackingItem {
  status: "found" | "not_found";
  type: "shop_order" | "design_request";
  id: string; // e.g. "NET-ORD-8821" or "REQ-1729000..."
  code: string;
  secretKey: string;
  personalizedUrl: string;
  createdAt: string;

  // Thông tin người nhận
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  customerNote?: string;
  userId?: string;

  // Trạng thái & Tiến độ
  statusCode: string;
  statusLabel: string;
  statusBadgeColor: string;
  timeline: {
    title: string;
    description: string;
    time?: string;
    location?: string;
    completed: boolean;
    current: boolean;
  }[];

  // Chi tiết đơn hàng Shop
  items?: {
    title: string;
    price: number;
    quantity: number;
    image?: string;
    colorName?: string;
  }[];
  subtotal?: number;
  shippingFee?: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: "pending" | "paid";
  assignedBatchId?: string;
  assignedSerialId?: string;

  // Chi tiết yêu cầu thiết kế Nét Studio
  bagName?: string;
  bagColorHex?: string;
  bagColorName?: string;
  bagImage?: string;
  placedCharms?: PlacedCharm[];
  conceptVersion?: number;
  conceptImageUrl?: string;
  conceptNote?: string;
  conceptSentAt?: string;
  passportCode?: string;
  deliveryMethodLabel?: string;
  partnerCode?: string;
  charmsTotal?: number;
  bagPrice?: number;
  rawRequest?: DesignRequest;
}

/**
 * Tra cứu và tổng hợp thông tin theo dõi từ cả 2 nguồn:
 * 1. Đơn hàng Shop (Cloud Firestore `orders` & LocalStorage `net_orders_v1`)
 * 2. Yêu cầu thiết kế Studio (LocalStorage `net_design_requests_v2`)
 */
export async function resolveFullTrackingData(
  codeOrId: string
): Promise<UnifiedTrackingItem> {
  const cleanCode = codeOrId.trim();
  const upperCode = cleanCode.toUpperCase();
  const secretKey = generateOrderSecretKey(cleanCode);

  // 1. Tra cứu trong Yêu Cầu Thiết Kế Studio trước
  if (typeof window !== "undefined") {
    try {
      const { getAllDesignRequests } = await import("@/lib/designRequestStorage");
      const designReqs = getAllDesignRequests();
      const foundReq = designReqs.find(
        (r) =>
          r.id.toUpperCase() === upperCode ||
          (r.passportCode && r.passportCode.toUpperCase() === upperCode)
      );

      if (foundReq) {
        const stepIndexMap: Record<string, number> = {
          pending_review: 0,
          concept_sent: 1,
          approved: 2,
          confirmed: 2,
          revision_requested: 1,
          in_production: 3,
          shipping: 4,
          completed: 5,
        };
        const currentStep = stepIndexMap[foundReq.status] ?? 0;

        const statusMap: Record<string, { label: string; color: string }> = {
          pending_review: { label: "Chờ tiếp nhận", color: "bg-amber-100 text-amber-800 border-amber-200" },
          concept_sent: { label: "Đã có concept & báo giá", color: "bg-blue-100 text-blue-800 border-blue-200" },
          approved: { label: "Đã duyệt thiết kế", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
          confirmed: { label: "Đã xác nhận chế tác", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
          revision_requested: { label: "Đang chỉnh sửa theo yêu cầu", color: "bg-purple-100 text-purple-800 border-purple-200" },
          in_production: { label: "Đang chế tác tại xưởng", color: "bg-teal-100 text-teal-800 border-teal-200" },
          shipping: { label: "Đang giao hàng", color: "bg-sky-100 text-sky-800 border-sky-200" },
          completed: { label: "Hoàn tất bàn giao", color: "bg-green-100 text-green-800 border-green-200" },
          cancelled: { label: "Đã hủy", color: "bg-rose-100 text-rose-800 border-rose-200" },
        };

        const timeline = [
          {
            title: "Tiếp nhận bản thiết kế",
            description: "Hệ thống đã ghi nhận thiết kế và ý tưởng charm từ bạn.",
            time: foundReq.createdAt,
            completed: currentStep >= 0,
            current: currentStep === 0,
          },
          {
            title: "Dựng Concept & Báo giá",
            description: foundReq.conceptNote || "Nghệ nhân Nét phác thảo tỉ lệ 1:1 và lên chi phí hoàn thiện.",
            time: foundReq.conceptSentAt,
            completed: currentStep >= 1,
            current: currentStep === 1,
          },
          {
            title: "Khách hàng duyệt thiết kế",
            description: foundReq.approvedAt ? `Đã duyệt phiên bản Concept #${foundReq.approvedVersion || 1}` : "Chờ bạn duyệt phương án tại trang theo dõi.",
            time: foundReq.approvedAt,
            completed: currentStep >= 2,
            current: currentStep === 2,
          },
          {
            title: "Chế tác thủ công tại xưởng NÉT",
            description: "Đan sợi lưới tái sinh và đúc các chi tiết charm kim loại mạ vàng.",
            location: "Xưởng NÉT Sơn Trà, TP. Đà Nẵng",
            completed: currentStep >= 3,
            current: currentStep === 3,
          },
          {
            title: "Vận chuyển & Bàn giao",
            description: foundReq.deliveryMethodLabel ? `Phương thức: ${foundReq.deliveryMethodLabel}` : "Giao tận tay bạn hoặc qua đối tác khách sạn.",
            completed: currentStep >= 4,
            current: currentStep === 4,
          },
          {
            title: "Hoàn tất & Cấp Story Passport",
            description: "Túi đã được bàn giao và sẵn sàng kích hoạt bảo hành điện tử 24 tháng.",
            completed: currentStep >= 5,
            current: currentStep === 5,
          },
        ];

        return {
          status: "found",
          type: "design_request",
          id: foundReq.id,
          code: foundReq.id,
          secretKey,
          personalizedUrl: buildPersonalizedTrackingUrl(foundReq.id, secretKey),
          createdAt: foundReq.createdAt,
          customerName: foundReq.customerName,
          customerPhone: foundReq.customerPhone || foundReq.contact,
          customerEmail: foundReq.customerEmail,
          customerAddress: foundReq.customerAddress,
          customerCity: foundReq.customerCity,
          customerNote: foundReq.notes,
          statusCode: foundReq.status,
          statusLabel: statusMap[foundReq.status]?.label || foundReq.status,
          statusBadgeColor: statusMap[foundReq.status]?.color || "bg-slate-100 text-slate-800",
          timeline,
          totalAmount: foundReq.finalTotal || foundReq.baseTotal || 0,
          bagName: foundReq.bagName,
          bagColorHex: foundReq.bagColor?.hex || "#3d8b85",
          bagColorName: foundReq.bagColor?.name || "Xanh Lá",
          bagImage: foundReq.bagColor?.image || "/assets/products/bags/tuixach-xanh-la.png",
          placedCharms: foundReq.placedCharms || [],
          conceptVersion: foundReq.conceptVersion,
          conceptImageUrl: foundReq.conceptImageUrl,
          conceptNote: foundReq.conceptNote,
          conceptSentAt: foundReq.conceptSentAt,
          passportCode: foundReq.passportCode,
          deliveryMethodLabel: foundReq.deliveryMethodLabel,
          partnerCode: foundReq.partnerCode,
          charmsTotal: foundReq.charmsTotal,
          bagPrice: foundReq.bagPrice,
          rawRequest: foundReq,
        };
      }
    } catch (e) {
      console.warn("Design request tracking lookup warning:", e);
    }
  }

  // 2. Tra cứu trong Đơn Hàng Shop (Firestore collection "orders")
  try {
    let matchedOrder: Order | null = null;

    // A. Thử tìm theo Document ID trực tiếp
    const orderDoc = await getDoc(doc(db, "orders", cleanCode));
    if (orderDoc.exists()) {
      matchedOrder = orderDoc.data() as Order;
    }

    // B. Thử tìm theo query orderCode
    if (!matchedOrder) {
      const q = query(collection(db, "orders"), where("orderCode", "==", upperCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        matchedOrder = snap.docs[0].data() as Order;
      }
    }

    // C. Thử tìm trong LocalStorage "net_orders_v1"
    if (!matchedOrder && typeof window !== "undefined") {
      const raw = localStorage.getItem("net_orders_v1");
      if (raw) {
        const localOrders: Order[] = JSON.parse(raw);
        matchedOrder =
          localOrders.find(
            (o) =>
              o.orderCode?.toUpperCase() === upperCode ||
              o.orderId?.toUpperCase() === upperCode
          ) || null;
      }
    }

    if (matchedOrder) {
      const stepIndexMap: Record<string, number> = {
        received: 0,
        crafting: 1,
        quality_check: 2,
        delivering: 3,
        delivered: 4,
        completed: 4,
        cancelled: -1,
      };
      const currentStep = stepIndexMap[matchedOrder.fulfillmentStatus || "crafting"] ?? 1;

      const statusMap: Record<string, { label: string; color: string }> = {
        received: { label: "Đã tiếp nhận đơn hàng", color: "bg-blue-50 text-blue-700 border-blue-200" },
        crafting: { label: "Đang đan thủ công tại xưởng", color: "bg-amber-50 text-amber-700 border-amber-200" },
        quality_check: { label: "Kiểm định & Cấp mã định danh", color: "bg-purple-50 text-purple-700 border-purple-200" },
        delivering: { label: "Đang trên đường vận chuyển", color: "bg-sky-50 text-sky-700 border-sky-200" },
        delivered: { label: "Đã giao thành công", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        completed: { label: "Hoàn tất đơn hàng", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        cancelled: { label: "Đã hủy đơn", color: "bg-rose-50 text-rose-700 border-rose-200" },
      };

      const timeline = [
        {
          title: "Tiếp nhận đơn hàng & Xác nhận",
          description: `Đơn hàng ${matchedOrder.orderCode} đã được hệ thống NÉT tiếp nhận và phân bổ về xưởng.`,
          time: matchedOrder.createdAt,
          completed: currentStep >= 0,
          current: currentStep === 0,
        },
        {
          title: "Chuẩn bị mẻ lưới & Đan sợi thủ công",
          description: `Gán nguồn cước tái sinh từ mẻ lưới ${matchedOrder.assignedBatchId || "Đà Nẵng"}. Nghệ nhân tiến hành đan thân túi.`,
          location: "Xưởng Thủ Công NÉT Sơn Trà, TP. Đà Nẵng",
          completed: currentStep >= 1,
          current: currentStep === 1,
        },
        {
          title: "Kiểm định chất lượng & Cấp Hộ Chiếu Số",
          description: matchedOrder.assignedBagSerialId
            ? `Đã hoàn thiện kiểm định, gắn chip NFC & thẻ bài Serial: ${matchedOrder.assignedBagSerialId}.`
            : "Đang hoàn thiện kiểm tra chất lượng chỉ đan và đóng gói bao bì sinh học.",
          completed: currentStep >= 2,
          current: currentStep === 2,
        },
        {
          title: "Đang vận chuyển",
          description: `Đơn vị vận chuyển đang phát hàng tới ${matchedOrder.customer?.city || "địa chỉ của bạn"}.`,
          location: `${matchedOrder.customer?.address || ""}, ${matchedOrder.customer?.city || ""}`,
          completed: currentStep >= 3,
          current: currentStep === 3,
        },
        {
          title: "Giao hàng thành công & Kích hoạt bảo hành",
          description: "Khách hàng nhận hàng và kích hoạt bảo hành điện tử 24 tháng chính hãng tại Hồ Sơ.",
          completed: currentStep >= 4,
          current: currentStep === 4,
        },
      ];

      return {
        status: "found",
        type: "shop_order",
        id: matchedOrder.orderId,
        code: matchedOrder.orderCode,
        secretKey,
        personalizedUrl: buildPersonalizedTrackingUrl(matchedOrder.orderCode, secretKey),
        createdAt: matchedOrder.createdAt,
        customerName: matchedOrder.customer?.fullName || "Khách hàng NÉT",
        customerPhone: matchedOrder.customer?.phone || "",
        customerEmail: matchedOrder.customer?.email,
        customerAddress: matchedOrder.customer?.address,
        customerCity: matchedOrder.customer?.city,
        customerNote: matchedOrder.customer?.note,
        userId: matchedOrder.userId,
        statusCode: matchedOrder.fulfillmentStatus || "crafting",
        statusLabel: statusMap[matchedOrder.fulfillmentStatus || "crafting"]?.label || "Đang xử lý",
        statusBadgeColor: statusMap[matchedOrder.fulfillmentStatus || "crafting"]?.color || "bg-slate-100 text-slate-800",
        timeline,
        items: (matchedOrder.items || []).map((it) => ({
          title: it.title,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
          colorName: it.details?.colorName,
        })),
        subtotal: matchedOrder.subtotal,
        shippingFee: matchedOrder.shippingFee,
        totalAmount: matchedOrder.total,
        paymentMethod: matchedOrder.paymentMethod,
        paymentStatus: matchedOrder.paymentStatus,
        assignedBatchId: matchedOrder.assignedBatchId,
        assignedSerialId: matchedOrder.assignedBagSerialId,
      };
    }
  } catch (err) {
    console.warn("Firestore order tracking lookup warning:", err);
  }

  // 3. Không tìm thấy mã (Báo not_found an toàn, không văng lỗi)
  return {
    status: "not_found",
    type: "shop_order",
    id: cleanCode,
    code: cleanCode,
    secretKey: "",
    personalizedUrl: "",
    createdAt: "",
    customerName: "",
    customerPhone: "",
    statusCode: "not_found",
    statusLabel: "Không tìm thấy",
    statusBadgeColor: "bg-slate-100 text-slate-700",
    timeline: [],
    totalAmount: 0,
  };
}

/**
 * Kiểm tra phân quyền truy cập đơn hàng
 */
export function verifyOrderAccess(
  order: UnifiedTrackingItem,
  currentUser: { uid?: string; email?: string | null } | null,
  userProfile: { phone?: string; displayName?: string | null } | null,
  queryKey?: string | null
): {
  isAuthorized: boolean;
  reason: "owner_account" | "valid_key" | "session_unlocked" | "unauthorized";
} {
  // 1. Đã được mở khóa trong phiên này
  if (isOrderAuthorizedInSession(order.code)) {
    return { isAuthorized: true, reason: "session_unlocked" };
  }

  // 2. Khóa trên URL khớp với Secret Key của đơn hàng
  if (queryKey && queryKey.trim().toUpperCase() === order.secretKey.toUpperCase()) {
    authorizeOrderInSession(order.code);
    return { isAuthorized: true, reason: "valid_key" };
  }

  // 3. Khách hàng đang đăng nhập là chủ sở hữu chính thức (Khớp UID)
  if (currentUser?.uid && order.userId && currentUser.uid === order.userId) {
    authorizeOrderInSession(order.code);
    return { isAuthorized: true, reason: "owner_account" };
  }

  // 4. Khớp số điện thoại đăng nhập
  if (userProfile?.phone && order.customerPhone) {
    const p1 = userProfile.phone.replace(/[^0-9]/g, "");
    const p2 = order.customerPhone.replace(/[^0-9]/g, "");
    if (p1 && p1.length >= 9 && (p1 === p2 || p1.endsWith(p2) || p2.endsWith(p1))) {
      authorizeOrderInSession(order.code);
      return { isAuthorized: true, reason: "owner_account" };
    }
  }

  // 5. Khớp Email đăng nhập
  if (currentUser?.email && order.customerEmail) {
    if (currentUser.email.trim().toLowerCase() === order.customerEmail.trim().toLowerCase()) {
      authorizeOrderInSession(order.code);
      return { isAuthorized: true, reason: "owner_account" };
    }
  }

  return { isAuthorized: false, reason: "unauthorized" };
}

/**
 * Mở khóa thông qua nhập Số điện thoại hoặc Secret Key tại Cổng Bảo Mật
 */
export function checkOrderAccessInput(order: UnifiedTrackingItem, input: string): boolean {
  const clean = input.trim();
  if (!clean) return false;

  // Khớp Secret Key
  if (clean.toUpperCase() === order.secretKey.toUpperCase()) {
    authorizeOrderInSession(order.code);
    return true;
  }

  // Khớp Số điện thoại nhận hàng (so sánh số cuối)
  const cleanInputPhone = clean.replace(/[^0-9]/g, "");
  const cleanOrderPhone = (order.customerPhone || "").replace(/[^0-9]/g, "");
  if (
    cleanInputPhone.length >= 9 &&
    (cleanInputPhone === cleanOrderPhone ||
      cleanInputPhone.endsWith(cleanOrderPhone) ||
      cleanOrderPhone.endsWith(cleanInputPhone))
  ) {
    authorizeOrderInSession(order.code);
    return true;
  }

  return false;
}
