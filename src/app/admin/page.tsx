"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AdminOrder,
  RawNetBatch,
  ProductionSlip,
  BagSerialItem,
  Partner,
  getAdminOrders,
  saveAdminOrder,
  getAdminBatches,
  getAdminSlips,
  getAdminSerials,
  getAdminPartners,
  getAdminRole,
  AdminRole,
} from "@/lib/adminDataStorage";
import {
  getProductsFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
} from "@/lib/firestoreService";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminOrdersTabRefactored } from "@/components/admin/AdminOrdersTabRefactored";
import { AdminSupplyChainPassportTab } from "@/components/admin/AdminSupplyChainPassportTab";
import { AdminPartnersTab } from "@/components/admin/AdminPartnersTab";
import { AdminCatalogTabRefactored } from "@/components/admin/AdminCatalogTabRefactored";
import { AdminSandboxModal } from "@/components/admin/AdminSandboxModal";

function AdminPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Menu dọc quản trị gồm: overview | orders | products | net-passport | partners (Req 1)
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [orderFilterParam, setOrderFilterParam] = useState<string>("all");
  const [selectedOrderIdParam, setSelectedOrderIdParam] = useState<string | undefined>(undefined);
  const [supplyChainSubTab, setSupplyChainSubTab] = useState<"inbound" | "inventory" | "production" | "passport">("inbound");

  // Sync tab with URL
  useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (!rawTab) {
      setActiveTab("overview");
      return;
    }
    if (["overview", "dashboard", "analytics"].includes(rawTab)) {
      setActiveTab("overview");
    } else if (["orders", "design-requests"].includes(rawTab)) {
      setActiveTab("orders");
    } else if (["products", "catalog"].includes(rawTab)) {
      setActiveTab("products");
    } else if (["net-passport", "supply-chain", "batches", "manufacturing"].includes(rawTab)) {
      setActiveTab("net-passport");
    } else if (["partners", "commission"].includes(rawTab)) {
      setActiveTab("partners");
    }
  }, [searchParams]);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/admin?tab=${tabId}`, { scroll: false });
  };

  // 2. Auth Guard
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  useEffect(() => {
    async function checkServerAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (data.authenticated) {
          setIsAdminAuthenticated(true);
        } else {
          setIsAdminAuthenticated(false);
          router.push("/admin/login?redirect=/admin");
        }
      } catch {
        setIsAdminAuthenticated(false);
        router.push("/admin/login?redirect=/admin");
      }
    }
    checkServerAuth();
  }, [router]);

  // 3. Shared Data States
  const [orders, setOrders] = useState<AdminOrder[]>(() => getAdminOrders());
  const [batches, setBatches] = useState<RawNetBatch[]>(() => getAdminBatches());
  const [slips, setSlips] = useState<ProductionSlip[]>(() => getAdminSlips());
  const [serials, setSerials] = useState<BagSerialItem[]>(() => getAdminSerials());
  const [partners, setPartners] = useState<Partner[]>(() => getAdminPartners());
  const [backendProducts, setBackendProducts] = useState<any[]>([]);

  // Trạng thái lưu dữ liệu đám mây (Req 25)
  const [syncStatus, setSyncStatus] = useState<"saved" | "syncing" | "error">("saved");

  // Sandbox Modal State (Req 26)
  const [showSandboxModal, setShowSandboxModal] = useState(false);

  // Fetch Firestore products
  const fetchProducts = async () => {
    try {
      setSyncStatus("syncing");
      const prods = await getProductsFromFirestore();
      if (Array.isArray(prods) && prods.length > 0) {
        setBackendProducts(prods);
      }
      setSyncStatus("saved");
    } catch {
      setSyncStatus("saved");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDataReload = () => {
    setOrders(getAdminOrders());
    setBatches(getAdminBatches());
    setSlips(getAdminSlips());
    setSerials(getAdminSerials());
    setPartners(getAdminPartners());
    fetchProducts();
  };

  // Navigations from Overview clicks (Req 3)
  const handleOverviewNavigateToOrders = (filterKey?: string, selectOrderId?: string) => {
    setOrderFilterParam(filterKey || "all");
    setSelectedOrderIdParam(selectOrderId);
    handleSelectTab("orders");
  };

  const handleOverviewNavigateToSupplyChain = (
    subTab?: "inbound" | "inventory" | "production" | "passport",
    selectId?: string
  ) => {
    if (subTab) setSupplyChainSubTab(subTab);
    handleSelectTab("net-passport");
  };

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.fulfillmentStatus === "received" || o.fulfillmentStatus === "confirmed").length;
  }, [orders]);

  const quotesNeededCount = useMemo(() => {
    return orders.filter(
      (o) => o.fulfillmentStatus === "quote_needed" || o.fulfillmentStatus === "waiting_approval"
    ).length;
  }, [orders]);

  if (isAdminAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-[#7A6E65]">
        Đang xác thực quyền quản trị NÉT Workshop...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans text-[#2A2521]">
      {/* 1. Menu Dọc Quản Trị (Req 1) */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSandbox={() => setShowSandboxModal(true)}
        pendingOrdersCount={pendingOrdersCount}
        quotesNeededCount={quotesNeededCount}
      />

      {/* 2. Vùng Nội Dung Chính (Req 2: Tối giản, không quảng cáo, thao tác ngay) */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top bar tối giản */}
        <header className="h-12 bg-white border-b border-[#E8E2D9] px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#7A6E65]">
            <span>Cổng Quản Trị</span>
            <span>/</span>
            <span className="font-semibold text-[#2A2521] capitalize">
              {activeTab === "overview"
                ? "Tổng quan"
                : activeTab === "orders"
                ? "Đơn hàng"
                : activeTab === "products"
                ? "Sản phẩm & Charm"
                : activeTab === "net-passport"
                ? "Lưới & Passport"
                : "Đối tác"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Trạng thái lưu đám mây (Req 25) */}
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{syncStatus === "syncing" ? "Đang đồng bộ..." : "Đã đồng bộ đám mây"}</span>
            </div>

            <button
              type="button"
              onClick={handleDataReload}
              className="text-[#7A6E65] hover:text-[#2A2521] transition-colors text-[11px] font-medium"
              title="Làm mới dữ liệu"
            >
              Làm mới ↻
            </button>
          </div>
        </header>

        {/* Nội dung theo Tab đang chọn */}
        <div className="p-4 sm:p-6 flex-1">
          {activeTab === "overview" && (
            <AdminOverviewTab
              orders={orders}
              batches={batches}
              slips={slips}
              serials={serials}
              products={backendProducts}
              onNavigateToOrders={handleOverviewNavigateToOrders}
              onNavigateToProducts={() => handleSelectTab("products")}
              onNavigateToSupplyChain={handleOverviewNavigateToSupplyChain}
            />
          )}

          {activeTab === "orders" && (
            <AdminOrdersTabRefactored
              orders={orders}
              partners={partners}
              serials={serials}
              products={backendProducts}
              onOrdersChange={(updated) => setOrders(updated)}
              initialFilter={orderFilterParam}
              initialSelectedOrderId={selectedOrderIdParam}
            />
          )}

          {activeTab === "products" && (
            <AdminCatalogTabRefactored
              products={backendProducts}
              onSaveProduct={async (p) => {
                const ok = await saveProductToFirestore(p);
                if (ok) fetchProducts();
                return ok;
              }}
              onDeleteProduct={async (id) => {
                const ok = await deleteProductFromFirestore(id);
                if (ok) fetchProducts();
                return ok;
              }}
            />
          )}

          {activeTab === "net-passport" && (
            <AdminSupplyChainPassportTab
              batches={batches}
              slips={slips}
              serials={serials}
              onBatchesChange={(updated) => setBatches(updated)}
              onSlipsChange={(updated) => setSlips(updated)}
              onSerialsChange={(updated) => setSerials(updated)}
              initialSubTab={supplyChainSubTab}
            />
          )}

          {activeTab === "partners" && (
            <AdminPartnersTab
              partners={partners}
              orders={orders}
              onPartnersChange={(updated) => setPartners(updated)}
            />
          )}
        </div>
      </main>

      {/* 3. Modal Khu Vực Thử Nghiệm / Sandbox (Req 26) */}
      <AdminSandboxModal
        isOpen={showSandboxModal}
        onClose={() => setShowSandboxModal(false)}
        onDataReset={handleDataReload}
      />
    </div>
  );
}

export default function AdminPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-[#7A6E65]">
          Đang tải NÉT Workshop OS...
        </div>
      }
    >
      <AdminPortalContent />
    </Suspense>
  );
}
