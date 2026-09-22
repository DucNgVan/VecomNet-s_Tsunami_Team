"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX } from "lucide-react";
import { useIntro } from "@/context/IntroContext";

interface VideoIntroLoaderProps {
  onComplete?: () => void;
  onShrinkStart?: (currentTime: number) => void;
  forceShow?: boolean;
  onClose?: () => void;
}

interface StoryChapter {
  id: string;
  startTime: number;
  endTime: number;
  act: string;
  subtitle: string;
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "act-1",
    startTime: 0,
    endTime: 2.3,
    act: "HỒI I • ĐÁY BIỂN SÂU",
    subtitle: "Dưới tầng nước thẳm, những mắt lưới vô chủ chìm vào quên lãng...",
  },
  {
    id: "act-2",
    startTime: 2.3,
    endTime: 4.6,
    act: "HỒI II • HẢI TRÌNH THỨC GIẤC",
    subtitle: "Từng mét lưới ma được thu hồi, mở ra một cuộc giải cứu diệu kỳ...",
  },
  {
    id: "act-3",
    startTime: 4.6,
    endTime: 6.9,
    act: "HỒI III • TÁI SINH THỜI TRANG",
    subtitle: "Tái sinh thành kiệt tác thời trang mang linh hồn đại dương — NÉT.",
  },
];

export const VideoIntroLoader: React.FC<VideoIntroLoaderProps> = ({
  onComplete,
  onShrinkStart,
  forceShow = false,
  onClose,
}) => {
  const { setIsIntroPlaying } = useIntro();
  // Always auto-show fullscreen video on every link access or page reload
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasTriggeredShrink = useRef<boolean>(false);

  useEffect(() => {
    setIsVisible(true);
    setIsIntroPlaying(true);
    hasTriggeredShrink.current = false;
    setProgress(0);
    setActiveChapterIndex(0);

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    return () => {
      setIsIntroPlaying(false);
    };
  }, [forceShow, setIsIntroPlaying]);

  // Handle video playback and trigger shrink transition when finished
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVisible) return;

    video.play().catch(() => {});

    // Target cutoff: 6.9s (increased by +0.5s as requested)
    const targetEndTime = 6.9;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const pct = Math.min(100, Math.round((current / targetEndTime) * 100));
      setProgress(pct);

      // Update story chapter based on current playback timestamp
      const chapterIdx = STORY_CHAPTERS.findIndex(
        (c) => current >= c.startTime && current < c.endTime
      );
      if (chapterIdx !== -1) {
        setActiveChapterIndex((prev) => (prev !== chapterIdx ? chapterIdx : prev));
      }

      // Automatically trigger smooth shrink transition when video reaches target time
      if (current >= targetEndTime && !hasTriggeredShrink.current) {
        triggerShrinkAndOpen();
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [isVisible]);

  const triggerShrinkAndOpen = () => {
    if (hasTriggeredShrink.current) return;
    hasTriggeredShrink.current = true;
    setIsIntroPlaying(false);

    const currentTime = videoRef.current ? videoRef.current.currentTime : 0;
    if (onShrinkStart) {
      onShrinkStart(currentTime);
    }

    // Smoothly dissolve out directly into the page with zero border shrinkage
    setIsVisible(false);
    if (onClose) onClose();
    if (onComplete) onComplete();
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="video-intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-black pointer-events-auto flex items-center justify-center overflow-hidden select-none cursor-pointer"
          onClick={triggerShrinkAndOpen}
        >
          {/* Main Fullscreen Video Frame: 100% Tràn Màn Hình, ZERO Borders, ZERO Margins */}
          <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center">
            {/* Pure Video Element - Scaled up so NO gaps, borders, or empty spaces can ever appear */}
            <video
              ref={videoRef}
              src="/assets/hero-ocean.mp4"
              autoPlay
              muted={isMuted}
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover scale-[1.08] sm:scale-[1.06] origin-center filter brightness-[1.02] contrast-[1.03] transform-gpu"
            />

            {/* Subtle Vignette for cinema aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

            {/* Top Right Sound Toggle only (Discreet, zero text clutter) */}
            <div
              className="absolute top-6 right-6 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={toggleSound}
                className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-md"
                title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
              </button>
            </div>

            {/* Cinematic Storytelling Subtitles & Chapter Dots */}
            <div
              className="absolute bottom-8 sm:bottom-12 inset-x-0 z-20 flex flex-col items-center justify-center pointer-events-none px-6"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={STORY_CHAPTERS[activeChapterIndex]?.id || "default"}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center max-w-2xl mx-auto space-y-2.5"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs tracking-[0.25em] text-sky-300 uppercase shadow-md font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    <span>{STORY_CHAPTERS[activeChapterIndex]?.act}</span>
                  </div>
                  <p className="text-base sm:text-xl md:text-2xl text-white/95 leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] font-light italic px-4">
                    "{STORY_CHAPTERS[activeChapterIndex]?.subtitle}"
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Minimalist 3-Step Chapter Indicator */}
              <div className="flex items-center gap-2 mt-4">
                {STORY_CHAPTERS.map((ch, idx) => {
                  const isActive = activeChapterIndex === idx;
                  const isPast = activeChapterIndex > idx;
                  return (
                    <div
                      key={ch.id}
                      className={`h-1 transition-all duration-300 rounded-full ${
                        isActive
                          ? "w-8 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                          : isPast
                          ? "w-4 bg-white/60"
                          : "w-3 bg-white/20"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom 1.5px Hairline Video Progress Bar */}
            <div
              className="absolute bottom-0 inset-x-0 h-1.5 bg-white/15 overflow-hidden pointer-events-none"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
