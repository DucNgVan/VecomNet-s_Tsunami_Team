"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BAG_BASES, BAG_COLORS } from "@/data/products";
import { BagBase, BagMeshColor } from "@/types";
import { BagCanvas3D } from "@/components/3d/BagCanvas3D";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatVND, formatKg } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastNotification";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  RotateCw,
  Box,
  Check,
  Maximize2,
} from "lucide-react";

export const Bag3DShowcase: React.FC = () => {
  const [selectedBag, setSelectedBag] = useState<BagBase>(BAG_BASES[0]);
  const [selectedColor, setSelectedColor] = useState<BagMeshColor>(BAG_COLORS[0]);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = () => {
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
    <section id="story-bags3d" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-12 space-y-3"
      >
        <GlassBadge variant="ocean" className="gap-1.5">
          <Box className="w-3.5 h-3.5 text-sky-600" />
          <span>HỒI II • 4 DÁNG TÚI BIỂU TƯỢNG (3D SHOWCASE)</span>
        </GlassBadge>
        <h2 className="text-3xl sm:text-5xl font-black text-[#0b1e3b] tracking-tight">
          Chiêm Ngưỡng Từng Mắt Lưới 3D Tái Sinh
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Xoay 360 độ và chuyển đổi màu sắc thời gian thực trên mô hình 3D thực tế. Mỗi phôi túi được
          đan thủ công từ 0.8kg đến 1.6kg lưới ma vớt dưới rạn san hô Việt Nam.
        </p>
      </motion.div>

      {/* Main 3D Studio Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: 3D Interactive Stage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-7 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(11,30,59,0.07)] relative"
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                Mô Hình 3D Thời Gian Thực
              </span>
            </div>

            {/* Hint tag */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <RotateCw className="w-3 h-3 text-sky-600 animate-spin" style={{ animationDuration: "8s" }} />
              <span className="hidden sm:inline">Kéo chuột hoặc vuốt để xoay 360°</span>
              <span className="sm:hidden">Vuốt xoay 3D</span>
            </div>
          </div>

          {/* 3D Canvas Viewport */}
          <div className="relative w-full h-[340px] sm:h-[460px] bg-gradient-to-b from-slate-50/80 via-white to-slate-100/50 rounded-2xl overflow-hidden my-4 border border-slate-100">
            <BagCanvas3D
              bagBase={selectedBag}
              selectedColor={selectedColor}
              placedCharms={[]}
              isInteractive={true}
              modelUrl="/assets/models/tuixach.glb"
            />
          </div>

          {/* Color Switcher Bar below 3D */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Sắc màu đại dương:</span>
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

        {/* Right: Silhouette Selector & Detailed Specifications */}
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-5 space-y-6"
        >
          {/* Silhouette Quick Tabs */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chọn Dáng Phôi Túi:
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {BAG_BASES.map((bag) => {
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
                      {formatVND(bag.basePrice)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Bag Card Details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedBag.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5"
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

                <h3 className="text-2xl font-black text-[#0b1e3b]">{selectedBag.name}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {selectedBag.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Kích thước</div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedBag.dimensions}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Dung tích</div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedBag.capacity}</div>
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-slate-400">Giá niêm yết:</div>
                  <div className="text-2xl font-black text-[#0b1e3b]">
                    {formatVND(selectedBag.basePrice)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="primary"
                    size="md"
                    onClick={handleAddToCart}
                    className="shadow-md cursor-pointer text-xs"
                    icon={<ShoppingBag className="w-4 h-4" />}
                  >
                    Thêm Giỏ
                  </GlassButton>
                  <Link href={`/shop`}>
                    <GlassButton
                      variant="secondary"
                      size="md"
                      className="cursor-pointer text-xs"
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      Bộ Sưu Tập
                    </GlassButton>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
