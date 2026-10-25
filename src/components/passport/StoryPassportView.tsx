"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  QrCode,
  Share2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Search,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";
import { PlacedCharm } from "@/types";
import { getDesignRequestById } from "@/lib/designRequestStorage";

interface StoryPassportViewProps {
  passportCode: string;
}

export const StoryPassportView: React.FC<StoryPassportViewProps> = ({
  passportCode,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchInput, setSearchInput] = useState(passportCode);

  // Check if linked to an actual customer design request
  const linkedRequest = getDesignRequestById(passportCode);

  // Passport Data matching user mockups 5010fca2-9e73-4b8c-944b-098fc7c18004.jpeg and 72e7eb22-8972-456b-b7bc-ce7dd45048b5.jpeg
  const passportData = {
    code: linkedRequest?.passportCode || passportCode || "DEMO-DN-001",
    batchId: "DEMO-DN-001",
    originRegion: "Đà Nẵng",
    originSubtitle: "Nguồn lưới minh họa tại Đà Nẵng",
    recordDate: "2026-10-18",
    initialWeight: "14 kg",
    usableWeight: "10 kg",
    storyTitle: linkedRequest?.notes ? "Kỷ niệm lưu giữ riêng" : "Một ngày ở Sơn Trà",
    storySubtitle: linkedRequest?.notes || "Cùng gia đình khám phá nơi rừng gặp biển.",
    charms: linkedRequest?.placedCharms?.length
      ? linkedRequest.placedCharms
      : ([
          {
            instanceId: "pass-charm-1",
            charmId: "charm-wave",
            anchorId: "a1",
            x: 35,
            y: 45,
            rotation: 0,
            charm: {
              id: "charm-wave",
              name: "Sóng Mỹ Khê",
              vietnameseName: "Sóng Mỹ Khê",
              category: "marine",
              price: 25000,
              plasticOffsetGrams: 150,
              material: "Nhựa lưới ép men xanh",
              description: "Nhịp sóng và những buổi sớm bên bờ biển Mỹ Khê.",
              color: "#60a5fa",
              glowColor: "rgba(96, 165, 250, 0.4)",
              symbol: "≈",
              iconName: "waves",
            },
          },
          {
            instanceId: "pass-charm-2",
            charmId: "charm-sun",
            anchorId: "a2",
            x: 65,
            y: 56,
            rotation: 0,
            charm: {
              id: "charm-sun",
              name: "Mặt trời",
              vietnameseName: "Mặt trời",
              category: "celestial",
              price: 25000,
              plasticOffsetGrams: 150,
              material: "Đồng tái sinh men vàng",
              description: "Một buổi bình minh và khởi đầu mới bên biển.",
              color: "#f59e0b",
              glowColor: "rgba(245, 158, 11, 0.4)",
              symbol: "☼",
              iconName: "sun",
            },
          },
        ] as PlacedCharm[]),
    careGuide:
      "Làm sạch nhẹ bằng tay, phơi thoáng. Tháo charm trước khi vệ sinh. Hướng dẫn này là bản đề xuất, cần xác nhận trên mẫu vật liệu thực tế.",
  };

  const currentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/passport/${encodeURIComponent(passportData.code)}`
      : "";

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    currentUrl || `https://vecomnets.vercel.app/passport/${passportData.code}`
  )}&color=24-27-22&bgcolor=FAF7F2`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] text-[#2D231E] py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6">
          <div>
            <div className="text-[11px] tracking-[0.25em] uppercase text-[#7A6F68] font-semibold mb-2">
              HỒ SƠ ĐỘC BẢN SẢN PHẨM · DIGITAL PASSPORT
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl text-[#241B16] font-normal tracking-tight">
              Story Passport
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-white border border-[#E8E2D8] text-xs font-semibold text-[#5E4D43] hover:text-[#241B16] shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Đã sao chép link</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#7A6F68]" />
                  <span>Chia sẻ Passport</span>
                </>
              )}
            </button>

            <Link
              href="/studio"
              className="px-4 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-semibold shadow-xs"
            >
              Tự thiết kế túi mới →
            </Link>
          </div>
        </div>

        {/* 2-Column Layout matching mockups */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Visual Bag with Charms & QR code badge */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-6">
            <NetBag2DCanvas
              placedCharms={passportData.charms}
              bagImageUrl={linkedRequest?.bagColor?.image || "/assets/products/bags/tuixach-xanh-la.png"}
              selectedColorHex={linkedRequest?.bagColor?.hex || "#3d8b85"}
              selectedColorName={linkedRequest?.bagColor?.name || "Xanh Lá"}
              onUpdateCharmPosition={() => {}}
              onRemoveCharm={() => {}}
            />

            {/* Individual Product QR Card */}
            <div className="w-full max-w-[440px] p-5 rounded-3xl bg-white border border-[#E8E2D8] shadow-xs flex items-center gap-5">
              <img
                src={qrImageUrl}
                alt="Mã QR Passport"
                className="w-20 h-20 rounded-xl border border-[#E8E2D8] p-1 bg-[#FAF7F2]"
              />
              <div className="space-y-1">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-bold">
                  MÃ QR ĐỘC BẢN
                </span>
                <div className="text-xs font-mono font-bold text-[#B85D43]">
                  {passportData.code}
                </div>
                <p className="text-[11px] text-[#7A6F68] leading-tight">
                  Quét QR mở trực tiếp hồ sơ sản phẩm này, không mở bản đồ chung.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Passport Information Cards (Exact mockup match) */}
          <div className="lg:col-span-7 space-y-6">
            {/* CARD 01 / NGUỒN VẬT LIỆU */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                01 / NGUỒN VẬT LIỆU
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#241B16]">
                  {passportData.originRegion}
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6F68] mt-1 font-light">
                  {passportData.originSubtitle}
                </p>
              </div>

              <div className="space-y-2.5 text-xs border-t border-[#FAF7F2] pt-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Mã lô:</span>
                  <span className="font-mono font-semibold text-[#241B16]">
                    {passportData.batchId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Ngày ghi nhận:</span>
                  <span className="font-medium text-[#241B16]">
                    {passportData.recordDate}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7A6F68]">Lưới ban đầu / dùng được:</span>
                  <span className="font-semibold text-[#2D5E4E]">
                    {passportData.initialWeight} / {passportData.usableWeight}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#7A6F68] leading-relaxed border-t border-[#FAF7F2]">
                Thông tin ở cấp lô; không quy đổi thành tác động riêng cho từng túi. Dữ liệu giả lập để thử quy trình. Chưa phải tác động thực tế.
              </div>
            </div>

            {/* CARD 02 / KÝ ỨC CỦA BẠN */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                02 / KÝ ỨC CỦA BẠN
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#241B16]">
                  {passportData.storyTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6F68] mt-1 font-light">
                  {passportData.storySubtitle}
                </p>
              </div>

              {/* Charm Meanings List */}
              <div className="space-y-3 pt-3 border-t border-[#FAF7F2]">
                {passportData.charms.map((placed) => (
                  <div
                    key={placed.instanceId}
                    className="flex items-start gap-3 text-xs"
                  >
                    <span
                      className="w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                      style={{ backgroundColor: placed.charm.color || "#38bdf8" }}
                    >
                      {placed.charm.symbol || "✨"}
                    </span>
                    <p className="text-[#42342B] leading-relaxed">
                      <strong>{placed.charm.vietnameseName}</strong> —{" "}
                      {placed.charm.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 03 / CHĂM SÓC */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                03 / CHĂM SÓC
              </div>

              <p className="text-xs sm:text-sm text-[#42342B] leading-relaxed">
                {passportData.careGuide}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
