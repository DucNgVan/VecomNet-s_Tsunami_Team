"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BagBase, Charm, ProductCombo } from "@/types";
import { BagCard3D } from "@/components/3d/BagCard3D";
import { CharmCanvas3D } from "@/components/3d/CharmCanvas3D";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatVND, formatKg } from "@/lib/utils";
import {
  X,
  Sparkles,
  ShoppingBag,
  Wand2,
  CheckCircle2,
  ShieldCheck,
  RotateCw,
  Compass,
} from "lucide-react";

export type ProductDetailItem =
  | { type: "bag"; data: BagBase }
  | { type: "combo"; data: ProductCombo }
  | { type: "charm"; data: Charm };

interface ProductDetailModalProps {
  item: ProductDetailItem | null;
  onClose: () => void;
  onAddToCart: (item: ProductDetailItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  if (!item) return null;

  const isBag = item.type === "bag";
  const isCombo = item.type === "combo";
  const isCharm = item.type === "charm";

  const bagData = isBag ? (item.data as BagBase) : isCombo ? (item.data as ProductCombo).bagBase : null;
  const comboData = isCombo ? (item.data as ProductCombo) : null;
  const charmData = isCharm ? (item.data as Charm) : null;

  const title = isBag ? bagData!.name : isCombo ? comboData!.name : charmData!.vietnameseName;
  const price = isBag ? bagData!.basePrice : isCombo ? comboData!.price : charmData!.price;
  const plasticKg = isBag
    ? bagData!.plasticOffsetKg
    : isCombo
    ? comboData!.plasticOffsetKg
    : charmData!.plasticOffsetGrams / 1000;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#071326]/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col"
        >
          {/* Top Bar with Close Button */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0b1e3b] text-sky-200">
                {isBag ? "Phôi Túi Lưới NÉT" : isCombo ? "Bộ Sưu Tập Combo" : "Charm Thủy Tinh Biển Sâu"}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>-{formatKg(plasticKg)} rác biển</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
              aria-label="Đóng chi tiết"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Two Column Responsive */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: 3D Preview Stage */}
              <div className="md:col-span-6 flex flex-col items-center">
                <div className="w-full aspect-square rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200/90 relative overflow-hidden flex items-center justify-center shadow-inner">
                  {isCharm ? (
                    <CharmCanvas3D
                      modelUrl={charmData!.model3dUrl || "/assets/models/caurongcharm.glb"}
                      color={charmData!.color}
                      glowColor={charmData!.glowColor}
                      isInteractive={true}
                    />
                  ) : (
                    <BagCard3D
                      modelUrl="/assets/models/tuixach.glb"
                      color={isCombo ? comboData!.color.hex : bagData!.colors[0]?.hex}
                      glowColor={isCombo ? comboData!.color.glowHex : bagData!.colors[0]?.glowHex}
                      isInteractive={true}
                    />
                  )}

                  {/* 3D Hint */}
                  <div className="absolute bottom-2 inset-x-3 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 bg-white/90 backdrop-blur-md py-1 rounded-full border border-slate-200 shadow-xs pointer-events-none">
                    <RotateCw className="w-3 h-3 text-sky-600 animate-spin" style={{ animationDuration: "8s" }} />
                    <span>Vuốt xoay 360° mô hình 3D</span>
                  </div>
                </div>

                {isCombo && (
                  <div className="w-full mt-3 p-3 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs">
                    <span className="font-bold text-[#0b1e3b] block mb-1">Charm đính kèm trong set:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {comboData!.includedCharms.map((c) => (
                        <span
                          key={c.id}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 shadow-xs"
                        >
                          <span>{c.symbol}</span>
                          <span>{c.vietnameseName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Full Specifications & Description */}
              <div className="md:col-span-6 space-y-4">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b1e3b] leading-tight">
                    {title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {isBag
                      ? bagData!.description
                      : isCombo
                      ? comboData!.tagline
                      : charmData!.description}
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                  {isBag && (
                    <>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Kích thước</div>
                        <div className="font-bold text-slate-900 mt-0.5">{bagData!.dimensions}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Dung tích</div>
                        <div className="font-bold text-slate-900 mt-0.5">{bagData!.capacity}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Mắt neo charm</div>
                        <div className="font-bold text-teal-800 mt-0.5">{bagData!.maxCharms} mắt đính</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Vật liệu lưới</div>
                        <div className="font-bold text-slate-900 mt-0.5">Nylon-6 Tái Sinh</div>
                      </div>
                    </>
                  )}

                  {isCombo && (
                    <>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Phôi túi</div>
                        <div className="font-bold text-slate-900 mt-0.5">{comboData!.bagBase.name}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Màu sắc</div>
                        <div className="font-bold text-slate-900 mt-0.5">{comboData!.color.name}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Bảo chứng mẻ lưới</div>
                        <div className="font-bold text-teal-800 mt-0.5">Tọa độ rạn san hô Sơn Trà & Bãi Bụt</div>
                      </div>
                    </>
                  )}

                  {isCharm && (
                    <>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Chất liệu chế tác</div>
                        <div className="font-bold text-slate-900 mt-0.5">{charmData!.material}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Ý nghĩa</div>
                        <div className="font-bold text-teal-800 mt-0.5">Hộ Mệnh Bình An</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Rác biển thu gom</div>
                        <div className="font-bold text-emerald-700 mt-0.5">{charmData!.plasticOffsetGrams}g rác</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Price Display */}
                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block -mb-0.5">Giá niêm yết:</span>
                    <span className="font-serif text-2xl font-black text-[#0b1e3b]">
                      {formatVND(price)}
                    </span>
                  </div>
                  {isCombo && comboData!.originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatVND(comboData!.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 grid grid-cols-2 gap-2.5">
                  <GlassButton
                    variant="primary"
                    size="md"
                    onClick={() => {
                      onAddToCart(item);
                      onClose();
                    }}
                    className="w-full justify-center shadow-md cursor-pointer text-xs sm:text-sm font-bold"
                    icon={<ShoppingBag className="w-4 h-4" />}
                  >
                    Thêm Vào Giỏ
                  </GlassButton>

                  <Link
                    href={
                      isBag
                        ? `/story?mode=manual&bagId=${bagData!.id}`
                        : isCombo
                        ? `/story?mode=manual&bagId=${comboData!.bagBase.id}&colorId=${comboData!.color.id}`
                        : `/story?mode=manual`
                    }
                    className="w-full"
                  >
                    <GlassButton
                      variant="secondary"
                      size="md"
                      className="w-full justify-center cursor-pointer text-xs sm:text-sm font-bold"
                      icon={<Wand2 className="w-4 h-4 text-sky-700" />}
                    >
                      Vào NÉT Studio
                    </GlassButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
