"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Package,
  Layers,
  Sparkles,
  LogOut,
  ExternalLink,
  RefreshCw,
  Anchor,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

interface AdminNavbarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  activeTab,
  onSelectTab,
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

  // 4 Core Strategic Modules
  const navModules = [
    {
      id: "dashboard",
      label: "Tổng Quan & KPI",
      subLabel: "Data Analytics",
      icon: BarChart3,
      badge: "Live",
    },
    {
      id: "orders",
      label: "Quản Lý Đơn Hàng",
      subLabel: "Order Center",
      icon: Package,
      badge: "Realtime",
    },
    {
      id: "supply-chain",
      label: "Nhập Lưới & Sản Xuất",
      subLabel: "Supply Chain ERP",
      icon: Anchor,
      badge: "Khép kín",
    },
    {
      id: "catalog",
      label: "Bộ Sưu Tập & Bài Đăng",
      subLabel: "3D & Brand CMS",
      icon: BookOpen,
      badge: "CMS 3D",
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#071326]/95 backdrop-blur-xl text-white border-b border-sky-900/40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <Link href="/admin?tab=dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400/20 to-sky-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center font-bold text-sm shadow-inner group-hover:scale-105 transition-all">
              <Anchor className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide text-white group-hover:text-teal-300 transition-colors">
                  NÉT WORKSHOP OS
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Cloud Live
                </span>
              </div>
              <div className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                Hệ điều hành quản trị chuỗi thời trang tuần hoàn & thương mại số
              </div>
            </div>
          </Link>
        </div>

        {/* Center: 4 Modular Tabs */}
        {!isLoginPage && isAdminAuthenticated && (
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-700/70 shadow-inner">
            {navModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-md font-bold scale-[1.02]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-teal-200" : "text-slate-400"}`} />
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
              className={`p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-teal-300 hover:border-teal-500/40 transition-all ${
                isRefreshing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-teal-400" : ""}`} />
            </button>
          )}

          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            <span>Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {!isLoginPage && isAdminAuthenticated && (
            <button
              onClick={handleAdminLogout}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
              title="Đăng xuất quản trị"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      {!isLoginPage && isAdminAuthenticated && (
        <div className="lg:hidden flex items-center gap-1 px-3 py-2 bg-slate-900/95 border-t border-slate-800 overflow-x-auto">
          {navModules.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  isActive
                    ? "bg-teal-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
