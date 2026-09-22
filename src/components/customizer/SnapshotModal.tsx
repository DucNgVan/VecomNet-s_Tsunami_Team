"use client";

import React from "react";
import { BagBase, BagMeshColor, PlacedCharm } from "@/types";
import { formatVND, formatKg } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";
import { X, Download, FileCheck, CheckCircle2 } from "lucide-react";

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  bagBase: BagBase;
  selectedColor: BagMeshColor;
  placedCharms: PlacedCharm[];
  snapshotImageUrl?: string | null;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  bagBase,
  selectedColor,
  placedCharms,
  snapshotImageUrl,
}) => {
  if (!isOpen) return null;

  const charmsTotal = placedCharms.reduce((sum, p) => sum + p.charm.price, 0);
  const totalPrice = bagBase.basePrice + charmsTotal;
  const totalOffset =
    bagBase.plasticOffsetKg +
    placedCharms.reduce((sum, p) => sum + p.charm.plasticOffsetGrams, 0) / 1000;

  const handleDownload = () => {
    if (snapshotImageUrl) {
      const a = document.createElement("a");
      a.href = snapshotImageUrl;
      a.download = `NET-Custom-${bagBase.id}-${Date.now()}.png`;
      a.click();
    } else {
      alert("Đang chuẩn bị bản vẽ kỹ thuật...");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col gap-6 relative text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0b1e3b]">Bản Vẽ Thiết Kế Kỹ Thuật (Nét Spec)</h3>
            <p className="text-xs text-slate-500">
              Mã kỹ thuật xuất xưởng dùng để gia công và kiểm tra chất lượng (QC)
            </p>
          </div>
        </div>

        {/* Blueprint Visual Preview */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center min-h-[260px]">
          {/* Subtle blueprint grid */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {snapshotImageUrl ? (
            <img
              src={snapshotImageUrl}
              alt="Custom bag snapshot"
              className="max-h-[220px] object-contain relative z-10 drop-shadow-md"
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center text-center p-4">
              <div className="text-4xl mb-2">👜</div>
              <div className="text-sm font-bold text-slate-900">{bagBase.name}</div>
              <div className="text-xs text-slate-600 mt-1">Sắc màu: {selectedColor.name}</div>
              <div className="text-xs text-emerald-700 font-mono font-bold mt-2 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Bảo vệ {formatKg(totalOffset)} rác lưới ma
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-4 text-[10px] font-mono font-bold text-slate-500">
            NÉT OCEAN CRAFTSMAN SPECIFICATION • VERIFIED
          </div>
        </div>

        {/* Charm Anchor Coordinates Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
            Tọa Độ Mắt Lưới & Phụ Kiện Đính Kèm ({placedCharms.length} vị trí):
          </h4>

          {placedCharms.length === 0 ? (
            <div className="text-xs text-slate-500 italic p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              Chưa có charm nào được gắn. Bạn có thể quay lại và kéo chọn charm từ khay.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {placedCharms.map((p, idx) => (
                <div
                  key={p.instanceId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center font-mono text-[10px] text-slate-700 font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-base">{p.charm.symbol}</span>
                    <span className="text-slate-900 font-semibold">{p.charm.vietnameseName}</span>
                  </div>
                  <div className="text-right font-mono text-[11px] text-sky-800 font-bold">
                    Mắt #{p.anchorId.toUpperCase()} ({p.rotation}°)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="text-left w-full sm:w-auto">
            <div className="text-xs text-slate-500">Tổng giá trị đơn hàng:</div>
            <div className="text-xl font-black font-mono text-[#0b1e3b]">
              {formatVND(totalPrice)}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <GlassButton
              variant="secondary"
              size="md"
              onClick={handleDownload}
              icon={<Download className="w-4 h-4 text-slate-700" />}
            >
              Tải Bản Vẽ Kỹ Thuật
            </GlassButton>
            <GlassButton
              variant="primary"
              size="md"
              onClick={onClose}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Xác Nhận & Tiếp Tục
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};
