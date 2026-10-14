"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Charm } from "@/types";
import { CharmCanvas3D } from "@/components/3d/CharmCanvas3D";
import { GlassButton } from "@/components/ui/GlassButton";
import { getProductsFromFirestore } from "@/lib/firestoreService";
import {
  Sparkles,
  ArrowRight,
  RotateCw,
  Wand2,
  Gem,
} from "lucide-react";

export const Charm3DShowcase: React.FC = () => {
  const [allCharms, setAllCharms] = useState<Charm[]>([]);
  const [selectedCharm, setSelectedCharm] = useState<Charm | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCharms() {
      try {
        setIsLoading(true);
        const dbProducts = await getProductsFromFirestore();
        if (dbProducts && dbProducts.length > 0) {
          const liveCharms: Charm[] = dbProducts
            .filter((p: any) => p && p.isActive !== false && p.category === "charm")
            .map((p: any) => ({
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
              model3dUrl:
                p.model3dUrl && p.model3dUrl.trim() !== ""
                  ? p.model3dUrl
                  : "/assets/models/caurongcharm.glb",
              image: p.imageUrl || p.image || "",
            }));
          if (liveCharms.length > 0) {
            setAllCharms(liveCharms);
            setSelectedCharm(liveCharms[0]);
          } else {
            setAllCharms([]);
            setSelectedCharm(null);
          }
        } else {
          setAllCharms([]);
          setSelectedCharm(null);
        }
      } catch (e) {
        console.warn("Charm showcase load error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadCharms();
  }, []);

  return (
    <section id="story-charms3d" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2.5"
      >
        <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0b1e3b] tracking-tight leading-tight">
          Chiêm Ngưỡng Charm 3D Biển Sâu
        </h2>
        <p className="text-xs sm:text-base text-slate-600 max-w-xl mx-auto">
          Xoay 360° để ngắm nhìn từng chi tiết charm hộ mệnh được đúc thủ công từ đồng thau hàng hải và thủy tinh rác biển.
        </p>
      </motion.div>

      {/* Main 3D Charm Container / Loading / Empty State */}
      {isLoading ? (
        <div className="p-12 text-center rounded-3xl bg-white/80 border border-slate-200/90 shadow-sm max-w-xl mx-auto space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Đang tải dữ liệu mô hình charm 3D từ Bộ Sưu Tập...
          </p>
        </div>
      ) : allCharms.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white/80 border border-slate-200/90 shadow-sm max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
            <Gem className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0b1e3b]">Chưa Có Charm 3D Trong Bộ Sưu Tập</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Các mẫu charm thủy tinh biển đang được nghệ nhân chế tác và cập nhật lên hệ thống.
            </p>
          </div>
          <Link href="/admin" className="inline-block pt-1">
            <GlassButton variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4 text-[#0b1e3b]" />}>
              Đăng Charm Mới Vào Bộ Sưu Tập
            </GlassButton>
          </Link>
        </div>
      ) : selectedCharm && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Left Column: 3D Interactive Stage & Charm Quick Selector */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(11,30,59,0.07)] space-y-4"
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
              <span>Vuốt xoay 3D</span>
            </div>
          </div>

          {/* 3D Canvas Stage */}
          <div className="relative w-full h-[300px] sm:h-[400px] bg-gradient-to-b from-slate-50 via-white to-sky-50/30 rounded-2xl overflow-hidden border border-slate-100">
            <CharmCanvas3D
              modelUrl={selectedCharm.model3dUrl || "/assets/models/caurongcharm.glb"}
              color={selectedCharm.color}
              glowColor={selectedCharm.glowColor}
              isInteractive={true}
            />

            {/* Float Badge Symbol */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="text-lg">{selectedCharm.symbol}</span>
              <span className="text-xs font-bold text-[#0b1e3b]">{selectedCharm.vietnameseName}</span>
            </div>
          </div>

          {/* Quick Charm Pills */}
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Chọn Charm Để Soi 3D:
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {allCharms.map((charm) => {
                const isSelected = selectedCharm.id === charm.id;
                return (
                  <button
                    key={charm.id}
                    onClick={() => setSelectedCharm(charm)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0b1e3b] text-white shadow-sm scale-105"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{charm.symbol}</span>
                    <span>{charm.vietnameseName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Direct User Journey Action Paths */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-5 space-y-4"
        >
          {/* Action Card 1: Custom Charm by Self */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 group hover:border-teal-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0b1e3b]">
                Tự Đính Charm Vào Túi Của Bạn
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Mở không gian NÉT Studio để tự do đính charm vào từng mắt lưới thủ công theo bố cục và sở thích riêng.
              </p>
            </div>

            <Link href="/story?mode=manual" className="block pt-1">
              <GlassButton
                variant="primary"
                size="md"
                className="w-full justify-center shadow-md cursor-pointer text-xs sm:text-sm font-bold"
                icon={<Sparkles className="w-4 h-4 text-teal-300" />}
              >
                Vào NÉT Studio Tự Thiết Kế
              </GlassButton>
            </Link>
          </div>

          {/* Action Card 2: AI Generate by Experience */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-sky-50/50 border border-amber-200/90 shadow-sm space-y-3 group hover:border-amber-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center shadow-xs">
              <Wand2 className="w-5 h-5" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase mb-1">
                Gợi Ý Bằng Trí Tuệ Nhân Tạo
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#0b1e3b]">
                Nhờ AI Tạo Bộ Phối Theo Trải Nghiệm
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Khám phá bài trắc nghiệm cảm xúc ngắn 1 phút để NÉT AI gợi ý bộ charm hộ mệnh tương ứng với câu chuyện của bạn.
              </p>
            </div>

            <Link href="/story?mode=ai" className="block pt-1">
              <GlassButton
                variant="primary"
                size="md"
                className="w-full justify-center bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md cursor-pointer text-xs sm:text-sm font-bold border-amber-600"
                icon={<Wand2 className="w-4 h-4 text-amber-200" />}
              >
                Bắt Đầu Tạo Với AI Quiz
              </GlassButton>
            </Link>
          </div>

          {/* Secondary Link to Browse Catalog */}
          <div className="text-center pt-1">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b1e3b] transition-colors"
            >
              <span>Xem thông tin chi tiết từng charm trong Bộ Sưu Tập</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-700" />
            </Link>
          </div>
        </motion.div>
      </div>
      )}
    </section>
  );
};
