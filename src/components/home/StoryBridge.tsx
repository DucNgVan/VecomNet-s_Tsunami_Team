"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Compass, ArrowDown } from "lucide-react";

interface StoryBridgeProps {
  actLabel: string;
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
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7 }}
      className="py-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center justify-center relative select-none"
    >
      {/* Delicate Vertical Story Thread Line */}
      <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-sky-300/80 to-sky-600 mb-4" />

      {/* Narrative Badge */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-100 shadow-[0_4px_16px_rgba(11,30,59,0.06)] hover:shadow-md transition-all text-sky-800 text-[11px] tracking-widest uppercase font-semibold cursor-pointer"
      >
        <Sparkles className="w-3 h-3 text-sky-500" />
        <span>{actLabel}</span>
        {targetId && <ArrowDown className="w-3 h-3 text-sky-500 animate-bounce" />}
      </motion.button>

      {/* Story Narrative */}
      <div className="mt-3 space-y-1 max-w-xl">
        <h4 className="text-base sm:text-lg italic text-[#0b1e3b] font-medium">
          "{leadText}"
        </h4>
        <p className="text-xs text-slate-500 font-normal">
          {subText}
        </p>
      </div>

      {/* Continued Line */}
      <div className="w-[1px] h-12 bg-gradient-to-b from-sky-600 via-sky-300/80 to-transparent mt-4" />
    </motion.div>
  );
};
