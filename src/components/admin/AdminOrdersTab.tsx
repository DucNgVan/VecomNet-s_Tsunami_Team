"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Order, CartItem } from "@/types";
import {
  getAllDesignRequests,
  saveDesignRequest,
  DesignRequest,
  RequestStatus,
  TrackingEvent,
} from "@/lib/designRequestStorage";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";
import { formatVND, sanitizeSvg } from "@/lib/utils";
import { deductInventoryForCustomOrder } from "@/lib/inventoryStorage";
import { generateCharmSTLFromSVG, triggerSTLDownload } from "@/lib/stlGenerator";

interface AdminOrdersTabProps {
  orders: Order[];
  backendProducts: any[];
  onUpdateOrderStatus: (orderId: string, status: Order["fulfillmentStatus"]) => Promise<void>;
  onTogglePaymentStatus: (orderId: string, currentStatus: "pending" | "paid") => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onCreateManualOrder: (newOrder: Order) => Promise<void>;
  initialTypeFilter?: "all" | "custom" | "standard" | "b2b";
}

// 3 Core Order Types: Đơn Custom, Đơn Có Sẵn, Đơn Doanh Nghiệp B2B
export type UnifiedOrderType = "custom" | "standard" | "b2b";

// 4 Core Stages requested:
// 1. pending: Đơn đang chờ xác nhận (hoặc Đơn đang được tiếp nhận)
// 2. crafting: Đơn đang chế tác
// 3. shipping: Đơn đang giao
// 4. completed: Đơn đã hoàn thành (CHỈ khi khách hàng bấm xác nhận đã nhận)
// 5. cancelled: Đã huỷ
export type UnifiedOrderStage = "pending" | "crafting" | "shipping" | "completed" | "cancelled";

