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
      className="relative w-full pt-28 sm:pt-36 pb-8 sm:pb-12 flex flex-col items-center justify-center"
    >

      {/* Editorial Content: Centered over edge-to-edge video with device-adapted breathing room */}
      <div className="relative z-10 w-full flex items-center justify-center px-4 sm:px-8">
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
            <Link href="/story?mode=manual" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <GlassButton
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto min-w-[200px] bg-[#0b1e3b] text-white hover:bg-sky-950 border-[#0b1e3b] shadow-xl font-bold cursor-pointer text-xs sm:text-sm py-2.5 sm:py-3"
                  icon={<Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300" />}
                >
                  Tự Thiết Kế Túi
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
    </section>
  );
};
