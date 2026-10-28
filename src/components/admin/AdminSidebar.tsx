"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminRole } from "@/lib/adminDataStorage";

export interface NavItem {
  id: string;
  label: string;
  badge?: number | string;
  badgeColor?: string;
}

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  currentRole: AdminRole;
  onRoleChange: (newRole: AdminRole) => void;
  isDirty?: boolean;
  onOpenSandbox?: () => void;
  pendingOrdersCount?: number;
  quotesNeededCount?: number;
}

// Danh sách quyền hạn chuẩn xác cho từng vai trò (Role-based Access Control)
export const ALLOWED_TABS_BY_ROLE: Record<AdminRole, string[]> = {
  admin: ["overview", "orders", "products", "net-passport", "partners"],
  orders_staff: ["overview", "orders", "partners"], // Chỉ thấy Đơn hàng & Đối tác
  warehouse_staff: ["overview", "products", "net-passport"], // Chỉ thấy Sản phẩm, Kho lưới & Sản xuất
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  onRoleChange,
  isDirty = false,
  onOpenSandbox,
  pendingOrdersCount = 0,
  quotesNeededCount = 0,
}) => {
  const allNavItems: NavItem[] = [
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

  // Lọc chỉ hiển thị các menu thuộc phạm vi nhiệm vụ của role hiện tại (Req Role-based)
  const allowedTabs = ALLOWED_TABS_BY_ROLE[currentRole] || ALLOWED_TABS_BY_ROLE.admin;
  const filteredNavItems = allNavItems.filter((item) => allowedTabs.includes(item.id));

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

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("net_admin_authenticated");
      localStorage.removeItem("net_admin_session");
      window.location.href = "/admin/login";
    }
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-[#F5F0E8] text-[#2A2521] border-r border-[#E2D8C7] min-h-screen flex flex-col justify-between select-none">
      {/* 1. Header & Brand (Màu kem sáng, thanh lịch) */}
      <div>
        <div className="p-3.5 border-b border-[#E2D8C7] flex items-center justify-between bg-[#ECE5D8]">
          <Link href="/admin?tab=overview" className="flex items-center gap-2">
            <div className="h-7 px-2 rounded-md bg-white border border-[#DFD5C4] flex items-center justify-center shadow-xs">
              <Image
                src="/assets/logo-nets.png"
                alt="NÉT"
                width={46}
                height={18}
                className="h-3.5 w-auto object-contain"
              />
            </div>
            <div>
              <div className="font-serif font-bold text-xs text-[#2A2521] tracking-wide leading-tight">
                NÉT WORKSHOP
              </div>
              <div className="text-[9px] text-[#7A6E65] font-sans">
                Cổng quản trị nội bộ
              </div>
            </div>
          </Link>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Hệ thống trực tuyến" />
        </div>

        {/* 2. Menu Dọc - Lọc theo nhiệm vụ Role */}
        <nav className="p-2.5 space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8C7D73] uppercase tracking-wider">
            {currentRole === "admin"
              ? "Toàn bộ phân hệ"
              : currentRole === "orders_staff"
              ? "Nhiệm vụ đơn hàng"
              : "Nhiệm vụ kho & xưởng"}
          </div>

          {filteredNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? "bg-[#C85A32] text-white shadow-xs font-semibold"
                    : "text-[#4A3F37] hover:bg-[#EAE2D3] hover:text-[#1F1916]"
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : item.badgeColor || "bg-[#DFD5C4] text-[#4A3F37]"
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

      {/* 3. Footer: Phân quyền & Khu vực thử nghiệm */}
      <div className="p-2.5 border-t border-[#E2D8C7] space-y-2 text-xs bg-[#EFE9DF]">
        {/* Hộp chọn vai trò (Role Switcher) */}
        <div className="bg-white p-2 rounded-lg border border-[#DFD5C4] shadow-2xs">
          <div className="text-[9px] text-[#7A6E65] font-semibold uppercase tracking-wider mb-1">
            Vai trò đang làm việc:
          </div>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as AdminRole)}
            className="w-full bg-[#FAF7F2] text-[#2A2521] border border-[#E2D8C7] rounded px-1.5 py-1 text-xs font-medium focus:outline-none focus:border-[#C85A32]"
          >
            <option value="admin">Quản trị viên (Toàn quyền)</option>
            <option value="orders_staff">Phụ trách đơn hàng</option>
            <option value="warehouse_staff">Thủ kho & Xưởng may</option>
          </select>
        </div>

        {/* Chỉ Quản trị viên mới được thấy Sandbox (Req Role) */}
        {currentRole === "admin" && onOpenSandbox && (
          <button
            type="button"
            onClick={onOpenSandbox}
            className="w-full text-left px-2 py-1.5 rounded text-[11px] text-[#7A6E65] hover:text-[#2A2521] hover:bg-[#E2D8C7] transition-colors flex items-center justify-between"
          >
            <span>⚙️ Khu vực thử nghiệm</span>
            <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 rounded font-mono">
              Dev
            </span>
          </button>
        )}

        {/* Nút Xem web & Đăng xuất */}
        <div className="pt-1 flex items-center justify-between text-[#7A6E65] px-1 text-[11px]">
          <Link href="/" target="_blank" className="hover:text-[#2A2521] transition-colors">
            ↗ Cửa hàng
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="hover:text-red-600 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
};
