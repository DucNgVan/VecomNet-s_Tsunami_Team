"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

interface AdminNavbarProps {
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  activeTab = "dashboard",
  onSelectTab = () => {},
  onRefreshAll,
  isRefreshing = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuthed = localStorage.getItem("net_admin_authenticated") === "true";
      setIsAdminAuthenticated(isAuthed);
    }
  }, [pathname]);

  const handleAdminLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("net_admin_authenticated");
      localStorage.removeItem("net_admin_session");
      setIsAdminAuthenticated(false);
      router.push("/admin/login");
    }
  };

  const isLoginPage = pathname === "/admin/login";

  // Core Business Stages & Management Tabs (Tổng Quan & Doanh Nghiệp lên đầu)
  const navModules = [
    {
      id: "dashboard",
      label: "Tổng Quan & Doanh Nghiệp",
      subLabel: "Data Analytics & B2B ESG",
    },
    {
      id: "orders",
      label: "Quản Lý Đơn Hàng",
      subLabel: "Đơn Custom, Có Sẵn & B2B",
    },
    {
      id: "supply-chain",
      label: "Chuỗi Cung Ứng & Lô Lưới",
      subLabel: "Lô Lưới & Cấp Mã Serial",
    },
    {
      id: "catalog",
      label: "Bộ Sưu Tập & 3D",
      subLabel: "3D Models & Brand CMS",
    },
    {
      id: "support",
      label: "Hỗ Trợ Khách Hàng",
      subLabel: "Ticket Desk & CSKH",
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#241B16] text-[#FAF7F2] border-b border-[#3A2E27] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <Link href="/admin?tab=dashboard" className="flex items-center gap-2.5 group">
            <div className="h-9 px-2.5 rounded-xl bg-[#352720] border border-[#4A3B32] flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
              <Image
                src="/assets/logo-nets-white.png"
                alt="Nets"
                width={56}
                height={24}
                className="h-5 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-semibold text-sm tracking-wide text-white group-hover:text-[#EFE9DF] transition-colors">
                  NÉT WORKSHOP OS
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Live
                </span>
              </div>
              <div className="text-[10px] text-[#A89C93] -mt-0.5 hidden sm:block">
                Hệ điều hành quản trị thời trang tuần hoàn & thương mại số
              </div>
            </div>
          </Link>
        </div>

        {/* Center: 4 Modular Business Stage Tabs (Pure Typography) */}
        {!isLoginPage && isAdminAuthenticated && (
          <nav className="hidden lg:flex items-center gap-1 bg-[#1A130F] p-1 rounded-2xl border border-white/10 shadow-inner">
            {navModules.map((item) => {
              const isActive = activeTab === item.id || (item.id === "orders" && activeTab === "design-requests");
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#B85D43] text-white shadow-xs font-semibold"
                      : "text-[#C4B9B0] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onRefreshAll && !isLoginPage && isAdminAuthenticated && (
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              title="Tải lại toàn bộ dữ liệu từ Cloud Firestore"
              className={`px-2.5 py-1.5 rounded-xl bg-[#352720] border border-[#4A3B32] text-xs font-medium text-[#C4B9B0] hover:text-white transition-all ${
                isRefreshing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <span>{isRefreshing ? "Đang tải..." : "Làm mới"}</span>
            </button>
          )}

          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl bg-[#352720] border border-[#4A3B32] text-xs font-medium text-[#C4B9B0] hover:text-white transition-all"
          >
            <span>Website</span>
          </Link>

          {!isLoginPage && isAdminAuthenticated && (
            <button
              onClick={handleAdminLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Đăng xuất quản trị"
            >
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      {!isLoginPage && isAdminAuthenticated && (
        <div className="lg:hidden flex items-center gap-1 px-3 py-2 bg-[#1A130F] border-t border-white/10 overflow-x-auto">
          {navModules.map((item) => {
            const isActive = activeTab === item.id || (item.id === "orders" && activeTab === "design-requests");
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isActive
                    ? "bg-[#B85D43] text-white shadow-xs font-semibold"
                    : "text-[#C4B9B0] hover:text-white"
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
