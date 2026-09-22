"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastNotification";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShoppingBag,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, userProfile, loginWithGoogle, loginWithEmail, registerWithEmail, logout, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Friendly error translator
  const getErrorMessage = (errCode: string): string => {
    switch (errCode) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
      case "auth/email-already-in-use":
        return "Email này đã được đăng ký tài khoản. Vui lòng chuyển sang Đăng nhập.";
      case "auth/weak-password":
        return "Mật khẩu quá ngắn, vui lòng nhập tối thiểu 6 ký tự.";
      case "auth/invalid-email":
        return "Định dạng email không hợp lệ.";
      case "auth/popup-closed-by-user":
        return "Cửa sổ đăng nhập Google đã đóng.";
      default:
        return "Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.";
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await loginWithGoogle();
      showToast("Đăng nhập bằng Google thành công!", "success");
      router.push("/shop");
    } catch (error: any) {
      console.error(error);
      showToast(getErrorMessage(error.code || ""), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Vui lòng điền đầy đủ email và mật khẩu", "info");
      return;
    }

    if (mode === "register") {
      if (!displayName.trim()) {
        showToast("Vui lòng nhập họ tên của bạn", "info");
        return;
      }
      if (password.length < 6) {
        showToast("Mật khẩu phải từ 6 ký tự trở lên", "info");
        return;
      }
      if (password !== confirmPassword) {
        showToast("Mật khẩu xác nhận không khớp", "error");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (mode === "login") {
        await loginWithEmail(email, password);
        showToast("Đăng nhập thành công! Chào mừng bạn trở lại.", "success");
        router.push("/shop");
      } else {
        await registerWithEmail(email, password, displayName);
        showToast("Đăng ký tài khoản thành công!", "success");
        router.push("/shop");
      }
    } catch (error: any) {
      console.error(error);
      showToast(getErrorMessage(error.code || ""), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast("Vui lòng nhập email để nhận liên kết đặt lại mật khẩu", "info");
      return;
    }
    try {
      setIsSendingReset(true);
      await resetPassword(forgotEmail);
      showToast("Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư của bạn.", "success");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (error: any) {
      showToast(getErrorMessage(error.code || ""), "error");
    } finally {
      setIsSendingReset(false);
    }
  };

  // If user is already logged in, show Account Dashboard Overview
  if (user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-28 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-8 shadow-[0_20px_50px_rgba(11,30,59,0.08)] text-center space-y-6"
        >
          <div className="relative inline-block">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "Avatar"}
                className="w-20 h-20 rounded-full mx-auto border-2 border-sky-400 object-cover shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#0b1e3b] text-white text-2xl font-bold flex items-center justify-center mx-auto shadow-md">
                {(user.displayName || user.email || "N").charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white">
              ✓
            </span>
          </div>

          <div>
            <GlassBadge variant="ocean" className="mb-2">
              TÀI KHOẢN THÀNH VIÊN
            </GlassBadge>
            <h2 className="text-2xl font-black text-[#0b1e3b] font-serif">
              {userProfile?.displayName || user.displayName || "Thành viên Nét"}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">{user.email}</p>
          </div>

          {/* Eco Impact Stats */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 flex items-center justify-between text-left">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
                Tác Động Môi Trường
              </div>
              <div className="text-xs text-slate-600 mt-0.5">Lưới biển bạn đã góp phần thu gom</div>
            </div>
            <div className="text-xl font-black font-mono text-emerald-700">
              {userProfile?.ecoImpactKg || 0} kg
            </div>
          </div>

          {/* Action Links */}
          <div className="space-y-3 pt-2">
            <Link href="/shop" className="block">
              <GlassButton
                variant="primary"
                size="md"
                className="w-full justify-center text-sm shadow-md"
                icon={<ShoppingBag className="w-4 h-4" />}
              >
                Tiếp Tục Mua Sắm
              </GlassButton>
            </Link>

            <button
              onClick={async () => {
                await logout();
                showToast("Đã đăng xuất tài khoản an toàn.", "info");
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-24 sm:py-28 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/92 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(11,30,59,0.08)] relative overflow-hidden"
      >
        {/* Subtle Decorative Ocean Top Light */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#0b1e3b] text-white flex items-center justify-center font-black text-lg tracking-tight font-serif shadow-sm">
              N
            </div>
          </Link>
          <h1 className="text-2xl font-black text-[#0b1e3b] font-serif tracking-tight">
            {mode === "login" ? "Chào Mừng Đến NÉT" : "Đồng Hành Cùng Biển Xanh"}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {mode === "login"
              ? "Đăng nhập để theo dõi đơn hàng, túi 3D đã lưu và tích lũy điểm cứu rác biển."
              : "Tạo tài khoản để sở hữu các phiên bản túi lưới biển tái sinh độc bản của riêng bạn."}
          </p>
        </div>

        {/* 1-Click Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
        >
          {/* Google "G" logo */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-mono text-slate-400 uppercase">
            hoặc email
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white text-[#0b1e3b] shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === "register"
                ? "bg-white text-[#0b1e3b] shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Họ & Tên
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs sm:text-sm text-slate-900 transition-all bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs sm:text-sm text-slate-900 transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Mật Khẩu
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs sm:text-sm text-slate-900 transition-all bg-white"
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Xác Nhận Mật Khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs sm:text-sm text-slate-900 transition-all bg-white"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <GlassButton
              variant="primary"
              size="md"
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center text-xs sm:text-sm shadow-md cursor-pointer py-3"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting
                ? "Đang xử lý..."
                : mode === "login"
                ? "Đăng Nhập Ngay"
                : "Tạo Tài Khoản Mới"}
            </GlassButton>
          </div>
        </form>

        {/* Security & Sustainability Note */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bảo mật an toàn 100% với Firebase Auth & SSL</span>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-serif">Quên Mật Khẩu?</h3>
                <p className="text-xs text-slate-500">
                  Nhập email đăng ký của bạn. Chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu mới.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="tenban@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-sky-500"
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    Hủy
                  </button>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSendingReset}
                    className="flex-1 justify-center text-xs"
                  >
                    {isSendingReset ? "Đang gửi..." : "Gửi Email"}
                  </GlassButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
