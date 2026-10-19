"use client";

export type TicketCategory =
  | "design_consult"      // Tư vấn thiết kế riêng Nét Studio
  | "order_tracking"     // Tra cứu tiến độ đơn & vận chuyển
  | "warranty_passport"  // Bảo hành & Story Passport
  | "quality_feedback"   // Phản ánh chất lượng sản phẩm
  | "partner_hotel"      // Hợp tác đối tác / Khách sạn B2B
  | "other";             // Yêu cầu khác

export type TicketStatus =
  | "pending"     // Chờ tiếp nhận & phản hồi
  | "in_progress" // Đang xử lý
  | "resolved"    // Đã giải quyết
  | "closed";     // Đã đóng

export interface SupportTicket {
  id: string; // e.g. "NET-TCK-8821"
  createdAt: string;
  customerName: string;
  customerDob?: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;
  category: TicketCategory;
  categoryLabel: string;
  relatedOrderCode?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  statusLabel: string;
  priority: "normal" | "high" | "urgent";
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
}

const STORAGE_KEY = "net_support_tickets_v1";

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  design_consult: "Tư vấn thiết kế riêng (Nét Studio)",
  order_tracking: "Tra cứu tiến độ & Vận chuyển",
  warranty_passport: "Bảo hành & Nét Story Passport",
  quality_feedback: "Phản ánh chất lượng & Đổi trả",
  partner_hotel: "Khách sạn đối tác & Tour B2B",
  other: "Yêu cầu hỗ trợ khác",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  pending: "Chờ phản hồi",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  closed: "Đã đóng",
};

export function getAllSupportTickets(): SupportTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading support tickets:", e);
    return [];
  }
}

export function getTicketsByCustomer(contact: string): SupportTicket[] {
  const all = getAllSupportTickets();
  const clean = contact.trim().toLowerCase();
  return all.filter(
    (t) =>
      t.customerPhone.toLowerCase().includes(clean) ||
      t.customerEmail.toLowerCase().includes(clean)
  );
}

export function createSupportTicket(params: {
  customerName: string;
  customerDob?: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;
  category: TicketCategory;
  relatedOrderCode?: string;
  subject: string;
  message: string;
  priority?: "normal" | "high" | "urgent";
}): SupportTicket {
  const all = getAllSupportTickets();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newTicket: SupportTicket = {
    id: `NET-TCK-${randomSuffix}`,
    createdAt: new Date().toISOString(),
    customerName: params.customerName.trim(),
    customerDob: params.customerDob?.trim(),
    customerPhone: params.customerPhone.trim(),
    customerEmail: params.customerEmail.trim(),
    customerAddress: params.customerAddress?.trim(),
    category: params.category,
    categoryLabel: CATEGORY_LABELS[params.category] || "Hỗ trợ chung",
    relatedOrderCode: params.relatedOrderCode?.trim() || undefined,
    subject: params.subject.trim(),
    message: params.message.trim(),
    status: "pending",
    statusLabel: STATUS_LABELS.pending,
    priority: params.priority || "normal",
  };

  const updated = [newTicket, ...all];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newTicket;
}

export function replySupportTicket(
  ticketId: string,
  replyText: string,
  newStatus: TicketStatus = "resolved",
  adminName: string = "Quản trị viên NÉT"
): SupportTicket | undefined {
  const all = getAllSupportTickets();
  const index = all.findIndex((t) => t.id.toUpperCase() === ticketId.trim().toUpperCase());
  if (index < 0) return undefined;

  const target = all[index];
  target.adminReply = replyText.trim();
  target.repliedAt = new Date().toISOString();
  target.repliedBy = adminName;
  target.status = newStatus;
  target.statusLabel = STATUS_LABELS[newStatus];

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
  return target;
}

export function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus
): SupportTicket | undefined {
  const all = getAllSupportTickets();
  const index = all.findIndex((t) => t.id.toUpperCase() === ticketId.trim().toUpperCase());
  if (index < 0) return undefined;

  all[index].status = newStatus;
  all[index].statusLabel = STATUS_LABELS[newStatus];

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
  return all[index];
}

export function deleteSupportTicket(ticketId: string): boolean {
  const all = getAllSupportTickets();
  const filtered = all.filter((t) => t.id.toUpperCase() !== ticketId.trim().toUpperCase());
  if (filtered.length === all.length) return false;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  return true;
}
