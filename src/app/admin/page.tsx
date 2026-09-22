"use client";

import React, { useState, useEffect } from "react";
import { Order } from "@/types";
import { TRACE_BATCHES } from "@/data/traceability";
import { BAG_BASES, BAG_COLORS, CHARMS } from "@/data/products";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatVND, formatKg } from "@/lib/utils";
import {
  Layers,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  Camera,
  FileCheck,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("net_orders_v1");
      if (stored) {
        setOrders(JSON.parse(stored));
      } else {
        // Provide mock initial orders for workshop testing
        const initialMockOrders: Order[] = [
          {
            orderId: "ord-mock-01",
            orderCode: "NET-XN8892",
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            customer: {
              fullName: "Lê Minh Thảo",
              phone: "0905 882 119",
              email: "thao.le@gmail.com",
              address: "42 Trần Phú, P. Thạch Thang",
              city: "Đà Nẵng",
              note: "Gói cẩn thận giúp mình làm quà tặng bạn",
            },
            items: [
              {
                cartItemId: "item-custom-01",
                type: "custom_bag",
                title: "NÉT Tote Signature (Tùy biến độc bản)",
                price: 1640000,
                quantity: 1,
                image: "/assets/products/tote-blue.png",
                plasticOffsetKg: 2.14,
                details: {
                  colorName: BAG_COLORS[0].name,
                  charmsCount: 2,
                  charmsList: [CHARMS[0].vietnameseName, CHARMS[2].vietnameseName],
                  configuration: {
                    id: "cfg-1",
                    bagBase: BAG_BASES[0],
                    selectedColor: BAG_COLORS[0],
                    placedCharms: [
                      {
                        instanceId: "p1",
                        charmId: CHARMS[0].id,
                        charm: CHARMS[0],
                        anchorId: "a2",
                        x: 50,
                        y: 28,
                        rotation: 0,
                      },
                      {
                        instanceId: "p2",
                        charmId: CHARMS[2].id,
                        charm: CHARMS[2],
                        anchorId: "a5",
                        x: 50,
                        y: 48,
                        rotation: 15,
                      },
                    ],
                    totalPrice: 1640000,
                    totalPlasticOffsetKg: 2.14,
                    createdAt: new Date().toISOString(),
                  },
                },
              },
            ],
            subtotal: 1640000,
            shippingFee: 0,
            total: 1640000,
            totalPlasticOffsetKg: 2.14,
            assignedBatchId: TRACE_BATCHES[0].batchId,
            paymentMethod: "vnpay",
            paymentStatus: "paid",
            fulfillmentStatus: "crafting",
          },
        ];
        setOrders(initialMockOrders);
        localStorage.setItem("net_orders_v1", JSON.stringify(initialMockOrders));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleUpdateStatus = (
    orderId: string,
    newStatus: Order["fulfillmentStatus"]
  ) => {
    const updated = orders.map((o) =>
      o.orderId === orderId ? { ...o, fulfillmentStatus: newStatus } : o
    );
    setOrders(updated);
    if (selectedOrder && selectedOrder.orderId === orderId) {
      setSelectedOrder({ ...selectedOrder, fulfillmentStatus: newStatus });
    }
    localStorage.setItem("net_orders_v1", JSON.stringify(updated));
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.fulfillmentStatus === statusFilter);

  const totalPlasticDiverted = orders.reduce(
    (sum, o) => sum + (o.totalPlasticOffsetKg || 0),
    0
  );

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <GlassBadge variant="emerald">CỔNG VẬN HÀNH & GIA CÔNG THỦ CÔNG</GlassBadge>
            <span className="text-xs text-slate-500 font-mono tracking-wider">XƯỞNG CHẾ TÁC NÉT ATELIER</span>
          </div>
          <h1 className="text-3xl font-black text-[#0b1e3b] font-serif tracking-tight">
            Quản Lý Đơn Hàng & Bản Vẽ Gia Công
          </h1>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="bg-white border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] px-5 py-2.5 rounded-2xl text-center">
            <div className="text-xs text-slate-500">Tổng Đơn Hàng</div>
            <div className="text-lg font-bold font-mono text-[#0b1e3b]">{orders.length}</div>
          </div>
          <div className="bg-white border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] px-5 py-2.5 rounded-2xl text-center">
            <div className="text-xs text-slate-500">Rác Nhựa Đã Cứu</div>
            <div className="text-lg font-bold font-mono text-emerald-700">
              {formatKg(totalPlasticDiverted)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "all", label: "Tất Cả Đơn" },
          { id: "crafting", label: "Đang Đan Mắt Lưới (Gia công)" },
          { id: "quality_check", label: "Kiểm Định Chất Lượng (QC)" },
          { id: "delivering", label: "Đang Giao Hàng" },
          { id: "delivered", label: "Đã Hoàn Tất" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              statusFilter === tab.id
                ? "bg-[#0b1e3b] text-white border-[#0b1e3b] shadow-sm"
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workbench: Orders List & Order Detail Blueprint */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Orders Table */}
        <div className="lg:col-span-7 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-slate-200/90 p-8 text-center text-slate-500 rounded-2xl shadow-sm">
              Chưa có đơn hàng nào trong trạng thái này.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?.orderId === order.orderId;

              return (
                <div
                  key={order.orderId}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                    isSelected
                      ? "bg-white border-2 border-[#0b1e3b] shadow-[0_8px_24px_rgba(11,30,59,0.08)]"
                      : "bg-white hover:border-slate-300 border-slate-200/90 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-[#0b1e3b]">
                          {order.orderCode}
                        </span>
                        <span className="text-xs text-slate-700 font-medium">
                          {order.customer.fullName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {order.customer.phone} • {order.customer.city}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-[#0b1e3b]">
                        {formatVND(order.total)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-mono font-medium">
                        -{formatKg(order.totalPlasticOffsetKg)} rác biển
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        Lô: {order.assignedBatchId}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {order.items.length} sản phẩm
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span>Tiến độ: </span>
                      <span className="font-semibold text-[#0b1e3b]">
                        {order.fulfillmentStatus === "crafting"
                          ? "Đang gia công"
                          : order.fulfillmentStatus === "quality_check"
                          ? "Kiểm tra QC"
                          : order.fulfillmentStatus === "delivering"
                          ? "Đang giao"
                          : "Hoàn tất"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Order Detail & Artisan Blueprint Specs */}
        <div className="lg:col-span-5">
          {selectedOrder ? (
            <GlassCard className="p-6 space-y-6 border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.06)]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                    Bản Vẽ Kỹ Thuật Độc Bản:
                  </div>
                  <h3 className="text-lg font-bold text-[#0b1e3b] font-mono">
                    {selectedOrder.orderCode}
                  </h3>
                </div>
                <GlassBadge variant="ocean">{selectedOrder.paymentStatus.toUpperCase()}</GlassBadge>
              </div>

              {/* Status Updater Buttons for Artisans */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Cập Nhật Tiến Độ Xưởng:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, "crafting")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedOrder.fulfillmentStatus === "crafting"
                        ? "bg-[#0b1e3b] text-white border-[#0b1e3b] shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Đang Đan Mắt Lưới
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, "quality_check")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedOrder.fulfillmentStatus === "quality_check"
                        ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Kiểm Định (QC)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, "delivering")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedOrder.fulfillmentStatus === "delivering"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Bàn Giao Shipper
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, "delivered")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedOrder.fulfillmentStatus === "delivered"
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Đã Giao Thành Công
                  </button>
                </div>
              </div>

              {/* Technical Blueprint of Custom Item */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Thông Số Chế Tác:</span>
                  <FileCheck className="w-4 h-4 text-sky-700" />
                </div>

                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0b1e3b] text-xs">{item.title}</span>
                      <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        SL: {item.quantity}
                      </span>
                    </div>

                    {item.details?.colorName && (
                      <div className="text-xs text-slate-600">
                        Màu sợi dệt: <strong className="text-slate-900">{item.details.colorName}</strong>
                      </div>
                    )}

                    {/* Charm Anchor Points Spec Sheet for Artisan */}
                    {item.details?.configuration?.placedCharms && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="text-[11px] text-slate-500 uppercase font-mono tracking-wider">
                          Vị Trí Mắt Lưới & Góc Xoay Đính Charm:
                        </div>
                        <div className="space-y-1.5">
                          {item.details.configuration.placedCharms.map((p) => (
                            <div
                              key={p.instanceId}
                              className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono shadow-sm"
                            >
                              <span className="text-[#0b1e3b] font-medium">
                                {p.charm.symbol} {p.charm.vietnameseName}
                              </span>
                              <span className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded text-[11px] font-bold border border-sky-100">
                                Mắt #{p.anchorId.toUpperCase()} ({p.rotation}°)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="font-semibold text-slate-700">Địa chỉ phát hàng:</div>
                <div className="text-slate-900 font-medium">{selectedOrder.customer.address}</div>
                <div className="text-slate-500">{selectedOrder.customer.city}</div>
                {selectedOrder.customer.note && (
                  <div className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/80 italic mt-2">
                    Ghi chú: {selectedOrder.customer.note}
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <div className="bg-white border border-slate-200/90 p-8 text-center text-slate-500 rounded-2xl shadow-sm">
              Chọn một đơn hàng bên trái để xem bản vẽ gia công và vị trí mắt lưới của khách hàng.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
