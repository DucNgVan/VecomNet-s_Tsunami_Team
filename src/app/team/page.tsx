"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Waves,
  ArrowUpRight,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  X,
  Calendar,
  CheckCircle2,
  FileText,
  Target,
  Layers,
  Cpu,
  Leaf,
  Users,
  Activity,
  Zap,
} from "lucide-react";

/* ─────────────────────── Types & Data ─────────────────────── */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  subRole: string; // Only displayed in Detail Modal
  avatar: string;
  tagline: string;
  taskTitle: string;
  status: "Completed" | "In Progress" | "Not Yet";
  priority: "High" | "Medium" | "Low";
  startDate: string;
  endDate: string;
  linkText?: string;
  linkUrl?: string;
  badgeText: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentLight: string;
  accentGradient: string;
  skills: string[];
  quote: string;
  overview: string;
  detailedPoints: {
    category: string;
    items: string[];
  }[];
  deliverables?: string[];
  specialNote?: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: "thanh-huyen",
    name: "Trịnh Thanh Huyền",
    role: "Team Leader",
    subRole: "Quản Trị Dự Án & Chiến Lược Chuỗi Giá Trị",
    avatar: "/assets/team/trinh-thanh-huyen.jpg",
    tagline: "Gắn kết toàn diện mắt xích chuỗi giá trị tuần hoàn",
    taskTitle: "Quản lý tổng thể dự án & Điều phối chuỗi giá trị Nét",
    status: "In Progress",
    priority: "High",
    startDate: "08/10/2026",
    endDate: "23/10/2026",
    linkText: "Kế hoạch điều phối BDC 2026",
    linkUrl: "#",
    badgeText: "Leader & Orchestrator",
    accentColor: "text-amber-600",
    accentBg: "bg-amber-600",
    accentBorder: "border-amber-500",
    accentLight: "bg-amber-50",
    accentGradient: "from-amber-600 to-amber-700",
    skills: ["Team Leadership", "Project Management", "Ecosystem Strategy", "Stakeholder Alignment", "Public Pitching"],
    quote: "Sức mạnh của con tàu không nằm ở cánh buồm riêng lẻ, mà ở cách mọi mắt lưới cùng siết chặt vượt sóng lớn.",
    overview:
      "Chịu trách nhiệm lãnh đạo toàn diện dự án Nét — BDC 2026. Định hình tư duy cốt lõi: Digital không đơn thuần là công cụ bán túi xách, mà là hạ tầng kết nối trọn vẹn chuỗi giá trị bền vững từ ngư dân, xưởng sản xuất, đối tác du lịch đến khách hàng sau mua.",
    detailedPoints: [
      {
        category: "1. Định hướng & Quản trị dự án",
        items: [
          "Xây dựng kế hoạch tổng thể, lộ trình phát triển và kiểm soát tiến độ từng mốc milestone của toàn đội ngũ.",
          "Phân công, điều phối nhịp nhàng giữa 5 mảng: Kỹ thuật số, Nghiên cứu sản phẩm, Chiến lược thị trường, Xử lý vật liệu rác biển và Trải nghiệm khách hàng.",
          "Thiết lập mục tiêu đầu ra đảm bảo bám sát yêu cầu đề bài cuộc thi và tính khả thi trong thực tế.",
        ],
      },
      {
        category: "2. Kiến trúc chuỗi giá trị tuần hoàn",
        items: [
          "Mắt xích 1 — Người cung cấp lưới: Ngư dân & biệt đội trục vớt lưới ma tại các vùng biển miền Trung.",
          "Mắt xích 2 — Nét / Xưởng sản xuất: Quy chuẩn làm sạch, phân loại và đan dệt thủ công bản địa.",
          "Mắt xích 3 — Doanh nghiệp du lịch: Kênh liên kết tour, khách sạn/resort và điểm đến văn hóa.",
          "Mắt xích 4 — Khách du lịch: Người đồng sáng tạo món quà lưu niệm cá nhân hóa mang linh hồn biển cả.",
          "Mắt xích 5 — Dữ liệu sau mua: Tiếp tục nuôi dưỡng kết nối cảm xúc và lan tỏa tác động môi trường.",
        ],
      },
      {
        category: "3. Đại diện đối ngoại & Thuyết trình",
        items: [
          "Xây dựng câu chuyện thương hiệu (Brand Storytelling) nhất quán và truyền cảm hứng.",
          "Bảo vệ mô hình kinh doanh và giải trình tính bền vững của dự án trước Ban Giám Khảo và nhà đầu tư.",
        ],
      },
    ],
    deliverables: [
      "Bộ tài liệu Master Plan & Tiến độ dự án",
      "Sơ đồ chuỗi giá trị tuần hoàn (Circular Value Chain Map)",
      "Bộ kịch bản Pitching & Thuyết trình trước Hội đồng Giám khảo",
    ],
  },
  {
    id: "van-duc",
    name: "Nguyễn Văn Đức",
    role: "Full-stack Developer",
    subRole: "Kỹ Sư Phần Mềm (Frontend & Backend)",
    avatar: "/assets/team/nguyen-van-duc.jpg",
    tagline: "Hạ tầng số kết nối trọn vẹn chuỗi giá trị Nét",
    taskTitle: "Kiến trúc & Lập trình toàn diện hệ thống Digital (Front-end & Back-end)",
    status: "In Progress",
    priority: "High",
    startDate: "08/10/2026",
    endDate: "23/10/2026",
    linkText: "Hạ tầng Web & Monorepo Nét",
    linkUrl: "https://github.com",
    badgeText: "Full-stack Developer",
    accentColor: "text-[#B85D43]",
    accentBg: "bg-[#B85D43]",
    accentBorder: "border-[#B85D43]",
    accentLight: "bg-[#B85D43]/10",
    accentGradient: "from-[#B85D43] to-[#994730]",
    skills: ["Next.js 14 App Router", "Full-stack Monorepo", "Three.js & WebGL 3D", "Cloud Firestore & Serverless", "Framer Motion & Tailwind"],
    quote: "Mỗi dòng code là một sợi cáp quang bền bỉ kết nối ý tưởng của đồng đội với hàng triệu du khách trên thế giới.",
    specialNote: "Đức là Lập trình viên của dự án, tự mình thiết kế và lập trình 100% cả Front-end, 3D WebGL và Back-end Serverless.",
    overview:
      "Đảm nhận toàn bộ trọng trách công nghệ của dự án Nét: Thiết kế kiến trúc phần mềm, lập trình giao diện người dùng tương tác cao, mô phỏng 3D WebGL Three.js, xây dựng cơ sở dữ liệu Cloud Firestore, hệ thống xác thực và các API Serverless.",
    detailedPoints: [
      {
        category: "1. Ba Trụ Cột Digital Cốt Lõi",
        items: [
          "Phần digital 1 — Chuỗi cung ứng số: Chuyển hóa nguồn lưới thu gom thành dữ liệu minh bạch, có thể truy xuất nguồn gốc theo từng mẻ (Batch ID, tọa độ GPS biển, ngày trục vớt).",
          "Phần digital 2 — Nền tảng đồng sáng tạo: Khách hàng không chỉ mua hàng thụ động, mà trực tiếp tự tay phối charm, gắn mắt lưới trên không gian số để tạo ra phiên bản kỷ vật độc bản của riêng mình.",
          "Phần digital 3 — Câu chuyện số độc bản: Mã QR trên từng sản phẩm dẫn thẳng tới Story Passport riêng theo Batch/SKU, thể hiện nguồn gốc mẻ lưới, câu chuyện địa phương và thông điệp cá nhân.",
        ],
      },
      {
        category: "2. Năm Cấu Phần MVP Hoàn Chỉnh Đã Xây Dựng",
        items: [
          "1. NÉT Studio: Bộ cấu hình Configurator 2D/3D trực quan, 1 phôi túi lưới thực tế, 6 charm văn hóa, thuật toán Snap-to-Mesh tự hít charm vào mắt lưới.",
          "2. My Da Nang Story: Bộ câu hỏi tương tác trắc nghiệm 3 bước, gợi ý phối charm hoặc concept thiết kế theo tính cách và chuyến đi của du khách.",
          "3. NÉT Source: Form nhập dữ liệu mẻ lưới thu gom và hệ thống tự động sinh mã định danh Batch ID chuẩn hóa.",
          "4. NÉT Story Passport: Hệ thống quét mã QR mở hồ sơ số gồm thông tin xuất xứ mẻ lưới (Source), câu chuyện Đà Nẵng (Local Story) và lời nhắn riêng (Personal Story).",
          "5. NÉT Travel Passport: Hồ sơ số lưu giữ hành trình trải nghiệm các điểm đến và bộ sưu tập charm du khách đã tích lũy.",
        ],
      },
      {
        category: "3. Kịch Bản Demo Khép Kín (End-to-End Loop) Cho Ban Giám Khảo",
        items: [
          "Bước 1: Nhập một batch lưới mới vào hệ thống NÉT Source.",
          "Bước 2: Hệ thống tự động khởi tạo Batch ID duy nhất.",
          "Bước 3: Gắn mẻ lưới đó vào một prototype túi mẫu thực tế.",
          "Bước 4: Người dùng vào NÉT Studio, lựa chọn charm hoặc kể câu chuyện trải nghiệm.",
          "Bước 5: Hệ thống phân tích, đề xuất thiết kế túi và hiển thị bản vẽ Blueprint.",
          "Bước 6: Khách hàng xem preview 3D tương tác 360° xoay lật đa chiều.",
          "Bước 7: Sản phẩm được cấp mã QR Code và tem NFC truy xuất số.",
          "Bước 8: Quét QR để hiển thị tức thì: Nguồn mẻ lưới + Câu chuyện Đà Nẵng + Thông điệp cá nhân + Chỉ số giảm thải CO2 cấp batch.",
        ],
      },
    ],
    deliverables: [
      "Hệ thống Web NÉT hoàn chỉnh (Next.js 14 + Tailwind + Three.js)",
      "Bộ công cụ Nét Studio 2D Snap Grid & 3D WebGL Bag Canvas",
      "Cơ sở dữ liệu Cloud Firestore & REST Serverless Endpoints",
      "Hệ thống QR Code Generator & Story Passport Portal",
    ],
  },
  {
    id: "minh-quan",
    name: "Lê Minh Quân",
    role: "Concept & Sản phẩm",
    subRole: "Nghiên Cứu & Thiết Kế Sản Phẩm Văn Hóa",
    avatar: "/assets/team/le-minh-quan.jpg",
    tagline: "Thổi linh hồn văn hóa Đà Nẵng vào từng mắt lưới",
    taskTitle: "Thiết kế Concept, Phát triển bộ sưu tập Charm & Sản phẩm túi",
    status: "Completed",
    priority: "High",
    startDate: "08/10/2026",
    endDate: "11/10/2026",
    linkText: "Tài liệu Product Specs & Charms",
    linkUrl: "#",
    badgeText: "Product & Charm Concept",
    accentColor: "text-sky-600",
    accentBg: "bg-sky-600",
    accentBorder: "border-sky-500",
    accentLight: "bg-sky-50",
    accentGradient: "from-sky-600 to-sky-700",
    skills: ["Product Design", "Cultural Heritage Research", "3D Charm Prototyping", "Cost Modeling", "Craft Feasibility"],
    quote: "Mỗi chiếc charm không đơn giản là vật trang trí — đó là một mảnh ký ức về nắng gió và con người Đà Nẵng.",
    overview:
      "Chịu trách nhiệm nghiên cứu văn hóa, tạo hình bộ sưu tập 6 charm biểu tượng, chuẩn hóa thông số kỹ thuật sản phẩm, cơ chế gắn mắt lưới an toàn và xây dựng mô hình doanh thu sản phẩm tinh gọn.",
    detailedPoints: [
      {
        category: "1. Nghiên cứu & Thiết kế Bộ 6 Charm Biểu Tượng Đà Nẵng",
        items: [
          "Chốt tạo hình 6 charms đặc trưng: Cầu Rồng, Ngũ Hành Sơn, Voọc chà vá chân nâu, Chùa Linh Ứng, Cá Ngư Ông, Bà Nà Hills.",
          "Nghiên cứu chiều sâu lịch sử - tâm linh - sinh thái và chắp bút câu chuyện ngắn (Short Story) cho từng biểu tượng.",
          "Xác định bộ dữ liệu kỹ thuật chuẩn: Kích thước, vật liệu (nhựa rác biển/thủy tinh tái chế), độ phức tạp (complexity), biên độ chi phí (cost band), tính khả thi gia công (feasibility).",
          "Thiết kế cơ cấu gài cơ học an toàn: Cho phép tháo lắp linh hoạt mà không làm biến dạng hay xơ rách bề mặt mắt lưới.",
        ],
      },
      {
        category: "2. Chuẩn hóa Phôi Túi & Quy Trình Thủ Công",
        items: [
          "Khảo sát nguồn lưới thực tế từ ngư trường, chọn lọc các mắt dệt đạt độ dai, độ bền kéo và màu sắc thẩm mỹ.",
          "Xây dựng quy trình làm sạch sâu, khử mùi mặn đại dương, phân loại sợi và xử lý an toàn cho người dùng.",
          "Chuẩn hóa phương pháp phối charm vào túi đảm bảo độ cân đối trọng lực và tính thẩm mỹ cao.",
        ],
      },
      {
        category: "3. Trải Nghiệm Khách Quốc Tế & Mô Hình Kinh Doanh Sản Phẩm",
        items: [
          "Giải bài toán sau chuyến đi: Ứng dụng số hóa giúp du khách quốc tế tiếp tục gắn kết với Nét dù đã rời Việt Nam.",
          "Cung cấp gói giá trị du lịch (Value Proposition) cho tour lữ hành, khách sạn/resort 5 sao và điểm tham quan.",
          "Xác lập 5 nguồn doanh thu tinh gọn: (1) Phôi túi nền tảng, (2) Bộ charm có sẵn, (3) Phí tùy biến charm độc bản, (4) Bộ sưu tập charm định kỳ, (5) Chia sẻ doanh thu co-branded với đối tác du lịch & quà tặng doanh nghiệp B2B/MICE.",
        ],
      },
    ],
    deliverables: [
      "Bộ hồ sơ thiết kế 6 biểu tượng Charm Đà Nẵng kèm 3D Specs",
      "Quy chuẩn kỹ thuật cơ cấu gắn charm vào mắt lưới",
      "Tài liệu 5 dòng doanh thu sản phẩm (Product Revenue Streams)",
    ],
  },
  {
    id: "bich-ngoc",
    name: "Nguyễn Huy Bích Ngọc",
    role: "Vật liệu & Môi trường",
    subRole: "Nghiên Cứu Chuỗi Cung Ứng & Chỉ Số ESG",
    avatar: "/assets/team/nguyen-huy-bich-ngoc.jpg",
    tagline: "Biến rác biển thành tài nguyên sạch, minh bạch từng kg",
    taskTitle: "Khảo sát đối tác thu gom/xử lý & Chuẩn hóa dữ liệu tác động môi trường",
    status: "In Progress",
    priority: "Medium",
    startDate: "08/10/2026",
    endDate: "Đang tiếp diễn",
    linkText: "Báo cáo khảo sát thực địa môi trường",
    linkUrl: "#",
    badgeText: "ESG & Materials",
    accentColor: "text-rose-600",
    accentBg: "bg-rose-600",
    accentBorder: "border-rose-500",
    accentLight: "bg-rose-50",
    accentGradient: "from-rose-600 to-rose-700",
    skills: ["Material Sourcing", "Plastic Recycling Chain", "ESG Impact Calculation", "Environmental Auditing", "Field Research"],
    quote: "Mỗi kg lưới ma được kéo lên khỏi đáy biển là một rạn san hô được thở và một sinh mệnh biển được cứu sống.",
    overview:
      "Chịu trách nhiệm nghiên cứu chuỗi cung ứng nguyên liệu đầu vào: Tìm kiếm và liên kết các cơ sở xử lý/tái chế nhựa rác biển, đồng thời xây dựng hệ thống đo lường dữ liệu tác động môi trường thực tế trên từng mẻ lưới.",
    detailedPoints: [
      {
        category: "1. Tìm Kiếm & Kết Nối Đối Tác Xử Lý Vật Liệu",
        items: [
          "Khảo sát thực địa các điểm tập kết phế liệu biển, cảng cá Thọ Quang và các vùng ven biển Đà Nẵng — Quảng Nam.",
          "Tìm kiếm và làm việc với các đơn vị, cơ sở có năng lực làm sạch sâu, khử độc tố, xử lý nhiệt và tái chế hạt nhựa rác biển đạt chuẩn an toàn tiếp xúc.",
          "Đánh giá năng lực xử lý vật liệu nhằm đảm bảo nguồn cung sợi ổn định khi dự án bước vào giai đoạn thương mại hóa.",
        ],
      },
      {
        category: "2. Đo Lường Tác Động Môi Trường Bằng Dữ Liệu Mẻ (Batch Data)",
        items: [
          "Xây dựng công thức đo lường chính xác tác động môi trường cho từng đơn vị túi:",
          "Khối lượng lưới thô thu hồi từ biển (kg lưới ma)",
          "Khối lượng sợi đạt chuẩn sau làm sạch và tỷ lệ hao hụt sau xử lý nhiệt",
          "Số lượng sinh vật biển và mét vuông rạn san hô được giải phóng khỏi nguy cơ mắc kẹt.",
        ],
      },
      {
        category: "3. Thu Thập Số Liệu & Bằng Chứng Khoa Học",
        items: [
          "Tổng hợp số liệu, báo cáo từ các tổ chức bảo tồn biển về tình trạng 'lưới ma' (Ghost Nets) tại vùng biển Việt Nam.",
          "Cung cấp số liệu minh chứng và hình ảnh thực địa phục vụ hệ thống NÉT Story Passport và công cụ tính toán chỉ số ESG trên website.",
          "Bảo đảm tính trung thực, minh bạch của dữ liệu phát thải giảm thiểu trước hội đồng giám khảo.",
        ],
      },
    ],
    deliverables: [
      "Danh bạ cơ sở xử lý & tái chế hạt nhựa biển",
      "Bảng công thức tính chỉ số tác động môi trường theo Batch ID",
      "Bộ tư liệu thực địa về thực trạng lưới ma vùng biển miền Trung",
    ],
  },
  {
    id: "nguyen-khang",
    name: "Lê Nguyên Khang",
    role: "Định hướng Thị trường",
    subRole: "Chiến Lược Kinh Doanh & Mạng Lưới Đối Tác",
    avatar: "/assets/team/le-nguyen-khang.jpg",
    tagline: "Chiến lược định vị sắc bén, mở rộng chuỗi liên kết",
    taskTitle: "Định hướng Thị trường, Phân tích Đối thủ & Chuẩn hóa quy trình",
    status: "Completed",
    priority: "Medium",
    startDate: "08/10/2026",
    endDate: "11/10/2026",
    linkText: "Định hướng dự án Túi lưới môi trường _HTT",
    linkUrl: "#",
    badgeText: "Market & Partnerships",
    accentColor: "text-emerald-700",
    accentBg: "bg-emerald-700",
    accentBorder: "border-emerald-600",
    accentLight: "bg-emerald-50",
    accentGradient: "from-emerald-700 to-emerald-800",
    skills: ["Market Positioning", "Stakeholder Mapping", "B2B Negotiations", "Process Engineering", "Scale Roadmap"],
    quote: "Không cần mở 100 cửa hàng để mở rộng quy mô — chỉ cần chọn đúng đối tác và trao cho họ giá trị không thể chối từ.",
    overview:
      "Chịu trách nhiệm định hình chiến lược thị trường, bẻ gãy rào cản cạnh tranh thông thường, lập bản đồ các bên liên quan, thiết kế cơ chế hợp tác Co-branded và chuẩn hóa quy trình từ ý tưởng đến tay khách hàng.",
    detailedPoints: [
      {
        category: "1. Xác Lập Lợi Thế Cạnh Tranh Độc Nhất (USP)",
        items: [
          "Phân tích đối thủ trực tiếp và gián tiếp (EchoGreen, EchoBag, quà lưu niệm truyền thống Đà Nẵng).",
          "Kiên quyết không lấy 'túi làm từ lưới cũ' làm USP duy nhất vì rào cản bắt chước thấp.",
          "Chốt 2-3 điểm khác biệt cốt lõi: Nền tảng đồng sáng tạo cá nhân hóa + Dữ liệu số truy xuất nguồn gốc mẻ lưới + Câu chuyện văn hóa bản địa độc bản.",
        ],
      },
      {
        category: "2. Bản Đồ Các Bên Liên Quan (Stakeholder Map)",
        items: [
          "Nghiên cứu ma trận giá trị (Value Proposition) 2 chiều: Nét mang lại gì và Đối tác nhận được gì.",
          "Nhóm 1 — Công ty lữ hành / Tour du lịch: Quà tặng mang thông điệp xanh nâng tầm trải nghiệm tour.",
          "Nhóm 2 — Khách sạn & Resort cao cấp: Vật phẩm amenities thân thiện môi trường, gia tăng chỉ số ESG.",
          "Nhóm 3 — Cửa hàng Souvenir & Điểm du lịch: Sản phẩm lưu niệm cao cấp có biên lợi nhuận tốt và câu chuyện kể hấp dẫn.",
        ],
      },
      {
        category: "3. Bộ Sưu Tập Đồng Thương Hiệu & Quy Trình Sản Xuất",
        items: [
          "Co-branded Collection: Thiết kế mô hình hợp tác bộ sưu tập độc quyền số lượng giới hạn theo mùa.",
          "Xây dựng Feasibility Checklist cho đơn hàng custom: Giới hạn kích thước, dải màu sắc sợi, chủng loại vật liệu, độ phức tạp, chi phí và thời gian giao hàng (Lead time).",
          "Chuẩn hóa quy trình 5 bước Concept-to-Production: Idea ➔ Concept ➔ Feasibility ➔ Quotation ➔ Production.",
        ],
      },
      {
        category: "4. Lộ Trình Mở Rộng Quy Mô (Milestones & Scale)",
        items: [
          "Giai đoạn 1: Đà Nẵng (Pilot trọng điểm với bộ 6 charm văn hóa).",
          "Giai đoạn 2: Hội An — Cố đô Huế (Mở rộng sang các mẻ lưới miền Trung và di sản lân cận).",
          "Giai đoạn 3: Toàn quốc thông qua Local Collections & Mạng lưới đối tác du lịch bản địa thay vì đầu tư showroom dàn trải.",
        ],
      },
    ],
    deliverables: [
      "Báo cáo phân tích cạnh tranh & Định vị USP",
      "Ma trận giá trị Stakeholder Value Map",
      "Quy trình vận hành 5 bước Concept-to-Production",
      "Kế hoạch lộ trình nhân rộng 3 giai đoạn",
    ],
  },
];

