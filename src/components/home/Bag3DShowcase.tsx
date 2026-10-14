"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BAG_COLORS } from "@/data/products";
import { BagBase, BagMeshColor } from "@/types";
import { BagCanvas3D } from "@/components/3d/BagCanvas3D";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatVND, formatKg } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastNotification";
import { getProductsFromFirestore } from "@/lib/firestoreService";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  RotateCw,
  Check,
  Maximize2,
} from "lucide-react";

export const Bag3DShowcase: React.FC = () => {
  const [allBags, setAllBags] = useState<BagBase[]>([]);
  const [selectedBag, setSelectedBag] = useState<BagBase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedColor, setSelectedColor] = useState<BagMeshColor>(BAG_COLORS[0]);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadBags() {
      try {
        setIsLoading(true);
        const dbProducts = await getProductsFromFirestore();
        if (dbProducts && dbProducts.length > 0) {
          const liveBags: BagBase[] = dbProducts
            .filter((p: any) => p && p.isActive !== false && p.category !== "charm" && p.category !== "combo")
            .map((p: any) => ({
              id: p.id,
              name: p.name || "Túi Lưới Tái Sinh",
              vietnameseName: p.vietnameseName || p.name || "Túi Lưới Tái Sinh",
              tagline: p.tagline || p.description || "Dệt thủ công từ lưới rác đại dương.",
              description: p.description || "Dệt thủ công từ lưới rác đại dương.",
              basePrice: p.basePrice || p.price || 420000,
              plasticOffsetKg:
                p.plasticOffsetKg ?? (p.plasticOffsetGrams ? p.plasticOffsetGrams / 1000 : 1.2),
              colors: p.colors || BAG_COLORS,
              meshPattern: "diagonal",
              anchorPoints: [
                { id: "a1", x: 26, y: 32, label: "Góc trên trái" },
                { id: "a2", x: 50, y: 28, label: "Tâm trên cao" },
                { id: "a3", x: 74, y: 32, label: "Góc trên phải" },
                { id: "a4", x: 50, y: 48, label: "Trung tâm túi" },
              ],
              maxCharms: p.maxCharms || 4,
              dimensions: p.dimensions || { width: 34, height: 38, depth: 10 },
              capacity: p.capacity || "12L",
              modelType: (["tote", "bucket", "clutch", "crossbody", "hobo", "mini"].includes(p.category)
                ? p.category
                : "tote") as any,
              image: p.imageUrl || p.image || "/assets/products/tote-blue.png",
              model3dUrl:
                p.model3dUrl && p.model3dUrl.trim() !== "" ? p.model3dUrl : "/assets/models/tuixach.glb",
              stockCount: Number(p.stockCount) || 0,
              inStock: Boolean(p.inStock && Number(p.stockCount) > 0),
            }));
          if (liveBags.length > 0) {
            setAllBags(liveBags);
            setSelectedBag(liveBags[0]);
          } else {
            setAllBags([]);
            setSelectedBag(null);
          }
        } else {
          setAllBags([]);
          setSelectedBag(null);
        }
      } catch (e) {
        console.warn("Bag showcase load error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadBags();
  }, []);

  const handleAddToCart = () => {
    if (!selectedBag) return;
    addToCart({
      type: "base_bag",
      title: `${selectedBag.name} (${selectedColor.name})`,
      price: selectedBag.basePrice,
      quantity: 1,
      image: selectedBag.image,
      plasticOffsetKg: selectedBag.plasticOffsetKg,
      details: {
        colorName: selectedColor.name,
      },
    });

    showToast(
      "Đã thêm vào giỏ hàng!",
      `${selectedBag.name} màu ${selectedColor.name} đã sẵn sàng trong giỏ của bạn.`,
      "success"
    );
  };

  return (
    <section id="story-bags3d" className="pt-6 sm:pt-10 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2.5"
      >
        <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0b1e3b] tracking-tight leading-tight">
          Chiêm Ngưỡng Dáng Túi 3D Thực Tế
        </h2>
        <p className="text-xs sm:text-base text-slate-600 max-w-xl mx-auto">
          Xoay 360° và thử nghiệm sắc màu đại dương trên mô hình 3D trước khi bước vào tùy biến.
        </p>
      </motion.div>

      {/* Main 3D Studio Container / Loading / Empty State */}
      {isLoading ? (
        <div className="p-12 text-center rounded-3xl bg-white/80 border border-slate-200/90 shadow-sm max-w-xl mx-auto space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Đang tải dữ liệu mô hình 3D từ Bộ Sưu Tập...
          </p>
        </div>
      ) : allBags.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white/80 border border-slate-200/90 shadow-sm max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0b1e3b]">Chưa Có Mẫu Túi 3D Trong Bộ Sưu Tập</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Các mẫu túi dệt tái sinh đang được cập nhật từ xưởng may. Quản trị viên có thể thêm mẫu thiết kế mới trong trang Quản trị.
            </p>
          </div>
          <Link href="/admin" className="inline-block pt-1">
            <GlassButton variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4 text-[#0b1e3b]" />}>
              Đăng Mẫu Thiết Kế Mới
            </GlassButton>
          </Link>
        </div>
      ) : selectedBag && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Left: 3D Interactive Stage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(11,30,59,0.07)] relative"
          >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                Mô Hình 3D Xem Trước
              </span>
            </div>

            {/* Hint tag */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <RotateCw className="w-3 h-3 text-sky-600 animate-spin" style={{ animationDuration: "8s" }} />
              <span>Vuốt xoay 360°</span>
            </div>
          </div>

          {/* 3D Canvas Viewport */}
          <div className="relative w-full h-[320px] sm:h-[440px] bg-gradient-to-b from-slate-50/80 via-white to-slate-100/50 rounded-2xl overflow-hidden my-3 sm:my-4 border border-slate-100">
            <BagCanvas3D
              bagBase={selectedBag}
              selectedColor={selectedColor}
              placedCharms={[]}
              isInteractive={true}
              modelUrl={selectedBag.model3dUrl || "/assets/models/tuixach.glb"}
            />
          </div>

          {/* Color Switcher Bar below 3D */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Sắc màu:</span>
              <span className="text-xs text-[#0b1e3b] font-bold">{selectedColor.name}</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
              {BAG_COLORS.map((c) => {
                const isActive = selectedColor.id === c.id;
                return (
                  <motion.button
                    key={c.id}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center cursor-pointer relative ${
                      isActive ? "ring-2 ring-[#0b1e3b] shadow-md scale-110" : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Right: Silhouette Quick Tabs & Direct Action Cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-5 space-y-5"
        >
          {/* Silhouette Quick Tabs */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chọn Dáng Túi Để Xem Thử 3D:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allBags.map((bag) => {
                const isSelected = selectedBag.id === bag.id;
                return (
                  <button
                    key={bag.id}
                    onClick={() => setSelectedBag(bag)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0b1e3b] text-white border-[#0b1e3b] shadow-md scale-[1.02]"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm line-clamp-1">{bag.name}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        isSelected ? "text-sky-200" : "text-slate-500"
                      }`}
                    >
                      {bag.modelType.toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Bag Preview Summary & Action Paths */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedBag.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    Phom Dáng {selectedBag.modelType.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>-{formatKg(selectedBag.plasticOffsetKg)} rác biển</span>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-[#0b1e3b]">{selectedBag.name}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {selectedBag.tagline}
                </p>
              </div>

              {/* Direct Experience Actions */}
              <div className="pt-2 space-y-2.5">
                <Link
                  href={`/story?mode=manual&bagId=${selectedBag.id}&colorId=${selectedColor.id}`}
                  className="block w-full"
                >
                  <GlassButton
                    variant="primary"
                    size="md"
                    className="w-full justify-center shadow-md cursor-pointer text-xs sm:text-sm font-bold"
                    icon={<Sparkles className="w-4 h-4 text-teal-300" />}
                  >
                    Tự Tùy Biến Dáng Túi Này
                  </GlassButton>
                </Link>

                <Link
                  href={`/shop`}
                  className="block w-full"
                >
                  <GlassButton
                    variant="secondary"
                    size="md"
                    className="w-full justify-center cursor-pointer text-xs font-semibold text-slate-700"
                    icon={<ArrowRight className="w-4 h-4 text-sky-700" />}
                  >
                    Xem Chi Tiết Trong Bộ Sưu Tập
                  </GlassButton>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      )}
    </section>
  );
};
