"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  SupportTicket,
  TicketStatus,
  TicketCategory,
  getAllSupportTickets,
  replySupportTicket,
  updateTicketStatus,
  deleteSupportTicket,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/supportTicketStorage";

export const AdminSupportTab: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Reply form state
  const [replyText, setReplyText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = () => {
    const list = getAllSupportTickets();
    setTickets(list);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      setReplyText(selectedTicket.adminReply || "");
    }
  }, [selectedTicket]);

  // Statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter((t) => t.status === "pending").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    return { total, pending, inProgress, resolved };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = t.id.toLowerCase().includes(q);
        const matchName = t.customerName.toLowerCase().includes(q);
        const matchPhone = t.customerPhone.toLowerCase().includes(q);
        const matchEmail = t.customerEmail.toLowerCase().includes(q);
        const matchSubject = t.subject.toLowerCase().includes(q);
        const matchOrder = t.relatedOrderCode?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone && !matchEmail && !matchSubject && !matchOrder) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchTerm]);

  const handleSendReply = (newStatus: TicketStatus) => {
    if (!selectedTicket || !replyText.trim()) {
      alert("Vui lòng nhập nội dung phản hồi trước khi gửi!");
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = replySupportTicket(selectedTicket.id, replyText.trim(), newStatus);
      if (updated) {
        setSelectedTicket(updated);
        loadTickets();
        alert(`Đã lưu phản hồi và chuyển trạng thái ticket sang: ${STATUS_LABELS[newStatus]}!`);
      }
    } catch (e) {
      alert("Lỗi khi lưu phản hồi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm(`Bạn có chắc muốn xóa ticket hỗ trợ ${id}?`)) return;
    deleteSupportTicket(id);
    if (selectedTicket?.id === id) {
      setSelectedTicket(null);
    }
    loadTickets();
  };

  const renderStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            Chờ phản hồi
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-900 border border-sky-200">
            Đang xử lý
          </span>
        );
      case "resolved":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            Đã giải quyết
          </span>
        );
      case "closed":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Đã đóng
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 text-[#241B16]">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E2D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5ECE5] text-[#B85D43] border border-[#E4D1C3]">
              Trung Tâm Hỗ Trợ Khách Hàng
            </span>
            <span className="text-xs text-[#8F8177]">NÉT Ticket Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#241B16] tracking-tight">
            Quản Lý Yêu Cầu Hỗ Trợ & Ticket
          </h1>
          <p className="text-xs sm:text-sm text-[#5E4D43] mt-1 max-w-2xl leading-relaxed">
            Tiếp nhận và phản hồi các thắc mắc về thiết kế Nét Studio, tra cứu vận chuyển đơn hàng, bảo hành điện tử và hỗ trợ đối tác B2B.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadTickets}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-medium text-[#5E4D43] transition-colors cursor-pointer"
          >
            Làm mới danh sách
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter("all")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "all"
              ? "bg-white border-[#B85D43] shadow-sm ring-1 ring-[#B85D43]/30"
              : "bg-white/70 border-[#E8E2D8] hover:bg-white"
          }`}
        >
          <div className="text-[#8F8177] text-xs font-medium">Tổng Ticket Tiếp Nhận</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl text-[#241B16]">{stats.total}</span>
            <span className="text-xs text-[#5E4D43]">yêu cầu</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("pending")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "pending"
              ? "bg-[#FDF9F0] border-[#B85D43] shadow-sm ring-1 ring-[#B85D43]/30"
              : "bg-white/70 border-[#E8E2D8] hover:bg-white"
          }`}
        >
          <div className="text-[#B85D43] text-xs font-medium">Chờ Phản Hồi</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl text-[#B85D43]">{stats.pending}</span>
            <span className="text-xs text-[#5E4D43]">cần xử lý sớm</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("in_progress")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "in_progress"
              ? "bg-[#F4F7FC] border-[#2563EB] shadow-sm ring-1 ring-[#2563EB]/30"
              : "bg-white/70 border-[#E8E2D8] hover:bg-white"
          }`}
        >
          <div className="text-[#2563EB] text-xs font-medium">Đang Xử Lý</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl text-[#2563EB]">{stats.inProgress}</span>
            <span className="text-xs text-[#5E4D43]">đang hỗ trợ</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("resolved")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "resolved"
              ? "bg-[#F4F9F6] border-[#2D5E4E] shadow-sm ring-1 ring-[#2D5E4E]/30"
              : "bg-white/70 border-[#E8E2D8] hover:bg-white"
          }`}
        >
          <div className="text-[#2D5E4E] text-xs font-medium">Đã Giải Quyết</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl text-[#2D5E4E]">{stats.resolved}</span>
            <span className="text-xs text-[#5E4D43]">hoàn tất</span>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E2D8] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EAE1] pb-3.5">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#F6F2EB] border border-[#E8E2D8]/80 text-xs">
            {[
              { id: "all", label: "Tất Cả", count: stats.total },
              { id: "pending", label: "Chờ Phản Hồi", count: stats.pending },
              { id: "in_progress", label: "Đang Xử Lý", count: stats.inProgress },
              { id: "resolved", label: "Đã Giải Quyết", count: stats.resolved },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-white text-[#241B16] shadow-xs font-semibold"
                    : "text-[#5E4D43] hover:text-[#241B16]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#EAE2D7] text-[#5E4D43]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, SĐT, mã ticket, email..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs text-[#241B16] placeholder-[#8F8177] outline-none focus:border-[#B85D43]"
            />
          </div>
        </div>

        {/* 4. Tickets Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#E8E2D8]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#8F8177] font-semibold border-b border-[#E8E2D8] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Mã Ticket & Ngày Gửi</th>
                <th className="py-3 px-4">Khách Hàng & Giao Nhận</th>
                <th className="py-3 px-4">Chủ Đề & Yêu Cầu</th>
                <th className="py-3 px-4">Đơn Hàng Gắn Kèm</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="hover:bg-[#FAF7F2]/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-[#241B16]">{t.id}</div>
                      <div className="text-[10px] text-[#8F8177] mt-0.5">
                        {new Date(t.createdAt).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top max-w-[240px]">
                      <div className="font-semibold text-[#241B16]">{t.customerName}</div>
                      {t.customerDob && (
                        <div className="text-[10px] text-[#7A6F68]">
                          Ngày sinh: {t.customerDob}
                        </div>
                      )}
                      <div className="text-[11px] text-[#5E4D43] mt-0.5">
                        SĐT: {t.customerPhone}
                      </div>
                      <div className="text-[10px] text-[#8F8177] truncate">
                        {t.customerEmail}
                      </div>
                      {t.customerAddress && (
                        <div className="text-[10px] text-[#8F8177] break-words line-clamp-2 mt-0.5">
                          Đ/c: {t.customerAddress}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top max-w-[280px]">
                      <div className="inline-block px-2 py-0.5 rounded bg-[#FAF7F2] text-[#B85D43] border border-[#E8E2D8] text-[10px] font-medium mb-1">
                        {t.categoryLabel}
                      </div>
                      <div className="font-semibold text-[#241B16] line-clamp-1">{t.subject}</div>
                      <div className="text-[11px] text-[#7A6F68] line-clamp-2 mt-0.5 italic">
                        "{t.message}"
                      </div>
                      {t.adminReply && (
                        <div className="text-[10px] text-emerald-800 mt-1 font-medium">
                          ✓ Đã phản hồi: "{t.adminReply.slice(0, 45)}..."
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      {t.relatedOrderCode ? (
                        <span className="font-mono text-xs font-bold text-[#241B16] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8E2D8]">
                          {t.relatedOrderCode}
                        </span>
                      ) : (
                        <span className="text-[#8F8177] text-[11px]">Không gắn kèm</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      {renderStatusBadge(t.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right align-top">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(t);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF7F2] text-xs font-semibold text-[#241B16] transition-all cursor-pointer"
                      >
                        Xử lý
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#8F8177]">
                    <p className="font-serif text-base text-[#241B16]">Không có ticket hỗ trợ nào</p>
                    <p className="text-xs text-[#5E4D43] mt-1">
                      Khi khách hàng gửi ticket từ website hoặc trang cá nhân, thông tin sẽ xuất hiện tại đây.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detail & Reply Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-[#241B16]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E2D8] max-h-[92vh] overflow-y-auto animate-scaleUp text-[#241B16]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#F5ECE5] text-[#B85D43] border border-[#E4D1C3]">
                    {selectedTicket.categoryLabel}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#8F8177]">
                    #{selectedTicket.id}
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#241B16] mt-1">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E8E2D8] text-xs font-semibold text-[#5E4D43] transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Customer Information Card (MANDATORY: Name, DOB, Phone, Address without clipping) */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2.5 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#B85D43] border-b border-[#E8E2D8] pb-1">
                Hồ Sơ Khách Hàng Gửi Yêu Cầu
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[#8F8177] block text-[10px]">Họ và tên:</span>
                  <strong className="text-sm font-semibold text-[#241B16]">{selectedTicket.customerName}</strong>
                </div>
                <div>
                  <span className="text-[#8F8177] block text-[10px]">Ngày sinh:</span>
                  <strong className="text-xs font-medium text-[#241B16]">
                    {selectedTicket.customerDob || "Chưa cung cấp"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#8F8177] block text-[10px]">Số điện thoại:</span>
                  <strong className="text-xs font-semibold text-[#241B16]">{selectedTicket.customerPhone}</strong>
                </div>
                <div>
                  <span className="text-[#8F8177] block text-[10px]">Email:</span>
                  <span className="text-xs text-[#5E4D43]">{selectedTicket.customerEmail}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8E2D8]">
                <span className="text-[#8F8177] block text-[10px]">Địa chỉ giao nhận chi tiết:</span>
                <p className="text-xs text-[#241B16] font-medium break-words whitespace-normal mt-0.5">
                  {selectedTicket.customerAddress || "Chưa cung cấp địa chỉ cụ thể"}
                </p>
              </div>

              {selectedTicket.relatedOrderCode && (
                <div className="pt-2 border-t border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px]">Mã đơn hàng liên quan:</span>
                  <strong className="font-mono text-xs text-[#B85D43]">
                    {selectedTicket.relatedOrderCode}
                  </strong>
                </div>
              )}
            </div>

            {/* Customer Message Body */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5E4D43]">
                Nội Dung Khách Hàng Gửi Đến ({new Date(selectedTicket.createdAt).toLocaleString("vi-VN")}):
              </div>
              <p className="text-xs text-[#241B16] leading-relaxed whitespace-pre-wrap bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8]">
                {selectedTicket.message}
              </p>
            </div>

            {/* Admin Response Form */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FCF9F6] border border-[#E4D1C3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#241B16]">
                  Nội Dung Phản Hồi Từ Quản Trị Viên:
                </span>
                {selectedTicket.repliedAt && (
                  <span className="text-[10px] text-[#8F8177]">
                    Lần cuối: {new Date(selectedTicket.repliedAt).toLocaleString("vi-VN")}
                  </span>
                )}
              </div>

              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập nội dung giải đáp, hướng dẫn bảo hành hoặc thông báo tiến độ gửi đến khách hàng..."
                className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-white text-xs text-[#241B16] outline-none focus:border-[#B85D43] leading-relaxed"
              />

              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedTicket.id)}
                  className="px-3 py-2 rounded-xl text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  Xóa ticket
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSendReply("in_progress")}
                    className="px-4 py-2 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF7F2] text-xs font-semibold text-[#5E4D43] transition-all cursor-pointer disabled:opacity-50"
                  >
                    Lưu & Đang Xử Lý
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSendReply("resolved")}
                    className="px-4 py-2 rounded-xl bg-[#2D5E4E] hover:bg-[#234B3E] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    Gửi Phản Hồi & ĐÃ GIẢI QUYẾT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
