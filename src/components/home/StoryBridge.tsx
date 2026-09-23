"use client";

import React from "react";
import { motion } from "framer-motion";

interface StoryBridgeProps {
  actLabel?: string;
  leadText: string;
  subText: string;
  targetId?: string;
}

export const StoryBridge: React.FC<StoryBridgeProps> = ({
  actLabel,
  leadText,
  subText,
  targetId,
}) => {
  const handleClick = () => {
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        const yOffset = -70;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6 }}
      onClick={handleClick}
      className={`py-8 max-w-3xl mx-auto px-4 text-center flex flex-col items-center justify-center relative select-none ${
        targetId ? "cursor-pointer group" : ""
      }`}
    >
      {/* Delicate Vertical Thread Line */}
      <div className="w-[1px] h-10 bg-gradient-to-b from-transparent via-sky-300/60 to-sky-500/80 mb-3" />

      {/* Subtle Editorial Act Label (No clunky pills) */}
      {actLabel && (
        <span className="text-[10px] tracking-[0.28em] uppercase text-sky-800/80 font-bold mb-1.5 transition-colors group-hover:text-sky-600">
          {actLabel}
        </span>
      )}

      {/* Story Narrative */}
      <div className="space-y-1 max-w-xl">
        <h4 className="text-base sm:text-lg italic text-[#0b1e3b] font-medium transition-colors group-hover:text-sky-800">
          "{leadText}"
        </h4>
        <p className="text-xs text-slate-500 font-normal leading-relaxed">
          {subText}
        </p>
      </div>

      {/* Continued Line */}
      <div className="w-[1px] h-10 bg-gradient-to-b from-sky-500/80 via-sky-300/60 to-transparent mt-3" />
    </motion.div>
  );
};
