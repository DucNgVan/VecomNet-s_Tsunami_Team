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
  const isCharm =
    rawProduct?.category === "charm" ||
    rawProduct?.category === "charms" ||
    String(rawProduct?.id || "").startsWith("charm-");
  const isCombo =
    rawProduct?.category === "combo" ||
    String(rawProduct?.id || "").startsWith("combo-");
  const isBag = !isCharm && !isCombo;

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
        plasticOffsetKg: 0,
        stockCount,
      });
      showToast(
        "Đã thêm charm vào giỏ hàng!",
        `Charm "${rawProduct.vietnameseName || rawProduct.name}" đã được thêm thành công.`,
        "info"
      );
    }
  };

  // 4. Sản phẩm liên quan
  const relatedProducts = useMemo(() => {
    if (!rawProduct || !Array.isArray(allProducts)) return [];
    return allProducts
      .filter((p) => p && String(p.id) !== String(rawProduct.id) && p.isActive !== false)
      .slice(0, 4);
  }, [rawProduct, allProducts]);

  // Chuẩn bị dữ liệu hiển thị (Đảm bảo gọi Hook vô điều kiện theo chuẩn React Rules of Hooks)
  const productName = rawProduct?.name || "Túi Lưới NÉT Đà Nẵng";
  const productPrice = rawProduct?.basePrice || rawProduct?.price || 1250000;
  const originalPrice = rawProduct?.originalPrice || (isCombo ? Math.round(productPrice * 1.15) : undefined);
  const plasticKg = isCharm
    ? 0
    : Number(
        rawProduct?.plasticOffsetKg ||
        (rawProduct?.plasticOffsetGrams ? rawProduct.plasticOffsetGrams / 1000 : 1.8)
      );
  const dimensions = isCharm
    ? rawProduct?.dimensions || "4.5cm x 4.0cm x 0.4cm"
    : rawProduct?.dimensions || "36cm x 32cm x 12cm";
  const capacity = isCharm ? null : rawProduct?.capacity || "14 Lít";
  const maxCharms = rawProduct?.maxCharms || 8;
  const availableColors: BagMeshColor[] =
    rawProduct?.colors && Array.isArray(rawProduct.colors) && rawProduct.colors.length > 0
      ? rawProduct.colors
      : BAG_COLORS;

  const current2dImage = isBag
    ? selectedColor.image || rawProduct?.imageUrl || rawProduct?.image || "/assets/products/bags/tuixach-xanh-la.png"
    : rawProduct?.imageUrl || rawProduct?.image || (isCombo ? "/assets/products/combo-voyager.png" : "");

  const current3dModelUrl =
    (isBag ? selectedColor.model3dUrl : null) ||
    rawProduct?.model3dUrl ||
    (isBag ? "/assets/models/tuixach-xanh-la.glb" : "");
  const has3dModel = Boolean(
    (isBag ? selectedColor.model3dUrl : null) ||
    rawProduct?.model3dUrl
  );

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

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241B16]">
      {/* Main Product Showcase Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT: Arch Showcase (Mẫu vòm cong atelier Studio)         */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 flex flex-col items-center">
            
            {/* The Signature Arch Vault Canvas (Đồng bộ chuẩn 100% với khung vòm Nets Studio) */}
            <div className="w-full max-w-[440px] aspect-[4/5] bg-[#EFE9DF] rounded-t-[220px] rounded-b-[40px] shadow-sm relative border border-[#E8E2D8] overflow-hidden select-none mx-auto">
              
              {/* Top Arch Label - Khớp 100% mẫu Nets Studio */}
              <div className="pt-3 text-center z-20 pointer-events-none">
                <span className="text-[11px] sm:text-[12px] font-serif tracking-[0.25em] text-[#7A6F68] uppercase font-semibold">
                  NETS STUDIO
                </span>
              </div>

              {/* Floating Pill Switcher Button at Bottom (Chỉ hiển thị chữ 2D hoặc 3D) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap">
                {viewMode === "3d" ? (
                  <button
                    type="button"
                    onClick={() => setViewMode("photo")}
                    className="px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-xs sm:text-sm font-semibold text-[#42342B] hover:text-[#B85D43] transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#B85D43]" />
                    <span>2D</span>
                  </button>
                ) : has3dModel ? (
                  <button
                    type="button"
                    onClick={() => setViewMode("3d")}
                    className="px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-xs sm:text-sm font-semibold text-[#42342B] hover:text-[#B85D43] transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#B85D43]" />
                    <span>3D</span>
                  </button>
                ) : null}
              </div>

              {/* Product Display inside the Arch (Khớp chính xác vị trí và tỷ lệ treo túi như Studio) */}
              {viewMode === "3d" && has3dModel ? (
                <div className="absolute inset-0 z-10">
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
                <div className="absolute inset-0 z-10 flex items-center justify-center select-none pointer-events-none">
                  <img
                    src={current2dImage}
                    alt={productName}
                    className={`${
                      isCharm
                        ? "h-[50%] w-auto max-w-[65%]"
                        : "h-[70%] w-auto max-w-[85%]"
                    } object-contain filter drop-shadow-[0_12px_24px_rgba(36,27,22,0.14)] select-none pointer-events-none transition-all duration-300`}
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
              {isCharm ? (
                <>
                  <div className="p-3 rounded-2xl bg-white border border-[#E8E2D8] flex flex-col items-center text-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span className="text-[10px] font-bold text-[#241B16] leading-tight">Đúc Kim Loại</span>
                    <span className="text-[9px] text-[#7A6F68]">Mạ vàng 18K</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#E8E2D8] flex flex-col items-center text-center gap-1 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span className="text-[10px] font-bold text-[#241B16] leading-tight">Tráng Men Màu</span>
                    <span className="text-[9px] text-[#7A6F68]">Thủ công tinh xảo</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#E8E2D8] flex flex-col items-center text-center gap-1 shadow-2xs">
                    <Compass className="w-4 h-4 text-sky-700" />
                    <span className="text-[10px] font-bold text-[#241B16] leading-tight">Văn Hóa Đà Nẵng</span>
                    <span className="text-[9px] text-[#7A6F68]">Kỷ vật độc bản</span>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: Product Specs, Pricing, & Action CTAs              */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
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
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 text-xs text-[#7A6F68] hover:text-[#B85D43] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Bộ sưu tập</span>
                </Link>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#241B16] leading-tight">
                {productName}
              </h1>

              <p className="text-xs sm:text-sm text-[#5E4D43] leading-relaxed">
                {rawProduct.tagline ||
                  rawProduct.description ||
                  (isCharm
                    ? "Móc khoá Charm đúc kim loại nguyên khối mạ vàng tinh xảo, tráng men màu thủ công mang biểu tượng văn hóa đặc trưng Đà Nẵng."
                    : "Thiết kế đan thủ công từ sợi cước lưới ma tái sinh biển Đà Nẵng, bền chắc và độc bản.")}
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
                {isCharm ? (
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Hợp kim mạ vàng tráng men
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Thu gom {formatKg(plasticKg)} cước ma
                  </span>
                )}
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

                {isCharm ? (
                  <Link
                    href="/studio"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center text-[#7A6F68] hover:text-[#241B16] hover:bg-white/60 transition-colors"
                  >
                    Thử gắn Charm này lên túi tại Nét Studio ↗
                  </Link>
                ) : (
                  <Link
                    href="/passport"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center text-[#7A6F68] hover:text-[#241B16] hover:bg-white/60 transition-colors"
                  >
                    Tra cứu Passport số & hành trình mẻ lưới thu gom ↗
                  </Link>
                )}
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

                    {isCharm ? (
                      <>
                        <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                          <span className="text-[#7A6F68]">Chất liệu chế tác:</span>
                          <span className="font-semibold text-[#241B16]">
                            {rawProduct.material || "Hợp kim cao cấp mạ vàng & tráng men thủ công"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                          <span className="text-[#7A6F68]">Công nghệ gia công:</span>
                          <span className="font-semibold text-[#241B16]">Đúc khuôn kim loại & chạm dập 3D</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                          <span className="text-[#7A6F68]">Cơ cấu khóa gài:</span>
                          <span className="font-semibold text-[#241B16]">Khuyên móc kim loại chắc chắn (gài túi hoặc làm móc chìa khóa)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                          <span className="text-[#7A6F68]">Trọng lượng:</span>
                          <span className="font-semibold text-[#241B16]">~35 gram</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#7A6F68]">Phân loại sản phẩm:</span>
                          <span className="font-semibold text-amber-800">Phụ kiện lưu niệm văn hóa Đà Nẵng</span>
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                )}

                {activeTab === "story" && (
                  <div className="space-y-2 text-[#5E4D43]">
                    {isCharm ? (
                      <>
                        <p>
                          Mỗi chiếc charm NÉT được chế tác từ phôi hợp kim đúc nguyên khối chống gỉ, bề mặt mạ vàng tinh xảo và tráng men màu thủ công từng chi tiết.
                        </p>
                        <p>
                          Lấy cảm hứng từ những biểu tượng văn hóa và sinh thái tiêu biểu của Đà Nẵng (Cầu Rồng, Voọc Chà Vá Chân Nâu, Chùa Linh Ứng, Cá Ngư Ông...), charm mang ý nghĩa may mắn, bình an cho chủ nhân và là kỷ vật du lịch độc bản.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          Mỗi chiếc túi tại NÉT bắt đầu từ những mẩu lưới ma cước biển trôi dạt ở rạn san hô Sơn Trà và vịnh Đà Nẵng.
                        </p>
                        <p>
                          Quy trình xử lý 4 bước: Thu gom bởi đội thợ lặn địa phương → Phân loại & giặt tiệt trùng sinh học không hóa chất độc hại → Tách sợi cước nguyên bản → Đan thủ công bởi nghệ nhân làng đan lưới truyền thống.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "policy" && (
                  <div className="space-y-2 text-[#5E4D43]">
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-[#B85D43] shrink-0 mt-0.5" />
                      <span>{isCharm ? "Miễn phí vận chuyển toàn quốc cho đơn từ 500.000 ₫ (hoặc mua kèm túi NÉT)." : "Miễn phí vận chuyển toàn quốc cho đơn hàng từ 1.000.000 ₫."}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 text-[#B85D43] shrink-0 mt-0.5" />
                      <span>{isCharm ? "Bảo hành màu men & khuyên móc kim loại 12 tháng." : "Bảo hành kết cấu cước 24 tháng & hỗ trợ phục chế làm sạch trọn đời."}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#B85D43] shrink-0 mt-0.5" />
                      <span>{isCharm ? "Đóng gói trong hộp quà kỷ vật NÉT Signature sang trọng." : "Cấp Passport định danh độc bản ghi nhận đóng góp bảo vệ môi trường biển."}</span>
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
