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
  bagImageUrl?: string;
  selectedColorHex?: string;
  selectedColorName?: string;
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
  bagImageUrl,
  selectedColorHex,
  selectedColorName,
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

    // Constrain within the tote body and card safe boundary
    const clampedX = Math.max(10, Math.min(90, Math.round(rawX)));
    const clampedY = Math.max(12, Math.min(88, Math.round(rawY)));

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
    const newX = Math.max(10, Math.min(90, target.x + dx));
    const newY = Math.max(12, Math.min(88, target.y + dy));
    onUpdateCharmPosition(selectedCharmInstanceId, newX, newY);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Main Arch Frame */}
      <div className="w-full max-w-[440px] aspect-[4/5] bg-[#EFE9DF] rounded-t-[220px] rounded-b-[40px] p-6 sm:p-8 flex flex-col items-center justify-between shadow-sm relative overflow-hidden select-none border border-[#E8E2D8]">
        {/* Top Arch Label */}
        <div className="pt-3 text-center">
          <span className="text-[11px] sm:text-[12px] font-serif tracking-[0.25em] text-[#7A6F68] uppercase font-semibold">
            NETS STUDIO
          </span>
        </div>

        {/* The Bag Container & Dropzone */}
        <div
          ref={bagBoundaryRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full max-w-[320px] h-[340px] flex items-center justify-center my-auto"
        >
          {bagImageUrl ? (
            <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none p-2">
              <img
                src={bagImageUrl}
                alt={selectedColorName ? `Túi xách NÉT (${selectedColorName})` : "Túi xách NÉT"}
                className="max-w-full max-h-full object-contain drop-shadow-[0_12px_24px_rgba(36,27,22,0.14)] select-none pointer-events-none transition-all duration-300"
              />
            </div>
          ) : (
            /* SVG Illustration of Bag */
            <svg
              viewBox="0 0 320 340"
              className="w-full h-full drop-shadow-md overflow-visible pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
            <defs>
              {/* Fine Linen Mesh Texture Pattern */}
              <pattern
                id="netGridPattern"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 0 0 L 10 0 M 0 0 L 0 10"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeOpacity="0.22"
                />
              </pattern>

              {/* Real Nét Bag Teal Shading */}
              <linearGradient id="bagShade" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22AF9F" />
                <stop offset="45%" stopColor="#189B8D" />
                <stop offset="100%" stopColor="#107C70" />
              </linearGradient>

              {/* Padded Strap Shading */}
              <linearGradient id="strapShade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#25B5A5" />
                <stop offset="100%" stopColor="#148577" />
              </linearGradient>

              {/* Leather Patch Gradient */}
              <linearGradient id="leatherPatch" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EAD3AB" />
                <stop offset="100%" stopColor="#D5B685" />
              </linearGradient>

              {/* Realistic Ground Shadow */}
              <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1A2D27" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Ground Shadow */}
            <ellipse
              cx="160"
              cy="318"
              rx="125"
              ry="12"
              fill="#D6CDBF"
              opacity="0.7"
            />

            {/* Back Handle Arch */}
            <path
              d="M 108 140 C 108 30, 212 30, 212 140"
              fill="none"
              stroke="#0D6B60"
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Front Handle Arch */}
            <path
              d="M 104 145 C 104 36, 216 36, 216 145"
              fill="none"
              stroke="url(#strapShade)"
              strokeWidth="15"
              strokeLinecap="round"
            />
            {/* Handle Central Stitching Accent */}
            <path
              d="M 104 145 C 104 36, 216 36, 216 145"
              fill="none"
              stroke="#0E645A"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />

            {/* Bag Main Body (Structured Rectangular Tote matching the physical 3D scan) */}
            <rect
              x="38"
              y="135"
              width="244"
              height="172"
              rx="12"
              fill="url(#bagShade)"
              filter="url(#softShadow)"
            />

            {/* Linen Fabric Weave Overlay */}
            <rect
              x="38"
              y="135"
              width="244"
              height="172"
              rx="12"
              fill="url(#netGridPattern)"
            />

            {/* Structural Stitched Edge Piping */}
            <rect
              x="40"
              y="137"
              width="240"
              height="168"
              rx="10"
              fill="none"
              stroke="#0E685E"
              strokeWidth="2.5"
            />
            <rect
              x="43"
              y="140"
              width="234"
              height="162"
              rx="8"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="4 3"
              strokeOpacity="0.3"
            />

            {/* Top Rim Trim */}
            <path
              d="M 38 139 L 282 139"
              stroke="#0D5F56"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Handle Anchor Patches (Left & Right) */}
            <rect x="96" y="132" width="18" height="26" rx="4" fill="#11796D" stroke="#0E6157" strokeWidth="1.5" />
            <rect x="206" y="132" width="18" height="26" rx="4" fill="#11796D" stroke="#0E6157" strokeWidth="1.5" />

            {/* Signature Leather Patch: "Túi lưới & Charm Đà Nẵng" (Matches 3D Model 100%) */}
            <g id="leatherBrandBadge">
              <rect
                x="110"
                y="156"
                width="100"
                height="34"
                rx="4"
                fill="url(#leatherPatch)"
                stroke="#A8824C"
                strokeWidth="1.2"
                filter="url(#softShadow)"
              />
              {/* Stitching around patch */}
              <rect
                x="112"
                y="158"
                width="96"
                height="30"
                rx="3"
                fill="none"
                stroke="#7D5725"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
              {/* 4 Corner Rivets */}
              <circle cx="114" cy="160" r="1.2" fill="#52381B" />
              <circle cx="206" cy="160" r="1.2" fill="#52381B" />
              <circle cx="114" cy="186" r="1.2" fill="#52381B" />
              <circle cx="206" cy="186" r="1.2" fill="#52381B" />

              <text
                x="160"
                y="170"
                textAnchor="middle"
                fontFamily="Playfair Display, Georgia, serif"
                fontStyle="italic"
                fontSize="10"
                fontWeight="700"
                fill="#3B2613"
                letterSpacing="0.02em"
              >
                Túi lưới &amp; Charm
              </text>
              <text
                x="160"
                y="181"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="7.5"
                fontWeight="600"
                fill="#593C20"
                letterSpacing="0.08em"
              >
                ĐÀ NẴNG
              </text>
            </g>
          </svg>
          )}

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
                  {/* Metal Hang Ring / Loop only for non-custom standard charms */}
                  {!isCustom && (
                    <div className="w-2 h-2.5 mx-auto rounded-t-full border-1.5 border-[#D4AF37] bg-transparent -mb-0.5 shadow-xs" />
                  )}

                  {/* Custom Keychain Charm (Hiển thị phôi móc khoá 2D Die-Cut độc bản) */}
                  {isCustom && (customCharmVisual?.imageUrl || customCharmVisual?.referenceImageUrl || placed.charm.image) ? (
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform ${
                        isSelected ? "scale-115 drop-shadow-[0_0_12px_rgba(184,93,67,0.9)]" : "drop-shadow-lg"
                      }`}
                    >
                      <div className="w-full h-full flex items-center justify-center p-0.5 relative">
                        <img
                          src={customCharmVisual?.imageUrl || customCharmVisual?.referenceImageUrl || placed.charm.image}
                          alt={placed.charm.vietnameseName || "Móc khoá 2D Nét"}
                          className="w-full h-full object-contain select-none pointer-events-none drop-shadow-md"
                        />
                      </div>
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
                      ) : placed.charm.image ? (
                        <img
                          src={placed.charm.image}
                          alt={placed.charm.vietnameseName}
                          className="w-full h-full object-contain p-1"
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

        {/* 3D / 2D Toggle Switch at Bottom */}
        {show3dToggle && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap">
            <button
              type="button"
              onClick={onToggle3D}
              className="px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-xs sm:text-sm font-semibold text-[#42342B] hover:text-[#B85D43] transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B85D43]" />
              <span>{is3dActive ? "← Trở về bản phối 2D" : "✨ Xem thử 3D"}</span>
            </button>
          </div>
        )}
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
