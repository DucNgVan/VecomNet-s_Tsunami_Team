"use client";

import React from "react";
import { BagBase, BagMeshColor, PlacedCharm } from "@/types";
import { formatVND, formatKg } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";
import { Sparkles, ShoppingBag, Camera, RotateCcw, ShieldCheck } from "lucide-react";

interface LivePriceCardProps {
  bagBase: BagBase;
  selectedColor: BagMeshColor;
  placedCharms: PlacedCharm[];
  onOpenSnapshot: () => void;
  onAddToCart: () => void;
  onReset: () => void;
}

export const LivePriceCard: React.FC<LivePriceCardProps> = ({
  bagBase,
  selectedColor,
  placedCharms,
  onOpenSnapshot,
  onAddToCart,
  onReset,
}) => {
  const charmsTotal = placedCharms.reduce((sum, p) => sum + p.charm.price, 0);
  const totalPrice = bagBase.basePrice + charmsTotal;

  const charmsPlasticGrams = placedCharms.reduce(
    (sum, p) => sum + p.charm.plasticOffsetGrams,
    0
  );
  const totalPlasticKg = bagBase.plasticOffsetKg + charmsPlasticGrams / 1000;
  const co2ReducedKg = totalPlasticKg * 2.4;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.06)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-sky-700 font-bold">
            Cấu hình độc bản của bạn
          </span>
          <h3 className="text-base font-bold text-slate-900">{bagBase.name}</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer font-medium"
          title="Làm mới lại"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm lại</span>
        </button>
      </div>

      {/* Itemized Pricing */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>
            {bagBase.name} ({selectedColor.name})
          </span>
          <span className="font-mono font-semibold text-slate-900">
            {formatVND(bagBase.basePrice)}
          </span>
        </div>

        {placedCharms.length > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Phụ kiện Charm ({placedCharms.length} món):</span>
            <span className="font-mono font-semibold text-sky-800">
              +{formatVND(charmsTotal)}
            </span>
          </div>
        )}

        <div className="pt-2.5 border-t border-slate-100 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900">Tổng Giá Trị:</span>
          <span className="text-2xl font-black font-mono text-[#0b1e3b]">
            {formatVND(totalPrice)}
          </span>
        </div>
      </div>

      {/* Environmental Impact Counter Badge */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="text-emerald-900 font-bold">
            Thu hồi {formatKg(totalPlasticKg)} rác lưới ma
          </div>
          <div className="text-[11px] text-emerald-700">
            Giảm ~{co2ReducedKg.toFixed(1)}kg CO2 phát thải vào khí quyển
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <GlassButton
          variant="secondary"
          size="md"
          onClick={onOpenSnapshot}
          icon={<Camera className="w-4 h-4 text-slate-700" />}
          className="text-xs font-bold"
        >
          Xuất Bản Vẽ
        </GlassButton>

        <GlassButton
          variant="primary"
          size="md"
          onClick={onAddToCart}
          icon={<ShoppingBag className="w-4 h-4" />}
          className="text-xs font-bold shadow-md"
        >
          Thêm Vào Giỏ
        </GlassButton>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Gia công thủ công chính xác theo đúng mắt lưới bạn chọn</span>
      </div>
    </div>
  );
};
