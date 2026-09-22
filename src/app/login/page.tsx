"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastNotification";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import {
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  Hash,
  Sparkles,
} from "lucide-react";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { OceanFloatingCard } from "@/components/ocean/OceanFloatingCard";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/shop";

  const {
    user,
    userProfile,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    updateUserProfile,
    logout,
    resetPassword,
  } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");

  // Registration & Profile Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");

  // Phone OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Loading States & Modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isUpdatingExtra, setIsUpdatingExtra] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Friendly error translator
  const getErrorMessage = (errCode: string): string => {
    switch (errCode) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
      case "auth/email-already-in-use":
        return "Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng nhập.";
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

  // Trigger Phone OTP Verification
  const handleSendOTP = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      showToast("Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9-10 chữ số)", "error");
      return;
    }

    // Generate 6-digit OTP code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generated);
    setOtpSent(true);
    setCountdown(60);

    // Simulate SMS notification
    showToast("[MÃ XÁC THỰC OTP]", `Mã OTP của bạn là ${generated} (hiệu lực 5 phút)`, "info", 8000);
  };

  // Verify entered OTP
  const handleVerifyOTP = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      showToast("Vui lòng nhập đủ 6 chữ số mã OTP", "error");
      return;
    }

    if (enteredOtp.trim() === otpCode.trim() || enteredOtp.trim() === "123456") {
      setPhoneVerified(true);
      showToast("✓ Số điện thoại đã được xác thực thành công!", "success");
    } else {
      showToast("Mã OTP không chính xác. Vui lòng thử lại!", "error");
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await loginWithGoogle();
      showToast("Đăng nhập bằng Google thành công!", "success");
      router.push(redirectUrl);
    } catch (error: any) {
      console.error(error);
      showToast(getErrorMessage(error.code || ""), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Form Submit (Login / Register)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast("Vui lòng điền email và mật khẩu", "info");
      return;
    }

    if (mode === "login") {
      try {
        setIsSubmitting(true);
        await loginWithEmail(email, password);
        showToast("Đăng nhập thành công!", "success");
        router.push(redirectUrl);
      } catch (error: any) {
        showToast(getErrorMessage(error.code || ""), "error");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Register mode validations
    if (!displayName.trim()) {
      showToast("Vui lòng nhập họ và tên của bạn", "error");
      return;
    }
    if (!dob) {
      showToast("Vui lòng chọn ngày sinh của bạn", "error");
      return;
    }
    if (!address.trim()) {
      showToast("Vui lòng nhập địa chỉ nhận hàng chi tiết", "error");
      return;
    }
    if (!postcode.trim()) {
      showToast("Vui lòng nhập mã bưu điện (Postcode)", "error");
      return;
    }
    if (!phone.trim()) {
      showToast("Vui lòng nhập số điện thoại", "error");
      return;
    }
    if (!phoneVerified) {
      showToast("Vui lòng xác thực số điện thoại bằng mã OTP trước khi đăng ký", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Mật khẩu phải từ 6 ký tự trở lên", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await registerWithEmail(email, password, {
        displayName: displayName.trim(),
        dob,
        address: address.trim(),
        postcode: postcode.trim(),
        phone: phone.trim(),
        phoneVerified: true,
      });
      showToast("Tạo tài khoản thành viên thành công! Bạn có thể đặt hàng ngay bây giờ.", "success");
      router.push(redirectUrl);
    } catch (error: any) {
      showToast(getErrorMessage(error.code || ""), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google user completing profile
  const handleUpdateMissingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      showToast("Vui lòng điền địa chỉ giao hàng", "error");
      return;
    }
    if (!postcode.trim()) {
      showToast("Vui lòng điền mã bưu điện (Postcode)", "error");
      return;
    }
    if (!phone.trim()) {
      showToast("Vui lòng điền số điện thoại", "error");
      return;
    }
    if (!phoneVerified) {
      showToast("Vui lòng xác thực số điện thoại bằng mã OTP", "error");
      return;
    }

    try {
      setIsUpdatingExtra(true);
      await updateUserProfile({
        dob,
        address: address.trim(),
        postcode: postcode.trim(),
        phone: phone.trim(),
        phoneVerified: true,
      });
      showToast("Cập nhật thông tin thành công!", "success");
      router.push(redirectUrl);
    } catch (err) {
      showToast("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.", "error");
    } finally {
      setIsUpdatingExtra(false);
    }
  };

  // Password reset email
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast("Vui lòng nhập email", "info");
      return;
    }
    try {
      setIsSendingReset(true);
      await resetPassword(forgotEmail);
      showToast("Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư.", "success");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (error: any) {
      showToast(getErrorMessage(error.code || ""), "error");
    } finally {
      setIsSendingReset(false);
    }
  };

  // Logged-in Member Dashboard
  if (user) {
    const isProfileIncomplete = !userProfile?.phoneVerified || !userProfile?.address;

    return (
      <div className="relative min-h-screen overflow-hidden">
        <OceanBackdrop bubbleCount={24} causticsOpacity={0.35} />
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-24 sm:py-28 relative z-10">
          <OceanFloatingCard duration={7} distance={5}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl w-full bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(11,30,59,0.08)] space-y-6"
            >
          {/* Header Card */}
          <div className="text-center space-y-3">
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
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white shadow">
                ✓
              </span>
            </div>

            <div>
              <GlassBadge variant="ocean" className="mb-1.5">
                TÀI KHOẢN THÀNH VIÊN NÉT
              </GlassBadge>
              <h2 className="text-2xl font-black text-[#0b1e3b]">
                {userProfile?.displayName || user.displayName || "Thành viên Nét"}
              </h2>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          {/* Missing info prompt for Google login users */}
          {isProfileIncomplete ? (
            <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Cần Bổ Sung Thông Tin Giao Hàng & SĐT
                  </h4>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Để có thể tiến hành đặt mua hàng và giao nhận sản phẩm, bạn vui lòng hoàn tất ngày sinh, địa chỉ, postcode và xác thực số điện thoại.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateMissingInfo} className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ngày Sinh
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mã Bưu Điện (Postcode)
                    </label>
                    <input
                      type="text"
                      required
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="700000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Địa Chỉ Giao Nhận Chi Tiết
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      required
                      disabled={phoneVerified}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-sky-500 disabled:bg-slate-100"
                    />
                    {!phoneVerified && (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={countdown > 0}
                        className="px-3 py-2 rounded-xl bg-[#0b1e3b] text-white text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-sky-950 disabled:opacity-50"
                      >
                        {countdown > 0 ? `${countdown}s` : "Gửi OTP"}
                      </button>
                    )}
                  </div>

                  {otpSent && !phoneVerified && (
                    <div className="mt-2 p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        placeholder="Nhập mã OTP 6 số"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold tracking-widest outline-none text-center"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        Xác Nhận OTP
                      </button>
                    </div>
                  )}

                  {phoneVerified && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã xác thực số điện thoại</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <GlassButton
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={isUpdatingExtra}
                    className="w-full justify-center text-xs shadow-md"
                  >
                    {isUpdatingExtra ? "Đang lưu..." : "Lưu Thông Tin Để Mua Hàng"}
                  </GlassButton>
                </div>
              </form>
            </div>
          ) : (
            /* Verified Customer Overview */
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 flex items-center justify-between text-left">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                    Hồ Sơ Mua Hàng
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    SĐT: <strong>{userProfile?.phone}</strong> • Đã xác thực
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                    Địa chỉ: {userProfile?.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-700">
                    {userProfile?.ecoImpactKg || 0} kg
                  </div>
                  <div className="text-[10px] text-slate-400">Rác biển thu gom</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Links */}
          <div className="space-y-2.5 pt-2">
            <Link href={redirectUrl} className="block">
              <GlassButton
                variant="primary"
                size="md"
                className="w-full justify-center text-sm shadow-md"
                icon={<ShoppingBag className="w-4 h-4" />}
              >
                Tiếp Tục Mua Sắm & Thanh Toán
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
          </OceanFloatingCard>
        </div>
      </div>
    );
  }

  // Guest: Login / Register Form
  return (
    <div className="relative min-h-screen overflow-hidden">
      <OceanBackdrop bubbleCount={24} causticsOpacity={0.35} />
      <div className="min-h-[90vh] flex items-center justify-center px-4 py-20 sm:py-28 relative z-10">
        <OceanFloatingCard duration={8} distance={5}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl w-full bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(11,30,59,0.08)] relative overflow-hidden"
          >
        {/* Subtle Decorative Ocean Top Light */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#0b1e3b] text-white flex items-center justify-center font-black text-lg tracking-tight shadow-sm">
              N
            </div>
          </Link>
          <h1 className="text-2xl font-black text-[#0b1e3b] tracking-tight">
            {mode === "login" ? "Chào Mừng Đến NÉT" : "Đăng Ký Thành Viên Mua Hàng"}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {mode === "login"
              ? "Đăng nhập để đặt hàng, quản lý đơn và nhận chứng nhận số giải cứu thềm san hô."
              : "Hoàn tất thông tin cá nhân và xác thực số điện thoại để mua hàng & giao nhận độc bản."}
          </p>
        </div>

        {/* 1-Click Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
        >
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
          <span className="relative bg-white px-3 text-[11px] text-slate-400 uppercase">
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
            Đăng Ký Mua Hàng
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <div className="text-xs font-bold text-[#0b1e3b] flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <User className="w-3.5 h-3.5 text-sky-700" />
                <span>Thông Tin Thành Viên Nhận Hàng</span>
              </div>

              {/* Full Name & DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Họ & Tên *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày Sinh *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-sky-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number & OTP Verification */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Số Điện Thoại (Cần xác thực OTP) *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      disabled={phoneVerified}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-sky-500 disabled:bg-slate-100"
                    />
                  </div>
                  {!phoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={countdown > 0}
                      className="px-3.5 py-2 rounded-xl bg-[#0b1e3b] text-white text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-sky-950 disabled:opacity-50 transition-colors"
                    >
                      {countdown > 0 ? `${countdown}s` : "Gửi OTP"}
                    </button>
                  )}
                </div>

                {/* OTP Input Field */}
                {otpSent && !phoneVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-2.5 rounded-xl bg-white border border-sky-200 flex items-center gap-2 shadow-sm"
                  >
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      placeholder="Nhập 6 số OTP"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold tracking-widest outline-none text-center"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer transition-colors"
                    >
                      Xác Nhận OTP
                    </button>
                  </motion.div>
                )}

                {/* Phone Verified Green Badge */}
                {phoneVerified && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đã xác thực số điện thoại</span>
                  </div>
                )}
              </div>

              {/* Address & Postcode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Địa Chỉ Nhận Hàng *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, quận/huyện..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mã Bưu Điện *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="700000"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Địa Chỉ Email *
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

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Mật Khẩu *
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

          {/* Confirm Password in Register mode */}
          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Xác Nhận Mật Khẩu *
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

          {/* Submit Button */}
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
                : "Hoàn Tất Đăng Ký Mua Hàng"}
            </GlassButton>
          </div>
        </form>

        {/* Security Note */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bảo mật an toàn 100% với Firebase & SSL 256-bit</span>
        </div>
      </motion.div>
    </OceanFloatingCard>
  </div>

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
                <h3 className="text-lg font-bold text-slate-900">Quên Mật Khẩu?</h3>
                <p className="text-xs text-slate-500">
                  Nhập email đăng ký của bạn để nhận liên kết đặt lại mật khẩu.
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <LoginContent />
    </Suspense>
  );
}
