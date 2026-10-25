import { PlacedCharm, BagMeshColor } from "@/types";
import { deductInventoryForCustomOrder } from "@/lib/inventoryStorage";

export type DeliveryMethod =
  | "partner_pickup"
  | "home_delivery"
  | "workshop_pickup";

export type RequestStatus =
  | "pending_review"       // Chờ tiếp nhận
  | "concept_sent"         // Đã gửi concept & báo giá
  | "approved"             // Khách đã duyệt thiết kế & giá
  | "confirmed"            // Đã xác nhận đơn hàng có sẵn (không cần duyệt)
  | "revision_requested"   // Khách yêu cầu chỉnh sửa
  | "in_production"        // Đang chế tác xưởng
  | "shipping"             // Đang vận chuyển
  | "completed"            // Đã hoàn thành (Chỉ khi khách xác nhận nhận hàng)
  | "cancelled";           // Đã huỷ

export interface TrackingEvent {
  time: string;
  status: string;
  location: string;
  description: string;
}

export interface CustomCharmSpec {
  idea: string;
  referenceImageUrl?: string;
  imageUrl?: string;          // Ảnh render 3D chân thực của móc khoá
  imageProvider?: string;     // openai | flux-3d
  subjectCategory?: string;   // human | animal | flora | landmark_object | creative_abstract
  shape: "circle" | "square" | "teardrop" | "heart" | "freeform";
  color: string;
  size: "small" | "medium" | "large";
  engravedText?: string;
  svgCode?: string;          // Mã vector SVG từ Gemini AI
  stlData?: string;          // Chuỗi dữ liệu file 3D (.STL)
  motifName?: string;        // Tên biểu tượng (Ví dụ: Rùa Biển Sơn Trà)
  story?: string;            // Ý nghĩa câu chuyện văn hóa / đại dương
  pinSpecs?: {
    diameterMm: number;
    heightMm: number;
    type: string;
  };
}

export interface DesignRequest {
  id: string; // e.g. "NET-2026-8819"
  createdAt: string;
  customerName: string;
  customerDob?: string;       // Ngày sinh khách hàng
  contact: string;            // SĐT hoặc email
  customerPhone?: string;     // Số điện thoại nhận hàng
  customerEmail?: string;     // Email khách hàng
  customerAddress?: string;   // Địa chỉ giao nhận chi tiết
  customerCity?: string;
  deliveryMethod: DeliveryMethod;
  deliveryMethodLabel: string;
  partnerCode?: string;
  allowStoryOnPassport: boolean;
  notes?: string;

  // Bag configuration
  bagId: string;
  bagName: string;
  bagPrice: number;
  bagColor: BagMeshColor;
  placedCharms: PlacedCharm[];
  charmsTotal: number;

  // Custom Charm Spec (if any)
  hasCustomCharm: boolean;
  customCharm?: CustomCharmSpec;

  // Pricing & Status
  baseTotal: number;
  customCharmPrice?: number; // Quoted by admin
  finalTotal?: number;
  status: RequestStatus;

  // Concept & Versioning
  conceptVersion?: number;
  conceptImageUrl?: string;
  conceptNote?: string;
  conceptSentAt?: string;

  // Customer Feedback & Approval
  customerFeedback?: string;
  approvedVersion?: number;
  approvedAt?: string;

  // Logistics / Shipping
  carrier?: string; // GHTK, ViettelPost, Khách sạn đối tác
  trackingCode?: string;
  trackingEvents?: TrackingEvent[];

  // Story Passport Link
  passportCode?: string;

  // Inventory deduction tracking
  inventoryDeducted?: boolean;
  inventoryDeductedLog?: string;
  inventoryDeductedAt?: string;
}

const STORAGE_KEY = "net_design_requests_v2";

// Clean state: Không chèn mẫu giả định để chỉ nhận đơn thật của khách hàng
const SAMPLE_REQUESTS: DesignRequest[] = [];

export function getAllDesignRequests(): DesignRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: DesignRequest[] = JSON.parse(raw);
    // Purge any lingering old mock requests with sample IDs
    const mockIds = ["NET-DN-8821", "NET-2026-8819", "NET-2026-8820", "NET-2026-8822"];
    const cleaned = list.filter((r) => !mockIds.includes(r.id));
    if (cleaned.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error("Error reading design requests:", e);
    return [];
  }
}

export function getDesignRequestById(id: string): DesignRequest | undefined {
  const all = getAllDesignRequests();
  const clean = id.trim().toUpperCase();
  return all.find((r) => r.id.toUpperCase() === clean);
}

export function saveDesignRequest(req: DesignRequest): DesignRequest[] {
  const all = getAllDesignRequests();
  const index = all.findIndex((r) => r.id.toUpperCase() === req.id.toUpperCase());
  let updated: DesignRequest[];
  if (index >= 0) {
    updated = [...all];
    updated[index] = req;
  } else {
    updated = [req, ...all];
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving design requests:", e);
    }
  }
  return updated;
}

/**
 * Phê duyệt báo giá và tự động trừ tồn kho (túi phôi + các charm)
 */
export function approveRequestQuote(
  id: string,
  version: number,
  customerNote?: string
): DesignRequest | undefined {
  const all = getAllDesignRequests();
  const req = all.find((r) => r.id.toUpperCase() === id.trim().toUpperCase());
  if (!req) return undefined;

  req.status = "approved";
  req.approvedVersion = version;
  req.approvedAt = new Date().toISOString().replace("T", " ").slice(0, 16);
  if (customerNote) {
    req.customerFeedback = customerNote;
  }

  // Tự động trừ túi phôi & charm nếu chưa trừ
  if (!req.inventoryDeducted) {
    const deductRes = deductInventoryForCustomOrder({
      orderId: req.id,
      bagId: req.bagId,
      bagName: req.bagName,
      placedCharms: (req.placedCharms || []).map((p) => ({
        charmId: p.charmId,
        vietnameseName: p.charm?.vietnameseName,
      })),
    });
    req.inventoryDeducted = true;
    req.inventoryDeductedAt = req.approvedAt;
    req.inventoryDeductedLog = deductRes.log;
  }

  // Add event
  const newEvent: TrackingEvent = {
    time: req.approvedAt,
    status: "Khách đã duyệt concept & báo giá",
    location: "Trực tuyến",
    description: `Khách hàng xác nhận duyệt phiên bản concept #${version}. Kho đã tự động trừ 1 túi phôi và các charm tương ứng.`,
  };
  req.trackingEvents = [newEvent, ...(req.trackingEvents || [])];

  saveDesignRequest(req);
  return req;
}

export function requestDesignRevision(
  id: string,
  feedback: string
): DesignRequest | undefined {
  const all = getAllDesignRequests();
  const req = all.find((r) => r.id.toUpperCase() === id.trim().toUpperCase());
  if (!req) return undefined;

  req.status = "revision_requested";
  req.customerFeedback = feedback;

  const now = new Date().toISOString().replace("T", " ").slice(0, 16);
  const newEvent: TrackingEvent = {
    time: now,
    status: "Yêu cầu chỉnh sửa concept",
    location: "Trực tuyến",
    description: `Khách hàng gửi phản hồi: "${feedback}". Đội ngũ thiết kế sẽ điều chỉnh và gửi lại bạn.`,
  };
  req.trackingEvents = [newEvent, ...(req.trackingEvents || [])];

  saveDesignRequest(req);
  return req;
}

export function generateRequestId(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `NET-REQ-${random}`;
}
