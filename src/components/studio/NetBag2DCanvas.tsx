"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { PlacedCharm } from "@/types";
import { Move, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Sparkles } from "lucide-react";

interface CustomCharmVisual {
  shape: string;
  color: string;
  engravedText?: string;
  referenceImageUrl?: string;
  svgCode?: string;
  imageUrl?: string;
}

interface NetBag2DCanvasProps {
  placedCharms: PlacedCharm[];
  onUpdateCharmPosition: (instanceId: string, x: number, y: number) => void;
  onRemoveCharm: (instanceId: string) => void;
  selectedCharmInstanceId?: string | null;
  onSelectCharmInstance?: (instanceId: string | null) => void;
  customCharmVisual?: CustomCharmVisual | null;
  show3dToggle?: boolean;
  onToggle3D?: () => void;
  is3dActive?: boolean;
}

export const NetBag2DCanvas: React.FC<NetBag2DCanvasProps> = ({
  placedCharms,
  onUpdateCharmPosition,
  onRemoveCharm,
  selectedCharmInstanceId,
  onSelectCharmInstance,
  customCharmVisual,
  show3dToggle = false,
  onToggle3D,
  is3dActive = false,
}) => {
  const bagBoundaryRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Mouse / Touch Dragging logic
  const handlePointerDown = (instanceId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingId(instanceId);
    if (onSelectCharmInstance) onSelectCharmInstance(instanceId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !bagBoundaryRef.current) return;
    const rect = bagBoundaryRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Calculate percentage (0 to 100) inside bag area
    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;

    // Constrain within the tote body safe boundary
    const clampedX = Math.max(18, Math.min(82, Math.round(rawX)));
    const clampedY = Math.max(20, Math.min(78, Math.round(rawY)));

    onUpdateCharmPosition(draggingId, clampedX, clampedY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingId(null);
    }
  };

  // Keyboard / arrow click stepping
  const moveActiveCharm = (dx: number, dy: number) => {
    if (!selectedCharmInstanceId) return;
    const target = placedCharms.find((c) => c.instanceId === selectedCharmInstanceId);
    if (!target) return;
    const newX = Math.max(18, Math.min(82, target.x + dx));
    const newY = Math.max(20, Math.min(78, target.y + dy));
    onUpdateCharmPosition(selectedCharmInstanceId, newX, newY);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* 3D / 2D Toggle Switch if requested */}
      {show3dToggle && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onToggle3D}
            className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E8E2D8] text-xs font-semibold text-[#42342B] hover:text-[#B85D43] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B85D43]" />
            <span>{is3dActive ? "Chuyển bản phối 2D" : "Xem thử 3D"}</span>
          </button>
        </div>
      )}

      {/* Main Arch Frame */}
      <div className="w-full max-w-[440px] aspect-[4/5] bg-[#EFE9DF] rounded-t-[220px] rounded-b-[40px] p-6 sm:p-8 flex flex-col items-center justify-between shadow-sm relative overflow-hidden select-none border border-[#E8E2D8]">
        {/* Top Arch Label */}
        <div className="pt-3 text-center">
          <span className="text-[11px] sm:text-xs font-serif tracking-[0.25em] text-[#7A6F68] uppercase font-semibold">
            NÉT ORIGINAL / 01
          </span>
        </div>

        {/* The Bag Container & Dropzone */}
        <div
          ref={bagBoundaryRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full max-w-[320px] h-[340px] flex items-center justify-center my-auto"
        >
          {/* SVG Illustration of Bag */}
          <svg
            viewBox="0 0 320 340"
            className="w-full h-full drop-shadow-md overflow-visible pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Diamond Mesh Pattern */}
              <pattern
                id="netGridPattern"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <path
                  d="M 0 0 L 16 0 M 0 0 L 0 16"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeOpacity="0.28"
                />
              </pattern>

              {/* Bag Gradient for Depth */}
              <linearGradient id="bagShade" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2D5E4E" />
                <stop offset="50%" stopColor="#234B3E" />
                <stop offset="100%" stopColor="#1B3D32" />
              </linearGradient>

              {/* Strap Shadow */}
              <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Ground Shadow */}
            <ellipse
              cx="160"
              cy="318"
              rx="105"
              ry="14"
              fill="#D6CDBF"
              opacity="0.8"
            />

            {/* Handle / Straps (Tote Loops) */}
            <path
              d="M 105 130 C 105 25, 215 25, 215 130"
              fill="none"
              stroke="#1B3D32"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 105 130 C 105 32, 215 32, 215 130"
              fill="none"
              stroke="#2D5E4E"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Bag Body (Trapezoidal Tote with soft bottom curve) */}
            <path
              d="M 52 130 L 72 290 Q 160 310 248 290 L 268 130 Z"
              fill="url(#bagShade)"
              filter="url(#softShadow)"
            />

            {/* Diamond Net Mesh Overlay */}
            <path
              d="M 52 130 L 72 290 Q 160 310 248 290 L 268 130 Z"
              fill="url(#netGridPattern)"
            />

            {/* Bag Top Rim Trim */}
            <path
              d="M 48 130 Q 160 134 272 130"
              fill="none"
              stroke="#18362C"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Handle Anchorage Reinforcements */}
            <rect x="97" y="124" width="16" height="22" rx="4" fill="#18362C" />
            <rect x="207" y="124" width="16" height="22" rx="4" fill="#18362C" />

            {/* "nét" Brand Label Patch at Bottom Center */}
            <rect
              x="132"
              y="252"
              width="56"
              height="28"
              rx="4"
              fill="#FFFFFF"
              stroke="#E2DDD5"
              strokeWidth="1"
            />
            <text
              x="160"
              y="271"
              textAnchor="middle"
              fontFamily="Playfair Display, Georgia, serif"
              fontSize="16"
              fontWeight="600"
              fill="#241B16"
              letterSpacing="0.05em"
            >
              nét
            </text>
          </svg>

          {/* Interactive Charms Overlay */}
          <div className="absolute inset-0 pointer-events-auto">
            {placedCharms.map((placed) => {
              const isSelected = placed.instanceId === selectedCharmInstanceId;
              const isCustom = placed.charm.id.includes("custom") || placed.charm.category === "special" && placed.charm.name.includes("Custom");

              return (
                <div
                  key={placed.instanceId}
                  onPointerDown={(e) => handlePointerDown(placed.instanceId, e)}
                  style={{
                    position: "absolute",
                    left: `${placed.x}%`,
                    top: `${placed.y}%`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                  }}
                  className={`group cursor-grab active:cursor-grabbing z-10 transition-transform ${
                    isSelected ? "scale-110 z-20" : "hover:scale-105"
                  }`}
                  title={`${placed.charm.vietnameseName} - Kéo để đổi vị trí`}
                >
                  {/* Metal Hang Ring / Loop */}
                  <div className="w-2 h-2.5 mx-auto rounded-t-full border-1.5 border-[#D4AF37] bg-transparent -mb-0.5 shadow-xs" />

                  {/* Freeform Die-Cut Charm (Hiển thị ảnh 3D thật hoặc SVG vector) */}
                  {isCustom && customCharmVisual?.imageUrl ? (
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform ${
                        isSelected ? "scale-115 drop-shadow-[0_0_12px_rgba(184,93,67,0.9)]" : "drop-shadow-lg"
                      }`}
                    >
                      <img
                        src={customCharmVisual.imageUrl}
                        alt={customCharmVisual.engravedText || "Móc khoá 3D Nét"}
                        className="w-full h-full object-contain filter select-none pointer-events-none drop-shadow-md"
                      />
                      {customCharmVisual?.engravedText && (
                        <span className="absolute -bottom-1 text-[7px] font-mono tracking-tight text-white/95 truncate max-w-[48px] bg-black/75 px-1 py-0.5 rounded shadow">
                          {customCharmVisual.engravedText}
                        </span>
                      )}
                      {/* Active Drag Indicator Icon */}
                      <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5 text-white">
                        <Move className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  ) : isCustom && customCharmVisual?.svgCode ? (
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center relative transition-transform ${
                        isSelected ? "scale-110 drop-shadow-[0_0_10px_rgba(184,93,67,0.8)]" : "drop-shadow-md"
                      }`}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain drop-shadow"
                        dangerouslySetInnerHTML={{ __html: customCharmVisual.svgCode }}
                      />
                      {customCharmVisual?.engravedText && (
                        <span className="absolute -bottom-1 text-[7px] font-mono tracking-tight text-white/95 truncate max-w-[44px] bg-black/70 px-1 py-0.5 rounded shadow">
                          {customCharmVisual.engravedText}
                        </span>
                      )}
                      {/* Active Drag Indicator Icon */}
                      <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5 text-white">
                        <Move className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  ) : (
                    /* Standard / Fallback badge */
                    <div
                      style={{
                        backgroundColor: placed.charm.color || "#38bdf8",
                      }}
                      className={`w-11 h-11 sm:w-12 sm:h-12 ${
                        isCustom && customCharmVisual?.shape === "circle"
                          ? "rounded-full"
                          : isCustom && customCharmVisual?.shape === "teardrop"
                          ? "rounded-t-full rounded-b-md"
                          : isCustom && customCharmVisual?.shape === "heart"
                          ? "rounded-2xl"
                          : isCustom && customCharmVisual?.shape === "freeform"
                          ? "rounded-[16px_4px_16px_4px]"
                          : "rounded-xl"
                      } flex flex-col items-center justify-center text-white shadow-md border-2 border-white/80 relative transition-all overflow-hidden ${
                        isSelected ? "ring-2 ring-[#B85D43] ring-offset-2" : ""
                      }`}
                    >
                      {isCustom && customCharmVisual?.referenceImageUrl ? (
                        <img
                          src={customCharmVisual.referenceImageUrl}
                          alt="Custom Sketch"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg sm:text-xl font-bold leading-none select-none drop-shadow-xs">
                          {placed.charm.symbol || "✨"}
                        </span>
                      )}

                      {/* Engraved text if custom */}
                      {customCharmVisual?.engravedText && isCustom && (
                        <span className="text-[7.5px] font-mono tracking-tight text-white/95 mt-0.5 truncate max-w-[36px] bg-black/40 px-1 rounded">
                          {customCharmVisual.engravedText}
                        </span>
                      )}

                      {/* Active Drag Indicator Icon */}
                      <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5 text-white">
                        <Move className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Arch Note */}
        <div className="pb-1 text-center">
          <p className="text-[11px] text-[#7A6F68] font-light">
            Minh họa thiết kế · Mẫu thực tế có thể khác
          </p>
        </div>
      </div>

      {/* Mobile-Friendly Precise Position Arrows (Appears when a charm is selected) */}
      {selectedCharmInstanceId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] shadow-xs text-xs text-[#5E4D43]"
        >
          <span className="text-[11px] font-medium mr-1">Chỉnh vị trí:</span>
          <button
            onClick={() => moveActiveCharm(-4, 0)}
            className="p-1 rounded hover:bg-[#F3ECE1] text-[#2D231E]"
            title="Dịch trái"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => moveActiveCharm(4, 0)}
            className="p-1 rounded hover:bg-[#F3ECE1] text-[#2D231E]"
            title="Dịch phải"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => moveActiveCharm(0, -4)}
            className="p-1 rounded hover:bg-[#F3ECE1] text-[#2D231E]"
            title="Dịch lên"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => moveActiveCharm(0, 4)}
            className="p-1 rounded hover:bg-[#F3ECE1] text-[#2D231E]"
            title="Dịch xuống"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div className="h-3.5 w-px bg-[#E8E2D8] mx-1" />
          <button
            onClick={() => onRemoveCharm(selectedCharmInstanceId)}
            className="p-1 rounded hover:bg-rose-50 text-rose-600"
            title="Xóa charm khỏi túi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Footnote price bar under bag */}
      <div className="w-full max-w-[440px] flex items-center justify-between text-xs text-[#5E4D43] mt-3 px-2">
        <span className="font-semibold text-[#2D231E]">Túi Nét Original</span>
        <span>299.000 đ · Giá thử nghiệm</span>
      </div>
    </div>
  );
};
