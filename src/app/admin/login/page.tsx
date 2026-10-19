"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/ToastNotification";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { updateUserProfile, user } = useAuth();

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1-Click Master Key for Pitch Demos
  const handleQuickDemoAdmin = () => {
    setAdminEmail("admin@net.eco");
    setMasterKey("NET-OCEAN-ADMIN-2024");
    authenticateAdmin("NET-OCEAN-ADMIN-2024");
  };

  const authenticateAdmin = (keyToTest?: string) => {
    setIsSubmitting(true);
    const key = keyToTest || masterKey.trim();

    // Verification check (Accepts master key or admin email/pass)
    const isValidMasterKey =
      key.toUpperCase() === "NET-OCEAN-ADMIN-2024" ||
      key.toLowerCase() === "net-admin" ||
      key === "123456";

    const isValidCredentials =
      adminEmail.toLowerCase().includes("admin") && adminPassword.length >= 6;

    if (isValidMasterKey || isValidCredentials) {
      if (typeof window !== "undefined") {
        localStorage.setItem("net_admin_authenticated", "true");
        localStorage.setItem(
          "net_admin_session",
          JSON.stringify({
            adminEmail: adminEmail || "admin@net.eco",
            role: "admin",
            loginTime: new Date().toISOString(),
          })
        );
      }

      if (user) {
        updateUserProfile({ role: "admin" }).catch(() => {});
      }

      showToast("Xác thực Quản trị viên thành công!", "success");
      setTimeout(() => {
        router.push("/admin?tab=dashboard");
      }, 400);
    } else {
      setIsSubmitting(false);
      showToast(
        "Mã bảo mật Quản trị viên không chính xác. Bạn có thể sử dụng nút 'Nạp Khóa Demo' bên dưới.",
        "error"
      );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authenticateAdmin();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241B16] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2D8] shadow-sm space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FAF7F2] text-[#B85D43] text-[10px] font-semibold uppercase tracking-widest border border-[#E8E2D8]">
              CỔNG QUẢN TRỊ VIÊN & XƯỞNG
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#241B16] tracking-tight">
              NÉT Workshop OS
            </h1>
            <p className="text-xs text-[#5E4D43] mt-1 leading-relaxed">
              Điều phối chuỗi cung ứng, nhập lô lưới biển Nam Ô và xử lý yêu cầu thiết kế Nét Studio.
            </p>
          </div>

          {/* Quick Demo Preset Trigger */}
          <div className="p-3.5 rounded-2xl bg-[#FDF9F0] border border-[#F3E2C4] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">DEMO</span>
              <span className="text-[#5E4D43] font-medium">Trình diễn pitch & kiểm thử:</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="px-3 py-1.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-[11px] font-medium shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              Nạp Khóa Demo
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#42342B] flex items-center justify-between">
                <span>Mã Khóa Bảo Mật (Master Passkey)</span>
                <span className="text-[10px] font-mono text-[#8F8177]">NET-OCEAN-ADMIN-2024</span>
              </label>
              <input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="NET-OCEAN-ADMIN-2024 hoặc 123456"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-sm text-[#241B16] placeholder-[#9E9289] focus:outline-none focus:border-[#B85D43] focus:ring-2 focus:ring-[#B85D43]/15 transition-all"
              />
            </div>

            <div className="relative flex items-center justify-center py-1">
              <div className="border-t border-[#E8E2D8] w-full" />
              <span className="bg-white px-3 text-[10px] text-[#9E9289] uppercase tracking-widest absolute">
                HOẶC TÀI KHOẢN EMAIL
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#42342B] block">
                Email Quản Trị
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@net.eco"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-sm text-[#241B16] placeholder-[#9E9289] focus:outline-none focus:border-[#B85D43] focus:ring-2 focus:ring-[#B85D43]/15 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#42342B] block">
                Mật Khẩu
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-sm text-[#241B16] placeholder-[#9E9289] focus:outline-none focus:border-[#B85D43] focus:ring-2 focus:ring-[#B85D43]/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-medium shadow-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              <span>{isSubmitting ? "Đang xác thực..." : "Xác Thực & Vào Bảng Quản Trị"}</span>
            </button>
          </form>

          {/* Navigation links */}
          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#7A6F68]">
            <Link
              href="/"
              className="hover:text-[#241B16] transition-colors"
            >
              ← Về Trang Chủ
            </Link>

            <Link
              href="/login"
              className="text-[#B85D43] hover:text-[#A24E36] font-medium transition-colors"
            >
              Cổng Khách Hàng →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
