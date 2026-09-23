"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";

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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7 }}
      onClick={handleClick}
      className={`py-12 max-w-4xl mx-auto px-4 text-center flex flex-col items-center justify-center relative select-none ${
        targetId ? "cursor-pointer group" : ""
      }`}
    >
      {/* Delicate Vertical Thread Line */}
      <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-sky-400 to-sky-600 mb-4" />

      {/* High-Contrast Frosted Glass Atelier Story Card */}
      <div className="w-full max-w-3xl p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_16px_50px_rgba(11,30,59,0.09)] transition-all duration-300 group-hover:shadow-[0_20px_60px_rgba(11,30,59,0.14)] group-hover:border-sky-200/90 relative overflow-hidden">
        {/* Subtle top edge glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 opacity-80" />

        {/* Crisp High-Contrast Act Badge */}
        {actLabel && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1e3b] text-sky-200 text-xs font-bold tracking-[0.2em] uppercase shadow-md mb-4 group-hover:bg-sky-950 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>{actLabel}</span>
          </div>
        )}

        {/* Poetic Lead Quote in Playfair Display (font-serif) */}
        <h4 className="font-serif text-xl sm:text-2xl md:text-3xl italic font-bold text-[#0b1e3b] leading-snug group-hover:text-sky-950 transition-colors">
          "{leadText}"
        </h4>

        {/* Crisp Subtext with High Contrast */}
        <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed max-w-xl mx-auto mt-3">
          {subText}
        </p>

        {targetId && (
          <div className="pt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-sky-700 group-hover:text-teal-700 transition-colors">
            <span>Khám phá phần này</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </div>
        )}
      </div>

      {/* Continued Line */}
      <div className="w-[1px] h-12 bg-gradient-to-b from-sky-600 via-sky-400 to-transparent mt-4" />
    </motion.div>
  );
};
