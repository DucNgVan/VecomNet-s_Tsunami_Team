"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  NetPack,
  ManufacturedBagItem,
  Order,
} from "@/types";
import { BAG_BASES, BAG_COLORS } from "@/data/products";
import {
  getAllNetPacks,
  saveNetPack,
  getManufacturedItems,
  manufactureBags,
  createNetPackWithBatchPlan,
  getAllOrders,
  updateOrderStatus,
  assignBagToOrder,
  getSupplyChainStats,
  exportInventoryToCSV,
  deleteOrderById,
} from "@/lib/supplyChainStorage";
import { syncAllInventoryToFirestore } from "@/lib/firestoreService";
import { formatVND, formatKg } from "@/lib/utils";
import {
  BarChart3,
  Anchor,
  Hammer,
  Boxes,
  Package,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  QrCode,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MapPin,
  Layers,
  Sparkles,
  Lock,
  KeyRound,
  ExternalLink,
  Printer,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Tag,
  Factory,
  Barcode,
  Cpu,
  UserCheck,
  Award,
  Download,
  CloudUpload,
  RefreshCw,
  FileSpreadsheet,
  Database,
  ShoppingBag,
  Edit,
  Trash2,
  Box,
  Image as ImageIcon,
} from "lucide-react";
import { uploadProductFile } from "@/lib/storageService";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";

function AdminDashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab State: analytics | products | net-packs | manufacturing | inventory | orders
  const activeTabParam = searchParams.get("tab") || "analytics";
  const [activeTab, setActiveTab] = useState<
    "analytics" | "products" | "net-packs" | "manufacturing" | "inventory" | "orders"
  >(
    ["analytics", "products", "net-packs", "manufacturing", "inventory", "orders"].includes(activeTabParam)
      ? (activeTabParam as any)
      : "analytics"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      ["analytics", "products", "net-packs", "manufacturing", "inventory", "orders"].includes(tab)
    ) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Auth Guard
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuthed = localStorage.getItem("net_admin_authenticated") === "true";
      setIsAdminAuthenticated(isAuthed);
    }
  }, []);

  // Shared Data States
  const [netPacks, setNetPacks] = useState<NetPack[]>([]);
  const [manufacturedItems, setManufacturedItems] = useState<ManufacturedBagItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState(() => getSupplyChainStats());

  // Backend Products State (CRUD with Real Stock)
  const [backendProducts, setBackendProducts] = useState<any[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    category: "tote",
    basePrice: 1250000,
    description: "",
    plasticOffsetKg: 1.8,
    imageUrl: "/assets/products/tote-blue.png",
    model3dUrl: "/assets/models/tuixach.glb",
    inStock: true,
    stockCount: 50,
  });

  // Cloud Storage File Upload States (Images & 3D Models)
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [modelUploadProgress, setModelUploadProgress] = useState(0);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setImageUploadProgress(10);
    try {
      const url = await uploadProductFile(file, "images", (pct) => setImageUploadProgress(pct));
      setProductForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err: any) {
      alert("Lỗi tải ảnh: " + (err?.message || "Không thể tải file lên"));
    } finally {
      setIsUploadingImage(false);
      setImageUploadProgress(0);
    }
  };

  const handleModelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".glb") && !file.name.toLowerCase().endsWith(".gltf")) {
      alert("Vui lòng chọn file mô hình 3D (.glb hoặc .gltf)!");
      return;
    }
    setIsUploadingModel(true);
    setModelUploadProgress(10);
    try {
      const url = await uploadProductFile(file, "models", (pct) => setModelUploadProgress(pct));
      setProductForm((prev) => ({ ...prev, model3dUrl: url }));
    } catch (err: any) {
      alert("Lỗi tải file 3D: " + (err?.message || "Không thể tải file lên"));
    } finally {
      setIsUploadingModel(false);
      setModelUploadProgress(0);
    }
  };

  const fetchBackendProducts = async () => {
    try {
      const res = await fetch("/api/products?admin=true");
      if (!res.ok) {
        console.warn("Fetch backend products returned non-OK status:", res.status);
        return;
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBackendProducts(json.data);
      }
    } catch (e) {
      console.warn("Fetch backend products error:", e);
    }
  };

  const fetchBackendOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const local = getAllOrders();
          const merged = [...json.data];
          for (const loc of local) {
            if (!merged.some((m) => m.orderId === loc.orderId)) {
              merged.push(loc);
            }
          }
          setOrders(merged);
          return;
        }
      }
    } catch (e) {
      console.warn("Fetch backend orders error:", e);
    }
    setOrders(getAllOrders());
  };

  // Function to refresh all data
  const reloadData = () => {
    const p = getAllNetPacks();
    const m = getManufacturedItems();
    const s = getSupplyChainStats();
    setNetPacks(p);
    setManufacturedItems(m);
    setStats(s);
    fetchBackendProducts();
    fetchBackendOrders();
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Cloud Firestore Sync State
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSyncFirestore = async () => {
    setIsSyncingFirestore(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllInventoryToFirestore();
      setSyncFeedback(res);
      reloadData();
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      setSyncFeedback({
        success: false,
        message: `Đồng bộ thất bại: ${err?.message || "Lỗi kết nối Firebase"}`,
      });
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isExisting = backendProducts.some((p) => p.id === productForm.id);
      const url = isExisting ? `/api/products/${productForm.id}` : "/api/products";
      const method = isExisting ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          isExisting
            ? "Đã cập nhật thông tin sản phẩm và số lượng tồn kho thành công!"
            : "Đã thêm mẫu sản phẩm mới vào Database thành công!"
        );
        setShowAddProductModal(false);
        fetchBackendProducts();
      } else {
        alert(data.error || "Lỗi lưu sản phẩm");
      }
    } catch (err: any) {
      alert("Lỗi kết nối máy chủ: " + err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mẫu sản phẩm này khỏi Backend Database?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchBackendProducts();
      }
    } catch (err) {
      console.warn("Delete product error:", err);
    }
  };

  // Switch tab helper
  const handleSwitchTab = (
    tab: "analytics" | "products" | "net-packs" | "manufacturing" | "inventory" | "orders"
  ) => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`);
  };

  // ---------------------------------------------------------------------------
  // TAB 2: NET PACKS STATE & COMPREHENSIVE BATCH PLAN
  // ---------------------------------------------------------------------------
  const [showAddPackModal, setShowAddPackModal] = useState(false);
  const [newPackForm, setNewPackForm] = useState({
    packId: `PACK-DN-2024-0${Math.floor(Math.random() * 80 + 20)}`,
    seaRegion: "Rạn San Hô Bán Đảo Sơn Trà, Đà Nẵng",
    locationDetails: "Khu vực Bãi Bụt - Hòn Sụp, rạn san hô tầng 2",
    lat: 16.1124,
    lng: 108.2619,
    depthMeters: 22,
    recoveryDate: new Date().toISOString().split("T")[0],
    totalWeightKg: 50,
    diverTeam: "Danang SAS Volunteer Divers",
    netPolymer: "Nylon-6 (Polyamide)",
    notes: "Lưới rê đánh bắt mực quấn chặt bãi san hô sừng",
    // Factory Planning
    bagBaseId: BAG_BASES[0].id,
    colorId: BAG_COLORS[0].id,
    planQuantity: 15,
    workshopName: "Làng nghề đan lưới Nam Ô",
  });

  const selectedBasePlan = BAG_BASES.find((b) => b.id === newPackForm.bagBaseId) || BAG_BASES[0];
  const planNetNeeded = Number((selectedBasePlan.plasticOffsetKg * newPackForm.planQuantity).toFixed(2));
  const planRemainingKg = Number((newPackForm.totalWeightKg - planNetNeeded).toFixed(2));

  // Determine predicted serial & barcode ranges
  const predictedPackNumber = newPackForm.packId.match(/\d+$/)?.[0] || "01";
  let predictedRegion = "VN";
  if (newPackForm.seaRegion.includes("Sơn Trà")) predictedRegion = "ST";
  else if (newPackForm.seaRegion.includes("Nam Ô")) predictedRegion = "NO";
  else if (newPackForm.seaRegion.includes("Cù Lao Chàm")) predictedRegion = "CLC";
  else if (newPackForm.seaRegion.includes("Côn Đảo")) predictedRegion = "CD";

  const predictedSerialRange = `NET-${predictedRegion}-${predictedPackNumber}-001 ➔ NET-${predictedRegion}-${predictedPackNumber}-${String(
    newPackForm.planQuantity
  ).padStart(3, "0")}`;
  const predictedBarcodeRange = `893882${predictedPackNumber}001 ➔ 893882${predictedPackNumber}${String(
    newPackForm.planQuantity
  ).padStart(3, "0")}`;

  const handleCreateNetPack = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPackForm.totalWeightKg < planNetNeeded) {
      alert(`Khối lượng kiện lưới (${newPackForm.totalWeightKg}kg) không đủ để sản xuất ${newPackForm.planQuantity} túi (cần ${planNetNeeded}kg)!`);
      return;
    }

    const res = createNetPackWithBatchPlan({
      packId: newPackForm.packId.trim().toUpperCase(),
      seaRegion: newPackForm.seaRegion.trim(),
      locationDetails: newPackForm.locationDetails.trim(),
      coordinates: { lat: Number(newPackForm.lat), lng: Number(newPackForm.lng) },
      recoveryDate: newPackForm.recoveryDate,
      totalWeightKg: Number(newPackForm.totalWeightKg),
      depthMeters: Number(newPackForm.depthMeters),
      diverTeam: newPackForm.diverTeam.trim(),
      netPolymer: newPackForm.netPolymer.trim(),
      notes: newPackForm.notes.trim(),
      bagBaseId: newPackForm.bagBaseId,
      colorId: newPackForm.colorId,
      quantity: Number(newPackForm.planQuantity),
      workshopName: newPackForm.workshopName,
    });

    if (res.success) {
      reloadData();
      setShowAddPackModal(false);
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 3: MANUFACTURING STATE
  // ---------------------------------------------------------------------------
  const [selectedPackForMfg, setSelectedPackForMfg] = useState<string>("");
  const [selectedBagBaseId, setSelectedBagBaseId] = useState<string>(BAG_BASES[0].id);
  const [selectedColorId, setSelectedColorId] = useState<string>(BAG_COLORS[0].id);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>("Làng nghề đan lưới Nam Ô");
  const [mfgQuantity, setMfgQuantity] = useState<number>(5);
  const [mfgResultBatch, setMfgResultBatch] = useState<ManufacturedBagItem[]>([]);
  const [mfgSuccessMsg, setMfgSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (netPacks.length > 0 && !selectedPackForMfg) {
      const available = netPacks.find((p) => p.remainingWeightKg > 0);
      if (available) setSelectedPackForMfg(available.packId);
    }
  }, [netPacks, selectedPackForMfg]);

  const activePack = useMemo(
    () => netPacks.find((p) => p.packId === selectedPackForMfg),
    [netPacks, selectedPackForMfg]
  );
  const activeBagBase = useMemo(
    () => BAG_BASES.find((b) => b.id === selectedBagBaseId) || BAG_BASES[0],
    [selectedBagBaseId]
  );
  const activeColor = useMemo(
    () => BAG_COLORS.find((c) => c.id === selectedColorId) || BAG_COLORS[0],
    [selectedColorId]
  );

  const neededKg = Number((activeBagBase.plasticOffsetKg * mfgQuantity).toFixed(2));
  const isEnoughNet = activePack ? activePack.remainingWeightKg >= neededKg : false;

  const handleStartManufacture = () => {
    if (!selectedPackForMfg) {
      alert("Vui lòng chọn Kiện Lưới nguồn!");
      return;
    }
    if (!isEnoughNet) {
      alert("Khối lượng lưới khả dụng trong kiện không đủ!");
      return;
    }

    const res = manufactureBags({
      packId: selectedPackForMfg,
      bagBaseId: selectedBagBaseId,
      colorId: selectedColorId,
      quantity: mfgQuantity,
      workshopName: selectedWorkshop,
    });

    if (res.success) {
      setMfgSuccessMsg(res.message);
      setMfgResultBatch(res.newItems);
      reloadData();
    } else {
      alert(res.message);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 4: INVENTORY & BARCODE / NFC MODAL
  // ---------------------------------------------------------------------------
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryFilterStatus, setInventoryFilterStatus] = useState<"all" | "in_stock" | "assigned_to_order">("all");
  const [selectedItemForPassport, setSelectedItemForPassport] = useState<ManufacturedBagItem | null>(null);

  const filteredInventory = useMemo(() => {
    return manufacturedItems.filter((item) => {
      const matchSearch =
        item.serialId.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.bagName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.sourcePackId.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.seaRegion.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchStatus =
        inventoryFilterStatus === "all" || item.status === inventoryFilterStatus;
      return matchSearch && matchStatus;
    });
  }, [manufacturedItems, inventorySearch, inventoryFilterStatus]);

  // ---------------------------------------------------------------------------
  // TAB 5: ORDERS MANAGEMENT & ASSIGN MODAL
  // ---------------------------------------------------------------------------
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<Order | null>(null);
  const [selectedSerialToAssign, setSelectedSerialToAssign] = useState<string>("");

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === "all") return orders;
    return orders.filter((o) => o.fulfillmentStatus === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const handleAssignSerialToOrder = () => {
    if (!selectedOrderForAssign || !selectedSerialToAssign) return;
    const res = assignBagToOrder(selectedOrderForAssign.orderId, selectedSerialToAssign);
    if (res.success) {
      alert(res.message);
      setSelectedOrderForAssign(null);
      setSelectedSerialToAssign("");
      reloadData();
    } else {
      alert(res.message);
    }
  };

  const handleUpdateFulfillment = async (orderId: string, status: Order["fulfillmentStatus"]) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentStatus: status }),
      });
    } catch (err) {
      console.warn("Update fulfillment API error:", err);
    }
    updateOrderStatus(orderId, status);
    reloadData();
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đơn hàng này khỏi Database và Xưởng?")) return;
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Delete order API error:", err);
    }
    deleteOrderById(orderId);
    reloadData();
  };

  const handleTogglePaymentStatus = async (order: Order) => {
    const nextStatus = order.paymentStatus === "paid" ? "pending" : "paid";
    try {
      await fetch(`/api/orders/${order.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
    } catch (err) {
      console.warn("Toggle payment status error:", err);
    }
    const updated = getAllOrders().map((o) =>
      o.orderId === order.orderId ? { ...o, paymentStatus: nextStatus as any } : o
    );
    if (typeof window !== "undefined") {
      localStorage.setItem("net_orders_v1", JSON.stringify(updated));
    }
    reloadData();
  };

  // State & Handler for Manual Admin Order Creation
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [createOrderForm, setCreateOrderForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "Đà Nẵng",
    productId: BAG_BASES[0].id,
    quantity: 1,
    paymentMethod: "cod" as "cod" | "vietqr",
  });

  const handleAdminCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedProduct = backendProducts.find((p) => p.id === createOrderForm.productId) || {
        id: createOrderForm.productId,
        name: "NÉT Eco Bag",
        basePrice: 1250000,
        plasticOffsetKg: 1.8,
      };

      const payload = {
        cartItems: [
          {
            bagBaseId: selectedProduct.id,
            id: selectedProduct.id,
            title: selectedProduct.name,
            price: selectedProduct.basePrice,
            quantity: createOrderForm.quantity,
            plasticOffsetKg: selectedProduct.plasticOffsetKg || 1.8,
          },
        ],
        customer: {
          fullName: createOrderForm.fullName.trim(),
          phone: createOrderForm.phone.trim(),
          email: createOrderForm.email.trim() || `order-${Date.now()}@netcustomer.vn`,
          address: createOrderForm.address.trim(),
          city: createOrderForm.city.trim(),
        },
        paymentMethod: createOrderForm.paymentMethod,
        total: selectedProduct.basePrice * createOrderForm.quantity,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert("Đã tạo đơn hàng mới và tự động trừ tồn kho thành công!");
        setShowCreateOrderModal(false);
        setCreateOrderForm({
          fullName: "",
          phone: "",
          email: "",
          address: "",
          city: "Đà Nẵng",
          productId: BAG_BASES[0].id,
          quantity: 1,
          paymentMethod: "cod",
        });
        if (data.data) {
          saveNewOrder(data.data);
        }
        reloadData();
      } else {
        alert(data.error || "Lỗi tạo đơn hàng");
      }
    } catch (err: any) {
      alert("Lỗi kết nối máy chủ: " + err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // AUTH GUARD VIEW
  // ---------------------------------------------------------------------------
  if (isAdminAuthenticated === false) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <OceanBackdrop bubbleCount={16} causticsOpacity={0.2} />
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-sky-800/40 shadow-2xl text-center space-y-6 relative z-10 text-white">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-700/50">
              YÊU CẦU QUYỀN ĐIỀU HÀNH
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">
              Cổng Xưởng Vận Hành NÉT
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Khu vực quản lý chuỗi cung ứng khép kín: Nhập Kiện Lưới Ma, Điều phối Chế tạo, Cấp Định Danh Serial và Phân bổ Đơn Hàng.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/admin/login"
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-950/50"
            >
              <KeyRound className="w-4 h-4" />
              <span>Đăng Nhập Quản Trị Viên</span>
            </Link>

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("net_admin_authenticated", "true");
                }
                setIsAdminAuthenticated(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
            >
              ⚡ Mở Nhanh Chế Độ Kiểm Thử (Pitching Demo)
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Quay lại Cửa Hàng Khách Hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availableInStockItems = manufacturedItems.filter((i) => i.status === "in_stock");

  return (
    <div className="relative min-h-screen bg-[#071326] text-slate-100">
      <OceanBackdrop bubbleCount={14} causticsOpacity={0.15} />

      <div className="pt-6 pb-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Top Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-sky-900/50 p-5 rounded-2xl shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-700/50 text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>CHUỖI CUNG ỨNG TUẦN HOÀN KHÉP KÍN & NFC PASSPORT</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Trung Tâm Vận Hành Xưởng & Quản Lý NFC
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Nhập kiện lưới kèm kế hoạch khâu túi, cấp dải mã vạch dệt may lót và chip NFC kích hoạt bảo hành điện tử 24 tháng.
            </p>
          </div>

          {/* Quick Metrics Header */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/90 border border-sky-800/40 px-4 py-2 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Doanh Thu</div>
              <div className="text-base font-bold text-teal-300 font-mono">{formatVND(stats.totalRevenue)}</div>
            </div>
            <div className="bg-slate-800/90 border border-sky-800/40 px-4 py-2 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Lưới Giải Cứu</div>
              <div className="text-base font-bold text-emerald-400 font-mono">{formatKg(stats.totalNetWeightRecovered)}</div>
            </div>
            <div className="bg-slate-800/90 border border-sky-800/40 px-4 py-2 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Túi Đã May</div>
              <div className="text-base font-bold text-sky-300 font-mono">{stats.totalBagsManufactured} túi</div>
            </div>
            <div className="bg-slate-800/90 border border-sky-800/40 px-4 py-2 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Đơn Khách</div>
              <div className="text-base font-bold text-amber-300 font-mono">{stats.totalOrdersCount} đơn</div>
            </div>
          </div>
        </div>

        {/* 6-Process Tabs Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-900/90 p-2 rounded-2xl border border-sky-900/50 shadow-inner">
          <button
            type="button"
            onClick={() => handleSwitchTab("analytics")}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "analytics"
                ? "bg-teal-600 text-white shadow-lg shadow-teal-950/60 font-extrabold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-300" />
            <span>Thống Kê</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab("products")}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "products"
                ? "bg-teal-600 text-white shadow-lg shadow-teal-950/60 font-extrabold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-pink-300" />
            <span>Sản Phẩm ({backendProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab("net-packs")}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "net-packs"
                ? "bg-teal-600 text-white shadow-lg shadow-teal-950/60 font-extrabold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <Anchor className="w-4 h-4 text-sky-300" />
            <span>1. Nhập Lưới ({netPacks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab("manufacturing")}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "manufacturing"
                ? "bg-teal-600 text-white shadow-lg shadow-teal-950/60 font-extrabold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <Hammer className="w-4 h-4 text-amber-300" />
            <span>2. Chế Tạo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab("inventory")}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "inventory"
                ? "bg-teal-600 text-white shadow-lg shadow-teal-950/60 font-extrabold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <Boxes className="w-4 h-4 text-emerald-300" />
            <span>3. Kho Túi ({manufacturedItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab("orders")}
            className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "orders"
                ? "bg-teal-600 text-white shadow-lg shadow-teal-950/60 font-extrabold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <Package className="w-4 h-4 text-indigo-300" />
            <span>4. Đơn Hàng ({orders.length})</span>
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* TAB 1: ANALYTICS & SALES DASHBOARD */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* 4 Big Impact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-sky-800/50 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Doanh Thu Tổng Hợp</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono mt-3">
                  {formatVND(stats.totalRevenue)}
                </div>
                <div className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
                  <span>✓ {stats.paidOrdersCount} đơn đã thanh toán</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-sky-800/50 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Lưới Ma Thu Hồi</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <Anchor className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-300 font-mono mt-3">
                  {formatKg(stats.totalNetWeightRecovered)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Tồn kho khả dụng: <span className="text-white font-bold">{formatKg(stats.remainingNetWeight)}</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-sky-800/50 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Sản Phẩm Thành Phẩm</span>
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-sky-300 font-mono mt-3">
                  {stats.totalBagsManufactured} túi
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                  <span className="text-emerald-400">Kho: {stats.bagsInStock}</span>
                  <span>•</span>
                  <span className="text-indigo-400">Đã bán: {stats.bagsSold}</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-sky-800/50 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Tiến Độ Đơn Hàng</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-300 font-mono mt-3">
                  {stats.totalOrdersCount} đơn
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Đang may: <span className="text-amber-400 font-bold">{stats.craftingOrdersCount}</span> | Giao: <span className="text-sky-400 font-bold">{stats.deliveringOrdersCount}</span>
                </div>
              </div>
            </div>

            {/* Circularity Supply Chain Progress Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-800/60 p-6 rounded-2xl shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-400" />
                    Hiệu Quả Chuyển Hóa Tuần Hoàn (Ghost Net Circular Conversion)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Đã chuyển hóa <span className="text-teal-300 font-bold">{stats.consumedNetWeight}kg</span> lưới ma thành <span className="text-white font-bold">{stats.totalBagsManufactured} chiếc túi NÉT</span> có mã vạch dệt may & chip NFC bảo hành độc bản.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Tỷ Lệ Tiêu Thụ Lưới</div>
                  <div className="text-xl font-bold text-teal-300 font-mono">
                    {stats.totalNetWeightRecovered > 0
                      ? Math.round((stats.consumedNetWeight / stats.totalNetWeightRecovered) * 100)
                      : 0}%
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalNetWeightRecovered > 0
                        ? Math.min(100, Math.round((stats.consumedNetWeight / stats.totalNetWeightRecovered) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB: PRODUCTS MANAGEMENT (BACKEND CLOUD CRUD) */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "products" && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-sky-800/50 p-4 rounded-2xl">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-pink-400" />
                  Quản Lý Danh Mục Sản Phẩm (Cloud Firestore Backend CRUD)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý trực tiếp danh mục mẫu túi qua Backend REST API (<code className="text-pink-300">/api/products</code>). Khi thêm/xóa/sửa, khách hàng sẽ thấy ngay trên trang chủ và Catalog.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchBackendProducts}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Tải lại từ backend"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tải Lại</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProductForm({
                      id: `bag-${Date.now().toString().slice(-4)}`,
                      name: "",
                      category: "tote",
                      basePrice: 1250000,
                      description: "",
                      plasticOffsetKg: 1.8,
                      imageUrl: "/assets/products/tote-blue.png",
                      model3dUrl: "/assets/models/tuixach.glb",
                      inStock: true,
                      stockCount: 50,
                    });
                    setShowAddProductModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Mẫu Sản Phẩm</span>
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {backendProducts.length === 0 ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="text-slate-300 font-semibold text-sm">Chưa có sản phẩm nào trong Backend Database</div>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Bấm &quot;Tải Lại&quot; để Backend tự động nạp danh mục khởi tạo từ BAG_BASES hoặc bấm nút &quot;+ Thêm Mẫu Sản Phẩm&quot; để tạo mẫu túi mới.
                </p>
                <button
                  type="button"
                  onClick={fetchBackendProducts}
                  className="px-4 py-2 bg-pink-600 text-white text-xs font-bold rounded-xl"
                >
                  Tải Danh Mục Từ Backend
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backendProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-pink-900/60 transition-all rounded-2xl p-4 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      {/* Product Header */}
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80";
                              }}
                            />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-slate-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-pink-400 bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-800/40 font-bold">
                              {p.id}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                p.inStock && (p.stockCount ?? 1) > 0
                                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                  : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                              }`}
                            >
                              {p.inStock && (p.stockCount ?? 1) > 0
                                ? `Còn hàng (${p.stockCount ?? 0})`
                                : "Hết hàng"}
                            </span>
                            {p.model3dUrl && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/40 font-mono font-bold flex items-center gap-1">
                                <Box className="w-3 h-3" /> 3D
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-sm mt-1 truncate">{p.name}</h4>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            Phân loại: {p.category}
                          </span>
                        </div>
                      </div>

                      {/* Product Description */}
                      <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                        {p.description || "Túi thời trang sinh thái tái chế từ lưới ma đại dương."}
                      </p>

                      {/* Metrics: 3 Columns with Live Stock */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80">
                        <div className="bg-slate-800/60 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-slate-400">Giá Niêm Yết</div>
                          <div className="text-xs font-bold text-pink-300 font-mono mt-0.5">
                            {formatVND(p.basePrice)}
                          </div>
                        </div>
                        <div className="bg-slate-800/60 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-slate-400">Tồn Kho</div>
                          <div className={`text-xs font-bold font-mono mt-0.5 ${
                            (p.stockCount ?? 0) > 0 ? "text-cyan-300" : "text-rose-400"
                          }`}>
                            {p.stockCount ?? 0} chiếc
                          </div>
                        </div>
                        <div className="bg-slate-800/60 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-slate-400">Rác Giảm</div>
                          <div className="text-xs font-bold text-emerald-300 font-mono mt-0.5">
                            {p.plasticOffsetKg || 1.8} kg
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setProductForm({
                            id: p.id,
                            name: p.name,
                            category: p.category || "tote",
                            basePrice: p.basePrice || 1250000,
                            description: p.description || "",
                            plasticOffsetKg: p.plasticOffsetKg || 1.8,
                            imageUrl: p.imageUrl || "/assets/products/tote-blue.png",
                            model3dUrl: p.model3dUrl || "/assets/models/tuixach.glb",
                            inStock: p.inStock ?? true,
                            stockCount: p.stockCount ?? 0,
                          });
                          setShowAddProductModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 2: NET PACKS & BATCH PLANNING WITH SERIAL & BARCODE ALLOCATION */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "net-packs" && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-sky-800/50 p-4 rounded-2xl">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <Anchor className="w-5 h-5 text-teal-400" />
                  Khai Báo Kiện Lưới & Tự Động Định Danh Dải Túi (Serial & Barcode Allocation)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhập thông số kiện lưới $\rightarrow$ Nhập luôn số lượng túi khâu $\rightarrow$ Hệ thống tự động sinh Dải Serial, Dải Mã Vạch may lót và Link NFC sẵn sàng.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPackModal(true)}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nhập Kiện Mới & Gán Dải Túi</span>
              </button>
            </div>

            {/* Net Packs Table */}
            <div className="bg-slate-900/90 border border-sky-800/50 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Mã Kiện Lưới</th>
                      <th className="py-3 px-4">Vùng Biển & Tọa Độ GPS</th>
                      <th className="py-3 px-4">Ngày Vớt / Kg</th>
                      <th className="py-3 px-4">Dáng Túi May & Số Lượng</th>
                      <th className="py-3 px-4">Dải Serial Cấp Tự Động</th>
                      <th className="py-3 px-4">Dải Mã Vạch May Lót</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {netPacks.map((pack) => {
                      const packNumberMatch = pack.packId.match(/\d+$/);
                      const packSuffix = packNumberMatch ? packNumberMatch[0] : "01";
                      let reg = "VN";
                      if (pack.seaRegion.includes("Sơn Trà")) reg = "ST";
                      else if (pack.seaRegion.includes("Nam Ô")) reg = "NO";
                      else if (pack.seaRegion.includes("Cù Lao Chàm")) reg = "CLC";
                      else if (pack.seaRegion.includes("Côn Đảo")) reg = "CD";

                      const displaySerialRange =
                        pack.serialRangeStart && pack.serialRangeEnd
                          ? `${pack.serialRangeStart} ➔ ${pack.serialRangeEnd}`
                          : `NET-${reg}-${packSuffix}-001 ➔ NET-${reg}-${packSuffix}-010`;
                      const displayBarcodeRange =
                        pack.barcodeRangeStart && pack.barcodeRangeEnd
                          ? `${pack.barcodeRangeStart} ➔ ${pack.barcodeRangeEnd}`
                          : `893882${packSuffix}001 ➔ 893882${packSuffix}010`;

                      return (
                        <tr key={pack.packId} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-teal-300">
                            {pack.packId}
                            <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                              {pack.status === "depleted" ? (
                                <span className="text-rose-400">Đã dùng hết</span>
                              ) : (
                                <span className="text-emerald-400">Đang sản xuất</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{pack.seaRegion}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-teal-400" />
                              <span>{pack.coordinates.lat}°N, {pack.coordinates.lng}°E</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-300">{pack.recoveryDate}</div>
                            <div className="text-[11px] font-mono text-emerald-400 font-bold">
                              {pack.remainingWeightKg} / {pack.totalWeightKg} kg
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">
                              {pack.producedBagModel || "NÉT Tote Signature"}
                            </div>
                            <div className="text-[11px] text-amber-300 font-mono">
                              Khâu: {pack.producedBagCount || 10} chiếc túi
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-teal-300 font-bold">
                            {displaySerialRange}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-sky-300 font-bold flex items-center gap-1 mt-3">
                            <Barcode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>{displayBarcodeRange}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                handleSwitchTab("inventory");
                                setInventorySearch(pack.packId);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Xem Túi Thành Phẩm →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Add Net Pack Form with Mandatory Bag Planning */}
            {showAddPackModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-sky-800/80 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                      <Anchor className="w-5 h-5 text-teal-400" />
                      Khai Báo Kiện Lưới & Lập Dải Serial / Mã Vạch Tự Động
                    </h3>
                    <button
                      onClick={() => setShowAddPackModal(false)}
                      className="text-slate-400 hover:text-white text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateNetPack} className="space-y-4 text-xs">
                    {/* Part 1: Raw Net Info */}
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                        1. Thông Số Kiện Lưới Trục Vớt (Raw Material Pack)
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Mã Kiện (Pack ID)</label>
                          <input
                            type="text"
                            required
                            value={newPackForm.packId}
                            onChange={(e) => setNewPackForm({ ...newPackForm, packId: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Ngày Trục Vớt</label>
                          <input
                            type="date"
                            required
                            value={newPackForm.recoveryDate}
                            onChange={(e) => setNewPackForm({ ...newPackForm, recoveryDate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Vùng Biển Trục Vớt</label>
                        <input
                          type="text"
                          required
                          value={newPackForm.seaRegion}
                          onChange={(e) => setNewPackForm({ ...newPackForm, seaRegion: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Vĩ Độ (Lat)</label>
                          <input
                            type="number"
                            step="0.0001"
                            required
                            value={newPackForm.lat}
                            onChange={(e) => setNewPackForm({ ...newPackForm, lat: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Kinh Độ (Lng)</label>
                          <input
                            type="number"
                            step="0.0001"
                            required
                            value={newPackForm.lng}
                            onChange={(e) => setNewPackForm({ ...newPackForm, lng: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Tổng Khối Lượng (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={newPackForm.totalWeightKg}
                            onChange={(e) => setNewPackForm({ ...newPackForm, totalWeightKg: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-teal-300 font-bold font-mono focus:border-teal-400 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Factory Bag Sewing Plan & Range Allocation */}
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-amber-600/40 space-y-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Factory className="w-3.5 h-3.5 text-amber-400" />
                        <span>2. Kế Hoạch Khâu Túi & Gán Dải Serial / Mã Vạch Tự Động</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Dáng Túi Sẽ Khâu</label>
                          <select
                            value={newPackForm.bagBaseId}
                            onChange={(e) => setNewPackForm({ ...newPackForm, bagBaseId: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                          >
                            {BAG_BASES.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} (Định mức: {b.plasticOffsetKg}kg/túi)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Số Lượng Túi Khâu Ra Từ Kiện Này
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={newPackForm.planQuantity}
                            onChange={(e) => setNewPackForm({ ...newPackForm, planQuantity: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold font-mono focus:border-amber-400 outline-none"
                          />
                        </div>
                      </div>

                      {/* Realtime calculation breakdown box */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-1.5 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tổng lưới tiêu hao:</span>
                          <span className="text-amber-300 font-bold">{planNetNeeded} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Lưới còn lại lưu kho sau may:</span>
                          <span className={planRemainingKg >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            {planRemainingKg} kg {planRemainingKg < 0 && "(Thiếu nguyên liệu!)"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Dải Serial sẽ cấp:</span>
                          <span className="text-teal-300 font-bold">{predictedSerialRange}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Dải Mã vạch may lót (Code 128):</span>
                          <span className="text-sky-300 font-bold">{predictedBarcodeRange}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAddPackModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={planRemainingKg < 0}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                          planRemainingKg >= 0
                            ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white cursor-pointer"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                        }`}
                      >
                        Lưu Kiện & Tự Động Sinh {newPackForm.planQuantity} Túi Có Mã Vạch
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 3: MANUFACTURING & AUTO-SERIAL GENERATION */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "manufacturing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 cols: Manufacturing Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900/90 border border-sky-800/50 p-6 rounded-2xl shadow-xl space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-950/70 border border-amber-700/50 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Factory className="w-3.5 h-3.5" />
                    <span>LẬP LỆNH CHẾ TẠO & CẤP MÃ VẠCH / NFC</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white">
                    Xưởng May & Gán Mã Vạch May Lót
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Chọn kiện lưới nguồn, chọn dáng túi cần may. Hệ thống sẽ tự động trừ kg lưới và cấp dải mã Serial, dải mã vạch Code 128 và chip NFC UID.
                  </p>
                </div>

                {/* Form fields */}
                <div className="space-y-4 text-xs">
                  {/* Step 1: Source Net Pack */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                      <span>1. Chọn Kiện Lưới Nguồn (Net Pack):</span>
                      {activePack && (
                        <span className="text-teal-300 font-mono">
                          Khả dụng: {activePack.remainingWeightKg}kg / {activePack.totalWeightKg}kg
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedPackForMfg}
                      onChange={(e) => setSelectedPackForMfg(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:border-teal-400 outline-none"
                    >
                      {netPacks.map((p) => (
                        <option key={p.packId} value={p.packId} disabled={p.remainingWeightKg <= 0}>
                          {p.packId} — {p.seaRegion} (Còn: {p.remainingWeightKg}kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Bag Model */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      2. Chọn Dáng Túi Sản Xuất:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BAG_BASES.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBagBaseId(b.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedBagBaseId === b.id
                              ? "bg-teal-950/80 border-teal-400 text-white shadow-md shadow-teal-950/50"
                              : "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <div className="font-bold text-xs">{b.name}</div>
                          <div className="text-[10px] text-teal-300 font-mono mt-1">
                            Tiêu hao: {b.plasticOffsetKg}kg
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Color & Workshop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">
                        3. Màu Sắc Mắt Lưới:
                      </label>
                      <select
                        value={selectedColorId}
                        onChange={(e) => setSelectedColorId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 outline-none"
                      >
                        {BAG_COLORS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.vietnameseName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">
                        4. Xưởng May Chế Tác:
                      </label>
                      <select
                        value={selectedWorkshop}
                        onChange={(e) => setSelectedWorkshop(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 outline-none"
                      >
                        <option value="Làng nghề đan lưới Nam Ô">Làng nghề đan lưới Nam Ô (Đà Nẵng)</option>
                        <option value="Xưởng NÉT Sơn Trà Studio">Xưởng NÉT Sơn Trà Studio (Bán đảo)</option>
                        <option value="Hợp tác xã Cù Lao Chàm">Hợp tác xã Cù Lao Chàm (Quảng Nam)</option>
                        <option value="Xưởng Chế Tác Côn Đảo">Xưởng Chế Tác Côn Đảo</option>
                      </select>
                    </div>
                  </div>

                  {/* Step 4: Quantity & Calculation */}
                  <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">5. Số Lượng Túi Cần May:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMfgQuantity(Math.max(1, mfgQuantity - 1))}
                          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-mono font-bold text-lg text-teal-300">
                          {mfgQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setMfgQuantity(mfgQuantity + 1)}
                          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Auto-Calculation breakdown */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/80 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400">Định mức/túi: </span>
                        <span className="text-white font-bold">{activeBagBase.plasticOffsetKg} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Tổng lưới cần dùng: </span>
                        <span className="text-amber-300 font-bold">{neededKg} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Lưới còn trong Kiện: </span>
                        <span className="text-white font-bold">{activePack?.remainingWeightKg || 0} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Sau khi may còn: </span>
                        <span className={isEnoughNet ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {activePack ? Number((activePack.remainingWeightKg - neededKg).toFixed(2)) : 0} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Manufacture Button */}
                  <button
                    type="button"
                    disabled={!isEnoughNet}
                    onClick={handleStartManufacture}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xl ${
                      isEnoughNet
                        ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white cursor-pointer shadow-teal-950/60"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    }`}
                  >
                    <Hammer className="w-4 h-4" />
                    <span>BẮT ĐẦU CHẾ TẠO & CẤP MÃ SERIAL / MÃ VẠCH ({mfgQuantity} TÚI)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Results of the newly minted batch */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/90 border border-sky-800/50 p-5 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Mẻ Vừa Xuất Xưởng (Newly Minted)
                  </h4>
                  {mfgResultBatch.length > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded">
                      +{mfgResultBatch.length} Thành Phẩm
                    </span>
                  )}
                </div>

                {mfgSuccessMsg && (
                  <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-700/60 text-teal-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{mfgSuccessMsg}</span>
                  </div>
                )}

                {mfgResultBatch.length === 0 ? (
                  <div className="text-center py-10 px-4 text-slate-400 space-y-2">
                    <Factory className="w-10 h-10 text-slate-600 mx-auto" />
                    <div className="text-xs font-semibold text-slate-300">Chưa có mẻ túi nào vừa may</div>
                    <div className="text-[11px] text-slate-500">
                      Chọn thông số ở bên trái và bấm &ldquo;Bắt đầu chế tạo&rdquo; để tự động sinh mã Serial và mã vạch may lót.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {mfgResultBatch.map((item) => (
                      <div
                        key={item.serialId}
                        className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-extrabold text-teal-300">
                            {item.serialId}
                          </span>
                          <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-800/50">
                            NFC: Chưa Kích Hoạt
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white">
                          {item.bagName} — {item.colorName}
                        </div>
                        <div className="text-[10px] text-sky-300 font-mono flex items-center gap-1.5">
                          <Barcode className="w-3.5 h-3.5 text-sky-400" />
                          <span>Mã vạch: {item.barcode}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-slate-700/60">
                          <span>May: {item.manufacturedAt}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedItemForPassport(item)}
                            className="text-teal-400 hover:text-teal-300 underline flex items-center gap-1 font-sans cursor-pointer"
                          >
                            <Cpu className="w-3 h-3" />
                            <span>Chi Tiết Tem & NFC</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleSwitchTab("inventory")}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Xem Tất Cả Trong Kho Thành Phẩm</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 4: FINISHED GOODS & BARCODE / NFC DETAILS */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Top Bar with Export & Firestore Sync */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-sky-800/50 p-5 rounded-2xl shadow-xl">
              <div>
                <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-emerald-400" />
                  Kho Túi Thành Phẩm & Cơ Sở Dữ Liệu Tồn Kho
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Quản lý định danh độc bản (Serial ID), mã vạch dệt may lót trong túi (Code 128), chip NFC kích hoạt bảo hành điện tử 24 tháng và tự động trừ kho khi khách đặt hàng.
                </p>
              </div>

              {/* Action Buttons: Export Excel + Sync Firestore */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={exportInventoryToCSV}
                  className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/50 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>📥 Xuất File Excel (CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncFirestore}
                  disabled={isSyncingFirestore}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                    isSyncingFirestore
                      ? "bg-sky-900/50 text-sky-400 border border-sky-700/50 cursor-not-allowed"
                      : "bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/50"
                  }`}
                >
                  {isSyncingFirestore ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                      <span>Đang Đồng Bộ Cloud...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4 text-sky-400" />
                      <span>⚡ Đồng Bộ Cloud Firestore</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Cloud Sync Feedback Banner */}
            {syncFeedback && (
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
                  syncFeedback.success
                    ? "bg-emerald-950/70 border-emerald-700 text-emerald-200"
                    : "bg-rose-950/70 border-rose-700 text-rose-200"
                }`}
              >
                {syncFeedback.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div className="text-xs font-semibold">{syncFeedback.message}</div>
              </div>
            )}

            {/* Inventory KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Tổng Thành Phẩm
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {manufacturedItems.length}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Đã chế tạo và cấp mã định danh
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 shadow-md">
                <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Còn Tồn Kho (In Stock)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                  {stats.bagsInStock}
                </div>
                <div className="text-[10px] text-emerald-400/70 mt-1">
                  Sẵn sàng xuất bán cho khách hàng
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-800/40 shadow-md">
                <div className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">
                  Đã Xuất Kho Theo Đơn
                </div>
                <div className="text-2xl font-bold font-mono text-sky-300 mt-1">
                  {stats.bagsSold}
                </div>
                <div className="text-[10px] text-sky-400/70 mt-1">
                  Tự động trừ khi khách checkout
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 shadow-md">
                <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
                  Bảo Hành NFC Đã Kích Hoạt
                </div>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  {manufacturedItems.filter((i) => i.isClaimed).length}
                </div>
                <div className="text-[10px] text-amber-400/70 mt-1">
                  Đã gán chủ sở hữu chính danh
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-sky-800/50 p-3.5 rounded-2xl">
              <div className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-400" />
                <span>Danh Sách Tồn Kho & Lịch Sử Phân Phối ({filteredInventory.length})</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Tìm Serial, mã vạch, tên túi..."
                    className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-400 outline-none w-56"
                  />
                </div>

                <select
                  value={inventoryFilterStatus}
                  onChange={(e) => setInventoryFilterStatus(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-teal-400 outline-none"
                >
                  <option value="all">Tất cả ({manufacturedItems.length})</option>
                  <option value="in_stock">Còn trong kho ({stats.bagsInStock})</option>
                  <option value="assigned_to_order">Đã xuất theo đơn ({stats.bagsSold})</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-slate-900/90 border border-sky-800/50 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Mã Serial Độc Bản</th>
                      <th className="py-3 px-4">Mã Vạch May Lót (Code 128)</th>
                      <th className="py-3 px-4">Dáng Túi & Màu Sắc</th>
                      <th className="py-3 px-4">Pack Nguồn & Ngày May</th>
                      <th className="py-3 px-4">Trạng Thái Bảo Hành NFC</th>
                      <th className="py-3 px-4">Chủ Sở Hữu Định Danh</th>
                      <th className="py-3 px-4 text-right">Chi Tiết Tem / NFC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          Không tìm thấy sản phẩm nào trong kho.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => (
                        <tr key={item.serialId} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-extrabold text-teal-300">
                            {item.serialId}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-sky-300 font-bold">
                            <div className="flex items-center gap-1.5">
                              <Barcode className="w-3.5 h-3.5 text-sky-400" />
                              <span>{item.barcode || "893882082001"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{item.bagName}</div>
                            <div className="text-[11px] text-slate-400">{item.colorName}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-slate-300 text-[11px]">{item.sourcePackId}</div>
                            <div className="text-[10px] text-slate-400">{item.manufacturedAt}</div>
                            <div className="mt-1.5">
                              {item.status === "in_stock" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  <span>Còn tồn kho</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-950/80 text-sky-300 border border-sky-700/60">
                                  <span>🚀 Xuất đơn #{item.assignedOrderCode || "N/A"}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {item.isClaimed ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Đã Kích Hoạt (24 Tháng)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/50 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Chưa Kích Hoạt NFC</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.claimedBy ? (
                              <div>
                                <div className="font-bold text-white flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-emerald-400" />
                                  <span>{item.claimedBy.fullName}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{item.claimedBy.phone}</div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Chưa gán chủ sở hữu</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedItemForPassport(item)}
                              className="px-3 py-1.5 rounded-lg bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 text-[11px] font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Cpu className="w-3.5 h-3.5" />
                              <span>Tem & NFC</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Physical Garment Barcode & NFC Details */}
            {selectedItemForPassport && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-sky-800/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setSelectedItemForPassport(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white text-base cursor-pointer"
                  >
                    ✕
                  </button>

                  <div className="text-center space-y-1">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-teal-950/80 text-teal-300 border border-teal-700/50">
                      THẺ CĂN CƯỚC SỐ & TEM MAY LÓT
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-white">
                      {selectedItemForPassport.bagName}
                    </h3>
                    <div className="font-mono text-sm font-extrabold text-teal-300">
                      SERIAL: {selectedItemForPassport.serialId}
                    </div>
                  </div>

                  {/* Physical Barcode Care Label Box */}
                  <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      MẪU TEM VẢI MAY LÓT TRONG TÚI (CARE LABEL BARCODE)
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-300 flex flex-col items-center justify-center">
                      <div className="flex items-center justify-center gap-0.5 h-10 w-52 overflow-hidden">
                        {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 2].map((w, idx) => (
                          <div
                            key={idx}
                            className={`h-full bg-slate-900 ${idx % 2 === 0 ? "opacity-100" : "opacity-0"}`}
                            style={{ width: `${w * 1.5}px` }}
                          />
                        ))}
                      </div>
                      <div className="font-mono text-xs font-black tracking-widest text-slate-800 mt-1">
                        {selectedItemForPassport.barcode || "893882082001"}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      In trên dải vải satin dệt may vào mép túi cho máy quét laser kho bãi đọc tự động
                    </div>
                  </div>

                  {/* NFC Chip Parameters */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Chip NFC Hardware:</span>
                      <span className="text-teal-300 font-bold">NTAG213 Kháng Nước Giặt</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Chip UID:</span>
                      <span className="text-sky-300 font-bold">{selectedItemForPassport.nfcTagUid || "04:82:01:B2:C1"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Trạng Thái Bảo Hành:</span>
                      <span className={selectedItemForPassport.isClaimed ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {selectedItemForPassport.isClaimed ? "Đã Kích Hoạt 24 Tháng" : "Chưa Kích Hoạt"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Chủ Sở Hữu:</span>
                      <span className="text-white font-sans font-bold">
                        {selectedItemForPassport.claimedBy ? selectedItemForPassport.claimedBy.fullName : "Chưa có"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kiện Nguồn & Tọa Độ:</span>
                      <span className="text-white text-right font-sans">
                        {selectedItemForPassport.sourcePackId} ({selectedItemForPassport.coordinates.lat}°N)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-400" />
                      <span>In Tem Vải May Lót</span>
                    </button>

                    <Link
                      href={selectedItemForPassport.qrUrl}
                      target="_blank"
                      className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <span>Mở Trang Chạm NFC ↗</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 5: ORDERS MANAGEMENT & ASSIGN BAG TO ORDER */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-sky-800/50 p-4 rounded-2xl">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  Quản Lý Đơn Hàng & Phân Bổ Túi Thành Phẩm
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Duyệt đơn khách, chuyển đổi tiến độ sản xuất và gán mã túi cụ thể từ Kho Thành Phẩm vào đơn.
                </p>
              </div>

              {/* Status Filter & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "received", label: "Tiếp nhận" },
                    { id: "crafting", label: "Đang may" },
                    { id: "delivering", label: "Đang giao" },
                    { id: "delivered", label: "Hoàn tất" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setOrderStatusFilter(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        orderStatusFilter === s.id
                          ? "bg-teal-600 text-white font-bold shadow-md"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchBackendOrders}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Tải lại danh sách đơn hàng"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tải Lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCreateOrderModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tạo Đơn Hàng Mới</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900/90 border border-sky-800/50 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Mã Đơn / Khách Hàng</th>
                      <th className="py-3 px-4">Sản Phẩm Đặt May</th>
                      <th className="py-3 px-4">Tổng Tiền / Thanh Toán</th>
                      <th className="py-3 px-4">Mã Serial Túi Đã Gán</th>
                      <th className="py-3 px-4">Tiến Độ Vận Hành</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          Chưa có đơn hàng nào trong trạng thái này.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const assignedBag = manufacturedItems.find(
                          (b) => b.serialId === order.assignedBagSerialId
                        );

                        return (
                          <tr key={order.orderId} className="hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-teal-300 text-xs">
                                #{order.orderCode}
                              </div>
                              <div className="font-semibold text-white mt-0.5">{order.customer.fullName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{order.customer.phone}</div>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="space-y-0.5">
                                  <div className="font-semibold text-white">{item.title}</div>
                                  {item.details?.charmsList && (
                                    <div className="text-[10px] text-teal-300">
                                      Charm: {item.details.charmsList.join(", ")}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-white text-xs">
                                {formatVND(order.total)}
                              </div>
                              <div className="mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePaymentStatus(order)}
                                  className="cursor-pointer group flex items-center gap-1"
                                  title="Bấm để chuyển đổi trạng thái thanh toán (Đã thu / Chưa thu)"
                                >
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                                      order.paymentStatus === "paid"
                                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 group-hover:bg-emerald-900"
                                        : "bg-amber-950/80 text-amber-300 border border-amber-800/50 group-hover:bg-amber-900"
                                    }`}
                                  >
                                    {order.paymentStatus === "paid" ? "✓ Đã Thanh Toán" : "Chưa Thu (COD) ⟳"}
                                  </span>
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {order.assignedBagSerialId ? (
                                <div className="space-y-1">
                                  <div className="font-mono text-xs font-extrabold text-teal-300 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-teal-400" />
                                    <span>{order.assignedBagSerialId}</span>
                                  </div>
                                  {assignedBag && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedItemForPassport(assignedBag)}
                                      className="text-[10px] text-slate-400 hover:text-white underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <Cpu className="w-3 h-3 text-sky-400" />
                                      <span>Xem Tem / NFC</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-amber-400 text-[11px] font-semibold block mb-1">
                                    Chưa gán túi từ kho
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForAssign(order)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    + Gán Túi Thành Phẩm
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <select
                                value={order.fulfillmentStatus}
                                onChange={(e) =>
                                  handleUpdateFulfillment(order.orderId, e.target.value as any)
                                }
                                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-teal-400 outline-none"
                              >
                                <option value="received">Mới tiếp nhận</option>
                                <option value="crafting">Đang may thủ công</option>
                                <option value="delivering">Đang giao hàng</option>
                                <option value="delivered">Đã hoàn tất</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForAssign(order)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  Chi Tiết
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrder(order.orderId)}
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                                  title="Xóa đơn hàng khỏi hệ thống"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Assign Serial Bag to Order */}
            {selectedOrderForAssign && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-sky-800/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-white">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                      <Tag className="w-5 h-5 text-teal-400" />
                      Phân Bổ Túi Thành Phẩm Vào Đơn #{selectedOrderForAssign.orderCode}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedOrderForAssign(null);
                        setSelectedSerialToAssign("");
                      }}
                      className="text-slate-400 hover:text-white text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-xl space-y-1.5 text-xs">
                    <div className="font-bold text-white">Khách: {selectedOrderForAssign.customer.fullName}</div>
                    <div className="text-slate-400">Địa chỉ: {selectedOrderForAssign.customer.address}, {selectedOrderForAssign.customer.city}</div>
                    <div className="text-teal-300 font-medium">
                      Sản phẩm đặt: {selectedOrderForAssign.items.map((i) => i.title).join("; ")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Chọn Túi Khả Dụng Trong Kho Thành Phẩm:
                    </label>

                    {availableInStockItems.length === 0 ? (
                      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs text-center space-y-2">
                        <div>Hiện tại kho không còn túi nào sẵn sàng (Tất cả đã được gán hoặc chưa may).</div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForAssign(null);
                            handleSwitchTab("net-packs");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs cursor-pointer"
                        >
                          → Đến Nhập Kiện & May Thêm Túi Mới
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {availableInStockItems.map((item) => (
                          <div
                            key={item.serialId}
                            onClick={() => setSelectedSerialToAssign(item.serialId)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              selectedSerialToAssign === item.serialId
                                ? "bg-teal-950/80 border-teal-400 shadow-md"
                                : "bg-slate-800/80 border-slate-700 hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-teal-300">
                                {item.serialId}
                              </span>
                              <span className="text-[10px] text-sky-300 font-mono">
                                Barcode: {item.barcode}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-white mt-1">
                              {item.bagName} — {item.colorName}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              Kiện: {item.sourcePackId} ({item.seaRegion})
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderForAssign(null);
                        setSelectedSerialToAssign("");
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={!selectedSerialToAssign}
                      onClick={handleAssignSerialToOrder}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                        selectedSerialToAssign
                          ? "bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      }`}
                    >
                      Xác Nhận Gán Serial Vào Đơn
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: ADMIN CREATE ORDER MANUALLY */}
            {showCreateOrderModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-indigo-700/80 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-white">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-400" />
                      Tạo Đơn Hàng Mới (Admin & Khách Trực Tiếp)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateOrderModal(false)}
                      className="text-slate-400 hover:text-white text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAdminCreateOrder} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Họ & Tên Khách Hàng</label>
                        <input
                          type="text"
                          required
                          value={createOrderForm.fullName}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, fullName: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Số Điện Thoại</label>
                        <input
                          type="tel"
                          required
                          value={createOrderForm.phone}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, phone: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                          placeholder="0905 123 456"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Địa Chỉ Nhận Hàng</label>
                        <input
                          type="text"
                          required
                          value={createOrderForm.address}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, address: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="123 Trần Phú, Hải Châu"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tỉnh / Thành Phố</label>
                        <input
                          type="text"
                          required
                          value={createOrderForm.city}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, city: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="Đà Nẵng"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Chọn Mẫu Sản Phẩm</label>
                        <select
                          value={createOrderForm.productId}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, productId: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {(backendProducts.length > 0 ? backendProducts : BAG_BASES).map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {formatVND(p.basePrice)} (Còn: {p.stockCount ?? 50})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Số Lượng</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={50}
                          value={createOrderForm.quantity}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Phương Thức Thanh Toán</label>
                        <select
                          value={createOrderForm.paymentMethod}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, paymentMethod: e.target.value as any })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="cod">Tiền mặt khi nhận (COD)</option>
                          <option value="vietqr">Chuyển khoản QR (VietQR)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Email (Tùy chọn)</label>
                        <input
                          type="email"
                          value={createOrderForm.email}
                          onChange={(e) => setCreateOrderForm({ ...createOrderForm, email: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="khach@email.com"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowCreateOrderModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                      >
                        Tạo Đơn Hàng & Trừ Kho
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ADD / EDIT PRODUCT MODAL (BACKEND CLOUD CRUD) */}
            {showAddProductModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-pink-800/80 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-white">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-pink-400" />
                      {productForm.id ? `Cập Nhật Sản Phẩm #${productForm.id}` : "Thêm Mẫu Sản Phẩm Mới"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(false)}
                      className="text-slate-400 hover:text-white text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Sản Phẩm (ID / SKU)</label>
                        <input
                          type="text"
                          required
                          value={productForm.id}
                          onChange={(e) => setProductForm({ ...productForm, id: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                          placeholder="bag-tote-01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Dòng Sản Phẩm</label>
                        <select
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        >
                          <option value="tote">Túi Tote (Tote Bag)</option>
                          <option value="crossbody">Túi Đeo Chéo (Crossbody)</option>
                          <option value="backpack">Balo Du Lịch (Backpack)</option>
                          <option value="accessory">Phụ Kiện / Ví (Accessory)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Sản Phẩm</label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        placeholder="NÉT Marine Tote Signature"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Giá Bán (VNĐ)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          step={10000}
                          value={productForm.basePrice}
                          onChange={(e) => setProductForm({ ...productForm, basePrice: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tồn Kho (chiếc)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          step={1}
                          value={productForm.stockCount ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setProductForm({
                              ...productForm,
                              stockCount: val,
                              inStock: val > 0 ? productForm.inStock : false,
                            });
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                          placeholder="50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Rác Nhựa (kg)</label>
                        <input
                          type="number"
                          required
                          min={0.1}
                          step={0.1}
                          value={productForm.plasticOffsetKg}
                          onChange={(e) => setProductForm({ ...productForm, plasticOffsetKg: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Media: Image Upload (Firebase Storage) */}
                    <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-pink-400" />
                          <span>Ảnh Sản Phẩm (Cloud Storage)</span>
                        </label>
                        {isUploadingImage && (
                          <span className="text-[10px] text-pink-400 font-mono animate-pulse">
                            Đang tải lên: {imageUploadProgress}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Preview Thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {productForm.imageUrl ? (
                            <img
                              src={productForm.imageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80";
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-600" />
                          )}
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/60 hover:bg-pink-900/60 border border-pink-800/50 text-pink-300 text-xs font-semibold transition-all">
                            <CloudUpload className="w-3.5 h-3.5" />
                            <span>{isUploadingImage ? "Đang tải ảnh..." : "Chọn Tệp Ảnh Từ Máy Tính"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingImage}
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            value={productForm.imageUrl}
                            onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-pink-500 font-mono"
                            placeholder="Hoặc nhập URL ảnh..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Media: 3D Model Upload (.glb / .gltf) */}
                    <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Box className="w-4 h-4 text-cyan-400" />
                          <span>Mô Hình 3D Sản Phẩm (.glb / .gltf)</span>
                        </label>
                        {isUploadingModel && (
                          <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
                            Đang tải lên: {modelUploadProgress}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-cyan-400">
                          <Box className="w-6 h-6" />
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/50 text-cyan-300 text-xs font-semibold transition-all">
                            <CloudUpload className="w-3.5 h-3.5" />
                            <span>{isUploadingModel ? "Đang tải 3D..." : "Chọn File 3D (.glb / .gltf)"}</span>
                            <input
                              type="file"
                              accept=".glb,.gltf"
                              disabled={isUploadingModel}
                              onChange={handleModelFileChange}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            value={productForm.model3dUrl}
                            onChange={(e) => setProductForm({ ...productForm, model3dUrl: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
                            placeholder="/assets/models/tuixach.glb"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="inStockCheck"
                        checked={productForm.inStock}
                        onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                        className="rounded border-slate-700 text-pink-600 focus:ring-pink-500 w-4 h-4 bg-slate-800"
                      />
                      <label htmlFor="inStockCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
                        Đang mở bán (Còn hàng trên Catalog và Trang chủ)
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Mô Tả Sản Phẩm</label>
                      <textarea
                        rows={3}
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500 leading-relaxed"
                        placeholder="Mô tả chất liệu lưới ma vớt từ rạn san hô, lớp lót chống thấm và phong cách may thủ công..."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAddProductModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                      >
                        Lưu Sản Phẩm Vào Backend
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071326] flex items-center justify-center text-white text-xs font-mono">
          Đang tải hệ thống điều hành xưởng NÉT...
        </div>
      }
    >
      <AdminDashboardInner />
    </Suspense>
  );
}
