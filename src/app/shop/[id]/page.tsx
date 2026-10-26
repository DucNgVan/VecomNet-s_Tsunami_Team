"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Sparkles,
  Wand2,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  RotateCw,
  Image as ImageIcon,
  Compass,
  Share2,
  Check,
  Layers,
  Box,
  Truck,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { BAG_COLORS } from "@/data/products";
import { BagBase, BagMeshColor, Charm, ProductCombo, ManufacturedBagItem } from "@/types";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastNotification";
import { formatVND, formatKg } from "@/lib/utils";
import { BagCanvas3D } from "@/components/3d/BagCanvas3D";
import { BagCard3D } from "@/components/3d/BagCard3D";
import { CharmCanvas3D } from "@/components/3d/CharmCanvas3D";
import { getManufacturedItems } from "@/lib/supplyChainStorage";
import {
  getProductsFromFirestore,
  getProductByIdFromFirestore,
} from "@/lib/firestoreService";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [rawProduct, setRawProduct] = useState<any | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [manufacturedItems, setManufacturedItems] = useState<ManufacturedBagItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<"photo" | "3d">("photo");
  const [selectedColor, setSelectedColor] = useState<BagMeshColor>(BAG_COLORS[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"specs" | "story" | "policy">("specs");

  const { addToCart } = useCart();
  const { showToast } = useToast();

  // 1. Tải chi tiết sản phẩm và danh mục liên quan
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!productId) return;
      try {
        setIsLoading(true);
        if (typeof window !== "undefined") {
          setManufacturedItems(getManufacturedItems());
        }

        const [productData, catalog] = await Promise.all([
          getProductByIdFromFirestore(productId),
          getProductsFromFirestore(),
        ]);

        if (isMounted) {
          if (productData) {
            setRawProduct(productData);
          } else {
            // Tìm trong catalog nếu fetch đơn lẻ không tìm thấy
            const fallback = catalog.find((p) => p && String(p.id) === String(productId));
            setRawProduct(fallback || null);
          }
          setAllProducts(Array.isArray(catalog) ? catalog : []);
        }
      } catch (err) {
        console.warn("Failed to load product details:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  // 2. Chuẩn hóa dữ liệu theo kiểu sản phẩm
  const isBag = rawProduct?.category !== "combo" && rawProduct?.category !== "charm";
  const isCombo = rawProduct?.category === "combo";
  const isCharm = rawProduct?.category === "charm";

  // Đồng bộ màu mặc định khi sản phẩm tải xong
  useEffect(() => {
    if (rawProduct?.colors && Array.isArray(rawProduct.colors) && rawProduct.colors.length > 0) {
      setSelectedColor(rawProduct.colors[0]);
    } else {
      setSelectedColor(BAG_COLORS[0]);
    }
  }, [rawProduct]);

  // Tính tồn kho thực tế từ supply chain
  const stockCount = useMemo<number>(() => {
    if (!rawProduct) return 0;
    if (isCharm) {
      return Number(rawProduct.stockCount) >= 0 ? Number(rawProduct.stockCount) : 10;
    }
    if (manufacturedItems.length > 0) {
      const matched = manufacturedItems.filter(
        (item) =>
          item.status === "in_stock" &&
          !item.isClaimed &&
          (item.bagBaseId === String(rawProduct.id) ||
            (rawProduct.category && item.bagBaseId === rawProduct.category) ||
            (rawProduct.name && item.bagName?.trim().toLowerCase() === rawProduct.name.trim().toLowerCase()) ||
            (rawProduct.name && item.bagName && item.bagName.toLowerCase().includes(rawProduct.name.toLowerCase())))
      );
      if (matched.length > 0) return matched.length;
    }
    return Number(rawProduct.stockCount) >= 0 ? Number(rawProduct.stockCount) : 5;
  }, [rawProduct, manufacturedItems, isCharm]);

  const isAvailable = Boolean(rawProduct && rawProduct.inStock !== false && stockCount > 0);

  // 3. Xử lý thêm vào giỏ hàng
  const handleAddToCart = () => {
    if (!rawProduct || !isAvailable) {
      showToast("Sản phẩm tạm hết hàng", "Vui lòng chọn sản phẩm khác hoặc quay lại sau.", "error");
      return;
    }

    if (isBag) {
      addToCart({
        type: "base_bag",
        title: `${rawProduct.name || "Túi Lưới Tái Sinh"} (${selectedColor.name})`,
        price: rawProduct.basePrice || rawProduct.price || 1250000,
        quantity,
        image: selectedColor.image || rawProduct.imageUrl || rawProduct.image || "/assets/products/bags/tuixach-xanh-la.png",
        plasticOffsetKg: (rawProduct.plasticOffsetKg || 1.8) * quantity,
        bagBaseId: rawProduct.id,
        stockCount,
        details: {
          colorName: selectedColor.name,
        },
      });
      showToast(
        "Đã thêm vào giỏ hàng!",
        `${rawProduct.name} - Màu ${selectedColor.name} (Số lượng: ${quantity}) đã sẵn sàng trong giỏ của bạn.`,
        "success"
      );
    } else if (isCombo) {
      addToCart({
        type: "combo",
        title: rawProduct.name || "Bộ Combo NÉT",
        price: rawProduct.basePrice || rawProduct.price || 1450000,
        quantity,
        image: rawProduct.imageUrl || rawProduct.image || "/assets/products/combo-voyager.png",
        plasticOffsetKg: (rawProduct.plasticOffsetKg || 2.2) * quantity,
        bagBaseId: rawProduct.id,
        stockCount,
        details: {
          colorName: BAG_COLORS[0].name,
          charmsCount: Array.isArray(rawProduct.includedCharms) ? rawProduct.includedCharms.length : 0,
        },
      });
      showToast(
        "Đã thêm combo vào giỏ hàng!",
        `Bộ phối độc bản "${rawProduct.name}" đã được thêm thành công.`,
        "success"
      );
    } else if (isCharm) {
      addToCart({
        type: "charm_single",
        title: `${rawProduct.vietnameseName || rawProduct.name} (${rawProduct.name})`,
        price: rawProduct.basePrice || rawProduct.price || 180000,
        quantity,
        image: rawProduct.imageUrl || rawProduct.image || "",
        plasticOffsetKg: ((rawProduct.plasticOffsetGrams || 350) / 1000) * quantity,
        stockCount,
      });
      showToast(
        "Đã thêm charm vào giỏ hàng!",
        `Charm "${rawProduct.vietnameseName || rawProduct.name}" đã được thêm thành công.`,
        "info"
      );
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      showToast("Đã sao chép liên kết", "Bạn có thể chia sẻ sản phẩm này với bạn bè.", "info");
    }
  };

  // 4. Sản phẩm liên quan
  const relatedProducts = useMemo(() => {
    if (!rawProduct || !Array.isArray(allProducts)) return [];
    return allProducts
      .filter((p) => p && String(p.id) !== String(rawProduct.id) && p.isActive !== false)
      .slice(0, 4);
  }, [rawProduct, allProducts]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#B85D43]/20 border-t-[#B85D43] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#5E4D43] animate-pulse">
            Đang tải thông tin chi tiết sản phẩm NÉT...
          </p>
        </div>
      </div>
    );
  }

  // Not Found Screen
  if (!rawProduct) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#E8E2D8] shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#241B16]">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-sm text-[#7A6F68]">
            Sản phẩm bạn đang tìm kiếm có thể đã được gỡ bỏ hoặc không tồn tại trong danh mục NÉT.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B85D43] text-white text-xs font-bold hover:bg-[#A24E36] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bộ sưu tập</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const productName = rawProduct.name || "Túi Lưới NÉT Đà Nẵng";
  const productPrice = rawProduct.basePrice || rawProduct.price || 1250000;
  const originalPrice = rawProduct.originalPrice || (isCombo ? Math.round(productPrice * 1.15) : undefined);
  const plasticKg = Number(
    rawProduct.plasticOffsetKg ||
    (rawProduct.plasticOffsetGrams ? rawProduct.plasticOffsetGrams / 1000 : 1.8)
  );
  const dimensions = rawProduct.dimensions || "36cm x 32cm x 12cm";
  const capacity = rawProduct.capacity || "14 Lít";
  const maxCharms = rawProduct.maxCharms || 8;
  const availableColors: BagMeshColor[] =
    rawProduct.colors && Array.isArray(rawProduct.colors) && rawProduct.colors.length > 0
      ? rawProduct.colors
      : BAG_COLORS;

  const current2dImage = isBag
    ? selectedColor.image || rawProduct.imageUrl || rawProduct.image || "/assets/products/bags/tuixach-xanh-la.png"
    : rawProduct.imageUrl || rawProduct.image || (isCombo ? "/assets/products/combo-voyager.png" : "");

  const has3dModel = Boolean(rawProduct.model3dUrl && rawProduct.model3dUrl.trim() !== "");
  const current3dModelUrl =
    (isBag ? selectedColor.model3dUrl : null) ||
    rawProduct.model3dUrl ||
    "/assets/models/tuixach-xanh-la.glb";

  const bagBaseObject: BagBase = useMemo(() => ({
    id: rawProduct?.id || "custom-bag",
    name: productName,
    tagline: rawProduct?.tagline || "",
    description: rawProduct?.description || "",
    basePrice: productPrice,
    plasticOffsetKg: plasticKg,
    dimensions,
    capacity,
    colors: availableColors,
    anchorPoints: rawProduct?.anchorPoints || [
      { id: "a1", x: 26, y: 32, label: "Góc trên trái" },
      { id: "a2", x: 50, y: 28, label: "Tâm trên cao" },
      { id: "a3", x: 74, y: 32, label: "Góc trên phải" },
      { id: "a4", x: 50, y: 48, label: "Trung tâm túi" },
    ],
    maxCharms,
    modelType: (["tote", "bucket", "clutch", "crossbody", "hobo", "mini"].includes(rawProduct?.category)
      ? rawProduct?.category
      : "tote") as any,
    image: current2dImage,
    model3dUrl: current3dModelUrl,
    stockCount,
    inStock: isAvailable,
  }), [rawProduct, productName, productPrice, plasticKg, dimensions, capacity, availableColors, current2dImage, current3dModelUrl, stockCount, isAvailable, maxCharms]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241B16]">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#7A6F68] overflow-hidden whitespace-nowrap">
            <Link href="/" className="hover:text-[#B85D43] transition-colors">
              Trang Chủ
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[#B85D43] transition-colors">
              Bộ Sưu Tập
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#241B16] truncate max-w-[200px] sm:max-w-xs">
              {productName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E2D8] bg-white hover:bg-[#FAF7F2] text-[#5E4D43] font-medium transition-colors cursor-pointer"
              title="Sao chép liên kết sản phẩm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? "Đã chép" : "Chia sẻ"}</span>
            </button>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EFE9DF] text-[#5E4D43] font-semibold border border-[#E8E2D8] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT: Arch Showcase (Mẫu vòm cong atelier Studio)         */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 flex flex-col items-center">
            
            {/* The Signature Arch Vault Canvas */}
            <div className="w-full max-w-[440px] aspect-[4/5] bg-[#EFE9DF] rounded-t-[220px] rounded-b-[40px] p-6 shadow-sm relative border border-[#E8E2D8] overflow-hidden flex flex-col items-center justify-center mx-auto">
              
              {/* Badges in top corners */}
              <div className="absolute top-6 inset-x-6 z-20 flex items-center justify-between pointer-events-none">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-[#B85D43] border border-[#E8E2D8] shadow-xs">
                  {isCombo ? "Bộ Phối Độc Bản" : isCharm ? "Charm Biển Sâu" : "Phôi Túi Lưới NÉT"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
                  -{formatKg(plasticKg)} rác biển
                </span>
              </div>

              {/* Floating Pill Switcher Button at Bottom (Khớp 100% mẫu screenshot) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap">
                {viewMode === "3d" ? (
                  <button
                    type="button"
                    onClick={() => setViewMode("photo")}
                    className="px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-xs sm:text-sm font-semibold text-[#42342B] hover:text-[#B85D43] transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Trở về bản phối 2D</span>
                  </button>
                ) : has3dModel ? (
                  <button
                    type="button"
                    onClick={() => setViewMode("3d")}
                    className="px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-xs sm:text-sm font-semibold text-[#42342B] hover:text-[#B85D43] transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#B85D43]" />
                    <span>Xem mô hình 3D 360°</span>
                  </button>
                ) : null}
              </div>

              {/* Product Display inside the Arch */}
              {viewMode === "3d" && has3dModel ? (
                <div className="w-full h-full relative">
                  {isCharm ? (
                    <CharmCanvas3D
                      modelUrl={current3dModelUrl}
                      color={rawProduct.color || "#38bdf8"}
                      glowColor={rawProduct.glowColor || "rgba(56, 189, 248, 0.4)"}
                      isInteractive={true}
                    />
                  ) : (
                    <BagCanvas3D
                      bagBase={bagBaseObject}
                      selectedColor={selectedColor}
                      placedCharms={isCombo && Array.isArray(rawProduct.includedCharms) ? rawProduct.includedCharms : []}
                      modelUrl={current3dModelUrl}
                      isInteractive={true}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={current2dImage}
                    alt={productName}
                    className="max-w-full max-h-full object-contain filter drop-shadow-xl transition-transform duration-500 hover:scale-105"
                    loading="eager"
                  />
                </div>
              )}
            </div>

            {/* Dynamic Bag Colors Selector Bar (Đồng bộ với mẫu túi đang chọn - Khớp 100% screenshot) */}
            {isBag && availableColors.length > 0 && (
              <div className="mt-4 w-full max-w-[440px] bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E8E2D8] shadow-xs flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7A6F68] font-bold truncate">
                    {availableColors.length} MÀU CỦA {productName.toUpperCase()}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#1A130F] truncate">
                    {selectedColor.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {availableColors.map((c) => {
                    const isSelected =
                      selectedColor.id === c.id ||
                      selectedColor.hex?.toLowerCase() === c.hex?.toLowerCase();
                    return (
                      <button
                        key={c.id || c.hex}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all relative flex items-center justify-center cursor-pointer shadow-xs ${
                          isSelected
                            ? "ring-2 ring-[#B85D43] ring-offset-2 scale-110"
                            : "opacity-80 hover:opacity-100 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={`Màu ${c.name} (${c.hex})`}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Environmental & Craft Integrity Highlights */}
            <div className="mt-4 w-full max-w-[440px] grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-white border border-[#E8E2D8] flex flex-col items-center text-center gap-1 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-[10px] font-bold text-[#241B16] leading-tight">100% Cước Tái Sinh</span>
                <span className="text-[9px] text-[#7A6F68]">Biển Đà Nẵng</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E8E2D8] flex flex-col items-center text-center gap-1 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span className="text-[10px] font-bold text-[#241B16] leading-tight">Đan Tay Nghệ Nhân</span>
                <span className="text-[9px] text-[#7A6F68]">18-24 giờ thủ công</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E8E2D8] flex flex-col items-center text-center gap-1 shadow-2xs">
                <Compass className="w-4 h-4 text-sky-700" />
                <span className="text-[10px] font-bold text-[#241B16] leading-tight">Passport Định Danh</span>
                <span className="text-[9px] text-[#7A6F68]">Mã số mẻ lưới</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: Product Specs, Pricing, & Action CTAs              */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isAvailable
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {isAvailable ? `✓ Còn hàng (${stockCount} sản phẩm trong kho)` : "Tạm hết hàng"}
                </span>
                <span className="text-xs text-[#7A6F68]">Mã: NET-{rawProduct.id?.slice(0, 8)?.toUpperCase()}</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#241B16] leading-tight">
                {productName}
              </h1>

              <p className="text-xs sm:text-sm text-[#5E4D43] leading-relaxed">
                {rawProduct.tagline || rawProduct.description || "Thiết kế đan thủ công từ sợi cước lưới ma tái sinh biển Đà Nẵng, bền chắc và độc bản."}
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs flex items-baseline justify-between">
              <div>
                <span className="text-xs text-[#7A6F68] block mb-0.5">Giá niêm yết:</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-bold text-[#B85D43]">
                    {formatVND(productPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-sm text-[#7A6F68] line-through">
                      {formatVND(originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Thu gom {formatKg(plasticKg)} cước ma
                </span>
              </div>
            </div>

            {/* Included Charms (if Combo) */}
            {isCombo && Array.isArray(rawProduct.includedCharms) && rawProduct.includedCharms.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] space-y-2">
                <span className="text-xs font-bold text-[#241B16] block">
                  Charm đi kèm trong set combo ({rawProduct.includedCharms.length} món):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {rawProduct.includedCharms.map((c: any) => (
                    <div
                      key={c.id || c.name}
                      className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center gap-2"
                    >
                      <span className="text-base">{c.symbol || "✨"}</span>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-semibold text-[#241B16] truncate">
                          {c.vietnameseName || c.name}
                        </span>
                        <span className="text-[10px] text-[#7A6F68] truncate">
                          {c.material || "Thủy tinh tái sinh"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-[#241B16]">Số lượng:</span>
                <div className="flex items-center border border-[#E8E2D8] rounded-xl bg-white overflow-hidden shadow-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !isAvailable}
                    className="px-3 py-1.5 text-sm font-bold text-[#5E4D43] hover:bg-[#FAF7F2] disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-[#241B16] min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(stockCount, q + 1))}
                    disabled={quantity >= stockCount || !isAvailable}
                    className="px-3 py-1.5 text-sm font-bold text-[#5E4D43] hover:bg-[#FAF7F2] disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-[#7A6F68]">
                  (Tối đa {stockCount} sản phẩm sẵn sàng)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                  className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                    isAvailable
                      ? "bg-[#B85D43] hover:bg-[#A24E36] text-white hover:shadow-md"
                      : "bg-[#E8E2D8] text-[#7A6F68] cursor-not-allowed"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAvailable ? "Thêm Vào Giỏ Hàng" : "Sản Phẩm Tạm Hết Hàng"}</span>
                </button>

                {isBag && (
                  <Link
                    href={`/studio?bag=${rawProduct.id}&color=${selectedColor.id}`}
                    className="w-full py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-white hover:bg-[#FAF7F2] text-[#B85D43] border-2 border-[#B85D43] transition-all shadow-xs"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Tự Đính Charm Cho Túi Này Tại Nét Studio →</span>
                  </Link>
                )}

                <Link
                  href="/passport"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center text-[#7A6F68] hover:text-[#241B16] hover:bg-white/60 transition-colors"
                >
                  Tra cứu Passport số & hành trình mẻ lưới thu gom ↗
                </Link>
              </div>
            </div>

            {/* Technical Specifications & Guarantees Accordion Tabs */}
            <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-xs">
              <div className="flex border-b border-[#E8E2D8] bg-[#FAF7F2]/60">
                <button
                  onClick={() => setActiveTab("specs")}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === "specs"
                      ? "text-[#B85D43] border-b-2 border-[#B85D43] bg-white"
                      : "text-[#7A6F68] hover:text-[#241B16]"
                  }`}
                >
                  Thông Số
                </button>
                <button
                  onClick={() => setActiveTab("story")}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === "story"
                      ? "text-[#B85D43] border-b-2 border-[#B85D43] bg-white"
                      : "text-[#7A6F68] hover:text-[#241B16]"
                  }`}
                >
                  Chất Liệu & Thủ Công
                </button>
                <button
                  onClick={() => setActiveTab("policy")}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === "policy"
                      ? "text-[#B85D43] border-b-2 border-[#B85D43] bg-white"
                      : "text-[#7A6F68] hover:text-[#241B16]"
                  }`}
                >
                  Chính Sách NÉT
                </button>
              </div>

              <div className="p-4 text-xs leading-relaxed text-[#5E4D43]">
                {activeTab === "specs" && (
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                      <span className="text-[#7A6F68]">Kích thước tiêu chuẩn:</span>
                      <span className="font-semibold text-[#241B16]">{dimensions}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                      <span className="text-[#7A6F68]">Dung tích chứa:</span>
                      <span className="font-semibold text-[#241B16]">{capacity}</span>
                    </div>
                    {isBag && (
                      <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                        <span className="text-[#7A6F68]">Số điểm neo gắn Charm:</span>
                        <span className="font-semibold text-[#241B16]">{maxCharms} vị trí chịu lực</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                      <span className="text-[#7A6F68]">Tải trọng chịu lực:</span>
                      <span className="font-semibold text-[#241B16]">Tối đa 12kg</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#7A6F68]">Khối lượng rác biển giải cứu:</span>
                      <span className="font-semibold text-emerald-700">-{formatKg(plasticKg)}</span>
                    </div>
                  </div>
                )}

                {activeTab === "story" && (
                  <div className="space-y-2 text-[#5E4D43]">
                    <p>
                      Mỗi chiếc túi và charm tại NÉT bắt đầu từ những mẩu lưới ma cước biển trôi dạt ở rạn san hô Sơn Trà và vịnh Đà Nẵng.
                    </p>
                    <p>
                      Quy trình xử lý 4 bước: Thu gom bởi đội thợ lặn địa phương → Phân loại & giặt tiệt trùng sinh học không hóa chất độc hại → Tách sợi cước nguyên bản → Đan thủ công bởi nghệ nhân làng đan lưới truyền thống.
                    </p>
                  </div>
                )}

                {activeTab === "policy" && (
                  <div className="space-y-2 text-[#5E4D43]">
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-[#B85D43] shrink-0 mt-0.5" />
                      <span>Miễn phí vận chuyển toàn quốc cho đơn hàng từ 1.000.000 ₫.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 text-[#B85D43] shrink-0 mt-0.5" />
                      <span>Bảo hành kết cấu cước 24 tháng & hỗ trợ phục chế làm sạch trọn đời.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#B85D43] shrink-0 mt-0.5" />
                      <span>Cấp Passport định danh độc bản ghi nhận đóng góp bảo vệ môi trường biển.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* RELATED PRODUCTS SECTION                                  */}
        {/* ========================================================= */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#E8E2D8]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[11px] font-bold text-[#B85D43] uppercase tracking-wider block mb-1">
                  GỢI Ý TỪ XƯỞNG
                </span>
                <h3 className="font-serif text-2xl font-normal text-[#241B16]">
                  Các Thiết Kế Khác Trong Bộ Sưu Tập
                </h3>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold text-[#B85D43] hover:underline"
              >
                Xem tất cả ({allProducts.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((item) => {
                const itemImg = item.imageUrl || item.image || "/assets/products/bags/tuixach-xanh-la.png";
                const itemPrice = item.basePrice || item.price || 1250000;
                return (
                  <Link
                    key={item.id}
                    href={`/shop/${item.id}`}
                    className="group bg-white p-4 rounded-3xl border border-[#E8E2D8] shadow-xs hover:shadow-md hover:border-[#B85D43]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full aspect-square rounded-2xl bg-gradient-to-b from-[#F7F4EE] to-[#EFEAE1] border border-[#E8E2D8] mb-3 flex items-center justify-center p-3 overflow-hidden">
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <h4 className="font-serif text-sm font-bold text-[#241B16] group-hover:text-[#B85D43] transition-colors line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[#7A6F68] line-clamp-1 mt-0.5">
                        {item.tagline || item.description || "Thiết kế tái sinh độc bản"}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#FAF7F2] flex items-baseline justify-between">
                      <span className="text-xs sm:text-sm font-bold text-[#B85D43]">
                        {formatVND(itemPrice)}
                      </span>
                      <span className="text-[10px] text-[#7A6F68] group-hover:underline">
                        Chi tiết →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
