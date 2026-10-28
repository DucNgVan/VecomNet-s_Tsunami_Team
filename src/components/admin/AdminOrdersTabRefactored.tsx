"use client";

import React, { useState, useMemo } from "react";
import {
  AdminOrder,
  OrderType,
  OrderFulfillmentStatus,
  PaymentStatus,
  Partner,
  BagSerialItem,
  saveAdminOrder,
  deleteAdminOrder,
} from "@/lib/adminDataStorage";
import { formatVND } from "@/lib/utils";
import { BAG_BASES } from "@/data/products";

interface AdminOrdersTabProps {
  orders: AdminOrder[];
  partners: Partner[];
  serials: BagSerialItem[];
  products: any[];
  onOrdersChange: (updated: AdminOrder[]) => void;
  initialFilter?: string;
  initialSelectedOrderId?: string;
}

export const AdminOrdersTabRefactored: React.FC<AdminOrdersTabProps> = ({
  orders,
  partners,
  serials,
  products,
  onOrdersChange,
  initialFilter = "all",
  initialSelectedOrderId,
}) => {
  // 1. Search & Filter States (Req 4)
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (initialFilter === "pending") return "pending_all";
    if (initialFilter === "custom_quote") return "quote_needed";
    return "all";
  });
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");

  // Selected Order for Detail Drawer (Req 6)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialSelectedOrderId || null);
  const [drawerTab, setDrawerTab] = useState<"items" | "workflow" | "payment" | "history">("workflow");

  // Create Order Modal State (Req 5)
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Quick Payment Modal inside Drawer (Req 9)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    amount: number;
    method: "bank_transfer" | "cash" | "vnpay" | "momo";
    type: "payment" | "refund";
    note: string;
  }>({
    amount: 0,
    method: "bank_transfer",
    type: "payment",
    note: "",
  });

  // Selected Order Object
  const currentOrder = useMemo(() => {
    return orders.find((o) => o.orderId === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // 2. Filtered Orders List (Req 4)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tìm theo mã đơn / tên / SĐT
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchCode = o.orderCode.toLowerCase().includes(q);
        const matchName = o.customer.fullName.toLowerCase().includes(q);
        const matchPhone = o.customer.phone.includes(q);
        if (!matchCode && !matchName && !matchPhone) return false;
      }

      // Lọc theo Loại đơn
      if (typeFilter !== "all" && o.orderType !== typeFilter) return false;

      // Lọc theo Trạng thái
      if (statusFilter === "pending_all") {
        if (o.fulfillmentStatus !== "received" && o.fulfillmentStatus !== "confirmed") return false;
      } else if (statusFilter !== "all") {
        if (o.fulfillmentStatus !== statusFilter) return false;
      }

      // Lọc theo Thanh toán
      if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;

      // Lọc theo Đối tác
      if (partnerFilter !== "all" && o.partnerCode !== partnerFilter) return false;

      return true;
    });
  }, [orders, searchTerm, typeFilter, statusFilter, paymentFilter, partnerFilter]);

  // 3. Helper Badges
  const getFulfillmentBadge = (status: OrderFulfillmentStatus) => {
    switch (status) {
      case "received":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Mới nhận</span>;
      case "confirmed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Đã xác nhận</span>;
      case "packaging":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Đang đóng gói</span>;
      case "delivering":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">Đang giao</span>;
      case "delivered":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Hoàn tất</span>;
      case "quote_needed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Cần báo giá</span>;
      case "waiting_approval":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">Chờ khách duyệt</span>;
      case "in_production":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">Sản xuất</span>;
      case "cancelled":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Đã hủy</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus, paid: number, total: number) => {
    switch (status) {
      case "paid":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Đã thanh toán đủ</span>;
      case "deposit":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800" title={`Đã cọc ${formatVND(paid)}`}>
            Đã cọc ({Math.round((paid / (total || 1)) * 100)}%)
          </span>
        );
      case "unpaid":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Chưa thu</span>;
      case "refunded":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">Đã hoàn tiền</span>;
    }
  };

  // 4. Ready-made Workflow Progression (Req 7)
  const handleProgressReadyMade = (order: AdminOrder, nextStatus: OrderFulfillmentStatus) => {
    // Nếu chuyển sang "Xác nhận", kiểm tra tồn kho & gán mã túi đúng 1 lần
    let updatedAssigned = order.assignedSerialIds || [];
    let isDeducted = order.inventoryDeducted;

    if (nextStatus === "confirmed" && !isDeducted) {
      // Tìm các mã túi còn in_stock
      const availableSerial = serials.find((s) => s.status === "in_stock");
      if (!availableSerial) {
        alert("Cảnh báo: Kho thành phẩm hiện không còn mã túi nào sẵn sàng! Hãy xuất may thêm từ kho lưới.");
      } else {
        updatedAssigned = [availableSerial.serialId];
        isDeducted = true;
      }
    }

    const nowStr = new Date().toLocaleString("vi-VN");
    const updatedOrder: AdminOrder = {
      ...order,
      fulfillmentStatus: nextStatus,
      assignedSerialIds: updatedAssigned,
      inventoryDeducted: isDeducted,
      updatedAt: nowStr,
      auditHistory: [
        {
          timestamp: nowStr,
          actor: "Admin",
          action: `Chuyển trạng thái: ${nextStatus}`,
          details: `Cập nhật tiến độ đơn hàng thành công`,
        },
        ...order.auditHistory,
      ],
    };

    const saved = saveAdminOrder(updatedOrder);
    onOrdersChange(saved);
  };

  // 5. Custom Charm Workflow Actions (Req 8)
  const handleSendQuote = (order: AdminOrder, quotePrice: number, estDate: string, concept: string) => {
    const nowStr = new Date().toLocaleString("vi-VN");
    const updatedOrder: AdminOrder = {
      ...order,
      fulfillmentStatus: "waiting_approval",
      total: order.subtotal + quotePrice + order.shippingFee,
      remainingAmount: order.subtotal + quotePrice + order.shippingFee - order.paidAmount,
      customWorkflow: {
        ...order.customWorkflow,
        conceptDescription: concept,
        quotedPrice: quotePrice,
        estimatedDeliveryDate: estDate,
        quoteSentAt: nowStr,
        clientApprovalStatus: "pending",
        approvedVersionNumber: (order.customWorkflow?.approvedVersionNumber || 0) + 1,
      },
      updatedAt: nowStr,
      auditHistory: [
        {
          timestamp: nowStr,
          actor: "Admin",
          action: "Gửi concept & báo giá cho khách",
          details: `Báo giá ${formatVND(quotePrice)}, hẹn giao ${estDate}`,
        },
        ...order.auditHistory,
      ],
    };
    const saved = saveAdminOrder(updatedOrder);
    onOrdersChange(saved);
    alert("Đã gửi concept và báo giá cho khách duyệt!");
  };

  const handleRecordClientApproval = (order: AdminOrder, approved: boolean, revisionNotes?: string) => {
    const nowStr = new Date().toLocaleString("vi-VN");
    if (approved) {
      const updatedOrder: AdminOrder = {
        ...order,
        fulfillmentStatus: "in_production",
        customWorkflow: {
          ...order.customWorkflow,
          clientApprovalStatus: "approved",
          approvedAt: nowStr,
        },
        updatedAt: nowStr,
        auditHistory: [
          {
            timestamp: nowStr,
            actor: "Admin / Khách hàng",
            action: "Khách duyệt concept chính thức",
            details: "Chuyển đơn sang khâu Sản xuất chế tác charm",
          },
          ...order.auditHistory,
        ],
      };
      const saved = saveAdminOrder(updatedOrder);
      onOrdersChange(saved);
      alert("Khách đã duyệt concept! Đơn đã chuyển sang Sản xuất.");
    } else {
      const updatedOrder: AdminOrder = {
        ...order,
        fulfillmentStatus: "quote_needed",
        customWorkflow: {
          ...order.customWorkflow,
          clientApprovalStatus: "revision_requested",
          clientRevisionNotes: revisionNotes,
        },
        updatedAt: nowStr,
        auditHistory: [
          {
            timestamp: nowStr,
            actor: "Khách hàng",
            action: "Yêu cầu chỉnh sửa concept",
            details: revisionNotes || "Khách yêu cầu sửa chi tiết",
          },
          ...order.auditHistory,
        ],
      };
      const saved = saveAdminOrder(updatedOrder);
      onOrdersChange(saved);
      alert("Đã ghi nhận yêu cầu sửa! Vui lòng chỉnh concept và báo giá lại.");
    }
  };

  // 6. Payment Recording Action (Req 9)
  const handleAddPayment = () => {
    if (!currentOrder || paymentForm.amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ lớn hơn 0!");
      return;
    }

    const nowStr = new Date().toLocaleString("vi-VN");
    const isRefund = paymentForm.type === "refund";
    const deltaAmount = isRefund ? -paymentForm.amount : paymentForm.amount;
    const newPaid = Math.max(0, currentOrder.paidAmount + deltaAmount);
    const newRemaining = Math.max(0, currentOrder.total - newPaid);

    let newStatus: PaymentStatus = currentOrder.paymentStatus;
    if (newPaid >= currentOrder.total && currentOrder.total > 0) {
      newStatus = "paid";
    } else if (newPaid > 0) {
      newStatus = "deposit";
    } else if (isRefund && newPaid === 0) {
      newStatus = "refunded";
    } else {
      newStatus = "unpaid";
    }

    const newPaymentRecord = {
      id: `PAY-${Date.now()}`,
      date: nowStr,
      amount: paymentForm.amount,
      method: paymentForm.method,
      type: paymentForm.type,
      note: paymentForm.note || (isRefund ? "Hoàn tiền cho khách" : "Thu tiền thực tế"),
      recordedBy: "Admin",
    };

    const updatedOrder: AdminOrder = {
      ...currentOrder,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      paymentStatus: newStatus,
      paymentHistory: [newPaymentRecord, ...currentOrder.paymentHistory],
      updatedAt: nowStr,
      auditHistory: [
        {
          timestamp: nowStr,
          actor: "Admin",
          action: isRefund ? "Ghi nhận hoàn tiền" : "Ghi nhận thu tiền",
          details: `${formatVND(paymentForm.amount)} qua ${paymentForm.method} (${paymentForm.note || "Giao dịch"})`,
        },
        ...currentOrder.auditHistory,
      ],
    };

    const saved = saveAdminOrder(updatedOrder);
    onOrdersChange(saved);
    setShowPaymentModal(false);
    setPaymentForm({ amount: 0, method: "bank_transfer", type: "payment", note: "" });
  };

  // 7. Direct Order Creation Handler (Req 5)
  const [createForm, setCreateForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "Đà Nẵng",
    orderType: "ready_made" as OrderType,
    selectedBagBaseId: "net-tote-01",
    bagQty: 1,
    partnerCode: "",
    depositAmount: 0,
    note: "",
    promisedDate: "",
  });

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.phone.trim()) {
      alert("Vui lòng nhập tên và số điện thoại khách hàng!");
      return;
    }

    const selectedBase = BAG_BASES.find((b) => b.id === createForm.selectedBagBaseId) || BAG_BASES[0];
    const unitPrice = selectedBase.basePrice || 490000;
    const subtotal = unitPrice * createForm.bagQty;
    const shippingFee = 30000;
    const total = subtotal + shippingFee;
    const paid = Math.min(createForm.depositAmount, total);
    const remaining = total - paid;
    const paymentStatus: PaymentStatus = paid >= total ? "paid" : paid > 0 ? "deposit" : "unpaid";

    const now = new Date();
    const orderCode = `NET-ORD-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = now.toLocaleString("vi-VN");

    const newOrder: AdminOrder = {
      orderId: `ord-${Date.now()}`,
      orderCode,
      createdAt: nowStr,
      updatedAt: nowStr,
      orderType: createForm.orderType,
      customer: {
        fullName: createForm.fullName.trim(),
        phone: createForm.phone.trim(),
        address: createForm.address.trim() || "Nhận tại xưởng",
        city: createForm.city,
        note: createForm.note,
      },
      items: [
        {
          id: `item-${Date.now()}`,
          title: selectedBase.name,
          type: "base_bag",
          price: unitPrice,
          quantity: createForm.bagQty,
          bagBaseId: selectedBase.id,
          image: selectedBase.image,
        },
      ],
      subtotal,
      shippingFee,
      total,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentStatus,
      paymentHistory:
        paid > 0
          ? [
              {
                id: `PAY-${Date.now()}`,
                date: nowStr,
                amount: paid,
                method: "cash",
                type: "payment",
                note: "Thu trực tiếp khi tạo đơn",
                recordedBy: "Admin",
              },
            ]
          : [],
      fulfillmentStatus: createForm.orderType === "custom_charm" ? "quote_needed" : "received",
      partnerCode: createForm.partnerCode || undefined,
      delivery: {
        promisedDate: createForm.promisedDate || undefined,
      },
      inventoryDeducted: false,
      auditHistory: [
        {
          timestamp: nowStr,
          actor: "Admin",
          action: "Tạo đơn hàng trực tiếp",
          details: `Tạo đơn #${orderCode} tại xưởng`,
        },
      ],
    };

    const saved = saveAdminOrder(newOrder);
    onOrdersChange(saved);
    setShowCreateModal(false);
    setSelectedOrderId(newOrder.orderId);
    alert(`Đã tạo thành công đơn hàng #${orderCode}!`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Actions (Req 4, 5) */}
      <div className="flex items-center justify-between border-b border-[#E2D8C7] pb-2.5">
        <h1 className="text-base sm:text-lg font-bold text-[#2A2521] tracking-tight">Đơn hàng</h1>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 rounded-lg bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28] transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <span>+ Tạo đơn trực tiếp</span>
        </button>
      </div>

      {/* 2. Thanh Tìm kiếm & Bộ lọc (Req 4) */}
      <div className="bg-white p-3 rounded-xl border border-[#E8E2D9] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
        {/* Tìm kiếm */}
        <div className="lg:col-span-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn, tên khách, SĐT..."
            className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C85A32]"
          />
        </div>

        {/* Lọc loại đơn */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#C85A32]"
          >
            <option value="all">Loại đơn: Tất cả</option>
            <option value="ready_made">Túi có sẵn</option>
            <option value="custom_charm">Custom Charm</option>
            <option value="b2b">Doanh nghiệp (B2B)</option>
          </select>
        </div>

        {/* Lọc trạng thái tiến độ */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#C85A32]"
          >
            <option value="all">Tiến độ: Tất cả</option>
            <option value="pending_all">Cần xử lý (Mới / Xác nhận)</option>
            <option value="quote_needed">Cần báo giá (Custom)</option>
            <option value="waiting_approval">Chờ khách duyệt</option>
            <option value="in_production">Đang sản xuất</option>
            <option value="packaging">Đang đóng gói</option>
            <option value="delivering">Đang giao hàng</option>
            <option value="delivered">Đã hoàn tất</option>
          </select>
        </div>

        {/* Lọc thanh toán & đối tác */}
        <div className="flex gap-1.5">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-1/2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg px-1.5 py-2 text-xs focus:outline-none focus:border-[#C85A32]"
          >
            <option value="all">Tiền: Tất cả</option>
            <option value="unpaid">Chưa thu</option>
            <option value="deposit">Đã cọc</option>
            <option value="paid">Đã đủ</option>
            <option value="refunded">Hoàn tiền</option>
          </select>
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="w-1/2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg px-1.5 py-2 text-xs focus:outline-none focus:border-[#C85A32]"
          >
            <option value="all">Đối tác: Tất cả</option>
            {partners.map((p) => (
              <option key={p.id} value={p.referralCode}>
                {p.referralCode}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Bảng Danh sách Đơn hàng (Req 4) */}
      <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9] font-medium">
              <tr>
                <th className="py-3 px-3">Mã đơn</th>
                <th className="py-3 px-3">Khách hàng</th>
                <th className="py-3 px-3">Loại đơn</th>
                <th className="py-3 px-3">Tổng tiền</th>
                <th className="py-3 px-3">Thanh toán</th>
                <th className="py-3 px-3">Tiến độ</th>
                <th className="py-3 px-3">Hẹn giao</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFEB]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#7A6E65]">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o.orderId}
                    className="hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                    onClick={() => setSelectedOrderId(o.orderId)}
                  >
                    <td className="py-3 px-3 font-semibold text-[#C85A32]">{o.orderCode}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#2A2521]">{o.customer.fullName}</div>
                      <div className="text-[11px] text-[#7A6E65]">{o.customer.phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-[#7A6E65]">
                        {o.orderType === "ready_made"
                          ? "Có sẵn"
                          : o.orderType === "custom_charm"
                          ? "Custom Charm"
                          : "B2B"}
                      </span>
                      {o.partnerCode && (
                        <div className="text-[10px] text-amber-700 font-mono">[{o.partnerCode}]</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#2A2521]">{formatVND(o.total)}</td>
                    <td className="py-3 px-3">
                      {getPaymentBadge(o.paymentStatus, o.paidAmount, o.total)}
                      <div className="text-[10px] text-[#A89C93] mt-0.5">
                        Thu: {formatVND(o.paidAmount)}
                      </div>
                    </td>
                    <td className="py-3 px-3">{getFulfillmentBadge(o.fulfillmentStatus)}</td>
                    <td className="py-3 px-3 text-[11px] text-[#7A6E65]">
                      {o.delivery.promisedDate || "Chưa hẹn"}
                    </td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(o.orderId)}
                        className="px-2.5 py-1 rounded bg-[#FAF7F2] text-[#2A2521] border border-[#E8E2D9] font-medium hover:border-[#C85A32] hover:text-[#C85A32] transition-colors text-xs"
                      >
                        Xử lý
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Drawer Chi tiết Đơn hàng (Req 6, 7, 8, 9) */}
      {currentOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E8E2D9] bg-[#FAF7F2] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#2A2521]">Đơn #{currentOrder.orderCode}</span>
                  {getFulfillmentBadge(currentOrder.fulfillmentStatus)}
                  {getPaymentBadge(currentOrder.paymentStatus, currentOrder.paidAmount, currentOrder.total)}
                </div>
                <div className="text-xs text-[#7A6E65] mt-0.5">
                  Ngày tạo: {currentOrder.createdAt} • Khách: {currentOrder.customer.fullName} ({currentOrder.customer.phone})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-sm font-bold text-[#7A6E65] hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Drawer Tabs (Req 6) */}
            <div className="flex border-b border-[#E8E2D9] text-xs font-semibold bg-[#FAF7F2]">
              <button
                type="button"
                onClick={() => setDrawerTab("workflow")}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  drawerTab === "workflow" ? "border-[#C85A32] text-[#C85A32] bg-white" : "border-transparent text-[#7A6E65]"
                }`}
              >
                Bước tiếp theo
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("items")}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  drawerTab === "items" ? "border-[#C85A32] text-[#C85A32] bg-white" : "border-transparent text-[#7A6E65]"
                }`}
              >
                Khách đặt gì ({currentOrder.items.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("payment")}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  drawerTab === "payment" ? "border-[#C85A32] text-[#C85A32] bg-white" : "border-transparent text-[#7A6E65]"
                }`}
              >
                Tiền & giao nhận
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("history")}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  drawerTab === "history" ? "border-[#C85A32] text-[#C85A32] bg-white" : "border-transparent text-[#7A6E65]"
                }`}
              >
                Lịch sử ({currentOrder.auditHistory.length})
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* TAB 1: BƯỚC TIẾP THEO (Req 7 & Req 8) */}
              {drawerTab === "workflow" && (
                <div className="space-y-4">
                  {/* LUỒNG ĐƠN CÓ SẴN (Req 7) */}
                  {currentOrder.orderType === "ready_made" && (
                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D9] space-y-3">
                      <div className="font-bold text-[#2A2521] text-sm">
                        Quy trình Đơn có sẵn (Ready-made flow)
                      </div>
                      <div className="text-[11px] text-[#7A6E65]">
                        Mới nhận → Xác nhận (kiểm kho & gán mã túi) → Đóng gói → Đang giao → Hoàn tất
                      </div>

                      <div className="pt-2 flex flex-wrap gap-2">
                        {currentOrder.fulfillmentStatus === "received" && (
                          <button
                            type="button"
                            onClick={() => handleProgressReadyMade(currentOrder, "confirmed")}
                            className="px-3.5 py-2 rounded-lg bg-[#C85A32] text-white font-semibold hover:bg-[#B34E28] transition-colors"
                          >
                            Xác nhận đơn & Giữ hàng kho →
                          </button>
                        )}
                        {currentOrder.fulfillmentStatus === "confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleProgressReadyMade(currentOrder, "packaging")}
                            className="px-3.5 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
                          >
                            Chuyển sang Đóng gói →
                          </button>
                        )}
                        {currentOrder.fulfillmentStatus === "packaging" && (
                          <button
                            type="button"
                            onClick={() => handleProgressReadyMade(currentOrder, "delivering")}
                            className="px-3.5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Bàn giao Vận chuyển (Đang giao) →
                          </button>
                        )}
                        {currentOrder.fulfillmentStatus === "delivering" && (
                          <button
                            type="button"
                            onClick={() => handleProgressReadyMade(currentOrder, "delivered")}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            Khách đã nhận (Hoàn tất đơn) ✓
                          </button>
                        )}
                      </div>

                      {/* Thông tin mã túi đã gán */}
                      <div className="mt-3 p-2.5 bg-white rounded border border-[#E8E2D9]">
                        <div className="font-semibold text-[#2A2521]">Mã túi xuất xưởng:</div>
                        <div className="text-[11px] text-[#7A6E65] mt-0.5">
                          {currentOrder.assignedSerialIds && currentOrder.assignedSerialIds.length > 0 ? (
                            <span className="font-mono font-bold text-emerald-700">
                              {currentOrder.assignedSerialIds.join(", ")}
                            </span>
                          ) : (
                            <span className="text-amber-700">Chưa gán mã (Sẽ tự động gán khi bấm Xác nhận đơn)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LUỒNG ĐƠN CUSTOM CHARM (Req 8) */}
                  {currentOrder.orderType === "custom_charm" && (
                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D9] space-y-3">
                      <div className="font-bold text-[#2A2521] text-sm">
                        Quy trình Đơn Charm Custom Độc Bản (Custom flow)
                      </div>
                      <div className="text-[11px] text-[#7A6E65]">
                        Cần báo giá → Chờ khách duyệt → Sản xuất chế tác → Đóng gói → Đang giao → Hoàn tất
                      </div>

                      {/* Khâu 1: Cần báo giá */}
                      {currentOrder.fulfillmentStatus === "quote_needed" && (
                        <div className="p-3 bg-white rounded-lg border border-[#E8E2D9] space-y-2">
                          <div className="font-semibold text-purple-900">1. Soạn Concept & Báo giá cho khách</div>
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] text-[#7A6E65]">Mô tả Concept thiết kế charm:</label>
                              <textarea
                                id="conceptInput"
                                defaultValue={currentOrder.customWorkflow?.conceptDescription || ""}
                                rows={2}
                                className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                                placeholder="Ví dụ: Bé mèo cầm nón lá, men lam viền vàng..."
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-[#7A6E65]">Giá báo thêm cho charm (VNĐ):</label>
                                <input
                                  type="number"
                                  id="quotePriceInput"
                                  defaultValue={currentOrder.customWorkflow?.quotedPrice || 250000}
                                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[#7A6E65]">Hẹn hoàn thành & giao:</label>
                                <input
                                  type="date"
                                  id="estDateInput"
                                  defaultValue={currentOrder.customWorkflow?.estimatedDeliveryDate || "2026-11-05"}
                                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const cInput = (document.getElementById("conceptInput") as HTMLTextAreaElement)?.value;
                                const pInput = Number((document.getElementById("quotePriceInput") as HTMLInputElement)?.value || 0);
                                const dInput = (document.getElementById("estDateInput") as HTMLInputElement)?.value;
                                handleSendQuote(currentOrder, pInput, dInput, cInput);
                              }}
                              className="px-3.5 py-2 rounded bg-purple-700 text-white font-semibold hover:bg-purple-800 transition-colors"
                            >
                              Gửi báo giá & concept cho khách xem →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Khâu 2: Chờ khách duyệt */}
                      {currentOrder.fulfillmentStatus === "waiting_approval" && (
                        <div className="p-3 bg-white rounded-lg border border-orange-200 space-y-2">
                          <div className="font-semibold text-orange-900">
                            2. Chờ khách phản hồi Concept (Phiên bản {currentOrder.customWorkflow?.approvedVersionNumber || 1})
                          </div>
                          <div className="text-[11px] text-[#7A6E65]">
                            Concept đã gửi: {currentOrder.customWorkflow?.conceptDescription} — Giá:{" "}
                            {formatVND(currentOrder.customWorkflow?.quotedPrice || 0)}
                          </div>
                          <div className="pt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRecordClientApproval(currentOrder, true)}
                              className="px-3.5 py-1.5 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                            >
                              ✓ Khách đồng ý (Chuyển Sản Xuất)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const note = prompt("Nhập nội dung khách yêu cầu sửa đổi:");
                                if (note) handleRecordClientApproval(currentOrder, false, note);
                              }}
                              className="px-3 py-1.5 rounded bg-stone-100 text-stone-800 border border-[#E8E2D9] font-medium hover:bg-stone-200 transition-colors"
                            >
                              Khách yêu cầu sửa
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Khâu 3+: Sản xuất -> Giao hàng */}
                      {["in_production", "packaging", "delivering"].includes(currentOrder.fulfillmentStatus) && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          {currentOrder.fulfillmentStatus === "in_production" && (
                            <button
                              type="button"
                              onClick={() => handleProgressReadyMade(currentOrder, "packaging")}
                              className="px-3.5 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
                            >
                              Đã chế tác xong → Chuyển Đóng gói
                            </button>
                          )}
                          {currentOrder.fulfillmentStatus === "packaging" && (
                            <button
                              type="button"
                              onClick={() => handleProgressReadyMade(currentOrder, "delivering")}
                              className="px-3.5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                            >
                              Bàn giao Vận chuyển (Đang giao) →
                            </button>
                          )}
                          {currentOrder.fulfillmentStatus === "delivering" && (
                            <button
                              type="button"
                              onClick={() => handleProgressReadyMade(currentOrder, "delivered")}
                              className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                            >
                              Khách đã nhận (Hoàn tất đơn) ✓
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: KHÁCH ĐẶT GÌ (Req 6) */}
              {drawerTab === "items" && (
                <div className="space-y-3">
                  <div className="font-bold text-sm text-[#2A2521]">Chi tiết sản phẩm khách đặt:</div>
                  <div className="space-y-2">
                    {currentOrder.items.map((item) => (
                      <div key={item.id} className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8E2D9] flex gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-14 h-14 object-cover rounded border border-[#E8E2D9] bg-white flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-[#2A2521]">{item.title}</div>
                          <div className="text-[11px] text-[#7A6E65]">
                            Số lượng: {item.quantity} • Đơn giá: {formatVND(item.price)}
                          </div>
                          {item.conceptUrl && (
                            <div className="mt-1">
                              <span className="text-[10px] text-[#C85A32] font-semibold">Bản phối concept: </span>
                              <a href={item.conceptUrl} target="_blank" rel="noreferrer" className="underline text-blue-600">
                                Xem ảnh mockup
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {currentOrder.customer.note && (
                    <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-900 text-xs">
                      <strong>Ghi chú của khách:</strong> {currentOrder.customer.note}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TIỀN & GIAO NHẬN (Req 9) */}
              {drawerTab === "payment" && (
                <div className="space-y-4">
                  {/* Tách trạng thái thanh toán & số liệu (Req 9) */}
                  <div className="grid grid-cols-3 gap-2 text-center p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]">
                    <div>
                      <div className="text-[10px] text-[#7A6E65]">Tổng giá trị đơn</div>
                      <div className="font-bold text-sm text-[#2A2521] mt-0.5">{formatVND(currentOrder.total)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-800">Đã thu thực tế</div>
                      <div className="font-bold text-sm text-emerald-700 mt-0.5">{formatVND(currentOrder.paidAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-red-800">Còn lại phải thu</div>
                      <div className="font-bold text-sm text-red-600 mt-0.5">{formatVND(currentOrder.remainingAmount)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2A2521]">Lịch sử giao dịch thu/hoàn tiền:</span>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="px-2.5 py-1 rounded bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28] transition-colors"
                    >
                      + Ghi nhận thanh toán / Hoàn tiền
                    </button>
                  </div>

                  {/* Bảng lịch sử thu tiền */}
                  <div className="bg-white rounded border border-[#E8E2D9] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9]">
                        <tr>
                          <th className="py-2 px-2.5">Thời gian</th>
                          <th className="py-2 px-2.5">Hình thức</th>
                          <th className="py-2 px-2.5">Số tiền</th>
                          <th className="py-2 px-2.5">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4EFEB]">
                        {currentOrder.paymentHistory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-[#7A6E65]">
                              Chưa có giao dịch thanh toán nào được ghi nhận.
                            </td>
                          </tr>
                        ) : (
                          currentOrder.paymentHistory.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2 px-2.5 text-[#7A6E65]">{p.date}</td>
                              <td className="py-2 px-2.5 uppercase font-mono text-[10px]">{p.method}</td>
                              <td
                                className={`py-2 px-2.5 font-bold ${
                                  p.type === "refund" ? "text-red-600" : "text-emerald-700"
                                }`}
                              >
                                {p.type === "refund" ? "-" : "+"}
                                {formatVND(p.amount)}
                              </td>
                              <td className="py-2 px-2.5 text-[#7A6E65]">{p.note || "Thanh toán"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Thông tin giao nhận */}
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-2">
                    <div className="font-bold text-[#2A2521]">Thông tin giao nhận & Vận chuyển:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-[#7A6E65]">Đơn vị vận chuyển:</label>
                        <input
                          type="text"
                          defaultValue={currentOrder.delivery.carrier || ""}
                          placeholder="Viettel Post / GHTK..."
                          id="carrierInput"
                          className="w-full bg-white border border-[#E8E2D9] rounded p-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#7A6E65]">Mã vận chuyển (Tracking):</label>
                        <input
                          type="text"
                          defaultValue={currentOrder.delivery.trackingCode || ""}
                          placeholder="VT12345678..."
                          id="trackingInput"
                          className="w-full bg-white border border-[#E8E2D9] rounded p-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const carrier = (document.getElementById("carrierInput") as HTMLInputElement)?.value;
                        const tracking = (document.getElementById("trackingInput") as HTMLInputElement)?.value;
                        const updatedOrder: AdminOrder = {
                          ...currentOrder,
                          delivery: {
                            ...currentOrder.delivery,
                            carrier,
                            trackingCode: tracking,
                          },
                        };
                        const saved = saveAdminOrder(updatedOrder);
                        onOrdersChange(saved);
                        alert("Đã lưu thông tin giao hàng!");
                      }}
                      className="px-3 py-1 rounded bg-[#2A2521] text-white text-xs font-semibold hover:bg-black transition-colors"
                    >
                      Lưu thông tin giao hàng
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: LỊCH SỬ CẬP NHẬT (Req 6) */}
              {drawerTab === "history" && (
                <div className="space-y-2">
                  <div className="font-bold text-[#2A2521] text-sm">Nhật ký thay đổi đơn hàng:</div>
                  <div className="border-l-2 border-[#E8E2D9] pl-3 space-y-3">
                    {currentOrder.auditHistory.map((log, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#C85A32]" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#2A2521]">{log.action}</span>
                          <span className="text-[10px] text-[#A89C93]">{log.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-[#7A6E65]">
                          Người thực hiện: <span className="font-medium text-[#2A2521]">{log.actor}</span> • {log.details}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-[#E8E2D9] bg-[#FAF7F2] flex items-center justify-between text-xs">
              <span className="text-[#7A6E65]">ID: {currentOrder.orderId}</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${currentOrder.orderCode}?`)) {
                    const remaining = deleteAdminOrder(currentOrder.orderId);
                    onOrdersChange(remaining);
                    setSelectedOrderId(null);
                  }
                }}
                className="text-red-600 hover:underline"
              >
                Xóa đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Tạo Đơn Trực Tiếp (Req 5) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <h2 className="text-base font-bold text-[#2A2521]">+ Tạo đơn hàng trực tiếp</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0905..."
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Địa chỉ giao hàng</label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="Số nhà, tên đường, phường..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Loại đơn</label>
                  <select
                    value={createForm.orderType}
                    onChange={(e) => setCreateForm({ ...createForm, orderType: e.target.value as OrderType })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  >
                    <option value="ready_made">Túi có sẵn</option>
                    <option value="custom_charm">Custom Charm Độc Bản</option>
                    <option value="b2b">Doanh nghiệp (B2B)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Gắn đối tác giới thiệu</label>
                  <select
                    value={createForm.partnerCode}
                    onChange={(e) => setCreateForm({ ...createForm, partnerCode: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  >
                    <option value="">Không có (Khách vãng lai)</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.referralCode}>
                        {p.name} ({p.referralCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-[#2A2521]">Chọn mẫu túi</label>
                  <select
                    value={createForm.selectedBagBaseId}
                    onChange={(e) => setCreateForm({ ...createForm, selectedBagBaseId: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  >
                    {BAG_BASES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Số lượng</label>
                  <input
                    type="number"
                    min={1}
                    value={createForm.bagQty}
                    onChange={(e) => setCreateForm({ ...createForm, bagQty: Number(e.target.value) || 1 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Tiền thu trước (Đặt cọc/Đủ)</label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.depositAmount}
                    onChange={(e) => setCreateForm({ ...createForm, depositAmount: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Hẹn ngày giao</label>
                  <input
                    type="date"
                    value={createForm.promisedDate}
                    onChange={(e) => setCreateForm({ ...createForm, promisedDate: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded bg-stone-100 text-stone-700 font-medium hover:bg-stone-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#C85A32] text-white font-semibold hover:bg-[#B34E28] transition-colors"
                >
                  Lưu & Tạo đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Ghi Nhận Thanh Toán (Req 9) */}
      {showPaymentModal && currentOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-sm p-4 shadow-xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <span className="font-bold text-[#2A2521]">Ghi nhận dòng tiền thực tế</span>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-[#7A6E65]">Loại giao dịch:</label>
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value as any })}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-1.5 text-xs"
                >
                  <option value="payment">Thu tiền (Khách thanh toán / Cọc)</option>
                  <option value="refund">Hoàn tiền (Trả lại cho khách)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#7A6E65]">Số tiền (VNĐ):</label>
                <input
                  type="number"
                  min={1}
                  value={paymentForm.amount || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) || 0 })}
                  placeholder="Ví dụ: 300000"
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-1.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7A6E65]">Phương thức:</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as any })}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-1.5 text-xs"
                >
                  <option value="bank_transfer">Chuyển khoản Ngân hàng (QR Techcombank)</option>
                  <option value="cash">Tiền mặt tại xưởng</option>
                  <option value="vnpay">Cổng VNPay</option>
                  <option value="momo">Ví MoMo</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#7A6E65]">Ghi chú giao dịch:</label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  placeholder="Ví dụ: Khách thanh toán nốt phần còn lại"
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-1.5 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-100 text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddPayment}
                  className="px-3.5 py-1.5 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  Xác nhận lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
