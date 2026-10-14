"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatVND, formatKg } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";
import { getManufacturedItems } from "@/lib/supplyChainStorage";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  AlertCircle,
} from "lucide-react";

export const CartDrawer: React.FC = () => {
  const { user } = useAuth();
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalPlasticOffsetKg,
  } = useCart();

  const [mfgItems, setMfgItems] = useState<any[]>([]);

  useEffect(() => {
    if (isCartOpen && typeof window !== "undefined") {
      setMfgItems(getManufacturedItems());
    }
  }, [isCartOpen]);

  const getItemAvailableStock = (item: any): number => {
    if (item.type === "custom_bag" || item.type === "base_bag") {
      const bagBaseId = item.bagBaseId || item.details?.configuration?.bagBase?.id;
      const bagName = item.details?.configuration?.bagBase?.name || item.title;
      if (mfgItems.length > 0) {
        const pId = String(bagBaseId || "").trim().toLowerCase();
        const pName = String(bagName || "").trim().toLowerCase();
        const count = mfgItems.filter((m) => {
          if (m.status !== "in_stock" || m.isClaimed) return false;
          const mBaseId = String(m.bagBaseId || "").trim().toLowerCase();
          const mName = String(m.bagName || "").trim().toLowerCase();
          const matchId = pId !== "" && (mBaseId === pId || mBaseId.includes(pId) || pId.includes(mBaseId));
          const matchName = pName !== "" && (mName === pName || mName.includes(pName) || pName.includes(mName));
          return matchId || matchName;
        }).length;
        return count;
      }
      return item.stockCount !== undefined ? item.stockCount : 0;
    }
    return item.stockCount !== undefined ? item.stockCount : 99;
  };

  const hasOutOfStockItems = items.some((item) => getItemAvailableStock(item) <= 0);
  const hasOverStockItems = items.some((item) => item.quantity > getItemAvailableStock(item));
  const isCheckoutBlocked = hasOutOfStockItems || hasOverStockItems;

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between text-slate-900">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-slate-900" />
              <h2 className="text-base font-bold text-slate-900">Giỏ Hàng Nét</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                {items.length} món
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl mb-4 text-slate-400">
                  🌊
                </div>
                <h3 className="text-sm font-bold text-slate-900">Giỏ hàng đang trống</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Hãy khám phá bộ sưu tập túi lưới biển hoặc vào Nét Lab để tự tay thiết kế mẫu túi của riêng bạn.
                </p>
                <div className="mt-5">
                  <Link href="/story" onClick={() => setIsCartOpen(false)}>
                    <GlassButton variant="primary" size="md">
                      Vào Your Story Thiết Kế
                    </GlassButton>
                  </Link>
                </div>
              </div>
            ) : (
              items.map((item) => {
                const availableStock = getItemAvailableStock(item);
                const isOutOfStock = availableStock <= 0;
                const isOverStock = item.quantity > availableStock;

                return (
                  <div
                    key={item.cartItemId}
                    className={`p-4 rounded-2xl border flex flex-col gap-3 relative transition-all ${
                      isOutOfStock
                        ? "bg-rose-50/50 border-rose-200"
                        : isOverStock
                        ? "bg-amber-50/50 border-amber-200"
                        : "bg-slate-50 border-slate-200/90"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Image / Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 text-2xl shadow-sm">
                          {item.details?.configuration?.customSnapshotUrl ? (
                            <img
                              src={item.details.configuration.customSnapshotUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{item.type === "custom_bag" ? "👜" : "✨"}</span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {item.title}
                          </h4>
                          {item.details?.colorName && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Sắc màu: {item.details.colorName}
                            </div>
                          )}
                          {item.details?.charmsCount !== undefined && (
                            <div className="text-xs text-sky-800 font-bold mt-0.5">
                              Gắn {item.details.charmsCount} charm độc bản
                            </div>
                          )}

                          {/* Out of stock or low stock warning */}
                          {isOutOfStock ? (
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200 w-fit">
                              <AlertCircle className="w-3 h-3" />
                              <span>Đã hết hàng sẵn</span>
                            </div>
                          ) : isOverStock ? (
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200 w-fit">
                              <AlertCircle className="w-3 h-3" />
                              <span>Chỉ còn {availableStock} chiếc trong kho</span>
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] text-emerald-700 font-medium">
                              Sẵn có: {availableStock} chiếc
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity & Item Subtotal */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-slate-900 font-bold">
                          {item.quantity}
                        </span>
                        <button
                          disabled={item.quantity >= availableStock}
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-sm font-black text-[#0b1e3b]">
                        {formatVND(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 pb-safe">
              {/* Eco Plastic Counter */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Thu hồi rác đại dương:
                </span>
                <span className="font-black text-emerald-900">
                  {formatKg(totalPlasticOffsetKg)}
                </span>
              </div>

              {/* Subtotal */}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-600 font-medium">Tổng tạm tính:</span>
                <span className="text-2xl font-black text-[#0b1e3b]">
                  {formatVND(subtotal)}
                </span>
              </div>

              {/* Checkout Button / Out of Stock Banner */}
              {isCheckoutBlocked ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      Giỏ hàng có sản phẩm hết hàng hoặc số lượng vượt quá tồn kho. Vui lòng xóa hoặc điều chỉnh số lượng!
                    </span>
                  </div>
                  <button
                    disabled
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-500 text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                  >
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span>Không Thể Đặt Hàng Do Hết Hàng</span>
                  </button>
                </div>
              ) : (
                <Link
                  href={user ? "/checkout" : "/login?redirect=/checkout"}
                  onClick={() => setIsCartOpen(false)}
                  className="block w-full"
                >
                  <GlassButton
                    variant="primary"
                    size="lg"
                    className="w-full flex items-center justify-center gap-2 shadow-lg"
                  >
                    {user ? (
                      <>
                        <span>Tiến Hành Đặt Hàng</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-300" />
                        <span>Đăng Nhập Để Mua Hàng</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </GlassButton>
                </Link>
              )}

              <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {user
                    ? "Giao hàng toàn quốc • Kèm chứng chỉ tác động số"
                    : "Yêu cầu tài khoản hội viên để bảo chứng nguồn gốc"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
