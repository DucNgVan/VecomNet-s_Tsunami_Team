"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { TRACE_BATCHES } from "@/data/traceability";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatKg } from "@/lib/utils";
import {
  Search,
  MapPin,
  ShieldCheck,
  QrCode,
  Download,
  Radio,
  Compass,
  Waves,
} from "lucide-react";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { OceanFloatingCard } from "@/components/ocean/OceanFloatingCard";

function TraceabilityContent() {
  const searchParams = useSearchParams();
  const initialBatch = searchParams.get("batch");

  const [searchQuery, setSearchQuery] = useState(initialBatch || "");
  const [selectedBatch, setSelectedBatch] = useState(
    TRACE_BATCHES.find((b) => b.batchId === initialBatch) || TRACE_BATCHES[0]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = TRACE_BATCHES.find((b) =>
      b.batchId.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    if (found) {
      setSelectedBatch(found);
    } else {
      alert(`Không tìm thấy mã lô "${searchQuery}". Vui lòng thử các mã mẫu bên dưới.`);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Living Ocean Backdrop */}
      <OceanBackdrop bubbleCount={24} causticsOpacity={0.35} />

      <div className="pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <GlassBadge variant="ocean">HỆ THỐNG TRUY XUẤT MINH BẠCH (TRACEABILITY)</GlassBadge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0b1e3b]">
            Bản Đồ Cứu Hộ Lưới Biển Việt Nam
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Nhập mã Batch ID in trên mác thẻ của túi để định vị chính xác tọa độ GPS dưới đáy biển,
            ngày trục vớt và khối lượng lưới ma đã được giải phóng khỏi rạn san hô.
          </p>
        </motion.div>

      {/* Batch Search Bar */}
      <div className="max-w-xl mx-auto">
        <form
          onSubmit={handleSearch}
          className="p-2 rounded-2xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.06)] flex items-center gap-2"
        >
          <div className="pl-3 text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nhập mã Batch ID (vd: NET-VN-DN-2024-082)..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <GlassButton variant="primary" size="md" type="submit">
            Tra Cứu
          </GlassButton>
        </form>

        {/* Quick Batch Suggestions */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
          <span>Lô tiêu biểu:</span>
          {TRACE_BATCHES.map((b) => (
            <button
              key={b.batchId}
              onClick={() => {
                setSelectedBatch(b);
                setSearchQuery(b.batchId);
              }}
              className={` text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                selectedBatch.batchId === b.batchId
                  ? "bg-[#0b1e3b] text-white border-[#0b1e3b] font-bold shadow-sm"
                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {b.batchId}
            </button>
          ))}
        </div>
      </div>

      {/* Main Traceability Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Marine Interactive Map & Batch Data */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.05)] relative overflow-hidden">
            {/* Marine Map Canvas Graphic */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-[#081b36] flex items-center justify-center mb-6 shadow-inner">
              {/* Bathymetry Grid */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle, #38bdf8 1px, transparent 1px)`,
                  backgroundSize: "32px 32px",
                }}
              />

              {/* Water Current Drift Wave */}
              <motion.div
                animate={{ x: ["-10%", "10%", "-10%"], opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none"
              />

              {/* Vietnam Coastline Markers */}
              <div className="absolute inset-0 flex items-center justify-around p-8 z-10">
                {TRACE_BATCHES.map((b) => {
                  const isCurrent = b.batchId === selectedBatch.batchId;
                  return (
                    <button
                      key={b.batchId}
                      onClick={() => {
                        setSelectedBatch(b);
                        setSearchQuery(b.batchId);
                      }}
                      className={`relative flex flex-col items-center transition-all duration-300 cursor-pointer ${
                        isCurrent ? "scale-125 z-20" : "opacity-75 hover:opacity-100 scale-100 hover:scale-110"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg relative ${
                          isCurrent
                            ? "bg-sky-400 text-slate-950 ring-4 ring-sky-400/40"
                            : "bg-white text-sky-700 border border-slate-200"
                        }`}
                      >
                        {/* Ping pulse on active GPS coordinate */}
                        {isCurrent && (
                          <span className="absolute -inset-2 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
                        )}
                        <MapPin className="w-5 h-5 relative z-10" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 mt-1.5 whitespace-nowrap bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                        {b.seaRegion.split(",")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="absolute top-3 left-4 text-[10px] font-bold text-sky-300 flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>GPS MARINE SATELLITE RADAR • EAST VIETNAM SEA</span>
              </div>
            </div>

            {/* Batch Detailed Profile */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs text-sky-700 font-bold uppercase tracking-wider">
                    MÃ LÔ TRỤC VỚT CHÍNH THỨC
                  </div>
                  <h2 className="text-2xl font-black text-[#0b1e3b]">{selectedBatch.batchId}</h2>
                  <div className="text-sm font-bold text-slate-700 mt-0.5">
                    {selectedBatch.seaRegion}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GlassBadge variant="emerald" className="gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã Kiểm Định Độc Lập</span>
                  </GlassBadge>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{selectedBatch.story}</p>

              {/* Technical Spec Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Khối lượng thu gom</div>
                  <div className="text-lg font-black text-emerald-700 mt-1">
                    {formatKg(selectedBatch.plasticRecoveredKg)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Sinh vật cứu hộ</div>
                  <div className="text-lg font-black text-sky-800 mt-1">
                    {selectedBatch.marineAnimalsSavedCount} cá thể
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Độ sâu đáy biển</div>
                  <div className="text-lg font-black text-teal-800 mt-1">
                    {selectedBatch.depthMeters} mét
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Ngày hoàn tất</div>
                  <div className="text-lg font-black text-amber-700 mt-1">
                    {selectedBatch.recoveryDate}
                  </div>
                </div>
              </div>

              {/* Team & Verification */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500 font-medium">Đơn vị thực thi:</span>
                  <span className="font-bold text-slate-900">{selectedBatch.recoveryTeam}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500 font-medium">Tọa độ hải đồ:</span>
                  <span className=" font-bold text-sky-800">{selectedBatch.locationDetails}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500 font-medium">Mã băm lưu trữ (Hash):</span>
                  <span className=" text-[11px] text-slate-500 truncate max-w-[240px]">
                    {selectedBatch.verificationHash}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Digital Certificate Card & QR */}
        <div className="lg:col-span-4 space-y-6">
          <OceanFloatingCard delay={0.3} duration={6} distance={6}>
            <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.05)] hover:shadow-[0_20px_45px_rgba(11,30,59,0.1)] hover:border-sky-300 transition-all duration-300 text-center space-y-6">
              <div className="flex items-center justify-center gap-2 text-sky-800">
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Chứng Chỉ Số Hóa
                </span>
              </div>

              {/* Generated QR Code */}
              <div className="w-48 h-48 rounded-2xl bg-white p-3 border border-slate-200 shadow-md mx-auto flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://net.eco/trace/${selectedBatch.batchId}&bgcolor=ffffff&color=0b1e3b`}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-medium">Mã Quét Trực Tiếp:</div>
                <div className="text-sm font-black text-[#0b1e3b]">{selectedBatch.batchId}</div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Mã QR này được khắc laser chìm trên chốt kim loại của từng chiếc túi để chủ nhân có thể
                tự hào chia sẻ câu chuyện cứu hộ môi trường với bạn bè.
              </p>

              <div className="pt-2">
                <GlassButton
                  variant="primary"
                  size="md"
                  className="w-full shadow-md cursor-pointer"
                  onClick={() => alert("Đang lưu chứng chỉ tác động số về thiết bị của bạn...")}
                  icon={<Download className="w-4 h-4 text-white" />}
                >
                  Tải Chứng Chỉ Tác Động PDF
                </GlassButton>
              </div>
            </div>
          </OceanFloatingCard>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function TraceabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-600 text-sm">
          Đang tải bản đồ hải trình cứu hộ...
        </div>
      }
    >
      <TraceabilityContent />
    </Suspense>
  );
}
