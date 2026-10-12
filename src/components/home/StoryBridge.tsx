"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface StoryBridgeProps {
  actLabel?: string;
  leadText: string;
  subText: string;
  targetId?: string;
}

export const StoryBridge: React.FC<StoryBridgeProps> = ({
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
      className={`py-2 sm:py-4 max-w-4xl mx-auto px-4 text-center flex flex-col items-center justify-center relative select-none ${
        targetId ? "cursor-pointer group" : ""
      }`}
    >
      {/* Delicate Vertical Thread Line */}
      <div className="w-[1px] h-4 sm:h-6 bg-gradient-to-b from-transparent via-sky-400 to-sky-600 mb-1 sm:mb-2" />

      {/* High-Contrast Frosted Glass Atelier Story Card */}
      <div className="w-full max-w-2xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_rgba(11,30,59,0.06)] transition-all duration-300 group-hover:shadow-[0_16px_45px_rgba(11,30,59,0.1)] group-hover:border-sky-200/90 relative overflow-hidden">
        {/* Subtle top edge glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 opacity-80" />

        {/* Poetic Lead Quote in Playfair Display (font-serif) */}
        <h4 className="font-serif text-base sm:text-2xl italic font-bold text-[#0b1e3b] leading-snug group-hover:text-sky-950 transition-colors">
          "{leadText}"
        </h4>

        {/* Crisp Subtext: Hidden on Mobile to avoid text overload */}
        <p className="hidden sm:block text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-xl mx-auto mt-1.5">
          {subText}
        </p>

        {targetId && (
          <div className="pt-2 sm:pt-2.5 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold text-sky-700 group-hover:text-teal-700 transition-colors">
            <span>Cuộn xem phần này</span>
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </div>
        )}
      </div>

      {/* Continued Line */}
      <div className="w-[1px] h-4 sm:h-6 bg-gradient-to-b from-sky-600 via-sky-400 to-transparent mt-1 sm:mt-2" />
    </motion.div>
  );
};

