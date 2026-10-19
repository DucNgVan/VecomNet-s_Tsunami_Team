"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Order, NetPack, ManufacturedBagItem } from "@/types";
import { getAllDesignRequests, DesignRequest } from "@/lib/designRequestStorage";
import { formatVND, formatKg } from "@/lib/utils";

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
  // Load Studio Design Requests from local storage
  const [studioRequests, setStudioRequests] = useState<DesignRequest[]>([]);

  useEffect(() => {
    setStudioRequests(getAllDesignRequests());
  }, []);

  // Filter valid shop orders
  const validShopOrders = useMemo(() => {
    return orders.filter(
      (o) => !["NET-ORD-8821", "NET-ORD-8822", "NET-ORD-8823"].includes(o.orderCode)
    );
  }, [orders]);

  // Combined Metrics
  const totalShopRevenue = useMemo(() => {
    return validShopOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [validShopOrders]);

  const totalStudioEstimatedRevenue = useMemo(() => {
    return studioRequests.reduce(
      (sum, r) => sum + (r.finalTotal || r.baseTotal + (r.customCharmPrice || 0)),
      0
    );
  }, [studioRequests]);

  const totalCombinedRevenue = totalShopRevenue + totalStudioEstimatedRevenue;

  const pendingStudioRequests = useMemo(() => {
    return studioRequests.filter(
      (r) => r.status === "pending_review" || r.status === "revision_requested"
    ).length;
  }, [studioRequests]);

  const approvedStudioRequests = useMemo(() => {
    return studioRequests.filter((r) => r.status === "approved").length;
  }, [studioRequests]);

  const pendingShopOrders = useMemo(() => {
    return validShopOrders.filter(
      (o) => o.fulfillmentStatus === "received" || o.fulfillmentStatus === "crafting"
    ).length;
  }, [validShopOrders]);

  const deliveredShopOrders = useMemo(() => {
    return validShopOrders.filter((o) => o.fulfillmentStatus === "delivered").length;
  }, [validShopOrders]);

  const totalPlasticKgFromOrders = useMemo(() => {
    const shopKg = validShopOrders.reduce((sum, o) => sum + (o.totalPlasticOffsetKg || 0), 0);
    const studioKg = studioRequests.reduce(
      (sum, r) => sum + 1.8 + (r.placedCharms.length * 0.15),
      0
    );
    return shopKg + studioKg;
  }, [validShopOrders, studioRequests]);

  const inStockItemsCount = useMemo(() => {
    return manufacturedItems.filter((i) => i.status === "in_stock").length;
  }, [manufacturedItems]);

  const lowStockProducts = useMemo(() => {
    return backendProducts.filter((p) => (p.stockCount ?? 10) <= 5);
  }, [backendProducts]);

  const newNetPacksCount = useMemo(() => {
    return netPacks.filter((p) => p.status === "new").length;
  }, [netPacks]);

  // Combined 7-day revenue trend
  const chartDays = useMemo(() => {
    const days: { label: string; amount: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

      // Match shop orders
      const matchedShop = validShopOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === d.toDateString();
      });
      const shopSum = matchedShop.reduce((acc, curr) => acc + (curr.total || 0), 0);

      // Match studio requests
      const matchedStudio = studioRequests.filter((r) => {
        const reqDate = new Date(r.createdAt);
        return reqDate.toDateString() === d.toDateString();
      });
      const studioSum = matchedStudio.reduce(
        (acc, curr) => acc + (curr.finalTotal || curr.baseTotal + (curr.customCharmPrice || 0)),
        0
      );

      days.push({
        label: dateStr,
        amount: shopSum + studioSum,
        count: matchedShop.length + matchedStudio.length,
      });
    }
    return days;
  }, [validShopOrders, studioRequests]);

  const maxChartAmount = Math.max(...chartDays.map((d) => d.amount), 5000000);

  // Recent unified activities list
  const recentActivities = useMemo(() => {
    const combined: Array<{
      id: string;
      code: string;
      type: "studio" | "shop";
      title: string;
      customer: string;
      amount: number;
      statusLabel: string;
      statusColor: string;
      createdAt: string;
    }> = [];

    studioRequests.forEach((r) => {
      combined.push({
        id: `studio-${r.id}`,
        code: r.id,
        type: "studio",
        title: r.bagName,
        customer: r.customerName,
        amount: r.finalTotal || r.baseTotal + (r.customCharmPrice || 0),
        statusLabel:
          r.status === "approved"
            ? "Khách đã duyệt"
            : r.status === "concept_sent"
            ? "Đã gửi concept"
            : r.status === "revision_requested"
            ? "Cần chỉnh sửa"
            : "Chờ tiếp nhận",
        statusColor:
          r.status === "approved"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : r.status === "concept_sent"
            ? "bg-sky-50 text-sky-800 border-sky-200"
            : "bg-amber-50 text-amber-800 border-amber-200",
        createdAt: r.createdAt,
      });
    });

    validShopOrders.forEach((o) => {
      combined.push({
        id: `shop-${o.orderId}`,
        code: o.orderCode,
        type: "shop",
        title: o.items?.[0]?.title || "Sản phẩm NÉT",
        customer: o.customer?.fullName || "Khách Vãng Lai",
        amount: o.total,
        statusLabel:
          o.fulfillmentStatus === "delivered"
            ? "Đã giao"
            : o.fulfillmentStatus === "delivering"
            ? "Đang giao"
            : o.fulfillmentStatus === "crafting"
            ? "Đang chế tác"
            : "Tiếp nhận",
        statusColor:
          o.fulfillmentStatus === "delivered"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-[#F5ECE5] text-[#B85D43] border-[#E4D1C3]",
        createdAt: o.createdAt,
      });
    });

    return combined
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [studioRequests, validShopOrders]);

  return (
    <div className="space-y-8 animate-fadeIn pb-16 text-[#241B16]">
      {/* 1. Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ Thống Trực Tuyến 24/7 • Cloud Firestore
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-[#241B16]">
            Trung Tâm Điều Hành Doanh Nghiệp NÉT
          </h1>
          <p className="text-xs sm:text-sm text-[#5E4D43] max-w-2xl leading-relaxed">
            Giám sát toàn diện doanh thu từ <strong>Đơn Tự Thiết Kế (Studio)</strong> và <strong>Đơn Mẫu Có Sẵn (Shop)</strong>, chỉ số phục hồi rạn san hô và tồn kho sản phẩm độc bản.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab("orders")}
            className="px-5 py-3 rounded-2xl bg-[#B85D43] hover:bg-[#A24E36] text-white font-medium text-xs shadow-xs transition-all flex items-center cursor-pointer"
          >
            <span>Mở Trung Tâm Đơn Hàng →</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Gross Revenue */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E2D8] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#F5ECE5] text-[#B85D43]">
              DOANH THU
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#5E4D43] border border-[#E8E2D8]">
              {validShopOrders.length + studioRequests.length} Đơn Tổng
            </span>
          </div>
          <div className="text-xs font-medium text-[#8F8177] uppercase tracking-wider">
            Doanh Thu Ước Tính
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-normal text-[#241B16] mt-1">
            {formatVND(totalCombinedRevenue)}
          </div>
          <div className="text-[11px] text-[#5E4D43] mt-2">
            <span>Studio: {formatVND(totalStudioEstimatedRevenue)} • Shop: {formatVND(totalShopRevenue)}</span>
          </div>
        </div>

        {/* KPI 2: Order Fulfillment */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E2D8] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700">
              VẬN HÀNH
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {pendingStudioRequests + pendingShopOrders} Chờ Xử Lý
            </span>
          </div>
          <div className="text-xs font-medium text-[#8F8177] uppercase tracking-wider">
            Tiến Độ Studio & Xuất Xưởng
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-normal text-[#241B16] mt-1">
            {approvedStudioRequests + deliveredShopOrders}{" "}
            <span className="text-xs font-sans text-[#8F8177]">
              / {validShopOrders.length + studioRequests.length} đơn đã duyệt & giao
            </span>
          </div>
          <div className="text-[11px] text-[#5E4D43] mt-2">
            <span>Tự động cấp mã QR Passport gắn theo túi</span>
          </div>
        </div>

        {/* KPI 3: ESG Marine Impact */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E2D8] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700">
              TÁC ĐỘNG ESG
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              Kinh Tế Tuần Hoàn
            </span>
          </div>
          <div className="text-xs font-medium text-[#8F8177] uppercase tracking-wider">
            Lưới Ma Đã Thu Hồi
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-normal text-teal-800 mt-1">
            {formatKg(
              (stats?.consumedNetWeight || stats?.totalNetWeightRecovered || 55) +
                (totalPlasticKgFromOrders || 0)
            )}
          </div>
          <div className="text-[11px] text-[#5E4D43] mt-2">
            <span>Bảo tồn {stats?.coralReefProtectedSqM || 14200} m² rạn san hô Sơn Trà</span>
          </div>
        </div>

        {/* KPI 4: Inventory & Finished Bags */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E2D8] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[#241B16] border border-[#E8E2D8]">
              TỒN KHO
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#5E4D43] border border-[#E8E2D8]">
              {netPacks.length} Kiện Lưới
            </span>
          </div>
          <div className="text-xs font-medium text-[#8F8177] uppercase tracking-wider">
            Túi Thành Phẩm Sẵn Sàng
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-normal text-[#241B16] mt-1">
            {inStockItemsCount}{" "}
            <span className="text-xs font-sans text-[#8F8177]">túi có Serial trong kho</span>
          </div>
          <div className="text-[11px] text-[#5E4D43] mt-2">
            <span>Bảo hành điện tử 24 tháng chính hãng</span>
          </div>
        </div>
      </div>

      {/* 3. Actionable Smart Alerts */}
      {(lowStockProducts.length > 0 || pendingStudioRequests > 0 || pendingShopOrders > 0) && (
        <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#B85D43] uppercase tracking-wider">
            <span className="text-[10px] font-mono uppercase bg-[#B85D43] text-white px-1.5 py-0.5 rounded font-bold">LƯU Ý</span>
            <span>Khuyến Nghị Xử Lý & Vận Hành Khẩn Cấp</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pendingStudioRequests > 0 && (
              <div
                onClick={() => onNavigateTab("orders")}
                className="p-3.5 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs flex items-center justify-between cursor-pointer hover:border-[#B85D43] transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-[#241B16]">
                    {pendingStudioRequests} yêu cầu Studio cần gửi concept / duyệt
                  </div>
                  <div className="text-[11px] text-[#5E4D43]">Phác thảo mẫu & nhập báo giá</div>
                </div>
                <span className="text-[#8F8177] group-hover:text-[#B85D43] group-hover:translate-x-1 transition-all text-sm font-bold">→</span>
              </div>
            )}

            {pendingShopOrders > 0 && (
              <div
                onClick={() => onNavigateTab("orders")}
                className="p-3.5 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs flex items-center justify-between cursor-pointer hover:border-[#B85D43] transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-[#241B16]">
                    {pendingShopOrders} đơn hàng Shop chờ xuất xưởng
                  </div>
                  <div className="text-[11px] text-[#5E4D43]">Gán túi có mã Serial & đóng gói</div>
                </div>
                <span className="text-[#8F8177] group-hover:text-[#B85D43] group-hover:translate-x-1 transition-all text-sm font-bold">→</span>
              </div>
            )}

            {lowStockProducts.length > 0 && (
              <div
                onClick={() => onNavigateTab("catalog")}
                className="p-3.5 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs flex items-center justify-between cursor-pointer hover:border-[#B85D43] transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-rose-700">
                    {lowStockProducts.length} mẫu túi sắp hết hàng (tồn ≤ 5)
                  </div>
                  <div className="text-[11px] text-[#5E4D43]">
                    {lowStockProducts.map((p) => p.name).slice(0, 2).join(", ")}...
                  </div>
                </div>
                <span className="text-[#8F8177] group-hover:text-rose-600 group-hover:translate-x-1 transition-all text-sm font-bold">→</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Revenue Visual Bar Chart & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue 7-day Bar Chart */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white border border-[#E8E2D8] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg text-[#241B16] font-normal">
                Biến Động Doanh Thu 7 Ngày Qua
              </h3>
              <p className="text-xs text-[#5E4D43]">Tổng hợp cả đơn Studio và đơn Shop</p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#B85D43] bg-[#F5ECE5] px-2.5 py-1 rounded-full border border-[#E4D1C3]">
              7 ngày: {formatVND(chartDays.reduce((a, b) => a + b.amount, 0))}
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 border-b border-[#F0EAE1] pb-2">
            {chartDays.map((d, idx) => {
              const heightPct = Math.max(12, Math.round((d.amount / maxChartAmount) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono font-bold text-[#8F8177] group-hover:text-[#B85D43] transition-colors opacity-0 group-hover:opacity-100 -mb-1">
                    {d.count > 0 ? `${d.count} đơn` : ""}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[44px] rounded-t-xl transition-all duration-300 relative ${
                      d.amount > 0
                        ? "bg-[#B85D43] group-hover:bg-[#A24E36] shadow-xs"
                        : "bg-[#F3ECE1] group-hover:bg-[#EAE2D7]"
                    }`}
                  >
                    {d.amount > 0 && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#241B16] text-white text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {formatVND(d.amount)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-[#5E4D43] group-hover:font-semibold group-hover:text-[#241B16] transition-colors">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Realtime Orders Stream */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E2D8] shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-[#241B16] font-normal">
                Đơn Hàng Gần Đây
              </h3>
              <button
                onClick={() => onNavigateTab("orders")}
                className="text-xs font-semibold text-[#B85D43] hover:text-[#A24E36] cursor-pointer"
              >
                <span>Xem tất cả →</span>
              </button>
            </div>

            <div className="space-y-3">
              {recentActivities.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab("orders")}
                  className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-[#F3ECE1] transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-[#241B16]">{item.code}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${item.type === "studio" ? "bg-[#F5ECE5] text-[#B85D43]" : "bg-[#EAF3EE] text-[#1E5C46]"}`}>
                        {item.type === "studio" ? "Studio" : "Shop"}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5E4D43] truncate max-w-[140px]">
                      {item.customer} • {item.title}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#241B16]">{formatVND(item.amount)}</div>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                </div>
              ))}

              {recentActivities.length === 0 && (
                <div className="text-center py-8 text-xs text-[#8F8177]">
                  Chưa có đơn hàng nào phát sinh.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#8F8177]">
            <span>Đồng bộ theo thời gian thực</span>
            <span className="font-mono text-[10px] text-[#B85D43] font-bold">Auto-synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
