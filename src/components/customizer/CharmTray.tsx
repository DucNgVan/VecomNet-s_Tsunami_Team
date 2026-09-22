"use client";

import React, { useState } from "react";
import { Charm, CharmCategory } from "@/types";
import { CHARMS } from "@/data/products";
import { formatVND } from "@/lib/utils";
import { Sparkles, Info, RotateCw, Check } from "lucide-react";
import { CharmCanvas3D } from "@/components/3d/CharmCanvas3D";

interface CharmTrayProps {
  selectedCharm: Charm | null;
  onSelectCharm: (charm: Charm | null) => void;
  remainingSlots: number;
}

export const CharmTray: React.FC<CharmTrayProps> = ({
  selectedCharm,
  onSelectCharm,
  remainingSlots,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories: { id: string; label: string }[] = [
    { id: "all", label: "Tất cả" },
    { id: "marine", label: "Sinh vật biển" },
    { id: "geometry", label: "Tỷ lệ vàng" },
    { id: "special", label: "Phát quang" },
    { id: "celestial", label: "Hàng hải" },
  ];

  const filteredCharms =
    activeCategory === "all"
      ? CHARMS
      : CHARMS.filter((c) => c.category === (activeCategory as CharmCategory));

  return (
    <div className="flex flex-col gap-3.5">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeCategory === cat.id
                ? "bg-[#0b1e3b] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Selected Charm 3D Live Inspector */}
      {selectedCharm ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-sky-50/60 border border-sky-300 flex items-center gap-3.5 shadow-sm">
          <div className="w-18 h-18 rounded-xl bg-white border border-slate-200 shadow-xs flex-shrink-0 relative overflow-hidden">
            <CharmCanvas3D
              modelUrl="/assets/models/caurongcharm.glb"
              color={selectedCharm.color}
              glowColor={selectedCharm.glowColor}
              isInteractive={true}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-sky-700 uppercase tracking-wider">
                ĐÃ CHỌN CHARM ĐỘC BẢN
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
              {selectedCharm.vietnameseName} • {formatVND(selectedCharm.price)}
            </div>
            <div className="text-[11px] text-sky-800 font-medium mt-0.5 flex items-center gap-1">
              <span>👉 Bấm vào các khuyên tròn trên túi để gắn charm vào vị trí bạn muốn</span>
            </div>
          </div>
          <button
            onClick={() => onSelectCharm(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-white cursor-pointer"
          >
            Đổi
          </button>
        </div>
      ) : (
        /* Guide Banner */
        <div className="flex items-center justify-between text-xs text-slate-700 px-3.5 py-2.5 rounded-xl bg-sky-50 border border-sky-200">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-700 flex-shrink-0" />
            <span className="font-medium">
              Chọn một charm bên dưới rồi bấm vào khuyên tròn trên túi để gắn
            </span>
          </span>
          <span className="font-bold font-mono text-sky-900 flex-shrink-0">
            Còn {remainingSlots} chỗ
          </span>
        </div>
      )}

      {/* Charm Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        {filteredCharms.map((charm) => {
          const isSelected = selectedCharm?.id === charm.id;

          return (
            <div
              key={charm.id}
              onClick={() => onSelectCharm(isSelected ? null : charm)}
              className={`relative rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-200 border bg-white ${
                isSelected
                  ? "border-[#0b1e3b] ring-2 ring-[#0b1e3b] shadow-md scale-105"
                  : "border-slate-200/90 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {/* Charm Specimen Preview */}
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl mb-2 border border-slate-200 shadow-sm relative overflow-hidden transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, ${charm.color} 55%, rgba(11,30,59,0.9) 100%)`,
                }}
              >
                <span>{charm.symbol}</span>
                <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/50 text-white backdrop-blur-xs">
                  3D
                </span>
              </div>

              {/* Title & Price */}
              <div className="text-xs font-bold text-slate-900 line-clamp-1">
                {charm.vietnameseName}
              </div>
              <div className="text-xs text-sky-800 font-mono font-bold mt-0.5">
                {formatVND(charm.price)}
              </div>

              {/* Eco plastic tag */}
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                <span>-{charm.plasticOffsetGrams}g rác</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
