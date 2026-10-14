"use client";

import React, { useState, useEffect, useMemo } from "react";
import { NetPack, ManufacturedBagItem } from "@/types";
import { BAG_COLORS } from "@/data/products";
import { formatKg, formatVND } from "@/lib/utils";
import {
  Anchor,
  Hammer,
  Boxes,
  Plus,
  RefreshCw,
  QrCode,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Trash2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

interface AdminSupplyChainTabProps {
  netPacks: NetPack[];
  manufacturedItems: ManufacturedBagItem[];
  products?: any[];
  onAddNetPack: (packData: Partial<NetPack>) => void;
  onProduceBags: (params: {
    sourcePackId: string;
    bagBaseId: string;
    colorId: string;
    quantity: number;
    workshopName: string;
    customProduct?: {
      id: string;
      name: string;
      plasticOffsetKg?: number;
    };
  }) => { success: boolean; message: string };
  onSyncFirestore: () => Promise<void>;
  isSyncing: boolean;
  syncFeedback: { success: boolean; message: string } | null;
  onResetSupplyChain?: () => Promise<void>;
  onResetClaimedBags?: () => Promise<void>;
  onResetMembersImpact?: () => Promise<void>;
}

export const AdminSupplyChainTab: React.FC<AdminSupplyChainTabProps> = ({
  netPacks,
  manufacturedItems,
  products = [],
  onAddNetPack,
  onProduceBags,
  onSyncFirestore,
  isSyncing,
  syncFeedback,
  onResetSupplyChain,
  onResetClaimedBags,
  onResetMembersImpact,
}) => {
  // Active Sub-Step: 1 (Inbound Net) | 2 (Production) | 3 (Serialized Inventory)
  const [subStep, setSubStep] = useState<"inbound" | "production" | "inventory">("inbound");

  // Inbound Net Form Modal
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [inboundForm, setInboundForm] = useState({
    packId: `PACK-DN-2024-${Math.floor(100 + Math.random() * 900)}`,
    seaRegion: "Rạn San Hô Bán Đảo Sơn Trà, Đà Nẵng",
    locationDetails: "Tọa độ rạn Bãi Bụt, độ sâu đáy 24m",
    lat: 16.1124,
    lng: 108.2619,
    recoveryDate: new Date().toISOString().split("T")[0],
    totalWeightKg: 50,
    depthMeters: 22,
    diverTeam: "Danang SAS Volunteer Divers",
    netPolymer: "Nylon-6 (Polyamide)",
    notes: "Lưới rê đánh bắt mực vô chủ chùm lên rạn san hô",
  });

  // Danh sách các mẫu túi thực tế để sản xuất: Lấy 100% từ các mẫu mã trong Bộ Sưu Tập (Catalog)
  const availableBagModels = useMemo(() => {
    return (products || [])
      .filter((p) => p && p.category !== "charm")
      .map((p) => ({
        id: String(p.id),
        name: p.name || `Mẫu #${p.id}`,
        plasticOffsetKg: Number(p.plasticOffsetKg) || 1.8,
        isFromCatalog: true,
      }));
  }, [products]);

  // Production Order Form Modal & State
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [productionForm, setProductionForm] = useState({
    sourcePackId: netPacks[0]?.packId || "",
    bagBaseId: availableBagModels[0]?.id || "1",
    colorId: BAG_COLORS[0]?.id || "abyss-blue",
    quantity: 10,
    workshopName: "Làng nghề đan lưới Nam Ô",
  });
  const [productionMessage, setProductionMessage] = useState<string | null>(null);

  // Sync default packId and bagBaseId when data loads
  useEffect(() => {
    if (!productionForm.sourcePackId && netPacks.length > 0) {
      setProductionForm((prev) => ({ ...prev, sourcePackId: netPacks[0].packId }));
    }
  }, [netPacks, productionForm.sourcePackId]);

  useEffect(() => {
    if (availableBagModels.length > 0) {
      const exists = availableBagModels.some((b) => b.id === productionForm.bagBaseId);
      if (!exists) {
        setProductionForm((prev) => ({ ...prev, bagBaseId: availableBagModels[0].id }));
      }
    }
  }, [availableBagModels, productionForm.bagBaseId]);

  // Live calculation of net consumption
  const selectedPack = netPacks.find((p) => p.packId === productionForm.sourcePackId) || netPacks[0];
  const availableKgInPack = Number(selectedPack?.remainingWeightKg ?? 0);
  const selectedBagModel =
    availableBagModels.find((b) => b.id === productionForm.bagBaseId) || availableBagModels[0];
  const netRequiredPerBag = selectedBagModel?.plasticOffsetKg || 1.8;
  const totalNetNeeded = Number((netRequiredPerBag * (Number(productionForm.quantity) || 1)).toFixed(2));
  const isEnoughNet =
    availableBagModels.length > 0 && availableKgInPack >= totalNetNeeded && availableKgInPack > 0;
  const projectedRemainingKg = Number((availableKgInPack - totalNetNeeded).toFixed(2));

  // Inventory Search & Filter
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>("all");

  const filteredInventory = useMemo(() => {
    return manufacturedItems
      .filter((item) => {
        const matchesSearch =
          item.serialId.toLowerCase().includes(inventorySearch.toLowerCase()) ||
          item.bagName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
          item.colorName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
          item.barcode?.includes(inventorySearch) ||
          item.sourcePackId.toLowerCase().includes(inventorySearch.toLowerCase());

        const matchesStatus =
          inventoryStatusFilter === "all" || item.status === inventoryStatusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.serialId.localeCompare(a.serialId));
  }, [manufacturedItems, inventorySearch, inventoryStatusFilter]);

  // Handle Inbound Submit
  const handleInboundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNetPack({
      packId: inboundForm.packId,
      seaRegion: inboundForm.seaRegion,
      locationDetails: inboundForm.locationDetails,
      coordinates: { lat: Number(inboundForm.lat), lng: Number(inboundForm.lng) },
      recoveryDate: inboundForm.recoveryDate,
      totalWeightKg: Number(inboundForm.totalWeightKg),
      remainingWeightKg: Number(inboundForm.totalWeightKg),
      depthMeters: Number(inboundForm.depthMeters),
      diverTeam: inboundForm.diverTeam,
      netPolymer: inboundForm.netPolymer,
      status: "new",
      notes: inboundForm.notes,
      createdAt: new Date().toISOString(),
    });
    setShowInboundModal(false);
  };

  // Handle Production Submit
  const handleProductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnoughNet) {
      alert(`Khối lượng lưới khả dụng trong Kiện (${availableKgInPack}kg) không đủ để sản xuất ${productionForm.quantity} chiếc (cần ${totalNetNeeded}kg)! Vui lòng giảm số lượng hoặc nhập thêm kiện lưới.`);
      return;
    }
    const result = onProduceBags({
      ...productionForm,
      customProduct: selectedBagModel
        ? {
            id: selectedBagModel.id,
            name: selectedBagModel.name,
            plasticOffsetKg: selectedBagModel.plasticOffsetKg,
          }
        : undefined,
    });
    setProductionMessage(result.message);
    if (result.success) {
      setTimeout(() => {
        setShowProductionModal(false);
        setProductionMessage(null);
        setSubStep("inventory");
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header with Cloud Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Anchor className="w-6 h-6 text-teal-600" />
            <span>Chuỗi Cung Ứng & Lệnh Sản Xuất Xưởng</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình tuần hoàn khép kín: Trục vớt kiện lưới ma ➔ Cắt may thành phẩm ➔ Cấp định danh Serial, QR & chip NFC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onResetClaimedBags && (
            <button
              type="button"
              onClick={async () => {
                if (
                  confirm(
                    "⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ TÚI ĐÃ ĐỊNH DANH CỦA KHÁCH HÀNG?\n\nToàn bộ dữ liệu hộ chiếu số (Digital Passport) đã kích hoạt trên Cloud Firestore và máy khách sẽ bị xóa hoàn toàn."
                  )
                ) {
                  await onResetClaimedBags();
                }
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Xóa toàn bộ túi đã định danh của khách hàng"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Xoá Túi Đã Định Danh</span>
            </button>
          )}

          {onResetMembersImpact && (
            <button
              type="button"
              onClick={async () => {
                if (
                  confirm(
                    "⚠️ BẠN CÓ CHẮC CHẮN MUỐN RESET TÁC ĐỘNG MÔI TRƯỜNG & DẤU CHÂN CARBON CỦA TẤT CẢ THÀNH VIÊN?\n\nToàn bộ chỉ số kg lưới ma, m² san hô, kg CO2e của mọi tài khoản sẽ được đặt về 0 và chỉ tính lại dựa trên sản phẩm thực tế họ mua."
                  )
                ) {
                  await onResetMembersImpact();
                }
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Reset toàn bộ dấu chân sinh thái của thành viên về 0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
              <span>Reset Tác Động Thành Viên</span>
            </button>
          )}

          {onResetSupplyChain && (
            <button
              type="button"
              onClick={async () => {
                if (
                  confirm(
                    "⚠️ BẠN CÓ CHẮC CHẮN MUỐN RESET KHO & LƯỚI THU GOM?\n\nToàn bộ kiện lưới (batches) và túi kho (bag_items) sẽ được làm sạch trên Cloud Firestore và bộ nhớ để dùng 100% dữ liệu thực từ đầu."
                  )
                ) {
                  await onResetSupplyChain();
                }
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Reset sạch kho & lưới mẫu để dùng database thực"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Kho & Lưới Mẫu</span>
            </button>
          )}

          <button
            onClick={onSyncFirestore}
            disabled={isSyncing}
            className={`px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer ${
              isSyncing ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Đang đẩy lên Firestore..." : "Đồng Bộ Kho Lên Cloud"}</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
            syncFeedback.success
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {syncFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* 2. Sub-step Navigation Rail */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setSubStep("inbound")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
            subStep === "inbound"
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-teal-500/20"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
              subStep === "inbound" ? "bg-teal-500 text-slate-950" : "bg-slate-100 text-slate-600"
            }`}
          >
            1
          </div>
          <div>
            <div className="text-xs font-bold">1. Nhập Kiện Lưới Ma</div>
            <div className={`text-[11px] ${subStep === "inbound" ? "text-slate-300" : "text-slate-500"}`}>
              {netPacks.length} kiện nguồn trục vớt
            </div>
          </div>
        </button>

        <button
          onClick={() => setSubStep("production")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
            subStep === "production"
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-teal-500/20"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
              subStep === "production" ? "bg-teal-500 text-slate-950" : "bg-slate-100 text-slate-600"
            }`}
          >
            2
          </div>
          <div>
            <div className="text-xs font-bold">2. Lệnh Sản Xuất Xưởng</div>
            <div className={`text-[11px] ${subStep === "production" ? "text-slate-300" : "text-slate-500"}`}>
              Cắt may & cấp dải Serial
            </div>
          </div>
        </button>

        <button
          onClick={() => setSubStep("inventory")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
            subStep === "inventory"
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-teal-500/20"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
              subStep === "inventory" ? "bg-teal-500 text-slate-950" : "bg-slate-100 text-slate-600"
            }`}
          >
            3
          </div>
          <div>
            <div className="text-xs font-bold">3. Kho Thành Phẩm & NFC</div>
            <div className={`text-[11px] ${subStep === "inventory" ? "text-slate-300" : "text-slate-500"}`}>
              {manufacturedItems.length} túi có Passport QR
            </div>
          </div>
        </button>
      </div>

      {/* 3. SUB-STEP 1: INBOUND NET PACKS */}
      {subStep === "inbound" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh Sách Kiện Lưới Trục Vớt</h3>
              <p className="text-xs text-slate-500">Mỗi kiện đại diện cho một mẻ lưới vớt dưới rạn san hô có tọa độ GPS độc lập</p>
            </div>
            <button
              onClick={() => setShowInboundModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nhập Kiện Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {netPacks.map((pack) => (
              <div
                key={pack.packId}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 hover:border-teal-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                    {pack.packId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      pack.status === "new"
                        ? "bg-emerald-100 text-emerald-800"
                        : pack.status === "in_production"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {pack.status === "new"
                      ? "Mới Nhập"
                      : pack.status === "in_production"
                      ? "Đang May"
                      : "Đã Hết"}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>{pack.seaRegion}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{pack.locationDetails}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400">Khối lượng gốc: </span>
                    <strong className="text-slate-800">{pack.totalWeightKg} kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Còn lại: </span>
                    <strong className="text-teal-700">{pack.remainingWeightKg} kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Độ sâu: </span>
                    <strong className="text-slate-800">{pack.depthMeters} m</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Chất liệu: </span>
                    <strong className="text-slate-800 truncate block">{pack.netPolymer}</strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Đội lặn: {pack.diverTeam}</span>
                  <span>{pack.recoveryDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUB-STEP 2: PRODUCTION ORDERS */}
      {subStep === "production" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Lập Lệnh Sản Xuất & May Lót Túi</h3>
              <p className="text-xs text-slate-500">
                Chọn một kiện lưới nguyên liệu để đưa vào xưởng đan. Hệ thống sẽ tự động trừ khối lượng kg của kiện và cấp dải mã Serial độc bản.
              </p>
            </div>

            <form onSubmit={handleProductionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    1. Chọn Kiện Lưới Ma Nguồn (Còn dư kg)
                  </label>
                  <select
                    value={productionForm.sourcePackId}
                    onChange={(e) =>
                      setProductionForm({ ...productionForm, sourcePackId: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {netPacks
                      .filter((p) => p.remainingWeightKg > 0)
                      .map((p) => (
                        <option key={p.packId} value={p.packId}>
                          {p.packId} - {p.seaRegion} (Còn: {p.remainingWeightKg} kg)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    2. Chọn Mẫu Sản Phẩm Cần May (Từ Mẫu Mã Bộ Sưu Tập)
                  </label>
                  {availableBagModels.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                      <p className="font-bold">⚠️ Chưa có mẫu mã nào trong Bộ Sưu Tập!</p>
                      <p className="text-[11px] text-slate-600">
                        Vui lòng sang tab <strong>Bộ Sưu Tập &amp; CMS</strong> để đăng bản thiết kế mẫu mã trước khi phát lệnh may xưởng.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={productionForm.bagBaseId}
                      onChange={(e) =>
                        setProductionForm({ ...productionForm, bagBaseId: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      {availableBagModels.map((bag) => (
                        <option key={bag.id} value={bag.id}>
                          {bag.name} (Mã ID: {bag.id}) • Tiêu thụ ~{bag.plasticOffsetKg} kg lưới/chiếc
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">3. Phối Màu Lưới May</label>
                  <select
                    value={productionForm.colorId}
                    onChange={(e) =>
                      setProductionForm({ ...productionForm, colorId: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {BAG_COLORS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">4. Số Lượng Sản Xuất</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={productionForm.quantity}
                    onChange={(e) =>
                      setProductionForm({ ...productionForm, quantity: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">5. Trạm Xưởng Đan</label>
                  <input
                    type="text"
                    value={productionForm.workshopName}
                    onChange={(e) =>
                      setProductionForm({ ...productionForm, workshopName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Bảng cân đối định mức lưới tuần hoàn thời gian thực */}
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  isEnoughNet
                    ? "bg-teal-50/80 border-teal-200 text-teal-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Cân Đối Nguyên Liệu Lưới Ma Tuần Hoàn</span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      isEnoughNet
                        ? "bg-emerald-200 text-emerald-900"
                        : "bg-rose-200 text-rose-900"
                    }`}
                  >
                    {isEnoughNet ? "Đủ nguyên liệu lưới" : "Thiếu nguyên liệu lưới"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 block">Kiện Lưới nguồn:</span>
                    <strong className="text-slate-900">
                      {selectedPack?.packId || "Chưa chọn"} ({availableKgInPack} kg)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tiêu thụ dự kiến:</span>
                    <strong className="text-teal-700">
                      -{totalNetNeeded} kg ({productionForm.quantity} chiếc × {netRequiredPerBag}kg)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Còn lại sau may:</span>
                    <strong
                      className={
                        projectedRemainingKg >= 0 ? "text-emerald-700" : "text-rose-700"
                      }
                    >
                      {projectedRemainingKg} kg
                    </strong>
                  </div>
                </div>
                {!isEnoughNet && (
                  <p className="text-[11px] text-rose-700 font-semibold pt-1">
                    ⚠️ Khối lượng lưới còn lại trong kiện ({availableKgInPack} kg) không đủ để sản xuất {productionForm.quantity} chiếc (cần {totalNetNeeded} kg). Vui lòng giảm số lượng may hoặc nhập thêm kiện lưới ma tại bước 1.
                  </p>
                )}
              </div>

              {productionMessage && (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>{productionMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={!isEnoughNet || netPacks.length === 0 || availableBagModels.length === 0}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all ${
                    isEnoughNet && netPacks.length > 0 && availableBagModels.length > 0
                      ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  <span>Phát Lệnh Sản Xuất & Tăng Tồn Kho Bộ Sưu Tập</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. SUB-STEP 3: SERIALIZED INVENTORY & NFC PASSPORT */}
      {subStep === "inventory" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Tìm theo Serial ID, mã vạch, tên túi, mã kiện..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={inventoryStatusFilter}
                onChange={(e) => setInventoryStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">Tất cả trạng thái kho</option>
                <option value="in_stock">Trong kho (Chưa bán)</option>
                <option value="assigned_to_order">Đã gán cho đơn hàng</option>
                <option value="delivered">Đã giao khách</option>
              </select>

              <span className="font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
                {filteredInventory.length} túi
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Mã Serial & Barcode</th>
                    <th className="py-3 px-4">Tên Túi & Phối Màu</th>
                    <th className="py-3 px-4">Kiện Lưới Nguồn</th>
                    <th className="py-3 px-4">Trạng Thái Kho</th>
                    <th className="py-3 px-4">Bảo Hành NFC 24T</th>
                    <th className="py-3 px-4 text-right">Story Passport</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item) => (
                    <tr key={item.serialId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-teal-800">{item.serialId}</div>
                        <div className="font-mono text-[10px] text-slate-400">
                          Mã vạch: {item.barcode}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.bagName}</div>
                        <div className="text-[11px] text-slate-500">{item.colorName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700">{item.sourcePackId}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {item.seaRegion}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "in_stock"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "assigned_to_order"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status === "in_stock"
                            ? "Sẵn sàng bán"
                            : item.status === "assigned_to_order"
                            ? `Đã gán đơn ${item.assignedOrderCode || ""}`
                            : "Đã giao khách"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                          <span
                            className={`text-[10px] font-bold ${
                              item.warrantyStatus === "active"
                                ? "text-emerald-700"
                                : "text-slate-500"
                            }`}
                          >
                            {item.warrantyStatus === "active"
                              ? "Đã kích hoạt NFC"
                              : "Chờ khách quét"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={item.qrUrl || `/passport/${item.sourcePackId}?itemId=${item.serialId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-[11px] font-bold transition-colors"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Mở Passport</span>
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        Chưa có sản phẩm nào trong kho thành phẩm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inbound Modal */}
      {showInboundModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleInboundSubmit}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-black text-slate-900">Nhập Kiện Lưới Ma Mới</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mã Kiện Lưới</label>
                <input
                  type="text"
                  required
                  value={inboundForm.packId}
                  onChange={(e) => setInboundForm({ ...inboundForm, packId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vùng Biển Trục Vớt</label>
                <input
                  type="text"
                  required
                  value={inboundForm.seaRegion}
                  onChange={(e) => setInboundForm({ ...inboundForm, seaRegion: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khối Lượng Thu Hồi (kg)</label>
                  <input
                    type="number"
                    required
                    value={inboundForm.totalWeightKg}
                    onChange={(e) =>
                      setInboundForm({ ...inboundForm, totalWeightKg: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Độ Sâu Đáy Biển (m)</label>
                  <input
                    type="number"
                    value={inboundForm.depthMeters}
                    onChange={(e) =>
                      setInboundForm({ ...inboundForm, depthMeters: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đội Thợ Lặn</label>
                  <input
                    type="text"
                    value={inboundForm.diverTeam}
                    onChange={(e) => setInboundForm({ ...inboundForm, diverTeam: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chất Liệu Polymer</label>
                  <input
                    type="text"
                    value={inboundForm.netPolymer}
                    onChange={(e) => setInboundForm({ ...inboundForm, netPolymer: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInboundModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
              >
                Lưu Kiện Lưới
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
