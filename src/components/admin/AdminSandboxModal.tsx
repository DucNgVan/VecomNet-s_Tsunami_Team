"use client";

import React, { useState } from "react";
import { resetAdminSandboxData } from "@/lib/adminDataStorage";

interface AdminSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const AdminSandboxModal: React.FC<AdminSandboxModalProps> = ({
  isOpen,
  onClose,
  onDataReset,
}) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [selectedAction, setSelectedAction] = useState<"seed" | "clear">("seed");

  if (!isOpen) return null;

  const handleExecute = () => {
    if (confirmInput.trim().toUpperCase() !== "XAC NHAN") {
      alert('Vui lòng gõ chính xác chữ "XAC NHAN" để đảm bảo an toàn!');
      return;
    }

    if (selectedAction === "seed") {
      resetAdminSandboxData();
      alert("Đã khôi phục bộ dữ liệu mẫu chuẩn cho hệ thống!");
    } else {
      localStorage.removeItem("net_admin_orders_v2");
      localStorage.removeItem("net_admin_batches_v2");
      localStorage.removeItem("net_admin_slips_v2");
      localStorage.removeItem("net_admin_serials_v2");
      localStorage.removeItem("net_admin_partners_v2");
      alert("Đã làm trống toàn bộ dữ liệu thử nghiệm!");
    }

    onDataReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-red-300 w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <h2 className="text-sm font-bold text-red-700">Khu vực thử nghiệm & Quản lý dữ liệu mẫu</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-black font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-900 text-[11px] space-y-1">
          <div className="font-bold">Cảnh báo phạm vi:</div>
          <p>
            Các thao tác tại đây đã được tách riêng khỏi màn hình vận hành chính để tránh bấm nhầm. Chỉ thực hiện khi kiểm thử tính năng hoặc cần nạp lại dữ liệu demo.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-[#2A2521]">Chọn thao tác muốn thực hiện:</label>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8E2D9] cursor-pointer">
              <input
                type="radio"
                name="sandboxAction"
                checked={selectedAction === "seed"}
                onChange={() => setSelectedAction("seed")}
              />
              <div>
                <div className="font-bold text-[#2A2521]">Khôi phục bộ dữ liệu mẫu chuẩn</div>
                <div className="text-[10px] text-[#7A6E65]">Nạp lại đơn hàng, lô lưới Sơn Trà/Nam Ô và đối tác mẫu</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8E2D9] cursor-pointer">
              <input
                type="radio"
                name="sandboxAction"
                checked={selectedAction === "clear"}
                onChange={() => setSelectedAction("clear")}
              />
              <div>
                <div className="font-bold text-red-700">Xóa trắng toàn bộ dữ liệu thử nghiệm</div>
                <div className="text-[10px] text-[#7A6E65]">Xóa toàn bộ các bảng trong bộ nhớ cục bộ</div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-red-700">
            Xác nhận an toàn (Gõ chữ "XAC NHAN" để mở khóa):
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="XAC NHAN"
            className="w-full bg-[#FAF7F2] border border-red-300 rounded p-2 text-xs font-mono font-bold mt-1 text-center"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-stone-100 text-stone-700"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={confirmInput.trim().toUpperCase() !== "XAC NHAN"}
            onClick={handleExecute}
            className={`px-4 py-1.5 rounded font-semibold text-white transition-colors ${
              confirmInput.trim().toUpperCase() === "XAC NHAN"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-stone-300 cursor-not-allowed"
            }`}
          >
            Thực thi thao tác
          </button>
        </div>
      </div>
    </div>
  );
};
