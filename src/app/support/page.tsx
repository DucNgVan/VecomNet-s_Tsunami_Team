"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastNotification";
import {
  TicketCategory,
  SupportTicket,
  CATEGORY_LABELS,
  STATUS_LABELS,
  createSupportTicket,
  getTicketsByCustomer,
} from "@/lib/supportTicketStorage";
import {
  HelpCircle,
  Send,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Package,
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function SupportPage() {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"create" | "lookup">("create");

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerDob, setCustomerDob] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [category, setCategory] = useState<TicketCategory>("design_consult");
  const [relatedOrderCode, setRelatedOrderCode] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  // Lookup state
  const [lookupContact, setLookupContact] = useState("");
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-fill form from logged-in user profile
  useEffect(() => {
    if (userProfile || user) {
      setCustomerName(userProfile?.displayName || user?.displayName || "");
      setCustomerPhone(userProfile?.phone || "");
      setCustomerEmail(user?.email || "");
      setCustomerAddress(userProfile?.address || "");
      setCustomerDob(userProfile?.dob || "");

      // Auto load tickets for user
      const contact = userProfile?.phone || user?.email || "";
      if (contact) {
        setLookupContact(contact);
        const list = getTicketsByCustomer(contact);
        setMyTickets(list);
      }
    }
  }, [userProfile, user]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      showToast("Vui lòng điền họ tên, số điện thoại và email liên hệ!", "error");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      showToast("Vui lòng nhập tiêu đề và nội dung cần hỗ trợ!", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const ticket = createSupportTicket({
        customerName,
        customerDob,
        customerPhone,
        customerEmail,
        customerAddress,
        category,
        relatedOrderCode,
        subject,
        message,
      });

      setCreatedTicketId(ticket.id);
      showToast(`Đã gửi ticket ${ticket.id} thành công đến Ban Quản Trị NÉT!`, "success");

      // Reload lookup
      const list = getTicketsByCustomer(customerPhone || customerEmail);
      setMyTickets(list);

      // Reset fields
      setSubject("");
      setMessage("");
      setRelatedOrderCode("");
    } catch (err) {
      showToast("Có lỗi xảy ra khi gửi yêu cầu hỗ trợ", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupContact.trim()) {
      showToast("Vui lòng nhập số điện thoại hoặc email để tra cứu", "info");
      return;
    }
    const list = getTicketsByCustomer(lookupContact.trim());
    setMyTickets(list);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241B16] py-12 sm:py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#B85D43] text-[11px] font-semibold uppercase tracking-wider border border-[#E8E2D8] mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>TRUNG TÂM TIẾP NHẬN YÊU CẦU & BẢO HÀNH</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#241B16]">
            Hỗ Trợ Khách Hàng NÉT
          </h1>
          <p className="text-xs sm:text-sm text-[#5E4D43] max-w-xl mx-auto leading-relaxed">
            Gửi yêu cầu hỗ trợ, tư vấn thiết kế riêng tại Studio, kiểm tra tiến độ đơn hàng hoặc yêu cầu bảo hành Story Passport trực tiếp đến ban quản trị.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F3ECE1] text-xs font-medium max-w-md w-full">
            <button
              type="button"
              onClick={() => {
                setActiveTab("create");
                setCreatedTicketId(null);
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "create"
                  ? "bg-white text-[#241B16] font-semibold shadow-xs"
                  : "text-[#7A6F68] hover:text-[#241B16]"
              }`}
            >
              Gửi Ticket Mới
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lookup")}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "lookup"
                  ? "bg-white text-[#241B16] font-semibold shadow-xs"
                  : "text-[#7A6F68] hover:text-[#241B16]"
              }`}
            >
              Tra Cứu Ticket Đã Gửi ({myTickets.length})
            </button>
          </div>
        </div>

        {/* TAB 1: CREATE TICKET FORM */}
        {activeTab === "create" && (
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {createdTicketId && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F9F6] border border-[#D1E7DD] space-y-2">
                <div className="flex items-center gap-2 text-[#2D5E4E] font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Ticket của bạn đã được tiếp nhận thành công!</span>
                </div>
                <p className="text-xs text-[#2D5E4E] leading-relaxed">
                  Mã ticket hỗ trợ: <strong className="font-mono text-sm">{createdTicketId}</strong>.
                  Ban quản trị NÉT sẽ phản hồi qua số điện thoại hoặc email của bạn trong thời gian sớm nhất.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("lookup")}
                    className="text-xs font-semibold text-[#2D5E4E] hover:underline"
                  >
                    Xem lịch sử và trạng thái phản hồi →
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#B85D43] border-b border-[#E8E2D8] pb-1">
                1. Thông Tin Khách Hàng (Đảm bảo chính xác để nhận phản hồi)
              </div>

              {/* Row 1: Name & DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">
                    Họ và tên khách hàng *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">
                    Ngày sinh (Tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={customerDob}
                    onChange={(e) => setCustomerDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0905 xxx xxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">
                    Email tài khoản *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="tenban@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                  />
                </div>
              </div>

              {/* Row 3: Address */}
              <div>
                <label className="block text-xs font-medium text-[#42342B] mb-1">
                  Địa chỉ giao nhận chi tiết
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                />
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-[#B85D43] border-b border-[#E8E2D8] pb-1 pt-3">
                2. Nội Dung Yêu Cầu Hỗ Trợ
              </div>

              {/* Row 4: Category & Related Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">
                    Danh mục cần hỗ trợ *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43] cursor-pointer"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">
                    Mã đơn hàng / Mã thiết kế (Nếu có)
                  </label>
                  <input
                    type="text"
                    value={relatedOrderCode}
                    onChange={(e) => setRelatedOrderCode(e.target.value)}
                    placeholder="NET-REQ-8819 / NET-ORD-001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                  />
                </div>
              </div>

              {/* Row 5: Subject */}
              <div>
                <label className="block text-xs font-medium text-[#42342B] mb-1">
                  Tiêu đề yêu cầu *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ví dụ: Tư vấn kích thước charm Cầu Rồng / Yêu cầu đổi địa chỉ nhận..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                />
              </div>

              {/* Row 6: Detailed Message */}
              <div>
                <label className="block text-xs font-medium text-[#42342B] mb-1">
                  Mô tả chi tiết nội dung cần giải đáp hoặc hỗ trợ *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mô tả cụ thể thắc mắc, vấn đề cần xưởng hỗ trợ hoặc thời gian bạn muốn nhận hàng..."
                  className="w-full p-3.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43] leading-relaxed"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-medium shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Đang gửi ticket..." : "Gửi Yêu Cầu Hỗ Trợ Đến Admin"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: LOOKUP TICKETS */}
        {activeTab === "lookup" && (
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <form onSubmit={handleLookup} className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={lookupContact}
                onChange={(e) => setLookupContact(e.target.value)}
                placeholder="Nhập số điện thoại hoặc email đã gửi ticket..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] outline-none focus:border-[#B85D43]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#241B16] hover:bg-[#352720] text-white text-xs font-medium shrink-0 cursor-pointer"
              >
                Tra cứu
              </button>
            </form>

            <div className="space-y-4 pt-2">
              {myTickets.length > 0 ? (
                myTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2D8] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#B85D43] bg-white px-2 py-0.5 rounded border border-[#E8E2D8]">
                          #{t.id}
                        </span>
                        <span className="text-xs font-semibold text-[#241B16]">{t.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            t.status === "resolved"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                              : t.status === "in_progress"
                              ? "bg-sky-50 text-sky-900 border-sky-200"
                              : "bg-amber-50 text-amber-900 border-amber-200"
                          }`}
                        >
                          {t.statusLabel}
                        </span>
                        <span className="text-[10px] text-[#7A6F68]">
                          {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#5E4D43] space-y-1">
                      <div>
                        <strong>Phân loại:</strong> {t.categoryLabel}
                        {t.relatedOrderCode && (
                          <span className="ml-2">
                            • Đơn liên quan: <strong>{t.relatedOrderCode}</strong>
                          </span>
                        )}
                      </div>
                      <p className="bg-white p-3 rounded-xl border border-[#E8E2D8] text-[#241B16] italic">
                        "{t.message}"
                      </p>
                    </div>

                    {/* Admin Reply */}
                    {t.adminReply ? (
                      <div className="p-3.5 rounded-xl bg-[#F4F9F6] border border-[#D1E7DD] space-y-1 text-xs">
                        <div className="font-bold text-[#2D5E4E] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#2D5E4E]" />
                          <span>Phản hồi từ Admin ({t.repliedBy || "Quản trị viên NÉT"}):</span>
                        </div>
                        <p className="text-[#241B16] leading-relaxed whitespace-pre-wrap pl-5">
                          {t.adminReply}
                        </p>
                        {t.repliedAt && (
                          <div className="text-[10px] text-[#7A6F68] pl-5">
                            Thời gian phản hồi: {new Date(t.repliedAt).toLocaleString("vi-VN")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#7A6F68] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Yêu cầu đang chờ quản trị viên xử lý và phản hồi.</span>
                      </div>
                    )}
                  </div>
                ))
              ) : hasSearched ? (
                <div className="text-center py-10 text-[#7A6F68] text-xs">
                  Không tìm thấy ticket nào gắn với thông tin liên hệ này.
                </div>
              ) : (
                <div className="text-center py-10 text-[#7A6F68] text-xs">
                  Nhập số điện thoại hoặc email phía trên để xem các yêu cầu đã gửi.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
