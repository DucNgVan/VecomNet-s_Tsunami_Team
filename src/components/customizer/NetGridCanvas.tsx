"use client";

import React, { useState } from "react";
import { BagBase, BagMeshColor, PlacedCharm, Charm, AnchorPoint } from "@/types";
import { Trash2, RotateCw, Sparkles, CheckCircle2, Wand2, Info } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Charm2DItem } from "./Charm2DItem";

interface NetGridCanvasProps {
  bagBase: BagBase;
  selectedColor: BagMeshColor;
  placedCharms: PlacedCharm[];
  selectedCharmForPlacement: Charm | null;
  onPlaceCharm: (anchor: AnchorPoint, charm: Charm) => void;
  onRemoveCharm: (instanceId: string) => void;
  onRotateCharm: (instanceId: string) => void;
  activeAnchorId: string | null;
  setActiveAnchorId: (id: string | null) => void;
}

export const NetGridCanvas: React.FC<NetGridCanvasProps> = ({
  bagBase,
  selectedColor,
  placedCharms,
  selectedCharmForPlacement,
  onPlaceCharm,
  onRemoveCharm,
  onRotateCharm,
  activeAnchorId,
  setActiveAnchorId,
}) => {
  const [hoveredAnchor, setHoveredAnchor] = useState<AnchorPoint | null>(null);

  const getCharmAtAnchor = (anchorId: string) => {
    return placedCharms.find((p) => p.anchorId === anchorId);
  };

  const handleAnchorClick = (anchor: AnchorPoint) => {
    const existing = getCharmAtAnchor(anchor.id);
    if (existing) {
      setActiveAnchorId(activeAnchorId === anchor.id ? null : anchor.id);
      return;
    }

    if (selectedCharmForPlacement) {
      onPlaceCharm(anchor, selectedCharmForPlacement);

      // Micro-interaction: Confetti Sparkle burst on charm snap
      try {
        confetti({
          particleCount: 28,
          spread: 55,
          origin: {
            x: (anchor.x / 100) * 0.4 + 0.3,
            y: (anchor.y / 100) * 0.4 + 0.3,
          },
          colors: ["#0284c7", "#10b981", "#38bdf8", "#f59e0b", "#fbbf24"],
          ticks: 120,
          gravity: 1.2,
          scalar: 0.85,
          disableForReducedMotion: true,
        });
      } catch (e) {}
    } else {
      setActiveAnchorId(anchor.id);
    }
  };

  return (
    <div
      onClick={() => setActiveAnchorId(null)}
      className="relative w-full aspect-[4/5] max-w-[500px] mx-auto rounded-3xl overflow-hidden border border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/70 shadow-[0_16px_45px_rgba(11,30,59,0.08)] flex items-center justify-center p-4 sm:p-6 select-none"
    >
      {/* Studio Lighting & Architectural Grid Background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10px 10px, #cbd5e1 1.5px, transparent 0),
            linear-gradient(45deg, #f1f5f9 1px, transparent 1px),
            linear-gradient(-45deg, #f1f5f9 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Realistic Luxury 2D Bag Canvas Assembly */}
      <div className="relative w-full h-full flex flex-col items-center justify-center pt-2">
        {/* 1. Dual Woven Shoulder Straps with Stitching & Metal Buckles */}
        <div className="relative w-44 sm:w-48 h-24 sm:h-28 -mb-4 z-0 flex justify-between px-6 pointer-events-none">
          {/* Left Strap Arch */}
          <div
            className="w-8 h-full rounded-t-2xl border-x-2 border-t-2 shadow-sm relative overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${selectedColor.hex} 0%, #061020 100%)`,
              borderColor: "rgba(255, 255, 255, 0.4)",
            }}
          >
            {/* Center Stitching Line */}
            <div className="absolute inset-y-0 left-1/2 w-[1px] border-r border-dashed border-white/50" />
            {/* Metal Grommet at base */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-300 border border-slate-500 shadow-xs" />
          </div>

          {/* Right Strap Arch */}
          <div
            className="w-8 h-full rounded-t-2xl border-x-2 border-t-2 shadow-sm relative overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${selectedColor.hex} 0%, #061020 100%)`,
              borderColor: "rgba(255, 255, 255, 0.4)",
            }}
          >
            <div className="absolute inset-y-0 left-1/2 w-[1px] border-r border-dashed border-white/50" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-300 border border-slate-500 shadow-xs" />
          </div>
        </div>

        {/* 2. Structured Tote Bag Body with Woven Mesh Texture */}
        <div
          className="relative w-full flex-1 max-h-[380px] sm:max-h-[400px] rounded-3xl border-2 transition-all duration-500 flex items-center justify-center overflow-hidden shadow-2xl z-10"
          style={{
            borderColor: selectedColor.accentHex,
            background: `radial-gradient(circle at 50% 25%, ${selectedColor.hex}ee 0%, #061020 100%)`,
          }}
        >
          {/* Authentic Fishing Net Woven Diamond Pattern Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-35">
            <defs>
              <pattern
                id={`net-mesh-diamond-${selectedColor.id}`}
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 40 20 L 20 40 L 0 20 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle cx="20" cy="20" r="2.5" fill={selectedColor.accentHex} />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill={`url(#net-mesh-diamond-${selectedColor.id})`}
            />
          </svg>

          {/* Luxury Top Rim Binding with Stitched Trim */}
          <div
            className="absolute top-0 inset-x-0 h-8 border-b-2 flex items-center justify-between px-6 z-15"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.4) 100%)`,
              borderColor: selectedColor.accentHex,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                NÉT TOTE • BIO-LEATHER
              </span>
            </div>
            <span className="text-[9px] text-sky-200 font-bold uppercase">
              {selectedColor.name}
            </span>
          </div>

          {/* Bottom Bio-Leather Reinforced Panel */}
          <div
            className="absolute bottom-0 inset-x-0 h-10 border-t-2 flex items-center justify-between px-6 z-15"
            style={{
              background: `linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)`,
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <span className="text-[9px] text-white/70 tracking-wider">
              GIA CỐ ĐÁY CHỐNG TRẦY
            </span>
            <span className="text-[9px] text-emerald-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              100% Lưới Ma Biển Sâu
            </span>
          </div>

          {/* Subtle Fabric Fold Lighting & Shadows */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/30 pointer-events-none" />

          {/* 3. Anchor Points (Snap Eyelet Rings on Bag Face) */}
          {bagBase.anchorPoints.map((anchor) => {
            const placed = getCharmAtAnchor(anchor.id);
            const isHovered = hoveredAnchor?.id === anchor.id;
            const isActive = activeAnchorId === anchor.id;

            return (
              <div
                key={anchor.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnchorClick(anchor);
                }}
                onMouseEnter={() => setHoveredAnchor(anchor)}
                onMouseLeave={() => setHoveredAnchor(null)}
                style={{
                  left: `${anchor.x}%`,
                  top: `${anchor.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className="absolute z-20 cursor-pointer"
              >
                {placed ? (
                  /* Placed 2D Charm Item with Metal Ring & Emblems */
                  <Charm2DItem
                    placed={placed}
                    isActive={isActive}
                    onSelect={() => setActiveAnchorId(anchor.id)}
                    onRotate={() => onRotateCharm(placed.instanceId)}
                    onRemove={() => onRemoveCharm(placed.instanceId)}
                  />
                ) : (
                  /* Empty Metallic Snap Eyelet Grommet */
                  <div className="relative group/eyelet flex items-center justify-center">
                    {/* Metal Eyelet Ring */}
                    <motion.div
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                        selectedCharmForPlacement
                          ? "ring-4 ring-sky-400/80 bg-white text-[#0b1e3b] animate-bounce scale-110"
                          : isHovered || isActive
                          ? "ring-2 ring-emerald-400 bg-white text-[#0b1e3b] scale-125"
                          : "bg-gradient-to-b from-slate-200 via-slate-100 to-slate-400 border border-slate-400 text-slate-700"
                      }`}
                    >
                      {/* Inner Hole aperture */}
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          selectedCharmForPlacement
                            ? "bg-sky-600"
                            : isHovered
                            ? "bg-emerald-600"
                            : "bg-[#061020]"
                        }`}
                      />
                    </motion.div>

                    {/* Tooltip on Hover */}
                    <AnimatePresence>
                      {isHovered && !placed && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.9 }}
                          className="absolute -top-9 whitespace-nowrap bg-slate-900/95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl shadow-xl pointer-events-none z-30 border border-white/20"
                        >
                          {selectedCharmForPlacement ? (
                            <span className="flex items-center gap-1 text-sky-300">
                              <Wand2 className="w-3 h-3 text-sky-400" />
                              Gắn "{selectedCharmForPlacement.vietnameseName}" vào đây
                            </span>
                          ) : (
                            <span>Khuyên móc: {anchor.label}</span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-2 inset-x-4 flex items-center justify-between text-[11px] text-slate-600 pointer-events-none px-2 font-medium">
        <span className="flex items-center gap-1.5 text-sky-800 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Mắt Lưới 2D: Chạm để gắn & xoay charm</span>
        </span>
        <span className="text-slate-700 font-bold bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
          Đã gắn: {placedCharms.length}/{bagBase.maxCharms} charm
        </span>
      </div>
    </div>
  );
};
