"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CHARMS } from "@/data/products";
import { Charm } from "@/types";
import { CharmCanvas3D } from "@/components/3d/CharmCanvas3D";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatVND } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastNotification";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  RotateCw,
  Gem,
  Check,
} from "lucide-react";

export const Charm3DShowcase: React.FC = () => {
  const [selectedCharm, setSelectedCharm] = useState<Charm>(CHARMS[0]);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddCharm = () => {
    addToCart({
      type: "charm_single",
      title: `${selectedCharm.vietnameseName} (${selectedCharm.name})`,
      price: selectedCharm.price,
      quantity: 1,
      image: "",
      plasticOffsetKg: selectedCharm.plasticOffsetGrams / 1000,
    });

    showToast(
      "Đã thêm charm vào giỏ!",
      `Charm "${selectedCharm.vietnameseName}" mang năng lượng hộ mệnh đã được đưa vào giỏ.`,
      "info"
    );
  };

  return (
    <section id="story-charms3d" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-12 space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1e3b] text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] shadow-md mb-2">
          <Gem className="w-3.5 h-3.5 text-emerald-400" />
          <span>HỒI III • BỘ SƯU TẬP CHARM 3D HỘ MỆNH</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#0b1e3b] tracking-tight">
          Linh Hồn Đại Dương Trong Từng Chi Tiết 3D
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Được đúc từ đồng thau hàng hải tái sinh, pha lê ép lạnh và men ngọc phát quang.
          Mỗi chiếc charm là một biểu tượng hộ mệnh mang lại bình an và may mắn cho chủ nhân.
        </p>
      </motion.div>

      {/* Main 3D Studio Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Charm Selector Grid */}
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-6 space-y-4 order-2 lg:order-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chọn Charm Để Soi Chi Tiết 3D:
            </span>
            <span className="text-xs text-sky-700 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              {CHARMS.length} Mẫu Độc Quyền
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
            {CHARMS.map((charm) => {
              const isSelected = selectedCharm.id === charm.id;
              return (
                <button
                  key={charm.id}
                  onClick={() => setSelectedCharm(charm)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? "bg-[#0b1e3b] text-white border-[#0b1e3b] shadow-md scale-[1.02]"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-xs border"
                    style={{
                      backgroundColor: isSelected ? "rgba(255,255,255,0.15)" : "#f8fafc",
                      borderColor: isSelected ? "rgba(255,255,255,0.3)" : "#e2e8f0",
                    }}
                  >
                    <span>{charm.symbol}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs truncate">{charm.vietnameseName}</div>
                    <div
                      className={`text-[11px] font-semibold mt-0.5 ${
                        isSelected ? "text-sky-300" : "text-sky-800"
                      }`}
                    >
                      {formatVND(charm.price)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Right Column: 3D Stage & Active Charm Inspector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-6 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(11,30,59,0.07)] space-y-4 order-1 lg:order-2"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                Studio 3D Chi Tiết Charm
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <RotateCw className="w-3 h-3 text-sky-600 animate-spin" style={{ animationDuration: "8s" }} />
              <span>Xoay 3D tự do</span>
            </div>
          </div>

          {/* 3D Canvas Stage */}
          <div className="relative w-full h-[280px] sm:h-[340px] bg-gradient-to-b from-slate-50 via-white to-sky-50/30 rounded-2xl overflow-hidden border border-slate-100">
            <CharmCanvas3D
              modelUrl={selectedCharm.model3dUrl || "/assets/models/caurongcharm.glb"}
              color={selectedCharm.color}
              glowColor={selectedCharm.glowColor}
              isInteractive={true}
            />

            {/* Float Badge Symbol */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="text-base">{selectedCharm.symbol}</span>
              <span className="text-xs font-bold text-slate-800">{selectedCharm.vietnameseName}</span>
            </div>
          </div>

          {/* Charm Description & Materials */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCharm.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-3 pt-1"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#0b1e3b]">
                    {selectedCharm.vietnameseName}
                  </h3>
                  <div className="text-xs text-slate-500">{selectedCharm.name}</div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-[#0b1e3b]">
                    {formatVND(selectedCharm.price)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    Thu gom {selectedCharm.plasticOffsetGrams}g rác biển
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="text-slate-500 font-semibold">Chất liệu chế tác:</div>
                <div className="text-slate-800">{selectedCharm.material}</div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedCharm.description}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <GlassButton
                  variant="primary"
                  size="md"
                  onClick={handleAddCharm}
                  className="flex-1 justify-center shadow-md cursor-pointer text-xs"
                  icon={<ShoppingBag className="w-4 h-4" />}
                >
                  Thêm Charm Vào Giỏ
                </GlassButton>

                <Link href="/shop">
                  <GlassButton
                    variant="secondary"
                    size="md"
                    className="cursor-pointer text-xs"
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Xem Cửa Hàng
                  </GlassButton>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
