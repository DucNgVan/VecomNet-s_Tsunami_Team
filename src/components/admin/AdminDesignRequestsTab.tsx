"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAllDesignRequests,
  saveDesignRequest,
  DesignRequest,
  RequestStatus,
  TrackingEvent,
} from "@/lib/designRequestStorage";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";
// (Icon-free layout as requested)

export const AdminDesignRequestsTab: React.FC = () => {
  const [requests, setRequests] = useState<DesignRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<DesignRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Concept & Quote Form state
  const [quotePrice, setQuotePrice] = useState<number>(85000);
  const [conceptUrl, setConceptUrl] = useState<string>("/assets/products/bucket-sand.png");
  const [conceptMessage, setConceptMessage] = useState<string>("");

  // Shipment Form state
  const [carrierName, setCarrierName] = useState<string>("GHTK");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [newEventDesc, setNewEventDesc] = useState<string>("");

  const loadRequests = () => {
    const all = getAllDesignRequests();
    setRequests(all);
    if (!selectedReq && all.length > 0) {
      setSelectedReq(all[0]);
      setQuotePrice(all[0].customCharmPrice || 85000);
      setConceptUrl(all[0].conceptImageUrl || "/assets/products/bucket-sand.png");
      setConceptMessage(all[0].conceptNote || "");
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSelectRequest = (req: DesignRequest) => {
    setSelectedReq(req);
    setQuotePrice(req.customCharmPrice || 85000);
    setConceptUrl(req.conceptImageUrl || "/assets/products/bucket-sand.png");
    setConceptMessage(req.conceptNote || "");
    setCarrierName(req.carrier || "GHTK");
    setTrackingNumber(req.trackingCode || "");
  };

  // Update Status
  const handleUpdateStatus = (newStatus: RequestStatus) => {
    if (!selectedReq) return;
    const updated: DesignRequest = {
      ...selectedReq,
      status: newStatus,
    };
    saveDesignRequest(updated);
    setSelectedReq(updated);
    loadRequests();
  };

  // Submit Concept & Quotation
  const handleSendConceptAndQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    const currentVersion = (selectedReq.conceptVersion || 0) + 1;
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);

    const updated: DesignRequest = {
      ...selectedReq,
      status: "concept_sent",
      conceptVersion: currentVersion,
      conceptImageUrl: conceptUrl,
      conceptNote: conceptMessage.trim() || "Concept phác thảo từ xưởng Nét Đà Nẵng",
      customCharmPrice: quotePrice,
      conceptSentAt: now,
      trackingEvents: [
        {
          time: now,
          status: `Đã gửi concept #${currentVersion} & báo giá`,
          location: "Xưởng Nét Đà Nẵng",
          description: `Báo giá charm riêng: ${quotePrice.toLocaleString("vi-VN")} đ. Chờ khách duyệt trên hệ thống.`,
        },
        ...(selectedReq.trackingEvents || []),
      ],
    };

    saveDesignRequest(updated);
    setSelectedReq(updated);
    loadRequests();
    alert(`Đã cập nhật Concept #${currentVersion} và Báo giá cho mã ${selectedReq.id}!`);
  };

  // Add Shipment Event
  const handleAddShipmentEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !newEventDesc.trim()) return;

    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    const newEvent: TrackingEvent = {
      time: now,
      status: "Cập nhật vận chuyển",
      location: "Kho trung chuyển Đà Nẵng",
      description: newEventDesc.trim(),
    };

    const updated: DesignRequest = {
      ...selectedReq,
      carrier: carrierName,
      trackingCode: trackingNumber.trim() || selectedReq.trackingCode,
      status: selectedReq.status === "in_production" ? "shipping" : selectedReq.status,
      trackingEvents: [newEvent, ...(selectedReq.trackingEvents || [])],
    };

    saveDesignRequest(updated);
    setSelectedReq(updated);
    loadRequests();
    setNewEventDesc("");
    alert("Đã cập nhật sự kiện vận chuyển!");
  };

  const filteredRequests = requests.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchQuery =
      searchQuery === "" ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.partnerCode && r.partnerCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchQuery;
  });

  const statusBadge = (status: RequestStatus) => {
    switch (status) {
      case "pending_review":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Chờ tiếp nhận</span>;
      case "concept_sent":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">Đã gửi concept</span>;
      case "approved":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Khách đã duyệt</span>;
      case "revision_requested":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">Cần chỉnh sửa</span>;
      case "in_production":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">Đang chế tác</span>;
      case "shipping":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">Đang giao</span>;
      case "completed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/20 text-green-300 border border-green-500/30">Hoàn thành</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Quản Lý Yêu Cầu Thiết Kế & Concept Studio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tiếp nhận bản phối từ khách hàng, gửi concept phác thảo, nhập báo giá và kiểm tra phản hồi duyệt thiết kế.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-slate-800 text-xs text-slate-300 font-mono">
            Tổng: {requests.length} yêu cầu
          </span>
          <span className="px-3 py-1 rounded-xl bg-blue-950 text-xs text-blue-300 font-mono border border-blue-800">
            Cần duyệt: {requests.filter((r) => r.status === "pending_review" || r.status === "revision_requested").length}
          </span>
        </div>
      </div>

      {/* 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã, tên khách, số điện thoại, mã đối tác..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: "Tất cả" },
                { id: "pending_review", label: "Chờ tiếp nhận" },
                { id: "concept_sent", label: "Đã gửi concept" },
                { id: "approved", label: "Đã duyệt" },
                { id: "revision_requested", label: "Cần sửa" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                    statusFilter === tab.id
                      ? "bg-sky-600 text-white font-semibold"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Request Cards List */}
          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredRequests.map((req) => {
              const isSelected = selectedReq?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => handleSelectRequest(req)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-800/95 border-sky-500 shadow-md ring-1 ring-sky-500/50"
                      : "bg-slate-900/50 border-slate-800 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {req.id}
                    </span>
                    {statusBadge(req.status)}
                  </div>

                  <div className="mt-2 text-xs font-semibold text-white">
                    {req.customerName}{" "}
                    <span className="font-normal text-slate-400">({req.contact})</span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>
                      {req.placedCharms.length} charm · {req.bagName}
                    </span>
                    <span>{req.createdAt}</span>
                  </div>

                  {req.partnerCode && (
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-[10px] text-amber-300 font-mono">
                      <span>Đối tác: {req.partnerCode}</span>
                    </div>
                  )}

                  {req.hasCustomCharm && (
                    <div className="mt-1 text-[11px] text-purple-300 italic truncate">
                      ★ Yêu cầu charm riêng: "{req.customCharm?.idea || req.notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail & Action Column */}
        <div className="lg:col-span-7 space-y-6">
          {selectedReq ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              {/* Header Detail */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-white">
                      {selectedReq.id}
                    </span>
                    {statusBadge(selectedReq.status)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Khách hàng: <strong className="text-slate-200">{selectedReq.customerName}</strong> ({selectedReq.contact})
                  </div>
                </div>

                {/* Change Status Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Trạng thái:</span>
                  <select
                    value={selectedReq.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as RequestStatus)}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="pending_review">Chờ tiếp nhận</option>
                    <option value="concept_sent">Đã gửi concept</option>
                    <option value="approved">Khách đã duyệt</option>
                    <option value="revision_requested">Yêu cầu chỉnh sửa</option>
                    <option value="in_production">Đang chế tác xưởng</option>
                    <option value="shipping">Đang giao hàng</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                </div>
              </div>

              {/* Customer Response Monitoring Alert */}
              {selectedReq.status === "approved" && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                  <strong>Khách đã duyệt phiên bản Concept #{selectedReq.approvedVersion || 1}</strong> vào {selectedReq.approvedAt || "gần đây"}. Xưởng có thể bắt đầu đúc charm và may túi!
                </div>
              )}

              {selectedReq.status === "revision_requested" && (
                <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-800 text-purple-300 text-xs">
                  <strong>Khách yêu cầu chỉnh sửa:</strong> "{selectedReq.customerFeedback}"
                </div>
              )}

              {/* Bag Canvas & Placed Charm Details */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <div className="sm:col-span-5 flex justify-center">
                  <div className="w-[200px]">
                    <NetBag2DCanvas
                      placedCharms={selectedReq.placedCharms}
                      onUpdateCharmPosition={() => {}}
                      onRemoveCharm={() => {}}
                    />
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-2.5 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400">Cách nhận hàng:</span>{" "}
                    <strong>{selectedReq.deliveryMethodLabel}</strong>
                  </div>
                  {selectedReq.partnerCode && (
                    <div>
                      <span className="text-slate-400">Nguồn đối tác:</span>{" "}
                      <span className="font-mono text-amber-400 font-bold">{selectedReq.partnerCode}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block mb-1">Charm đã gắn ({selectedReq.placedCharms.length}):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReq.placedCharms.map((c) => (
                        <span
                          key={c.instanceId}
                          className="px-2 py-0.5 rounded bg-slate-800 text-white text-[11px] border border-slate-700"
                        >
                          {c.charm.symbol} {c.charm.vietnameseName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedReq.hasCustomCharm && selectedReq.customCharm && (
                    <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/60 space-y-1">
                      <span className="text-purple-300 font-semibold block">
                        Yêu cầu charm riêng từ khách:
                      </span>
                      <p className="text-white italic">
                        "{selectedReq.customCharm.idea}"
                      </p>
                      <div className="text-[10px] text-purple-200 flex flex-wrap gap-2 pt-1">
                        <span>Hình dáng: {selectedReq.customCharm.shape}</span>
                        <span>Khắc: {selectedReq.customCharm.engravedText || "Không"}</span>
                        <span>Cỡ: {selectedReq.customCharm.size}</span>
                      </div>
                      {selectedReq.customCharm.referenceImageUrl && (
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-400 block mb-1">Ảnh khách tải lên:</span>
                          <img
                            src={selectedReq.customCharm.referenceImageUrl}
                            alt="Ảnh khách gửi"
                            className="w-16 h-16 object-cover rounded border border-purple-700"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION SECTION 1: UPLOAD CONCEPT & INPUT QUOTE */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    <span>Tải Concept & Nhập Báo Giá Cho Khách</span>
                  </h3>
                  {selectedReq.conceptVersion && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Phiên bản hiện tại: #{selectedReq.conceptVersion}
                    </span>
                  )}
                </div>

                <form onSubmit={handleSendConceptAndQuote} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Báo giá charm riêng (VNĐ):
                      </label>
                      <input
                        type="number"
                        step="5000"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        URL Ảnh Concept phác thảo:
                      </label>
                      <input
                        type="text"
                        value={conceptUrl}
                        onChange={(e) => setConceptUrl(e.target.value)}
                        placeholder="https://... hoặc /assets/products/..."
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Lời nhắn / Thuyết minh concept gửi khách:
                    </label>
                    <textarea
                      rows={2}
                      value={conceptMessage}
                      onChange={(e) => setConceptMessage(e.target.value)}
                      placeholder="Xưởng Nét đã dựng xong phác thảo charm vỏ sò đúc đồng khảm men theo ý bạn..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <span>Lưu & Gửi Concept Báo Giá Đến Khách</span>
                  </button>
                </form>
              </div>

              {/* ACTION SECTION 2: LOGISTICS & SHIPPING TRACKING */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  <span>Cập Nhật Vận Đơn & Hành Trình</span>
                </h3>

                <form onSubmit={handleAddShipmentEvent} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Đơn vị vận chuyển:
                      </label>
                      <input
                        type="text"
                        value={carrierName}
                        onChange={(e) => setCarrierName(e.target.value)}
                        placeholder="GHTK, ViettelPost, Bàn giao đối tác..."
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Mã vận đơn:
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Mã bưu gửi..."
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Thêm cập nhật hành trình mới:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newEventDesc}
                        onChange={(e) => setNewEventDesc(e.target.value)}
                        placeholder="Ví dụ: Đã đóng gói hộp mộc và bàn giao shipper..."
                        className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium cursor-pointer"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </form>

                {/* View Story Passport Link */}
                <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Mã Passport gắn kết: <strong className="text-white font-mono">{selectedReq.passportCode || "DEMO-DN-001"}</strong>
                  </span>
                  <Link
                    href={`/passport?code=${selectedReq.passportCode || "DEMO-DN-001"}`}
                    target="_blank"
                    className="text-teal-400 hover:underline flex items-center"
                  >
                    <span>Mở Story Passport →</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              Chọn một yêu cầu thiết kế bên trái để xem chi tiết
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
