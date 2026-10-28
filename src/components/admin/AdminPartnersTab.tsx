"use client";

import React, { useState, useMemo } from "react";
import { Partner, AdminOrder, saveAdminPartner, deleteAdminPartner } from "@/lib/adminDataStorage";
import { formatVND } from "@/lib/utils";

interface AdminPartnersTabProps {
  partners: Partner[];
  orders: AdminOrder[];
  onPartnersChange: (updated: Partner[]) => void;
}

export const AdminPartnersTab: React.FC<AdminPartnersTabProps> = ({
  partners,
  orders,
  onPartnersChange,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPartnerForOrders, setSelectedPartnerForOrders] = useState<Partner | null>(null);

  const [addForm, setAddForm] = useState({
    name: "",
    type: "hotel" as Partner["type"],
    contactPerson: "",
    phone: "",
    email: "",
    referralCode: "",
    commissionRate: 0.12, // Mặc định 12%
    notes: "",
  });

  // Tính toán hoa hồng dựa trên doanh thu sản phẩm thực thu sau hoàn trả (Req 23)
  const partnerStats = useMemo(() => {
    return partners.map((partner) => {
      const linkedOrders = orders.filter((o) => o.partnerCode === partner.referralCode);
      // Doanh thu thực thu sau hoàn trả
      const actualCollectedRevenue = linkedOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
      const commissionAmount = Math.round(actualCollectedRevenue * partner.commissionRate);

      return {
        ...partner,
        orderCount: linkedOrders.length,
        actualCollectedRevenue,
        commissionAmount,
        linkedOrders,
      };
    });
  }, [partners, orders]);

  const handleAddPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.referralCode.trim()) {
      alert("Vui lòng nhập tên đối tác và mã giới thiệu!");
      return;
    }

    const newPartner: Partner = {
      id: `partner-${Date.now()}`,
      name: addForm.name.trim(),
      type: addForm.type,
      contactPerson: addForm.contactPerson.trim(),
      phone: addForm.phone.trim(),
      email: addForm.email.trim(),
      referralCode: addForm.referralCode.trim().toUpperCase(),
      commissionRate: Number(addForm.commissionRate) || 0.12,
      notes: addForm.notes.trim(),
    };

    const saved = saveAdminPartner(newPartner);
    onPartnersChange(saved);
    setShowAddModal(false);
    setAddForm({
      name: "",
      type: "hotel",
      contactPerson: "",
      phone: "",
      email: "",
      referralCode: "",
      commissionRate: 0.12,
      notes: "",
    });
    alert(`Đã thêm đối tác mới: ${newPartner.name}!`);
  };

  const handleMarkReconciled = (partnerId: string, commission: number) => {
    const nowStr = new Date().toLocaleDateString("vi-VN");
    const target = partners.find((p) => p.id === partnerId);
    if (!target) return;

    if (!confirm(`Xác nhận đánh dấu đã thanh toán ${formatVND(commission)} hoa hồng cho đối tác ${target.name}?`)) {
      return;
    }

    const updated: Partner = {
      ...target,
      totalReconciledAmount: (target.totalReconciledAmount || 0) + commission,
      lastReconciledAt: nowStr,
    };
    const saved = saveAdminPartner(updated);
    onPartnersChange(saved);
    alert(`Đã ghi nhận đối soát và thanh toán hoa hồng cho ${target.name}!`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header (Req 23) */}
      <div className="flex items-center justify-between border-b border-[#E2D8C7] pb-2.5">
        <h1 className="text-base sm:text-lg font-bold text-[#2A2521] tracking-tight">Đối tác & Hoa hồng</h1>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-lg bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28] transition-colors shadow-xs"
        >
          + Thêm đối tác
        </button>
      </div>

      {/* 2. Bảng Danh Sách Đối Tác (Req 23) */}
      <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9] font-medium">
            <tr>
              <th className="py-2.5 px-3">Đối tác</th>
              <th className="py-2.5 px-3">Mã giới thiệu</th>
              <th className="py-2.5 px-3">Người liên hệ</th>
              <th className="py-2.5 px-3">Tỷ lệ hoa hồng</th>
              <th className="py-2.5 px-3">Số đơn gắn mã</th>
              <th className="py-2.5 px-3">Doanh thu thực thu</th>
              <th className="py-2.5 px-3">Hoa hồng cần chi</th>
              <th className="py-2.5 px-3 text-right">Đối soát</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4EFEB]">
            {partnerStats.map((p) => (
              <tr key={p.id} className="hover:bg-[#FDFBF7]">
                <td className="py-3 px-3">
                  <div className="font-semibold text-[#2A2521]">{p.name}</div>
                  <div className="text-[10px] text-[#A89C93]">
                    {p.type === "hotel"
                      ? "Khách sạn / Resort"
                      : p.type === "tour"
                      ? "Tour du lịch"
                      : p.type === "souvenir_shop"
                      ? "Cửa hàng quà tặng"
                      : "Đại sứ môi trường"}
                  </div>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-[#C85A32]">{p.referralCode}</td>
                <td className="py-3 px-3">
                  <div className="text-[#2A2521]">{p.contactPerson}</div>
                  <div className="text-[11px] text-[#7A6E65]">{p.phone}</div>
                </td>
                <td className="py-3 px-3 font-semibold text-blue-700">{Math.round(p.commissionRate * 100)}%</td>
                <td className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPartnerForOrders(p)}
                    className="font-bold text-[#C85A32] hover:underline"
                  >
                    {p.orderCount} đơn →
                  </button>
                </td>
                <td className="py-3 px-3 font-medium text-emerald-700">{formatVND(p.actualCollectedRevenue)}</td>
                <td className="py-3 px-3 font-bold text-amber-700">{formatVND(p.commissionAmount)}</td>
                <td className="py-3 px-3 text-right">
                  <button
                    type="button"
                    disabled={p.commissionAmount === 0}
                    onClick={() => handleMarkReconciled(p.id, p.commissionAmount)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      p.commissionAmount > 0
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-stone-100 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    Đã thanh toán ✓
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Modal Thêm Đối Tác (Req 23) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-md p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <h2 className="text-sm font-bold text-[#2A2521]">+ Thêm đối tác giới thiệu mới</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPartnerSubmit} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Tên đối tác (Khách sạn / Tour / Shop) *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Ví dụ: Furama Resort Bãi Bụt..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Phân loại đối tác</label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value as any })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  >
                    <option value="hotel">Khách sạn / Resort</option>
                    <option value="tour">Công ty Tour du lịch</option>
                    <option value="souvenir_shop">Cửa hàng lưu niệm</option>
                    <option value="ambassador">Đại sứ xanh</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Mã giới thiệu (Referral Code) *</label>
                  <input
                    type="text"
                    required
                    value={addForm.referralCode}
                    onChange={(e) => setAddForm({ ...addForm, referralCode: e.target.value.toUpperCase() })}
                    placeholder="VD: FURAMA-DN"
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Người liên hệ</label>
                  <input
                    type="text"
                    value={addForm.contactPerson}
                    onChange={(e) => setAddForm({ ...addForm, contactPerson: e.target.value })}
                    placeholder="Chị Lan Anh"
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Số điện thoại</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="0905..."
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Tỷ lệ hoa hồng thỏa thuận (10% – 15%)</label>
                <select
                  value={addForm.commissionRate}
                  onChange={(e) => setAddForm({ ...addForm, commissionRate: Number(e.target.value) })}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs font-semibold text-blue-700"
                >
                  <option value={0.10}>10% (Cửa hàng ký gửi / Đại sứ)</option>
                  <option value={0.12}>12% (Công ty Tour du lịch)</option>
                  <option value={0.15}>15% (Khách sạn & Resort cao cấp)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Ghi chú thỏa thuận</label>
                <textarea
                  rows={2}
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder="Kỳ đối soát ngày 25 hàng tháng..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-100 text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#C85A32] text-white font-semibold hover:bg-[#B34E28]"
                >
                  Lưu đối tác
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Danh Sách Đơn Của Đối Tác (Req 23) */}
      {selectedPartnerForOrders && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-xl p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <div>
                <h2 className="text-sm font-bold text-[#2A2521]">
                  Đơn hàng gắn mã [{selectedPartnerForOrders.referralCode}] — {selectedPartnerForOrders.name}
                </h2>
                <div className="text-[11px] text-[#7A6E65]">
                  Tỷ lệ hoa hồng: {Math.round(selectedPartnerForOrders.commissionRate * 100)}%
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartnerForOrders(null)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#F4EFEB]">
              {orders.filter((o) => o.partnerCode === selectedPartnerForOrders.referralCode).length === 0 ? (
                <div className="py-6 text-center text-[#7A6E65]">
                  Chưa có đơn hàng nào gắn mã đối tác này.
                </div>
              ) : (
                orders
                  .filter((o) => o.partnerCode === selectedPartnerForOrders.referralCode)
                  .map((o) => {
                    const commission = Math.round(o.paidAmount * selectedPartnerForOrders.commissionRate);
                    return (
                      <div key={o.orderId} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#2A2521]">#{o.orderCode} — {o.customer.fullName}</div>
                          <div className="text-[11px] text-[#7A6E65]">
                            {o.createdAt} • Thực thu: {formatVND(o.paidAmount)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-amber-700">+{formatVND(commission)}</div>
                          <div className="text-[10px] text-[#A89C93]">Hoa hồng</div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setSelectedPartnerForOrders(null)}
                className="px-3 py-1.5 rounded bg-stone-100 text-stone-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
