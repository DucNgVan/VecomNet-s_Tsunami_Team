"use client";

import React from "react";
import { BagBase } from "@/types";
import { BAG_BASES } from "@/data/products";
import { formatVND } from "@/lib/utils";

interface BagSelectorProps {
  selectedBag: BagBase;
  onSelectBag: (bag: BagBase) => void;
}

export const BagSelector: React.FC<BagSelectorProps> = ({ selectedBag, onSelectBag }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {BAG_BASES.map((bag) => {
        const isSelected = selectedBag.id === bag.id;

        return (
          <button
            key={bag.id}
            onClick={() => onSelectBag(bag)}
            className={`p-3 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between cursor-pointer ${
              isSelected
                ? "bg-slate-50 border-[#0b1e3b] ring-2 ring-[#0b1e3b] shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200/90 shadow-subtle"
            }`}
          >
            <div>
              <div className="text-xs font-bold text-slate-900">{bag.name}</div>
              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {bag.capacity} • {bag.dimensions}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-sky-800">
                {formatVND(bag.basePrice)}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                {bag.plasticOffsetKg}kg
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
