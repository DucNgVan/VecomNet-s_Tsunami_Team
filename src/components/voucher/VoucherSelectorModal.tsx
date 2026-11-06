"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Voucher, CartItem, AppliedVoucherInfo } from "@/types";
import {
  getStoredVouchers,
  validateAndCalculateVoucher,
  extractCartCharms,
} from "@/lib/voucherStorage";
import { formatVND } from "@/lib/utils";
import {
  X,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  Tag,
  Copy,
} from "lucide-react";

interface VoucherSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  appliedVoucher: AppliedVoucherInfo | null;
  onApplyVoucher: (
    voucher: Voucher
  ) => { success: boolean; message: string; discountAmount?: number };
  onApplyByCode: (
    code: string
  ) => { success: boolean; message: string; discountAmount?: number };
  onRemoveVoucher: () => void;
  isNewCustomer?: boolean;
}

export const VoucherSelectorModal: React.FC<VoucherSelectorModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  shippingFee,
  appliedVoucher,
  onApplyVoucher,
  onApplyByCode,
  onRemoveVoucher,
  isNewCustomer,
}) => {
  const [manualCode, setManualCode] = useState("");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Load vouchers from storage
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setManualCode("");
      setVouchers(getStoredVouchers());
    }
  }, [isOpen]);

  const charmData = useMemo(() => extractCartCharms(items), [items]);

  // Evaluate each voucher against current cart items & subtotal
  const evaluatedVouchers = useMemo(() => {
    return vouchers.map((v) => {
      const evaluation = validateAndCalculateVoucher(v, {
        items,
        subtotal,
        shippingFee,
        isNewCustomer,
      });

      const isCurrentApplied =
        appliedVoucher?.code.toUpperCase() === v.code.toUpperCase();

      return {
        voucher: v,
        isEligible: evaluation.eligible,
        discountAmount: evaluation.discountAmount,
        isFreeShipping: evaluation.isFreeShipping,
        reason: evaluation.reason,
        isCurrentApplied,
      };
    });
  }, [vouchers, items, subtotal, shippingFee, isNewCustomer, appliedVoucher]);

  const handleApplyClick = (v: Voucher) => {
    setFeedback(null);
    const res = onApplyVoucher(v);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setFeedback(null);
    const res = onApplyByCode(manualCode.trim());
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      setManualCode("");
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50/70 via-white to-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0b1e3b] text-sky-300 flex items-center justify-center shadow-md">
              <Ticket className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#0b1e3b] leading-tight">
                Mã Giảm Giá NÉT Ocean Craft
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Áp dụng ưu đãi mua sắm hoặc nhập mã đặc quyền
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input manual voucher */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher (VD: NETSOPENING, CHARM50K)"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-900 focus:outline-none focus:border-[#0b1e3b] shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 sm:px-6 py-2.5 rounded-xl bg-[#0b1e3b] hover:bg-[#13305a] text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              Áp Dụng
            </button>
          </form>

          {/* Feedback alert */}
          {feedback && (
            <div
              className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Available Vouchers List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>VOUCHER ĐANG KHẢ DỤNG</span>
            {charmData.totalCharmCount > 0 && (
              <span className="text-sky-700 font-bold">
                Giỏ hàng: {charmData.totalCharmCount} charm
              </span>
            )}
          </div>

          {evaluatedVouchers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Hiện chưa có mã giảm giá nào khả dụng.
            </div>
          ) : (
            evaluatedVouchers.map((ev) => {
              const { voucher, isEligible, discountAmount, isFreeShipping, reason, isCurrentApplied } = ev;

              return (
                <div
                  key={voucher.id}
                  className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between gap-3 ${
                    isCurrentApplied
                      ? "bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/30 shadow-sm"
                      : isEligible
                      ? "bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-md"
                      : "bg-slate-50/80 border-slate-200 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 items-start">
                      {/* Ticket Badge */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-black shadow-xs ${
                          voucher.discountType === "percentage"
                            ? "bg-teal-600 text-white"
                            : voucher.discountType === "same_price_item"
                            ? "bg-indigo-600 text-white"
                            : voucher.discountType === "free_shipping"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        {voucher.discountType === "percentage" && (
                          <>
                            <span className="text-base leading-none">-{voucher.discountValue}%</span>
                            <span className="text-[9px] uppercase tracking-wider mt-0.5 opacity-90">Giảm</span>
                          </>
                        )}
                        {voucher.discountType === "same_price_item" && (
                          <>
                            <span className="text-sm leading-none">50K</span>
                            <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-90">Đồng giá</span>
                          </>
                        )}
                        {voucher.discountType === "free_shipping" && (
                          <>
                            <span className="text-xs leading-none">FREE</span>
                            <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-90">Ship</span>
                          </>
                        )}
                        {voucher.discountType === "fixed_amount" && (
                          <>
                            <span className="text-xs leading-none">-{voucher.discountValue / 1000}k</span>
                            <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-90">VND</span>
                          </>
                        )}
                      </div>

                      {/* Info & Conditions */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-[#0b1e3b] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tracking-wider">
                            {voucher.code}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {voucher.title}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug">
                          {voucher.description}
                        </p>

                        {/* Condition tags */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {voucher.applicableTarget === "charm" && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                              Từ {voucher.minQuantity || 2} charm
                            </span>
                          )}
                          {voucher.customerTarget === "new_customer" && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                              Khách hàng mới
                            </span>
                          )}
                          {voucher.minOrderValue && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              Đơn tối thiểu {formatVND(voucher.minOrderValue)}
                            </span>
                          )}
                          {voucher.endDate && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> HSD: {voucher.endDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {isCurrentApplied ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đang dùng
                          </span>
                          <button
                            type="button"
                            onClick={onRemoveVoucher}
                            className="text-[10px] text-rose-600 hover:underline font-semibold"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      ) : isEligible ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleApplyClick(voucher)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <span>Áp dụng</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          {discountAmount > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              Tiết kiệm {formatVND(discountAmount)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          disabled
                          type="button"
                          className="px-3 py-1 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-semibold cursor-not-allowed border border-slate-200"
                        >
                          Chưa đủ điều kiện
                        </button>
                      )}
                    </div>
                  </div>

                  {/* If not eligible, explain reason */}
                  {!isEligible && reason && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>{reason}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mỗi đơn hàng áp dụng tối đa 1 mã ưu đãi</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
