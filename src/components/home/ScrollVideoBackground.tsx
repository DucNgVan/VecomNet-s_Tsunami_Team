"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Compass, Sparkles } from "lucide-react";
import { useIntro } from "@/context/IntroContext";

interface ScrollVideoBackgroundProps {
  videoSrc?: string;
  className?: string;
}

export const ScrollVideoBackground: React.FC<ScrollVideoBackgroundProps> = ({
  videoSrc = "/assets/video2.mp4",
  className = "",
}) => {
  const { isIntroPlaying } = useIntro();
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const durationRef = useRef<number>(20);
  const animFrameIdRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState<boolean>(false);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(false);
  const [currentProgressPct, setCurrentProgressPct] = useState<number>(0);
  const [formattedTime, setFormattedTime] = useState<string>("0:00");

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 1. Initialize Video and Metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const onLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        durationRef.current = video.duration;
      }
      setIsReady(true);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);

    // Warm up video decoder
    video.play().then(() => {
      video.pause();
    }).catch(() => {});

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [videoSrc]);

  // 2. High-Performance Scroll Tracker (Throttled & Clamped)
  useEffect(() => {
    if (isAutoplay) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

          if (maxScroll > 0) {
            const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
            const duration = durationRef.current || 20;
            // Target time calculation across the 20s timeline
            targetTimeRef.current = progress * Math.max(0, duration - 0.1);
            setCurrentProgressPct(Math.round(progress * 100));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAutoplay]);

  // 3. Buttery-Smooth RAF Loop with Inertia / Dampened Lerp
  useEffect(() => {
    if (isAutoplay) return;

    const video = videoRef.current;
    if (!video) return;

    const onSeeked = () => {
      isSeekingRef.current = false;
    };
    video.addEventListener("seeked", onSeeked);

    // Fallback timer if browser skips 'seeked' event
    let seekGuardTimeout: NodeJS.Timeout | null = null;

    const renderScrubLoop = () => {
      animFrameIdRef.current = requestAnimationFrame(renderScrubLoop);

      if (!video || video.readyState < 2) return;

      const diff = targetTimeRef.current - currentTimeRef.current;

      // Threshold to stop seeking when close enough (prevents micro-stutter)
      if (Math.abs(diff) > 0.02) {
        // Luxury cinematic lerp factor (0.09 = soft elastic deceleration)
        currentTimeRef.current += diff * 0.09;

        const boundedTime = Math.max(
          0,
          Math.min(currentTimeRef.current, (durationRef.current || 20) - 0.05)
        );

        if (!isSeekingRef.current) {
          isSeekingRef.current = true;
          try {
            // Use fastSeek if WebKit/Safari supports it for instant seek
            if ("fastSeek" in video && typeof (video as any).fastSeek === "function") {
              (video as any).fastSeek(boundedTime);
            } else {
              video.currentTime = boundedTime;
            }
            setFormattedTime(formatTime(boundedTime));
          } catch (e) {
            isSeekingRef.current = false;
          }

          if (seekGuardTimeout) clearTimeout(seekGuardTimeout);
          seekGuardTimeout = setTimeout(() => {
            isSeekingRef.current = false;
          }, 60);
        }
      }
    };

    animFrameIdRef.current = requestAnimationFrame(renderScrubLoop);

    return () => {
      video.removeEventListener("seeked", onSeeked);
      if (seekGuardTimeout) clearTimeout(seekGuardTimeout);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isAutoplay]);

  // 4. Autoplay Mode Switcher
  const toggleAutoplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isAutoplay) {
      video.loop = true;
      video.play().then(() => {
        setIsAutoplay(true);
      }).catch(() => {});
    } else {
      video.pause();
      video.loop = false;
      setIsAutoplay(false);
      currentTimeRef.current = video.currentTime;
      targetTimeRef.current = video.currentTime;
    }
  }, [isAutoplay]);

  return (
    <div
      className={`fixed inset-0 w-full h-full -z-30 overflow-hidden pointer-events-none select-none ${className}`}
      style={{ contain: "strict" }}
    >
      {/* 1. Core Background Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        muted
        autoPlay={false}
        loop={false}
        preload="auto"
        className="w-full h-full object-cover filter brightness-[1.03] contrast-[1.02] transform-gpu will-change-transform"
        style={{
          transform: "translate3d(0, 0, 0)",
          backfaceVisibility: "hidden",
        }}
      />

      {/* 2. Haute-Couture Light Studio Atmosphere Scrim */}
      {/* Soft daylight wash ensures all foreground cards & text remain 100% sharp and readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc]/75 via-[#f8fafc]/60 to-[#f8fafc]/80 backdrop-blur-[1px] pointer-events-none" />

      {/* 3. Subtle Ocean Cyan & Emerald Atmosphere Tints */}
      <div className="absolute inset-0 bg-radial from-transparent via-sky-500/[0.04] to-slate-900/[0.12] pointer-events-none" />

      {/* 4. Fine Museum Grain / Hairline Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#0b1e3b 1px, transparent 1px), linear-gradient(to right, #0b1e3b 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* 5. Minimalist Floating Scroll Video HUD (Hidden) */}
      {/* <AnimatePresence>
        {!isIntroPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="fixed bottom-6 left-6 z-40 pointer-events-auto select-none"
          >
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/90 hover:bg-white text-[#0b1e3b] backdrop-blur-xl border border-slate-200/90 shadow-[0_10px_30px_rgba(11,30,59,0.12)] text-xs font-medium transition-all">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>

                <span className=" text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  {isAutoplay ? "Video Chạy Tự Động" : "Video Cuộn Theo Màn"}
                </span>
              </div>

              <div className="h-3 w-[1px] bg-slate-200" />

              <span className=" text-[11px] font-bold text-sky-800">
                {formattedTime} <span className="text-slate-400 font-normal">/ {formatTime(durationRef.current)}</span>
              </span>

              <div className="h-3 w-[1px] bg-slate-200" />

              <button
                onClick={toggleAutoplay}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                title={isAutoplay ? "Chuyển sang chế độ cuộn theo màn" : "Chuyển sang tự động phát"}
              >
                {isAutoplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence> */}
    </div>
  );
};
