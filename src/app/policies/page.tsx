"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import {
  ShieldCheck,
  RefreshCw,
  Truck,
  Lock,
  Building2,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState<
    "warranty" | "shipping" | "privacy" | "terms" | "company"
  >("warranty");

  return (
    <div className="relative min-h-screen bg-[#071326] text-slate-100">
      <OceanBackdrop bubbleCount={20} causticsOpacity={0.3} />

      <div className="pt-28 pb-20 px-4 sm:px-8 max-w-6xl mx-auto space-y-10 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 text-teal-300 text-xs font-bold uppercase tracking-[0.2em] border border-teal-500/40 shadow-md">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>MINH BẠCH & PHÁP LÝ THƯƠNG MẠI ĐIỆN TỬ</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Chính Sách & Điều Khoản Hoạt Động
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Hệ thống quy chuẩn vận hành, bảo hành điện tử chính hãng và cam kết bảo vệ quyền lợi người tiêu dùng theo quy định của Bộ Công Thương Việt Nam.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-sky-800/60 max-w-4xl mx-auto">
          {[
            { id: "warranty", label: "Bảo Hành Điện Tử & Đổi Trả", icon: RefreshCw },
            { id: "shipping", label: "Kiểm Hàng & Vận Chuyển", icon: Truck },
            { id: "privacy", label: "Bảo Mật Thông Tin", icon: Lock },
            { id: "terms", label: "Điều Khoản Dịch Vụ", icon: FileText },
            { id: "company", label: "Pháp Nhân & Liên Hệ", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-teal-500 text-slate-950 shadow-lg scale-102"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="bg-slate-900/80 border border-sky-800/60 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xl">
          {/* TAB 1: WARRANTY & RETURN */}
          {activeTab === "warranty" && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
                  <RefreshCw className="w-6 h-6 text-teal-400" />
                  <span>Chính Sách Bảo Hành Điện Tử & Đổi Trả Hàng</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Áp dụng cho toàn bộ sản phẩm túi may từ lưới ma và charm trang sức độc bản của NÉT.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>1. Bảo hành điện tử 24 tháng qua Hệ thống Định danh số</span>
                  </h3>
                  <p>
                    Mỗi chiếc túi xuất xưởng được cấp một mã căn cước số duy nhất (Serial ID) liên kết trực tiếp với dữ liệu mẻ lưới trục vớt. Khi nhận hàng và xác nhận giao nhận 2 chiều trên trang Cá Nhân, khách hàng sẽ kích hoạt bảo hành điện tử 24 tháng chính hãng được lưu trữ vĩnh viễn trên hệ thống.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li>Miễn phí sửa chữa các lỗi bung chỉ đan, đứt quai, rách mắt lưới tự nhiên do lỗi chế tác.</li>
                    <li>Miễn phí làm mới bề mặt sợi lưới và đánh bóng charm kim loại 01 lần/năm.</li>
                    <li>Hỗ trợ thay thế linh kiện khóa kéo YKK chính hãng trọn đời sản phẩm.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>2. Chính sách đổi trả trong vòng 07 ngày</span>
                  </h3>
                  <p>
                    Quý khách được quyền đổi sang mẫu mã khác hoặc hoàn tiền 100% trong vòng 07 ngày kể từ thời điểm nhận hàng nếu:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li>Sản phẩm không đúng kích thước, màu sắc hoặc charm như bản vẽ đã đặt trên Nét Lab 3D Studio.</li>
                    <li>Sản phẩm bị lỗi vật lý khi mở hộp (rách lưới, gãy charm, hỏng khóa).</li>
                    <li>Sản phẩm còn nguyên tem may lót Barcode 128 và chưa bị tác động tiêu cực bên ngoài.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-700/50 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>
                    Bạn cần hỗ trợ bảo hành hoặc đổi sản phẩm? Hãy liên hệ hotline hỗ trợ kỹ thuật xưởng:
                  </span>
                </div>
                <a
                  href="tel:1900882119"
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors shrink-0"
                >
                  Gọi 1900 882 119
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: SHIPPING & INSPECTION */}
          {activeTab === "shipping" && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
                  <Truck className="w-6 h-6 text-sky-400" />
                  <span>Chính Sách Kiểm Hàng (Đồng Kiểm COD) & Vận Chuyển</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Đảm bảo minh bạch 100%, khách hàng kiểm tra ưng ý mới thanh toán.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-sky-300">Quyền Đồng Kiểm Khi Nhận</h3>
                  <p>
                    Quý khách được quyền mở hộp kiểm tra ngoại quan sản phẩm, kiểm tra số lượng charm và kiểm tra tem căn cước số trước khi thanh toán cho nhân viên giao hàng (Shipper).
                  </p>
                  <p className="text-slate-400">
                    Nếu phát hiện lỗi hoặc không đúng như thiết kế 3D, quý khách có quyền từ chối nhận hàng mà không mất bất kỳ khoản phí nào.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-sky-300">Biểu Phí Vận Chuyển</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span>Nội thành Đà Nẵng:</span>
                      <strong className="text-emerald-400">20.000 VNĐ</strong>
                    </li>
                    <li className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span>Toàn quốc tiêu chuẩn:</span>
                      <strong className="text-emerald-400">35.000 VNĐ</strong>
                    </li>
                    <li className="flex items-center justify-between pt-1">
                      <span>Đơn hàng từ 1.500.000đ:</span>
                      <strong className="text-teal-300 font-bold">MIỄN PHÍ SHIP</strong>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-sky-300">Thời Gian Giao Hàng</h3>
                  <ul className="space-y-2 text-slate-400">
                    <li>
                      <strong className="text-white">Đà Nẵng & miền Trung:</strong> 1 - 2 ngày làm việc.
                    </li>
                    <li>
                      <strong className="text-white">Hà Nội & TP. Hồ Chí Minh:</strong> 2 - 3 ngày làm việc.
                    </li>
                    <li>
                      <strong className="text-white">Các tỉnh thành khác:</strong> 3 - 4 ngày làm việc.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
                  <Lock className="w-6 h-6 text-teal-400" />
                  <span>Chính Sách Bảo Mật Thông Tin Cá Nhân</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân tại Việt Nam.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h3 className="text-sm font-bold text-white">1. Mục đích thu thập dữ liệu</h3>
                  <p>
                    NÉT chỉ thu thập Họ tên, Số điện thoại, Địa chỉ giao hàng và Email nhằm mục đích: Xác nhận đơn hàng, giao nhận vận chuyển, kích hoạt chứng chỉ bảo hành điện tử chính hãng và gửi thông báo tác động sinh thái cứu hộ rác biển.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h3 className="text-sm font-bold text-white">2. Phạm vi sử dụng & Bảo mật</h3>
                  <p>
                    Thông tin của quý khách được mã hóa SSL 256-bit và lưu trữ trên máy chủ đám mây Google Cloud / Firebase. NÉT cam kết tuyệt đối không bán, chia sẻ hoặc tiết lộ thông tin cá nhân của quý khách cho bên thứ ba vì bất kỳ mục đích thương mại nào khác.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h3 className="text-sm font-bold text-white">3. Quyền của khách hàng đối với dữ liệu</h3>
                  <p>
                    Quý khách có toàn quyền yêu cầu tra cứu, điều chỉnh hoặc hủy bỏ thông tin cá nhân của mình trong cơ sở dữ liệu bất cứ lúc nào bằng cách gửi yêu cầu tới email <code className="text-teal-300 font-mono">privacy@net.eco</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
                  <FileText className="w-6 h-6 text-sky-400" />
                  <span>Điều Khoản Dịch Vụ & Sở Hữu Trí Tuệ</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Các điều khoản ràng buộc khi sử dụng dịch vụ NÉT Eco Net Craft.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  Mọi thiết kế mô hình 3D túi xách, kiểu dáng đan lưới may thủ công, charm biểu tượng văn hóa biển và hệ thống mã hóa định danh độc bản trên nền tảng NÉT thuộc quyền sở hữu trí tuệ độc quyền của Công ty TNHH Sáng Tạo Sinh Thái NÉT.
                </p>
                <p>
                  Khách hàng khi đặt túi có quyền sở hữu vật lý và chứng chỉ tác động số đi kèm. Nghiêm cấm mọi hành vi sao chép công nghệ định danh số hoặc làm giả tem dệt may Barcode 128 của thương hiệu.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: COMPANY INFO */}
          {activeTab === "company" && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                  <span>Thông Tin Pháp Nhân Doanh Nghiệp & Liên Hệ</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Đơn vị chủ quản và chịu trách nhiệm pháp lý của website thương mại điện tử NÉT.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    CÔNG TY TNHH SÁNG TẠO SINH THÁI NÉT
                  </h3>
                  <div className="space-y-2 text-slate-300">
                    <div>
                      <strong>Tên giao dịch quốc tế:</strong> NET OCEAN ECO-CRAFT CO., LTD
                    </div>
                    <div>
                      <strong>Mã số doanh nghiệp (MST):</strong> 0402189882
                    </div>
                    <div>
                      <strong>Cơ quan cấp:</strong> Sở Kế hoạch và Đầu tư Thành phố Đà Nẵng
                    </div>
                    <div>
                      <strong>Lĩnh vực:</strong> Sản xuất thời trang tuần hoàn, phụ kiện thủ công từ vật liệu đại dương tái sinh.
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    KÊNH HỖ TRỢ KHÁCH HÀNG 24/7
                  </h3>
                  <div className="space-y-2.5 text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Xưởng Nét Studio: Lô 14 Bãi Bụt, Bán Đảo Sơn Trà, TP. Đà Nẵng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Hotline chăm sóc khách hàng: 1900 882 119 (8:00 - 21:00)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Email tiếp nhận thông tin: contact@net.eco | donhang@net.eco</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
