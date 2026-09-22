"use client";

import React from "react";
import { motion } from "framer-motion";
import { PlacedCharm } from "@/types";
import { RotateCw, Trash2, Sparkles } from "lucide-react";

interface Charm2DItemProps {
  placed: PlacedCharm;
  isActive: boolean;
  onSelect: () => void;
  onRotate: () => void;
  onRemove: () => void;
}

// Render custom SVG artwork for each charm emblem
const renderCharmEmblem = (charmId: string, symbol: string) => {
  switch (charmId) {
    case "charm-caurong":
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
          {/* Dragon Bridge Arch */}
          <path
            d="M 5 28 Q 12 10, 20 18 T 35 15"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Dragon Head */}
          <path
            d="M 33 13 Q 38 10, 37 16 Q 34 18, 32 16 Z"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="1"
          />
          {/* Dragon Spine Fins */}
          <circle cx="14" cy="14" r="1.5" fill="#fef08a" />
          <circle cx="20" cy="18" r="1.5" fill="#fef08a" />
          <circle cx="26" cy="16" r="1.5" fill="#fef08a" />
          {/* Wave Base */}
          <path
            d="M 4 32 Q 10 28, 20 32 T 36 32"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      );

    case "charm-turtle":
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
          {/* Turtle Shell */}
          <ellipse cx="20" cy="20" rx="10" ry="12" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
          {/* Shell Patterns */}
          <polygon points="20,12 25,16 25,24 20,28 15,24 15,16" fill="none" stroke="#a7f3d0" strokeWidth="1.2" />
          <line x1="20" y1="12" x2="20" y2="8" stroke="#a7f3d0" strokeWidth="1.2" />
          <line x1="20" y1="28" x2="20" y2="32" stroke="#a7f3d0" strokeWidth="1.2" />
          {/* Head & Flippers */}
          <circle cx="20" cy="7" r="3" fill="#059669" />
          <path d="M 11 14 Q 5 11, 7 17 Z" fill="#059669" />
          <path d="M 29 14 Q 35 11, 33 17 Z" fill="#059669" />
          <path d="M 12 26 Q 8 30, 11 31 Z" fill="#059669" />
          <path d="M 28 26 Q 32 30, 29 31 Z" fill="#059669" />
        </svg>
      );

    case "charm-dolphin":
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
          {/* Jumping Dolphin */}
          <path
            d="M 8 28 C 12 12, 26 10, 32 14 C 28 18, 22 20, 16 26 C 14 28, 10 30, 8 28 Z"
            fill="#38bdf8"
            stroke="#0284c7"
            strokeWidth="1.2"
          />
          {/* Fin */}
          <polygon points="21,12 23,8 24,13" fill="#0284c7" />
          {/* Tail Flukes */}
          <polygon points="8,28 4,25 7,32" fill="#38bdf8" />
          <circle cx="30" cy="14" r="1" fill="#ffffff" />
          {/* Water Splash */}
          <path d="M 12 33 Q 18 30, 28 33" stroke="#bae6fd" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      );

    case "charm-whale-tail":
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
          {/* Tail Fluke */}
          <path
            d="M 20 28 L 20 21 C 12 18, 6 10, 8 8 C 12 13, 17 15, 20 18 C 23 15, 28 13, 32 8 C 34 10, 28 18, 20 21 Z"
            fill="#0284c7"
            stroke="#e0f2fe"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="18" r="2" fill="#38bdf8" />
        </svg>
      );

    case "charm-starfish":
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
          <polygon
            points="20,6 23,15 33,16 25,22 28,32 20,26 12,32 15,22 7,16 17,15"
            fill="#f59e0b"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="20" r="2.5" fill="#fef3c7" />
        </svg>
      );

    case "charm-nautilus":
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
          <path
            d="M 20 20 A 4 4 0 0 1 24 24 A 8 8 0 0 1 16 32 A 14 14 0 0 1 6 18 A 16 16 0 0 1 26 4 A 18 18 0 0 1 36 22"
            fill="none"
            stroke="#ec4899"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="20" cy="20" r="3" fill="#fbcfe8" />
        </svg>
      );

    case "charm-bioluminescent-drop":
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
          <path
            d="M 20 6 C 20 6, 10 18, 10 25 A 10 10 0 0 0 30 25 C 30 18, 20 6, 20 6 Z"
            fill="url(#drop-glow)"
            stroke="#22d3ee"
            strokeWidth="1.5"
          />
          <defs>
            <radialGradient id="drop-glow" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#cffafe" />
              <stop offset="60%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" />
            </radialGradient>
          </defs>
          <ellipse cx="17" cy="22" rx="2.5" ry="4" fill="#ffffff" opacity="0.6" />
        </svg>
      );

    case "charm-coral":
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
          <path
            d="M 20 34 L 20 22 M 20 25 Q 12 20, 10 12 M 16 21 Q 14 14, 17 8 M 20 22 Q 26 17, 28 10 M 23 20 Q 28 22, 31 16"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx="10" cy="12" r="2" fill="#fda4af" />
          <circle cx="17" cy="8" r="2" fill="#fda4af" />
          <circle cx="28" cy="10" r="2" fill="#fda4af" />
          <circle cx="31" cy="16" r="2" fill="#fda4af" />
        </svg>
      );

    case "charm-compass-anchor":
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-sm">
          <circle cx="20" cy="10" r="4" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="20" y1="14" x2="20" y2="33" stroke="#e2e8f0" strokeWidth="2.5" />
          <line x1="12" y1="18" x2="28" y2="18" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M 8 26 Q 20 36, 32 26" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
          <polygon points="8,26 6,22 10,23" fill="#e2e8f0" />
          <polygon points="32,26 30,23 34,22" fill="#e2e8f0" />
        </svg>
      );

    default:
      return <span className="text-2xl select-none">{symbol}</span>;
  }
};

