# NÉT — Eco-Luxury 3D E-Commerce Platform
> Nền tảng thương mại điện tử bền vững cao cấp cho sản phẩm túi xách và charm tái chế từ lưới đánh cá ("lưới ma") đại dương Việt Nam.

---

## 🌊 1. Kiến Trúc & Triết Lý Thiết Kế (Architecture & Concept)

### Triết lý thẩm mỹ: **Deep Ocean Luxury + Glassmorphism (Phong cách Glasses) + WebGL 3D**
- **Hiệu ứng Kính Mờ Khúc Xạ (Glasses / Glassmorphism):** Sử dụng các lớp panel thủy tinh đa tầng (`backdrop-blur-2xl bg-slate-900/40 border border-white/15`), viền sáng lân tinh iridescent sheen, đổ bóng chiều sâu mô phỏng tinh thể pha lê và giọt nước biển sâu.
- **Không Gian Đại Dương 3D Tương Tác:**
  - `OceanCanvas3D`: Canvas WebGL Three.js render các hạt sinh vật phù du phát quang (bioluminescent plankton) và dòng xoáy sợi lưới ma phát quang cyan/emerald theo cử chỉ di chuột.
  - `BagCanvas3D`: Mô hình 3D túi lưới tương tác 360°, bề mặt dệt phản quang translucent nylon shader, gắn các charm 3D thủy tinh và kim loại rác biển ở đúng tọa độ mắt lưới, hỗ trợ xoay, zoom và xuất ảnh blueprint kỹ thuật (snapshot).
- **Tích hợp Video & Hình ảnh tham khảo:**
  - Video Cinematic đại dương: `hero-ocean.mp4` (Khởi nguồn từ biển sâu) và `video2.mp4` (Scroll-driven video scrubbing nền).
  - Mô hình 3D thực tế: `tuixach.glb` (Túi xách dệt từ sợi biển) và `caurongcharm.glb` (Charm Cầu Rồng biểu tượng Đà Nẵng).

---

## 📁 2. Cấu Trúc Dự Án (Project Structure)

```
Vecomnets/
├── docs/
│   ├── idea_main.md              # Tài liệu ý tưởng và định vị thương hiệu NÉT
│   └── concept-poster.png        # Poster concept ban đầu
├── public/
│   └── assets/
│       ├── hero-ocean.mp4        # Video cinematic mở màn & hero background tràn viền
│       ├── video2.mp4            # Video cuộn mượt mà theo tiến độ trang chủ
│       └── models/
│           ├── tuixach.glb       # Model 3D túi dệt thực tế
│           └── caurongcharm.glb  # Model 3D charm Cầu Rồng Đà Nẵng
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── layout.tsx            # Root Layout (Ambient 3D, Navbar, CartDrawer, Footer)
│   │   ├── globals.css           # Bảng màu đại dương, hiệu ứng kính mờ & thanh cuộn
│   │   ├── page.tsx              # Trang chủ (Hero Video, 3D Teaser, Combos, Story, QR)
│   │   ├── shop/                 # Cửa hàng (Lọc theo Combo, Phôi túi, Charm, Quick Add)
│   │   ├── customizer/           # Nét Lab 3D Studio (Snap-to-Mesh 2D & Xoay 360° 3D)
│   │   ├── story/                # Quy trình 4 bước tái sinh & Nghề dệt thủ công Việt Nam
│   │   ├── traceability/         # Bản đồ cứu hộ biển, GPS và chứng chỉ số Batch ID
│   │   ├── b2b/                  # Quà tặng doanh nghiệp & Máy tính chỉ số ESG
│   │   ├── checkout/             # Thanh toán 1-page (VNPay, MoMo, VietQR, COD)
│   │   ├── order-success/        # Xác nhận đơn hàng, QR Code truy xuất & tiến độ xưởng
│   │   └── admin/                # Bảng điều khiển Xưởng Nét (Xem bản vẽ & cập nhật QC)
│   ├── components/
│   │   ├── 3d/                   # Các module Three.js WebGL
│   │   │   ├── OceanCanvas3D.tsx # Hiệu ứng hạt lân tinh & vortex sợi lưới
│   │   │   └── BagCanvas3D.tsx   # Trình xem & xoay 3D túi gắn charm, xuất snapshot
│   │   ├── customizer/           # Bộ công cụ tùy biến Nét Lab
│   │   │   ├── NetGridCanvas.tsx # Canvas mắt lưới snap tự động khi kéo thả/chọn charm
│   │   │   ├── CharmTray.tsx     # Khay phụ kiện charm thủy tinh phân loại theo chủ đề
│   │   │   ├── BagSelector.tsx   # Chọn dáng phôi túi (Tote, Hobo, Bucket, Mini)
│   │   │   ├── MeshColorSelector.tsx # Chọn màu sắc lưới (Abyss, Kelp, Coral, Pearl)
│   │   │   ├── LivePriceCard.tsx # Tính giá thời gian thực & chỉ số cứu đại dương
│   │   │   └── SnapshotModal.tsx # Xuất bản vẽ kỹ thuật gia công theo mã mắt lưới
│   │   ├── cart/
│   │   │   └── CartDrawer.tsx    # Ngăn trượt giỏ hàng kèm cấu hình charm tùy biến
│   │   └── ui/                   # Hệ thống UI Phong cách Glasses (Glassmorphism)
│   │       ├── GlassCard.tsx     # Thẻ kính mờ khúc xạ đa biến thể
│   │       ├── GlassButton.tsx   # Nút bấm lân tinh ánh sáng
│   │       ├── GlassBadge.tsx    # Huy hiệu sinh thái
│   │       ├── Navbar.tsx        # Thanh điều hướng nổi
│   │       └── Footer.tsx        # Chân trang & bộ đếm rác biển đã xử lý
│   ├── context/
│   │   └── CartContext.tsx       # Quản lý giỏ hàng và lưu trữ persistent LocalStorage
│   ├── data/
│   │   ├── products.ts           # Dữ liệu phôi túi, các loại charm & combo signature
│   │   ├── traceability.ts       # Hồ sơ các mẻ trục vớt tại Đà Nẵng, Phú Quốc, Côn Đảo
│   │   └── stories.ts            # Dữ liệu 4 bước quy trình công nghệ tái chế tuần hoàn
│   ├── lib/
│   │   └── utils.ts              # Hàm định dạng VND, Kg, sinh mã đơn hàng, QR Code
│   └── types/
│       └── index.ts              # Định nghĩa cấu trúc kiểu TypeScript toàn diện
├── tailwind.config.ts            # Cấu hình màu đại dương, glass blur & animation
├── tsconfig.json                 # Cấu hình TypeScript với alias @/*
└── package.json                  # Next.js 14, Three.js, Lucide, Framer-motion
```

