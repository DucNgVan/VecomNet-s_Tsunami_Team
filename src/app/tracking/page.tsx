"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  RotateCw,
  MessageSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  getDesignRequestById,
  getAllDesignRequests,
  saveDesignRequest,
  approveRequestQuote,
  requestDesignRevision,
  DesignRequest,
} from "@/lib/designRequestStorage";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(codeParam);
  const [currentRequest, setCurrentRequest] = useState<DesignRequest | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Revision modal state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (codeParam) {
      handleSearch(codeParam);
    } else {
      const all = getAllDesignRequests();
      if (all.length > 0) {
        setInputCode(all[0].id);
        handleSearch(all[0].id);
      }
    }
  }, [codeParam]);

  const handleSearch = (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    const req = getDesignRequestById(codeToSearch.trim());
    if (req) {
      setCurrentRequest(req);
      setNotFound(false);
    } else {
      setCurrentRequest(null);
      setNotFound(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      router.push(`/tracking?code=${encodeURIComponent(inputCode.trim().toUpperCase())}`);
      handleSearch(inputCode.trim());
    }
  };

  // Customer Approves Quote
  const handleApprove = () => {
    if (!currentRequest) return;
    const version = currentRequest.conceptVersion || 1;
    const updated = approveRequestQuote(currentRequest.id, version);
    if (updated) {
      setCurrentRequest({ ...updated });
      setApprovalFeedback(
        `Bạn đã duyệt thành công phiên bản Concept #${version}. Xưởng Nét sẽ tiến hành chế tác ngay!`
      );
    }
  };

  // Customer Requests Revision
  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRequest || !revisionNote.trim()) return;

    setIsSubmittingRevision(true);
    const updated = requestDesignRevision(currentRequest.id, revisionNote.trim());
    if (updated) {
      setCurrentRequest({ ...updated });
      setIsRevisionModalOpen(false);
      setRevisionNote("");
      setApprovalFeedback(
        "Yêu cầu chỉnh sửa của bạn đã được chuyển tới nhóm thiết kế. Chúng mình sẽ liên hệ và cập nhật lại sớm nhất!"
      );
    }
    setIsSubmittingRevision(false);
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending_review: {
      label: "Chờ tiếp nhận",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    },
    concept_sent: {
      label: "Đã có concept & báo giá",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    approved: {
      label: "Đã duyệt thiết kế",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    revision_requested: {
      label: "Đang chỉnh sửa theo yêu cầu",
      color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    in_production: {
      label: "Đang chế tác tại xưởng",
      color: "bg-teal-100 text-teal-800 border-teal-200",
    },
    shipping: {
      label: "Đang giao hàng",
      color: "bg-sky-100 text-sky-800 border-sky-200",
    },
    completed: {
      label: "Hoàn tất bàn giao",
      color: "bg-green-100 text-green-800 border-green-200",
    },
  };

  const faqItems = [
    {
      q: "Charm custom được xử lý thế nào?",
      a: "Sau khi bạn gửi mô tả hoặc ảnh, nghệ nhân Nét sẽ tạo bản phác thảo tỉ lệ 1:1 và báo giá chính xác. Bạn chỉ cần duyệt thiết kế ngay tại trang này để xưởng bắt đầu đúc đồng và ghép men gốm.",
    },
    {
      q: "Giao nhận và đổi trả",
      a: "Khách lưu trú tại đối tác (khách sạn, resort) có thể nhận hàng tại quầy lễ tân hoặc được giao tận phòng. Với khách toàn quốc, Nét hợp tác cùng đơn vị vận chuyển uy tín (GHTK/ViettelPost) với mã vận đơn cập nhật thời gian thực.",
    },
    {
      q: "Thông tin và ảnh của tôi",
      a: "Ảnh và câu chuyện kỷ niệm của bạn chỉ được dùng cho mục đích chế tác và hiển thị trên Story Passport cá nhân hóa nếu bạn đồng ý. Nét cam kết không chia sẻ cho bên thứ ba.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] text-[#2D231E] py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-10">
        {/* Title Header (Mockup: 1fe80232-974b-4865-916a-8293c129d8e8.jpeg) */}
        <div>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#241B16] font-normal">
            Hành trình thiết kế{" "}
            <span className="italic font-serif text-[#B85D43]">
              của bạn.
            </span>
          </h1>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-4 shadow-xs">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
              SAU KHI GỬI YÊU CẦU
            </div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-1">
              Theo dõi & duyệt thiết kế
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6F68] mt-1">
              Tra cứu trong phiên thử nghiệm riêng tư của bạn. Lưu mã sau khi gửi để xem tiến độ.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="NET-XXXXXXXX"
              className="w-full sm:flex-1 p-3.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] font-mono text-sm uppercase text-[#241B16] focus:outline-none focus:border-[#B85D43]"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-medium shadow-xs transition-all whitespace-nowrap cursor-pointer"
            >
              Tra cứu
            </button>
          </form>
        </div>

        {/* Feedback Message */}
        {approvalFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{approvalFeedback}</span>
          </motion.div>
        )}

        {/* Not Found Notice */}
        {notFound && (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm text-center">
            Không tìm thấy mã yêu cầu "{inputCode}". Bạn vui lòng kiểm tra lại mã đã lưu hoặc tạo yêu cầu thiết kế mới tại Nét Studio.
          </div>
        )}

        {/* Request Details Result */}
        {currentRequest && (
          <div className="space-y-8">
            {/* 1. Header Information & Status */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-[#B85D43]">
                      {currentRequest.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        statusMap[currentRequest.status]?.color ||
                        "bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      {statusMap[currentRequest.status]?.label || currentRequest.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#7A6F68] mt-1.5">
                    Khách hàng: <strong className="text-[#241B16]">{currentRequest.customerName}</strong> · Tạo lúc {currentRequest.createdAt}
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-[#5E4D43]">
                  <div>Cách nhận: <strong>{currentRequest.deliveryMethodLabel}</strong></div>
                  {currentRequest.partnerCode && (
                    <div className="text-[#B85D43] font-medium mt-0.5">
                      Gắn mã đối tác: {currentRequest.partnerCode}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Concept & Quote Approval Box */}
              {currentRequest.status === "concept_sent" && (
                <div className="p-6 rounded-2xl bg-[#FAF7F2] border-2 border-[#B85D43]/30 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif tracking-[0.2em] uppercase text-[#B85D43] font-bold">
                      CONCEPT CHỜ BẠN DUYỆT (PHIÊN BẢN #{currentRequest.conceptVersion || 1})
                    </span>
                    <span className="text-xs text-[#7A6F68]">
                      Gửi lúc {currentRequest.conceptSentAt || currentRequest.createdAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    {currentRequest.conceptImageUrl && (
                      <div className="sm:col-span-4">
                        <img
                          src={currentRequest.conceptImageUrl}
                          alt="Concept phác thảo"
                          className="w-full aspect-square object-cover rounded-xl border border-[#E8E2D8] shadow-xs"
                        />
                        <span className="block text-[10px] text-center text-[#7A6F68] mt-1">
                          Phác thảo thiết kế từ xưởng
                        </span>
                      </div>
                    )}

                    <div className={`${currentRequest.conceptImageUrl ? "sm:col-span-8" : "sm:col-span-12"} space-y-3`}>
                      <p className="text-xs sm:text-sm text-[#42342B] leading-relaxed">
                        {currentRequest.conceptNote ||
                          "Nhóm thiết kế Nét đã hoàn thành bản dựng cho charm riêng của bạn theo đúng màu sắc và kích thước yêu cầu."}
                      </p>

                      {/* Quotation Breakdown */}
                      <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D8] space-y-1.5 text-xs">
                        <div className="flex justify-between text-[#5E4D43]">
                          <span>Túi Nét Original:</span>
                          <span>{currentRequest.bagPrice.toLocaleString("vi-VN")} đ</span>
                        </div>
                        <div className="flex justify-between text-[#5E4D43]">
                          <span>Charm có sẵn ({currentRequest.placedCharms.filter(c => !c.charm.id.includes("custom")).length} charm):</span>
                          <span>+{currentRequest.charmsTotal.toLocaleString("vi-VN")} đ</span>
                        </div>
                        {currentRequest.customCharmPrice && (
                          <div className="flex justify-between text-[#B85D43] font-semibold">
                            <span>Phí chế tác charm riêng:</span>
                            <span>+{currentRequest.customCharmPrice.toLocaleString("vi-VN")} đ</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-[#E8E2D8] flex justify-between font-bold text-sm text-[#241B16]">
                          <span>Tổng thanh toán:</span>
                          <span className="text-[#B85D43]">
                            {(
                              currentRequest.baseTotal +
                              (currentRequest.customCharmPrice || 0)
                            ).toLocaleString("vi-VN")}{" "}
                            đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={handleApprove}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#2D5E4E] hover:bg-[#234B3E] text-white text-xs sm:text-sm font-medium shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Duyệt thiết kế & báo giá</span>
                    </button>

                    <button
                      onClick={() => setIsRevisionModalOpen(true)}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#B85D43] text-xs sm:text-sm font-medium border border-[#B85D43] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Yêu cầu chỉnh sửa</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Already Approved Notice */}
              {currentRequest.status === "approved" && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Bạn đã duyệt phiên bản Concept #{currentRequest.approvedVersion || 1} vào {currentRequest.approvedAt || "gần đây"}.
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 rounded-lg">
                    Chờ xưởng hoàn thiện
                  </span>
                </div>
              )}

              {/* Revision Requested Notice */}
              {currentRequest.status === "revision_requested" && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-xs sm:text-sm space-y-1">
                  <div className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Đang điều chỉnh theo phản hồi của bạn</span>
                  </div>
                  <p className="text-xs text-purple-700">
                    Phản hồi: "{currentRequest.customerFeedback}"
                  </p>
                </div>
              )}

              {/* In Production Notice */}
              {currentRequest.status === "in_production" && (
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-600 shrink-0" />
                    <span>Xưởng Nét đang đúc charm và may ráp túi theo bản phối của bạn!</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-teal-100 rounded-lg">
                    Đang chế tác
                  </span>
                </div>
              )}

              {/* Shipping Stage: Customer can confirm receipt (Two-way confirmation) */}
              {currentRequest.status === "shipping" && (
                <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs sm:text-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-sky-600 shrink-0" />
                      <span className="font-bold text-sky-900">Kiện hàng đang trên đường giao tới bạn!</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-sky-100 text-sky-900 rounded-lg">
                      Đang vận chuyển
                    </span>
                  </div>
                  <p className="text-xs text-sky-800">
                    Khi bạn đã nhận được túi tận tay và kiểm tra ưng ý, vui lòng bấm nút xác nhận dưới đây. Hành trình chế tác sẽ chính thức hoàn thành và kích hoạt Story Passport của bạn.
                  </p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        saveDesignRequest({
                          ...currentRequest,
                          status: "completed",
                        });
                        setCurrentRequest(getDesignRequestById(currentRequest.id) || null);
                        setApprovalFeedback("Chúc mừng bạn! Bạn đã xác nhận nhận túi thành công và hoàn tất hành trình sáng tạo!");
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2D5E4E] hover:bg-[#234B3E] text-white font-medium text-xs shadow-xs cursor-pointer transition-all"
                    >
                      Tôi đã nhận được túi (Xác nhận nhận hàng)
                    </button>
                  </div>
                </div>
              )}

              {/* Completed Stage Banner */}
              {currentRequest.status === "completed" && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-900">Đơn hàng đã hoàn thành trọn vẹn!</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg">
                      Đã nhận hàng
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Cảm ơn bạn đã đồng hành cùng NÉT trong hành trình tái sinh rác lưới đại dương Đà Nẵng.
                  </p>
                  <div className="pt-2 flex gap-3">
                    <Link
                      href={`/passport/${currentRequest.passportCode || "PACK-DN-2024-082"}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D5E4E] hover:bg-[#234B3E] text-white text-xs font-semibold transition-all"
                    >
                      <span>Xem Story Passport & QR</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/support"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF7F2] text-[#5E4D43] text-xs font-semibold transition-all"
                    >
                      Cần hỗ trợ sau nhận hàng
                    </Link>
                  </div>
                </div>
              )}

              {/* 3. Chi tiết bản phối túi & charm */}
              <div className="pt-4 border-t border-[#E8E2D8] space-y-4">
                <h3 className="font-serif text-lg text-[#241B16]">
                  Bản phối của chiếc túi
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  <div className="sm:col-span-5 flex justify-center">
                    <div className="w-full max-w-[260px]">
                      <NetBag2DCanvas
                        placedCharms={currentRequest.placedCharms}
                        bagImageUrl={currentRequest.bagColor?.image || "/assets/products/bags/tuixach-xanh-la.png"}
                        selectedColorHex={currentRequest.bagColor?.hex}
                        selectedColorName={currentRequest.bagColor?.name}
                        onUpdateCharmPosition={() => {}}
                        onRemoveCharm={() => {}}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                      <span className="font-semibold text-[#241B16] block mb-1">
                        Dáng túi & Chất liệu:
                      </span>
                      <p className="text-[#5E4D43]">
                        {currentRequest.bagName} ({currentRequest.bagColor?.name || "Xanh Lưới Ngư Dân"}), làm từ lưới đánh cá thu hồi tại vùng biển Đà Nẵng.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                      <span className="font-semibold text-[#241B16] block mb-1">
                        Charm đã chọn:
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-[#5E4D43]">
                        {currentRequest.placedCharms.map((c) => (
                          <li key={c.instanceId}>
                            <strong>{c.charm.vietnameseName}</strong> — {c.charm.description}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {currentRequest.hasCustomCharm && currentRequest.customCharm && (
                      <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                        <span className="font-semibold text-[#B85D43] block mb-1">
                          Yêu cầu charm riêng:
                        </span>
                        <p className="text-[#5E4D43]">
                          "{currentRequest.customCharm.idea}"
                        </p>
                        {currentRequest.customCharm.engravedText && (
                          <p className="text-[11px] text-[#7A6F68] mt-1">
                            Khắc chữ: <strong>{currentRequest.customCharm.engravedText}</strong> · Kích thước: {currentRequest.customCharm.size}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Tra cứu vận đơn sản phẩm (Shipment Tracking) */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                    TIẾN ĐỘ VẬN CHUYỂN
                  </div>
                  <h3 className="font-serif text-xl text-[#241B16] mt-0.5">
                    Tra cứu vận đơn sản phẩm
                  </h3>
                </div>

                {currentRequest.trackingCode && (
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#7A6F68] uppercase font-semibold">
                      MÃ VẬN ĐƠN ({currentRequest.carrier || "GHTK"})
                    </span>
                    <div className="font-mono text-sm font-bold text-[#B85D43]">
                      {currentRequest.trackingCode}
                    </div>
                  </div>
                )}
              </div>

              {/* Tracking Timeline */}
              {currentRequest.trackingEvents && currentRequest.trackingEvents.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E2D8]">
                  {currentRequest.trackingEvents.map((evt, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          idx === 0
                            ? "bg-[#B85D43] ring-4 ring-[#B85D43]/20"
                            : "bg-[#D6CDBF]"
                        }`}
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#241B16]">
                            {evt.status}
                          </span>
                          <span className="text-[10px] text-[#7A6F68]">
                            {evt.time}
                          </span>
                        </div>
                        <div className="text-xs text-[#5E4D43]">
                          {evt.description}
                        </div>
                        <div className="text-[10px] text-[#9E9289]">
                          Vị trí: {evt.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7A6F68]">
                  Kiện hàng đang được chuẩn bị. Thông tin vận chuyển sẽ cập nhật ngay khi xuất xưởng.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Revision Modal */}
        <AnimatePresence>
          {isRevisionModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl border border-[#E8E2D8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl text-[#241B16]">
                    Yêu cầu chỉnh sửa concept
                  </h3>
                  <button
                    onClick={() => setIsRevisionModalOpen(false)}
                    className="p-1 rounded text-[#7A6F68] hover:text-[#241B16]"
                  >
                    ×
                  </button>
                </div>

                <p className="text-xs text-[#7A6F68]">
                  Bạn muốn điều chỉnh điều gì về hình dáng, kích thước hoặc chi tiết khắc của charm?
                </p>

                <form onSubmit={handleSubmitRevision} className="space-y-4">
                  <textarea
                    rows={4}
                    required
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="Ví dụ: Đổi màu charm sang vàng đậm hơn, viền bo tròn hơn một chút giúp mình..."
                    className="w-full p-3.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                  />

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRevisionModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-xs text-[#5E4D43]"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRevision}
                      className="px-5 py-2.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium"
                    >
                      Gửi yêu cầu chỉnh sửa
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom FAQ Section (Mockup: 1fe80232-974b-4865-916a-8293c129d8e8.jpeg) */}
        <div className="pt-6 border-t border-[#E8E2D8] space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#241B16]">
            Trước khi bạn đặt thiết kế
          </h2>

          <div className="space-y-2">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-medium text-[#241B16]"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[#B85D43]">▶</span>
                    <span>{item.q}</span>
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#7A6F68]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#7A6F68]" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#7A6F68] leading-relaxed border-t border-[#FAF7F2]">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68]">
          Đang nạp dữ liệu theo dõi...
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
