"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { GlassButton } from "@/components/ui/GlassButton";
import { useToast } from "@/components/ui/ToastNotification";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Anchor,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
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
        router.push("/admin?tab=net-source");
      }, 500);
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
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <OceanBackdrop bubbleCount={20} causticsOpacity={0.35} />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-teal-500/30 shadow-[0_20px_70px_rgba(0,0,0,0.8)] space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0b1e3b] to-teal-700 border border-teal-400/40 mx-auto flex items-center justify-center text-teal-300 shadow-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-widest border border-teal-400/30">
              CỔNG QUẢN TRỊ VIÊN & XƯỞNG
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              NÉT Admin Portal
            </h2>
            <p className="text-xs text-slate-400">
              Khu vực dành riêng cho quản lý xưởng, nhập liệu lô lưới biển NÉT Source và điều phối gia công.
            </p>
          </div>

          {/* Quick Demo Preset Trigger */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span className="text-amber-200">Trình diễn pitch & kiểm thử:</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              Nạp Khóa Demo
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                <span>Mã Khóa Bảo Mật (Master Passkey)</span>
              </label>
              <input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="Nhập mã bảo mật quản trị (vd: NET-OCEAN-ADMIN-2024)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="relative flex items-center justify-center py-1">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-slate-900 px-2 text-[10px] text-slate-500 uppercase tracking-widest absolute">
                HOẶC TÀI KHOẢN EMAIL
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Quản Trị</span>
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@net.eco"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Mật Khẩu</span>
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            <GlassButton
              variant="primary"
              size="lg"
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center text-sm font-bold shadow-lg shadow-teal-900/30 mt-2"
            >
              {isSubmitting ? "Đang xác thực..." : "Xác Thực & Vào Bảng Quản Trị"}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </GlassButton>
          </form>

          {/* Switch to Customer Portal */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <Link
              href="/"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Trang Chủ</span>
            </Link>

            <Link
              href="/login"
              className="text-teal-300 hover:text-white font-semibold transition-colors"
            >
              Đến Cổng Khách Hàng
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
