"use client";

import React from "react";
import { BagMeshColor } from "@/types";
import { BAG_COLORS } from "@/data/products";

interface MeshColorSelectorProps {
  selectedColor: BagMeshColor;
  onSelectColor: (color: BagMeshColor) => void;
}

export const MeshColorSelector: React.FC<MeshColorSelectorProps> = ({
  selectedColor,
  onSelectColor,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-slate-700 flex items-center justify-between">
        <span className="font-medium">Sắc Màu Lưới Biển:</span>
        <span className="font-bold text-[#0b1e3b]">{selectedColor.name}</span>
      </div>

      <div className="flex items-center gap-3">
        {BAG_COLORS.map((color) => {
          const isSelected = selectedColor.id === color.id;

          return (
            <button
              key={color.id}
              onClick={() => onSelectColor(color)}
              title={color.name}
              className={`group relative p-0.5 rounded-full transition-all duration-200 cursor-pointer ${
                isSelected ? "scale-110 ring-2 ring-[#0b1e3b] ring-offset-2" : "hover:scale-105 opacity-80 hover:opacity-100"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full border border-slate-300 shadow-sm flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${color.hex}, ${color.accentHex})`,
                }}
              >
                {isSelected && (
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-white shadow-sm"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 italic">{selectedColor.description}</p>
    </div>
  );
};
