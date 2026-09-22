"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { Sparkles, ArrowRight, Box, Play, ShoppingBag } from "lucide-react";

interface HeroVideoSectionProps {
  onReplayIntro?: () => void;
  isIntroShrunk?: boolean;
  externalVideoRef?: React.RefObject<HTMLVideoElement>;
}

export const HeroVideoSection: React.FC<HeroVideoSectionProps> = ({
  onReplayIntro,
  isIntroShrunk = true,
  externalVideoRef,
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Requirement: Play 1 time and pause permanently at 7.1s (no endless looping)
    const handleTimeUpdate = () => {
      if (video.currentTime >= 7.1) {
        video.pause();
      }
    };

    const handleEnded = () => {
      video.pause();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoRef]);

  return (
    <section id="story-hero" className="relative w-full min-h-[100dvh] h-screen overflow-hidden bg-black flex flex-col justify-between">
      {/* Fullscreen Edge-to-Edge Background Video - No frame, zero empty spaces */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          src="/assets/hero-ocean.mp4"
          autoPlay
          muted
          playsInline
          loop={false}
          preload="auto"
          className="w-full h-full min-w-full min-h-full object-cover scale-[1.12] origin-center filter brightness-[1.04] contrast-[1.02] transform-gpu"
        />

        {/* Minimalist Studio Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061020]/90 via-black/25 to-[#061020]/50 pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>

      {/* Replay Intro Film Button in Corner (Hidden) */}
      {/* {onReplayIntro && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReplayIntro}
          className="absolute top-20 sm:top-24 right-6 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 text-xs font-mono font-medium shadow-md transition-all cursor-pointer"
        >
          <Play className="w-3 h-3 fill-white text-white" />
          <span>Xem Lại Phim Mở Màn</span>
        </motion.button>
      )} */}

      {/* Editorial Content: Centered over edge-to-edge video with device-adapted breathing room */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 pt-16 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{
            opacity: isIntroShrunk ? 1 : 0,
            y: isIntroShrunk ? 0 : 25,
          }}
          transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-8"
        >
          {/* Top Story Chapter Label */}
          <div>
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/95 text-[#0b1e3b] text-[10px] sm:text-xs font-mono font-bold tracking-wider shadow-md border border-slate-200">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 animate-spin" />
              <span>HỒI I • KHỞI NGUỒN TỪ BIỂN SÂU • NÉT SIGNATURE</span>
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-2 sm:space-y-4">
            <h1 className="text-2xl sm:text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.15] sm:leading-[1.08] drop-shadow-md font-serif">
              TỪ LƯỚI ĐÁNH CÁ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-teal-100 to-emerald-200 italic font-serif">
                ĐẾN TUYỆT TÁC THỜI TRANG
              </span>
            </h1>

            <p className="text-xs sm:text-lg md:text-xl text-slate-100 max-w-sm sm:max-w-2xl mx-auto font-normal leading-relaxed drop-shadow line-clamp-3 sm:line-clamp-none">
              Mỗi chiếc túi <strong className="text-white font-semibold">NÉT</strong> và charm thủy tinh
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
                  className="w-full sm:w-auto min-w-[200px] bg-white text-[#0b1e3b] hover:bg-slate-100 border-white shadow-xl font-bold cursor-pointer text-xs sm:text-sm py-2.5 sm:py-3"
                  icon={<ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />}
                >
                  Mua Ngay • Buy Now
                </GlassButton>
              </motion.div>
            </Link>

            <Link href="/shop" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <GlassButton
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto min-w-[180px] bg-black/40 text-white hover:bg-black/50 border-white/30 backdrop-blur-sm cursor-pointer text-xs sm:text-sm py-2.5 sm:py-3"
                  icon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />}
                >
                  Xem Bộ Sưu Tập
                </GlassButton>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 3 Pillar Metrics Bar: Integrated at bottom of edge-to-edge Hero section */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pb-4 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isIntroShrunk ? 1 : 0,
            y: isIntroShrunk ? 0 : 20,
          }}
          transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
        >
          {/* Desktop: 3 Spacious Cards */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            {[
              {
                val: "100%",
                color: "text-sky-300",
                title: "Sợi Tái Sinh Từ Biển",
                desc: "Không sử dụng hạt nhựa nguyên sinh từ dầu mỏ",
              },
              {
                val: "3D Real-time",
                color: "text-teal-300",
                title: "Mắt Lưới Tự Động Snap",
                desc: "Gắn charm chuẩn xác vào từng nút dệt thủ công",
              },
              {
                val: "GPS & QR",
                color: "text-emerald-300",
                title: "Minh Bạch Lô Thu Gom",
                desc: "Tra cứu trực tiếp tọa độ vùng biển được giải cứu",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-4 rounded-2xl bg-black/40 border border-white/20 backdrop-blur-md text-center flex flex-col items-center transition-all hover:bg-black/60 shadow-lg"
              >
                <div className={`text-2xl font-black font-mono ${item.color}`}>{item.val}</div>
                <div className="text-xs font-bold text-white mt-0.5">{item.title}</div>
                <div className="text-[11px] text-slate-300 mt-1">{item.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Ultra-sleek single-row 3-stat glass banner (frees up vertical space) */}
          <div className="grid md:hidden grid-cols-3 gap-1 p-2 rounded-2xl bg-black/50 border border-white/15 backdrop-blur-md text-center shadow-lg">
            <div className="flex flex-col items-center justify-center py-1">
              <div className="text-sm font-black font-mono text-sky-300">100%</div>
              <div className="text-[9px] font-bold text-white leading-tight mt-0.5">Sợi Tái Sinh</div>
            </div>
            <div className="flex flex-col items-center justify-center py-1 border-x border-white/15">
              <div className="text-sm font-black font-mono text-teal-300">3D Snap</div>
              <div className="text-[9px] font-bold text-white leading-tight mt-0.5">Mắt Lưới</div>
            </div>
            <div className="flex flex-col items-center justify-center py-1">
              <div className="text-sm font-black font-mono text-emerald-300">GPS & QR</div>
              <div className="text-[9px] font-bold text-white leading-tight mt-0.5">Minh Bạch</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
