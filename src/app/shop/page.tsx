"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BAG_COLORS } from "@/data/products";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatVND, formatKg } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastNotification";
import { ShoppingBag, Sparkles, RotateCw, PlusCircle, AlertCircle } from "lucide-react";
import { BagBase, Charm, ProductCombo } from "@/types";
import { CharmCanvas3D } from "@/components/3d/CharmCanvas3D";
import { BagCard3D } from "@/components/3d/BagCard3D";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { OceanFloatingCard } from "@/components/ocean/OceanFloatingCard";
import {
  ProductDetailModal,
  ProductDetailItem,
} from "@/components/shop/ProductDetailModal";
import { getProductsFromFirestore } from "@/lib/firestoreService";
import { getManufacturedItems } from "@/lib/supplyChainStorage";
import { ManufacturedBagItem } from "@/types";

export default function ShopPage() {
  const [filterCategory, setFilterCategory] = useState<"all" | "combos" | "bags" | "charms">(
    "all"
  );
  const [selectedDetailItem, setSelectedDetailItem] = useState<ProductDetailItem | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [manufacturedItems, setManufacturedItems] = useState<ManufacturedBagItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadCatalog() {
      try {
        setIsLoading(true);
        if (typeof window !== "undefined") {
          setManufacturedItems(getManufacturedItems());
        }
        const productList = await getProductsFromFirestore();
        if (Array.isArray(productList)) {
          setProducts(productList.filter((p: any) => p && p.isActive !== false));
        } else {
          setProducts([]);
        }
      } catch (e) {
        console.warn("Failed to load live product catalog:", e);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // 1. Dẫn xuất các sản phẩm Phôi Túi (Bags) từ database
  const bagItems = useMemo<BagBase[]>(() => {
    return products
      .filter((p) => p.category !== "combo" && p.category !== "charm")
      .map((p) => {
        const mfgStock = manufacturedItems.length > 0
          ? manufacturedItems.filter(
              (item) =>
                item.status === "in_stock" &&
                !item.isClaimed &&
                (item.bagBaseId === String(p.id) ||
                  (p.category && item.bagBaseId === p.category) ||
                  (p.name && item.bagName?.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
                  (p.name && item.bagName && item.bagName.toLowerCase().includes(p.name.toLowerCase())) ||
                  (p.name && item.bagName && p.name.toLowerCase().includes(item.bagName.toLowerCase())))
            ).length
          : (Number(p.stockCount) >= 0 ? Number(p.stockCount) : 0);
        const inStock = Boolean(mfgStock > 0 && p.inStock !== false);

        return {
          id: p.id,
          name: p.name || "Túi Lưới Tái Sinh",
          tagline:
            p.tagline ||
            (p.description ? p.description.slice(0, 80) : "Thiết kế đan thủ công từ lưới ma tái sinh"),
          description:
            p.description || "Thiết kế đan thủ công từ sợi cước lưới ma tái sinh độc bản NÉT.",
          basePrice: p.basePrice || p.price || 1250000,
          plasticOffsetKg: p.plasticOffsetKg || 1.8,
          dimensions: p.dimensions || "36cm x 32cm x 12cm",
          capacity: p.capacity || "14 Lít",
          colors: p.colors || BAG_COLORS,
          anchorPoints: p.anchorPoints || [
            { id: "a1", x: 26, y: 32, label: "Góc trên trái" },
            { id: "a2", x: 50, y: 28, label: "Tâm trên cao" },
            { id: "a3", x: 74, y: 32, label: "Góc trên phải" },
            { id: "a4", x: 50, y: 48, label: "Trung tâm túi" },
          ],
          maxCharms: p.maxCharms || 8,
          modelType: (["tote", "bucket", "clutch", "crossbody", "hobo", "mini"].includes(p.category)
            ? p.category
            : "tote") as any,
          image: p.imageUrl || p.image || "/assets/products/tote-blue.png",
          model3dUrl: p.model3dUrl && p.model3dUrl.trim() !== "" ? p.model3dUrl : undefined,
          stockCount: mfgStock,
          inStock,
        };
      });
  }, [products, manufacturedItems]);

  // 2. Dẫn xuất các set phối Combo từ database
  const comboItems = useMemo<ProductCombo[]>(() => {
    return products
      .filter((p) => p.category === "combo")
      .map((p) => {
        const mfgStock = manufacturedItems.length > 0
          ? manufacturedItems.filter(
              (item) =>
                item.status === "in_stock" &&
                !item.isClaimed &&
                (item.bagBaseId === String(p.id) ||
                  (p.name && item.bagName?.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
                  (p.name && item.bagName && item.bagName.toLowerCase().includes(p.name.toLowerCase())))
            ).length
          : (Number(p.stockCount) >= 0 ? Number(p.stockCount) : 0);
        const inStock = Boolean(mfgStock > 0 && p.inStock !== false);

        return {
          id: p.id,
          name: p.name || "Bộ Combo Độc Bản NÉT",
          tagline:
            p.tagline ||
            (p.description ? p.description.slice(0, 80) : "Bộ phối độc bản túi và charm phong thủy"),
          description:
            p.description || "Set túi lưới tái sinh kết hợp charm thủy tinh phong thủy độc bản.",
          price: p.basePrice || p.price || 1450000,
          originalPrice:
            p.originalPrice || Math.round((p.basePrice || p.price || 1450000) * 1.15),
          plasticOffsetKg: p.plasticOffsetKg || 2.2,
          badge: p.badge || "Bộ Phối Độc Bản",
          image: p.imageUrl || p.image || "/assets/products/tote-blue.png",
          bagBase: {
            id: p.id,
            name: p.name || "Túi Lưới Combo",
            tagline: p.description || "",
            description: p.description || "",
            basePrice: p.basePrice || p.price || 1250000,
            plasticOffsetKg: p.plasticOffsetKg || 1.8,
            dimensions: "36cm x 32cm x 12cm",
            capacity: "14 Lít",
            colors: BAG_COLORS,
            anchorPoints: [],
            maxCharms: 6,
            modelType: "tote",
            image: p.imageUrl || p.image || "/assets/products/tote-blue.png",
            model3dUrl: p.model3dUrl && p.model3dUrl.trim() !== "" ? p.model3dUrl : undefined,
          },
          color: BAG_COLORS[0],
          includedCharms: Array.isArray(p.includedCharms) ? p.includedCharms : [],
          stockCount: mfgStock,
          inStock,
        };
      });
  }, [products, manufacturedItems]);

  // 3. Dẫn xuất các phụ kiện Charm từ database
  const charmItems = useMemo<Charm[]>(() => {
    return products
      .filter((p) => p.category === "charm")
      .map((p) => {
        const charmStock = Number(p.stockCount) >= 0 ? Number(p.stockCount) : 10;
        const inStock = Boolean(p.inStock !== false && charmStock > 0);
        return {
          id: p.id,
          name: p.name || "Charm Biển Sâu",
          vietnameseName: p.vietnameseName || p.name || "Charm Thủy Tinh Biển",
          category: p.charmCategory || "marine",
          price: p.basePrice || p.price || 180000,
          plasticOffsetGrams:
            p.plasticOffsetGrams ||
            (p.plasticOffsetKg ? Math.round(p.plasticOffsetKg * 1000) : 350),
          material: p.material || "Thủy tinh biển & cước lưới tái sinh",
          description: p.description || "Phụ kiện charm độc bản đúc thủ công.",
          color: p.color || "#38bdf8",
          glowColor: p.glowColor || "rgba(56, 189, 248, 0.4)",
          symbol: p.symbol || "✨",
          iconName: p.iconName || "Sparkles",
          model3dUrl: p.model3dUrl && p.model3dUrl.trim() !== "" ? p.model3dUrl : undefined,
          image: p.imageUrl || p.image || "",
          inStock,
          stockCount: charmStock,
        };
      });
  }, [products]);

  const handleModalAddToCart = (item: ProductDetailItem) => {
    if (item.type === "bag") handleAddBag(item.data);
    else if (item.type === "combo") handleAddCombo(item.data);
    else if (item.type === "charm") handleAddCharm(item.data);
  };

  const handleAddBag = (bag: BagBase) => {
    if (!bag.inStock || (bag.stockCount ?? 0) <= 0) {
      showToast(
        "Sản phẩm tạm hết hàng!",
        `Mẫu túi "${bag.name}" hiện đang chờ xưởng đan lô mới. Vui lòng quay lại sau!`,
        "error"
      );
      return;
    }

    addToCart({
      type: "base_bag",
      title: `${bag.name} (Phôi tiêu chuẩn)`,
      price: bag.basePrice,
      quantity: 1,
      image: bag.image,
      plasticOffsetKg: bag.plasticOffsetKg,
      bagBaseId: bag.id,
      stockCount: bag.stockCount,
      details: {
        colorName: BAG_COLORS[0].name,
      },
    });

    showToast(
      "Đã thêm phôi túi vào giỏ!",
      `${bag.name} đã sẵn sàng (Kho còn: ${bag.stockCount} chiếc). Bạn cũng có thể mở NÉT Studio để đính charm theo ý muốn.`,
      "success"
    );
  };

  const handleAddCharm = (charm: Charm) => {
    if (charm.inStock === false || (charm.stockCount !== undefined && charm.stockCount <= 0)) {
      showToast(
        "Charm tạm hết hàng!",
        `Phụ kiện charm "${charm.vietnameseName}" hiện đã hết hàng trong kho.`,
        "error"
      );
      return;
    }

    addToCart({
      type: "charm_single",
      title: `${charm.vietnameseName} (${charm.name})`,
      price: charm.price,
      quantity: 1,
      image: charm.image || "",
      plasticOffsetKg: charm.plasticOffsetGrams / 1000,
      stockCount: charm.stockCount,
    });

    showToast(
      "Đã thêm charm vào giỏ!",
      `Charm "${charm.vietnameseName}" mang năng lượng hộ mệnh đã được thêm.`,
      "info"
    );
  };

  const handleAddCombo = (combo: ProductCombo) => {
    if (!combo.inStock || (combo.stockCount ?? 0) <= 0) {
      showToast(
        "Bộ Combo tạm hết hàng!",
        `Bộ phối độc bản "${combo.name}" hiện tạm hết hàng trong kho xưởng. Vui lòng quay lại sau!`,
        "error"
      );
      return;
    }

    addToCart({
      type: "combo",
      title: combo.name,
      price: combo.price,
      quantity: 1,
      image: combo.image,
      plasticOffsetKg: combo.plasticOffsetKg,
      bagBaseId: combo.bagBase?.id || combo.id,
      stockCount: combo.stockCount,
      details: {
        colorName: combo.color.name,
        charmsCount: combo.includedCharms.length,
        charmsList: combo.includedCharms.map((c) => c.vietnameseName),
      },
    });

    showToast(
      "Đã thêm combo vào giỏ!",
      `Set phối độc bản "${combo.name}" đã được đưa vào giỏ của bạn.`,
      "success"
    );
  };

  const filterTabs = [
    { id: "all", label: "Tất Cả Sản Phẩm", count: products.length },
    { id: "combos", label: "Bộ Sưu Tập Combo", count: comboItems.length },
    { id: "bags", label: "Phôi Túi Lưới (Bases)", count: bagItems.length },
    { id: "charms", label: "Charm Thủy Tinh (Charms)", count: charmItems.length },
  ];

  return (
    <div className="relative min-h-screen bg-[#FAF7F2] text-[#2D231E]">
      <div className="pt-10 sm:pt-14 pb-24 sm:pb-20 px-3 sm:px-8 max-w-7xl mx-auto space-y-8 sm:space-y-10 relative z-10">
        {/* Shop Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto space-y-3 px-4 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFE9DF] text-[#7A6F68] text-xs font-bold uppercase tracking-[0.2em] border border-[#E8E2D8] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#B85D43]" />
            <span>BỘ SƯU TẬP NÉT</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#241B16] tracking-tight leading-tight max-w-2xl mx-auto">
            Bộ Sưu Tập Túi Lưới & Charm Đà Nẵng
          </h1>
          <p className="text-sm sm:text-base text-[#5E4D43] leading-relaxed max-w-2xl mx-auto">
            Khám phá những thiết kế được hoàn thiện thủ công từ lưới ma tái sinh hoặc đưa vào Nét Studio để gắn charm độc bản theo ký ức của riêng bạn.
          </p>

          <div className="pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-semibold shadow-xs"
            >
              <span>Tự thiết kế túi theo ý bạn tại Nét Studio →</span>
            </Link>
          </div>
        </motion.div>

        {/* Filter Tabs Bar */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = filterCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id as any)}
                className={`relative px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "text-white bg-[#B85D43] shadow-xs scale-105"
                    : "bg-white hover:bg-[#FAF7F2] text-[#5E4D43] border border-[#E8E2D8] shadow-xs"
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isActive && <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />}
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                      isActive ? "bg-sky-400/20 text-sky-200" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600 animate-pulse">
              Đang tải danh mục sản phẩm từ Cloud Firestore...
            </p>
          </div>
        ) : products.length === 0 ? (
          /* EMPTY DATABASE STATE */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-16 px-6 text-center max-w-lg mx-auto bg-white/90 backdrop-blur-md rounded-3xl border border-sky-100 shadow-[0_20px_50px_rgba(11,30,59,0.08)] space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-inner border border-sky-100">
              <ShoppingBag className="w-8 h-8 text-sky-600" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#0b1e3b]">
              Bộ Sưu Tập Đang Được Cập Nhật
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Toàn bộ dữ liệu mẫu tĩnh đã được dọn sạch. Hệ thống hiện hoạt động theo chế độ 100% Real Database. Bạn có thể đăng sản phẩm mới (Túi, Combo, Charm) trực tiếp từ trang Quản Trị để tự động hiển thị tại đây.
            </p>
            <div className="pt-2">
              <Link
                href="/admin?tab=catalog"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0b1e3b] text-white text-xs font-bold hover:bg-sky-900 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-cyan-300" />
                <span>Đến Trang Quản Trị Đăng Sản Phẩm</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {/* Section 1: Combos (if 'all' or 'combos') */}
            {(filterCategory === "all" || filterCategory === "combos") && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b1e3b] flex items-center gap-2">
                    <span>Bộ Sưu Tập Phối Sẵn (Combos)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold font-sans">
                      {comboItems.length} mẫu
                    </span>
                  </h2>
                </div>

                {comboItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-500 text-sm">
                    Chưa có bộ combo nào trong cơ sở dữ liệu. Quản trị viên có thể tạo combo mới trong mục Quản trị.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {comboItems.map((combo, idx) => {
                      const isComboAvailable = Boolean(combo.inStock && (combo.stockCount ?? 0) > 0);

                      return (
                        <OceanFloatingCard
                          key={combo.id}
                          delay={idx * 0.25}
                          duration={5 + (idx % 3)}
                          distance={5}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="h-full p-6 rounded-3xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-[0_4px_20px_rgba(11,30,59,0.05)] hover:shadow-[0_20px_40px_rgba(11,30,59,0.12)] hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group"
                          >
                            <div
                              onClick={() => setSelectedDetailItem({ type: "combo", data: combo })}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between mb-4">
                                {combo.badge && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                    {combo.badge}
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      isComboAvailable
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}
                                  >
                                    {isComboAvailable ? `Còn ${combo.stockCount}` : "Hết hàng"}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    -{formatKg(combo.plasticOffsetKg)} rác biển
                                  </span>
                                </div>
                              </div>

                              <div className="w-full aspect-[4/3] rounded-2xl mb-4 bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center border border-slate-200/70 overflow-hidden relative group-hover:border-sky-300 transition-colors">
                                {combo.bagBase?.model3dUrl ? (
                                  <BagCard3D
                                    modelUrl={combo.bagBase.model3dUrl}
                                    color={combo.color?.hex || "#0c2340"}
                                    glowColor={combo.color?.glowHex || "#38bdf8"}
                                    isInteractive={false}
                                  />
                                ) : (
                                  <img
                                    src={combo.image || "/assets/products/tote-blue.png"}
                                    alt={combo.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                                {combo.includedCharms && combo.includedCharms.length > 0 && (
                                  <div className="absolute bottom-2 inset-x-3 flex items-center justify-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/90 shadow-sm text-xs pointer-events-none">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">
                                      Kèm {combo.includedCharms.length} charm:
                                    </span>
                                    {combo.includedCharms.map((c) => (
                                      <span key={c.id} className="text-sm" title={c.vietnameseName}>
                                        {c.symbol}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <h3 className="font-serif text-lg font-bold text-[#0b1e3b] group-hover:text-sky-700 transition-colors">
                                {combo.name}
                              </h3>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{combo.tagline}</p>
                              <div className="text-[11px] text-sky-700 font-bold mt-1.5 hover:underline">
                                Xem chi tiết & xoay 3D ↗
                              </div>
                            </div>

                            <div className="mt-5 pt-3.5 border-t border-slate-100">
                              <div className="flex items-baseline justify-between mb-3">
                                <span className="text-lg font-bold text-[#0b1e3b]">
                                  {formatVND(combo.price)}
                                </span>
                                <span className="text-xs text-slate-400 line-through">
                                  {formatVND(combo.originalPrice)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <GlassButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setSelectedDetailItem({ type: "combo", data: combo })}
                                  className="w-full text-xs cursor-pointer"
                                  icon={<RotateCw className="w-3.5 h-3.5 text-sky-700" />}
                                >
                                  Chi Tiết
                                </GlassButton>
                                <GlassButton
                                  variant={isComboAvailable ? "primary" : "secondary"}
                                  size="sm"
                                  disabled={!isComboAvailable}
                                  onClick={() => handleAddCombo(combo)}
                                  className={`w-full text-xs shadow-sm cursor-pointer ${
                                    !isComboAvailable ? "opacity-60 cursor-not-allowed" : ""
                                  }`}
                                  icon={<ShoppingBag className="w-3.5 h-3.5" />}
                                >
                                  {isComboAvailable ? "Thêm Giỏ" : "Hết Hàng"}
                                </GlassButton>
                              </div>
                            </div>
                          </motion.div>
                        </OceanFloatingCard>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Section 2: Bag Bases (if 'all' or 'bags') */}
            {(filterCategory === "all" || filterCategory === "bags") && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 pt-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b1e3b] flex items-center gap-2">
                    <span>Phôi Túi Lưới (Bag Bases)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold font-sans">
                      {bagItems.length} mẫu dáng
                    </span>
                  </h2>
                </div>

                {bagItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-500 text-sm">
                    Chưa có phôi túi nào trong cơ sở dữ liệu. Quản trị viên có thể thêm sản phẩm túi từ trang Admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {bagItems.map((bag, idx) => {
                      const isAvailable = bag.inStock && (bag.stockCount ?? 0) > 0;

                      return (
                        <OceanFloatingCard
                          key={bag.id}
                          delay={idx * 0.18}
                          duration={6 + (idx % 2)}
                          distance={4}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.08 }}
                            className="h-full p-5 rounded-3xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] hover:shadow-[0_16px_32px_rgba(11,30,59,0.1)] hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group"
                          >
                            <div
                              onClick={() => setSelectedDetailItem({ type: "bag", data: bag })}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                  {bag.modelType?.toUpperCase()}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      isAvailable
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}
                                  >
                                    {isAvailable ? `Còn ${bag.stockCount}` : "Hết hàng"}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    -{formatKg(bag.plasticOffsetKg)}
                                  </span>
                                </div>
                              </div>

                              <div className="w-full aspect-square rounded-2xl mb-4 bg-slate-50 border border-slate-200/70 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-sky-300 transition-colors">
                                {bag.model3dUrl ? (
                                  <BagCard3D
                                    modelUrl={bag.model3dUrl}
                                    color={bag.colors?.[0]?.hex || "#0c2340"}
                                    glowColor={bag.colors?.[0]?.glowHex || "#38bdf8"}
                                    isInteractive={false}
                                  />
                                ) : (
                                  <img
                                    src={bag.image || "/assets/products/tote-blue.png"}
                                    alt={bag.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                                <div className="absolute bottom-2 inset-x-3 flex items-center justify-between bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs pointer-events-none">
                                  <span className="text-[10px] text-slate-600 font-bold">
                                    {bag.dimensions}
                                  </span>
                                  <span className="text-[10px] text-sky-700 font-bold">
                                    {bag.capacity}
                                  </span>
                                </div>
                              </div>

                              <h3 className="font-serif text-base font-bold text-[#0b1e3b] group-hover:text-sky-700 transition-colors">
                                {bag.name}
                              </h3>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-medium">
                                {bag.tagline}
                              </p>
                              <div className="text-[11px] text-sky-700 font-bold mt-1 hover:underline">
                                Xem chi tiết thông số ↗
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100">
                              <div className="flex items-baseline justify-between mb-3">
                                <span className="text-base font-bold text-[#0b1e3b]">
                                  {formatVND(bag.basePrice)}
                                </span>
                                <span className="text-[11px] text-slate-600 font-semibold">
                                  {bag.maxCharms} mắt neo
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <GlassButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setSelectedDetailItem({ type: "bag", data: bag })}
                                  className="w-full text-xs cursor-pointer"
                                  icon={<RotateCw className="w-3.5 h-3.5 text-sky-700" />}
                                >
                                  Chi Tiết
                                </GlassButton>
                                <GlassButton
                                  variant={isAvailable ? "primary" : "secondary"}
                                  size="sm"
                                  disabled={!isAvailable}
                                  onClick={() => handleAddBag(bag)}
                                  className={`w-full text-xs shadow-sm cursor-pointer ${
                                    !isAvailable ? "opacity-60 cursor-not-allowed" : ""
                                  }`}
                                  icon={<ShoppingBag className="w-3.5 h-3.5" />}
                                >
                                  {isAvailable ? "Mua Phôi" : "Hết Hàng"}
                                </GlassButton>
                              </div>
                            </div>
                          </motion.div>
                        </OceanFloatingCard>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Section 3: Individual Charms (if 'all' or 'charms') */}
            {(filterCategory === "all" || filterCategory === "charms") && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 pt-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b1e3b] flex items-center gap-2">
                    <span>Charm Đơn Biển Sâu (Charms)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold font-sans">
                      {charmItems.length} phụ kiện
                    </span>
                  </h2>
                </div>

                {charmItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-500 text-sm">
                    Chưa có charm phụ kiện nào trong cơ sở dữ liệu. Quản trị viên có thể tạo charm mới từ trang Admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                    {charmItems.map((charm, idx) => {
                      const isCharmAvailable = Boolean(charm.inStock !== false && (charm.stockCount ?? 1) > 0);

                      return (
                        <OceanFloatingCard
                          key={charm.id}
                          delay={idx * 0.12}
                          duration={4.5 + (idx % 3)}
                          distance={3}
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                            className="h-full p-4 rounded-3xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-[0_2px_12px_rgba(11,30,59,0.03)] hover:shadow-[0_12px_24px_rgba(11,30,59,0.08)] hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group"
                          >
                            <div
                              onClick={() => setSelectedDetailItem({ type: "charm", data: charm })}
                              className="cursor-pointer"
                            >
                              <div className="w-full aspect-square rounded-2xl mb-3 border border-slate-200 shadow-sm relative overflow-hidden bg-slate-50 flex items-center justify-center group-hover:border-sky-300 transition-colors">
                                {charm.model3dUrl ? (
                                  <CharmCanvas3D
                                    modelUrl={charm.model3dUrl}
                                    color={charm.color}
                                    glowColor={charm.glowColor}
                                    isInteractive={false}
                                  />
                                ) : charm.image ? (
                                  <img
                                    src={charm.image}
                                    alt={charm.name}
                                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <span className="text-4xl">{charm.symbol || "✨"}</span>
                                )}
                                {charm.model3dUrl && (
                                  <div className="absolute top-2 left-2 pointer-events-none">
                                    <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-[9px] font-bold text-sky-800 shadow-xs flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                                      <span>3D {charm.symbol}</span>
                                    </span>
                                  </div>
                                )}
                                {!isCharmAvailable && (
                                  <div className="absolute top-2 right-2 pointer-events-none">
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[9px] font-bold text-rose-700 shadow-xs">
                                      Hết hàng
                                    </span>
                                  </div>
                                )}
                              </div>

                              <h4 className="font-serif text-sm font-bold text-[#0b1e3b] group-hover:text-sky-700 transition-colors line-clamp-1">
                                {charm.vietnameseName}
                              </h4>
                              <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5 font-medium">
                                {charm.material}
                              </p>
                              <div className="text-[10px] text-sky-700 font-bold mt-1 hover:underline">
                                Xem chi tiết ↗
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-bold text-[#0b1e3b]">
                                {formatVND(charm.price)}
                              </span>
                              <motion.button
                                whileTap={isCharmAvailable ? { scale: 0.9 } : undefined}
                                disabled={!isCharmAvailable}
                                onClick={() => handleAddCharm(charm)}
                                className={`p-2 rounded-xl transition-colors shadow-sm ${
                                  isCharmAvailable
                                    ? "bg-slate-100 hover:bg-[#0b1e3b] hover:text-white text-slate-800 cursor-pointer"
                                    : "bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed"
                                }`}
                                title={isCharmAvailable ? "Thêm charm vào giỏ" : "Hết hàng"}
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </motion.div>
                        </OceanFloatingCard>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Exquisite Product Detail & 3D Interactive Modal */}
      <ProductDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onAddToCart={handleModalAddToCart}
        isAvailable={
          selectedDetailItem?.type === "bag"
            ? selectedDetailItem.data.inStock !== false &&
              (selectedDetailItem.data.stockCount ?? 0) > 0
            : selectedDetailItem?.type === "combo"
            ? selectedDetailItem.data.inStock !== false &&
              (selectedDetailItem.data.stockCount ?? 0) > 0
            : selectedDetailItem?.type === "charm"
            ? selectedDetailItem.data.inStock !== false &&
              ((selectedDetailItem.data.stockCount ?? 1) > 0)
            : true
        }
        stockCount={
          selectedDetailItem?.type === "bag"
            ? selectedDetailItem.data.stockCount
            : selectedDetailItem?.type === "combo"
            ? selectedDetailItem.data.stockCount
            : selectedDetailItem?.type === "charm"
            ? selectedDetailItem.data.stockCount
            : undefined
        }
      />
    </div>
  );
}