export interface UnifiedOrderRow {
  uniqueKey: string;
  type: UnifiedOrderType;
  stage: UnifiedOrderStage;
  code: string;
  createdAt: string;
  timestamp: number;
  customerName: string;
  customerDob?: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  partnerCode?: string;
  summary: string;
  subSummary?: string;
  priceDisplay: string;
  plasticOffsetKg: number;
  statusLabel: string;
  statusKey: string;
  statusType: "pending" | "concept" | "approved" | "revision" | "production" | "shipping" | "completed" | "cancelled";
  paymentLabel: string;
  isPaid: boolean;
  inventoryDeducted?: boolean;
  inventoryDeductedLog?: string;
  inventoryDeductedAt?: string;
  customerReceivedConfirmed?: boolean;
  customerReceivedAt?: string;
  rawStudioReq?: DesignRequest;
  rawShopOrder?: Order;
  b2bData?: {
    companyName: string;
    representative: string;
    itemCount: number;
  };
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  backendProducts,
  onUpdateOrderStatus,
  onTogglePaymentStatus,
  onDeleteOrder,
  onCreateManualOrder,
  initialTypeFilter = "all",
}) => {
  // Main Top Stage Tabs: 'pending' (Default) | 'crafting' | 'shipping' | 'completed' | 'cancelled'
  const [stageFilter, setStageFilter] = useState<UnifiedOrderStage>("pending");

  // Secondary Order Type Filter: 'all' | 'custom' | 'standard' | 'b2b'
  const [orderTypeFilter, setOrderTypeFilter] = useState<"all" | "custom" | "standard" | "b2b">(initialTypeFilter);

  // Search & Payment Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Design Requests state
  const [designRequests, setDesignRequests] = useState<DesignRequest[]>([]);

  // Selected Item for Inspection Drawers
  const [selectedStudioReq, setSelectedStudioReq] = useState<DesignRequest | null>(null);
  const [selectedShopOrder, setSelectedShopOrder] = useState<Order | null>(null);
  const [selectedB2BOrder, setSelectedB2BOrder] = useState<UnifiedOrderRow | null>(null);

  // Studio Quote & Concept Form State
  const [quotePrice, setQuotePrice] = useState<number>(85000);
  const [conceptUrl, setConceptUrl] = useState<string>("/assets/products/bucket-sand.png");
  const [conceptMessage, setConceptMessage] = useState<string>("");

  // Studio Shipping Form State
  const [carrierName, setCarrierName] = useState<string>("GHTK");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [newEventDesc, setNewEventDesc] = useState<string>("");

  // POS Manual Order Modal State
  const [showCreatePOSModal, setShowCreatePOSModal] = useState(false);
  const [manualCustomer, setManualCustomer] = useState({
    fullName: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
    city: "Đà Nẵng",
    note: "Đơn mua trực tiếp tại xưởng NÉT Đà Nẵng",
  });
  const [manualProductSku, setManualProductSku] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualPaymentMethod, setManualPaymentMethod] = useState<"cod" | "bank_transfer">("bank_transfer");

  // Load Design Requests from local storage
  const loadDesignRequests = () => {
    const all = getAllDesignRequests();
    setDesignRequests(all);
  };

  useEffect(() => {
    loadDesignRequests();
  }, []);

  // Sync selected Studio Request form when item changes
  useEffect(() => {
    if (selectedStudioReq) {
      setQuotePrice(selectedStudioReq.customCharmPrice || 85000);
      setConceptUrl(selectedStudioReq.conceptImageUrl || "/assets/products/bucket-sand.png");
      setConceptMessage(selectedStudioReq.conceptNote || "");
      setCarrierName(selectedStudioReq.carrier || "GHTK");
      setTrackingNumber(selectedStudioReq.trackingCode || "");
    }
  }, [selectedStudioReq]);

  // Combine real sources into unified list (Zero Mock Data)
  const unifiedOrders = useMemo<UnifiedOrderRow[]>(() => {
    const rows: UnifiedOrderRow[] = [];

    // 1. Process Studio Custom Design Requests
    designRequests.forEach((req) => {
      let statusType: UnifiedOrderRow["statusType"] = "pending";
      let statusLabel = "Chờ tiếp nhận";
      let stage: UnifiedOrderStage = "pending";

      switch (req.status) {
        case "pending_review":
          statusType = "pending";
          statusLabel = "Chờ tiếp nhận";
          stage = "pending";
          break;
        case "concept_sent":
          statusType = "concept";
          statusLabel = "Đã gửi concept & báo giá";
          stage = "pending";
          break;
        case "revision_requested":
          statusType = "revision";
          statusLabel = "Yêu cầu chỉnh sửa concept";
          stage = "pending";
          break;
        case "approved":
          statusType = "approved";
          statusLabel = "Khách đã duyệt thiết kế";
          stage = "crafting";
          break;
        case "in_production":
          statusType = "production";
          statusLabel = "Đang chế tác xưởng";
          stage = "crafting";
          break;
        case "shipping":
          statusType = "shipping";
          statusLabel = "Đang giao hàng";
          stage = "shipping";
          break;
        case "completed":
          statusType = "completed";
          statusLabel = "Đã hoàn thành";
          stage = "completed";
          break;
        case "cancelled":
          statusType = "cancelled";
          statusLabel = "Đã huỷ";
          stage = "cancelled";
          break;
      }

      const charmsSummary = `${req.placedCharms.length} charm ${
        req.hasCustomCharm ? "• Có charm riêng" : ""
      }`;

      const priceVal = req.finalTotal || req.baseTotal + (req.customCharmPrice || 0);
      const isB2B = !!req.partnerCode || req.customerName?.toLowerCase().includes("resort") || req.customerName?.toLowerCase().includes("hotel");

      // Placed charms list for subSummary
      const placedNames = req.placedCharms.map((c) => c.charm.vietnameseName).join(", ");
      let subDesc = placedNames ? `Charm: ${placedNames}` : "Chưa gắn charm";
      if (req.hasCustomCharm) {
        subDesc += ` • Yêu cầu riêng: "${req.customCharm?.idea || req.notes || "Custom charm"}"`;
      }

      rows.push({
        uniqueKey: `studio-${req.id}`,
        type: isB2B ? "b2b" : "custom",
        stage,
        code: req.id,
        createdAt: req.createdAt,
        timestamp: new Date(req.createdAt).getTime() || 0,
        customerName: req.customerName || "Khách Custom",
        customerDob: req.customerDob || "Chưa cập nhật",
        customerPhone: req.customerPhone || req.contact || "Chưa có SĐT",
        customerEmail: req.contact?.includes("@") ? req.contact : "Chưa cập nhật",
        customerAddress: req.customerAddress || (req.deliveryMethodLabel ? req.deliveryMethodLabel : "Chưa cập nhật"),
        customerCity: req.customerAddress,
        partnerCode: req.partnerCode,
        summary: `${req.bagName} (${charmsSummary})`,
        subSummary: subDesc,
        priceDisplay: req.hasCustomCharm && !req.customCharmPrice
          ? "Chờ báo giá"
          : formatVND(priceVal),
        plasticOffsetKg: 1.8 + (req.placedCharms.length * 0.15),
        statusLabel,
        statusKey: req.status,
        statusType,
        paymentLabel: req.status === "approved" || req.status === "in_production" || req.status === "shipping" || req.status === "completed"
          ? "Đã duyệt / Thu tiền"
          : req.status === "cancelled"
          ? "Đã huỷ"
          : "Chờ duyệt báo giá",
        isPaid: req.status === "approved" || req.status === "completed",
        inventoryDeducted: req.inventoryDeducted,
        inventoryDeductedLog: req.inventoryDeductedLog,
        inventoryDeductedAt: req.inventoryDeductedAt,
        rawStudioReq: req,
        ...(isB2B ? {
          b2bData: {
            companyName: req.customerName,
            representative: req.customerName,
            itemCount: 1,
          }
        } : {}),
      });
    });

    // 2. Process Shop Standard Orders
    const validShopOrders = orders.filter(
      (o) =>
        !["NET-ORD-8821", "NET-ORD-8822", "NET-ORD-8823"].includes(o.orderCode) &&
        !o.items?.some((it) => it.title?.toLowerCase().includes("sample test"))
    );

    validShopOrders.forEach((o) => {
      let statusType: UnifiedOrderRow["statusType"] = "pending";
      let statusLabel = "Chờ xác nhận";
      let stage: UnifiedOrderStage = "pending";

      switch (o.fulfillmentStatus) {
        case "received":
          statusType = "pending";
          statusLabel = "Chờ xác nhận";
          stage = "pending";
          break;
        case "crafting":
        case "quality_check":
          statusType = "production";
          statusLabel = "Đang chế tác xưởng";
          stage = "crafting";
          break;
        case "delivering":
          statusType = "shipping";
          statusLabel = "Đang giao hàng";
          stage = "shipping";
          break;
        case "delivered":
          statusType = "completed";
          statusLabel = "Đã hoàn thành";
          stage = "completed";
          break;
        case "cancelled":
          statusType = "cancelled";
          statusLabel = "Đã huỷ";
          stage = "cancelled";
          break;
      }

      const itemsDesc = o.items?.map((i) => `${i.quantity}x ${i.title}`).join(", ") || "Sản phẩm NÉT";
      const isB2B = o.customer?.note?.toLowerCase().includes("b2b") || o.customer?.fullName?.toLowerCase().includes("resort") || o.customer?.fullName?.toLowerCase().includes("hotel");

      // Address is kept strictly in customer fields, NOT subSummary
      const subNotes = o.customer?.note
        ? `Ghi chú: ${o.customer.note}`
        : `Lô lưới: ${o.assignedBatchId || "PACK-DN-2024-082"}`;

      rows.push({
        uniqueKey: `shop-${o.orderId}`,
        type: isB2B ? "b2b" : "standard",
        stage,
        code: o.orderCode,
        createdAt: o.createdAt,
        timestamp: new Date(o.createdAt).getTime() || 0,
        customerName: o.customer?.fullName || "Khách Vãng Lai",
        customerDob: o.customer?.dob || "Chưa cập nhật",
        customerPhone: o.customer?.phone || "Chưa có SĐT",
        customerEmail: o.customer?.email || "Chưa cập nhật",
        customerAddress: [o.customer?.address, o.customer?.city].filter(Boolean).join(", ") || "Chưa cập nhật",
        customerCity: o.customer?.city,
        summary: itemsDesc,
        subSummary: subNotes,
        priceDisplay: formatVND(o.total),
        plasticOffsetKg: o.totalPlasticOffsetKg || 1.8,
        statusLabel,
        statusKey: o.fulfillmentStatus,
        statusType,
        paymentLabel: o.paymentStatus === "paid" ? "Đã thanh toán" : "Thu COD",
        isPaid: o.paymentStatus === "paid",
        customerReceivedConfirmed: o.customerReceivedConfirmed,
        customerReceivedAt: o.customerReceivedAt,
        rawShopOrder: o,
        ...(isB2B ? {
          b2bData: {
            companyName: o.customer?.fullName || "Khách hàng B2B",
            representative: o.customer?.fullName || "Đại diện mua sắm",
            itemCount: o.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1,
          }
        } : {}),
      });
    });

    // Sort newest first
    return rows.sort((a, b) => b.timestamp - a.timestamp);
  }, [designRequests, orders]);

  // Stage & Type Metrics calculation
  const metrics = useMemo(() => {
    const totalCount = unifiedOrders.length;
    const pendingCount = unifiedOrders.filter((r) => r.stage === "pending").length;
    const craftingCount = unifiedOrders.filter((r) => r.stage === "crafting").length;
    const shippingCount = unifiedOrders.filter((r) => r.stage === "shipping").length;
    const completedCount = unifiedOrders.filter((r) => r.stage === "completed").length;
    const cancelledCount = unifiedOrders.filter((r) => r.stage === "cancelled").length;

    const customCount = unifiedOrders.filter((r) => r.type === "custom").length;
    const standardCount = unifiedOrders.filter((r) => r.type === "standard").length;
    const b2bCount = unifiedOrders.filter((r) => r.type === "b2b").length;

    const totalPlasticKg = unifiedOrders.reduce((sum, r) => sum + r.plasticOffsetKg, 0);

    return {
      totalCount,
      pendingCount,
      craftingCount,
      shippingCount,
      completedCount,
      cancelledCount,
      customCount,
      standardCount,
      b2bCount,
      totalPlasticKg: Math.round(totalPlasticKg * 10) / 10,
    };
  }, [unifiedOrders]);

  // Filtered rows based on UI controls
  const filteredRows = useMemo(() => {
    return unifiedOrders.filter((row) => {
      // 1. Stage Tab Filter (pending | crafting | shipping | completed | cancelled)
      if (row.stage !== stageFilter) {
        return false;
      }

      // 2. Order Type Filter (all | custom | standard | b2b)
      if (orderTypeFilter !== "all" && row.type !== orderTypeFilter) {
        return false;
      }

      // 3. Search Filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesCode = row.code.toLowerCase().includes(query);
        const matchesName = row.customerName.toLowerCase().includes(query);
        const matchesPhone = row.customerPhone.toLowerCase().includes(query);
        const matchesAddress = (row.customerAddress || "").toLowerCase().includes(query);
        const matchesPartner = row.partnerCode?.toLowerCase().includes(query);
        const matchesSummary = row.summary.toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesPhone && !matchesAddress && !matchesPartner && !matchesSummary) {
          return false;
        }
      }

      // 4. Payment Filter
      if (paymentFilter === "paid" && !row.isPaid) return false;
      if (paymentFilter === "pending" && row.isPaid) return false;

      return true;
    });
  }, [unifiedOrders, stageFilter, orderTypeFilter, searchTerm, paymentFilter]);

  // Handle clicking ANY order row to open its details drawer
  const handleOpenOrderDetails = (row: UnifiedOrderRow) => {
    if (row.type === "b2b" && row.b2bData && !row.rawStudioReq && !row.rawShopOrder) {
      setSelectedB2BOrder(row);
      setSelectedStudioReq(null);
      setSelectedShopOrder(null);
    } else if (row.type === "custom" || row.rawStudioReq) {
      setSelectedStudioReq(row.rawStudioReq || null);
      setSelectedShopOrder(null);
      setSelectedB2BOrder(null);
    } else {
      setSelectedShopOrder(row.rawShopOrder || null);
      setSelectedStudioReq(null);
      setSelectedB2BOrder(null);
    }
  };

  // -------------------------------------------------------------
  // STUDIO ACTION HANDLERS & INVENTORY DEDUCTION
  // -------------------------------------------------------------
  const handleUpdateStudioStatus = (newStatus: RequestStatus) => {
    if (!selectedStudioReq) return;

    // Strict two-way confirmation rule: Admin cannot set 'completed'
    if (newStatus === "completed") {
      alert("Quy định hệ thống: Admin không được tự ý ấn 'Đã hoàn thành'. Đơn hàng chỉ tự động chuyển sang hoàn thành khi khách hàng xác nhận 'Tôi đã nhận được túi' trên trang tra cứu / Story Passport.");
      return;
    }

    let deducted = selectedStudioReq.inventoryDeducted;
    let deductedLog = selectedStudioReq.inventoryDeductedLog;
    let deductedAt = selectedStudioReq.inventoryDeductedAt;

    // Auto deduct 1 base bag + placed charms when approved or moved to production
    if ((newStatus === "approved" || newStatus === "in_production") && !deducted) {
      const deductionRes = deductInventoryForCustomOrder({
        orderId: selectedStudioReq.id,
        bagId: selectedStudioReq.bagId,
        bagName: selectedStudioReq.bagName,
        placedCharms: selectedStudioReq.placedCharms.map((pc) => ({
          charmId: pc.charm.id,
          charmName: pc.charm.name,
          vietnameseName: pc.charm.vietnameseName,
        })),
      });
      deducted = true;
      deductedLog = deductionRes.log;
      deductedAt = new Date().toISOString();
      alert(`[Kho Nguyên Vật Liệu NÉT]\n${deductionRes.log}`);
    }

    const updated: DesignRequest = {
      ...selectedStudioReq,
      status: newStatus,
      inventoryDeducted: deducted,
      inventoryDeductedLog: deductedLog,
      inventoryDeductedAt: deductedAt,
    };
    saveDesignRequest(updated);
    setSelectedStudioReq(updated);
    loadDesignRequests();
  };

  const handleManualDeductInventory = () => {
    if (!selectedStudioReq) return;
    if (selectedStudioReq.inventoryDeducted) {
      alert("Đơn hàng này đã được trừ kho phôi và charm trước đó!");
      return;
    }
    const deductionRes = deductInventoryForCustomOrder({
      orderId: selectedStudioReq.id,
      bagId: selectedStudioReq.bagId,
      bagName: selectedStudioReq.bagName,
      placedCharms: selectedStudioReq.placedCharms.map((pc) => ({
        charmId: pc.charm.id,
        charmName: pc.charm.name,
        vietnameseName: pc.charm.vietnameseName,
      })),
    });
    const updated: DesignRequest = {
      ...selectedStudioReq,
      inventoryDeducted: true,
      inventoryDeductedLog: deductionRes.log,
      inventoryDeductedAt: new Date().toISOString(),
    };
    saveDesignRequest(updated);
    setSelectedStudioReq(updated);
    loadDesignRequests();
    alert(`[Kho Nguyên Vật Liệu NÉT]\n${deductionRes.log}`);
  };

  const handleSendConceptAndQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudioReq) return;

    const nextVer = (selectedStudioReq.conceptVersion || 0) + 1;
    const updated: DesignRequest = {
      ...selectedStudioReq,
      status: "concept_sent",
      customCharmPrice: quotePrice,
      finalTotal: selectedStudioReq.baseTotal + quotePrice,
      conceptVersion: nextVer,
      conceptImageUrl: conceptUrl,
      conceptNote: conceptMessage,
      conceptSentAt: new Date().toLocaleString("vi-VN"),
    };

    saveDesignRequest(updated);
    setSelectedStudioReq(updated);
    loadDesignRequests();
    alert(`Đã gửi thành công Concept #${nextVer} và báo giá ${formatVND(quotePrice)} đến khách hàng!`);
  };

  const handleAddStudioShipmentEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudioReq) return;

    const newEvt: TrackingEvent = {
      time: new Date().toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      }),
      status: "Vận chuyển",
      location: "Đà Nẵng",
      description: newEventDesc || "Đang giao kiện hàng đến người nhận",
    };

    const existingEvents = selectedStudioReq.trackingEvents || [];
    const updated: DesignRequest = {
      ...selectedStudioReq,
      status: "shipping",
      carrier: carrierName,
      trackingCode: trackingNumber,
      trackingEvents: [newEvt, ...existingEvents],
    };

    saveDesignRequest(updated);
    setSelectedStudioReq(updated);
    loadDesignRequests();
    setNewEventDesc("");
    alert("Đã cập nhật sự kiện hành trình vận chuyển!");
  };

  const handleDeleteStudioReq = (id: string) => {
    if (!confirm(`Bạn có chắc muốn xóa yêu cầu thiết kế ${id} không?`)) return;
    const current = getAllDesignRequests();
    const updated = current.filter((r) => r.id.toUpperCase() !== id.toUpperCase());
    localStorage.setItem("net_design_requests_v2", JSON.stringify(updated));
    loadDesignRequests();
    if (selectedStudioReq?.id === id) {
      setSelectedStudioReq(null);
    }
  };

  // -------------------------------------------------------------
  // PURGE MOCK DATA (Xoá hết dữ liệu mẫu thử nghiệm theo lệnh user)
  // -------------------------------------------------------------
  const handlePurgeMockData = () => {
    if (!confirm("Bạn có chắc muốn làm sạch toàn bộ dữ liệu mẫu thử nghiệm cũ không? Dữ liệu thực từ khách hàng sẽ được giữ nguyên.")) return;
    try {
      // 1. Purge design requests mock IDs
      const rawReq = localStorage.getItem("net_design_requests_v2");
      if (rawReq) {
        const parsed = JSON.parse(rawReq);
        const cleaned = parsed.filter((r: any) => !["NET-DN-8821", "NET-2026-8819", "NET-2026-8820", "NET-2026-8822"].includes(r.id));
        localStorage.setItem("net_design_requests_v2", JSON.stringify(cleaned));
      }
      // 2. Purge mock orders
      const rawOrders = localStorage.getItem("net_orders_v1");
      if (rawOrders) {
        const parsed = JSON.parse(rawOrders);
        const cleaned = parsed.filter((o: any) => 
          !["NET-ORD-8821", "NET-ORD-8822", "NET-ORD-8823"].includes(o.orderCode) &&
          !o.items?.some((it: any) => it.title?.toLowerCase().includes("sample test"))
        );
        localStorage.setItem("net_orders_v1", JSON.stringify(cleaned));
      }
      loadDesignRequests();
      alert("Đã làm sạch toàn bộ dữ liệu mẫu thử nghiệm thành công!");
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // POS MANUAL ORDER SUBMISSION
  // -------------------------------------------------------------
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
    setShowCreatePOSModal(false);
    setManualCustomer({
      fullName: "",
      dob: "",
      phone: "",
      email: "",
      address: "",
      city: "Đà Nẵng",
      note: "Đơn mua trực tiếp tại xưởng NÉT Đà Nẵng",
    });
  };

  // Render Status Badge (Pure typography - no icons)
  const renderRowStatusBadge = (row: UnifiedOrderRow) => {
    switch (row.statusType) {
      case "pending":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            {row.statusLabel}
          </span>
        );
      case "concept":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-900 border border-sky-200">
            {row.statusLabel}
          </span>
        );
      case "approved":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            {row.statusLabel}
          </span>
        );
      case "revision":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-900 border border-rose-200">
            {row.statusLabel}
          </span>
        );
      case "production":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5ECE5] text-[#B85D43] border border-[#E4D1C3]">
            {row.statusLabel}
          </span>
        );
      case "shipping":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
            {row.statusLabel}
          </span>
        );
      case "completed":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-950 border border-emerald-300">
            {row.statusLabel}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-950 border border-rose-300">
            {row.statusLabel}
          </span>
        );
      default:
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800">
            {row.statusLabel}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 text-[#241B16]">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E2D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5ECE5] text-[#B85D43] border border-[#E4D1C3]">
              Trung Tâm Điều Phối Đơn Hàng & Xưởng May
            </span>
            <span className="text-xs text-[#8F8177]">NÉT Workshop OS</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#241B16] tracking-tight">
            Quản Lý & Điều Phối Tiến Độ Đơn Hàng
          </h1>
          <p className="text-xs sm:text-sm text-[#5E4D43] mt-1 max-w-2xl leading-relaxed">
            Hệ thống quản lý quy trình 4 bước: Tiếp nhận ➔ Chế tác ➔ Giao hàng ➔ Hoàn thành (xác nhận 2 chiều).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handlePurgeMockData}
            title="Làm sạch dữ liệu mẫu thử nghiệm cũ"
            className="px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#5E4D43] hover:text-[#241B16] font-medium text-xs border border-[#E8E2D8] transition-all cursor-pointer"
          >
            Làm Sạch Dữ Liệu Mẫu
          </button>
          <button
            onClick={() => setShowCreatePOSModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#B85D43] hover:bg-[#A24E36] text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
          >
            Tạo Đơn Tại Xưởng (POS)
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards for 4 Core Workflow Stages (NO ICONS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Pending Orders (Đang được tiếp nhận / Chờ xác nhận) */}
        <div
          onClick={() => setStageFilter("pending")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            stageFilter === "pending"
              ? "bg-[#FFFBF5] border-amber-400 shadow-sm ring-1 ring-amber-400/40"
              : "bg-white/70 border-[#E8E2D8] hover:bg-white"
          }`}
        >
          <div className="text-amber-800 text-xs font-semibold uppercase tracking-wider text-[11px]">
            1. Đơn Đang Chờ Xác Nhận
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl text-amber-900 font-bold">
              {metrics.pendingCount}
            </span>
            <span className="text-xs text-[#5E4D43]">đơn mới nhận</span>
          </div>
          <div className="mt-2 text-[11px] text-[#8F8177]">
            Chờ duyệt concept & xác nhận xưởng
          </div>
        </div>

        {/* Card 2: Crafting Orders (Đang chế tác) */}
        <div
          onClick={() => setStageFilter("crafting")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            stageFilter === "crafting"
              ? "bg-[#FCF9F6] border-[#B85D43] shadow-sm ring-1 ring-[#B85D43]/40"
              : "bg-white/70 border-[#E8E2D8] hover:bg-white"
          }`}
        >
          <div className="text-[#B85D43] text-xs font-semibold uppercase tracking-wider text-[11px]">
            2. Đơn Đang Chế Tác
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl text-[#B85D43] font-bold">
              {metrics.craftingCount}
            </span>
            <span className="text-xs text-[#5E4D43]">đang may & đúc</span>
          </div>
          <div className="mt-2 text-[11px] text-[#5E4D43]">
            Khách đã duyệt, xưởng đúc charm
          </div>
        </div>

        {/* Card 3: Shipping Orders (Đang giao) */}
        <div
          onClick={() => setStageFilter("shipping")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            stageFilter === "shipping"
              ? "bg-[#F4F7FC] border-[#2563EB] shadow-sm ring-1 ring-[#2563EB]/40"
              : "bg-white/70 border-[#E8E2D8] hover:bg-white"
          }`}
        >
          <div className="text-[#2563EB] text-xs font-semibold uppercase tracking-wider text-[11px]">
            3. Đơn Đang Giao
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl text-[#2563EB] font-bold">
              {metrics.shippingCount}
            </span>
            <span className="text-xs text-[#5E4D43]">đang vận chuyển</span>
          </div>
          <div className="mt-2 text-[11px] text-[#5E4D43]">
            Đã bàn giao bưu cục / đối tác
          </div>
        </div>

        {/* Card 4: Completed Orders (Đã hoàn thành - 2 chiều) */}
        <div
          onClick={() => setStageFilter("completed")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            stageFilter === "completed"
              ? "bg-[#F7FAF8] border-[#1E5C46] shadow-sm ring-1 ring-[#1E5C46]/40"
              : "bg-white/70 border-[#E8E2D8] hover:bg-white"
          }`}
        >
          <div className="text-[#1E5C46] text-xs font-semibold uppercase tracking-wider text-[11px]">
            4. Đơn Đã Hoàn Thành
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl text-[#1E5C46] font-bold">
              {metrics.completedCount}
            </span>
            <span className="text-xs text-[#5E4D43]">khách đã nhận</span>
          </div>
          <div className="mt-2 text-[11px] text-[#8F8177]">
            Khách xác nhận nhận túi thành công
          </div>
        </div>
      </div>

      {/* 3. Main Stage Tabs & Secondary Type Switcher (NO ICONS) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E2D8] shadow-sm space-y-4">
        {/* ROW 1: 4 Core Stages requested:
            - Đơn đang chờ xác nhận (hoặc Đơn đang được tiếp nhận)
            - Đơn đang chế tác
            - Đơn đang giao
            - Đơn đã hoàn thành
            - Đã huỷ
        */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EAE1] pb-3.5">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#F6F2EB] border border-[#E8E2D8]/80">
            {/* Tab: Đơn Đang Chờ Xác Nhận (Đang được tiếp nhận) */}
            <button
              onClick={() => setStageFilter("pending")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                stageFilter === "pending"
                  ? "bg-amber-600 text-white shadow-xs font-semibold"
                  : "text-[#5E4D43] hover:text-[#241B16]"
              }`}
            >
              <span>Đơn đang được tiếp nhận</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${stageFilter === "pending" ? "bg-white/20 text-white font-bold" : "bg-[#EAE2D7] text-[#5E4D43]"}`}>
                {metrics.pendingCount}
              </span>
            </button>

            {/* Tab: Đơn Đang Chế Tác */}
            <button
              onClick={() => setStageFilter("crafting")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                stageFilter === "crafting"
                  ? "bg-[#B85D43] text-white shadow-xs font-semibold"
                  : "text-[#5E4D43] hover:text-[#241B16]"
              }`}
            >
              <span>Đơn đang chế tác</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${stageFilter === "crafting" ? "bg-white/20 text-white font-bold" : "bg-[#EAE2D7] text-[#5E4D43]"}`}>
                {metrics.craftingCount}
              </span>
            </button>

            {/* Tab: Đơn Đang Giao */}
            <button
              onClick={() => setStageFilter("shipping")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                stageFilter === "shipping"
                  ? "bg-[#2563EB] text-white shadow-xs font-semibold"
                  : "text-[#5E4D43] hover:text-[#241B16]"
              }`}
            >
              <span>Đơn đang giao</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${stageFilter === "shipping" ? "bg-white/20 text-white font-bold" : "bg-[#EAE2D7] text-[#5E4D43]"}`}>
                {metrics.shippingCount}
              </span>
            </button>

            {/* Tab: Đơn Đã Hoàn Thành */}
            <button
              onClick={() => setStageFilter("completed")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                stageFilter === "completed"
                  ? "bg-[#1E5C46] text-white shadow-xs font-semibold"
                  : "text-[#5E4D43] hover:text-[#241B16]"
              }`}
            >
              <span>Đơn đã hoàn thành</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${stageFilter === "completed" ? "bg-white/20 text-white font-bold" : "bg-[#EAE2D7] text-[#5E4D43]"}`}>
                {metrics.completedCount}
              </span>
            </button>

            {/* Tab: Đơn Đã Huỷ */}
            <button
              onClick={() => setStageFilter("cancelled")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                stageFilter === "cancelled"
                  ? "bg-[#991B1B] text-white shadow-xs font-semibold"
                  : "text-[#5E4D43] hover:text-[#241B16]"
              }`}
            >
              <span>Đã huỷ</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${stageFilter === "cancelled" ? "bg-white/20 text-white font-bold" : "bg-[#EAE2D7] text-[#5E4D43]"}`}>
                {metrics.cancelledCount}
              </span>
            </button>
          </div>

          <div className="text-xs text-[#8F8177] flex items-center gap-2">
            <span>Hiển thị: <strong>{filteredRows.length}</strong> đơn trong mục này</span>
            <button
              onClick={() => {
                setSearchTerm("");
                setStageFilter("pending");
                setOrderTypeFilter("all");
                setPaymentFilter("all");
                loadDesignRequests();
              }}
              title="Đặt lại bộ lọc"
              className="px-2 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#8F8177] hover:text-[#241B16] text-xs font-medium transition-colors cursor-pointer border border-[#E8E2D8]"
            >
              Đặt lại
            </button>
          </div>
        </div>

        {/* ROW 2: DƯỚI NÀY LÀ ĐƠN CUSTOM, ĐƠN CÓ SẴN, ĐƠN DOANH NGHIỆP B2B (NO ICONS) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Button Group: Tất Cả | Đơn custom | Đơn có sẵn | Đơn doanh nghiệp b2b */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <button
              onClick={() => setOrderTypeFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                orderTypeFilter === "all"
                  ? "bg-[#241B16] text-white font-semibold shadow-xs"
                  : "text-[#5E4D43] hover:text-[#241B16]"
              }`}
            >
              Tất cả loại ({metrics.totalCount})
            </button>

            <button
              onClick={() => setOrderTypeFilter("custom")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                orderTypeFilter === "custom"
                  ? "bg-[#B85D43] text-white font-semibold shadow-xs"
                  : "text-[#5E4D43] hover:text-[#241B16]"
              }`}
            >
              <span>Đơn custom</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${orderTypeFilter === "custom" ? "bg-white/20 text-white font-bold" : "bg-[#EAE2D7] text-[#5E4D43]"}`}>
                {metrics.customCount}
              </span>
            </button>

            <button
              onClick={() => setOrderTypeFilter("standard")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                orderTypeFilter === "standard"
                  ? "bg-[#1E5C46] text-white font-semibold shadow-xs"
                  : "text-[#5E4D43] hover:text-[#241B16]"
              }`}
            >
              <span>Đơn có sẵn</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${orderTypeFilter === "standard" ? "bg-white/20 text-white font-bold" : "bg-[#EAE2D7] text-[#5E4D43]"}`}>
                {metrics.standardCount}
              </span>
            </button>

            <button
              onClick={() => setOrderTypeFilter("b2b")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                orderTypeFilter === "b2b"
                  ? "bg-[#B45309] text-white font-semibold shadow-xs"
                  : "text-[#5E4D43] hover:text-[#241B16]"
              }`}
            >
              <span>Đơn doanh nghiệp B2B</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${orderTypeFilter === "b2b" ? "bg-white/20 text-white font-bold" : "bg-[#EAE2D7] text-[#5E4D43]"}`}>
                {metrics.b2bCount}
              </span>
            </button>
          </div>

          {/* Payment Filter Selector */}
          <div className="flex items-center gap-2">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-[#FAF7F2] border border-[#E8E2D8] text-[#241B16] font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="paid">Đã thanh toán (Paid)</option>
              <option value="pending">Chờ thanh toán / COD / Báo giá</option>
            </select>
          </div>
        </div>

        {/* Search Input Bar (No icon) */}
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn (NET-REQ-xxx, NET-ORD-xxx), tên khách hàng, số điện thoại, địa chỉ giao nhận..."
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B85D43]/30 focus:border-[#B85D43] transition-all placeholder:text-[#A89C93]"
          />
        </div>
      </div>

      {/* 4. Unified Orders Table (Bấm vào từng đơn để xem chi tiết - KHÔNG ICON) */}
      <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F5EF] border-b border-[#E8E2D8] text-[#5E4D43] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Loại & Mã Đơn</th>
                <th className="py-3.5 px-4 min-w-[220px]">Khách Hàng & Giao Nhận</th>
                <th className="py-3.5 px-4 min-w-[240px]">Chi Tiết Bản Phối / Sản Phẩm</th>
                <th className="py-3.5 px-4">Giá Trị Đơn</th>
                <th className="py-3.5 px-4">Tiến Độ Xử Lý</th>
                <th className="py-3.5 px-4">Thanh Toán</th>
                <th className="py-3.5 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {filteredRows.map((row) => {
                return (
                  <tr
                    key={row.uniqueKey}
                    onClick={() => handleOpenOrderDetails(row)}
                    title="Bấm để mở chi tiết đơn hàng này"
                    className="hover:bg-[#FAF7F2] transition-colors group cursor-pointer"
                  >
                    {/* Loại & Mã Đơn */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="mb-1">
                        {row.type === "custom" && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F5ECE5] text-[#B85D43] border border-[#E4D1C3]">
                            ĐƠN CUSTOM
                          </span>
                        )}
                        {row.type === "standard" && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#EAF3EE] text-[#1E5C46] border border-[#C5DFD2]">
                            ĐƠN CÓ SẴN
                          </span>
                        )}
                        {row.type === "b2b" && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            DOANH NGHIỆP B2B
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-bold text-[#241B16] text-xs group-hover:text-[#B85D43] transition-colors">
                        {row.code}
                      </div>

                      <div className="text-[10px] text-[#8F8177] mt-0.5">
                        {new Date(row.createdAt).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </td>

                    {/* Khách hàng & Giao nhận: Đảm bảo Họ tên, Ngày sinh, SĐT, Địa chỉ hiển thị đầy đủ, không tràn viền */}
                    <td className="py-3.5 px-4 align-top max-w-[240px]">
                      <div className="font-semibold text-[#241B16] break-words group-hover:text-[#B85D43] transition-colors">
                        {row.customerName}
                      </div>
                      <div className="text-[11px] text-[#5E4D43] mt-0.5">
                        <span className="text-[#8F8177]">Ngày sinh: </span>
                        <span className="font-medium text-[#241B16]">{row.customerDob || "Chưa cập nhật"}</span>
                      </div>
                      <div className="text-[11px] text-[#5E4D43]">
                        <span className="text-[#8F8177]">SĐT: </span>
                        <span className="font-mono font-medium text-[#241B16]">{row.customerPhone}</span>
                      </div>
                      <div className="text-[11px] text-[#5E4D43] break-words mt-0.5 leading-snug">
                        <span className="text-[#8F8177]">Địa chỉ: </span>
                        <span>{row.customerAddress || row.customerCity || "Chưa cập nhật"}</span>
                      </div>
                      {row.partnerCode && (
                        <div className="mt-1 inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono">
                          Đối tác: {row.partnerCode}
                        </div>
                      )}
                    </td>

                    {/* Chi Tiết Sản Phẩm / Bản Phối (Chỉ thông tin sản phẩm & charm, KHÔNG để địa chỉ ở đây) */}
                    <td className="py-3.5 px-4 align-top max-w-[260px]">
                      <div className="font-medium text-[#241B16] break-words">
                        {row.summary}
                      </div>
                      {row.subSummary && (
                        <div className="text-[11px] text-[#7A6F68] break-words mt-0.5 italic">
                          {row.subSummary}
                        </div>
                      )}
                      <div className="text-[10px] text-teal-800 font-medium mt-1">
                        Bù đắp ~{row.plasticOffsetKg.toFixed(1)}kg lưới ma
                      </div>
                      {row.inventoryDeducted && (
                        <div className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Đã trừ kho phôi & charm
                        </div>
                      )}
                    </td>

                    {/* Giá trị đơn */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="font-bold text-[#241B16]">
                        {row.priceDisplay}
                      </div>
                      {row.type === "custom" && row.rawStudioReq?.hasCustomCharm && !row.rawStudioReq?.customCharmPrice && (
                        <span className="text-[10px] text-[#B85D43] font-medium block">
                          (Cần nhập giá charm)
                        </span>
                      )}
                    </td>

                    {/* Tiến độ xử lý */}
                    <td className="py-3.5 px-4 align-top">
                      {renderRowStatusBadge(row)}

                      {/* Sub-badge for customer feedback */}
                      {row.type === "custom" && row.rawStudioReq?.status === "approved" && (
                        <div className="text-[9px] text-emerald-800 font-semibold mt-1">
                          Khách duyệt v#{row.rawStudioReq.approvedVersion || 1}
                        </div>
                      )}

                      {row.type === "custom" && row.rawStudioReq?.status === "revision_requested" && (
                        <div className="text-[9px] text-rose-700 font-semibold mt-1">
                          Có phản hồi sửa
                        </div>
                      )}

                      {row.type === "standard" && row.customerReceivedConfirmed && (
                        <div className="text-[9px] text-emerald-800 font-semibold mt-1">
                          Khách đã nhận túi
                        </div>
                      )}
                    </td>

                    {/* Thanh toán */}
                    <td className="py-3.5 px-4 align-top">
                      {row.type !== "standard" ? (
                        <span className="text-[11px] text-[#5E4D43] font-medium">
                          {row.paymentLabel}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (row.rawShopOrder) {
                              onTogglePaymentStatus(
                                row.rawShopOrder.orderId,
                                row.rawShopOrder.paymentStatus
                              );
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            row.isPaid
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                          }`}
                          title="Bấm để chuyển đổi trạng thái thanh toán"
                        >
                          {row.isPaid ? "Đã Thanh Toán" : "Thu Tiền COD"}
                        </button>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right align-top whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrderDetails(row);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E8E2D8] font-semibold text-[11px] text-[#241B16] transition-colors cursor-pointer"
                        >
                          Chi Tiết
                        </button>
                        {row.type === "custom" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStudioReq(row.code);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200 transition-colors cursor-pointer"
                            title="Xoá yêu cầu này"
                          >
                            Xoá
                          </button>
                        )}
                        {row.type === "standard" && row.rawShopOrder && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Xác nhận xóa đơn hàng #${row.code}?`)) {
                                onDeleteOrder(row.rawShopOrder!.orderId);
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200 transition-colors cursor-pointer"
                            title="Xoá đơn hàng này"
                          >
                            Xoá
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8F8177]">
                    <div className="font-serif text-base text-[#241B16]">
                      Không có đơn hàng nào trong danh mục này
                    </div>
                    <p className="text-xs text-[#8F8177] mt-1">
                      Các đơn hàng thực từ khách hàng khi gửi yêu cầu Studio hoặc đặt hàng sẽ xuất hiện ngay tại đây.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 5. DRAWER / MODAL: CHI TIẾT & DUYỆT ĐƠN CUSTOM (STUDIO)       */}
      {/* ============================================================= */}
      {selectedStudioReq && (
        <div className="fixed inset-0 z-50 bg-[#241B16]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E2D8] max-h-[92vh] overflow-y-auto animate-scaleUp text-[#241B16]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#F5ECE5] text-[#B85D43] border border-[#E4D1C3]">
                    ĐƠN CUSTOM STUDIO
                  </span>
                  <span className="font-mono text-xs font-bold text-[#8F8177]">
                    #{selectedStudioReq.id}
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#241B16] mt-1">
                  Chi Tiết Phối Túi, Tải Concept & Báo Giá
                </h2>
              </div>
              <button
                onClick={() => setSelectedStudioReq(null)}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E8E2D8] text-xs font-semibold text-[#5E4D43] transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Status Change Dropdown & Strict Completion Rule */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#5E4D43]">Trạng thái đơn:</span>
                <select
                  value={selectedStudioReq.status}
                  onChange={(e) => handleUpdateStudioStatus(e.target.value as RequestStatus)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] font-bold text-[#241B16] focus:ring-2 focus:ring-[#B85D43]/30 cursor-pointer"
                >
                  <option value="pending_review">1. Chờ tiếp nhận (Đơn đang chờ xác nhận)</option>
                  <option value="concept_sent">2. Đã gửi concept & báo giá (Chờ khách duyệt)</option>
                  <option value="approved">3. Khách đã duyệt thiết kế (Tự động trừ kho)</option>
                  <option value="revision_requested">4. Yêu cầu chỉnh sửa concept</option>
                  <option value="in_production">5. Đang đúc charm & may túi (Đang chế tác)</option>
                  <option value="shipping">6. Đang giao hàng</option>
                  <option value="completed" disabled>
                    7. Đã hoàn thành (Chỉ tự động khi khách hàng xác nhận nhận túi)
                  </option>
                  <option value="cancelled">8. Đã huỷ đơn</option>
                </select>
              </div>

              <div className="text-[11px] text-[#8F8177]">
                Tạo lúc: {selectedStudioReq.createdAt}
              </div>
            </div>

            {/* Quy định hoàn thành 2 chiều */}
            {selectedStudioReq.status === "completed" ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs">
                <strong>Đơn hàng đã hoàn thành:</strong> Khách hàng đã bấm xác nhận "Tôi đã nhận được túi" thành công!
              </div>
            ) : (
              <div className="text-[11px] text-[#8F8177] italic bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#E8E2D8]">
                Lưu ý quy định: Admin không được tự ý ấn "Đã giao thành công" / "Đã hoàn thành". Đơn hàng chỉ tự động hoàn thành khi khách hàng xác nhận nhận túi trên trang Tra cứu hành trình / Story Passport.
              </div>
            )}

            {/* Customer Response Monitoring Alerts */}
            {selectedStudioReq.status === "approved" && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <strong>Khách hàng đã duyệt phiên bản Concept #{selectedStudioReq.approvedVersion || 1}!</strong>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Xác nhận vào: {selectedStudioReq.approvedAt || "Gần đây"}. Xưởng may có thể xuất kiện lưới và tiến hành đúc charm hoàn thiện.
                </p>
                {selectedStudioReq.customerFeedback && (
                  <div className="mt-1 text-[11px] italic bg-white/60 p-2 rounded-lg border border-emerald-200 text-emerald-950">
                    Lời nhắn từ khách: "{selectedStudioReq.customerFeedback}"
                  </div>
                )}
              </div>
            )}

            {selectedStudioReq.status === "revision_requested" && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                <strong>Khách yêu cầu chỉnh sửa concept:</strong>
                <p className="text-rose-800 font-medium italic text-[11px] mt-0.5">
                  "{selectedStudioReq.customerFeedback || "Cần điều chỉnh thêm theo ý kiến khách"}"
                </p>
                <p className="text-[11px] text-rose-700 mt-1">
                  Vui lòng điều chỉnh ảnh phác thảo / báo giá bên dưới và bấm "Lưu & Gửi Concept Báo Giá Đến Khách" lại.
                </p>
              </div>
            )}

            {/* Inventory Deduction Card (Trừ túi phôi & charm) */}
            <div className="p-4 rounded-2xl bg-[#F6F9F8] border border-[#C5DFD2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-[#1E5C46] flex items-center gap-2">
                  <span>Kho Nguyên Vật Liệu:</span>
                  {selectedStudioReq.inventoryDeducted ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold text-[10px]">
                      Đã Trừ Kho Thành Công
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-[10px]">
                      Chưa Trừ Kho (Sẽ tự động trừ khi phê duyệt/chế tác)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#241B16] mt-1">
                  {selectedStudioReq.inventoryDeductedLog || `Cần trừ: 1 túi phôi [${selectedStudioReq.bagName}] và ${selectedStudioReq.placedCharms.length} charm đã gắn.`}
                </div>
                {selectedStudioReq.inventoryDeductedAt && (
                  <div className="text-[10px] text-[#8F8177] mt-0.5">
                    Thời điểm trừ: {new Date(selectedStudioReq.inventoryDeductedAt).toLocaleString("vi-VN")}
                  </div>
                )}
              </div>

              {!selectedStudioReq.inventoryDeducted && (
                <button
                  onClick={handleManualDeductInventory}
                  className="px-3.5 py-2 rounded-xl bg-[#1E5C46] hover:bg-[#164736] text-white font-medium text-xs whitespace-nowrap cursor-pointer transition-colors"
                >
                  Xuất Kho Phôi & Charm Ngay
                </button>
              )}
            </div>

            {/* Dedicated Customer Information Card (Không tràn viền, đầy đủ 4 trường) */}
            <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
              <h3 className="font-serif text-base font-normal text-[#241B16]">
                Hồ Sơ Khách Hàng & Giao Nhận
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Họ và tên</span>
                  <div className="font-bold text-[#241B16] text-sm break-words mt-0.5">
                    {selectedStudioReq.customerName}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Ngày sinh</span>
                  <div className="font-semibold text-[#241B16] text-sm mt-0.5">
                    {selectedStudioReq.customerDob || "Chưa cập nhật"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Số điện thoại / Liên hệ</span>
                  <div className="font-mono font-bold text-[#241B16] text-sm mt-0.5">
                    {selectedStudioReq.customerPhone || selectedStudioReq.contact}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Phương thức nhận hàng</span>
                  <div className="font-semibold text-[#241B16] text-sm mt-0.5">
                    {selectedStudioReq.deliveryMethodLabel || "Giao tận nơi"}
                  </div>
                </div>

                <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Địa chỉ giao nhận chi tiết</span>
                  <div className="font-medium text-[#241B16] break-words mt-0.5 leading-relaxed">
                    {selectedStudioReq.customerAddress || selectedStudioReq.deliveryMethodLabel || "Chưa cập nhật"}
                  </div>
                </div>

                {selectedStudioReq.partnerCode && (
                  <div className="sm:col-span-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                    <strong>Đơn qua đối tác liên kết: </strong>
                    <span className="font-mono font-bold">{selectedStudioReq.partnerCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2D Canvas & Placed Charms Preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8]">
              {/* Bag Preview */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-[#E8E2D8]">
                <div className="w-[180px] sm:w-[200px]">
                  <NetBag2DCanvas
                    placedCharms={selectedStudioReq.placedCharms}
                    onUpdateCharmPosition={() => {}}
                    onRemoveCharm={() => {}}
                  />
                </div>
                <div className="text-center mt-2">
                  <span className="font-serif text-sm font-medium text-[#241B16]">
                    {selectedStudioReq.bagName}
                  </span>
                  <div className="text-[10px] text-[#8F8177]">
                    Màu: {selectedStudioReq.bagColor?.name || "Xanh Lưới Ngư Dân"}
                  </div>
                </div>
              </div>

              {/* Specification Details */}
              <div className="md:col-span-7 space-y-3 text-xs">
                {/* Pre-made Charms list */}
                <div className="p-3.5 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-xs font-semibold text-[#241B16] block mb-1.5">
                    Charm đã gắn trên bản phối ({selectedStudioReq.placedCharms.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudioReq.placedCharms.map((c) => (
                      <span
                        key={c.instanceId}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] text-[#241B16] text-[11px] font-medium"
                      >
                        {c.charm.symbol} {c.charm.vietnameseName}
                      </span>
                    ))}
                    {selectedStudioReq.placedCharms.length === 0 && (
                      <span className="text-[11px] text-[#8F8177] italic">Chưa gắn charm sẵn nào</span>
                    )}
                  </div>
                </div>

                {/* Custom Charm Spec (If Tab 3 was used) */}
                {selectedStudioReq.hasCustomCharm && selectedStudioReq.customCharm && (
                  <div className="p-4 rounded-2xl bg-[#FCF9F6] border border-[#E4D1C3] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[#B85D43] font-semibold text-xs">
                        Yêu Cầu Chế Tác Charm Riêng (Gemini AI):
                      </div>
                      {selectedStudioReq.customCharm.motifName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B85D43]/10 text-[#B85D43] border border-[#B85D43]/30 font-medium">
                          {selectedStudioReq.customCharm.motifName}
                        </span>
                      )}
                    </div>

                    <p className="text-[#241B16] italic text-xs bg-white p-2.5 rounded-xl border border-[#E8E2D8]">
                      "{selectedStudioReq.customCharm.idea}"
                    </p>

                    {selectedStudioReq.customCharm.story && (
                      <p className="text-[11px] text-[#5E4D43] bg-white/70 p-2 rounded-xl border border-[#E8E2D8]/60">
                        {selectedStudioReq.customCharm.story}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-[#5E4D43]">
                      <div>Hình dáng: <strong>{selectedStudioReq.customCharm.shape}</strong></div>
                      <div>Khắc laser: <strong>{selectedStudioReq.customCharm.engravedText || "Không"}</strong></div>
                      <div>Kích cỡ: <strong>{selectedStudioReq.customCharm.size}</strong></div>
                      {selectedStudioReq.customCharm.pinSpecs && (
                        <div className="col-span-2 text-[#B85D43]">
                          Ngàm chốt: <strong>Ø{selectedStudioReq.customCharm.pinSpecs.diameterMm}mm × {selectedStudioReq.customCharm.pinSpecs.heightMm}mm ({selectedStudioReq.customCharm.pinSpecs.type})</strong>
                        </div>
                      )}
                    </div>

                    {/* AI SVG Graphic & 3D STL Download */}
                    {selectedStudioReq.customCharm.svgCode && (
                      <div className="pt-2 border-t border-[#E4D1C3]">
                        <span className="text-[11px] font-medium text-[#241B16] block mb-1.5">
                          Bản vẽ Vector 2D & File In 3D:
                        </span>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-16 h-16 bg-white rounded-xl p-1.5 shadow-sm flex items-center justify-center border border-[#E8E2D8] shrink-0"
                            dangerouslySetInnerHTML={{ __html: sanitizeSvg(selectedStudioReq.customCharm.svgCode) }}
                          />
                          <div className="space-y-1.5 flex-1">
                            <p className="text-[10px] text-[#5E4D43] leading-tight">
                              Đã tích hợp sẵn ngàm chốt cài bấm mặt sau chuẩn mắt lưới túi Nét (Ø4.5mm).
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  if (selectedStudioReq.customCharm?.stlData) {
                                    triggerSTLDownload(
                                      selectedStudioReq.customCharm.stlData,
                                      `charm-${selectedStudioReq.customCharm.motifName || selectedStudioReq.id}.stl`
                                    );
                                  } else if (selectedStudioReq.customCharm?.svgCode) {
                                    const stl = generateCharmSTLFromSVG(selectedStudioReq.customCharm.svgCode);
                                    triggerSTLDownload(
                                      stl.stlString,
                                      `charm-${selectedStudioReq.customCharm.motifName || selectedStudioReq.id}.stl`
                                    );
                                  }
                                } catch (err) {
                                  alert("Lỗi xuất file STL: " + (err instanceof Error ? err.message : String(err)));
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D5A27] hover:bg-[#23471F] text-white text-[11px] font-bold shadow-sm transition-colors"
                            >
                              <span>📥 Tải file in 3D (.STL)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedStudioReq.customCharm.referenceImageUrl && (
                      <div className="pt-2">
                        <span className="text-[10px] text-[#8F8177] block mb-1">Ảnh khách tải lên:</span>
                        <img
                          src={selectedStudioReq.customCharm.referenceImageUrl}
                          alt="Ảnh khách gửi"
                          className="w-20 h-20 object-cover rounded-xl border border-[#E8E2D8]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Section 1: Concept Mockup & Quotation Form */}
            <div className="p-5 rounded-3xl bg-white border border-[#E8E2D8] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-normal text-[#241B16]">
                  Tải Concept Phác Thảo & Báo Giá Đến Khách
                </h3>
                {selectedStudioReq.conceptVersion && (
                  <span className="text-[11px] font-mono text-[#8F8177] bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-[#E8E2D8]">
                    Phiên bản hiện tại: #{selectedStudioReq.conceptVersion}
                  </span>
                )}
              </div>

              <form onSubmit={handleSendConceptAndQuote} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#5E4D43] font-medium mb-1">
                      Báo giá charm riêng (VNĐ):
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white text-[#241B16] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5E4D43] font-medium mb-1">
                      URL Ảnh Concept phác thảo xưởng:
                    </label>
                    <input
                      type="text"
                      value={conceptUrl}
                      onChange={(e) => setConceptUrl(e.target.value)}
                      placeholder="/assets/products/... hoặc link ảnh"
                      className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white text-[#241B16]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#5E4D43] font-medium mb-1">
                    Thuyết minh concept & lời nhắn từ nghệ nhân:
                  </label>
                  <textarea
                    rows={2}
                    value={conceptMessage}
                    onChange={(e) => setConceptMessage(e.target.value)}
                    placeholder="Xưởng Nét đã dựng phác thảo charm vỏ sò đồng nung men đất theo yêu cầu..."
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white text-[#241B16]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white font-medium text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Lưu & Gửi Concept Báo Giá Đến Khách
                  </button>
                </div>
              </form>
            </div>

            {/* Action Section 2: Logistics & Passport */}
            <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-4">
              <h3 className="font-serif text-base font-normal text-[#241B16]">
                Cập Nhật Vận Đơn & Hành Trình
              </h3>

              <form onSubmit={handleAddStudioShipmentEvent} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#5E4D43] font-medium mb-1">
                      Đơn vị vận chuyển:
                    </label>
                    <input
                      type="text"
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#241B16]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5E4D43] font-medium mb-1">
                      Mã vận đơn bưu cục:
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="GHTK88219482..."
                      className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#241B16] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#5E4D43] font-medium mb-1">
                    Mô tả sự kiện hành trình mới:
                  </label>
                  <input
                    type="text"
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    placeholder="Kiện hàng đã xuất xưởng Nét Đà Nẵng, bàn giao bưu tá..."
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#241B16]"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#241B16] hover:bg-[#352720] text-white font-medium text-xs transition-all cursor-pointer"
                  >
                    Thêm Sự Kiện Vận Chuyển
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 6. DRAWER / MODAL: CHI TIẾT ĐƠN HÀNG CÓ SẴN (SHOP ORDER)       */}
      {/* ============================================================= */}
      {selectedShopOrder && (
        <div className="fixed inset-0 z-50 bg-[#241B16]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E2D8] max-h-[92vh] overflow-y-auto animate-scaleUp text-[#241B16]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#EAF3EE] text-[#1E5C46] border border-[#C5DFD2]">
                  ĐƠN HÀNG CÓ SẴN
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#241B16] mt-1">
                  Đơn Hàng: #{selectedShopOrder.orderCode}
                </h3>
              </div>
              <button
                onClick={() => setSelectedShopOrder(null)}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E8E2D8] text-xs font-semibold text-[#5E4D43] transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Dedicated Customer Info Card: Đầy đủ 4 trường không tràn viền */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
              <h4 className="font-serif text-sm font-normal text-[#241B16] uppercase tracking-wider text-[11px]">
                Thông Tin Khách Hàng & Giao Hàng
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Họ và tên</span>
                  <div className="font-bold text-[#241B16] text-sm break-words mt-0.5">
                    {selectedShopOrder.customer?.fullName || "Khách Vãng Lai"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Ngày sinh</span>
                  <div className="font-semibold text-[#241B16] text-sm mt-0.5">
                    {selectedShopOrder.customer?.dob || "Chưa cập nhật"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Số điện thoại</span>
                  <div className="font-mono font-bold text-[#241B16] text-sm mt-0.5">
                    {selectedShopOrder.customer?.phone || "Chưa có SĐT"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Email</span>
                  <div className="font-medium text-[#241B16] text-sm break-words mt-0.5">
                    {selectedShopOrder.customer?.email || "Chưa có email"}
                  </div>
                </div>

                <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-[#E8E2D8]">
                  <span className="text-[#8F8177] block text-[10px] uppercase font-semibold">Địa chỉ giao nhận</span>
                  <div className="font-medium text-[#241B16] break-words mt-0.5 leading-relaxed">
                    {[selectedShopOrder.customer?.address, selectedShopOrder.customer?.city].filter(Boolean).join(", ") || "Chưa có địa chỉ"}
                  </div>
                </div>

                {selectedShopOrder.customer?.note && (
                  <div className="sm:col-span-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <strong>Ghi chú từ khách: </strong> {selectedShopOrder.customer.note}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-[#241B16] uppercase tracking-wider text-[11px]">
                Sản phẩm trong kiện hàng ({selectedShopOrder.items?.length || 0}):
              </h4>
              <div className="divide-y divide-[#F0EAE1] border border-[#E8E2D8] rounded-2xl overflow-hidden">
                {selectedShopOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-11 h-11 rounded-xl object-cover bg-[#FAF7F2] border border-[#E8E2D8]"
                      />
                      <div>
                        <div className="font-bold text-[#241B16]">{item.title}</div>
                        <div className="text-[11px] text-[#5E4D43]">
                          Số lượng: {item.quantity} • {formatVND(item.price)}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-[#241B16]">
                      {formatVND(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fulfillment Status & Strict 2-Way Completion Constraint */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#241B16]">Tiến độ đơn hàng:</span>
                <select
                  value={selectedShopOrder.fulfillmentStatus}
                  onChange={(e) => {
                    const val = e.target.value as Order["fulfillmentStatus"];
                    if (val === "delivered") {
                      alert("Admin không thể tự ấn 'Đã giao thành công' / 'Đã hoàn thành'. Quy tắc hệ thống quy định: Chỉ khi khách hàng ấn xác nhận 'Tôi đã nhận được túi' trên trang cá nhân hoặc Story Passport thì đơn mới tự động chuyển sang hoàn thành!");
                      return;
                    }
                    onUpdateOrderStatus(selectedShopOrder.orderId, val);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] font-bold text-[#241B16] focus:ring-2 focus:ring-[#B85D43]/30 cursor-pointer"
                >
                  <option value="received">1. Tiếp nhận (Đang chờ xác nhận)</option>
                  <option value="crafting">2. Đang chế tác xưởng</option>
                  <option value="delivering">3. Đang giao hàng</option>
                  <option value="delivered" disabled>
                    4. Đã hoàn thành (Chỉ khách hàng mới được xác nhận)
                  </option>
                  <option value="cancelled">5. Đã huỷ đơn</option>
                </select>
              </div>

              {/* Notice banner */}
              {selectedShopOrder.fulfillmentStatus === "delivered" ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs">
                  <strong>Khách hàng đã xác nhận đã nhận hàng thành công!</strong> Đơn hàng đã hoàn tất.
                </div>
              ) : (
                <div className="text-[11px] text-[#8F8177] italic bg-white p-2.5 rounded-xl border border-[#E8E2D8]">
                  Lưu ý: Admin chỉ chuyển đơn đến trạng thái "Đang giao hàng". Chỉ khi khách hàng ấn "Tôi đã nhận được túi" trên trang cá nhân hoặc Story Passport, đơn mới chuyển sang "Đã hoàn thành".
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5E4D43] pt-2 border-t border-[#E8E2D8]">
                <div>
                  <span className="text-[#8F8177]">Lô lưới may: </span>
                  <strong className="font-mono text-[#241B16]">
                    {selectedShopOrder.assignedBatchId || "PACK-DN-2024-082"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#8F8177]">Mã Serial túi: </span>
                  <strong className="font-mono text-teal-800">
                    {selectedShopOrder.assignedBagSerialId || "Đang cấp tự động"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F0EAE1]">
              <span className="font-semibold text-[#5E4D43]">Tổng tiền thanh toán:</span>
              <span className="font-serif text-2xl text-[#B85D43] font-normal">
                {formatVND(selectedShopOrder.total)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] hover:bg-[#F3ECE1] font-semibold text-xs text-[#241B16] cursor-pointer"
              >
                In Phiếu Xuất Xưởng
              </button>
              <button
                onClick={() => setSelectedShopOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-[#241B16] hover:bg-[#352720] text-white font-medium text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 6.B DRAWER / MODAL: CHI TIẾT ĐƠN DOANH NGHIỆP B2B             */}
      {/* ============================================================= */}
      {selectedB2BOrder && (
        <div className="fixed inset-0 z-50 bg-[#241B16]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E2D8] max-h-[92vh] overflow-y-auto animate-scaleUp text-[#241B16]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  HỒ SƠ ĐƠN HÀNG DOANH NGHIỆP B2B
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#241B16] mt-1">
                  Đơn Hàng: {selectedB2BOrder.code}
                </h3>
              </div>
              <button
                onClick={() => setSelectedB2BOrder(null)}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E8E2D8] text-xs font-semibold text-[#5E4D43] transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Corporate Info */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2 text-xs">
              <div className="font-bold text-[#241B16]">
                Doanh nghiệp: {selectedB2BOrder.b2bData?.companyName || selectedB2BOrder.customerName}
              </div>
              <div className="text-[#5E4D43]">
                Người đại diện: {selectedB2BOrder.b2bData?.representative || selectedB2BOrder.customerName}
              </div>
              <div className="text-[#5E4D43]">
                Điện thoại / Hotline: {selectedB2BOrder.customerPhone}
              </div>
              <div className="text-[#5E4D43] break-words">
                Địa chỉ: {selectedB2BOrder.customerAddress || selectedB2BOrder.customerCity || "Chưa cập nhật"}
              </div>
              {selectedB2BOrder.partnerCode && (
                <div className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono mt-1">
                  Mã đối tác: {selectedB2BOrder.partnerCode}
                </div>
              )}
            </div>

            {/* Package details */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] space-y-2 text-xs">
              <div className="font-semibold text-[#241B16]">Gói quà tặng doanh nghiệp:</div>
              <p className="text-[#5E4D43] leading-relaxed">
                {selectedB2BOrder.summary}
              </p>
              {selectedB2BOrder.subSummary && (
                <p className="text-[11px] text-[#8F8177] italic">
                  {selectedB2BOrder.subSummary}
                </p>
              )}
              <div className="text-teal-800 font-semibold text-[11px] pt-1 border-t border-[#F0EAE1]">
                Tác động môi trường ESG: Đã bảo tồn và thu hồi ~{selectedB2BOrder.plasticOffsetKg}kg lưới ma đại dương
              </div>
            </div>

            {/* Status & Price */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs">
              <div>
                <span className="text-[#8F8177] block text-[10px]">Trạng thái:</span>
                <strong className="text-[#241B16]">{selectedB2BOrder.statusLabel}</strong>
              </div>
              <div className="text-right">
                <span className="text-[#8F8177] block text-[10px]">Tổng giá trị hợp đồng:</span>
                <strong className="font-serif text-xl text-[#B85D43] font-normal">{selectedB2BOrder.priceDisplay}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] hover:bg-[#F3ECE1] font-semibold text-xs text-[#241B16] cursor-pointer"
              >
                In Hợp Đồng / Phiếu Xuất
              </button>
              <button
                onClick={() => setSelectedB2BOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-[#241B16] hover:bg-[#352720] text-white font-medium text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 7. MODAL: TẠO ĐƠN HÀNG TẠI XƯỞNG (POS ORDER - NO ICONS)        */}
      {/* ============================================================= */}
      {showCreatePOSModal && (
        <div className="fixed inset-0 z-50 bg-[#241B16]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-[#E8E2D8] animate-scaleUp text-[#241B16]">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#F5ECE5] text-[#B85D43] border border-[#E4D1C3]">
                  QUẦY XƯỞNG POS
                </span>
                <h3 className="font-serif text-xl font-normal text-[#241B16] mt-1">
                  Tạo Đơn Hàng Mua Trực Tiếp
                </h3>
              </div>
              <button
                onClick={() => setShowCreatePOSModal(false)}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] text-xs font-semibold text-[#5E4D43] cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveManualOrder} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block text-[#5E4D43] font-medium">Họ và tên khách hàng *</label>
                <input
                  type="text"
                  required
                  value={manualCustomer.fullName}
                  onChange={(e) => setManualCustomer({ ...manualCustomer, fullName: e.target.value })}
                  placeholder="Ví dụ: Lê Bảo Anh"
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white text-[#241B16]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#5E4D43] font-medium">Ngày sinh (DOB)</label>
                  <input
                    type="date"
                    value={manualCustomer.dob}
                    onChange={(e) => setManualCustomer({ ...manualCustomer, dob: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white text-[#241B16]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[#5E4D43] font-medium">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={manualCustomer.phone}
                    onChange={(e) => setManualCustomer({ ...manualCustomer, phone: e.target.value })}
                    placeholder="0905 xxx xxx"
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white text-[#241B16]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[#5E4D43] font-medium">Địa chỉ giao nhận</label>
                <input
                  type="text"
                  value={manualCustomer.address}
                  onChange={(e) => setManualCustomer({ ...manualCustomer, address: e.target.value })}
                  placeholder="Địa chỉ giao hoặc nhận tại xưởng NÉT"
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white text-[#241B16]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#5E4D43] font-medium">Sản phẩm mẫu có sẵn</label>
                  <select
                    value={manualProductSku}
                    onChange={(e) => setManualProductSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white text-[#241B16] font-medium"
                  >
                    {backendProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatVND(p.basePrice || p.price || 1250000)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[#5E4D43] font-medium">Số lượng</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={manualQty}
                    onChange={(e) => setManualQty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] focus:bg-white text-[#241B16] font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[#5E4D43] font-medium">Phương thức thanh toán</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="posPay"
                      checked={manualPaymentMethod === "bank_transfer"}
                      onChange={() => setManualPaymentMethod("bank_transfer")}
                      className="accent-[#B85D43]"
                    />
                    <span>Chuyển khoản VietQR (Đã nhận tiền)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="posPay"
                      checked={manualPaymentMethod === "cod"}
                      onChange={() => setManualPaymentMethod("cod")}
                      className="accent-[#B85D43]"
                    />
                    <span>Tiền mặt / COD</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0EAE1]">
                <button
                  type="button"
                  onClick={() => setShowCreatePOSModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-[#5E4D43]"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  Xác Nhận Tạo Đơn POS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
