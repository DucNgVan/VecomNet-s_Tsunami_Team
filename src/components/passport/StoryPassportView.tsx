"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Search,
  Lock,
  Unlock,
  KeyRound,
  LogIn,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Award,
} from "lucide-react";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastNotification";
import {
  OFFICIAL_DOMAIN,
  buildPersonalizedPassportUrl,
  resolveFullPassportData,
  verifyPassportAccess,
  authorizePassportInSession,
  ResolvedPassport,
} from "@/lib/passportSecurity";

interface StoryPassportViewProps {
  passportCode: string;
  initialSecretKey?: string | null;
  itemIdQuery?: string | null;
}

export const StoryPassportView: React.FC<StoryPassportViewProps> = ({
  passportCode,
  initialSecretKey,
  itemIdQuery,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();

  const queryKey = initialSecretKey || searchParams.get("key") || searchParams.get("token");
  const effectiveItemId = itemIdQuery || searchParams.get("itemId");

  const [isLoading, setIsLoading] = useState(true);
  const [passport, setPassport] = useState<ResolvedPassport | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockReason, setUnlockReason] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // State cho form nhập Secret Key mở khóa
  const [inputKey, setInputKey] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);

  // 1. Tải và phân giải dữ liệu Hộ chiếu
  useEffect(() => {
    let isMounted = true;
    async function fetchPassport() {
      setIsLoading(true);
      try {
        const resolved = await resolveFullPassportData(passportCode, effectiveItemId);
        if (isMounted) {
          setPassport(resolved);
        }
      } catch (err) {
        console.warn("Lỗi tải passport:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchPassport();
    return () => {
      isMounted = false;
    };
  }, [passportCode, effectiveItemId]);

  // 2. Kiểm tra thẩm quyền truy cập (Chỉ người sở hữu mới ấn vào được)
  useEffect(() => {
    if (!passport || passport.status !== "found") return;

    const access = verifyPassportAccess(passport, user, userProfile, queryKey);
    if (access.isAuthorized) {
      setIsUnlocked(true);
      setUnlockReason(access.reason);
    } else {
      setIsUnlocked(false);
      setUnlockReason("unauthorized");
    }
  }, [passport, user, userProfile, queryKey]);

  // 3. Xử lý khi người dùng nhập Mã Bảo Mật trên giao diện
  const handleVerifyKey = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    if (!passport) return;

    const cleanInput = inputKey.trim().toUpperCase();
    if (!cleanInput) {
      setKeyError("Vui lòng nhập mã bảo mật in trên thẻ vật lý!");
      return;
    }

    setIsSubmittingKey(true);
    setTimeout(() => {
      if (cleanInput === passport.secretKey.toUpperCase()) {
        authorizePassportInSession(passport.id);
        setIsUnlocked(true);
        setUnlockReason("valid_key");
        showToast("Xác thực chính chủ thành công!", "Đã mở khóa Hộ Chiếu Số độc bản của bạn.", "success");
      } else {
        setKeyError("Mã bảo mật không khớp với chiếc túi này. Vui lòng kiểm tra lại trên thẻ vật lý của bạn.");
      }
      setIsSubmittingKey(false);
    }, 400);
  };

  // 4. Sao chép liên kết cá nhân hóa chính thức
  const handleCopyPersonalizedLink = () => {
    if (!passport) return;
    const personalizedLink = buildPersonalizedPassportUrl(passport.id, passport.secretKey, true);
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(personalizedLink);
      setCopiedLink(true);
      showToast("Đã sao chép link cá nhân hoá!", `Đường dẫn chính thức trên ${OFFICIAL_DOMAIN} kèm khóa bảo mật.`, "info");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // =========================================================================
  // MÀN HÌNH ĐANG TẢI (LOADING)
  // =========================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-3 border-[#B85D43]/20 border-t-[#B85D43] animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#5E4D43] tracking-wider uppercase">
          Đang xác thực Hộ Chiếu Số Định Danh NÉT...
        </p>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH KHÔNG TÌM THẤY (TRÁNH VIỆC DÒ BẰNG DOMAIN GÂY LỖI / CRASH)
  // =========================================================================
  if (!passport || passport.status === "not_found") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-[#E8E2D8] shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-8 h-8 stroke-[1.75]" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#7A6F68]">
              DIGITAL PRODUCT PASSPORT
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#241B16]">
              Không Tìm Thấy Hộ Chiếu Số
            </h2>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              Mã định danh <code className="bg-[#FAF7F2] px-2 py-0.5 rounded text-[#B85D43] font-mono font-bold">{passportCode}</code> không tồn tại trên hệ thống máy chủ NÉT.
            </p>
            <p className="text-[11px] text-[#A89F91]">
              Tránh việc nhập ngẫu nhiên trên thanh địa chỉ URL. Vui lòng quét mã QR vật lý đính kèm sản phẩm hoặc đăng nhập tài khoản mua hàng.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/passport"
              className="flex-1 py-3 px-4 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9DF] text-[#5E4D43] text-xs font-bold transition-colors"
            >
              Tra Cứu Mã Khác
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-bold transition-colors"
            >
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH KHÓA BẢO MẬT CHÍNH CHỦ (CHỈ NGƯỜI SỞ HỮU MỚI ẤN VÀO ĐƯỢC)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#241B16] py-12 px-4 sm:px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-10 shadow-sm space-y-6"
        >
          {/* Security Icon & Badge */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <Lock className="w-8 h-8 stroke-[1.75]" />
            </div>
            <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#B85D43]">
              BẢO MẬT CHÍNH CHỦ · PRIVACY PROTECTED
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#241B16]">
              Hộ Chiếu Số Độc Bản NÉT
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              <span>Mã túi:</span>
              <span className="text-[#B85D43]">{passport.id}</span>
            </div>
          </div>

          <p className="text-xs text-[#5E4D43] text-center leading-relaxed">
            Hộ chiếu này là tài sản số độc bản chứa nhật ký vật liệu, câu chuyện chế tác riêng và chứng nhận bảo hành 24 tháng.
            <br />
            <strong>Chỉ người sở hữu chính thức mới có thể truy cập nội dung này.</strong>
          </p>

          {/* Form mở khóa bằng Secret Key trên thẻ vật lý */}
          <form onSubmit={handleVerifyKey} className="space-y-3 pt-2 border-t border-[#FAF7F2]">
            <label className="block text-xs font-bold text-[#241B16]">
              Cách 1: Nhập Mã Bảo Mật (Secret Key) trên thẻ vật lý
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setKeyError(null);
                }}
                placeholder="VD: KEY-8AB2F1 (In sau thẻ bảo hành / NFC)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#B85D43]"
              />
            </div>
            {keyError && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{keyError}</span>
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmittingKey}
              className="w-full py-3 rounded-xl bg-[#241B16] hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmittingKey ? (
                <span>Đang kiểm tra bảo mật...</span>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Mở Khóa Hộ Chiếu</span>
                </>
              )}
            </button>
          </form>

          {/* Cách 2: Đăng nhập tài khoản chính chủ */}
          <div className="pt-4 border-t border-[#E8E2D8] space-y-2.5 text-center">
            <span className="text-[11px] text-[#7A6F68] block">
              Cách 2: Bạn đã mua chiếc túi này qua tài khoản cá nhân?
            </span>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/passport/${passport.id}`)}`}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF7F2] text-[#5E4D43] text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4 text-[#B85D43]" />
              <span>Đăng nhập tài khoản sở hữu để tự động mở khóa</span>
            </Link>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/shop"
              className="text-[11px] text-[#7A6F68] hover:text-[#B85D43] transition-colors"
            >
              ← Quay lại Cửa hàng NÉT
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH CHÍNH THỨC: HỘ CHIẾU SỐ ĐÃ ĐƯỢC XÁC THỰC TOÀN QUYỀN
  // =========================================================================
  const officialPersonalizedUrl = buildPersonalizedPassportUrl(passport.id, passport.secretKey, true);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    officialPersonalizedUrl
  )}&color=24-27-22&bgcolor=FAF7F2`;

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] text-[#2D231E] py-8 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-8">
        
        {/* Ownership Verified Banner */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                <span>ĐÃ XÁC THỰC QUYỀN SỞ HỮU CHÍNH HÃNG</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-mono">
                  {unlockReason === "owner_account"
                    ? "Tài khoản chính chủ"
                    : unlockReason === "valid_key"
                    ? "Thẻ bảo mật hợp lệ"
                    : "Đã mở khóa phiên này"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Tên miền cá nhân hóa: <strong className="font-mono text-emerald-950">{OFFICIAL_DOMAIN}/passport/{passport.id}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyPersonalizedLink}
              className="py-1.5 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100/50 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Đã sao chép link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sao chép link cá nhân</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6">
          <div>
            <div className="text-[11px] tracking-[0.25em] uppercase text-[#7A6F68] font-semibold mb-1">
              HỒ SƠ ĐỘC BẢN SẢN PHẨM · DIGITAL PASSPORT
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl text-[#241B16] font-normal tracking-tight">
              Story Passport
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="px-4 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Vào NÉT Studio →
            </Link>
          </div>
        </div>

        {/* 2-Column Showcase Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Visual Bag with Charms & QR card */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-6">
            <NetBag2DCanvas
              placedCharms={passport.placedCharms}
              bagImageUrl={passport.bagImage || "/assets/products/bags/tuixach-xanh-la.png"}
              selectedColorHex={passport.colorHex || "#3d8b85"}
              selectedColorName={passport.colorName || "Xanh Lá"}
              onUpdateCharmPosition={() => {}}
              onRemoveCharm={() => {}}
            />

            {/* Individual Product QR Card */}
            <div className="w-full max-w-[440px] p-5 rounded-3xl bg-white border border-[#E8E2D8] shadow-xs flex items-center gap-5">
              <img
                src={qrImageUrl}
                alt={`Mã QR Passport ${passport.id}`}
                className="w-20 h-20 rounded-xl border border-[#E8E2D8] p-1 bg-[#FAF7F2] shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-bold">
                  MÃ QR ĐỊNH DANH ĐỘC BẢN
                </span>
                <div className="text-xs font-mono font-bold text-[#B85D43] truncate">
                  {passport.id}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Khóa: <span className="text-emerald-800 font-bold">{passport.secretKey}</span>
                </div>
                <p className="text-[11px] text-[#7A6F68] leading-tight">
                  Quét QR mở trực tiếp Hộ Chiếu Số cá nhân hoá trên <strong>{OFFICIAL_DOMAIN}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Passport Information Cards */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CARD 01 / NGUỒN VẬT LIỆU TÁI SINH */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                  01 / NGUỒN VẬT LIỆU
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
                  {passport.seaRegion}
                </span>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#241B16]">
                  {passport.bagName}
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6F68] mt-1 font-light">
                  Tuần hoàn từ lưới cước ma thu gom tại đáy biển Đà Nẵng
                </p>
              </div>

              <div className="space-y-2.5 text-xs border-t border-[#FAF7F2] pt-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Mã mẻ lưới thu gom:</span>
                  <span className="font-mono font-semibold text-[#241B16]">
                    {passport.batchId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Tọa độ GPS rạn san hô:</span>
                  <span className="font-mono font-semibold text-teal-800">
                    {passport.coordinates.lat.toFixed(3)}°N, {passport.coordinates.lng.toFixed(3)}°E
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Ngày thu gom / hoàn thiện:</span>
                  <span className="font-medium text-[#241B16]">
                    {passport.recoveryDate}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Lượng cước ma thu gom cho túi:</span>
                  <span className="font-bold text-emerald-800">
                    {passport.plasticOffsetKg} kg rác biển
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Bảo vệ rạn san hô tương đương:</span>
                  <span className="font-bold text-teal-700">
                    ~{passport.coralProtectedSqM} m² đáy biển
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#7A6F68] leading-relaxed border-t border-[#FAF7F2]">
                Mỗi chiếc túi NÉT mang mã số riêng biệt, bảo chứng chuỗi cung ứng minh bạch không thể làm giả.
              </div>
            </div>

            {/* CARD 02 / KÝ ỨC & BẢN PHỐI CHARM */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                02 / KÝ ỨC CỦA BẠN
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#241B16]">
                  {passport.storyTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6F68] mt-1 font-light">
                  "{passport.storyDedication}"
                </p>
              </div>

              {/* Charm Meanings List */}
              <div className="space-y-3 pt-3 border-t border-[#FAF7F2]">
                {passport.placedCharms.length === 0 ? (
                  <p className="text-xs text-[#7A6F68] italic">
                    Túi phôi tiêu chuẩn. Bạn có thể mang túi đến NÉT Studio để gắn thêm các charm kim loại hộ mệnh.
                  </p>
                ) : (
                  passport.placedCharms.map((placed) => (
                    <div
                      key={placed.instanceId}
                      className="flex items-start gap-3 text-xs"
                    >
                      <span
                        className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                        style={{ backgroundColor: placed.charm?.color || "#38bdf8" }}
                      >
                        {placed.charm?.symbol || "✨"}
                      </span>
                      <p className="text-[#42342B] leading-relaxed">
                        <strong>{placed.charm?.vietnameseName}</strong> —{" "}
                        {placed.charm?.description || "Phụ kiện độc bản đúc kim loại mạ vàng tinh xảo."}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CARD 03 / BẢO HÀNH CHÍNH HÃNG & CHĂM SÓC */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                  03 / BẢO HÀNH ĐIỆN TỬ & CHĂM SÓC
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Bảo hành 24 tháng chính hãng
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Chủ sở hữu đăng ký:</span>
                  <span className="font-bold text-[#241B16]">
                    {passport.ownerName || "Khách hàng sở hữu NÉT"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Hạn bảo hành:</span>
                  <span className="font-semibold text-emerald-800">
                    {passport.warrantyExpiresAt || "24 tháng kể từ ngày kích hoạt"}
                  </span>
                </div>
                {passport.barcode && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#7A6F68]">Mã vạch Code 128:</span>
                    <span className="font-mono text-slate-700 font-semibold">{passport.barcode}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#42342B] leading-relaxed pt-2 border-t border-[#FAF7F2]">
                <strong>Hướng dẫn vệ sinh:</strong> {passport.careGuide}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
