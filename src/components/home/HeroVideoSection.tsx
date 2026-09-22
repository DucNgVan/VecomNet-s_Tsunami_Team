"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { Sparkles, ArrowRight, Box, Play } from "lucide-react";

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
    <section id="story-hero" className="pt-24 pb-12 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Editorial Campaign Stage Container */}
      <div className="relative min-h-[82vh] rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_20px_50px_rgba(11,30,59,0.08)] flex items-center justify-center p-6 sm:p-12 bg-black">
        {/* Background Video - Scaled up so there are ZERO gaps or empty borders */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={videoRef}
            src="/assets/hero-ocean.mp4"
            autoPlay
            muted
            playsInline
            loop={false}
            preload="auto"
            className="w-full h-full min-w-full min-h-full object-cover scale-[1.08] sm:scale-[1.06] origin-center filter brightness-[1.04] contrast-[1.02] transform-gpu"
          />

          {/* Minimalist Studio Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#061020]/85 via-black/20 to-[#061020]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>

        {/* Replay Intro Film Button in Corner */}
        {onReplayIntro && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReplayIntro}
            className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 text-xs font-mono font-medium shadow-md transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white text-white" />
            <span>Xem Lại Phim Mở Màn</span>
          </motion.button>
        )}

        {/* Editorial Content: Smoothly rises and fades in as the video docks into place */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{
            opacity: isIntroShrunk ? 1 : 0,
            y: isIntroShrunk ? 0 : 25,
          }}
          transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-4xl mx-auto text-center space-y-8"
        >
          {/* Top Story Chapter Label */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 text-[#0b1e3b] text-xs font-mono font-bold tracking-wider shadow-md border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-spin" />
              <span>HỒI I • KHỞI NGUỒN TỪ BIỂN SÂU • NÉT SIGNATURE</span>
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-md font-serif">
              TỪ LƯỚI ĐÁNH CÁ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-teal-100 to-emerald-200 italic font-serif">
                ĐẾN TUYỆT TÁC THỜI TRANG
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-100 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow">
              Mỗi chiếc túi <strong className="text-white font-semibold">NÉT</strong> và charm thủy tinh
              được tái sinh từ hàng nghìn mét lưới ma giải cứu dưới đáy biển Việt Nam, hòa quyện giữa kỹ
              nghệ đan thủ công và mỹ học tối giản đương đại.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center max-w-md mx-auto">
            <Link href="/customizer" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <GlassButton
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto min-w-[210px] bg-white text-[#0b1e3b] hover:bg-slate-100 border-white shadow-xl font-bold cursor-pointer"
                  icon={<Box className="w-5 h-5 text-sky-600" />}
                >
                  Thiết Kế Tại Nét Lab 3D
                </GlassButton>
              </motion.div>
            </Link>

            <Link href="/shop" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <GlassButton
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto min-w-[190px] bg-black/40 text-white hover:bg-black/50 border-white/30 backdrop-blur-sm cursor-pointer"
                  icon={<ArrowRight className="w-5 h-5 text-sky-300" />}
                >
                  Xem Bộ Sưu Tập
                </GlassButton>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 3 Pillar Metrics Bar below Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isIntroShrunk ? 1 : 0,
          y: isIntroShrunk ? 0 : 20,
        }}
        transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
      >
        {[
          {
            val: "100%",
            color: "text-[#0b1e3b]",
            title: "Sợi Tái Sinh Từ Biển",
            desc: "Không sử dụng hạt nhựa nguyên sinh từ dầu mỏ",
          },
          {
            val: "3D Real-time",
            color: "text-sky-600",
            title: "Mắt Lưới Tự Động Snap",
            desc: "Gắn charm chuẩn xác vào từng nút dệt thủ công",
          },
          {
            val: "GPS & QR",
            color: "text-emerald-600",
            title: "Minh Bạch Lô Thu Gom",
            desc: "Tra cứu trực tiếp tọa độ vùng biển được giải cứu",
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_16px_rgba(11,30,59,0.04)] hover:shadow-[0_12px_28px_rgba(11,30,59,0.08)] text-center flex flex-col items-center transition-shadow"
          >
            <div className={`text-2xl font-black font-mono ${item.color}`}>{item.val}</div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">{item.title}</div>
            <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
