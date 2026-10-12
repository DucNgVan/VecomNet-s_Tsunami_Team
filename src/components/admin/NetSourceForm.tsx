"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TraceBatch } from "@/types";
import { saveNewBatch, generateUniqueBatchId } from "@/lib/netSourceStorage";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import {
  Sparkles,
  MapPin,
  Anchor,
  ShieldCheck,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  Wand2,
} from "lucide-react";

export function NetSourceForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    seaRegion: "Rạn San Hô Bán Đảo Sơn Trà, Vịnh Đà Nẵng",
    locationDetails: "Tọa độ 16°06'08.6\"N 108°15'39.9\"E, độ sâu 18m",
    lat: 16.1024,
    lng: 108.2611,
    depthMeters: 18,
    recoveryDate: "10/10/2024",
    plasticRecoveredKg: 142.5,
    marineAnimalsSavedCount: 14,
    recoveryTeam: "Biệt Đội Thợ Lặn Bảo Tồn Biển Sơn Trà & NÉT Ocean Labs",
    netPolymer: "Nylon-6 (Polyamide siêu bền)",
    colorway: "Xanh Thẳm Đại Dương",
    assignedPrototypeSku: "NET-PROTO-DN-01",
    story:
      "Lô lưới ma chìm hơn 2 năm quấn chặt vào rạn san hô sừng hươu tại Mũi Nghê - Sơn Trà. Nhóm thợ lặn cắt gỡ thành công 142.5kg cước nilon và giải cứu 3 cá thể rùa biển nhỏ.",
  });

  const [generatedBatch, setGeneratedBatch] = useState<TraceBatch | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick 1-click preset for startup pitching demo
  const handleLoadDemoPreset = () => {
    setFormData({
      seaRegion: "Rạn San Hô Bán Đảo Sơn Trà, Vịnh Đà Nẵng (Khu Vực DN-03)",
      locationDetails: "Tọa độ 16°06'08.6\"N 108°15'39.9\"E, độ sâu 18m",
      lat: 16.1024,
      lng: 108.2611,
      depthMeters: 18,
      recoveryDate: "10/10/2024",
      plasticRecoveredKg: 142.5,
      marineAnimalsSavedCount: 14,
      recoveryTeam: "Biệt Đội Thợ Lặn Bảo Tồn Biển Sơn Trà & NÉT Ocean Labs",
      netPolymer: "Nylon-6 (Polyamide siêu bền)",
      colorway: "Xanh Thẳm Đại Dương",
      assignedPrototypeSku: "NET-PROTO-DN-01",
      story:
        "Lô lưới ma chìm hơn 2 năm quấn chặt vào rạn san hô sừng hươu tại Mũi Nghê - Sơn Trà. Nhóm thợ lặn cắt gỡ thành công 142.5kg cước nilon và giải cứu 3 cá thể rùa biển nhỏ.",
    });
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();

    const batchId = generateUniqueBatchId("DN");
    const calculatedYieldBags = Math.floor(formData.plasticRecoveredKg / 0.85);
    const co2OffsetKg = Number((formData.plasticRecoveredKg * 1.9).toFixed(1));

    const newBatch: TraceBatch = {
      batchId,
      seaRegion: formData.seaRegion,
      locationDetails: formData.locationDetails,
      coordinates: {
        lat: Number(formData.lat),
        lng: Number(formData.lng),
      },
      recoveryDate: formData.recoveryDate,
      plasticRecoveredKg: Number(formData.plasticRecoveredKg),
      marineAnimalsSavedCount: Number(formData.marineAnimalsSavedCount),
      depthMeters: Number(formData.depthMeters),
      recoveryTeam: formData.recoveryTeam,
      verificationHash: `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}`,
      images: [
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=80",
      ],
      story: formData.story,
      netPolymer: formData.netPolymer,
      colorway: formData.colorway,
      assignedPrototypeSku: formData.assignedPrototypeSku,
      calculatedYieldBags,
      co2OffsetKg,
      createdAt: new Date().toISOString(),
    };

    saveNewBatch(newBatch);
    setGeneratedBatch(newBatch);
  };

  const handleCopyBatchId = () => {
    if (!generatedBatch) return;
    navigator.clipboard.writeText(generatedBatch.batchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Module 3 Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0b1e3b] text-teal-300 flex items-center justify-center flex-shrink-0">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 uppercase">
                MODULE 3 • BƯỚC 1 & 2
              </span>
              <span className="text-sm font-bold text-[#0b1e3b]">
                NÉT Source — Cổng Nhập Liệu & Số Hóa Lô Lưới Biển
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuyển đổi rác lưới ma vật lý thành tài sản dữ liệu truy xuất nguồn gốc (Batch ID) ngay tại xưởng.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadDemoPreset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-600" />
          <span>⚡ Nạp Mẫu Demo Pitch (1-Click)</span>
        </button>
      </div>

      {/* Generated Batch Success Card (Step 2 & 3 in Demo Flow) */}
      {generatedBatch && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-sky-50/40 to-teal-50/30 border-2 border-teal-500/80 shadow-2xl space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded">
                  BƯỚC 2: SINH MÃ BATCH ID THÀNH CÔNG
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b1e3b] flex items-center gap-3">
                <span>{generatedBatch.batchId}</span>
                <button
                  onClick={handleCopyBatchId}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                  title="Sao chép mã"
                >
                  <Copy className="w-5 h-5" />
                </button>
                {copied && (
                  <span className="text-xs font-semibold text-emerald-600 font-sans">
                    Đã sao chép!
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-500">Phôi Túi Đang Gán (Bước 3)</div>
                <div className="font-mono text-sm font-bold text-[#0b1e3b]">
                  {generatedBatch.assignedPrototypeSku}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-sm">
                <QrCode className="w-8 h-8 text-[#0b1e3b]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">Khối Lượng Thu Hồi</div>
              <div className="text-lg font-bold text-teal-700 mt-0.5">
                {generatedBatch.plasticRecoveredKg} kg
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">Sản Lượng Dự Kiến</div>
              <div className="text-lg font-bold text-[#0b1e3b] mt-0.5">
                ~{generatedBatch.calculatedYieldBags} túi
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">Giảm Phát Thải CO2</div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">
                -{generatedBatch.co2OffsetKg} kg
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">Độ Sâu Vớt</div>
              <div className="text-lg font-bold text-sky-700 mt-0.5">
                {generatedBatch.depthMeters}m đáy biển
              </div>
            </div>
          </div>

          {/* Action CTAs for Demo Flow */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
            <a
              href={`/passport/${encodeURIComponent(generatedBatch.batchId)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Xem Thử NÉT Story Passport (Thẻ Căn Cước Số)</span>
            </a>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <GlassButton
                variant="primary"
                size="md"
                onClick={() =>
                  router.push(
                    `/quiz?batchId=${encodeURIComponent(generatedBatch.batchId)}`
                  )
                }
                className="w-full sm:w-auto flex items-center justify-center gap-2 font-bold shadow-lg"
              >
                <span>Chuyển Sang Khách Hàng (Bước 4: NÉT Studio & Quiz)</span>
                <ArrowRight className="w-4 h-4" />
              </GlassButton>
            </div>
          </div>
        </motion.div>
      )}

      {/* Input Ingestion Form */}
      <form onSubmit={handleCreateBatch} className="space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-serif text-lg font-bold text-[#0b1e3b] border-b border-slate-100 pb-3">
            Thông Tin Lô Lưới Ma Thu Gom Từ Đại Dương
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Vùng Biển Thu Gom / Tên Rạn San Hô
              </label>
              <input
                type="text"
                required
                value={formData.seaRegion}
                onChange={(e) =>
                  setFormData({ ...formData, seaRegion: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0b1e3b] focus:outline-none focus:border-[#0b1e3b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Đội Thợ Lặn Trục Vớt / Đơn Vị Đối Tác
              </label>
              <input
                type="text"
                required
                value={formData.recoveryTeam}
                onChange={(e) =>
                  setFormData({ ...formData, recoveryTeam: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0b1e3b] focus:outline-none focus:border-[#0b1e3b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Tọa Độ GPS (Vĩ độ / Kinh độ)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Vĩ độ (Lat)"
                  value={formData.lat}
                  onChange={(e) =>
                    setFormData({ ...formData, lat: parseFloat(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0b1e3b] focus:outline-none focus:border-[#0b1e3b]"
                />
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Kinh độ (Lng)"
                  value={formData.lng}
                  onChange={(e) =>
                    setFormData({ ...formData, lng: parseFloat(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0b1e3b] focus:outline-none focus:border-[#0b1e3b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Khối Lượng Lưới (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.plasticRecoveredKg}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plasticRecoveredKg: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0b1e3b] focus:outline-none focus:border-[#0b1e3b]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Độ Sâu Trục Vớt (mét)
                </label>
                <input
                  type="number"
                  required
                  value={formData.depthMeters}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      depthMeters: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0b1e3b] focus:outline-none focus:border-[#0b1e3b]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Loại Hạt Nhựa / Polymer Lưới
              </label>
              <select
                value={formData.netPolymer}
                onChange={(e) =>
                  setFormData({ ...formData, netPolymer: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0b1e3b] focus:outline-none focus:border-[#0b1e3b]"
              >
                <option value="Nylon-6 (Polyamide siêu bền)">
                  Nylon-6 (Polyamide sợi đan lưới giã cào)
                </option>
                <option value="HDPE (High-Density Polyethylene)">
                  HDPE (Polyethylene mật độ cao)
                </option>
                <option value="Polypropylene (PP Cước Biển)">
                  Polypropylene (PP Cước Biển)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Mã SKU Phôi Túi Gán Vào (Prototype SKU)
              </label>
              <input
                type="text"
                required
                value={formData.assignedPrototypeSku}
                onChange={(e) =>
                  setFormData({ ...formData, assignedPrototypeSku: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-[#0b1e3b] focus:outline-none focus:border-[#0b1e3b]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Nhật Ký Trục Vớt & Tác Động Hệ Sinh Thái
            </label>
            <textarea
              rows={3}
              value={formData.story}
              onChange={(e) =>
                setFormData({ ...formData, story: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0b1e3b] focus:outline-none focus:border-[#0b1e3b]"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <GlassButton
              variant="primary"
              size="lg"
              type="submit"
              className="flex items-center gap-2 font-bold shadow-md"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Tạo Lô & Tự Động Sinh Mã Batch ID (Bước 1 → Bước 2)</span>
            </GlassButton>
          </div>
        </div>
      </form>
    </div>
  );
}
