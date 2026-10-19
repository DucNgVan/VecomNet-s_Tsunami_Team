"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NetsIntroLoaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
  onClose?: () => void;
}

export const NetsIntroLoader: React.FC<NetsIntroLoaderProps> = ({
  onComplete,
  forceShow = false,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [animationPhase, setAnimationPhase] = useState<"drawing" | "holding" | "fading">("drawing");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (forceShow) {
      setIsVisible(true);
      setAnimationPhase("drawing");
      return;
    }

    const hasShown = sessionStorage.getItem("net_intro_shown_session");
    if (hasShown === "true") {
      setIsVisible(false);
      if (onComplete) onComplete();
      return;
    }

    setIsVisible(true);
    setAnimationPhase("drawing");
  }, [forceShow, onComplete]);

  useEffect(() => {
    if (!isVisible) return;

    // Phase 1: Drawing cursive stroke (0 to 2.2s)
    const drawTimer = setTimeout(() => {
      setAnimationPhase("holding");
    }, 2200);

    // Phase 2: Hold & pause (2.2s to 3.2s)
    const fadeTimer = setTimeout(() => {
      setAnimationPhase("fading");
    }, 3200);

    // Phase 3: Dissolve out and complete (3.8s)
    const finishTimer = setTimeout(() => {
      handleFinish();
    }, 3800);

    return () => {
      clearTimeout(drawTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [isVisible]);

  const handleFinish = () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("net_intro_shown_session", "true");
      }
    } catch {}
    setIsVisible(false);
    if (onClose) onClose();
    if (onComplete) onComplete();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="nets-cursive-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleFinish}
          className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#FAF7F2] text-[#2D231E] flex flex-col items-center justify-center cursor-pointer select-none"
        >
          {/* Cursive Handwriting SVG Stage */}
          <div className="relative w-full max-w-xl px-8 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 390 190"
              className="w-full max-w-[460px] h-auto drop-shadow-sm overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Continuous cursive "Nets" handwritten path: N -> e -> t -> s */}
              <motion.path
                d="M 56 82 C 60 66, 72 58, 78 58 C 82 58, 83 72, 80 148 C 86 112, 112 58, 134 58 C 142 58, 145 72, 143 148 C 143 155, 148 155, 155 146 C 162 136, 172 104, 180 96 C 186 90, 192 92, 188 104 C 182 118, 166 128, 166 138 C 166 148, 178 152, 194 148 C 208 142, 224 96, 235 45 L 234 136 C 234 148, 244 150, 256 146 C 264 138, 276 110, 285 96 C 292 88, 276 88, 268 102 C 260 114, 272 122, 282 128 C 294 134, 296 146, 282 150 C 270 152, 264 146, 274 144 C 288 142, 310 144, 332 144"
                fill="none"
                stroke="#241B16"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 1.8,
                  ease: [0.45, 0.05, 0.25, 1],
                }}
              />

              {/* Stroke 2: Crossbar for the 't' */}
              <motion.path
                d="M 218 84 C 230 82, 246 82, 256 84"
                fill="none"
                stroke="#241B16"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.35,
                  delay: 1.35,
                  ease: "easeInOut",
                }}
              />
            </svg>

            {/* Subtle editorial subtitle fading in gracefully */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: animationPhase === "holding" || animationPhase === "fading" ? 0.75 : 0,
                y: animationPhase === "holding" || animationPhase === "fading" ? 0 : 10,
              }}
              transition={{ duration: 0.6 }}
              className="mt-6 text-center"
            >
              <span className="text-xs sm:text-sm tracking-[0.28em] uppercase text-[#7A6F68] font-medium">
                Từ biển cả · Đến ký ức riêng
              </span>
            </motion.div>

            {/* Skip hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.0 }}
              className="absolute -bottom-16 text-[11px] text-[#9E9289] tracking-wider"
            >
              Chạm vào màn hình để bắt đầu
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
