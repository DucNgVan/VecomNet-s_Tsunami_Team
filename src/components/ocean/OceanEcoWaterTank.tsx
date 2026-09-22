"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Fish, ShieldCheck } from "lucide-react";

interface OceanEcoWaterTankProps {
  fillPercent: number; // 0 to 100
  plasticKg: number;
  marineSaved: number;
  className?: string;
}

export const OceanEcoWaterTank: React.FC<OceanEcoWaterTankProps> = ({
  fillPercent,
  plasticKg,
  marineSaved,
  className = "",
}) => {
  // Clamped between 15% and 92% for visual balance
  const clampedHeight = Math.min(Math.max(fillPercent, 18), 90);

  return (
    <div
      className={`relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden border border-sky-300/60 bg-gradient-to-b from-sky-950/5 via-sky-900/10 to-teal-950/20 shadow-[0_10px_35px_rgba(11,30,59,0.08)] backdrop-blur-md flex flex-col justify-end ${className}`}
    >
      {/* Tank Background Depth Lines & Metres */}
      <div className="absolute inset-0 flex justify-between px-4 py-3 pointer-events-none text-[10px] font-mono text-slate-400 font-bold z-20">
        <div className="space-y-6">
          <div className="flex items-center gap-1">
            <span className="w-2 h-[1px] bg-slate-300" />
            <span>MẶT BIỂN (0M)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-[1px] bg-slate-300" />
            <span>RẠN SAN HÔ (-15M)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-[1px] bg-slate-300" />
            <span>ĐÁY BIỂN TRỤC VỚT (-30M)</span>
          </div>
        </div>

        <div className="text-right">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 text-[10px] font-bold border border-emerald-300/40">
            DUNG TÍCH ĐẠI DƯƠNG TỰ NHIÊN
          </span>
        </div>
      </div>

      {/* Floating Animated Sea Life Inside Tank */}
      <motion.div
        animate={{
          x: ["-20%", "110%"],
          y: [0, -12, 4, -8, 0],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[28%] text-teal-600/70 z-20 pointer-events-none flex items-center gap-1.5"
      >
        <Fish className="w-6 h-6 animate-pulse" />
        <span className="text-[10px] font-mono font-bold bg-teal-50/80 px-1.5 py-0.5 rounded text-teal-800">
          +{marineSaved} sinh vật tự do
        </span>
      </motion.div>

      {/* Dynamic Rising Water Volume Layer */}
      <motion.div
        animate={{ height: `${clampedHeight}%` }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        className="w-full relative bg-gradient-to-t from-teal-700/60 via-sky-600/50 to-cyan-400/40 backdrop-blur-sm z-10"
      >
        {/* Animated Wave Surface Top (SVG Crest 1) */}
        <div className="absolute -top-7 left-0 w-[200%] h-8 overflow-hidden pointer-events-none">
          <motion.svg
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            className="w-full h-full"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          >
            <path
              d="M0,20 C150,5 300,35 450,20 C600,5 750,35 900,20 C1050,5 1200,35 1350,20 C1500,5 1650,35 1800,20 C1950,5 2100,35 2400,20 L2400,40 L0,40 Z"
              fill="rgba(56, 189, 248, 0.55)"
            />
          </motion.svg>
        </div>

        {/* Animated Wave Surface Top (SVG Crest 2 - Opposite Flow) */}
        <div className="absolute -top-7 left-0 w-[200%] h-8 overflow-hidden pointer-events-none">
          <motion.svg
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            className="w-full h-full"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          >
            <path
              d="M0,25 C180,38 360,10 540,25 C720,40 900,10 1080,25 C1260,40 1440,10 1620,25 C1800,40 1980,10 2400,25 L2400,40 L0,40 Z"
              fill="rgba(45, 212, 191, 0.45)"
            />
          </motion.svg>
        </div>

        {/* Subsurface Water Floating Bubbles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.span
              key={i}
              animate={{
                y: ["100%", "-20%"],
                x: [0, (i % 2 === 0 ? 8 : -8), 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 4 + i * 0.8,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut",
              }}
              style={{
                left: `${15 + i * 11}%`,
                width: `${6 + (i % 4) * 3}px`,
                height: `${6 + (i % 4) * 3}px`,
              }}
              className="absolute rounded-full bg-white/40 border border-white/60 shadow-sm"
            />
          ))}
        </div>

        {/* Water Surface Glow Label */}
        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white drop-shadow-md z-30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />
            <span className="text-xs font-bold font-mono tracking-wider uppercase">
              Mức độ thanh lọc đại dương
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-tight">
              {plasticKg.toLocaleString()} kg rác biển
            </div>
            <div className="text-[11px] text-cyan-100 font-medium">
              Được thu gom trực tiếp từ rạn san hô
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
