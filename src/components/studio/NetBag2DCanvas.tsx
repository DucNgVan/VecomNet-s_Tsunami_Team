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

// Tỷ lệ chuyển đổi chuẩn xác 1:1 giữa toạ độ PlacedCharm (0-100) và vị trí màn hình Arch Frame (%)
// Đồng bộ tuyệt đối với phép chiếu phối cảnh PerspectiveCamera(45, 0.8) của BagCanvas3D
export const toScreenCoords = (placedX: number, placedY: number) => {
  // posX = ((placedX - 50) / 50) * 1.15 * (3.6 / 4.3) = ((placedX - 50) / 50) * 0.9628
  // Tại mặt trước túi (posZ ~ 0.55), chiều rộng nhìn thấy là 4.274 units (100% chiều ngang vòm)
  // => screenX = 50 + ((placedX - 50) / 50) * (0.9628 / 4.274) * 100 = 50 + (placedX - 50) * 0.4505
  const screenX = 50 + (placedX - 50) * 0.4505;

  // posY = (-((placedY - 50) / 50) * 1.25 - 0.15) * (3.6 / 4.3)
  // Chiều cao nhìn thấy là 5.343 units (100% chiều cao vòm)
  // => screenY = 52.35 + (placedY - 50) * 0.3917
  const screenY = 52.35 + (placedY - 50) * 0.3917;

  return { screenX, screenY };
};

