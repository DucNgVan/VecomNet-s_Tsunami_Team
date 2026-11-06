"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Voucher,
  VoucherDiscountType,
  VoucherApplicableTarget,
  VoucherCustomerTarget,
} from "@/types";
import {
  getStoredVouchers,
  saveVoucher,
  deleteVoucher,
  toggleVoucherStatus,
} from "@/lib/voucherStorage";
import { formatVND } from "@/lib/utils";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Copy,
  Tag,
  ArrowRight,
  ShieldCheck,
  Percent,
  Layers,
  Users,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";

export const AdminVouchersTab: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | VoucherDiscountType>("all");
  const [customerFilter, setCustomerFilter] = useState<"all" | VoucherCustomerTarget>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percentage" as VoucherDiscountType,
    discountValue: 10,
    maxDiscountAmount: "" as string | number,
    minOrderValue: "" as string | number,
    minQuantity: "" as string | number,
    applicableTarget: "all" as VoucherApplicableTarget,
    customerTarget: "all" as VoucherCustomerTarget,
    usageLimit: "" as string | number,
    startDate: "",
    endDate: "",
    isActive: true,
    isPublic: true,
  });

  // Load vouchers on mount
  useEffect(() => {
    setVouchers(getStoredVouchers());
  }, []);

  const reloadData = () => {
    setVouchers(getStoredVouchers());
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = (v: Voucher) => {
    const updated = toggleVoucherStatus(v.id, !v.isActive);
    setVouchers(updated);
  };

  const handleDelete = (v: Voucher) => {
    if (confirm(`Bạn có chắc chắn muốn xóa voucher "${v.code}" (${v.title})?`)) {
      const updated = deleteVoucher(v.id);
      setVouchers(updated);
    }
  };

  const openCreateModal = () => {
    setEditingVoucher(null);
    setFormData({
      code: "",
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      maxDiscountAmount: "",
      minOrderValue: "",
      minQuantity: "",
      applicableTarget: "all",
      customerTarget: "all",
      usageLimit: 100,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "2027-12-31",
      isActive: true,
      isPublic: true,
    });
    setShowModal(true);
  };

  const openEditModal = (v: Voucher) => {
    setEditingVoucher(v);
    setFormData({
      code: v.code,
      title: v.title,
      description: v.description,
      discountType: v.discountType,
      discountValue: v.discountValue,
      maxDiscountAmount: v.maxDiscountAmount || "",
      minOrderValue: v.minOrderValue || "",
      minQuantity: v.minQuantity || "",
      applicableTarget: v.applicableTarget,
      customerTarget: v.customerTarget,
      usageLimit: v.usageLimit || "",
      startDate: v.startDate || "",
      endDate: v.endDate || "",
      isActive: v.isActive,
      isPublic: v.isPublic,
    });
    setShowModal(true);
  };

  // Quick Preset Handlers
  const applyPresetCharm50k = () => {
    setEditingVoucher(null);
    setFormData({
      code: "CHARM50K",
      title: "Voucher Đồng Giá Charm 50K",
      description:
        "Đồng giá 50.000đ cho mỗi charm khi mua từ 2 charm trở lên (áp dụng cho cả charm lẻ & charm trên túi thiết kế).",
      discountType: "same_price_item",
      discountValue: 50000,
      maxDiscountAmount: "",
      minOrderValue: "",
      minQuantity: 2,
      applicableTarget: "charm",
      customerTarget: "all",
      usageLimit: 500,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "2027-12-31",
      isActive: true,
      isPublic: true,
    });
    setShowModal(true);
  };

  const applyPresetOpeningCeremony = () => {
    setEditingVoucher(null);
    setFormData({
      code: "NETSOPENING",
      title: "NÉT Opening Ceremony - Giảm 10%",
      description: "Giảm 10% trên toàn bộ hoá đơn áp dụng cho khách hàng mới mua lần đầu tiên.",
      discountType: "percentage",
      discountValue: 10,
      maxDiscountAmount: 300000,
      minOrderValue: 200000,
      minQuantity: "",
      applicableTarget: "all",
      customerTarget: "new_customer",
      usageLimit: 200,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "2027-12-31",
      isActive: true,
      isPublic: true,
    });
    setShowModal(true);
  };

  const applyPresetFreeShip = () => {
    setEditingVoucher(null);
    setFormData({
      code: "FREESHIP",
      title: "Miễn Phí Giao Hàng Toàn Quốc",
      description: "Miễn phí 100% phí giao hàng cho đơn hàng từ 450.000đ trở lên.",
      discountType: "free_shipping",
      discountValue: 0,
      maxDiscountAmount: "",
      minOrderValue: 450000,
      minQuantity: "",
      applicableTarget: "all",
      customerTarget: "all",
      usageLimit: 1000,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "2027-12-31",
      isActive: true,
      isPublic: true,
    });
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim()) {
      alert("Vui lòng nhập Mã Voucher và Tên Voucher!");
      return;
    }

    const payload: Partial<Voucher> & { code: string; title: string } = {
      ...(editingVoucher ? { id: editingVoucher.id } : {}),
      code: formData.code.trim().toUpperCase(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue) || 0,
      maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
      minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : undefined,
      minQuantity: formData.minQuantity ? Number(formData.minQuantity) : undefined,
      applicableTarget: formData.applicableTarget,
      customerTarget: formData.customerTarget,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      isActive: formData.isActive,
      isPublic: formData.isPublic,
    };

    const updated = saveVoucher(payload);
    setVouchers(updated);
    setShowModal(false);
  };

  // Filtered Vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const matchSearch =
        searchTerm === "" ||
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && v.isActive) ||
        (statusFilter === "inactive" && !v.isActive);

      const matchType = typeFilter === "all" || v.discountType === typeFilter;
      const matchCustomer = customerFilter === "all" || v.customerTarget === customerFilter;

      return matchSearch && matchStatus && matchType && matchCustomer;
    });
  }, [vouchers, searchTerm, statusFilter, typeFilter, customerFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.isActive).length;
    const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);
    const charmVouchers = vouchers.filter((v) => v.applicableTarget === "charm").length;
    return { total, active, totalUsed, charmVouchers };
  }, [vouchers]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Metric Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E2D9] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#C85A32] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              🎟️
            </span>
            <h1 className="text-xl font-bold text-[#2A2521]">
              Quản lý Mã Giảm Giá & Chương Trình Khuyến Mãi
            </h1>
          </div>
          <p className="text-xs text-[#7A6E65] mt-1">
            Thiết lập các mã voucher, đồng giá charm, giảm giá mở màn hoặc chiến dịch ưu đãi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-[#C85A32] hover:bg-[#B34E28] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Voucher Mới</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-bold text-[#2A2521] flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-[#C85A32]" /> Mẫu tạo nhanh gợi ý:
        </span>
        <button
          type="button"
          onClick={applyPresetCharm50k}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E2D9] hover:border-[#C85A32] text-xs font-medium text-[#2A2521] shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>⭐ Đồng giá Charm 50k (từ 2 charm)</span>
        </button>
        <button
          type="button"
          onClick={applyPresetOpeningCeremony}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E2D9] hover:border-[#C85A32] text-xs font-medium text-[#2A2521] shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>🎉 Opening Ceremony 10% (khách mới)</span>
        </button>
        <button
          type="button"
          onClick={applyPresetFreeShip}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E2D9] hover:border-[#C85A32] text-xs font-medium text-[#2A2521] shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>🚚 Freeship toàn quốc (đơn từ 450k)</span>
        </button>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E8E2D9] shadow-2xs">
          <div className="text-[11px] font-semibold text-[#7A6E65]">Tổng số Voucher</div>
          <div className="text-2xl font-black text-[#2A2521] mt-1">{metrics.total}</div>
          <div className="text-[10px] text-[#7A6E65] mt-1">Đã cấu hình trong xưởng</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E8E2D9] shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800">Đang hoạt động</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.active}</div>
          <div className="text-[10px] text-emerald-700 mt-1">Khách có thể áp dụng</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E8E2D9] shadow-2xs">
          <div className="text-[11px] font-semibold text-sky-800">Lượt đã sử dụng</div>
          <div className="text-2xl font-black text-sky-700 mt-1">{metrics.totalUsed}</div>
          <div className="text-[10px] text-sky-700 mt-1">Lần quy đổi mã đơn hàng</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E8E2D9] shadow-2xs">
          <div className="text-[11px] font-semibold text-[#C85A32]">Chiến dịch Charm</div>
          <div className="text-2xl font-black text-[#C85A32] mt-1">{metrics.charmVouchers}</div>
          <div className="text-[10px] text-[#C85A32] mt-1">Ưu đãi đồng giá & gắn charm</div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-[#E8E2D9] shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-[#7A6E65] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã voucher, tiêu đề, mô tả..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg text-xs text-[#2A2521] focus:outline-none focus:border-[#C85A32]"
            />
          </div>

          <div className="sm:col-span-7 flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto flex-1 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg px-2.5 py-2 text-xs text-[#2A2521] focus:outline-none focus:border-[#C85A32]"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="active">Đang bật (Active)</option>
              <option value="inactive">Đang tắt (Inactive)</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full sm:w-auto flex-1 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg px-2.5 py-2 text-xs text-[#2A2521] focus:outline-none focus:border-[#C85A32]"
            >
              <option value="all">Loại ưu đãi: Tất cả</option>
              <option value="percentage">Giảm theo %</option>
              <option value="same_price_item">Đồng giá sản phẩm</option>
              <option value="fixed_amount">Giảm tiền cố định</option>
              <option value="free_shipping">Miễn phí ship</option>
            </select>

            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value as any)}
              className="w-full sm:w-auto flex-1 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg px-2.5 py-2 text-xs text-[#2A2521] focus:outline-none focus:border-[#C85A32]"
            >
              <option value="all">Khách hàng: Tất cả</option>
              <option value="new_customer">Chỉ khách mới (Đơn đầu)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table List of Vouchers */}
      <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#7A6E65] font-semibold">
                <th className="py-3 px-3.5">Mã Code</th>
                <th className="py-3 px-3.5">Tên Chương Trình & Mô Tả</th>
                <th className="py-3 px-3.5">Mức Giảm</th>
                <th className="py-3 px-3.5">Điều Kiện Áp Dụng</th>
                <th className="py-3 px-3.5">Lượt Dùng / Giới Hạn</th>
                <th className="py-3 px-3.5">Hiệu Lực</th>
                <th className="py-3 px-3.5 text-center">Trạng Thái</th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9]">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-400">
                    Không tìm thấy voucher nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const usagePct = v.usageLimit
                    ? Math.min(100, Math.round(((v.usedCount || 0) / v.usageLimit) * 100))
                    : 0;

                  return (
                    <tr key={v.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs px-2.5 py-1 rounded bg-[#F5F0E8] border border-[#E2D8C7] text-[#2A2521] tracking-wider">
                            {v.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(v.code)}
                            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                            title="Sao chép mã"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {copiedCode === v.code && (
                          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                            Đã sao chép!
                          </span>
                        )}
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-3.5 max-w-xs">
                        <div className="font-bold text-[#2A2521]">{v.title}</div>
                        <div className="text-[11px] text-[#7A6E65] line-clamp-2 mt-0.5">
                          {v.description}
                        </div>
                        {v.isPublic && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 mt-1">
                            <Eye className="w-2.5 h-2.5" /> Hiện ở giỏ hàng
                          </span>
                        )}
                      </td>

                      {/* Discount Type & Value */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        {v.discountType === "percentage" && (
                          <div>
                            <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              Giảm {v.discountValue}%
                            </span>
                            {v.maxDiscountAmount && (
                              <div className="text-[10px] text-stone-500 mt-1">
                                Tối đa: {formatVND(v.maxDiscountAmount)}
                              </div>
                            )}
                          </div>
                        )}
                        {v.discountType === "same_price_item" && (
                          <div>
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              Đồng giá {formatVND(v.discountValue)}
                            </span>
                            <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                              Áp dụng cho Charm
                            </div>
                          </div>
                        )}
                        {v.discountType === "fixed_amount" && (
                          <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Giảm {formatVND(v.discountValue)}
                          </span>
                        )}
                        {v.discountType === "free_shipping" && (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Freeship 100%
                          </span>
                        )}
                      </td>

                      {/* Conditions */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {v.applicableTarget === "charm" && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                              Từ {v.minQuantity || 2} charm
                            </span>
                          )}
                          {v.customerTarget === "new_customer" && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                              Khách hàng mới
                            </span>
                          )}
                          {v.minOrderValue && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                              Đơn ≥ {formatVND(v.minOrderValue)}
                            </span>
                          )}
                          {v.minQuantity && v.applicableTarget !== "charm" && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                              SL ≥ {v.minQuantity} món
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-[#2A2521]">
                          <span>{v.usedCount || 0}</span>
                          <span className="text-stone-400 font-normal">
                            / {v.usageLimit ? v.usageLimit : "∞"}
                          </span>
                        </div>
                        {v.usageLimit && (
                          <div className="w-20 bg-stone-100 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                usagePct >= 90 ? "bg-rose-500" : "bg-[#C85A32]"
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Date Range */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap text-[11px] text-[#7A6E65]">
                        {v.endDate ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>Đến {v.endDate}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400">Vô thời hạn</span>
                        )}
                      </td>

                      {/* Status Switch */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(v)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            v.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                          }`}
                        >
                          {v.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đang bật</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-stone-500" />
                              <span>Tạm ngưng</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(v)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-[#2A2521] hover:bg-stone-100 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(v)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Xóa voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Create / Edit Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E8E2D9] w-full max-w-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#C85A32]" />
                <h2 className="text-base font-bold text-[#2A2521]">
                  {editingVoucher ? `Chỉnh sửa Voucher: ${editingVoucher.code}` : "Tạo Mã Voucher Khuyến Mãi Mới"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Row 1: Code & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Mã Voucher * (Ví dụ: CHARM50K, NETSOPENING)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="NETS10, CHARM50K..."
                    className="w-full uppercase font-mono font-bold bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2.5 text-xs text-[#2A2521] focus:outline-none focus:border-[#C85A32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Tên chương trình ưu đãi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Voucher Đồng Giá Charm 50k..."
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2.5 text-xs text-[#2A2521] focus:outline-none focus:border-[#C85A32]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                  Mô tả điều kiện (Hiển thị cho khách hàng xem)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Đồng giá 50.000đ cho mỗi charm khi mua từ 2 charm trở lên..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2.5 text-xs text-[#2A2521] focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              {/* Row 2: Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]">
                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Loại giảm giá *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as VoucherDiscountType,
                        discountValue:
                          e.target.value === "percentage"
                            ? 10
                            : e.target.value === "same_price_item"
                            ? 50000
                            : e.target.value === "free_shipping"
                            ? 0
                            : 50000,
                      })
                    }
                    className="w-full bg-white border border-[#E8E2D9] rounded-lg p-2 text-xs font-semibold text-[#2A2521] focus:outline-none focus:border-[#C85A32]"
                  >
                    <option value="percentage">Giảm theo % (Percentage)</option>
                    <option value="same_price_item">Đồng giá sản phẩm (Same Price)</option>
                    <option value="fixed_amount">Giảm số tiền cố định (Fixed Amount)</option>
                    <option value="free_shipping">Miễn phí vận chuyển (Free Shipping)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    {formData.discountType === "percentage"
                      ? "Mức % giảm (Ví dụ: 10 cho 10%)"
                      : formData.discountType === "same_price_item"
                      ? "Mức đồng giá (Ví dụ: 50000đ)"
                      : formData.discountType === "free_shipping"
                      ? "Miễn phí ship (Tự động 0đ)"
                      : "Số tiền giảm (VND)"}
                  </label>
                  <input
                    type="number"
                    disabled={formData.discountType === "free_shipping"}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full bg-white border border-[#E8E2D9] rounded-lg p-2 text-xs font-bold text-[#2A2521] focus:outline-none focus:border-[#C85A32] disabled:bg-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Giảm tối đa (VND - áp dụng cho %)
                  </label>
                  <input
                    type="number"
                    disabled={formData.discountType !== "percentage"}
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    placeholder="300000"
                    className="w-full bg-white border border-[#E8E2D9] rounded-lg p-2 text-xs text-[#2A2521] focus:outline-none focus:border-[#C85A32] disabled:bg-stone-100"
                  />
                </div>
              </div>

              {/* Row 3: Conditions (Target, Customer, Min Quantity, Min Order Value) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Áp dụng cho đối tượng sản phẩm
                  </label>
                  <select
                    value={formData.applicableTarget}
                    onChange={(e) => setFormData({ ...formData, applicableTarget: e.target.value as any })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-xs font-medium text-[#2A2521]"
                  >
                    <option value="all">Toàn bộ giỏ hàng</option>
                    <option value="charm">Riêng Charm (Charm lẻ & Charm trên túi)</option>
                    <option value="bag">Riêng Túi xách</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Đối tượng khách hàng
                  </label>
                  <select
                    value={formData.customerTarget}
                    onChange={(e) => setFormData({ ...formData, customerTarget: e.target.value as any })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-xs font-medium text-[#2A2521]"
                  >
                    <option value="all">Tất cả khách hàng</option>
                    <option value="new_customer">Chỉ khách hàng mới mua lần đầu (0 đơn trước đó)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Số lượng tối thiểu (Ví dụ: từ 2 charm)
                  </label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                    placeholder="2"
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-xs text-[#2A2521]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Đơn hàng tối thiểu (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    placeholder="200000"
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-xs text-[#2A2521]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Giới hạn số lượt dùng tối đa
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="200"
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-xs text-[#2A2521]"
                  />
                </div>
              </div>

              {/* Row 4: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Ngày bắt đầu có hiệu lực
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-xs text-[#2A2521]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2A2521] mb-1">
                    Ngày kết thúc hiệu lực
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-xs text-[#2A2521]"
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#E8E2D9]">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#2A2521]">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#C85A32] focus:ring-[#C85A32]"
                  />
                  <span>Kích hoạt voucher ngay (Active)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#2A2521]">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded text-[#C85A32] focus:ring-[#C85A32]"
                  />
                  <span>Hiển thị công khai trong danh sách voucher giỏ hàng</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8E2D9] text-[#7A6E65] hover:bg-[#FAF7F2] font-semibold text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C85A32] hover:bg-[#B34E28] text-white font-bold text-xs shadow-xs"
                >
                  {editingVoucher ? "Lưu thay đổi" : "Tạo voucher ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
