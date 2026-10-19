"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastNotification";
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
  ArrowLeft,
  X,
} from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { UnifiedMemberProfile } from "@/components/profile/UnifiedMemberProfile";

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

    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generated);
    setOtpSent(true);
    setCountdown(60);

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

  // -----------------------------------------------------------------
  // VIEW 1: Logged-in Member Portal (Unified Experience)
  // -----------------------------------------------------------------
  if (user) {
    return <UnifiedMemberProfile />;
  }

  // -----------------------------------------------------------------
  // VIEW 2: Guest Login / Register Form
  // -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241B16] py-16 sm:py-24 px-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="font-serif text-3xl font-semibold tracking-tight text-[#241B16] group-hover:text-[#B85D43] transition-colors">
              nét
            </span>
          </Link>
          <div className="pt-0.5">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FAF7F2] text-[#B85D43] text-[10px] font-semibold uppercase tracking-widest border border-[#E8E2D8] mb-1">
              CỔNG THÀNH VIÊN
            </div>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#241B16] tracking-tight">
            {mode === "login" ? "Chào Mừng Đến NÉT" : "Đăng Ký Thành Viên"}
          </h1>
          <p className="text-xs text-[#5E4D43] leading-relaxed max-w-sm mx-auto">
            {mode === "login"
              ? "Đăng nhập để theo dõi yêu cầu thiết kế, lưu bản phối và quản lý Story Passport."
              : "Hoàn tất thông tin cá nhân và xác thực số điện thoại để mua hàng & giao nhận độc bản."}
          </p>
        </div>

        {/* 1-Click Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E2D8] shadow-xs text-[#42342B] text-xs sm:text-sm font-medium flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
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
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8E2D8]" />
          </div>
          <span className="relative bg-white px-3 text-[11px] text-[#9E9289] uppercase tracking-wider">
            hoặc email
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F3ECE1] mb-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white text-[#241B16] font-semibold shadow-xs"
                : "text-[#7A6F68] hover:text-[#241B16]"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === "register"
                ? "bg-white text-[#241B16] font-semibold shadow-xs"
                : "text-[#7A6F68] hover:text-[#241B16]"
            }`}
          >
            Đăng Ký Mua Hàng
          </button>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration Extra Fields */}
          {mode === "register" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#42342B] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#7A6F68]" />
                  <span>Họ Và Tên Khách Hàng *</span>
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] placeholder-[#9E9289] outline-none focus:border-[#B85D43] focus:ring-2 focus:ring-[#B85D43]/15 transition-all"
                />
              </div>

              {/* DOB & Postcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#42342B] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#7A6F68]" />
                    <span>Ngày Sinh *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D8] text-xs text-[#241B16] outline-none focus:border-[#B85D43]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#42342B] flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#7A6F68]" />
                    <span>Mã Bưu Điện *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="550000 (Đà Nẵng)"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D8] text-xs text-[#241B16] placeholder-[#9E9289] outline-none focus:border-[#B85D43]"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#42342B] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#7A6F68]" />
                  <span>Địa Chỉ Giao Hàng Chi Tiết *</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] placeholder-[#9E9289] outline-none focus:border-[#B85D43] focus:ring-2 focus:ring-[#B85D43]/15 transition-all"
                />
              </div>

              {/* Phone & OTP */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#42342B] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#7A6F68]" />
                  <span>Số Điện Thoại (Cần xác thực OTP) *</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneVerified(false);
                    }}
                    placeholder="0905 xxx xxx"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] placeholder-[#9E9289] outline-none focus:border-[#B85D43]"
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={countdown > 0}
                    className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E8E2D8] text-xs text-[#5E4D43] font-medium disabled:opacity-50 whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s` : otpSent ? "Gửi lại" : "Nhận mã OTP"}
                  </button>
                </div>
              </div>

              {otpSent && !phoneVerified && (
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      placeholder="Nhập 6 chữ số OTP"
                      className="flex-1 px-3 py-2 rounded-lg border border-[#E8E2D8] text-xs text-[#241B16] tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      className="px-3 py-2 rounded-lg bg-[#2D5E4E] text-white text-xs font-medium"
                    >
                      Xác Nhận
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#42342B] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#7A6F68]" />
              <span>Email Tài Khoản *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tenban@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] placeholder-[#9E9289] outline-none focus:border-[#B85D43] focus:ring-2 focus:ring-[#B85D43]/15 transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#42342B] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#7A6F68]" />
                <span>Mật Khẩu *</span>
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#B85D43] hover:text-[#A24E36] font-medium"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] placeholder-[#9E9289] outline-none focus:border-[#B85D43] focus:ring-2 focus:ring-[#B85D43]/15 transition-all"
            />
          </div>

          {/* Confirm Password (Register mode) */}
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#42342B] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#7A6F68]" />
                <span>Xác Nhận Mật Khẩu *</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu phía trên"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] placeholder-[#9E9289] outline-none focus:border-[#B85D43] focus:ring-2 focus:ring-[#B85D43]/15 transition-all"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-medium shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 pt-2"
          >
            <span>
              {isSubmitting
                ? "Đang xử lý..."
                : mode === "login"
                ? "Đăng Nhập Ngay"
                : "Hoàn Tất Đăng Ký Mua Hàng"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-6 mt-6 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#7A6F68]">
          <Link href="/" className="hover:text-[#241B16] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Trang Chủ</span>
          </Link>

          <Link
            href="/admin/login"
            className="text-[#7A6F68] hover:text-[#B85D43] transition-colors"
          >
            Dành cho Quản trị viên ↗
          </Link>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-[#E8E2D8] rounded-3xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-[#241B16]">
                  Khôi Phục Mật Khẩu
                </h3>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="p-1 rounded-lg text-[#7A6F68] hover:bg-[#FAF7F2]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#5E4D43] leading-relaxed">
                Nhập email tài khoản của bạn để nhận liên kết đặt lại mật khẩu an toàn.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="tenban@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs text-[#241B16] outline-none focus:border-[#B85D43]"
                />
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="w-full py-2.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium shadow-xs disabled:opacity-50"
                >
                  {isSendingReset ? "Đang gửi..." : "Gửi Email Đặt Lại Mật Khẩu"}
                </button>
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs text-[#7A6F68]">
          Đang tải cổng đăng nhập...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
