"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BagCanvas3D } from "@/components/3d/BagCanvas3D";
import { BAG_BASES, BAG_COLORS, CHARMS } from "@/data/products";
import { BagMeshColor, PlacedCharm } from "@/types";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { Sparkles, Layers, Box, ArrowRight, RotateCw } from "lucide-react";
import { formatKg } from "@/lib/utils";

export const Mission3DSection: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState<BagMeshColor>(BAG_COLORS[0]);
  const featuredBag = BAG_BASES[0];

  return (
    <section id="story-lab3d" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Interactive 3D Canvas in Clean Studio Frame */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-7"
        >
          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_50px_rgba(11,30,59,0.07)] relative overflow-hidden group">
            {/* Top Bar with 3D Status & Swatches */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-700 font-bold tracking-wide">
                  MÔ HÌNH 3D (.GLB)
                </span>
              </div>

              {/* Color switcher with smooth spring animations */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 rounded-full border border-slate-200">
                {BAG_COLORS.map((c) => (
                  <motion.button
                    key={c.id}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedColor(c)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all cursor-pointer ${
                      selectedColor.id === c.id
                        ? "scale-110 ring-2 ring-[#0b1e3b] shadow-sm"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* 3D WebGL Canvas */}
            <div className="relative w-full h-[320px] sm:h-[480px] bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-2xl overflow-hidden">
              <BagCanvas3D
                bagBase={featuredBag}
                selectedColor={selectedColor}
                placedCharms={[]}
                isInteractive={true}
                modelUrl="/assets/models/tuixach.glb"
              />
            </div>

            {/* Bottom Spec Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-600">
                <span>Dáng: <strong className="text-slate-900 font-bold">{featuredBag.name}</strong></span>
                <span>Màu: <strong className="text-sky-700 font-bold">{selectedColor.name}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-700 font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Thu hồi {formatKg(featuredBag.plasticOffsetKg + 0.63)} rác biển</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Editorial Narrative & CTA */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-5 space-y-6"
        >
          <GlassBadge variant="emerald" className="gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>HỒI III • KHÔNG GIAN ĐỒNG SÁNG TẠO • NÉT LAB 3D</span>
          </GlassBadge>

          <h2 className="text-3xl sm:text-4xl font-black text-[#0b1e3b] leading-tight font-serif tracking-tight">
            Mỗi Mắt Lưới Là Một Vị Trí Kể Câu Chuyện Biển
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Không có hai chiếc túi <strong className="text-slate-900 font-semibold">NÉT</strong> nào
            hoàn toàn giống nhau. Tại Nét Lab, bạn tự do lựa chọn phôi túi, màu mắt dệt và gắn các
            charm thủ công vào các điểm neo trên mặt lưới với cơ chế định vị snap-to-mesh 3D thông minh.
          </p>

          {/* Clean Feature List with Hover Stagger */}
          <div className="space-y-3 pt-2">
            <motion.div
              whileHover={{ x: 4 }}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 flex-shrink-0">
                <Box className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="text-slate-900 font-bold text-sm">Tương tác Snap-to-Mesh 3D</div>
                <div className="text-slate-500 mt-1 leading-relaxed">
                  Charm tự động hít vào mắt lưới đan chịu lực, đảm bảo độ cân xứng hoàn mỹ và tính khả thi khi thợ đan thực tế.
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ x: 4 }}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 flex-shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="text-slate-900 font-bold text-sm">Bản Vẽ Xuất Xưởng Minh Bạch</div>
                <div className="text-slate-500 mt-1 leading-relaxed">
                  Sau khi hoàn tất, hệ thống tự động xuất mã kỹ thuật và tọa độ mắt lưới để nghệ nhân Việt dệt đúng từng chi tiết.
                </div>
              </div>
            </motion.div>
          </div>

          <div className="pt-2">
            <Link href="/shop">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GlassButton
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-md cursor-pointer"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Mua Ngay • Buy Now
                </GlassButton>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
