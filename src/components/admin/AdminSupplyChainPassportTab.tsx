"use client";

import React, { useState, useMemo } from "react";
import {
  RawNetBatch,
  ProductionSlip,
  BagSerialItem,
  saveAdminBatch,
  saveAdminSlip,
  saveAdminSerial,
} from "@/lib/adminDataStorage";
import { formatKg, formatVND } from "@/lib/utils";
import { BAG_BASES } from "@/data/products";

interface AdminSupplyChainPassportTabProps {
  batches: RawNetBatch[];
  slips: ProductionSlip[];
  serials: BagSerialItem[];
  onBatchesChange: (updated: RawNetBatch[]) => void;
  onSlipsChange: (updated: ProductionSlip[]) => void;
  onSerialsChange: (updated: BagSerialItem[]) => void;
  initialSubTab?: "inbound" | "inventory" | "production" | "passport";
  initialSelectedId?: string;
}

export const AdminSupplyChainPassportTab: React.FC<AdminSupplyChainPassportTabProps> = ({
  batches,
  slips,
  serials,
  onBatchesChange,
  onSlipsChange,
  onSerialsChange,
  initialSubTab = "inbound",
  initialSelectedId,
}) => {
  // 1. 4 Tabs Cấu trúc (Req 11)
  const [activeSubTab, setActiveSubTab] = useState<"inbound" | "inventory" | "production" | "passport">(initialSubTab);

  // Modals
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedBatchForProcess, setSelectedBatchForProcess] = useState<RawNetBatch | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showSewingModal, setShowSewingModal] = useState(false);
  const [selectedSlipForSewing, setSelectedSlipForSewing] = useState<ProductionSlip | null>(null);

  const [showPassportModal, setShowPassportModal] = useState(false);
  const [selectedSerialForPassport, setSelectedSerialForPassport] = useState<BagSerialItem | null>(null);

  // -------------------------------------------------------------
  // TAB 1: NHẬN LÔ LƯỚI & GHI KẾT QUẢ XỬ LÝ (Req 12, 13)
  // -------------------------------------------------------------
  const [inboundForm, setInboundForm] = useState({
    supplierSource: "Đội Thợ Lặn Sơn Trà",
    seaRegion: "Rạn Bãi Bụt, Bán Đảo Sơn Trà, Đà Nẵng",
    receiveDate: new Date().toISOString().split("T")[0],
    initialWeightKg: 50,
    weighingCondition: "wet" as "wet" | "dry",
    photoUrl: "/assets/banner-nets-recycle.png",
    notes: "",
  });

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const batchYear = new Date().getFullYear();
    const batchId = `NET-BATCH-${batchYear}-${String(batches.length + 1).padStart(2, "0")}`;

    const newBatch: RawNetBatch = {
      batchId,
      supplierSource: inboundForm.supplierSource.trim(),
      seaRegion: inboundForm.seaRegion.trim(),
      receiveDate: inboundForm.receiveDate,
      initialWeightKg: Number(inboundForm.initialWeightKg) || 0,
      weighingCondition: inboundForm.weighingCondition,
      photoUrl: inboundForm.photoUrl,
      status: "unprocessed",
      usableDryStockKg: 0, // CHƯA cộng lượng chưa xử lý vào kho dùng được (Req 12)
      reusableScrapsKg: 0,
      history: [
        {
          date: inboundForm.receiveDate,
          action: "Tiếp nhận lưới thô",
          changeKg: Number(inboundForm.initialWeightKg) || 0,
          note: `Cân ${inboundForm.weighingCondition === "wet" ? "ướt" : "khô"} từ ${inboundForm.supplierSource}`,
        },
      ],
    };

    const updated = saveAdminBatch(newBatch);
    onBatchesChange(updated);
    setShowInboundModal(false);
    alert(`Đã lưu hồ sơ tiếp nhận lô lưới #${batchId}! Hãy giặt sấy và bấm "Ghi xử lý" để nhập kho.`);
  };

  // Ghi kết quả xử lý (Req 13)
  const [processForm, setProcessForm] = useState({
    completedDate: new Date().toISOString().split("T")[0],
    usableDryKg: 40,
    discardedWasteKg: 5,
    notes: "Sau giặt sấy và lọc sạch bùn đất, sợi đạt độ bền đan túi",
  });

  const handleConfirmProcess = () => {
    if (!selectedBatchForProcess) return;

    // Idempotent check (Req 13)
    if (selectedBatchForProcess.status === "processed") {
      alert("Lô lưới này đã được ghi nhận xử lý trước đó!");
      return;
    }

    const moistureLoss = Math.max(
      0,
      Number(
        (selectedBatchForProcess.initialWeightKg - processForm.usableDryKg - processForm.discardedWasteKg).toFixed(1)
      )
    );

    const nowStr = new Date().toLocaleString("vi-VN");
    const updatedBatch: RawNetBatch = {
      ...selectedBatchForProcess,
      status: "processed",
      usableDryStockKg: processForm.usableDryKg, // CHÍNH THỨC CỘNG VÀO KHO DÙNG ĐƯỢC
      processing: {
        completedDate: processForm.completedDate,
        usableDryKg: processForm.usableDryKg,
        discardedWasteKg: processForm.discardedWasteKg,
        moistureLossKg: moistureLoss,
        notes: processForm.notes,
        processedAt: nowStr,
      },
      history: [
        {
          date: processForm.completedDate,
          action: "Xác nhận xử lý giặt sấy",
          changeKg: processForm.usableDryKg,
          note: `Nhập kho ${processForm.usableDryKg}kg lưới khô dùng được (loại bỏ ${processForm.discardedWasteKg}kg rác/bùn)`,
        },
        ...selectedBatchForProcess.history,
      ],
    };

    const updated = saveAdminBatch(updatedBatch);
    onBatchesChange(updated);
    setShowProcessModal(false);
    alert(`Đã nhập kho thành công ${processForm.usableDryKg}kg lưới khô cho lô #${selectedBatchForProcess.batchId}!`);
  };

  // -------------------------------------------------------------
  // TAB 3: XUẤT CHO SẢN XUẤT & XÁC NHẬN KẾT QUẢ MAY (Req 15, 16)
  // -------------------------------------------------------------
  const [exportForm, setExportForm] = useState({
    batchId: batches[0]?.batchId || "",
    exportedKg: 15,
    workshopName: "Xưởng May Thủ Công NÉT (Đà Nẵng)",
    bagModelId: "net-tote-01",
    bagModelName: "Túi Lưới NÉT — Dáng Tote Cổ Điển",
  });

  const handleExportToProduction = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceBatch = batches.find((b) => b.batchId === exportForm.batchId);
    if (!sourceBatch) {
      alert("Vui lòng chọn lô lưới nguồn hợp lệ!");
      return;
    }

    if (sourceBatch.usableDryStockKg < exportForm.exportedKg) {
      alert(
        `Lô ${sourceBatch.batchId} chỉ còn ${sourceBatch.usableDryStockKg}kg lưới khô! Không đủ để xuất ${exportForm.exportedKg}kg.`
      );
      return;
    }

    // Trừ kho lưới và ghi lịch sử (Req 15)
    const newStock = Number((sourceBatch.usableDryStockKg - exportForm.exportedKg).toFixed(1));
    const nowStr = new Date().toISOString().split("T")[0];

    const updatedBatch: RawNetBatch = {
      ...sourceBatch,
      usableDryStockKg: newStock,
      history: [
        {
          date: nowStr,
          action: "Xuất lưới cho sản xuất",
          changeKg: -exportForm.exportedKg,
          note: `Xuất cho xưởng ${exportForm.workshopName} may mẫu ${exportForm.bagModelName}`,
        },
        ...sourceBatch.history,
      ],
    };
    saveAdminBatch(updatedBatch);
    onBatchesChange(batches.map((b) => (b.batchId === updatedBatch.batchId ? updatedBatch : b)));

    // Tạo Phiếu sản xuất (Req 15)
    const slipId = `NET-PROD-2026-${String(slips.length + 1).padStart(2, "0")}`;
    const newSlip: ProductionSlip = {
      slipId,
      createdAt: new Date().toLocaleString("vi-VN"),
      workshopName: exportForm.workshopName,
      bagModelId: exportForm.bagModelId,
      bagModelName: exportForm.bagModelName,
      exportedBatches: [{ batchId: sourceBatch.batchId, exportedKg: exportForm.exportedKg }],
      totalExportedKg: exportForm.exportedKg,
      status: "in_production", // Chưa tính là đã thành túi (Req 15)
      serialsCreated: false,
    };

    const updatedSlips = saveAdminSlip(newSlip);
    onSlipsChange(updatedSlips);
    setShowExportModal(false);
    alert(`Đã tạo phiếu sản xuất #${slipId} và trừ ${exportForm.exportedKg}kg từ lô ${sourceBatch.batchId}!`);
  };

  // Xác nhận kết quả may (Req 16, 17, 18, 19)
  const [sewingForm, setSewingForm] = useState({
    passedBagsCount: 10,
    netInPassedBagsKg: 12.5,
    defectiveBagsCount: 0,
    returnedRawNetKg: 1.5, // Dư nguyên trả kho
    reusableScrapsKg: 0.8, // Vụn dùng tiếp
    discardedWasteKg: 0.2, // Loại bỏ
    attributionMethod: "distributed" as "actual" | "distributed",
    notes: "May hoàn tất 10 túi chuẩn form",
  });

  // Kiểm tra toán học cân bằng vật liệu (Req 16)
  const materialBalance = useMemo(() => {
    if (!selectedSlipForSewing) return { totalInput: 0, totalOutput: 0, diff: 0, isBalanced: false };
    const totalInput = selectedSlipForSewing.totalExportedKg;
    const totalOutput = Number(
      (
        Number(sewingForm.netInPassedBagsKg) +
        Number(sewingForm.returnedRawNetKg) +
        Number(sewingForm.reusableScrapsKg) +
        Number(sewingForm.discardedWasteKg)
      ).toFixed(2)
    );
    const diff = Number((totalOutput - totalInput).toFixed(2));
    const isBalanced = Math.abs(diff) < 0.05; // Cho phép sai số cân 0.05kg
    return { totalInput, totalOutput, diff, isBalanced };
  }, [selectedSlipForSewing, sewingForm]);

  const handleConfirmSewingResult = () => {
    if (!selectedSlipForSewing) return;
    if (!materialBalance.isBalanced) {
      alert(
        `Chặn xác nhận: Cân bằng vật liệu chưa khớp! Tổng đầu ra (${materialBalance.totalOutput}kg) khác lượng đã xuất (${materialBalance.totalInput}kg). Lệch: ${materialBalance.diff}kg.`
      );
      return;
    }

    const nowStr = new Date().toISOString().split("T")[0];

    // 1. Nhận phần dư nguyên trả kho & ghi vụn riêng (Req 17)
    const primaryBatchId = selectedSlipForSewing.exportedBatches[0]?.batchId;
    const batchToUpdate = batches.find((b) => b.batchId === primaryBatchId);
    if (batchToUpdate) {
      const updatedBatch: RawNetBatch = {
        ...batchToUpdate,
        usableDryStockKg: Number((batchToUpdate.usableDryStockKg + sewingForm.returnedRawNetKg).toFixed(1)),
        reusableScrapsKg: Number((batchToUpdate.reusableScrapsKg + sewingForm.reusableScrapsKg).toFixed(1)),
        history: [
          {
            date: nowStr,
            action: "Nhận lưới dư & vụn sau may",
            changeKg: sewingForm.returnedRawNetKg,
            note: `Phiếu ${selectedSlipForSewing.slipId}: trả ${sewingForm.returnedRawNetKg}kg lưới nguyên tấm, cộng ${sewingForm.reusableScrapsKg}kg vụn`,
          },
          ...batchToUpdate.history,
        ],
      };
      saveAdminBatch(updatedBatch);
      onBatchesChange(batches.map((b) => (b.batchId === updatedBatch.batchId ? updatedBatch : b)));
    }

    // 2. Cập nhật phiếu sản xuất
    const updatedSlip: ProductionSlip = {
      ...selectedSlipForSewing,
      status: "completed",
      sewingResult: {
        completedDate: nowStr,
        passedBagsCount: sewingForm.passedBagsCount,
        netInPassedBagsKg: sewingForm.netInPassedBagsKg,
        defectiveBagsCount: sewingForm.defectiveBagsCount,
        returnedRawNetKg: sewingForm.returnedRawNetKg,
        reusableScrapsKg: sewingForm.reusableScrapsKg,
        discardedWasteKg: sewingForm.discardedWasteKg,
        notes: sewingForm.notes,
      },
      weightAttributionMethod: sewingForm.attributionMethod,
      serialsCreated: true,
    };
    const savedSlips = saveAdminSlip(updatedSlip);
    onSlipsChange(savedSlips);

    // 3. Tự động sinh mã túi cho các túi đạt chuẩn (Req 18, 19)
    const weightPerBag = Number(
      (sewingForm.netInPassedBagsKg / Math.max(1, sewingForm.passedBagsCount)).toFixed(2)
    );
    const slipIndex = slips.length;
    const newSerials: BagSerialItem[] = [];

    for (let i = 1; i <= sewingForm.passedBagsCount; i++) {
      const serialId = `NET-PROD${slipIndex}-${String(i).padStart(3, "0")}`;
      newSerials.push({
        serialId,
        slipId: selectedSlipForSewing.slipId,
        batchId: primaryBatchId || "BATCH-01",
        bagModelId: selectedSlipForSewing.bagModelId,
        bagName: selectedSlipForSewing.bagModelName,
        netWeightKg: weightPerBag,
        attributionMethod: sewingForm.attributionMethod,
        manufacturedDate: nowStr,
        status: "in_stock",
      });
    }

    const allSerials = [...newSerials, ...serials];
    localStorage.setItem("net_admin_serials_v2", JSON.stringify(allSerials));
    onSerialsChange(allSerials);

    setShowSewingModal(false);
    alert(
      `Đã xác nhận kết quả may thành công! Tự động tạo ${newSerials.length} mã túi độc bản từ Phiếu ${selectedSlipForSewing.slipId}.`
    );
  };

  // -------------------------------------------------------------
  // TAB 4: CẤP PASSPORT (Req 20, 21, 22)
  // -------------------------------------------------------------
  const [passportForm, setPassportForm] = useState({
    charmStory: "Móc khoá men lam Cloisonné viền vàng tái hiện biểu tượng biển đảo",
    personalStory: "",
    allowPublicStory: true,
  });

  const handleIssuePassportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSerialForPassport) return;

    const nowStr = new Date().toLocaleString("vi-VN");
    const sourceBatch = batches.find((b) => b.batchId === selectedSerialForPassport.batchId);
    const originText = sourceBatch
      ? `${sourceBatch.seaRegion} (${sourceBatch.batchId})`
      : "Vùng biển Việt Nam";

    const updatedSerial: BagSerialItem = {
      ...selectedSerialForPassport,
      passport: {
        passportId: `PASS-${selectedSerialForPassport.serialId.replace("NET-", "")}`,
        issuedAt: nowStr,
        verifiedOrigin: originText,
        netWeightKg: selectedSerialForPassport.netWeightKg,
        attributionMethod:
          selectedSerialForPassport.attributionMethod === "distributed"
            ? `Phân bổ đều từ Phiếu ${selectedSerialForPassport.slipId}`
            : "Cân thực tế",
        charmStory: passportForm.charmStory,
        personalStory: passportForm.personalStory ? passportForm.personalStory : undefined,
        allowPublicStory: passportForm.allowPublicStory,
      },
    };

    const saved = saveAdminSerial(updatedSerial);
    onSerialsChange(saved);
    setShowPassportModal(false);
    alert(`Đã cấp thành công Digital Passport cho mã túi ${selectedSerialForPassport.serialId}!`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & 4 Sub-Tabs (Req 11) */}
      <div className="border-b border-[#E2D8C7] pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h1 className="text-base sm:text-lg font-bold text-[#2A2521] tracking-tight">
            Lưới & Passport
          </h1>
          <div className="flex items-center gap-2">
            {activeSubTab === "inbound" && (
              <button
                type="button"
                onClick={() => setShowInboundModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28] transition-colors shadow-xs"
              >
                + Nhận lô lưới
              </button>
            )}
            {activeSubTab === "production" && (
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28] transition-colors shadow-xs"
              >
                + Xuất cho sản xuất
              </button>
            )}
          </div>
        </div>

        {/* 4 Tabs Điều Hướng (Req 11) */}
        <div className="flex border-b border-[#E2D8C7] text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSubTab("inbound")}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeSubTab === "inbound"
                ? "border-[#C85A32] text-[#C85A32] font-bold"
                : "border-transparent text-[#7A6E65] hover:text-[#2A2521]"
            }`}
          >
            Nhận & xử lý ({batches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("inventory")}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeSubTab === "inventory"
                ? "border-[#C85A32] text-[#C85A32] font-bold"
                : "border-transparent text-[#7A6E65] hover:text-[#2A2521]"
            }`}
          >
            Kho lưới
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("production")}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeSubTab === "production"
                ? "border-[#C85A32] text-[#C85A32] font-bold"
                : "border-transparent text-[#7A6E65] hover:text-[#2A2521]"
            }`}
          >
            Sản xuất & mã túi ({slips.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("passport")}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeSubTab === "passport"
                ? "border-[#C85A32] text-[#C85A32] font-bold"
                : "border-transparent text-[#7A6E65] hover:text-[#2A2521]"
            }`}
          >
            Passport & QR ({serials.filter((s) => s.passport).length}/{serials.length})
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PHÂN HỆ 1: NHẬN & XỬ LÝ (Req 12, 13) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "inbound" && (
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9]">
              <tr>
                <th className="py-2.5 px-3">Mã lô</th>
                <th className="py-2.5 px-3">Nguồn cung cấp</th>
                <th className="py-2.5 px-3">Địa điểm thu gom</th>
                <th className="py-2.5 px-3">Ngày nhận</th>
                <th className="py-2.5 px-3">Cân thô ban đầu</th>
                <th className="py-2.5 px-3">Trạng thái xử lý</th>
                <th className="py-2.5 px-3">Lưới khô nhập kho</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFEB]">
              {batches.map((b) => (
                <tr key={b.batchId} className="hover:bg-[#FDFBF7]">
                  <td className="py-3 px-3 font-semibold text-[#C85A32]">{b.batchId}</td>
                  <td className="py-3 px-3 font-medium text-[#2A2521]">{b.supplierSource}</td>
                  <td className="py-3 px-3 text-[#7A6E65]">{b.seaRegion}</td>
                  <td className="py-3 px-3 text-[#7A6E65]">{b.receiveDate}</td>
                  <td className="py-3 px-3 font-medium">
                    {formatKg(b.initialWeightKg)}{" "}
                    <span className="text-[10px] text-[#A89C93]">({b.weighingCondition === "wet" ? "Ướt" : "Khô"})</span>
                  </td>
                  <td className="py-3 px-3">
                    {b.status === "processed" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Đã xử lý (Sẵn sàng)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        Chờ ghi kết quả giặt sấy
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-bold text-blue-700">
                    {b.processing ? formatKg(b.processing.usableDryKg) : "—"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {b.status === "unprocessed" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBatchForProcess(b);
                          setShowProcessModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28]"
                      >
                        Ghi xử lý →
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#7A6E65]">Đã nhập kho</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PHÂN HỆ 2: KHO LƯỚI (Req 14, 17) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "inventory" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
            <div className="p-3 bg-[#FAF7F2] border-b border-[#E8E2D9] flex items-center justify-between text-xs">
              <span className="font-bold text-[#2A2521]">Tồn kho theo từng lô lưới ma đã xử lý:</span>
              <span className="text-[11px] text-[#7A6E65]">Lưới sạch đã qua phân loại đạt chuẩn kéo sợi / đan</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9]">
                <tr>
                  <th className="py-2.5 px-3">Mã lô</th>
                  <th className="py-2.5 px-3">Vùng thu gom</th>
                  <th className="py-2.5 px-3">Lưới khô ban đầu</th>
                  <th className="py-2.5 px-3">Tồn kho khả dụng</th>
                  <th className="py-2.5 px-3">Vụn còn dùng được</th>
                  <th className="py-2.5 px-3">Đã xuất may</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFEB]">
                {batches
                  .filter((b) => b.status === "processed")
                  .map((b) => {
                    const exported = (b.processing?.usableDryKg || 0) - b.usableDryStockKg;
                    return (
                      <tr key={b.batchId} className="hover:bg-[#FDFBF7]">
                        <td className="py-3 px-3 font-semibold text-[#C85A32]">{b.batchId}</td>
                        <td className="py-3 px-3">{b.seaRegion}</td>
                        <td className="py-3 px-3 font-medium">{formatKg(b.processing?.usableDryKg || 0)}</td>
                        <td className="py-3 px-3 font-bold text-emerald-700">{formatKg(b.usableDryStockKg)}</td>
                        <td className="py-3 px-3 font-bold text-amber-700">{formatKg(b.reusableScrapsKg)}</td>
                        <td className="py-3 px-3 text-[#7A6E65]">{formatKg(Math.max(0, exported))}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PHÂN HỆ 3: SẢN XUẤT & MÃ TÚI (Req 15, 16, 18, 19) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "production" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
            <div className="p-3 bg-[#FAF7F2] border-b border-[#E8E2D9] flex items-center justify-between text-xs">
              <span className="font-bold text-[#2A2521]">Danh sách Phiếu Sản Xuất:</span>
              <span className="text-[11px] text-[#7A6E65]">Xuất lưới cho xưởng may và đối chiếu cân bằng vật liệu</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9]">
                <tr>
                  <th className="py-2.5 px-3">Mã phiếu</th>
                  <th className="py-2.5 px-3">Xưởng may</th>
                  <th className="py-2.5 px-3">Mẫu túi</th>
                  <th className="py-2.5 px-3">Lô lưới nguồn</th>
                  <th className="py-2.5 px-3">Lượng xuất</th>
                  <th className="py-2.5 px-3">Tiến độ may</th>
                  <th className="py-2.5 px-3">Túi đạt</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFEB]">
                {slips.map((s) => (
                  <tr key={s.slipId} className="hover:bg-[#FDFBF7]">
                    <td className="py-3 px-3 font-semibold text-[#C85A32]">{s.slipId}</td>
                    <td className="py-3 px-3 font-medium text-[#2A2521]">{s.workshopName}</td>
                    <td className="py-3 px-3">{s.bagModelName}</td>
                    <td className="py-3 px-3 text-[#7A6E65]">{s.exportedBatches.map((eb) => eb.batchId).join(", ")}</td>
                    <td className="py-3 px-3 font-bold text-blue-700">{formatKg(s.totalExportedKg)}</td>
                    <td className="py-3 px-3">
                      {s.status === "completed" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Đã xác nhận kết quả
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Đang may ở xưởng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#2A2521]">
                      {s.sewingResult ? `${s.sewingResult.passedBagsCount} túi` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {s.status === "in_production" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlipForSewing(s);
                            setShowSewingModal(true);
                          }}
                          className="px-2.5 py-1 rounded bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28]"
                        >
                          Nhập kết quả may →
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold">Đã tạo mã túi ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PHÂN HỆ 4: PASSPORT & QR (Req 20, 21, 22) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === "passport" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
            <div className="p-3 bg-[#FAF7F2] border-b border-[#E8E2D9] flex items-center justify-between text-xs">
              <span className="font-bold text-[#2A2521]">Sổ Cấp Digital Product Passport (Hộ Chiếu Túi):</span>
              <span className="text-[11px] text-[#7A6E65]">Minh bạch nguồn gốc từng chiếc túi xuất xưởng</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9]">
                <tr>
                  <th className="py-2.5 px-3">Mã túi (Serial ID)</th>
                  <th className="py-2.5 px-3">Tên sản phẩm</th>
                  <th className="py-2.5 px-3">Lô nguồn</th>
                  <th className="py-2.5 px-3">Lưới tiêu thụ</th>
                  <th className="py-2.5 px-3">Trạng thái Passport</th>
                  <th className="py-2.5 px-3">Câu chuyện cá nhân</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFEB]">
                {serials.map((s) => (
                  <tr key={s.serialId} className="hover:bg-[#FDFBF7]">
                    <td className="py-3 px-3 font-mono font-bold text-[#C85A32]">{s.serialId}</td>
                    <td className="py-3 px-3 font-medium text-[#2A2521]">{s.bagName}</td>
                    <td className="py-3 px-3 text-[#7A6E65]">{s.batchId}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-700">{formatKg(s.netWeightKg)}</td>
                    <td className="py-3 px-3">
                      {s.passport ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Đã cấp Passport ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                          Chưa cấp
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-[#7A6E65]">
                      {s.passport?.personalStory ? (
                        <span title={s.passport.personalStory}>
                          {s.passport.allowPublicStory ? "Công khai" : "Riêng tư"} ({s.passport.personalStory.substring(0, 15)}...)
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {s.passport ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/passport/${s.batchId}?itemId=${s.serialId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-[#FAF7F2] text-[#2A2521] border border-[#E8E2D9] hover:border-[#C85A32] text-[11px]"
                          >
                            Xem
                          </a>
                          <button
                            type="button"
                            onClick={() => alert(`Tải mã QR cho túi ${s.serialId}: https://nets.vn/passport/${s.batchId}?itemId=${s.serialId}`)}
                            className="px-2 py-1 rounded bg-[#FAF7F2] text-[#2A2521] border border-[#E8E2D9] hover:border-[#C85A32] text-[11px]"
                          >
                            QR
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSerialForPassport(s);
                            setShowPassportModal(true);
                          }}
                          className="px-2.5 py-1 rounded bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28]"
                        >
                          + Cấp Passport
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: TIẾP NHẬN LÔ LƯỚI THÔ (Req 12) */}
      {/* ------------------------------------------------------------- */}
      {showInboundModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-md p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <h2 className="text-sm font-bold text-[#2A2521]">+ Nhận lô lưới thô thu gom</h2>
              <button
                type="button"
                onClick={() => setShowInboundModal(false)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Nguồn cung cấp *</label>
                <input
                  type="text"
                  required
                  value={inboundForm.supplierSource}
                  onChange={(e) => setInboundForm({ ...inboundForm, supplierSource: e.target.value })}
                  placeholder="Ví dụ: Đội Thợ Lặn Sơn Trà..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Địa điểm thu gom *</label>
                <input
                  type="text"
                  required
                  value={inboundForm.seaRegion}
                  onChange={(e) => setInboundForm({ ...inboundForm, seaRegion: e.target.value })}
                  placeholder="Ví dụ: Rạn Bãi Bụt, Sơn Trà, Đà Nẵng"
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Khối lượng ban đầu (kg) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={inboundForm.initialWeightKg}
                    onChange={(e) => setInboundForm({ ...inboundForm, initialWeightKg: Number(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Tình trạng cân</label>
                  <select
                    value={inboundForm.weighingCondition}
                    onChange={(e) => setInboundForm({ ...inboundForm, weighingCondition: e.target.value as any })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  >
                    <option value="wet">Cân ướt (tại bến thuyền)</option>
                    <option value="dry">Cân khô (sau phơi ráo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Ngày tiếp nhận</label>
                <input
                  type="date"
                  value={inboundForm.receiveDate}
                  onChange={(e) => setInboundForm({ ...inboundForm, receiveDate: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                ℹ️ <strong>Lưu ý:</strong> Khối lượng này chưa được cộng vào kho dùng được cho đến khi bạn giặt sấy và bấm "Ghi xử lý".
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowInboundModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-100 text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#C85A32] text-white font-semibold hover:bg-[#B34E28]"
                >
                  Lưu hồ sơ tiếp nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: GHI KẾT QUẢ XỬ LÝ (Req 13) */}
      {/* ------------------------------------------------------------- */}
      {showProcessModal && selectedBatchForProcess && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-md p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <h2 className="text-sm font-bold text-[#2A2521]">
                Ghi kết quả xử lý lô #{selectedBatchForProcess.batchId}
              </h2>
              <button
                type="button"
                onClick={() => setShowProcessModal(false)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="text-[11px] text-[#7A6E65]">
                Cân thô ban đầu: <strong>{formatKg(selectedBatchForProcess.initialWeightKg)}</strong> (
                {selectedBatchForProcess.weighingCondition === "wet" ? "Cân ướt" : "Cân khô"})
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Lưới khô dùng được (kg) *</label>
                  <input
                    type="number"
                    min={1}
                    value={processForm.usableDryKg}
                    onChange={(e) => setProcessForm({ ...processForm, usableDryKg: Number(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs font-bold text-emerald-700"
                  />
                  <span className="text-[10px] text-emerald-800">Sẽ nhập vào kho sử dụng</span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Phần loại bỏ (kg)</label>
                  <input
                    type="number"
                    min={0}
                    value={processForm.discardedWasteKg}
                    onChange={(e) => setProcessForm({ ...processForm, discardedWasteKg: Number(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs text-red-700 font-bold"
                  />
                  <span className="text-[10px] text-red-800">Rác mục, bùn rêu</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Ghi chú chênh lệch độ ẩm / chất lượng</label>
                <textarea
                  value={processForm.notes}
                  onChange={(e) => setProcessForm({ ...processForm, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-100 text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmProcess}
                  className="px-3.5 py-1.5 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  Xác nhận & Nhập kho lưới khô
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: XUẤT CHO SẢN XUẤT (Req 15) */}
      {/* ------------------------------------------------------------- */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-md p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <h2 className="text-sm font-bold text-[#2A2521]">+ Xuất lưới cho xưởng may</h2>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExportToProduction} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Chọn lô lưới khô nguồn *</label>
                <select
                  value={exportForm.batchId}
                  onChange={(e) => setExportForm({ ...exportForm, batchId: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs font-semibold"
                >
                  {batches
                    .filter((b) => b.status === "processed" && b.usableDryStockKg > 0)
                    .map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.batchId} — Tồn kho khả dụng: {formatKg(b.usableDryStockKg)} ({b.seaRegion})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Khối lượng xuất (kg) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={exportForm.exportedKg}
                    onChange={(e) => setExportForm({ ...exportForm, exportedKg: Number(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Mẫu túi dự kiến may</label>
                  <select
                    value={exportForm.bagModelId}
                    onChange={(e) => {
                      const matched = BAG_BASES.find((b) => b.id === e.target.value);
                      setExportForm({
                        ...exportForm,
                        bagModelId: e.target.value,
                        bagModelName: matched?.name || "Túi Lưới NÉT",
                      });
                    }}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  >
                    {BAG_BASES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Xưởng / Thợ may nhận lưới *</label>
                <input
                  type="text"
                  required
                  value={exportForm.workshopName}
                  onChange={(e) => setExportForm({ ...exportForm, workshopName: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-100 text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#C85A32] text-white font-semibold hover:bg-[#B34E28]"
                >
                  Tạo phiếu & Trừ kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: XÁC NHẬN KẾT QUẢ MAY & CÂN BẰNG VẬT LIỆU (Req 16, 17) */}
      {/* ------------------------------------------------------------- */}
      {showSewingModal && selectedSlipForSewing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-lg p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <div>
                <h2 className="text-sm font-bold text-[#2A2521]">
                  Nhập kết quả may Phiếu #{selectedSlipForSewing.slipId}
                </h2>
                <div className="text-[11px] text-[#7A6E65]">
                  Lưới đã xuất: <strong>{formatKg(selectedSlipForSewing.totalExportedKg)}</strong> • Xưởng:{" "}
                  {selectedSlipForSewing.workshopName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSewingModal(false)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Số túi may đạt (chiếc) *</label>
                  <input
                    type="number"
                    min={1}
                    value={sewingForm.passedBagsCount}
                    onChange={(e) => setSewingForm({ ...sewingForm, passedBagsCount: Number(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-1.5 text-xs font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Lượng lưới trong túi đạt (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={sewingForm.netInPassedBagsKg}
                    onChange={(e) => setSewingForm({ ...sewingForm, netInPassedBagsKg: Number(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-1.5 text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Dư nguyên trả kho (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={sewingForm.returnedRawNetKg}
                    onChange={(e) => setSewingForm({ ...sewingForm, returnedRawNetKg: Number(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-1.5 text-xs text-blue-700 font-bold"
                  />
                  <span className="text-[10px] text-blue-800">Cộng lại lô nguồn</span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Vụn dùng tiếp (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={sewingForm.reusableScrapsKg}
                    onChange={(e) => setSewingForm({ ...sewingForm, reusableScrapsKg: Number(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-1.5 text-xs text-amber-700 font-bold"
                  />
                  <span className="text-[10px] text-amber-800">Nhập kho vụn</span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Loại bỏ (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={sewingForm.discardedWasteKg}
                    onChange={(e) => setSewingForm({ ...sewingForm, discardedWasteKg: Number(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-1.5 text-xs text-stone-700 font-bold"
                  />
                  <span className="text-[10px] text-stone-800">Phế phẩm cắt góc</span>
                </div>
              </div>

              {/* Phương pháp xác định trọng lượng mỗi túi (Req 19) */}
              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Phương pháp xác định lượng lưới mỗi túi:</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="attrMethod"
                      checked={sewingForm.attributionMethod === "distributed"}
                      onChange={() => setSewingForm({ ...sewingForm, attributionMethod: "distributed" })}
                    />
                    <span>Phân bổ đều theo phiếu ({formatKg(sewingForm.netInPassedBagsKg / Math.max(1, sewingForm.passedBagsCount))}/túi)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="attrMethod"
                      checked={sewingForm.attributionMethod === "actual"}
                      onChange={() => setSewingForm({ ...sewingForm, attributionMethod: "actual" })}
                    />
                    <span>Cân thực tế từng túi</span>
                  </label>
                </div>
              </div>

              {/* HỘP KIỂM TRA CÂN BẰNG VẬT LIỆU (Req 16) */}
              <div
                className={`p-3 rounded-lg border text-xs ${
                  materialBalance.isBalanced ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-red-50 border-red-300 text-red-900"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Đối soát cân bằng vật liệu:</span>
                  <span>{materialBalance.isBalanced ? "✓ Cân bằng hoàn hảo" : "⚠️ Chưa cân bằng!"}</span>
                </div>
                <div className="text-[11px] mt-1">
                  Lượng xuất: <strong>{materialBalance.totalInput}kg</strong> = Lưới trong túi ({sewingForm.netInPassedBagsKg}kg) + Dư trả kho ({sewingForm.returnedRawNetKg}kg) + Vụn ({sewingForm.reusableScrapsKg}kg) + Bỏ ({sewingForm.discardedWasteKg}kg) = <strong>{materialBalance.totalOutput}kg</strong>
                </div>
                {!materialBalance.isBalanced && (
                  <div className="font-bold text-red-700 mt-1">
                    Chênh lệch: {materialBalance.diff > 0 ? `Thừa +${materialBalance.diff}kg` : `Thiếu ${materialBalance.diff}kg`}. Nút xác nhận bị khóa cho đến khi cân bằng!
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowSewingModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-100 text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!materialBalance.isBalanced}
                  onClick={handleConfirmSewingResult}
                  className={`px-4 py-1.5 rounded font-semibold text-white transition-colors ${
                    materialBalance.isBalanced ? "bg-emerald-600 hover:bg-emerald-700" : "bg-stone-300 cursor-not-allowed"
                  }`}
                >
                  Xác nhận & Tự động tạo mã túi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: CẤP PASSPORT (Req 20, 21, 22) */}
      {/* ------------------------------------------------------------- */}
      {showPassportModal && selectedSerialForPassport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-md p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <h2 className="text-sm font-bold text-[#2A2521]">
                Cấp Passport cho mã túi #{selectedSerialForPassport.serialId}
              </h2>
              <button
                type="button"
                onClick={() => setShowPassportModal(false)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssuePassportSubmit} className="space-y-2.5">
              <div className="p-2.5 bg-[#FAF7F2] rounded border border-[#E8E2D9] space-y-1 text-[11px]">
                <div>
                  Mẫu túi: <strong>{selectedSerialForPassport.bagName}</strong>
                </div>
                <div>
                  Lô lưới nguồn: <strong>{selectedSerialForPassport.batchId}</strong> • Phiếu may:{" "}
                  <strong>{selectedSerialForPassport.slipId}</strong>
                </div>
                <div>
                  Lượng lưới sử dụng: <strong>{formatKg(selectedSerialForPassport.netWeightKg)}</strong> (
                  {selectedSerialForPassport.attributionMethod === "distributed" ? "Số phân bổ" : "Cân thực tế"})
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Câu chuyện charm đi kèm:</label>
                <input
                  type="text"
                  value={passportForm.charmStory}
                  onChange={(e) => setPassportForm({ ...passportForm, charmStory: e.target.value })}
                  placeholder="Ví dụ: Móc khoá men lam Cloisonné viền vàng..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              {/* Câu chuyện cá nhân & Bảo mật (Req 21) */}
              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">
                  Lời nhắn / Câu chuyện cá nhân của chủ túi:
                </label>
                <textarea
                  rows={2}
                  value={passportForm.personalStory}
                  onChange={(e) => setPassportForm({ ...passportForm, personalStory: e.target.value })}
                  placeholder="Ví dụ: Chiếc túi kỷ niệm mùa hè 2026 tại biển Sơn Trà cùng bạn bè..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={passportForm.allowPublicStory}
                  onChange={(e) => setPassportForm({ ...passportForm, allowPublicStory: e.target.checked })}
                  className="mt-0.5"
                />
                <label htmlFor="consentCheckbox" className="text-[11px] text-[#7A6E65] cursor-pointer">
                  Khách hàng đồng ý cho phép hiển thị câu chuyện công khai khi quét mã QR Passport. (Tuyệt đối không lộ SĐT hay địa chỉ).
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowPassportModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-100 text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#C85A32] text-white font-semibold hover:bg-[#B34E28]"
                >
                  Xác nhận cấp Passport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
