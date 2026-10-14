"use client";

import React, { useMemo } from "react";
import { Order, NetPack, ManufacturedBagItem } from "@/types";
import { formatVND, formatKg } from "@/lib/utils";
import {
  TrendingUp,
  Package,
  Anchor,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Boxes,
  Sparkles,
  DollarSign,
  CheckCircle2,
  Users,
} from "lucide-react";

interface AdminDashboardTabProps {
  orders: Order[];
  netPacks: NetPack[];
  manufacturedItems: ManufacturedBagItem[];
  backendProducts: any[];
  stats: any;
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  orders,
  netPacks,
  manufacturedItems,
  backendProducts,
  stats,
  onNavigateTab,
}) => {
  // Aggregate Metrics
  const validOrders = useMemo(() => {
    return orders.filter(
      (o) => !["NET-ORD-8821", "NET-ORD-8822", "NET-ORD-8823"].includes(o.orderCode)
    );
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [validOrders]);

  const pendingOrdersCount = useMemo(() => {
    return validOrders.filter((o) => o.fulfillmentStatus === "received" || o.fulfillmentStatus === "crafting").length;
  }, [validOrders]);

  const deliveredOrdersCount = useMemo(() => {
    return validOrders.filter((o) => o.fulfillmentStatus === "delivered").length;
  }, [validOrders]);

  const totalPlasticKgFromOrders = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + (o.totalPlasticOffsetKg || 0), 0);
  }, [validOrders]);

  const inStockItemsCount = useMemo(() => {
    return manufacturedItems.filter((i) => i.status === "in_stock").length;
  }, [manufacturedItems]);

  const lowStockProducts = useMemo(() => {
    return backendProducts.filter((p) => (p.stockCount ?? 10) <= 5);
  }, [backendProducts]);

  const newNetPacksCount = useMemo(() => {
    return netPacks.filter((p) => p.status === "new").length;
  }, [netPacks]);

  // Mocked 7-day revenue trend calculated from orders or dynamic timeline
  const chartDays = useMemo(() => {
    const days: { label: string; amount: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      
      // Calculate orders placed on this date
      const matched = validOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === d.toDateString();
      });
      const dayTotal = matched.reduce((acc, curr) => acc + (curr.total || 0), 0);
      days.push({
        label: dateStr,
        amount: dayTotal,
        count: matched.length,
      });
    }
    return days;
  }, [validOrders]);

  const maxChartAmount = Math.max(...chartDays.map((d) => d.amount), 5000000);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-sky-950 to-[#071326] p-6 sm:p-8 rounded-3xl border border-sky-800/40 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-mono font-bold border border-teal-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Hệ Thống Trực Tuyến 24/7 • Cloud Firestore
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Trung Tâm Điều Hành Doanh Nghiệp NÉT
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Theo dõi dòng tiền, tiến độ xử lý đơn hàng, quy trình giải cứu rạn san hô và tồn kho sản phẩm độc bản theo thời gian thực.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => onNavigateTab("orders")}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Xử Lý {pendingOrdersCount} Đơn Chờ</span>
          </button>
        </div>

        {/* Ocean graphic ambient */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none"></div>
      </div>

      {/* 2. 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Gross Revenue */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {validOrders.length} Đơn Hàng
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Doanh Thu Thực Tế
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {formatVND(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Đồng bộ tức thì từ cổng thanh toán</span>
          </div>
        </div>

        {/* KPI 2: Order Fulfillment */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {pendingOrdersCount} Chờ Xử Lý
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tình Trạng Giao Đơn
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {deliveredOrdersCount} <span className="text-sm font-semibold text-slate-400">/ {validOrders.length} hoàn tất</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
            <span>Tự động cấp mã QR Passport may lót</span>
          </div>
        </div>

        {/* KPI 3: ESG Marine Impact */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Anchor className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Chuỗi Tuần Hoàn
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Lưới Ma Đã Thu Hồi
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700 mt-1">
            {formatKg((stats?.consumedNetWeight || stats?.totalNetWeightRecovered || 55) + (totalPlasticKgFromOrders || 0))}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Bảo tồn {stats?.coralReefProtectedSqM || 14200} m² rạn san hô</span>
          </div>
        </div>

        {/* KPI 4: Inventory & Finished Bags */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {netPacks.length} Kiện Lưới
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Túi Thành Phẩm Sẵn Sàng
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {inStockItemsCount} <span className="text-sm font-semibold text-slate-400">túi có Serial</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Bảo hành điện tử 24 tháng chính hãng</span>
          </div>
        </div>
      </div>

      {/* 3. Actionable Smart Alerts */}
      {(lowStockProducts.length > 0 || pendingOrdersCount > 0 || newNetPacksCount > 0) && (
        <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200/90 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Cảnh Báo Vận Hành & Khuyến Nghị Xử Lý</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pendingOrdersCount > 0 && (
              <div
                onClick={() => onNavigateTab("orders")}
                className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Có {pendingOrdersCount} đơn hàng chờ xác nhận
                  </div>
                  <div className="text-[11px] text-slate-500">Cần duyệt & gán túi thành phẩm</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
            )}

            {lowStockProducts.length > 0 && (
              <div
                onClick={() => onNavigateTab("catalog")}
                className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-rose-700">
                    {lowStockProducts.length} mẫu túi sắp hết hàng (tồn ≤ 5)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lowStockProducts.map((p) => p.name).slice(0, 2).join(", ")}...
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
              </div>
            )}

            {newNetPacksCount > 0 && (
              <div
                onClick={() => onNavigateTab("supply-chain")}
                className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-teal-800">
                    {newNetPacksCount} kiện lưới mới vừa cập bến
                  </div>
                  <div className="text-[11px] text-slate-500">Tạo lệnh sản xuất xưởng đan Nam Ô</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Revenue Visual Bar Chart & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue 7-day Bar Chart */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Biến Động Doanh Thu 7 Ngày Qua</h3>
              <p className="text-xs text-slate-500">Dòng tiền thực thu từ khách hàng đặt hàng</p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Tổng 7 ngày: {formatVND(chartDays.reduce((a, b) => a + b.amount, 0))}
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 border-b border-slate-100 pb-2">
            {chartDays.map((d, idx) => {
              const heightPct = Math.max(12, Math.round((d.amount / maxChartAmount) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-teal-600 transition-colors opacity-0 group-hover:opacity-100 -mb-1">
                    {d.count > 0 ? `${d.count} đơn` : ""}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[44px] rounded-t-xl transition-all duration-300 relative ${
                      d.amount > 0
                        ? "bg-gradient-to-t from-sky-600 to-teal-400 group-hover:from-sky-700 group-hover:to-teal-500 shadow-md shadow-teal-500/10"
                        : "bg-slate-100 group-hover:bg-slate-200"
                    }`}
                  >
                    {d.amount > 0 && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {formatVND(d.amount)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 group-hover:font-bold group-hover:text-slate-800 transition-colors">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Realtime Orders Stream */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Đơn Hàng Gần Đây</h3>
              <button
                onClick={() => onNavigateTab("orders")}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {validOrders.slice(0, 4).map((order) => (
                <div
                  key={order.orderId}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800">{order.orderCode}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                      {order.customer?.fullName || "Khách Vãng Lai"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{formatVND(order.total)}</div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        order.fulfillmentStatus === "delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : order.fulfillmentStatus === "crafting"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {order.fulfillmentStatus === "delivered"
                        ? "Đã giao"
                        : order.fulfillmentStatus === "crafting"
                        ? "Đang chế tác"
                        : "Tiếp nhận"}
                    </span>
                  </div>
                </div>
              ))}

              {validOrders.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  Chưa có đơn hàng nào phát sinh.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dữ liệu Firestore Cloud</span>
            <span className="font-mono text-[10px] text-teal-600 font-bold">Auto-synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