---

## 💎 3. Các Tính Năng Đột Phá Đã Triển Khai

1. **Nét Lab 3D Studio (Công Cụ Tùy Biến Tương Tác Trọng Tâm):**
   - **Snap-to-Mesh Grid Logic:** Mặt túi bố trí các điểm neo (Anchor points) chuẩn xác theo cấu trúc mắt dệt. Khi người dùng bấm hoặc kéo charm, hệ thống tự động hít (snap) charm vào mắt neo gần nhất.
   - **Chuyển đổi 2D Snap Grid & 3D 360° Orbit:** Xem cận cảnh phom dáng 3D thực tế, độ bóng của thủy tinh rác biển và phản chiếu ánh sáng khi xoay.
   - **Snapshot Blueprint Generation:** Xuất file hình ảnh kỹ thuật kèm tọa độ mắt lưới (`#A2`, `#A5`, góc xoay độ) để thợ thủ công tại xưởng hoàn thiện chính xác từng chi tiết.
   - **Real-time Live Pricing & Impact Metric:** Tính tổng tiền tức thì theo phôi túi + từng loại charm, đồng thời hiển thị số kg nhựa biển được thu hồi và số kg CO2 giảm phát thải.

2. **Hệ Thống Truy Xuất Nguồn Gốc (Traceability & GPS Marine Map):**
   - Mỗi sản phẩm và đơn hàng được cấp mã `Batch ID` (VD: `NET-VN-DN-2024-082`, `NET-VN-PQ-2024-091`, `NET-VN-CD-2024-104`).
   - Bản đồ tọa độ định vị GPS nơi rác lưới ma được biệt đội thợ lặn cắt vớt từ các rạn san hô Nam Ô, Côn Đảo, Phú Quốc.
   - Mã QR duy nhất tạo động dẫn tới chứng chỉ tác động số.

3. **Cổng Xưởng Nét (Admin / Workshop Dashboard):**
   - Truy cập tại `/admin`: Bảng điều hành dành riêng cho xưởng đan thủ công.
   - Xem chi tiết bản vẽ thiết kế của khách hàng, vị trí từng mắt lưới được gắn charm để thợ lắp ráp theo đúng yêu cầu.
   - Cập nhật tiến độ 4 bước: *Tiếp nhận -> Đang đan mắt lưới -> Kiểm định QC -> Bàn giao Shipper*.

4. **Kênh Quà Tặng B2B & ESG Impact Calculator:**
   - Truy cập tại `/b2b`: Thanh trượt tính toán tác động ESG thời gian thực (số lượng túi -> số kg nhựa thu hồi -> km lưới được gỡ -> chỉ số carbon giảm phát thải).
   - Form gửi yêu cầu báo giá và mẫu thử cho doanh nghiệp.

5. **Thanh Toán 1-Page Đẳng Cấp:**
   - Truy cập tại `/checkout`: Hỗ trợ Cổng VNPay (QR / Thẻ), Ví MoMo, Chuyển khoản VietQR và COD.

---

## 🚀 4. Hướng Dẫn Vận Hành (Running the Project)

```bash
# Chạy máy chủ phát triển (Development mode)
npm run dev

# Hoặc khởi chạy bản build Production đã được tối ưu hóa (Port 3000)
npm start
```
Truy cập ứng dụng tại: `http://localhost:3000`
- Trang chủ: `http://localhost:3000/`
- Nét Lab 3D: `http://localhost:3000/customizer`
- Cửa hàng: `http://localhost:3000/shop`
- Hành trình tái sinh: `http://localhost:3000/story`
- Bản đồ truy xuất: `http://localhost:3000/traceability`
- Doanh nghiệp B2B: `http://localhost:3000/b2b`
- Bảng điều khiển xưởng Nét (Admin): `http://localhost:3000/admin`
