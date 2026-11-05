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
  Lock,
  Unlock,
  KeyRound,
  Phone,
  LogIn,
  Copy,
  Check,
  ShoppingBag,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import {
  saveDesignRequest,
  approveRequestQuote,
  requestDesignRevision,
  getAllDesignRequests,
  DesignRequest,
} from "@/lib/designRequestStorage";
import {
  OFFICIAL_DOMAIN,
  buildPersonalizedTrackingUrl,
  generateOrderSecretKey,
  resolveFullTrackingData,
  verifyOrderAccess,
  checkOrderAccessInput,
  authorizeOrderInSession,
  UnifiedTrackingItem,
} from "@/lib/orderTrackingSecurity";
import { generateSecretKey } from "@/lib/passportSecurity";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastNotification";
import { getCustomerOrdersFromFirestore } from "@/lib/firestoreService";
import { formatVND } from "@/lib/utils";
import { Order } from "@/types";

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();

  const codeParam = searchParams.get("code") || searchParams.get("id") || "";
  const queryKey = searchParams.get("key") || searchParams.get("token") || "";

  const [inputCode, setInputCode] = useState(codeParam);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingItem, setTrackingItem] = useState<UnifiedTrackingItem | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockReason, setUnlockReason] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // User's own orders when entering /tracking without ?code=...
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myDesignRequests, setMyDesignRequests] = useState<DesignRequest[]>([]);
  const [loadingMyHistory, setLoadingMyHistory] = useState(false);

  // Security gate input state (Phone or Secret Key)
  const [securityInput, setSecurityInput] = useState("");
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Revision modal state (for Design Requests)
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 1. Tải danh sách đơn của tài khoản nếu không có ?code=... trên URL
  useEffect(() => {
    let isMounted = true;
    async function loadUserHistory() {
      if (codeParam) return;
      if (!user?.uid && !userProfile?.phone) return;

      setLoadingMyHistory(true);
      try {
        const [orders] = await Promise.all([
          getCustomerOrdersFromFirestore(user?.uid, user?.email || undefined),
        ]);

        if (isMounted) {
          setMyOrders(orders);
          const allReqs = getAllDesignRequests();
          const filteredReqs = allReqs.filter(
            (r) =>
              (user?.email && r.customerEmail?.toLowerCase() === user.email.toLowerCase()) ||
              (userProfile?.phone && r.customerPhone?.replace(/[^0-9]/g, "") === userProfile.phone.replace(/[^0-9]/g, "")) ||
              (userProfile?.displayName && r.customerName?.toLowerCase() === userProfile.displayName.toLowerCase())
          );
          setMyDesignRequests(filteredReqs);
        }
      } catch (err) {
        console.warn("Lỗi tải lịch sử đơn hàng của tôi:", err);
      } finally {
        if (isMounted) setLoadingMyHistory(false);
      }
    }

    loadUserHistory();
    return () => {
      isMounted = false;
    };
  }, [codeParam, user, userProfile]);

  // 2. Tra cứu dữ liệu đơn hàng khi có codeParam
  useEffect(() => {
    let isMounted = true;
    async function fetchTracking() {
      if (!codeParam.trim()) {
        setTrackingItem(null);
        setIsUnlocked(false);
        return;
      }

      setIsLoading(true);
      try {
        const resolved = await resolveFullTrackingData(codeParam.trim());
        if (isMounted) {
          setTrackingItem(resolved);
        }
      } catch (err) {
        console.warn("Lỗi phân giải đơn hàng:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchTracking();
    return () => {
      isMounted = false;
    };
  }, [codeParam]);

  // 3. Kiểm tra phân quyền truy cập (Chỉ người sở hữu mới ấn vào được)
  useEffect(() => {
    if (!trackingItem || trackingItem.status !== "found") return;

    const access = verifyOrderAccess(trackingItem, user, userProfile, queryKey);
    if (access.isAuthorized) {
      setIsUnlocked(true);
      setUnlockReason(access.reason);
    } else {
      setIsUnlocked(false);
      setUnlockReason("unauthorized");
    }
  }, [trackingItem, user, userProfile, queryKey]);

  // 4. Tìm kiếm thủ công từ ô input
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      router.push(`/tracking?code=${encodeURIComponent(inputCode.trim().toUpperCase())}`);
    }
  };

  // 5. Xác thực qua Cổng Bảo Mật (Nhập SĐT hoặc Mã bảo mật)
  const handleSecurityVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    if (!trackingItem) return;

    const clean = securityInput.trim();
    if (!clean) {
      setSecurityError("Vui lòng nhập Số điện thoại nhận hàng hoặc Mã bảo mật!");
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const isSuccess = checkOrderAccessInput(trackingItem, clean);
      if (isSuccess) {
        setIsUnlocked(true);
        setUnlockReason("verified_input");
        showToast("Xác thực chính chủ thành công!", "Đã mở khóa thông tin tiến độ đơn hàng.", "success");
      } else {
        setSecurityError("Số điện thoại hoặc Mã bảo mật không khớp với đơn hàng này. Vui lòng kiểm tra lại.");
      }
      setIsVerifying(false);
    }, 350);
  };

  // 6. Sao chép liên kết cá nhân hóa chính thức
  const handleCopyPersonalizedLink = () => {
    if (!trackingItem) return;
    const personalizedLink = buildPersonalizedTrackingUrl(trackingItem.code, trackingItem.secretKey, true);
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(personalizedLink);
      setCopiedLink(true);
      showToast("Đã sao chép link theo dõi cá nhân!", `Đường dẫn trên ${OFFICIAL_DOMAIN} kèm khóa bảo mật chính chủ.`, "info");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // 7. Khách hàng phê duyệt báo giá (Dành cho Yêu cầu Thiết kế)
  const handleApprove = () => {
    if (!trackingItem || !trackingItem.rawRequest) return;
    const version = trackingItem.conceptVersion || 1;
    const updated = approveRequestQuote(trackingItem.id, version);
    if (updated) {
      setTrackingItem((prev) => (prev ? { ...prev, statusCode: "approved", statusLabel: "Đã duyệt thiết kế" } : null));
      setApprovalFeedback(
        `Bạn đã duyệt thành công phiên bản Concept #${version}. Xưởng Nét sẽ tiến hành chế tác ngay!`
      );
      showToast("Đã duyệt thiết kế!", "Xưởng Nét sẽ bắt đầu chế tác mẫu túi cho bạn.", "success");
    }
  };

  // 8. Khách hàng yêu cầu chỉnh sửa Concept (Dành cho Yêu cầu Thiết kế)
  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingItem || !trackingItem.rawRequest || !revisionNote.trim()) return;

    setIsSubmittingRevision(true);
    const updated = requestDesignRevision(trackingItem.id, revisionNote.trim());
    if (updated) {
      setTrackingItem((prev) =>
        prev
          ? {
              ...prev,
              statusCode: "revision_requested",
              statusLabel: "Đang chỉnh sửa theo yêu cầu",
            }
          : null
      );
      setIsRevisionModalOpen(false);
      setRevisionNote("");
      setApprovalFeedback(
        "Yêu cầu chỉnh sửa của bạn đã được chuyển tới nhóm thiết kế. Chúng mình sẽ liên hệ và cập nhật lại sớm nhất!"
      );
      showToast("Đã gửi yêu cầu chỉnh sửa!", "Đội ngũ thiết kế Nét sẽ hoàn thiện lại bản vẽ.", "info");
    }
    setIsSubmittingRevision(false);
  };

  const faqItems = [
    {
      q: "Quy trình theo dõi đơn hàng hoạt động thế nào?",
      a: "Mỗi đơn hàng hoặc yêu cầu thiết kế tại NÉT được cấp một đường dẫn cá nhân hóa độc bản trên https://www.net-s.id.vn. Khách hàng có thể theo dõi tiến độ từng công đoạn: Tiếp nhận mẻ lưới, đan sợi cước ma tái sinh, đúc charm kim loại mạ vàng, kiểm định chất lượng và đóng gói giao hàng.",
    },
    {
      q: "Tại sao đơn hàng cần xác thực chính chủ?",
      a: "Để bảo vệ quyền riêng tư cá nhân của người nhận (địa chỉ giao hàng, số điện thoại, danh mục sản phẩm) và ngăn chặn việc người lạ tự ý dò quét trên thanh địa chỉ URL, chỉ chủ tài khoản hoặc người có mã khóa bảo mật/SĐT người nhận mới có thể xem chi tiết.",
    },
    {
      q: "Bao lâu thì sản phẩm hoàn thiện và giao đến nơi?",
      a: "Túi phôi tiêu chuẩn sẵn xưởng: Bàn giao trong 2 - 4 ngày làm việc. Túi thiết kế riêng đính charm custom: Nghệ nhân mất từ 18 - 24 giờ đan tay và đúc men gốm/đồng mạ vàng, thời gian giao từ 4 - 7 ngày tùy theo khu vực.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] text-[#2D231E] py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-10">
        
        {/* Title Header */}
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#B85D43] block mb-1">
            NET OCEAN LOGISTICS · THEO DÕI ĐƠN HÀNG
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#241B16] font-normal">
            Hành trình đơn hàng{" "}
            <span className="italic font-serif text-[#B85D43]">
              của bạn.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6F68] mt-2">
            Minh bạch từng công đoạn từ mẻ lưới cứu biển, xưởng đan thủ công tại Đà Nẵng đến khi giao tận tay bạn.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-4 shadow-xs">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
              TRA CỨU TIẾN ĐỘ CHÍNH CHỦ
            </div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-1">
              Nhập mã đơn hàng hoặc yêu cầu thiết kế
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6F68] mt-1">
              Ví dụ: <code className="font-mono text-[#B85D43]">NET-ORD-8821</code> hoặc <code className="font-mono text-[#B85D43]">REQ-1729000...</code> (Mã gửi trong email / hóa đơn của bạn).
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Nhập mã đơn hàng (NET-ORD-XXXX / REQ-XXXX)"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] font-mono text-sm uppercase text-[#241B16] focus:outline-none focus:ring-2 focus:ring-[#B85D43]"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-medium shadow-xs transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Tra cứu</span>
            </button>
          </form>
        </div>

        {/* Feedback Message */}
        {approvalFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3 shadow-2xs"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{approvalFeedback}</span>
          </motion.div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#B85D43]/20 border-t-[#B85D43] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#7A6F68] font-medium tracking-wider uppercase">
              Đang xác thực thông tin đơn hàng NÉT...
            </p>
          </div>
        )}

        {/* TRƯỜNG HỢP 1: KHÔNG TÌM THẤY (TRÁNH LỖI DÒ BẰNG DOMAIN / CRASH) */}
        {!isLoading && codeParam && trackingItem && trackingItem.status === "not_found" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white border border-[#E8E2D8] text-center space-y-4 shadow-xs"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <AlertCircle className="w-7 h-7 stroke-[1.75]" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-[#241B16] font-bold">
              Không Tìm Thấy Đơn Hàng Này
            </h3>
            <p className="text-xs sm:text-sm text-[#7A6F68] max-w-md mx-auto leading-relaxed">
              Mã đơn hàng hoặc yêu cầu <code className="bg-[#FAF7F2] px-2 py-0.5 rounded text-[#B85D43] font-mono font-bold">{codeParam}</code> không tồn tại trên máy chủ NÉT.
            </p>
            <p className="text-[11px] text-[#A89F91]">
              Tránh việc gõ bừa trên thanh địa chỉ URL. Vui lòng kiểm tra lại mã trên hóa đơn email hoặc đăng nhập để xem danh sách đơn hàng của bạn.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setInputCode("");
                  router.push("/tracking");
                }}
                className="px-5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9DF] text-[#5E4D43] text-xs font-bold transition-colors cursor-pointer"
              >
                Nhập Lại Mã Khác
              </button>
              <Link
                href="/shop"
                className="px-5 py-2.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-bold transition-colors"
              >
                Khám Phá Cửa Hàng
              </Link>
            </div>
          </motion.div>
        )}

        {/* TRƯỜNG HỢP 2: CỔNG BẢO MẬT ĐƠN HÀNG (CHỈ NGƯỜI SỞ HỮU MỚI ẤN VÀO ĐƯỢC) */}
        {!isLoading && codeParam && trackingItem && trackingItem.status === "found" && !isUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-10 rounded-3xl bg-white border border-[#E8E2D8] shadow-sm space-y-6 max-w-lg mx-auto"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-8 h-8 stroke-[1.75]" />
              </div>
              <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#B85D43]">
                BẢO MẬT ĐƠN HÀNG · PRIVACY PROTECTED
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#241B16]">
                Xác Thực Quyền Sở Hữu
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                <span>Mã tra cứu:</span>
                <span className="text-[#B85D43]">{trackingItem.code}</span>
              </div>
            </div>

            <p className="text-xs text-[#5E4D43] text-center leading-relaxed">
              Đơn hàng này được bảo mật thông tin cá nhân và địa chỉ giao hàng.
              <br />
              <strong>Chỉ người nhận hoặc chủ tài khoản đặt hàng mới có quyền xem thông tin chi tiết.</strong>
            </p>

            {/* Form mở khóa bằng SĐT hoặc Secret Key */}
            <form onSubmit={handleSecurityVerify} className="space-y-3 pt-2 border-t border-[#FAF7F2]">
              <label className="block text-xs font-bold text-[#241B16]">
                Cách 1: Nhập Số điện thoại nhận hàng HOẶC Mã bảo mật (Secret Key)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={securityInput}
                  onChange={(e) => {
                    setSecurityInput(e.target.value);
                    setSecurityError(null);
                  }}
                  placeholder="Nhập SĐT nhận hàng (VD: 0905...) hoặc KEY-XXXXXX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#B85D43]"
                />
              </div>

              {securityError && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{securityError}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 rounded-xl bg-[#241B16] hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <span>Đang kiểm tra bảo mật...</span>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Xác Thực & Mở Khóa Đơn Hàng</span>
                  </>
                )}
              </button>
            </form>

            {/* Cách 2: Đăng nhập tài khoản chính chủ */}
            <div className="pt-4 border-t border-[#E8E2D8] space-y-2.5 text-center">
              <span className="text-[11px] text-[#7A6F68] block">
                Cách 2: Bạn đã đặt đơn này qua tài khoản đăng nhập?
              </span>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/tracking?code=${trackingItem.code}`)}`}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF7F2] text-[#5E4D43] text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <LogIn className="w-4 h-4 text-[#B85D43]" />
                <span>Đăng nhập để tự động xác thực chính chủ</span>
              </Link>
            </div>
          </motion.div>
        )}

        {/* TRƯỜNG HỢP 3: ĐÃ XÁC THỰC THÀNH CÔNG (HIỂN THỊ ĐẦY ĐỦ TIẾN ĐỘ CHÍNH CHỦ) */}
        {!isLoading && codeParam && trackingItem && trackingItem.status === "found" && isUnlocked && (
          <div className="space-y-8">
            
            {/* Verified Banner */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                    <span>ĐÃ XÁC THỰC CHỦ ĐƠN HÀNG CHÍNH THỨC</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-mono">
                      {unlockReason === "owner_account"
                        ? "Tài khoản chính chủ"
                        : unlockReason === "valid_key"
                        ? "Khóa URL bảo mật"
                        : "Xác thực SĐT/Mã bảo mật"}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Tên miền cá nhân hóa: <strong className="font-mono text-emerald-950">{OFFICIAL_DOMAIN}/tracking?code={trackingItem.code}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyPersonalizedLink}
                className="py-1.5 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Đã sao chép link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Sao chép link theo dõi cá nhân</span>
                  </>
                )}
              </button>
            </div>

            {/* 1. Header Information & Status */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-5">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-[#B85D43]">
                      {trackingItem.code}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${trackingItem.statusBadgeColor}`}
                    >
                      {trackingItem.statusLabel}
                    </span>
                  </div>
                  <div className="text-xs text-[#7A6F68] mt-1.5">
                    Người nhận: <strong className="text-[#241B16]">{trackingItem.customerName}</strong>
                    {trackingItem.customerPhone && (
                      <span> · SĐT: <strong className="text-[#241B16]">{trackingItem.customerPhone}</strong></span>
                    )}
                    <span> · Ngày tạo: {trackingItem.createdAt}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-[#5E4D43]">
                  <div>Khóa bảo mật: <strong className="font-mono text-emerald-800">{trackingItem.secretKey}</strong></div>
                  {trackingItem.customerCity && (
                    <div className="text-[#7A6F68] mt-0.5">
                      Giao tới: <strong>{trackingItem.customerCity}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Timeline Stepper */}
              <div className="space-y-4 pt-2">
                <h3 className="font-serif text-lg text-[#241B16] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#B85D43]" />
                  <span>Nhật ký tiến độ đơn hàng</span>
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E2D8]">
                  {trackingItem.timeline.map((step, idx) => (
                    <div key={idx} className="relative group">
                      <span
                        className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                          step.completed
                            ? "bg-emerald-600 text-white"
                            : step.current
                            ? "bg-[#B85D43] text-white ring-4 ring-[#B85D43]/20"
                            : "bg-[#D6CDBF]"
                        }`}
                      >
                        {step.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold ${
                              step.completed
                                ? "text-emerald-900"
                                : step.current
                                ? "text-[#B85D43]"
                                : "text-slate-500"
                            }`}
                          >
                            {step.title}
                          </span>
                          {step.time && (
                            <span className="text-[10px] text-[#7A6F68]">({step.time})</span>
                          )}
                        </div>
                        <p className="text-xs text-[#5E4D43] leading-relaxed">
                          {step.description}
                        </p>
                        {step.location && (
                          <div className="text-[11px] text-teal-800 font-medium flex items-center gap-1 pt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{step.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Phê duyệt Concept nếu là Yêu Cầu Thiết Kế */}
              {trackingItem.type === "design_request" && trackingItem.statusCode === "concept_sent" && (
                <div className="p-6 rounded-2xl bg-[#FAF7F2] border-2 border-[#B85D43]/30 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif tracking-[0.2em] uppercase text-[#B85D43] font-bold">
                      CONCEPT CHỜ BẠN DUYỆT (PHIÊN BẢN #{trackingItem.conceptVersion || 1})
                    </span>
                    <span className="text-xs text-[#7A6F68]">
                      Gửi lúc {trackingItem.conceptSentAt || trackingItem.createdAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    {trackingItem.conceptImageUrl && (
                      <div className="sm:col-span-4">
                        <img
                          src={trackingItem.conceptImageUrl}
                          alt="Concept phác thảo"
                          className="w-full aspect-square object-cover rounded-xl border border-[#E8E2D8] shadow-xs"
                        />
                      </div>
                    )}

                    <div className={`${trackingItem.conceptImageUrl ? "sm:col-span-8" : "sm:col-span-12"} space-y-3`}>
                      <p className="text-xs sm:text-sm text-[#42342B] leading-relaxed">
                        {trackingItem.conceptNote ||
                          "Nhóm thiết kế Nét đã hoàn thành bản phác thảo concept cho túi và charm của bạn."}
                      </p>
                      <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D8] space-y-1.5 text-xs">
                        <div className="flex justify-between font-bold text-sm text-[#241B16]">
                          <span>Tổng chi phí hoàn thiện:</span>
                          <span className="text-[#B85D43]">{formatVND(trackingItem.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

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

              {/* 4. Danh mục sản phẩm (Dành cho Đơn Hàng Shop) */}
              {trackingItem.type === "shop_order" && trackingItem.items && trackingItem.items.length > 0 && (
                <div className="pt-4 border-t border-[#E8E2D8] space-y-3">
                  <h3 className="font-serif text-lg text-[#241B16] flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#B85D43]" />
                    <span>Sản phẩm trong đơn hàng</span>
                  </h3>

                  <div className="space-y-2">
                    {trackingItem.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {it.image ? (
                            <img
                              src={it.image}
                              alt={it.title}
                              className="w-12 h-12 rounded-xl object-contain bg-white border border-[#E8E2D8] p-1 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-center text-lg shrink-0">
                              👜
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-[#241B16] truncate">
                              {it.title}
                            </h4>
                            <div className="text-[11px] text-[#7A6F68] mt-0.5">
                              Số lượng: {it.quantity} {it.colorName ? `· Màu: ${it.colorName}` : ""}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-serif text-xs sm:text-sm font-bold text-[#241B16]">
                            {formatVND(it.price * it.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#7A6F68]">
                      <span>Phương thức thanh toán:</span>
                      <span className="font-medium text-[#241B16] uppercase">
                        {trackingItem.paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : trackingItem.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#7A6F68]">
                      <span>Trạng thái thanh toán:</span>
                      <span className="font-bold text-emerald-800">
                        {trackingItem.paymentStatus === "paid" ? "✓ Đã thanh toán" : "Chờ thu tiền khi giao"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#FAF7F2] text-sm font-bold text-[#241B16]">
                      <span>Tổng thanh toán:</span>
                      <span className="font-serif text-base text-[#B85D43]">
                        {formatVND(trackingItem.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Bản phối Studio (Dành cho Yêu Cầu Thiết Kế) */}
              {trackingItem.type === "design_request" && (
                <div className="pt-4 border-t border-[#E8E2D8] space-y-4">
                  <h3 className="font-serif text-lg text-[#241B16]">
                    Bản phối của chiếc túi
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    <div className="sm:col-span-5 flex justify-center">
                      <div className="w-full max-w-[260px]">
                        <NetBag2DCanvas
                          placedCharms={[]}
                          bagImageUrl={trackingItem.bagImage || "/assets/products/bags/tuixach-xanh-la.png"}
                          selectedColorHex={trackingItem.bagColorHex}
                          selectedColorName={trackingItem.bagColorName}
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
                          {trackingItem.bagName} ({trackingItem.bagColorName || "Xanh Lưới Ngư Dân"}), làm từ lưới đánh cá thu hồi tại vùng biển Đà Nẵng.
                        </p>
                      </div>

                      {trackingItem.placedCharms && trackingItem.placedCharms.length > 0 && (
                        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                          <span className="font-semibold text-[#241B16] block mb-1">
                            Charm đã chọn ({trackingItem.placedCharms.length} phụ kiện):
                          </span>
                          <ul className="list-disc pl-4 space-y-1 text-[#5E4D43]">
                            {trackingItem.placedCharms.map((c) => (
                              <li key={c.instanceId}>
                                <strong>{c.charm?.vietnameseName}</strong> — {c.charm?.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Liên kết Hộ Chiếu Số nếu có */}
              {(trackingItem.assignedSerialId || trackingItem.passportCode) && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-950">Đã gán Hộ Chiếu Số Story Passport</div>
                      <div className="text-[11px] text-emerald-800">
                        Mã định danh: <strong className="font-mono">{trackingItem.assignedSerialId || trackingItem.passportCode}</strong>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/passport/${trackingItem.assignedSerialId || trackingItem.passportCode}?key=${generateSecretKey(
                      trackingItem.assignedSerialId || trackingItem.passportCode || ""
                    )}`}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors shrink-0"
                  >
                    Xem Passport →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRƯỜNG HỢP 4: TRUY CẬP TRỰC TIẾP KHÔNG KÈM ?code=... (HIỂN THỊ ĐƠN HÀNG CỦA TÀI KHOẢN ĐANG ĐĂNG NHẬP) */}
        {!codeParam && (
          <div className="space-y-6">
            {user?.uid ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl sm:text-2xl text-[#241B16] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#B85D43]" />
                    <span>Đơn hàng & Yêu cầu của bạn</span>
                  </h3>
                  <span className="text-xs text-[#7A6F68]">
                    {myOrders.length + myDesignRequests.length} đơn đã ghi nhận
                  </span>
                </div>

                {loadingMyHistory ? (
                  <div className="p-8 text-center text-xs text-[#7A6F68]">
                    Đang nạp danh sách đơn hàng của bạn...
                  </div>
                ) : myOrders.length === 0 && myDesignRequests.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-[#E8E2D8] text-center space-y-3">
                    <p className="text-xs text-[#7A6F68]">
                      Bạn chưa có đơn đặt hàng nào trong tài khoản.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-block px-5 py-2.5 rounded-xl bg-[#B85D43] text-white text-xs font-bold"
                    >
                      Khám phá Bộ Sưu Tập Shop
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Shop Orders */}
                    {myOrders.map((ord) => {
                      const key = generateOrderSecretKey(ord.orderCode);
                      return (
                        <Link
                          key={ord.orderId}
                          href={`/tracking?code=${ord.orderCode}&key=${key}`}
                          className="p-4 rounded-2xl bg-white border border-[#E8E2D8] hover:border-[#B85D43] transition-all shadow-2xs space-y-2 block"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#5E4D43] bg-slate-100 px-2 py-0.5 rounded">
                              ĐƠN HÀNG SHOP
                            </span>
                            <span className="font-mono text-xs font-bold text-[#B85D43]">
                              {ord.orderCode}
                            </span>
                          </div>
                          <div className="text-xs text-[#241B16] font-bold truncate">
                            {ord.items?.[0]?.title || "Túi Lưới NÉT"}
                            {(ord.items?.length || 1) > 1 && ` (+${(ord.items?.length || 1) - 1} món khác)`}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#7A6F68] pt-1 border-t border-[#FAF7F2]">
                            <span>{new Date(ord.createdAt).toLocaleDateString("vi-VN")}</span>
                            <span className="font-bold text-[#241B16]">{formatVND(ord.total)}</span>
                          </div>
                        </Link>
                      );
                    })}

                    {/* Design Requests */}
                    {myDesignRequests.map((req) => {
                      const key = generateOrderSecretKey(req.id);
                      return (
                        <Link
                          key={req.id}
                          href={`/tracking?code=${req.id}&key=${key}`}
                          className="p-4 rounded-2xl bg-white border border-[#E8E2D8] hover:border-[#B85D43] transition-all shadow-2xs space-y-2 block"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#B85D43] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              THIẾT KẾ STUDIO
                            </span>
                            <span className="font-mono text-xs font-bold text-[#B85D43]">
                              {req.id}
                            </span>
                          </div>
                          <div className="text-xs text-[#241B16] font-bold truncate">
                            {req.bagName || "Túi NÉT Custom"} ({req.placedCharms?.length || 0} Charm)
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#7A6F68] pt-1 border-t border-[#FAF7F2]">
                            <span>{req.createdAt}</span>
                            <span className="font-bold text-[#2D5E4E]">{req.status}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-white border border-[#E8E2D8] text-center space-y-3">
                <span className="text-xs text-[#7A6F68] block">
                  Bạn đã đăng nhập tài khoản mua hàng NÉT?
                </span>
                <Link
                  href="/login?redirect=/tracking"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF7F2] text-[#5E4D43] text-xs font-bold transition-colors"
                >
                  <LogIn className="w-4 h-4 text-[#B85D43]" />
                  <span>Đăng nhập để xem toàn bộ đơn hàng của bạn</span>
                </Link>
              </div>
            )}
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
                    className="p-1 rounded text-[#7A6F68] hover:text-[#241B16] cursor-pointer"
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
                      className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-xs text-[#5E4D43] cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRevision}
                      className="px-5 py-2.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium cursor-pointer"
                    >
                      Gửi yêu cầu chỉnh sửa
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom FAQ Section */}
        <div className="pt-6 border-t border-[#E8E2D8] space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#241B16]">
            Câu hỏi thường gặp về theo dõi đơn
          </h2>

          <div className="space-y-2">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-medium text-[#241B16] cursor-pointer"
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
