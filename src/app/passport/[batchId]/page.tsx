"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { getAllBatches, getBatchById, getPassportStory } from "@/lib/netSourceStorage";
import {
  getPassportDataFromFirestore,
  mintBagItemToFirestore,
  DbBagItem,
} from "@/lib/firestoreService";
import {
  getManufacturedItemBySerial,
  claimBagWarranty,
  getAllOrders,
  updateOrderStatus,
} from "@/lib/supplyChainStorage";
import { TraceBatch, ManufacturedBagItem } from "@/types";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { useAuth } from "@/context/AuthContext";
import { formatKg, formatVND } from "@/lib/utils";
import {
  ShieldCheck,
  MapPin,
  Anchor,
  Compass,
  Sparkles,
  QrCode,
  Share2,
  ExternalLink,
  Waves,
  Heart,
  ChevronDown,
  Layers,
  ArrowLeft,
  Smartphone,
  Search,
  Radio,
  Tag,
  Calendar,
  Barcode,
  Cpu,
  CheckCircle2,
  UserCheck,
  Clock,
  Award,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

function StoryPassportContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userProfile } = useAuth();

  const rawPassportId = (params?.batchId as string) || "PACK-DN-2024-082";
  const decodedPassportId = decodeURIComponent(rawPassportId);
  const itemIdParam = searchParams.get("itemId");

  const [searchQuery, setSearchQuery] = useState(itemIdParam || decodedPassportId);
  const [batches, setBatches] = useState<TraceBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<TraceBatch | null>(null);
  const [bagItemData, setBagItemData] = useState<DbBagItem | null>(null);
  const [mfgItem, setMfgItem] = useState<ManufacturedBagItem | null>(null);
  const [passportStory, setPassportStory] = useState<ReturnType<typeof getPassportStory>>(null);
  const [activeTab, setActiveTab] = useState<"warranty" | "map" | "cocreation" | "impact">("warranty");
  const [copiedLink, setCopiedLink] = useState(false);

  // Warranty Claim Form State
  const [claimName, setClaimName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    const all = getAllBatches();
    setBatches(all);

    const targetLookup = itemIdParam || decodedPassportId;
    const directMfg = getManufacturedItemBySerial(targetLookup);
    if (directMfg) {
      setMfgItem(directMfg);
    }

    const data = await getPassportDataFromFirestore(targetLookup);
    setSelectedBatch(data.batchData);
    if (data.itemData) {
      setBagItemData(data.itemData);
    }
    const story = getPassportStory(targetLookup);
    setPassportStory(story);

    // Auto-fill claim info if user is authenticated
    if (userProfile?.displayName) setClaimName(userProfile.displayName);
    if (userProfile?.phone) setClaimPhone(userProfile.phone);
  };

  useEffect(() => {
    loadData();
  }, [decodedPassportId, itemIdParam, userProfile]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/passport/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectBatch = (batch: TraceBatch) => {
    setSelectedBatch(batch);
    setSearchQuery(batch.batchId);
    router.push(`/passport/${encodeURIComponent(batch.batchId)}`);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleClaimWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSerial = mfgItem?.serialId || bagItemData?.itemId || itemIdParam;
    if (!targetSerial) {
      alert("Không tìm thấy mã sản phẩm để kích hoạt!");
      return;
    }
    if (!claimName.trim() || !claimPhone.trim()) {
      alert("Vui lòng nhập Họ tên và Số điện thoại!");
      return;
    }

    setIsClaiming(true);
    const res = claimBagWarranty(targetSerial, {
      fullName: claimName.trim(),
      phone: claimPhone.trim(),
      email: userProfile?.email || undefined,
      customerUid: userProfile?.uid || undefined,
    });

    if (res.success) {
      // Đúc túi vào Firestore nếu người dùng đã đăng nhập để hiện ngay trong Profile
      if (userProfile?.uid) {
        const plasticKg = mfgItem?.plasticConsumedKg || 0.65;
        const bagItem: DbBagItem = {
          itemId: targetSerial,
          parentBatchId: selectedBatch?.batchId || "PACK-DN-2024-082",
          itemIndex: 1,
          bagName: mfgItem?.bagName || bagItemData?.bagName || "Túi Lưới Tái Chế NÉT",
          colorName: mfgItem?.colorName || "Đại Dương Xanh",
          ownerUid: userProfile.uid,
          ownerName: claimName.trim(),
          ownerPhone: claimPhone.trim(),
          selectedCharms: [],
          poeticDedication: `Kỷ vật bảo hành điện tử chính hãng đến ${res.item?.warrantyExpiresAt || "2028"}`,
          plasticOffsetKg: plasticKg,
          coralProtectedSqM: Number((plasticKg * 1.5).toFixed(1)),
          co2AvoidedKg: Number((plasticKg * 1.9).toFixed(1)),
          qrUrl: `/passport/${encodeURIComponent(selectedBatch?.batchId || "")}?itemId=${encodeURIComponent(targetSerial)}`,
          createdAt: new Date().toISOString(),
        };
        mintBagItemToFirestore(bagItem).catch(() => {});
      }

      // Nếu có mã đơn hàng truyền qua link (orderCodeParam), tự động đánh dấu đơn đã định danh
      const orderCodeParam = searchParams.get("orderCode");
      if (orderCodeParam) {
        try {
          const orders = getAllOrders();
          const ord = orders.find((o) => o.orderCode === orderCodeParam);
          if (ord) {
            updateOrderStatus(ord.orderId, "delivered", {
              isClaimed: true,
              claimedAt: new Date().toISOString(),
              claimedByUserId: userProfile?.uid,
              assignedBagSerialId: targetSerial,
            });
            import("firebase/firestore").then(({ doc, updateDoc, serverTimestamp }) => {
              import("@/lib/firebase").then(({ db }) => {
                updateDoc(doc(db, "orders", ord.orderId), {
                  isClaimed: true,
                  claimedAt: new Date().toISOString(),
                  claimedByUserId: userProfile?.uid || null,
                  assignedBagSerialId: targetSerial,
                  updatedAt: serverTimestamp(),
                }).catch(() => {});
              });
            });
          }
        } catch (e) {
          // Ignored
        }
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#14b8a6", "#38bdf8", "#f59e0b", "#10b981"],
      });
      setClaimSuccessMsg(res.message);
      loadData();
    } else {
      alert(res.message);
    }
    setIsClaiming(false);
  };

  if (!selectedBatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50 text-slate-700 font-mono text-xs">
        Đang nạp Hải Đồ & Căn Cước Số NÉT Story Passport...
      </div>
    );
  }

  // Active item info (either from mfgItem or bagItemData)
  const serialCode = mfgItem?.serialId || bagItemData?.itemId || "NET-ST-082-001";
  const bagTitle = mfgItem?.bagName || bagItemData?.bagName || "NÉT Tote Signature (Xanh Thẳm)";
  const isItemClaimed = mfgItem?.isClaimed || false;
  const barcodeValue = mfgItem?.barcode || "893882082001";
  const nfcUid = mfgItem?.nfcTagUid || "04:82:01:B2:C1";
  const ownerName = mfgItem?.claimedBy?.fullName || bagItemData?.ownerName || "Lê Minh Thảo";
  const ownerPhone = mfgItem?.claimedBy?.phone || "0905 882 119";
  const maskedPhone = ownerPhone.replace(/(\d{4})\d{3}(\d{3})/, "$1 ••• $2");
  const activatedDate = mfgItem?.warrantyActivatedAt || "2026-10-09 10:20";
  const expiryDate = mfgItem?.warrantyExpiresAt || "2028-10-09";

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#f0f9ff] via-[#e0f2fe]/40 to-[#f8fafc] text-slate-800 pb-24">
      {/* Living Deep Ocean Ambient */}
      <OceanBackdrop bubbleCount={18} causticsOpacity={0.22} />

      <div className="pt-20 sm:pt-24 px-3 sm:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 relative z-10">
        {/* Top Header & Search Bar */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1e3b] text-sky-200 text-xs font-bold uppercase tracking-[0.2em] shadow-md mb-1">
            <Radio className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
            <span>CĂN CƯỚC SẢN PHẨM SỐ & DIGITAL PASSPORT</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#0b1e3b] tracking-tight leading-tight">
            Xác Thực Căn Cước & Kích Hoạt Bảo Hành
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Hệ thống định danh số độc bản: Kiểm tra nguồn gốc mẻ lưới Sơn Trà, xác thực quyền sở hữu và kích hoạt bảo hành điện tử 24 tháng chính hãng.
          </p>

          {/* Search by Batch ID or Item ID */}
          <form
            onSubmit={handleSearchSubmit}
            className="p-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.06)] max-w-xl mx-auto flex items-center gap-2 mt-4"
          >
            <div className="pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập Serial (NET-ST-082-001) hoặc Mã Kiện (PACK-DN-2024-082)..."
              className="w-full bg-transparent text-xs sm:text-sm text-[#0b1e3b] placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#0b1e3b] text-white text-xs font-bold hover:bg-sky-950 transition-colors cursor-pointer"
            >
              Tra Cứu
            </button>
          </form>

          {/* Quick Batch Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-600">
            <span>Kiện tiêu biểu:</span>
            {batches.slice(0, 4).map((b) => (
              <button
                key={b.batchId}
                onClick={() => handleSelectBatch(b)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedBatch.batchId === b.batchId
                    ? "bg-[#0b1e3b] text-white font-bold border-[#0b1e3b] shadow-sm"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {b.batchId}
              </button>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CORE NFC WARRANTY & OWNERSHIP HERO CARD (SYPIK-STYLE) */}
        {/* ------------------------------------------------------------- */}
        <div className="max-w-4xl mx-auto">
          {isItemClaimed ? (
            /* CASE 1: ALREADY CLAIMED & ACTIVATED WARRANTY */
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#07172f] via-[#0b2447] to-[#071326] border-2 border-emerald-400/60 shadow-2xl text-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/60 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-bold shadow-inner">
                    <Award className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>ĐÃ ĐỊNH DANH SỞ HỮU & BẢO HÀNH CHÍNH HÃNG</span>
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                      {bagTitle}
                    </h2>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Mã Serial Độc Bản</div>
                  <div className="font-mono text-base font-extrabold text-teal-300">{serialCode}</div>
                </div>
              </div>

              {/* Warranty Owner Certificate Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <div className="text-slate-400 text-[10px]">Chủ Nhân Sở Hữu:</div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>{ownerName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">SĐT: {maskedPhone}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <div className="text-slate-400 text-[10px]">Thời Hạn Bảo Hành:</div>
                  <div className="font-bold text-emerald-300 text-sm">24 Tháng Toàn Diện</div>
                  <div className="text-[10px] text-slate-400 font-mono">Đến: {expiryDate}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <div className="text-slate-400 text-[10px]">Mã Vạch Dệt May Trong Túi:</div>
                  <div className="font-mono font-bold text-teal-300 text-sm flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-teal-400" />
                    <span>{barcodeValue}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Care Label Code 128</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <div className="text-slate-400 text-[10px]">Mã Chip NFC Phần Cứng:</div>
                  <div className="font-mono font-bold text-sky-300 text-sm flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>{nfcUid}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">NTAG213 Kháng Nước</div>
                </div>
              </div>

              {/* Anti-Counterfeit Verification Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[11px] text-slate-300 bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/40">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Chiếc túi đã được ghi nhận quyền sở hữu chính thức. Mọi nỗ lực sao chép mã định danh đều bị máy chủ từ chối.
                  </span>
                </div>
                <div className="font-mono text-emerald-400 font-bold shrink-0">
                  Kích hoạt: {activatedDate}
                </div>
              </div>
            </div>
          ) : (
            /* CASE 2: UNACTIVATED / UNCLAIMED - READY FOR CUSTOMER NFC CLAIM */
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#071326] via-[#0b1e3b] to-[#081b36] border-2 border-amber-400/70 shadow-2xl text-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-800/50 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold shadow-inner">
                    <Cpu className="w-7 h-7 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>CĂN CƯỚC SỐ ĐỘC BẢN — BẢO HÀNH ĐIỆN TỬ CHƯA KÍCH HOẠT</span>
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                      {bagTitle}
                    </h2>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Mã Serial Khắc Khóa</div>
                  <div className="font-mono text-base font-extrabold text-amber-300">{serialCode}</div>
                </div>
              </div>

              {/* Hardware Spec Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-slate-400 text-[10px]">Mã Vạch May Lót:</div>
                  <div className="font-mono font-bold text-white mt-0.5">{barcodeValue}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-slate-400 text-[10px]">Mã Căn Cước Số:</div>
                  <div className="font-mono font-bold text-teal-300 mt-0.5">{nfcUid}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-slate-400 text-[10px]">Chính Sách Bảo Hành:</div>
                  <div className="font-bold text-emerald-400 mt-0.5">24 Tháng Toàn Diện</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-slate-400 text-[10px]">Nguồn Lưới:</div>
                  <div className="font-mono font-bold text-sky-300 mt-0.5">{selectedBatch.batchId}</div>
                </div>
              </div>

              {/* Active Claim Form */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
                    Kích Hoạt Bảo Hành Điện Tử & Ghi Tên Sở Hữu Độc Bản
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nhập thông tin bên dưới để định danh chiếc túi vào tài khoản của bạn. Thông tin bảo hành sẽ được lưu trữ vĩnh viễn trên hệ thống và hiển thị trong Bộ Sưu Tập cá nhân.
                </p>

                {claimSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{claimSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleClaimWarranty} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Họ và Tên Chủ Sở Hữu:
                    </label>
                    <input
                      type="text"
                      required
                      value={claimName}
                      onChange={(e) => setClaimName(e.target.value)}
                      placeholder="VD: Lê Minh Thảo"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Số Điện Thoại Kích Hoạt:
                    </label>
                    <input
                      type="tel"
                      required
                      value={claimPhone}
                      onChange={(e) => setClaimPhone(e.target.value)}
                      placeholder="VD: 0905 882 119"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="submit"
                      disabled={isClaiming}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isClaiming ? "Đang Ghi..." : "Kích Hoạt Ngay"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Unified Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Marine Radar & Dossier */}
          <div className="lg:col-span-8 space-y-6">
            {/* Marine Radar Map Canvas */}
            <div className="p-5 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.06)] space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-teal-600 animate-spin" />
                  <span className="font-bold text-sm text-[#0b1e3b] uppercase tracking-wider">
                    Hải Đồ Vị Trí Cắt Lưới Đáy Biển
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${selectedBatch.coordinates.lat},${selectedBatch.coordinates.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-700 hover:text-[#0b1e3b] flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Vệ Tinh GPS Thực Tế</span>
                </a>
              </div>

              {/* Bathymetry Canvas Graphic */}
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700 bg-[#071a33] flex items-center justify-center shadow-inner">
                {/* Radial Grid */}
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle, #38bdf8 1px, transparent 1px)`,
                    backgroundSize: "28px 28px",
                  }}
                />

                {/* Ocean Wave Sweeper */}
                <motion.div
                  animate={{ x: ["-20%", "20%", "-20%"], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent pointer-events-none"
                />

                {/* Markers for all coastal batches */}
                <div className="absolute inset-0 flex items-center justify-around p-4 sm:p-8 z-10">
                  {batches.map((b) => {
                    const isCurrent = b.batchId === selectedBatch.batchId;
                    return (
                      <button
                        key={b.batchId}
                        onClick={() => handleSelectBatch(b)}
                        className={`relative flex flex-col items-center transition-all duration-300 cursor-pointer ${
                          isCurrent ? "scale-110 z-20" : "opacity-75 hover:opacity-100 hover:scale-105"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg relative ${
                            isCurrent
                              ? "bg-teal-400 text-slate-950 ring-4 ring-teal-400/40"
                              : "bg-white/20 text-teal-200 border border-white/20 backdrop-blur-md"
                          }`}
                        >
                          {isCurrent && (
                            <span className="absolute -inset-2 rounded-full border-2 border-teal-300 animate-ping opacity-80" />
                          )}
                          <MapPin className="w-5 h-5 relative z-10" />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-white mt-1.5 whitespace-nowrap bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 shadow-sm">
                          {b.seaRegion.split(",")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Marker Bottom Overlay */}
                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl text-[11px] font-mono text-teal-300">
                  GPS: {selectedBatch.coordinates.lat.toFixed(4)}°N, {selectedBatch.coordinates.lng.toFixed(4)}°E • Độ sâu {selectedBatch.depthMeters}m
                </div>
              </div>

              {/* Dossier Tabs */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  onClick={() => setActiveTab("warranty")}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                    activeTab === "warranty"
                      ? "bg-[#0b1e3b] text-white shadow-md"
                      : "text-slate-600 hover:text-[#0b1e3b]"
                  }`}
                >
                  Chính Sách Bảo Hành
                </button>
                <button
                  onClick={() => setActiveTab("map")}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                    activeTab === "map"
                      ? "bg-[#0b1e3b] text-white shadow-md"
                      : "text-slate-600 hover:text-[#0b1e3b]"
                  }`}
                >
                  Chi Tiết Mẻ Lưới
                </button>
                <button
                  onClick={() => setActiveTab("cocreation")}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                    activeTab === "cocreation"
                      ? "bg-[#0b1e3b] text-white shadow-md"
                      : "text-slate-600 hover:text-[#0b1e3b]"
                  }`}
                >
                  Kỷ Vật Độc Bản
                </button>
                <button
                  onClick={() => setActiveTab("impact")}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                    activeTab === "impact"
                      ? "bg-[#0b1e3b] text-white shadow-md"
                      : "text-slate-600 hover:text-[#0b1e3b]"
                  }`}
                >
                  Bảo Chứng Tác Động
                </button>
              </div>

              {/* Tab: Warranty Policy */}
              {activeTab === "warranty" && (
                <div className="space-y-4 pt-2 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="font-serif text-sm font-bold text-[#0b1e3b]">
                      CAM KẾT CHẤT LƯỢNG & BẢO HÀNH ĐIỆN TỬ NÉT
                    </div>
                    <ul className="space-y-2 text-slate-700 leading-relaxed list-disc list-inside">
                      <li><strong>Bảo hành 24 tháng:</strong> Miễn phí phục hồi các đường may, đan mắt lưới thủ công và quai đeo.</li>
                      <li><strong>Phụ kiện đồng thau hàng hải:</strong> Bảo hành chống gỉ sét, hỗ trợ đánh bóng phục hồi trọn đời.</li>
                      <li><strong>Chính sách thu hồi tuần hoàn:</strong> Khi bạn không còn nhu cầu sử dụng, NÉT nhận thu hồi lại túi để tái sinh thành charm mới, hoàn lại 30% giá trị cho đơn hàng tiếp theo.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab: Detailed Ingestion Dossier */}
              {activeTab === "map" && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="text-xs text-slate-500">Vùng biển & Rạn san hô thu hồi:</div>
                    <div className="font-serif text-lg font-bold text-[#0b1e3b]">{selectedBatch.seaRegion}</div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">{selectedBatch.story}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-500 text-[10px]">Lưới Đã Vớt</div>
                      <div className="text-base font-bold text-teal-700 mt-0.5">
                        {selectedBatch.plasticRecoveredKg} kg
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-500 text-[10px]">Độ Sâu Đáy</div>
                      <div className="text-base font-bold text-sky-700 mt-0.5">
                        {selectedBatch.depthMeters} mét
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-500 text-[10px]">Sinh Vật Cứu Hộ</div>
                      <div className="text-base font-bold text-amber-700 mt-0.5">
                        {selectedBatch.marineAnimalsSavedCount || 14} cá thể
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-500 text-[10px]">Ngày Trục Vớt</div>
                      <div className="text-base font-bold text-emerald-700 mt-0.5">
                        {selectedBatch.recoveryDate}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Co-Creation Story */}
              {activeTab === "cocreation" && (
                <div className="space-y-4 pt-2">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-teal-50 border border-teal-200/80 text-[#0b1e3b] text-xs sm:text-sm italic leading-relaxed">
                    &ldquo;{bagItemData?.poeticDedication ||
                      passportStory?.poeticDedication ||
                      "Được tôi luyện từ ánh lửa kiêu hùng của Rồng thiêng Đà Nẵng và thắt chặt bởi sợi lưới đại dương Sơn Trà kiên cường, thiết kế này trao cho bạn bản lĩnh vững vàng trước mọi phong ba."}&rdquo;
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Chủ nhân sở hữu:</span>
                      <span className="font-bold text-[#0b1e3b]">{ownerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mã định danh túi:</span>
                      <span className="font-mono font-bold text-teal-700">{serialCode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phôi túi:</span>
                      <span className="font-semibold text-slate-800">{bagTitle}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Environmental Impact Certificate */}
              {activeTab === "impact" && (
                <div className="space-y-4 pt-2 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
                      <span>Đơn vị thợ lặn trục vớt:</span>
                      <span className="font-bold text-[#0b1e3b]">{selectedBatch.recoveryTeam}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 pb-2 border-b border-slate-200">
                      <span>Chất liệu polymer:</span>
                      <span className="font-mono text-teal-700 font-bold">{selectedBatch.netPolymer || "Nylon-6 Polyamide"}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Giảm phát thải CO2e:</span>
                      <span className="font-bold text-emerald-700">
                        -{selectedBatch.co2OffsetKg || (selectedBatch.plasticRecoveredKg * 1.9).toFixed(1)} kg
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500">Mã Băm Xác Thực Số (Cryptographic Hash):</div>
                    <div className="font-mono text-[11px] text-slate-700 break-all font-semibold">
                      {selectedBatch.verificationHash}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Physical Product Passport Card & Barcode / NFC Specs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.06)] text-center space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b1e3b] text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>BẢO CHỨNG SỐ DIGITAL PASSPORT</span>
              </div>

              {/* Physical Garment Care Barcode Graphic */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  MÃ VẠCH MAY LÓT BÊN TRONG TÚI
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-300 flex flex-col items-center justify-center">
                  {/* CSS-based Barcode stripes */}
                  <div className="flex items-center justify-center gap-0.5 h-10 w-44 overflow-hidden">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 2].map((w, idx) => (
                      <div
                        key={idx}
                        className={`h-full bg-slate-900 ${idx % 2 === 0 ? "opacity-100" : "opacity-0"}`}
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-xs font-black tracking-widest text-slate-800 mt-1">
                    {barcodeValue}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  Dệt trên tem vải satin lót túi cho thủ kho quét tia laser
                </div>
              </div>

              {/* Digital Passport Spec */}
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0b1e3b] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Căn Cước Số Độc Bản</span>
                  </span>
                  <span className="text-[10px] font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    ID: {serialCode}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600">
                  Mã định danh duy nhất liên kết với đơn hàng và tài khoản khách hàng, bảo chứng minh bạch qua hệ sinh thái NÉT.
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleShare}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0b1e3b] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-sky-950 transition-colors shadow-md cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-teal-300" />
                  <span>{copiedLink ? "Đã Sao Chép Liên Kết!" : "Chia Sẻ Passport Sản Phẩm"}</span>
                </button>

                <Link
                  href="/story"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-[#0b1e3b] border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>Đồng Sáng Tạo Mẫu Mới (Your Story)</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoryPassportDynamicPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sky-50 text-slate-700 font-mono text-xs">
          Đang nạp Hải Đồ & Căn Cước NÉT Story Passport...
        </div>
      }
    >
      <StoryPassportContent />
    </Suspense>
  );
}
