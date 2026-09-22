"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatVND, formatKg } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalPlasticOffsetKg,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between text-slate-900">
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
                  <Link href="/customizer" onClick={() => setIsCartOpen(false)}>
                    <GlassButton variant="primary" size="md">
                      Vào Nét Lab Thiết Kế
                    </GlassButton>
                  </Link>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col gap-3 relative"
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
                          <div className="text-xs text-sky-800 font-mono font-bold mt-0.5">
                            Gắn {item.details.charmsCount} charm độc bản
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
                      <span className="font-mono px-2 text-slate-900 font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="font-mono text-sm font-black text-[#0b1e3b]">
                      {formatVND(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
              {/* Eco Plastic Counter */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Thu hồi rác đại dương:
                </span>
                <span className="font-mono font-black text-emerald-900">
                  {formatKg(totalPlasticOffsetKg)}
                </span>
              </div>

              {/* Subtotal */}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-600 font-medium">Tổng tạm tính:</span>
                <span className="text-2xl font-black font-mono text-[#0b1e3b]">
                  {formatVND(subtotal)}
                </span>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="block w-full"
              >
                <GlassButton
                  variant="primary"
                  size="lg"
                  className="w-full flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Tiến Hành Đặt Hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
              </Link>

              <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Giao hàng toàn quốc • Kèm chứng chỉ tác động số</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