export const toPlacedCoords = (
  deltaScreenX: number,
  deltaScreenY: number,
  initialX: number,
  initialY: number
) => {
  const deltaPlacedX = deltaScreenX / 0.4505;
  const deltaPlacedY = deltaScreenY / 0.3917;

  // Giới hạn an toàn trên diện tích vải thân túi (tránh rơi ra ngoài không khí hoặc trôi lên quai xách)
  const clampedX = Math.max(8, Math.min(92, Math.round(initialX + deltaPlacedX)));
  const clampedY = Math.max(48, Math.min(92, Math.round(initialY + deltaPlacedY)));

  return { clampedX, clampedY };
};

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
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);

  // Smooth Dragging with window listeners & delta offsets
  const dragInfoRef = useRef<{
    instanceId: string;
    pointerId: number;
    startX: number;
    startY: number;
    initialCharmX: number;
    initialCharmY: number;
  } | null>(null);

  const handlePointerDown = (
    instanceId: string,
    initialX: number,
    initialY: number,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (onSelectCharmInstance) onSelectCharmInstance(instanceId);
    setActiveDraggingId(instanceId);

    const pointerId = e.pointerId;
    dragInfoRef.current = {
      instanceId,
      pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialCharmX: initialX,
      initialCharmY: initialY,
    };

    const handleWindowPointerMove = (moveEvent: PointerEvent) => {
      if (!dragInfoRef.current || moveEvent.pointerId !== pointerId) return;
      if (!bagBoundaryRef.current) return;

      const rect = bagBoundaryRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const deltaPixelX = moveEvent.clientX - dragInfoRef.current.startX;
      const deltaPixelY = moveEvent.clientY - dragInfoRef.current.startY;

      const deltaScreenX = (deltaPixelX / rect.width) * 100;
      const deltaScreenY = (deltaPixelY / rect.height) * 100;

      const { clampedX, clampedY } = toPlacedCoords(
        deltaScreenX,
        deltaScreenY,
        dragInfoRef.current.initialCharmX,
        dragInfoRef.current.initialCharmY
      );

      onUpdateCharmPosition(instanceId, clampedX, clampedY);
    };

    const handleWindowPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
      dragInfoRef.current = null;
      setActiveDraggingId(null);
    };

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);
  };

  // Keyboard / arrow click stepping
  const moveActiveCharm = (dx: number, dy: number) => {
    if (!selectedCharmInstanceId) return;
    const target = placedCharms.find((c) => c.instanceId === selectedCharmInstanceId);
    if (!target) return;
    const newX = Math.max(8, Math.min(92, target.x + dx));
    const newY = Math.max(48, Math.min(92, target.y + dy));
    onUpdateCharmPosition(selectedCharmInstanceId, newX, newY);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Main Arch Frame - Chuẩn tỷ lệ & kích thước đồng nhất 100% với khung 3D */}
      <div className="w-full max-w-[440px] aspect-[4/5] bg-[#EFE9DF] rounded-t-[220px] rounded-b-[40px] shadow-sm relative overflow-hidden select-none border border-[#E8E2D8]">
        {/* Top Arch Label */}
        <div className="pt-3 text-center z-30 pointer-events-none">
          <span className="text-[11px] sm:text-[12px] font-serif tracking-[0.25em] text-[#7A6F68] uppercase font-semibold">
            NETS STUDIO
          </span>
        </div>

        {/* Bag Visual Layer - Căn giữa và khớp hoàn toàn kích thước & tỷ lệ treo với mô hình 3D */}
        <div className="absolute inset-0 z-10 flex items-center justify-center select-none pointer-events-none">
          {bagImageUrl ? (
            <img
              key={bagImageUrl}
              src={bagImageUrl}
              alt={selectedColorName ? `Túi xách NÉT (${selectedColorName})` : "Túi xách NÉT"}
              className="h-[70%] w-auto max-w-[85%] object-contain drop-shadow-[0_12px_24px_rgba(36,27,22,0.14)] select-none pointer-events-none transition-all duration-300"
              onError={(e) => {
                const target = e.currentTarget;
                const c = (selectedColorName || selectedColorHex || "").toLowerCase();
                const fallback =
                  c.includes("dương") || c.includes("blue")
                    ? "/assets/products/bags/tuixach-xanh-duong.png"
                    : c.includes("hồng") || c.includes("pink")
                    ? "/assets/products/bags/tuixach-hong.png"
                    : c.includes("tía") || c.includes("đỏ") || c.includes("burgundy")
                    ? "/assets/products/bags/tuixach-do-tia.png"
                    : c.includes("đen") || c.includes("black")
                    ? "/assets/products/bags/tuixach-den.png"
                    : "/assets/products/bags/tuixach-xanh-la.png";
                if (!target.src.includes(fallback)) {
                  target.src = fallback;
                }
              }}
            />
          ) : (
            <div className="h-[70%] aspect-[320/340] relative flex items-center justify-center pointer-events-none">
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
            </div>
          )}
        </div>

        {/* Interactive Charms Overlay - Phủ toàn bộ vòm để toScreenCoords tính chuẩn 1:1 với BagCanvas3D */}
        <div
          ref={bagBoundaryRef}
          className="absolute inset-0 z-20 pointer-events-auto"
        >
          {placedCharms.map((placed) => {
            const isSelected = placed.instanceId === selectedCharmInstanceId;
            const { screenX, screenY } = toScreenCoords(placed.x, placed.y);
            const isCustomCharm = Boolean(
              placed.charm.id.includes("custom") ||
              placed.instanceId.includes("custom")
            );
            const charmImg = isCustomCharm
              ? customCharmVisual?.imageUrl ||
                customCharmVisual?.referenceImageUrl ||
                placed.charm.image
              : placed.charm.image;

            return (
              <div
                key={placed.instanceId}
                onPointerDown={(e) => handlePointerDown(placed.instanceId, placed.x, placed.y, e)}
                style={{
                  position: "absolute",
                  left: `${screenX}%`,
                  top: `${screenY}%`,
                  transform: "translate(-50%, -50%)",
                  touchAction: "none",
                }}
                className={`group cursor-grab active:cursor-grabbing z-10 transition-transform ${
                  isSelected ? "scale-110 z-30" : "hover:scale-105"
                }`}
                title={`${placed.charm.vietnameseName || placed.charm.name || "Charm"} - Kéo để đổi vị trí`}
              >
                  {/* Metal Hang Ring / Loop on top */}
                  <div className="w-2.5 h-3 mx-auto rounded-full border-[1.5px] border-[#D4AF37] bg-transparent -mb-1 shadow-xs pointer-events-none" />

                  {/* Charm Graphic (Không còn khung vuông, hiển thị hình xoá phông tự nhiên trực tiếp lên túi) */}
                  {charmImg ? (
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center relative transition-transform ${
                        isSelected
                          ? "scale-115 drop-shadow-[0_0_12px_rgba(184,93,67,0.95)]"
                          : "drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]"
                      }`}
                    >
                      <img
                        src={charmImg}
                        alt={placed.charm.vietnameseName || placed.charm.name || "Charm"}
                        className="w-full h-full object-contain select-none pointer-events-none"
                      />

                      {/* Engraved text if custom */}
                      {isCustomCharm && customCharmVisual?.engravedText && (
                        <span className="text-[7.5px] font-mono tracking-tight text-white bg-black/60 px-1 rounded -mt-0.5 block max-w-[42px] truncate mx-auto text-center pointer-events-none">
                          {customCharmVisual.engravedText}
                        </span>
                      )}

                      {/* Active Drag Indicator Icon on hover */}
                      <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5 text-white pointer-events-none">
                        <Move className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  ) : (
                    /* Fallback badge only when no image exists */
                    <div
                      style={{
                        backgroundColor: placed.charm.color || "#38bdf8",
                      }}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center text-white shadow-md border-2 border-white/80 relative transition-all overflow-hidden ${
                        isSelected ? "ring-2 ring-[#B85D43] ring-offset-2" : ""
                      }`}
                    >
                      <span className="text-lg sm:text-xl font-bold leading-none select-none drop-shadow-xs">
                        {placed.charm.symbol || "✨"}
                      </span>
                      <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5 text-white pointer-events-none">
                        <Move className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
              <span>{is3dActive ? "2D" : "3D"}</span>
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
