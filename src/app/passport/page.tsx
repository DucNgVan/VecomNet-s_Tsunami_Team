"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  Package,
  Layers,
  ExternalLink,
  ChevronRight,
  QrCode,
  Tag,
  Compass,
  ShoppingBag,
  Award,
} from "lucide-react";
import { StoryPassportView } from "@/components/passport/StoryPassportView";
import { BagCard3D } from "@/components/3d/BagCard3D";
import { useAuth } from "@/context/AuthContext";
import { getCustomerBagsFromFirestore, getProductsFromFirestore } from "@/lib/firestoreService";
import { getManufacturedItems } from "@/lib/supplyChainStorage";
import { getAllDesignRequests } from "@/lib/designRequestStorage";
import { BAG_COLORS, BAG_BASES } from "@/data/products";
import { formatVND } from "@/lib/utils";

interface OwnedBag {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  image: string;
  model3dUrl?: string;
  passportCode: string;
  seaRegion?: string;
  purchasedAt?: string;
  plasticOffsetKg?: number;
  warrantyStatus?: string;
}

function PassportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const directCode = searchParams.get("code") || searchParams.get("batch");
  const { user, userProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [ownedBags, setOwnedBags] = useState<OwnedBag[]>([]);
  const [selectedBagIndex, setSelectedBagIndex] = useState<number>(0);
  const [highlightedBag, setHighlightedBag] = useState<any>(null);
  const [lookupCodeInput, setLookupCodeInput] = useState("");

  useEffect(() => {
    async function loadPassportData() {
      setIsLoading(true);
      try {
        // 1. Tải mẫu túi Highlight từ Bộ Sưu Tập của Admin
        const dbProducts = await getProductsFromFirestore();
        if (dbProducts && dbProducts.length > 0) {
          const bagProducts = dbProducts.filter(
            (p: any) => p && p.isActive !== false && p.category !== "charm" && p.category !== "combo"
          );
          const foundHighlight = bagProducts.find((p: any) => p.isHighlighted);
          setHighlightedBag(foundHighlight || bagProducts[0] || BAG_BASES[0]);
        } else {
          setHighlightedBag(BAG_BASES[0]);
        }

        // 2. Tải danh sách túi người dùng thực sự sở hữu
        const collectedBags: OwnedBag[] = [];
        const seenCodes = new Set<string>();

        // A. Từ Firestore collection "bag_items" (túi đã định danh theo tài khoản)
        if (user?.uid) {
          try {
            const firestoreBags = await getCustomerBagsFromFirestore(user.uid);
            for (const item of firestoreBags) {
              const code = item.itemId || (item as any).passportCode || `NET-BAG-${item.itemId}`;
              if (!seenCodes.has(code)) {
                seenCodes.add(code);
                collectedBags.push({
                  id: item.itemId,
                  name: item.bagName || "Túi NÉT Tái Sinh",
                  colorName: item.colorName || "Xanh Lá",
                  colorHex: "#3d8b85",
                  image: "/assets/products/bags/tuixach-xanh-la.png",
                  passportCode: code,
                  seaRegion: (item as any).seaRegion || "Vùng biển Đà Nẵng",
                  purchasedAt: item.createdAt || "2026-10-18",
                  plasticOffsetKg: 1.6,
                  warrantyStatus: "active",
                });
              }
            }
          } catch (e) {
            console.warn("Lỗi tải túi Firestore:", e);
          }
        }

        // B. Từ localStorage supplyChain "net_manufactured_items_v1"
        try {
          const localItems = getManufacturedItems();
          for (const item of localItems) {
            const isOwner =
              (user?.uid && item.claimedBy?.customerUid === user.uid) ||
              (userProfile?.phone && item.claimedBy?.phone === userProfile.phone) ||
              item.isClaimed;

            if (isOwner) {
              const code = item.serialId || item.barcode;
              if (!seenCodes.has(code)) {
                seenCodes.add(code);
                collectedBags.push({
                  id: item.serialId,
                  name: item.bagName || "Túi NÉT Tái Sinh",
                  colorName: item.colorName || "Xanh Lá",
                  colorHex: "#3d8b85",
                  image: "/assets/products/bags/tuixach-xanh-la.png",
                  passportCode: code,
                  seaRegion: item.seaRegion || "Vùng biển Nam Ô",
                  purchasedAt: item.manufacturedAt || "2026-10-18",
                  plasticOffsetKg: item.plasticConsumedKg || 1.6,
                  warrantyStatus: item.warrantyStatus || "active",
                });
              }
            }
          }
        } catch (e) {
          console.warn("Lỗi đọc local manufactured items:", e);
        }

        // C. Từ Design Requests đã gửi thành công trên thiết bị này
        try {
          const requests = getAllDesignRequests();
          for (const req of requests) {
            const code = req.passportCode || req.id;
            if (!seenCodes.has(code)) {
              seenCodes.add(code);
              collectedBags.push({
                id: req.id,
                name: req.bagName || "Túi NÉT Độc Bản",
                colorName: req.bagColor?.name || "Xanh Lá",
                colorHex: req.bagColor?.hex || "#3d8b85",
                image: req.bagColor?.image || "/assets/products/bags/tuixach-xanh-la.png",
                model3dUrl: req.bagColor?.model3dUrl,
                passportCode: req.passportCode || req.id,
                seaRegion: "Vùng biển Đà Nẵng",
                purchasedAt: req.createdAt,
                plasticOffsetKg: (req.placedCharms?.length || 2) * 0.2 + 1.6,
                warrantyStatus: "active",
              });
            }
          }
        } catch (e) {
          console.warn("Lỗi đọc design requests:", e);
        }

        setOwnedBags(collectedBags);
      } catch (err) {
        console.warn("Lỗi tải passport:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPassportData();
  }, [user, userProfile]);

  // Nếu người dùng truy cập với mã passport cụ thể trên URL (?code=...)
  if (directCode) {
    return <StoryPassportView passportCode={directCode} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] p-6 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#B85D43] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-[#7A6F68]">Đang nạp Hộ Chiếu Số Đại Dương...</p>
      </div>
    );
  }

  // TRƯỜNG HỢP 1: NGƯỜI DÙNG ĐÃ TỪNG MUA / ĐÃ CÓ TÚI
  if (ownedBags.length > 0) {
    const activeBag = ownedBags[selectedBagIndex] || ownedBags[0];

    return (
      <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#B85D43]">
                <ShieldCheck className="w-4 h-4" />
                <span>BỘ SƯU TẬP HỘ CHIẾU SỐ CỦA BẠN</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#241B16] mt-1">
                Tác Phẩm Túi NÉT Đã Được Định Danh
              </h1>
              <p className="text-xs text-[#7A6F68] mt-1">
                Bạn đang sở hữu <strong>{ownedBags.length} chiếc túi độc bản</strong>. Bấm chọn từng túi để mở hộ chiếu số, tọa độ trục vớt và bảo hành điện tử.
              </p>
            </div>

            <Link
              href="/studio"
              className="px-4 py-2.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>+ Phối Thêm Túi Mới</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bag Selector Carousel / Tabs (Phòng trường hợp 1 người sở hữu nhiều túi) */}
          {ownedBags.length > 1 && (
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-[#7A6F68] font-bold block">
                Chọn túi để xem Passport:
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {ownedBags.map((bag, idx) => {
                  const isSelected = idx === selectedBagIndex;
                  return (
                    <button
                      key={bag.id || idx}
                      type="button"
                      onClick={() => setSelectedBagIndex(idx)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-white border-[#B85D43] shadow-md ring-2 ring-[#B85D43]/20 scale-[1.02]"
                          : "bg-white/60 border-[#E8E2D8] hover:bg-white hover:border-[#D6CCC0]"
                      }`}
                    >
                      <img
                        src={bag.image || "/assets/products/bags/tuixach-xanh-la.png"}
                        alt={bag.name}
                        className="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-100 p-1"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#241B16] truncate max-w-[140px]">
                          {bag.name}
                        </span>
                        <span className="text-[10px] text-[#7A6F68]">
                          Màu: {bag.colorName} · {bag.passportCode}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#B85D43] shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Bag Story Passport View */}
          <div className="bg-white rounded-3xl border border-[#E8E2D8] p-4 sm:p-8 shadow-sm">
            <StoryPassportView passportCode={activeBag.passportCode} />
          </div>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: NGƯỜI DÙNG CHƯA TỪNG ĐỊNH DANH & CHƯA CÓ PASSPORT
  // Chiếu sản phẩm 3D Highlight và thông báo hãy tạo ra chiếc túi của chính bạn!
  const highlightColor = highlightedBag?.colors?.[0] || BAG_COLORS[0];
  const highlightModel =
    highlightColor.model3dUrl ||
    highlightedBag?.model3dUrl ||
    "/assets/models/tuixach-xanh-la.glb";

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-10 sm:py-16 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Main 2-Column Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: 3D Interactive Highlight Bag */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 flex flex-col items-center"
          >
            <div className="w-full max-w-[420px] aspect-[4/5] bg-[#EFE9DF] rounded-t-[220px] rounded-b-[40px] p-6 shadow-md relative border border-[#E8E2D8] flex flex-col items-center justify-center">
              <span className="absolute top-6 left-6 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] uppercase tracking-wider font-bold text-[#B85D43] border border-[#E8E2D8] shadow-xs flex items-center gap-1.5 z-20">
                <Sparkles className="w-3 h-3 text-[#B85D43]" />
                <span>Tiêu Điểm Bộ Sưu Tập</span>
              </span>

              <BagCard3D
                modelUrl={highlightModel}
                color={highlightColor.hex}
                className="w-full h-full"
                isInteractive={true}
                autoRotateSpeed={0.008}
              />

              <div className="absolute bottom-4 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#5E4D43] border border-[#E8E2D8] shadow-xs z-20">
                {highlightedBag?.name || "NÉT Tote Signature"} · Xoay 360°
              </div>
            </div>
          </motion.div>

          {/* Right Column: Inspiring Call-To-Action */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DF] text-[10px] tracking-[0.2em] uppercase font-bold text-[#B85D43]">
              <Compass className="w-3.5 h-3.5" />
              <span>HỘ CHIẾU SỐ ĐẠI DƯƠNG · STORY PASSPORT</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-[#241B16] font-bold leading-tight">
              Tạo Ra Chiếc Túi Của Riêng Bạn Để Nhận Hộ Chiếu Số
            </h1>

            <div className="space-y-3 text-sm text-[#5E4D43] leading-relaxed">
              <p>
                Hiện tại tài khoản của bạn chưa có tác phẩm túi tái sinh nào mang định danh số riêng.
              </p>
              <p>
                Mỗi chiếc túi xuất xưởng từ xưởng may <strong>NÉT</strong> đều được cấp một <strong>Story Passport (Hộ Chiếu Số)</strong> độc bản. Hộ chiếu này gắn liền với tọa độ mẻ lưới ma được trục vớt ngoài khơi vịnh Đà Nẵng, khối lượng rác biển bạn đã chữa lành, cùng chế độ bảo hành và vệ sinh trọn đời.
              </p>
              <p className="font-medium text-[#241B16]">
                Hãy vào NÉT Studio, tự tay chọn phom dáng, phối màu sắc và gắn charm kỷ niệm để xưởng may chế tác tác phẩm đầu tiên dành riêng cho bạn!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/studio"
                className="px-6 py-3.5 rounded-2xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-bold shadow-md shadow-[#B85D43]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Tự Thiết Kế Chiếc Túi Của Bạn Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop"
                className="px-5 py-3.5 rounded-2xl bg-white hover:bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-bold text-[#5E4D43] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span>Khám Phá Bộ Sưu Tập</span>
              </Link>
            </div>

            {/* Tra cứu hộ chiếu túi đã nhận trên thực tế */}
            <div className="pt-6 border-t border-[#E8E2D8] space-y-2.5">
              <label className="block text-xs font-bold text-[#241B16]">
                Bạn đã nhận túi thực tế và có thẻ QR / Barcode trên túi?
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={lookupCodeInput}
                  onChange={(e) => setLookupCodeInput(e.target.value)}
                  placeholder="Nhập mã serial (VD: NET-BAG-3408 hoặc DEMO-DN-001)"
                  className="flex-1 p-2.5 rounded-xl border border-[#E8E2D8] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#B85D43]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (lookupCodeInput.trim()) {
                      router.push(`/passport?code=${encodeURIComponent(lookupCodeInput.trim())}`);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#241B16] hover:bg-black text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
                >
                  Tra cứu
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function PassportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68]">
          Đang nạp Story Passport...
        </div>
      }
    >
      <PassportContent />
    </Suspense>
  );
}