/* ─────────────────── Net Pattern SVG ─────────────────── */

function NetPatternOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="netPatternClean" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M0 24 L48 24 M24 0 L24 48" stroke="#2D231E" strokeWidth="0.6" />
          <path d="M0 0 L48 48 M48 0 L0 48" stroke="#2D231E" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#netPatternClean)" />
    </svg>
  );
}

/* ─────────────────── Member Detail Modal (50% Image Left) ─────────────────── */

function MemberDetailModal({
  member,
  onClose,
  onNext,
  onPrev,
}: {
  member: TeamMember;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 25, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 25, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl border border-[#E8E2D8] shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto text-[#2D231E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          title="Đóng (Esc)"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-[#E8E2D8] hover:bg-rose-50 hover:border-rose-200 text-[#5E4D43] hover:text-rose-600 flex items-center justify-center transition-colors shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ─── LEFT COLUMN: 50% Photo Banner (Crystal Clear & Crisp) ─── */}
        <div className="w-full md:w-1/2 relative bg-gradient-to-br from-[#2D231E] to-[#1A1411] min-h-[380px] md:min-h-[640px] flex flex-col justify-end overflow-hidden flex-shrink-0">
          {/* Full High-Res Portrait Image (unoptimized to preserve maximum sharpness) */}
          <Image
            src={member.avatar}
            alt={member.name}
            fill
            unoptimized
            priority
            className="object-cover object-top select-none transition-transform duration-700 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Dark luxury bottom vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

          {/* Left Navigation Overlay Buttons */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
            <button
              onClick={onPrev}
              title="Thành viên trước (Phím ←)"
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              title="Thành viên kế tiếp (Phím →)"
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Info Card on Left Bottom */}
          <div className="relative z-10 p-6 sm:p-8 space-y-2 text-white">
            <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${member.accentBg}`}>
              {member.badgeText}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-white drop-shadow-sm">
              {member.name}
            </h3>
            <p className="text-sm font-medium text-white/90">
              {member.role} <span className="text-white/60">· {member.subRole}</span>
            </p>
            <p className="text-xs text-white/80 italic font-serif leading-relaxed pt-1 line-clamp-2">
              &ldquo;{member.tagline}&rdquo;
            </p>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: 50% Details & Scrollable Tasks ─── */}
        <div className="w-full md:w-1/2 flex flex-col max-h-[92vh] bg-white overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-[#E8E2D8] bg-[#FAF7F2]">
            <span className="text-[10px] uppercase tracking-wider text-[#9E9289] font-bold block">
              CHI TIẾT PHÂN CÔNG NHIỆM VỤ
            </span>
            <h4 className="font-serif text-xl text-[#241B16] font-semibold mt-0.5">
              {member.role}
            </h4>
            <p className={`text-xs font-semibold ${member.accentColor} mt-0.5`}>
              {member.subRole}
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="px-6 sm:px-8 py-5 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
            {/* Special Note (cho Đức) */}
            {member.specialNote && (
              <div className="p-3.5 rounded-2xl bg-[#B85D43]/10 border border-[#B85D43]/20 flex items-start gap-2.5 text-[#B85D43] font-medium leading-relaxed">
                <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{member.specialNote}</span>
              </div>
            )}

            {/* Admin Task Info */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#9E9289] font-bold block">
                  Nhiệm vụ chính (Task)
                </span>
                <p className="font-semibold text-[#241B16] text-xs sm:text-sm mt-0.5">
                  {member.taskTitle}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8E2D8]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#9E9289] font-bold block">
                    Thời gian thực hiện
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[#5E4D43] font-medium mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#B85D43]" />
                    <span>{member.startDate} – {member.endDate}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#9E9289] font-bold block">
                    Sản phẩm bàn giao
                  </span>
                  {member.linkText ? (
                    <div className="flex items-center gap-1 text-xs text-[#B85D43] font-medium mt-0.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate">{member.linkText}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#9E9289] mt-0.5 block">Đang đồng bộ</span>
                  )}
                </div>
              </div>
            </div>

            {/* Overview */}
            <div>
              <h5 className="text-[11px] uppercase tracking-wider text-[#7A6F68] font-bold mb-1.5 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#B85D43]" />
                Tổng quan vai trò & Chức năng phụ trách
              </h5>
              <p className="text-[#5E4D43] leading-relaxed text-xs sm:text-sm bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8E2D8]">
                {member.overview}
              </p>
            </div>

            {/* Detailed Points (Description) */}
            <div className="space-y-3">
              <h5 className="text-[11px] uppercase tracking-wider text-[#7A6F68] font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#B85D43]" />
                Nội dung công việc chi tiết (Description)
              </h5>
              {member.detailedPoints.map((section, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-[#E8E2D8] space-y-2 shadow-sm"
                >
                  <h6 className="font-semibold text-xs text-[#241B16] flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${member.accentBg}`} />
                    {section.category}
                  </h6>
                  <ul className="space-y-1.5 pl-4">
                    {section.items.map((it, iIdx) => (
                      <li
                        key={iIdx}
                        className="text-xs text-[#5E4D43] leading-relaxed list-disc marker:text-[#9E9289]"
                      >
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Deliverables */}
            {member.deliverables && (
              <div>
                <h5 className="text-[11px] uppercase tracking-wider text-[#7A6F68] font-bold mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Sản phẩm bàn giao (Deliverables)
                </h5>
                <div className="space-y-1.5">
                  {member.deliverables.map((deliv, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs font-medium text-emerald-900 flex items-start gap-2"
                    >
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{deliv}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="pt-2 border-t border-[#E8E2D8]">
              <span className="text-[10px] uppercase tracking-wider text-[#9E9289] font-bold block mb-2">
                Kỹ năng & Chuyên môn
              </span>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 text-[11px] font-medium bg-[#FAF7F2] text-[#5E4D43] rounded-lg border border-[#E8E2D8]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer of Right Column */}
          <div className="px-6 sm:px-8 py-3.5 border-t border-[#E8E2D8] bg-[#FAF7F2] flex items-center justify-between text-xs text-[#7A6F68]">
            <span className="font-serif text-xs text-[#241B16]">
              5 bàn tay{" "}
              <span className="italic text-[#B85D43] font-semibold">1 sản phẩm</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#241B16] text-white hover:bg-[#3D3028] font-medium transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────── Clean Equal Member Card (Không đánh số thứ tự) ─────────────────── */

function EqualMemberCard({
  member,
  index,
  onOpenDetails,
}: {
  member: TeamMember;
  index: number;
  onOpenDetails: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group flex flex-col h-full"
    >
      <div
        className="relative bg-white rounded-3xl border border-[#E8E2D8] overflow-hidden transition-all duration-300 flex flex-col h-full shadow-[0_4px_20px_-8px_rgba(11,30,59,0.06)] hover:shadow-[0_16px_40px_-12px_rgba(11,30,59,0.14)] hover:-translate-y-1.5"
      >
        {/* Top colored accent line */}
        <div className={`h-1.5 w-full ${member.accentBg}`} />

        {/* ─── LARGE HIGH-RES PHOTO CONTAINER (Hoàn toàn không đánh số thứ tự) ─── */}
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#FAF7F2] cursor-pointer" onClick={onOpenDetails}>
          <Image
            src={member.avatar}
            alt={member.name}
            fill
            unoptimized
            priority
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
          />

          {/* Subtle bottom gradient on photo */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Role badge over photo bottom */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white shadow-sm ${member.accentBg}`}>
              {member.badgeText}
            </span>
          </div>
        </div>

        {/* ─── CLEAN CARD CONTENT (Đã bỏ số thứ tự, Priority, Status, SubRole) ─── */}
        <div className="p-4 sm:p-5 text-center flex flex-col flex-1 justify-between bg-white">
          <div className="space-y-1.5">
            {/* Member Name (Chiều cao cố định đồng đều tuyệt đối) */}
            <div className="h-11 sm:h-12 flex items-center justify-center">
              <h3
                onClick={onOpenDetails}
                className="font-serif text-[15px] sm:text-base 2xl:text-[17px] text-[#241B16] font-semibold tracking-tight group-hover:text-[#B85D43] transition-colors cursor-pointer leading-snug"
              >
                {member.name}
              </h3>
            </div>

            {/* Primary Role Only (Không xuống dòng, căn đều giữa) */}
            <div className="h-6 flex items-center justify-center">
              <p className={`text-xs sm:text-[13px] font-bold ${member.accentColor} tracking-wide whitespace-nowrap`}>
                {member.role}
              </p>
            </div>

            {/* Tagline / Châm ngôn (Cố định 2 dòng, chiều cao đồng nhất) */}
            <div className="h-11 sm:h-12 flex items-center justify-center pt-0.5">
              <p className="text-[11px] sm:text-xs text-[#5E4D43] italic font-serif leading-relaxed line-clamp-2">
                &ldquo;{member.tagline}&rdquo;
              </p>
            </div>
          </div>

          {/* Action Button: Mở thẻ chi tiết */}
          <div className="pt-3">
            <button
              onClick={onOpenDetails}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#FAF7F2] hover:bg-[#241B16] text-[#241B16] hover:text-white border border-[#E8E2D8] hover:border-[#241B16] transition-all duration-300 flex items-center justify-center gap-1.5 group/btn shadow-sm"
            >
              <span>Xem thẻ chi tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────── Stats Component ─────────────────── */

function StatCard({
  icon,
  value,
  label,
  sublabel,
  delay,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-[#E8E2D8] shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#B85D43] mb-3">
        {icon}
      </div>
      <span className="font-serif text-3xl sm:text-4xl text-[#241B16] font-semibold">{value}</span>
      <span className="text-xs sm:text-sm text-[#241B16] font-medium mt-1">{label}</span>
      <span className="text-[11px] text-[#7A6F68] mt-0.5">{sublabel}</span>
    </motion.div>
  );
}

/* ═══════════════════ MAIN TEAM PAGE ═══════════════════ */

export default function TeamPage() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId) || null;
  const currentIndex = selectedMember
    ? teamMembers.findIndex((m) => m.id === selectedMember.id)
    : -1;

  const handleNext = () => {
    if (currentIndex >= 0) {
      const nextIdx = (currentIndex + 1) % teamMembers.length;
      setSelectedMemberId(teamMembers[nextIdx].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex >= 0) {
      const prevIdx = (currentIndex - 1 + teamMembers.length) % teamMembers.length;
      setSelectedMemberId(teamMembers[prevIdx].id);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] text-[#2D231E]">
      {/* ─── HERO SECTION ─── */}
      <section className="relative w-full overflow-hidden border-b border-[#E8E2D8]">
        <NetPatternOverlay />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-12 sm:pb-16">
          {/* Breadcrumb Tag */}
          <div className="flex items-center gap-2 text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#7A6F68] font-semibold mb-6">
            <Waves className="w-4 h-4 text-[#B85D43]" />
            <span>ĐỘI NGŨ PHÁT TRIỂN · TSUNAMI TEAM · BDC 2026</span>
          </div>

          {/* Hero Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-8 space-y-5">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#241B16] font-normal tracking-tight leading-[1.2]">
                Năm thành viên, một{" "}
                <span className="italic text-[#B85D43]">con thuyền</span>
                <span className="block mt-1.5">vươn ra đại dương bền vững.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#5E4D43] leading-relaxed max-w-2xl font-light">
                Mỗi thành viên là một mắt xích bình đẳng, giữ vai trò chuyên biệt từ kiến trúc số,
                sáng tạo sản phẩm, chiến lược liên kết đến đo lường môi trường — cùng nhau dệt nên
                giải pháp thời trang sinh thái và chuỗi cung ứng tuần hoàn từ lưới ma biển Việt Nam.
              </p>

              {/* Quick Equal Team Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {teamMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMemberId(m.id)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F0ECE4] border border-[#E8E2D8] text-xs font-medium text-[#241B16] transition-all hover:scale-105 shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden relative border border-[#E8E2D8]">
                      <Image src={m.avatar} alt={m.name} fill unoptimized className="object-cover" />
                    </div>
                    <span>{m.name}</span>
                    <span className="text-[11px] text-[#9E9289]">({m.role})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Nét & Team Emblem */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-full max-w-[280px] rounded-3xl bg-white border border-[#E8E2D8] p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
                <div className="relative w-28 h-14 flex items-center justify-center">
                  <Image
                    src="/assets/logo-nets.png"
                    alt="Logo Nét"
                    fill
                    unoptimized
                    priority
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F68] font-bold block">
                    CUỘC THI BDC 2026
                  </span>
                  <h3 className="font-serif text-lg text-[#241B16] font-semibold mt-0.5">
                    VecomNet&apos;s Tsunami
                  </h3>
                  <p className="text-xs text-[#B85D43] font-medium mt-0.5">
                    Nét — Eco-Luxury 3D E-Commerce
                  </p>
                </div>
                {/* 5 Bàn Tay 1 Sản Phẩm */}
                <div className="text-xs text-[#241B16] font-semibold border-t border-[#E8E2D8] pt-3 w-full flex items-center justify-center gap-1.5 text-amber-900 bg-amber-50/50 rounded-xl py-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B85D43]" />
                  <span>
                    5 bàn tay{" "}
                    <span className="italic text-[#B85D43]">1 sản phẩm</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS SUMMARY ─── */}
      <section className="w-full bg-[#EFE9DF]/40 py-10 sm:py-12 border-b border-[#E8E2D8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              value="5"
              label="5 bàn tay 1 sản phẩm"
              sublabel="Cùng chung vị thế & tầm nhìn"
              delay={0}
            />
            <StatCard
              icon={<Cpu className="w-5 h-5" />}
              value="1"
              label="Full-stack Developer"
              sublabel="Đức — 100% Front & Backend"
              delay={0.1}
            />
            <StatCard
              icon={<Layers className="w-5 h-5" />}
              value="5"
              label="Cấu phần MVP"
              sublabel="Studio, Passport, Source..."
              delay={0.2}
            />
            <StatCard
              icon={<Leaf className="w-5 h-5" />}
              value="100%"
              label="Chuỗi giá trị tuần hoàn"
              sublabel="Từ biển sâu tới khách du lịch"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ─── 5 EQUAL MEMBERS SECTION (Ảnh To, Nét Căng, Ngang Hàng, Không Đánh Số) ─── */}
      <section className="w-full py-16 sm:py-24 relative">
        <NetPatternOverlay />

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18 space-y-3">
            <div className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#7A6F68] font-bold">
              ĐỒNG ĐỘI & PHÂN CÔNG TRÁCH NHIỆM
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#241B16] font-normal tracking-tight">
              5 bàn tay{" "}
              <span className="italic text-[#B85D43]">1 sản phẩm</span>.
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6F68] font-light leading-relaxed">
              Mỗi thành viên mang một năng lực cốt lõi riêng biệt. Nhấn vào <strong>&quot;Xem thẻ chi tiết&quot;</strong> để tìm hiểu chuyên sâu về phân công, trách nhiệm và thành quả bàn giao.
            </p>
          </div>

          {/* 5 Equal Cards Grid (Clean, Ảnh To, Ngang Hàng, Không Đánh Số) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {teamMembers.map((member, index) => (
              <EqualMemberCard
                key={member.id}
                member={member}
                index={index}
                onOpenDetails={() => setSelectedMemberId(member.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIGITAL ECOSYSTEM ARCHITECTURE ─── */}
      <section className="w-full border-t border-[#E8E2D8] bg-[#F7F2EB] py-16 sm:py-20 relative overflow-hidden">
        <NetPatternOverlay />

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Text & Flow */}
            <div className="lg:col-span-7 space-y-6">
              <div className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#7A6F68] font-bold">
                TƯ DUY CỐT LÕI VỀ DIGITAL CỦA NÉT
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#241B16] font-normal leading-snug">
                Digital không chỉ để bán túi.{" "}
                <span className="italic text-[#B85D43]">
                  Digital là hạ tầng kết nối toàn bộ chuỗi giá trị tuần hoàn.
                </span>
              </h2>
              <p className="text-sm text-[#5E4D43] leading-relaxed font-light">
                Được lãnh đạo bởi <strong>Trịnh Thanh Huyền</strong> (Team Leader) và hiện thực hóa công nghệ 100% bởi <strong>Nguyễn Văn Đức</strong> (Full-stack Developer), Nét xây dựng một hệ thống số khép kín:
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] flex items-start gap-3.5 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    01
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-[#241B16]">
                      Nguồn lưới thành dữ liệu có thể truy xuất (NÉT Source)
                    </h4>
                    <p className="text-xs text-[#7A6F68] mt-1 leading-relaxed">
                      Mỗi mẻ lưới ma vớt từ biển được cấp Batch ID, định vị GPS tọa độ trục vớt, cân nặng và nhật ký xử lý rõ ràng.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] flex items-start gap-3.5 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#B85D43]/15 text-[#B85D43] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    02
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-[#241B16]">
                      Khách đồng sáng tạo sản phẩm độc bản (NÉT Studio 3D)
                    </h4>
                    <p className="text-xs text-[#7A6F68] mt-1 leading-relaxed">
                      Website không phải giỏ hàng tĩnh. Du khách tự tay gắn charm lên mắt lưới qua công cụ 2D Snap Grid & 3D WebGL trực quan.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] flex items-start gap-3.5 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    03
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-[#241B16]">
                      Mỗi sản phẩm mang một câu chuyện số (Story Passport QR)
                    </h4>
                    <p className="text-xs text-[#7A6F68] mt-1 leading-relaxed">
                      QR trên túi mở Story Passport riêng theo từng batch: xem nguồn lưới biển, câu chuyện văn hóa Đà Nẵng và thông điệp riêng của chủ nhân.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: End-to-End Loop Box */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8E2D8] shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B85D43] flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    Vòng Demo Khép Kín (End-to-End)
                  </span>
                  <span className="text-xs text-[#9E9289]">Quy trình BGK</span>
                </div>

                <div className="space-y-2.5 text-xs text-[#5E4D43]">
                  {[
                    "1. Nhập mẻ lưới vào NÉT Source",
                    "2. Hệ thống tạo Batch ID tự động",
                    "3. Gắn batch đó với Prototype túi mẫu",
                    "4. Khách vào NÉT Studio chọn charm / trả lời quiz",
                    "5. Hệ thống đề xuất & cho xem Preview 3D",
                    "6. Sản phẩm được cấp mã QR định danh",
                    "7. Scan QR xem Source + Local Story + Impact",
                  ].map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center gap-2.5 font-medium"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#B85D43] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {sIdx + 1}
                      </span>
                      <span>{step.substring(3)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-[#7A6F68] italic">
                    Xây dựng và vận hành độc lập bởi Full-stack Dev Nguyễn Văn Đức
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DETAIL MODAL (50% PHOTO LEFT & DETAILS RIGHT) ─── */}
      <AnimatePresence>
        {selectedMember && (
          <MemberDetailModal
            member={selectedMember}
            onClose={() => setSelectedMemberId(null)}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </AnimatePresence>

      {/* ─── CALL TO ACTION ─── */}
      <section className="w-full border-t border-[#E8E2D8] bg-[#FAF7F2] py-14 sm:py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 space-y-5">
          <div className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#7A6F68] font-bold">
            5 BÀN TAY · 1 SẢN PHẨM
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#241B16] font-normal">
            Khám phá thành quả của <span className="italic text-[#B85D43]">Tsunami Team</span>.
          </h2>
          <p className="text-sm text-[#7A6F68] font-light leading-relaxed max-w-xl mx-auto">
            Ghé thăm Nét Studio để tự tay gắn charm, trải nghiệm công nghệ 3D hoặc tra cứu hải đồ nguồn gốc mẻ lưới tại Story Passport.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B85D43] hover:bg-[#A04D36] text-white text-sm font-medium transition-all shadow-sm"
            >
              <span>Vào Nét Studio 3D</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/passport"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#E8E2D8] hover:border-[#241B16] text-[#241B16] text-sm font-medium transition-all shadow-sm"
            >
              <span>Xem Story Passport</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER BAR ─── */}
      <footer className="w-full border-t border-[#E8E2D8] bg-white py-6 text-xs text-[#7A6F68]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#2D5E4E]" />
            <span className="font-medium text-[#241B16]">VecomNet&apos;s Tsunami Team:</span>
            <span>Trịnh Thanh Huyền · Nguyễn Văn Đức · Lê Minh Quân · Nguyễn Huy Bích Ngọc · Lê Nguyên Khang</span>
          </div>
          <Link href="/" className="text-[#B85D43] hover:underline font-medium">
            ← Về trang chủ Nét
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
