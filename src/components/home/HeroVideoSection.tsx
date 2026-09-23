"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { Sparkles, ArrowRight, ShoppingBag } from "lucide-react";

interface HeroVideoSectionProps {
  onReplayIntro?: () => void;
  isIntroShrunk?: boolean;
  externalVideoRef?: React.RefObject<HTMLVideoElement>;
}

export const HeroVideoSection: React.FC<HeroVideoSectionProps> = ({
  isIntroShrunk = true,
}) => {
  return (
    <section
      id="story-hero"
      className="relative w-full min-h-[100dvh] flex flex-col justify-between"
    >

      {/* Editorial Content: Centered over edge-to-edge video with device-adapted breathing room */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 pt-16 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{
            opacity: isIntroShrunk ? 1 : 0,
            y: isIntroShrunk ? 0 : 25,
          }}
          transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto text-center space-y-5 sm:space-y-8 relative"
        >
          {/* Subtle luminous ocean aura for crystal clear typography against background video */}
          <div className="absolute inset-0 max-w-2xl mx-auto bg-gradient-to-b from-sky-200/25 via-white/35 to-teal-100/20 blur-3xl -z-10 pointer-events-none rounded-full" />

          {/* Top Category Overline: High Contrast Hồi I Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1e3b] text-sky-200 text-xs font-bold uppercase tracking-[0.2em] shadow-md mb-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-spin" style={{ animationDuration: "12s" }} />
            <span>HỒI I • KHỞI NGUỒN TỪ BIỂN SÂU • NÉT SIGNATURE</span>
          </div>

          {/* Main Headline with generous vertical spacing and Playfair Display editorial hierarchy */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="font-serif flex flex-col items-center justify-center gap-2.5 sm:gap-3.5 md:gap-4">
              {/* Line 1: Origin */}
              <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-[#0b1e3b] leading-[1.25] sm:leading-[1.18] sm:whitespace-nowrap">
                TỪ LƯỚI ĐÁNH CÁ
              </span>

              {/* Line 2: Haute Couture Transformation - with generous top padding to prevent Vietnamese diacritic clipping */}
              <span className="inline-block text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 leading-[1.38] pt-3 pb-2 sm:pt-5 sm:pb-3 drop-shadow-[0_4px_24px_rgba(13,148,136,0.18)] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                <span className="sm:hidden">
                  ĐẾN TUYỆT TÁC<br />THỜI TRANG
                </span>
                <span className="hidden sm:inline sm:whitespace-nowrap">
                  ĐẾN TUYỆT TÁC THỜI TRANG
                </span>
              </span>
            </h1>

            {/* Editorial Description */}
            <p className="text-xs sm:text-base md:text-lg text-slate-600 max-w-sm sm:max-w-2xl mx-auto font-normal leading-relaxed line-clamp-3 sm:line-clamp-none pt-1">
              Mỗi chiếc túi <strong className="text-[#0b1e3b] font-semibold">NÉT</strong> và charm thủy tinh
              được tái sinh từ hàng nghìn mét lưới ma giải cứu dưới đáy biển Việt Nam, hòa quyện giữa kỹ
              nghệ đan thủ công và mỹ học tối giản đương đại.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 pt-1 sm:pt-2 justify-center max-w-md mx-auto w-full px-2 sm:px-0">
            <Link href="/shop" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <GlassButton
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto min-w-[200px] bg-[#0b1e3b] text-white hover:bg-sky-950 border-[#0b1e3b] shadow-xl font-bold cursor-pointer text-xs sm:text-sm py-2.5 sm:py-3"
                  icon={<ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />}
                >
                  Mua Ngay
                </GlassButton>
              </motion.div>
            </Link>

            <Link href="/shop" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <GlassButton
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto min-w-[180px] bg-white/80 text-[#0b1e3b] hover:bg-white border-slate-300 backdrop-blur-sm cursor-pointer text-xs sm:text-sm py-2.5 sm:py-3 shadow-sm"
                  icon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-sky-700" />}
                >
                  Xem Bộ Sưu Tập
                </GlassButton>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 3 Pillar Metrics Bar: Integrated at bottom of edge-to-edge Hero section */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pb-6 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isIntroShrunk ? 1 : 0,
            y: isIntroShrunk ? 0 : 20,
          }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {/* Desktop: 3 Spacious Cards */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            {[
              {
                val: "100%",
                color: "text-sky-700",
                title: "Sợi Tái Sinh Từ Biển",
                desc: "Không sử dụng hạt nhựa nguyên sinh từ dầu mỏ",
              },
              {
                val: "3D Real-time",
                color: "text-teal-700",
                title: "Mắt Lưới Tự Động Snap",
                desc: "Gắn charm chuẩn xác vào từng nút dệt thủ công",
              },
              {
                val: "GPS & QR",
                color: "text-emerald-700",
                title: "Minh Bạch Lô Thu Gom",
                desc: "Tra cứu trực tiếp tọa độ vùng biển được giải cứu",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-4 rounded-2xl bg-white/80 border border-slate-200/90 backdrop-blur-md text-center flex flex-col items-center transition-all hover:bg-white shadow-sm hover:shadow-md"
              >
                <div className={`text-2xl font-black ${item.color}`}>{item.val}</div>
                <div className="text-xs font-bold text-[#0b1e3b] mt-0.5">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Ultra-sleek single-row 3-stat glass banner */}
          <div className="grid md:hidden grid-cols-3 gap-1 p-2 rounded-2xl bg-white/85 border border-slate-200/90 backdrop-blur-md text-center shadow-sm">
            <div className="flex flex-col items-center justify-center py-1">
              <div className="text-sm font-black text-sky-700">100%</div>
              <div className="text-[9px] font-bold text-[#0b1e3b] leading-tight mt-0.5">Sợi Tái Sinh</div>
            </div>
            <div className="flex flex-col items-center justify-center py-1 border-x border-slate-200">
              <div className="text-sm font-black text-teal-700">3D Snap</div>
              <div className="text-[9px] font-bold text-[#0b1e3b] leading-tight mt-0.5">Mắt Lưới</div>
            </div>
            <div className="flex flex-col items-center justify-center py-1">
              <div className="text-sm font-black text-emerald-700">GPS & QR</div>
              <div className="text-[9px] font-bold text-[#0b1e3b] leading-tight mt-0.5">Minh Bạch</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
