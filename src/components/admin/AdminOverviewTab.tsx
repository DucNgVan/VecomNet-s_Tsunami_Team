"use client";

import React, { useMemo } from "react";
import { AdminOrder, RawNetBatch, ProductionSlip, BagSerialItem } from "@/lib/adminDataStorage";
import { formatVND, formatKg } from "@/lib/utils";

interface AdminOverviewTabProps {
  orders: AdminOrder[];
  batches: RawNetBatch[];
  slips: ProductionSlip[];
  serials: BagSerialItem[];
  products: any[];
  onNavigateToOrders: (filterKey?: string, selectOrderId?: string) => void;
  onNavigateToProducts: () => void;
  onNavigateToSupplyChain: (subTab?: "inbound" | "inventory" | "production" | "passport", selectId?: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  orders,
  batches,
  slips,
  serials,
  products,
  onNavigateToOrders,
  onNavigateToProducts,
  onNavigateToSupplyChain,
}) => {
  // 1. Chỉ số chính (Req 3, Req 24)
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.fulfillmentStatus === "received" || o.fulfillmentStatus === "confirmed");
  }, [orders]);

  const customQuotesNeeded = useMemo(() => {
    return orders.filter(
      (o) => o.fulfillmentStatus === "quote_needed" || o.fulfillmentStatus === "waiting_approval"
    );
  }, [orders]);

  // Tách tiền đã thu thực tế khỏi tổng giá trị đơn (Req 24)
  const totalActualCollected = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  }, [orders]);

  const totalGrossOrderValue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = typeof p.stockCount === "number" ? p.stockCount : 10;
      return stock <= 3;
    });
  }, [products]);

  // 2. Tách bạch 5 chỉ số Lưới thực tế (Req 24)
  const netMetrics = useMemo(() => {
    const rawReceived = batches.reduce((sum, b) => sum + (b.initialWeightKg || 0), 0);
    const usableDryInStock = batches.reduce((sum, b) => sum + (b.usableDryStockKg || 0), 0);
    const inProduction = slips
      .filter((s) => s.status === "in_production")
      .reduce((sum, s) => sum + (s.totalExportedKg || 0), 0);
    const inFinishedBags = serials.reduce((sum, s) => sum + (s.netWeightKg || 0), 0);
    const scrapsInStock = batches.reduce((sum, b) => sum + (b.reusableScrapsKg || 0), 0);

    return {
      rawReceived: Number(rawReceived.toFixed(1)),
      usableDryInStock: Number(usableDryInStock.toFixed(1)),
      inProduction: Number(inProduction.toFixed(1)),
      inFinishedBags: Number(inFinishedBags.toFixed(1)),
      scrapsInStock: Number(scrapsInStock.toFixed(1)),
    };
  }, [batches, slips, serials]);

  // 3. Danh sách việc cần làm ngay (Actionable Tasks) (Req 3)
  const actionTasks = useMemo(() => {
    const list: {
      id: string;
      title: string;
      subtitle: string;
      tag: string;
      tagColor: string;
      actionText: string;
      onClick: () => void;
    }[] = [];

    // Đơn cần báo giá
    orders
      .filter((o) => o.fulfillmentStatus === "quote_needed")
      .forEach((o) => {
        list.push({
          id: `quote-${o.orderId}`,
          title: `Đơn custom #${o.orderCode} của ${o.customer.fullName}`,
          subtitle: o.items[0]?.title || "Yêu cầu thiết kế charm độc bản",
          tag: "Cần báo giá",
          tagColor: "bg-amber-100 text-amber-800 border-amber-300",
          actionText: "Báo giá ngay",
          onClick: () => onNavigateToOrders("custom_quote", o.orderId),
        });
      });

    // Đơn mới nhận cần xác nhận
    orders
      .filter((o) => o.fulfillmentStatus === "received")
      .forEach((o) => {
        list.push({
          id: `confirm-${o.orderId}`,
          title: `Đơn hàng #${o.orderCode} (${o.customer.fullName})`,
          subtitle: `${o.items.length} sản phẩm — ${formatVND(o.total)}`,
          tag: "Mới nhận",
          tagColor: "bg-blue-100 text-blue-800 border-blue-300",
          actionText: "Xác nhận đơn",
          onClick: () => onNavigateToOrders("pending", o.orderId),
        });
      });

    // Lô lưới chưa ghi kết quả giặt sấy
    batches
      .filter((b) => b.status === "unprocessed")
      .forEach((b) => {
        list.push({
          id: `batch-${b.batchId}`,
          title: `Lô lưới thô ${b.batchId} (${b.supplierSource})`,
          subtitle: `Cân ban đầu ${b.initialWeightKg}kg tại ${b.seaRegion} — Cần ghi kết quả xử lý`,
          tag: "Chờ ghi xử lý",
          tagColor: "bg-purple-100 text-purple-800 border-purple-300",
          actionText: "Ghi xử lý",
          onClick: () => onNavigateToSupplyChain("inbound", b.batchId),
        });
      });

    // Phiếu sản xuất đang may chưa nhập kết quả
    slips
      .filter((s) => s.status === "in_production")
      .forEach((s) => {
        list.push({
          id: `slip-${s.slipId}`,
          title: `Phiếu may ${s.slipId} (${s.workshopName})`,
          subtitle: `Mẫu: ${s.bagModelName} — Đã xuất ${s.totalExportedKg}kg lưới`,
          tag: "Đang sản xuất",
          tagColor: "bg-orange-100 text-orange-800 border-orange-300",
          actionText: "Nhập kết quả may",
          onClick: () => onNavigateToSupplyChain("production", s.slipId),
        });
      });

    return list;
  }, [orders, batches, slips, onNavigateToOrders, onNavigateToSupplyChain]);

  return (
    <div className="space-y-6">
      {/* 1. Header Tối giản (Req 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E2D9] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#2A2521]">Tổng quan vận hành</h1>
          <p className="text-xs text-[#7A6E65] mt-0.5">
            Bấm vào từng chỉ số để mở trực tiếp danh sách đã lọc tương ứng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium bg-[#FAF7F2] text-[#7A6E65] px-2.5 py-1 rounded border border-[#E8E2D9]">
            Hôm nay: {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
          </span>
        </div>
      </div>

      {/* 2. Bốn Thẻ Chỉ Số Chính (Req 3, Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Đơn cần xử lý */}
        <button
          type="button"
          onClick={() => onNavigateToOrders("pending")}
          className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-left hover:border-[#C85A32] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-[#7A6E65] mb-1">
            <span className="font-medium">Đơn cần xử lý</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Mới / Xác nhận</span>
          </div>
          <div className="text-2xl font-bold text-[#2A2521] group-hover:text-[#C85A32] transition-colors">
            {pendingOrders.length}
          </div>
          <div className="text-[11px] text-[#A89C93] mt-1 flex items-center justify-between">
            <span>Đang chờ chuyển khâu</span>
            <span className="text-[#C85A32] font-semibold group-hover:underline">Xem danh sách →</span>
          </div>
        </button>

        {/* Thẻ 2: Custom cần báo giá */}
        <button
          type="button"
          onClick={() => onNavigateToOrders("custom_quote")}
          className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-left hover:border-[#C85A32] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-[#7A6E65] mb-1">
            <span className="font-medium">Custom cần báo giá</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">Yêu cầu charm</span>
          </div>
          <div className="text-2xl font-bold text-[#2A2521] group-hover:text-[#C85A32] transition-colors">
            {customQuotesNeeded.length}
          </div>
          <div className="text-[11px] text-[#A89C93] mt-1 flex items-center justify-between">
            <span>Chờ duyệt concept</span>
            <span className="text-[#C85A32] font-semibold group-hover:underline">Xem chi tiết →</span>
          </div>
        </button>

        {/* Thẻ 3: Tiền đã thu thực tế (Tách biệt khỏi tổng đơn - Req 24) */}
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-left">
          <div className="flex items-center justify-between text-xs text-[#7A6E65] mb-1">
            <span className="font-medium">Tiền đã thu thực tế</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Thực thu</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatVND(totalActualCollected)}
          </div>
          <div className="text-[11px] text-[#7A6E65] mt-1">
            Tổng giá trị đơn: <span className="font-medium">{formatVND(totalGrossOrderValue)}</span>
          </div>
        </div>

        {/* Thẻ 4: Sản phẩm sắp/hết hàng */}
        <button
          type="button"
          onClick={onNavigateToProducts}
          className="bg-white p-4 rounded-xl border border-[#E8E2D9] text-left hover:border-[#C85A32] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-[#7A6E65] mb-1">
            <span className="font-medium">Sản phẩm sắp/hết hàng</span>
            <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">Tồn kho ≤ 3</span>
          </div>
          <div className="text-2xl font-bold text-[#2A2521] group-hover:text-[#C85A32] transition-colors">
            {lowStockProducts.length}
          </div>
          <div className="text-[11px] text-[#A89C93] mt-1 flex items-center justify-between">
            <span>Cần may bổ sung</span>
            <span className="text-[#C85A32] font-semibold group-hover:underline">Kiểm kho →</span>
          </div>
        </button>
      </div>

      {/* 3. Danh Sách Việc Cần Làm Ngay (Req 3) */}
      <div className="bg-white rounded-xl border border-[#E8E2D9] p-4">
        <div className="flex items-center justify-between mb-3 border-b border-[#F4EFEB] pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#2A2521]">Danh sách việc cần làm</h2>
            <span className="text-xs bg-[#FAF7F2] text-[#7A6E65] px-2 py-0.5 rounded-full border border-[#E8E2D9] font-medium">
              {actionTasks.length} việc
            </span>
          </div>
          <span className="text-xs text-[#7A6E65]">Bấm vào từng dòng để mở đúng đối tượng xử lý</span>
        </div>

        {actionTasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#7A6E65]">
            ✓ Hiện tại không có việc tồn đọng. Tất cả đơn hàng và quy trình đều đã cập nhật!
          </div>
        ) : (
          <div className="divide-y divide-[#F4EFEB]">
            {actionTasks.map((task) => (
              <div
                key={task.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FDFBF7] px-2 rounded-lg transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${task.tagColor}`}>
                      {task.tag}
                    </span>
                    <span className="text-xs font-semibold text-[#2A2521]">{task.title}</span>
                  </div>
                  <p className="text-[11px] text-[#7A6E65] pl-1">{task.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={task.onClick}
                  className="px-3 py-1.5 rounded-lg bg-[#C85A32] text-white text-xs font-medium hover:bg-[#B34E28] transition-colors self-start sm:self-auto flex-shrink-0"
                >
                  {task.actionText} →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Tách Bạch Số Liệu Lưới Thực Tế (Req 24) */}
      <div className="bg-white rounded-xl border border-[#E8E2D9] p-4">
        <div className="mb-3 border-b border-[#F4EFEB] pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#2A2521]">Cân bằng dòng vật liệu Lưới ma (kg)</h2>
            <p className="text-[11px] text-[#7A6E65] mt-0.5">
              Phân tách rạch ròi từng giai đoạn theo hồ sơ thực tế. Không gộp kg thu gom thô thành kg trong túi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSupplyChain()}
            className="text-xs text-[#C85A32] hover:underline font-semibold"
          >
            Mở sổ Lưới & Passport →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8E2D9]">
            <div className="text-[11px] text-[#7A6E65]">1. Lưới tiếp nhận thô</div>
            <div className="text-lg font-bold text-[#2A2521] mt-1">{formatKg(netMetrics.rawReceived)}</div>
            <div className="text-[10px] text-[#A89C93] mt-0.5">Bao gồm bùn/ẩm</div>
          </div>
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
            <div className="text-[11px] text-blue-900">2. Lưới khô trong kho</div>
            <div className="text-lg font-bold text-blue-700 mt-1">{formatKg(netMetrics.usableDryInStock)}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">Sẵn sàng xuất may</div>
          </div>
          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
            <div className="text-[11px] text-amber-900">3. Đang ở xưởng may</div>
            <div className="text-lg font-bold text-amber-700 mt-1">{formatKg(netMetrics.inProduction)}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Theo phiếu sản xuất</div>
          </div>
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
            <div className="text-[11px] text-emerald-900">4. Trong túi đạt chuẩn</div>
            <div className="text-lg font-bold text-emerald-700 mt-1">{formatKg(netMetrics.inFinishedBags)}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{serials.length} chiếc túi đã tạo mã</div>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div className="text-[11px] text-stone-700">5. Vụn còn dùng được</div>
            <div className="text-lg font-bold text-stone-800 mt-1">{formatKg(netMetrics.scrapsInStock)}</div>
            <div className="text-[10px] text-stone-500 mt-0.5">Phối chi tiết nhỏ</div>
          </div>
        </div>
      </div>
    </div>
  );
};
