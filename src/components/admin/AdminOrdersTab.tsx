"use client";

import React, { useState, useMemo } from "react";
import { Order, CartItem } from "@/types";
import { formatVND } from "@/lib/utils";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Trash2,
  Eye,
  Plus,
  Printer,
  X,
  CreditCard,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Sparkles,
  QrCode,
  AlertCircle,
} from "lucide-react";

interface AdminOrdersTabProps {
  orders: Order[];
  backendProducts: any[];
  onUpdateOrderStatus: (orderId: string, status: Order["fulfillmentStatus"]) => Promise<void>;
  onTogglePaymentStatus: (orderId: string, currentStatus: "pending" | "paid") => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onCreateManualOrder: (newOrder: Order) => Promise<void>;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  backendProducts,
  onUpdateOrderStatus,
  onTogglePaymentStatus,
  onDeleteOrder,
  onCreateManualOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Selected Order for Detail View Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Manual Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manualCustomer, setManualCustomer] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "Đà Nẵng",
    note: "Đơn mua trực tiếp tại xưởng NÉT",
  });
  const [manualProductSku, setManualProductSku] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualPaymentMethod, setManualPaymentMethod] = useState<"cod" | "bank_transfer">("bank_transfer");

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => !["NET-ORD-8821", "NET-ORD-8822", "NET-ORD-8823"].includes(o.orderCode))
      .filter((order) => {
        const matchesSearch =
          order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer?.phone?.includes(searchTerm) ||
          order.customer?.city?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || order.fulfillmentStatus === statusFilter;

        const matchesPayment =
          paymentFilter === "all" || order.paymentStatus === paymentFilter;

        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  // Handle Manual Order Submission
  const handleSaveManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomer.fullName || !manualCustomer.phone) {
      alert("Vui lòng nhập họ tên và số điện thoại khách hàng!");
      return;
    }

    const selectedProduct =
      backendProducts.find((p) => p.id === manualProductSku) || backendProducts[0] || {
        id: "net-tote-01",
        name: "NÉT Tote Signature",
        basePrice: 1250000,
        imageUrl: "/assets/products/tote-blue.png",
      };

    const price = selectedProduct.basePrice || selectedProduct.price || 1250000;
    const subtotal = price * manualQty;

    const newOrder: Order = {
      orderId: `ord-pos-${Date.now()}`,
      orderCode: `NET-POS-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      customer: {
        ...manualCustomer,
      },
      items: [
        {
          cartItemId: `item-${Date.now()}`,
          type: "base_bag",
          title: selectedProduct.name,
          price: price,
          quantity: manualQty,
          image: selectedProduct.imageUrl || selectedProduct.image || "/assets/products/tote-blue.png",
          plasticOffsetKg: 1.8 * manualQty,
        },
      ],
      subtotal,
      shippingFee: 0,
      total: subtotal,
      totalPlasticOffsetKg: 1.8 * manualQty,
      assignedBatchId: "PACK-DN-2024-082",
      paymentMethod: manualPaymentMethod,
      paymentStatus: manualPaymentMethod === "bank_transfer" ? "paid" : "pending",
      fulfillmentStatus: "crafting",
    };

    await onCreateManualOrder(newOrder);
    setShowCreateModal(false);
    // Reset form
    setManualCustomer({
      fullName: "",
      phone: "",
      email: "",
      address: "",
      city: "Đà Nẵng",
      note: "Đơn mua trực tiếp tại xưởng NÉT",
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-600" />
            <span>Quản Lý Đơn Hàng & Xuất Xưởng</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi, phân bổ túi thành phẩm may lót và cập nhật trạng thái vận đơn thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Đơn Tại Xưởng (POS)</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn (NET-ORD-xxxx), tên khách, số điện thoại, tỉnh thành..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tất cả trạng thái giao</option>
            <option value="received">Tiếp nhận (Chờ duyệt)</option>
            <option value="crafting">Đang may / Đang chế tác</option>
            <option value="delivering">Đang vận chuyển</option>
            <option value="delivered">Đã giao thành công</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tất cả thanh toán</option>
            <option value="paid">Đã thanh toán (Paid)</option>
            <option value="pending">Chưa thanh toán / COD (Pending)</option>
          </select>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
            {filteredOrders.length} đơn
          </span>
        </div>
      </div>

      {/* 3. Orders Table */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Mã Đơn & Ngày</th>
                <th className="py-3.5 px-4">Khách Hàng</th>
                <th className="py-3.5 px-4">Sản Phẩm</th>
                <th className="py-3.5 px-4">Tổng Tiền</th>
                <th className="py-3.5 px-4">Thanh Toán</th>
                <th className="py-3.5 px-4">Tiến Độ Chế Tác</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const isPaid = order.paymentStatus === "paid";
                return (
                  <tr key={order.orderId} className="hover:bg-slate-50/70 transition-colors">
                    {/* Mã đơn */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{order.orderCode}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                      {order.assignedBagSerialId && (
                        <div className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal-50 text-teal-700 border border-teal-200">
                          {order.assignedBagSerialId}
                        </div>
                      )}
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {order.customer?.fullName || "Khách Vãng Lai"}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{order.customer?.phone || "Chưa có SĐT"}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                        {order.customer?.city || "Toàn quốc"}
                      </div>
                    </td>

                    {/* Sản phẩm */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="text-slate-700 flex items-center gap-1.5">
                            <span className="font-bold text-teal-600">{item.quantity}x</span>
                            <span className="truncate max-w-[150px] font-medium">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Tổng tiền */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{formatVND(order.total)}</div>
                      <div className="text-[10px] text-teal-600 font-medium">
                        -{order.totalPlasticOffsetKg || 1.8}kg lưới ma
                      </div>
                    </td>

                    {/* Thanh toán */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onTogglePaymentStatus(order.orderId, order.paymentStatus)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Bấm để đổi trạng thái thanh toán"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>{isPaid ? "Đã Thanh Toán" : "Chờ Thu Tiền (COD)"}</span>
                      </button>
                    </td>

                    {/* Tiến độ giao hàng */}
                    <td className="py-3 px-4">
                      <select
                        value={order.fulfillmentStatus}
                        onChange={(e) =>
                          onUpdateOrderStatus(order.orderId, e.target.value as any)
                        }
                        className={`text-[11px] font-bold px-2 py-1 rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                          order.fulfillmentStatus === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : order.fulfillmentStatus === "delivering"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : order.fulfillmentStatus === "crafting"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="received">1. Tiếp nhận</option>
                        <option value="crafting">2. Đang chế tác</option>
                        <option value="delivering">3. Đang giao</option>
                        <option value="delivered">4. Đã giao xong</option>
                      </select>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Xem chi tiết & Gán Serial"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteOrder(order.orderId)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Xóa đơn hàng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Order Detail & Packing Slip Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  Phiếu Xuất Xưởng & Thông Tin Đơn Hàng
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Đơn Hàng: {selectedOrder.orderCode}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Người nhận: {selectedOrder.customer?.fullName}</span>
              </div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Số điện thoại: {selectedOrder.customer?.phone}</span>
              </div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Địa chỉ: {selectedOrder.customer?.address}, {selectedOrder.customer?.city}</span>
              </div>
              {selectedOrder.customer?.note && (
                <div className="text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 text-[11px]">
                  <strong>Ghi chú từ khách:</strong> {selectedOrder.customer?.note}
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Sản phẩm trong kiện hàng:
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Số lượng: {item.quantity} • {formatVND(item.price)}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">
                      {formatVND(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Passport & Serial Identity */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2 text-xs">
              <div className="font-bold text-teal-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-teal-600" />
                <span>Định Danh Độc Bản (Story Passport & Serial ID)</span>
              </div>
              <div className="text-slate-600 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Kiện lưới nguồn: </span>
                  <strong className="font-mono">{selectedOrder.assignedBatchId || "PACK-DN-2024-082"}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Mã Serial túi: </span>
                  <strong className="font-mono text-teal-700">
                    {selectedOrder.assignedBagSerialId || "Đang tự động cấp..."}
                  </strong>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm">
              <span className="font-semibold text-slate-600">Tổng thanh toán:</span>
              <span className="font-black text-xl text-teal-700">
                {formatVND(selectedOrder.total)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In Phiếu Giao Hàng</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Manual POS Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveManualOrder}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                <span>Tạo Đơn Hàng Tại Xưởng (POS Order)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Dáng Túi</label>
                <select
                  value={manualProductSku}
                  onChange={(e) => setManualProductSku(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  {backendProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatVND(p.basePrice || p.price || 1250000)} (Tồn: {p.stockCount ?? 50})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Lượng</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={manualQty}
                    onChange={(e) => setManualQty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phương Thức Thanh Toán</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="bank_transfer">Chuyển Khoản (Đã thanh toán)</option>
                    <option value="cod">Tiền Mặt / Thu COD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ & Tên Khách Hàng</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={manualCustomer.fullName}
                  onChange={(e) =>
                    setManualCustomer({ ...manualCustomer, fullName: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0905123456"
                    value={manualCustomer.phone}
                    onChange={(e) =>
                      setManualCustomer({ ...manualCustomer, phone: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tỉnh / Thành Phố</label>
                  <input
                    type="text"
                    value={manualCustomer.city}
                    onChange={(e) =>
                      setManualCustomer({ ...manualCustomer, city: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa Chỉ Nhận Hàng</label>
                <input
                  type="text"
                  placeholder="VD: 123 Bạch Đằng, Hải Châu, Đà Nẵng"
                  value={manualCustomer.address}
                  onChange={(e) =>
                    setManualCustomer({ ...manualCustomer, address: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer"
              >
                Xác Nhận & Tạo Đơn
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
