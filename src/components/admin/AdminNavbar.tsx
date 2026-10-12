"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Anchor,
  Package,
  Layers,
  LogOut,
  ExternalLink,
  BarChart3,
  Hammer,
  QrCode,
  Lock,
  Boxes,
} from "lucide-react";

export const AdminNavbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("analytics");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuthed = localStorage.getItem("net_admin_authenticated") === "true";
      setIsAdminAuthenticated(isAuthed);
      const params = new URLSearchParams(window.location.search);
      setCurrentTab(params.get("tab") || "analytics");
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

  const navItems = [
    { id: "analytics", label: "Thống Kê", icon: BarChart3, badge: "Tổng quan" },
    { id: "net-packs", label: "1. Nhập Lưới", icon: Anchor, badge: "Nguyên liệu" },
    { id: "manufacturing", label: "2. Chế Tạo", icon: Hammer, badge: "Cấp Serial" },
    { id: "inventory", label: "3. Thành Phẩm", icon: Boxes, badge: "Passport QR" },
    { id: "orders", label: "4. Đơn Hàng", icon: Package, badge: "Xuất kho" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#071326]/95 backdrop-blur-xl text-white border-b border-sky-900/40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Internal Admin Brand */}
        <div className="flex items-center gap-3">
          <Link href="/admin?tab=analytics" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center font-bold text-sm shadow-inner group-hover:bg-teal-500/30 transition-colors">
              <Anchor className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white group-hover:text-teal-300 transition-colors">
                  NÉT WORKSHOP OS
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30 uppercase">
                  Chuỗi Cung Ứng
                </span>
              </div>
              <div className="text-[10px] text-slate-400 -mt-0.5">
                Quy trình khép kín: Nhập Kiện → Chế Tạo → Cấp Serial → Gán Đơn
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Module Switcher (Only if authenticated & not login page) */}
        {!isLoginPage && isAdminAuthenticated && (
          <nav className="hidden xl:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/70 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={`/admin?tab=${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-md font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Actions: Public Store Preview & Logout */}
        <div className="flex items-center gap-2.5">
          {/* Quick link to Sea Chart / Passport */}
          <Link
            href="/passport"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-300 bg-teal-950/40 hover:bg-teal-900/50 border border-teal-700/40 transition-all"
            title="Mở cổng Hải đồ Passport để kiểm tra quét mã QR thực tế"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Hải Đồ Passport ↗</span>
          </Link>

          {/* Public Store Preview Button */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-sm"
            title="Quay lại giao diện dành cho khách hàng"
          >
            <span className="hidden sm:inline">Web Khách</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {!isLoginPage && isAdminAuthenticated && (
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition-all"
              title="Đăng xuất khỏi phiên làm việc quản trị"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          )}

          {isLoginPage && (
            <div className="text-xs font-mono text-amber-300/90 bg-amber-950/30 px-3 py-1 rounded-xl border border-amber-800/40 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Bảo Mật</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