export const Charm2DItem: React.FC<Charm2DItemProps> = ({
  placed,
  isActive,
  onSelect,
  onRotate,
  onRemove,
}) => {
  const { charm, rotation = 0 } = placed;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="relative flex flex-col items-center cursor-pointer select-none group"
      style={{
        transformOrigin: "top center",
      }}
    >
      {/* 1. Marine Stainless Snap Clasp (Móc khóa càng cua bấm vào mắt lưới) */}
      <div className="relative flex flex-col items-center -mb-1.5 z-10">
        {/* Top Ring looping through bag eyelet */}
        <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-gradient-to-b from-white via-slate-100 to-slate-400 shadow-sm flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700/40" />
        </div>
        {/* Metal link connector */}
        <div className="w-1.5 h-2.5 bg-gradient-to-b from-slate-200 to-slate-400 rounded-sm -mt-0.5 shadow-xs" />
      </div>

      {/* 2. Hanging Pendant Body with natural rotation & hover sway */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{
          scale: 1,
          rotate: rotation,
        }}
        whileHover={{
          scale: 1.1,
          rotate: rotation + 4,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 380, damping: 20 }}
        className="relative flex items-center justify-center cursor-pointer"
        style={{
          filter: "drop-shadow(0 10px 14px rgba(11, 30, 59, 0.35)) drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        }}
      >
        {/* Outer Beveled Luxury Medal Rim */}
        <div
          className="w-14 h-14 rounded-2xl p-1 flex items-center justify-center relative overflow-hidden transition-all shadow-inner"
          style={{
            background: `linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #64748b 100%)`,
            border: `1.5px solid rgba(255, 255, 255, 0.8)`,
            boxShadow: `inset 0 1px 3px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.25)`,
          }}
        >
          {/* Inner Enamel Jewel Face */}
          <div
            className="w-full h-full rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${charm.color}dd 0%, ${charm.color} 65%, #061020 100%)`,
            }}
          >
            {/* Top Gloss Reflection */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/45 to-transparent pointer-events-none rounded-t-xl" />

            {/* Custom Charm Emblem Icon */}
            <div className="relative z-10 flex items-center justify-center">
              {renderCharmEmblem(charm.id, charm.symbol)}
            </div>

            {/* Subtle Bioluminescent Ambient Glow */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                boxShadow: `inset 0 0 12px ${charm.glowColor || charm.color}`,
              }}
            />
          </div>
        </div>

        {/* Active Ring Indicator */}
        {isActive && (
          <motion.div
            layoutId="activeCharmRing"
            className="absolute -inset-2 rounded-3xl border-2 border-sky-400 pointer-events-none animate-pulse shadow-[0_0_12px_rgba(56,189,248,0.6)]"
          />
        )}
      </motion.div>

      {/* 3. Floating Tool Action Pill on Click */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-14 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 text-white shadow-2xl border border-white/20 backdrop-blur-md whitespace-nowrap"
        >
          <span className="text-[11px] font-bold text-sky-300 max-w-[120px] truncate">
            {charm.vietnameseName}
          </span>

          <div className="h-3 w-[1px] bg-white/20" />

          {/* Rotate 45° button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRotate();
            }}
            className="p-1 rounded-full hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Xoay 45° để chỉnh góc tự nhiên"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Remove charm button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded-full hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
            title="Tháo gỡ charm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </div>
  );
};
