"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  NetPack,
  ManufacturedBagItem,
  Order,
  Article,
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
  getSupplyChainStats,
  deleteOrderById,
} from "@/lib/supplyChainStorage";
import {
  syncAllInventoryToFirestore,
  saveOrderToFirestore,
  getArticlesFromFirestore,
  saveArticleToFirestore,
  deleteArticleFromFirestore,
} from "@/lib/firestoreService";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AdminDashboardTab } from "@/components/admin/AdminDashboardTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminSupplyChainTab } from "@/components/admin/AdminSupplyChainTab";
import { AdminCatalogTab } from "@/components/admin/AdminCatalogTab";
import { Lock, KeyRound, ExternalLink, ShieldAlert } from "lucide-react";

function AdminPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State: 'dashboard' | 'orders' | 'supply-chain' | 'catalog'
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Sync tab with URL query parameter (with backward compatibility)
  useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (!rawTab) return;
    if (rawTab === "analytics") {
      setActiveTab("dashboard");
    } else if (rawTab === "orders") {
      setActiveTab("orders");
    } else if (["net-packs", "manufacturing", "inventory", "supply-chain"].includes(rawTab)) {
      setActiveTab("supply-chain");
    } else if (["products", "catalog", "articles"].includes(rawTab)) {
      setActiveTab("catalog");
    } else if (["dashboard", "orders", "supply-chain", "catalog"].includes(rawTab)) {
      setActiveTab(rawTab);
    }
  }, [searchParams]);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/admin?tab=${tabId}`, { scroll: false });
  };

  // Auth Guard State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuthed = localStorage.getItem("net_admin_authenticated") === "true";
      setIsAdminAuthenticated(isAuthed);
    }
  }, []);

  // Shared Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [netPacks, setNetPacks] = useState<NetPack[]>([]);
  const [manufacturedItems, setManufacturedItems] = useState<ManufacturedBagItem[]>([]);
  const [backendProducts, setBackendProducts] = useState<any[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState(() => getSupplyChainStats());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cloud Firestore Sync State for Supply Chain
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // -------------------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION
  // -------------------------------------------------------------
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Orders from Cloud Firestore (Direct Client Read)
      try {
        const qOrders = query(collection(db, "orders"));
        const snapOrders = await getDocs(qOrders);
        if (!snapOrders.empty) {
          const cloudOrders: Order[] = [];
          snapOrders.forEach((d) => cloudOrders.push(d.data() as Order));
          const validOrders = cloudOrders.filter(
            (o) => !["NET-ORD-8821", "NET-ORD-8822", "NET-ORD-8823"].includes(o.orderCode)
          );
          setOrders(validOrders);
        } else {
          setOrders(getAllOrders());
        }
      } catch (e) {
        console.warn("Orders fetch warning (using local fallback):", e);
        setOrders(getAllOrders());
      }

      // 2. Fetch Net Packs & Manufactured Items
      setNetPacks(getAllNetPacks());
      setManufacturedItems(getManufacturedItems());
      setStats(getSupplyChainStats());

      // 3. Fetch Products from Backend API & Firestore
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setBackendProducts(json.data);
          } else {
            setBackendProducts(BAG_BASES);
          }
        } else {
          setBackendProducts(BAG_BASES);
        }
      } catch {
        setBackendProducts(BAG_BASES);
      }

      // 4. Fetch Articles from Firestore & Stories
      try {
        const arts = await getArticlesFromFirestore();
        setArticles(arts);
      } catch {
        // Fallback
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAllData();
    }
  }, [isAdminAuthenticated]);

  // -------------------------------------------------------------
  // ORDER ACTIONS
  // -------------------------------------------------------------
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order["fulfillmentStatus"]) => {
    try {
      // 1. Firestore update
      const docRef = doc(db, "orders", orderId);
      await updateDoc(docRef, { fulfillmentStatus: newStatus });
    } catch (e) {
      console.warn("Firestore updateOrderStatus warning:", e);
    }
    // 2. Local update
    updateOrderStatus(orderId, newStatus);
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, fulfillmentStatus: newStatus } : o))
    );
  };

  const handleTogglePaymentStatus = async (orderId: string, currentStatus: "pending" | "paid") => {
    const nextStatus = currentStatus === "paid" ? "pending" : "paid";
    try {
      const docRef = doc(db, "orders", orderId);
      await updateDoc(docRef, { paymentStatus: nextStatus });
    } catch (e) {
      console.warn("Firestore update payment warning:", e);
    }
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, paymentStatus: nextStatus } : o))
    );
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đơn hàng này khỏi hệ thống không?")) return;
    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (e) {
      console.warn("Firestore delete order warning:", e);
    }
    deleteOrderById(orderId);
    setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
  };

  const handleCreateManualOrder = async (newOrder: Order) => {
    await saveOrderToFirestore(newOrder);
    setOrders((prev) => [newOrder, ...prev]);
    // Refresh inventory counts
    setManufacturedItems(getManufacturedItems());
  };

  // -------------------------------------------------------------
  // SUPPLY CHAIN ACTIONS
  // -------------------------------------------------------------
  const handleAddNetPack = (packData: Partial<NetPack>) => {
    const newPack: NetPack = {
      packId: packData.packId || `PACK-DN-${Date.now()}`,
      seaRegion: packData.seaRegion || "Vùng Biển Sơn Trà",
      locationDetails: packData.locationDetails || "Bãi Bụt",
      coordinates: packData.coordinates || { lat: 16.11, lng: 108.26 },
      recoveryDate: packData.recoveryDate || new Date().toISOString().split("T")[0],
      totalWeightKg: packData.totalWeightKg || 50,
      remainingWeightKg: packData.totalWeightKg || 50,
      depthMeters: packData.depthMeters || 20,
      diverTeam: packData.diverTeam || "SAS Danang Divers",
      netPolymer: packData.netPolymer || "Nylon-6",
      status: "new",
      notes: packData.notes,
      createdAt: new Date().toISOString(),
    };

    saveNetPack(newPack);
    setNetPacks((prev) => [newPack, ...prev]);

    // Save to Firestore
    setDoc(doc(db, "batches", newPack.packId), newPack, { merge: true }).catch(() => {});
  };

  const handleProduceBags = (params: {
    sourcePackId: string;
    bagBaseId: string;
    colorId: string;
    quantity: number;
    workshopName: string;
  }) => {
    const result = createNetPackWithBatchPlan(params);
    if (result.success) {
      setNetPacks(getAllNetPacks());
      setManufacturedItems(getManufacturedItems());
      setStats(getSupplyChainStats());
    }
    return result;
  };

  const handleSyncFirestore = async () => {
    setIsSyncingFirestore(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllInventoryToFirestore();
      setSyncFeedback(res);
    } catch (e: any) {
      setSyncFeedback({ success: false, message: e.message || "Lỗi đồng bộ dữ liệu" });
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  // -------------------------------------------------------------
  // CATALOG & ARTICLE ACTIONS
  // -------------------------------------------------------------
  const handleSaveProduct = async (productData: any) => {
    try {
      // 1. Save to Backend API / Products Route
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      // 2. Also direct save to Firestore products collection
      try {
        await setDoc(doc(db, "products", productData.id), productData, { merge: true });
      } catch (fsErr) {
        console.warn("Direct firestore product set warning:", fsErr);
      }

      setBackendProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === productData.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = productData;
          return updated;
        }
        return [productData, ...prev];
      });

      return true;
    } catch (err) {
      alert("Lỗi lưu sản phẩm: " + (err instanceof Error ? err.message : ""));
      return false;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return false;
    try {
      await fetch(`/api/products?id=${productId}`, { method: "DELETE" });
      await deleteDoc(doc(db, "products", productId));
      setBackendProducts((prev) => prev.filter((p) => p.id !== productId));
      return true;
    } catch {
      setBackendProducts((prev) => prev.filter((p) => p.id !== productId));
      return true;
    }
  };

  const handleSaveArticle = async (article: Article) => {
    const success = await saveArticleToFirestore(article);
    if (success) {
      setArticles((prev) => {
        const idx = prev.findIndex((a) => a.id === article.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = article;
          return updated;
        }
        return [article, ...prev];
      });
    }
    return success;
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return false;
    const success = await deleteArticleFromFirestore(articleId);
    if (success) {
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    }
    return success;
  };

  // -------------------------------------------------------------
  // AUTH GUARD VIEW
  // -------------------------------------------------------------
  if (isAdminAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#071326] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Yêu Cầu Xác Thực Quản Trị</h2>
            <p className="text-xs text-slate-400">
              Khu vực quản trị nội bộ NÉT WORKSHOP OS dành riêng cho nhân sự quản lý chuỗi cung ứng và vận đơn.
            </p>
          </div>
          <Link
            href="/admin/login"
            className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Đăng Nhập Quản Trị</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* 1. Global Admin Navigation Bar */}
      <AdminNavbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onRefreshAll={fetchAllData}
        isRefreshing={isRefreshing}
      />

      {/* 2. Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "dashboard" && (
          <AdminDashboardTab
            orders={orders}
            netPacks={netPacks}
            manufacturedItems={manufacturedItems}
            backendProducts={backendProducts}
            stats={stats}
            onNavigateTab={handleSelectTab}
          />
        )}

        {activeTab === "orders" && (
          <AdminOrdersTab
            orders={orders}
            backendProducts={backendProducts}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onTogglePaymentStatus={handleTogglePaymentStatus}
            onDeleteOrder={handleDeleteOrder}
            onCreateManualOrder={handleCreateManualOrder}
          />
        )}

        {activeTab === "supply-chain" && (
          <AdminSupplyChainTab
            netPacks={netPacks}
            manufacturedItems={manufacturedItems}
            onAddNetPack={handleAddNetPack}
            onProduceBags={handleProduceBags}
            onSyncFirestore={handleSyncFirestore}
            isSyncing={isSyncingFirestore}
            syncFeedback={syncFeedback}
          />
        )}

        {activeTab === "catalog" && (
          <AdminCatalogTab
            products={backendProducts}
            articles={articles}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onSaveArticle={handleSaveArticle}
            onDeleteArticle={handleDeleteArticle}
          />
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071326] flex items-center justify-center text-teal-400 font-mono text-xs">
          Đang nạp hệ điều hành quản trị NÉT Workshop OS...
        </div>
      }
    >
      <AdminPortalContent />
    </Suspense>
  );
}
