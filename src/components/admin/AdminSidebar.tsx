"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminRole, getAdminRole, setAdminRole } from "@/lib/adminDataStorage";

export interface NavItem {
  id: string;
  label: string;
  badge?: number | string;
  badgeColor?: string;
}

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isDirty?: boolean; // Cảnh báo khi đang nhập dữ liệu dở dang (Req 1)
  onOpenSandbox?: () => void; // Mở khu vực thử nghiệm (Req 26)
  pendingOrdersCount?: number;
  quotesNeededCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  isDirty = false,
  onOpenSandbox,
  pendingOrdersCount = 0,
  quotesNeededCount = 0,
}) => {
  const [currentRole, setCurrentRoleState] = useState<AdminRole>(() => getAdminRole());

  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "Tổng quan",
    },
    {
      id: "orders",
      label: "Đơn hàng",
      badge: pendingOrdersCount + quotesNeededCount > 0 ? pendingOrdersCount + quotesNeededCount : undefined,
      badgeColor: "bg-[#C85A32] text-white",
    },
    {
      id: "products",
      label: "Sản phẩm & charm",
    },
    {
      id: "net-passport",
      label: "Lưới & Passport",
    },
    {
      id: "partners",
      label: "Đối tác",
    },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === activeTab) return;
    if (isDirty) {
      const confirmLeave = window.confirm(
        "Bạn đang có dữ liệu chưa lưu! Rời khỏi trang này có thể làm mất thông tin đang nhập. Bạn có chắc chắn muốn chuyển mục không?"
      );
      if (!confirmLeave) return;
    }
    onSelectTab(tabId);
  };

  const handleRoleChange = (newRole: AdminRole) => {
    setAdminRole(newRole);
    setCurrentRoleState(newRole);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("net_admin_authenticated");
      localStorage.removeItem("net_admin_session");
      window.location.href = "/admin/login";
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-[#241B16] text-[#FAF7F2] border-r border-[#3A2E27] min-h-screen flex flex-col justify-between">
      {/* 1. Header & Brand */}
      <div>
        <div className="p-4 border-b border-[#3A2E27] flex items-center justify-between">
          <Link href="/admin?tab=overview" className="flex items-center gap-2.5">
            <div className="h-8 px-2 rounded-lg bg-[#352720] border border-[#4A3B32] flex items-center justify-center">
              <Image
                src="/assets/logo-nets-white.png"
                alt="NÉT"
                width={50}
                height={20}
                className="h-4 w-auto object-contain"
              />
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-white tracking-wide">
                NÉT WORKSHOP
              </div>
              <div className="text-[10px] text-[#A89C93] font-sans">
                Quản trị xưởng & thương mại
              </div>
            </div>
          </Link>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Hệ thống trực tuyến" />
        </div>

        {/* 2. Menu Dọc (Req 1) */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8C7D73] uppercase tracking-wider">
            Phân hệ vận hành
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? "bg-[#C85A32] text-white shadow-sm font-semibold"
                    : "text-[#D6CCC2] hover:bg-[#33261F] hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || "bg-[#3D2E25] text-stone-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Footer: Phân quyền & Khu vực thử nghiệm (Req 25, 26) */}
      <div className="p-3 border-t border-[#3A2E27] space-y-2 text-xs">
        {/* Phân quyền (Req 25) */}
        <div className="bg-[#1C1511] p-2.5 rounded-lg border border-[#33261F]">
          <div className="text-[10px] text-[#8C7D73] font-medium mb-1">Vai trò thao tác:</div>
          <select
            value={currentRole}
            onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
            className="w-full bg-[#2A1F19] text-[#FAF7F2] border border-[#44332A] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#C85A32]"
          >
            <option value="admin">Quản trị viên (Toàn quyền)</option>
            <option value="orders_staff">Phụ trách đơn hàng</option>
            <option value="warehouse_staff">Thủ kho & Xưởng may</option>
          </select>
        </div>

        {/* Nút Sandbox (Req 26) */}
        {onOpenSandbox && (
          <button
            type="button"
            onClick={onOpenSandbox}
            className="w-full text-left px-2.5 py-1.5 rounded text-[11px] text-[#A89C93] hover:text-[#FAF7F2] hover:bg-[#33261F] transition-colors flex items-center justify-between"
          >
            <span>⚙️ Khu vực thử nghiệm</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">Dev</span>
          </button>
        )}

        {/* Nút Xem trang khách & Đăng xuất */}
        <div className="pt-1 flex items-center justify-between text-[#8C7D73] px-1 text-[11px]">
          <Link href="/" target="_blank" className="hover:text-white transition-colors">
            ↗ Web khách
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="hover:text-red-400 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
};
