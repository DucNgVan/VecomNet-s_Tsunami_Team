# 🚀 HƯỚNG DẪN TRIỂN KHAI TOÀN DIỆN LÊN MÔI TRƯỜNG THỰC TẾ (PRODUCTION DEPLOYMENT GUIDE)
**Dự án:** NÉT — Thương Mại Điện Tử Sinh Thái & Chuỗi Cung Ứng Tuần Hoàn Lưới Ma Đại Dương  
**Phiên bản hệ thống:** Production Ready (Next.js 14 App Router + Vercel Serverless Backend + Cloud Firestore + VietQR/PayOS + Resend Email + NFC Passport)  
**Tài liệu dành cho:** DevOps, Kỹ sư hệ thống & Đội ngũ vận hành xưởng  

---

## MỤC LỤC
1. [Kiến Trúc Hạ Tầng Thực Tế (Production Architecture)](#1-kiến-trúc-hạ-tầng-thực-tế-production-architecture)
2. [Danh Mục Tài Khoản & Dịch Vụ Cần Chuẩn Bị](#2-danh-mục-tài-khoản--dịch-vụ-cần-chuẩn-bị)
3. [Bảng Biến Môi Trường Chuẩn (Environment Variables)](#3-bảng-biến-môi-trường-chuẩn-environment-variables)
4. [Bước 1: Thiết Lập Cơ Sở Dữ Liệu Cloud Firestore](#bước-1-thiết-lập-cơ-sở-dữ-liệu-cloud-firestore)
5. [Bước 2: Đẩy Mã Nguồn Lên GitHub](#bước-2-đẩy-mã-nguồn-lên-github)
6. [Bước 3: Triển Khai Lên Vercel (Front-end & Serverless Back-end)](#bước-3-triển-khai-lên-vercel-front-end--serverless-back-end)
7. [Bước 4: Cấu Hình Tên Miền Tùy Chỉnh (Custom Domain & SSL)](#bước-4-cấu-hình-tên-miền-tùy-chỉnh-custom-domain--ssl)
8. [Bước 5: Kích Hoạt Cổng Thanh Toán Tự Động (VietQR & PayOS)](#bước-5-kích-hoạt-cổng-thanh-toán-tự-động-vietqr--payos)
9. [Bước 6: Cấu Hình Dịch Vụ Email Tự Động (Resend / SMTP)](#bước-6-cấu-hình-dịch-vụ-email-tự-động-resend--smtp)
10. [Bước 7: Quy Trình Ghi Chip NFC Vào Túi Thật (NFC Hardware Provisioning)](#bước-7-quy-trình-ghi-chip-nfc-vào-túi-thật-nfc-hardware-provisioning)
11. [Bước 8: Khởi Tạo Dữ Liệu & Vận Hành Bán Hàng](#bước-8-khởi-tạo-dữ-liệu--vận-hành-bán-hàng)
12. [Checklist Kiểm Thử Trước Khi Mở Bán (Pre-Launch Checklist)](#checklist-kiểm-thử-trước-khi-mở-bán-pre-launch-checklist)

---

## 1. KIẾN TRÚC HẠ TẦNG THỰC TẾ (PRODUCTION ARCHITECTURE)

Hệ thống được thiết kế theo kiến trúc **Jamstack + Serverless Monorepo**, giúp tối ưu hóa chi phí vận hành (0đ chi phí máy chủ ban đầu ở quy mô dưới 10.000 đơn/tháng), tốc độ tải trang cực nhanh và tự động co giãn (auto-scaling):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             NGƯỜI DÙNG & KHÁCH HÀNG                         │
│  - Trình duyệt Web (Desktop / Mobile)                                      │
│  - Điện thoại thông minh có NFC (Chạm vào cán túi để kiểm tra Passport)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / DNS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HẠ TẦNG VERCEL EDGE NETWORK                          │
│                                                                             │
│  [Front-end Static & SSR]               [Serverless Back-end (be/)]         │
│  - Trang chủ, 3D Canvas, Shop           - /api/products (CRUD Firestore)    │
│  - /checkout (Địa chỉ 3 cấp VN)         - /api/orders/checkout (Đặt hàng)  │
│  - /passport/[batchId] (NFC Passport)   - /api/payment/webhook (PayOS QR)   │
│  - /admin (Hệ điều hành xưởng)          - /api/passport/claim (Bảo hành)    │
└──────────────────────┬──────────────────────────────────┬───────────────────┘
                       │                                  │
          Firebase Admin SDK                              │ Webhooks / API
                       │                                  │
                       ▼                                  ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     GOOGLE CLOUD FIRESTORE DB        │  │     CÁC DỊCH VỤ NGOẠI VI (3RD)    │
│  - products: Danh mục mẫu túi        │  │  - PayOS / VietQR (MB Bank)       │
│  - orders: Đơn hàng & thanh toán     │  │  - Resend API (Email xác nhận)    │
│  - batches: Kiện lưới ma thu hồi     │  │  - Cloudflare / Tên miền .vn      │
│  - bag_items: Kho túi & Serial NFC   │  │  - Chip NFC NTAG213 / NTAG215     │
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## 2. DANH MỤC TÀI KHOẢN & DỊCH VỤ CẦN CHUẨN BỊ

Để website hoạt động như một sàn thương mại điện tử chuyên nghiệp, bạn cần tạo các tài khoản miễn phí sau:

| Dịch vụ | Mục đích | Chi phí dự kiến | Link đăng ký |
| :--- | :--- | :--- | :--- |
| **GitHub** | Lưu trữ mã nguồn & kích hoạt CI/CD | Miễn phí | [github.com](https://github.com) |
| **Vercel** | Hosting Front-end & chạy Serverless API (`be/`) | Miễn phí (Hobby Plan) | [vercel.com](https://vercel.com) |
| **Google Firebase** | Cơ sở dữ liệu Cloud Firestore & lưu trữ ảnh | Miễn phí (Spark Plan: 50.000 lượt đọc/ngày) | [console.firebase.google.com](https://console.firebase.google.com) |
| **PayOS / MB Bank** | Tạo mã VietQR động & tự động xác nhận chuyển khoản | Miễn phí | [payos.vn](https://payos.vn) |
| **Resend** | Gửi email biên nhận đơn hàng chuyên nghiệp | Miễn phí (3.000 email/tháng, 100 email/ngày) | [resend.com](https://resend.com) |
| **Tên miền riêng** | Tên miền thương hiệu (VD: `netocean.vn` hoặc `.com`) | ~200k - 500k VNĐ / năm | Mắt Bão, PA Việt Nam, Namecheap |

---

## 3. BẢNG BIẾN MÔI TRƯỜNG CHUẨN (ENVIRONMENT VARIABLES)

Các biến này cần được điền vào file `.env.local` khi chạy máy nội bộ và nhập vào **Vercel Project Settings ➔ Environment Variables** khi chạy thực tế:

```env
# ==========================================
# 1. CẤU HÌNH DOMAIN & MÔI TRƯỜNG CHÍNH
# ==========================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://netocean.vn

# ==========================================
# 2. GOOGLE FIREBASE CLIENT CONFIG (PUBLIC)
# Lấy tại: Firebase Console ➔ Project Settings ➔ General ➔ Web App
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=netsvecomnet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=netsvecomnet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=netsvecomnet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ==========================================
# 3. FIREBASE ADMIN SDK (BẢO MẬT BACK-END)
# Lấy tại: Firebase Console ➔ Project Settings ➔ Service accounts ➔ Generate new private key
# Lưu ý: Chuỗi JSON toàn bộ file service-account.json được viết trên 1 dòng
# ==========================================
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"netsvecomnet","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvgI...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@netsvecomnet.iam.gserviceaccount.com"}

# ==========================================
# 4. THANH TOÁN VIETQR & PAYOS (TỰ ĐỘNG KHỚP LỆNH)
# Lấy tại: payos.vn ➔ Kênh thanh toán
# ==========================================
NEXT_PUBLIC_MB_BANK_ACCOUNT=0987654321
NEXT_PUBLIC_MB_BANK_NAME=NGUYEN VAN DUC
NEXT_PUBLIC_MB_BANK_CODE=MB
PAYOS_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PAYOS_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PAYOS_CHECKSUM_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# 5. DỊCH VỤ EMAIL BIÊN NHẬN (RESEND API)
# Lấy tại: resend.com ➔ API Keys
# ==========================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_NOTIFICATION_EMAIL=dieuhanh@netocean.vn
```

---

## BƯỚC 1: THIẾT LẬP CƠ SỞ DỮ LIỆU CLOUD FIRESTORE

### 1.1. Tạo Database trên Google Cloud Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập tài khoản Google.
2. Bấm **Add project** ➔ Đặt tên (ví dụ: `net-ocean-ecommerce`) ➔ Tắt Google Analytics (hoặc bật nếu muốn) ➔ Bấm **Create project**.
3. Tại menu bên trái, chọn **Build** ➔ **Firestore Database** ➔ Bấm **Create database**.
4. Chọn vị trí lưu trữ (Location): **`asia-southeast1` (Singapore)** để có tốc độ truy vấn nhanh nhất từ Việt Nam.
5. Chọn chế độ bảo mật: Bắt đầu bằng **Production mode**.

### 1.2. Thiết lập Quy Tắc Bảo Mật (Firestore Security Rules)
Chuyển sang tab **Rules** trên Firestore Console và dán đoạn mã bảo mật sau, sau đó nhấn **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Bảng Sản Phẩm: Khách hàng chỉ được đọc, Admin sửa qua API backend
    match /products/{productId} {
      allow read: if true;
      allow write: if false; // Chỉ Firebase Admin SDK (server) mới có quyền ghi
    }

    // 2. Bảng Kiện Lưới & Túi Thành Phẩm: Công khai đọc để quét NFC
    match /batches/{batchId} {
      allow read: if true;
      allow write: if false;
    }
    match /bag_items/{itemId} {
      allow read: if true;
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isClaimed', 'ownerName', 'ownerPhone', 'warrantyEndDate', 'claimedAt']);
    }

    // 3. Bảng Đơn Hàng: Cho phép khách tạo đơn mới, chặn sửa xoá trái phép
    match /orders/{orderId} {
      allow read: if true;
      allow create: if request.resource.data.totalAmount > 0;
      allow update, delete: if false; // Chỉ cập nhật qua API thanh toán hoặc Admin
    }

    // 4. Bảng Khách Hàng / Thành Viên
    match /customers/{customerId} {
      allow read, write: if request.auth != null && request.auth.uid == customerId;
    }
  }
}
```

### 1.3. Lấy Service Account Private Key cho Back-end
1. Vào **Project Settings** (biểu tượng bánh răng ở góc trên bên trái) ➔ Chọn tab **Service accounts**.
2. Bấm nút **Generate new private key** ➔ Xác nhận tải file `.json` về máy.
3. Mở file `.json` vừa tải, copy toàn bộ nội dung và gán vào biến môi trường `FIREBASE_SERVICE_ACCOUNT_KEY` (xem định dạng ở Mục 3).

---

## BƯỚC 2: ĐẨY MÃ NGUỒN LÊN GITHUB

Mã nguồn đã được thiết lập sẵn file `.gitignore` để tránh lộ các khóa bảo mật bí mật.

Mở Terminal trên máy tính tại thư mục dự án và chạy các lệnh:

```bash
# 1. Kiểm tra trạng thái các file đã chỉnh sửa
git status

# 2. Thêm toàn bộ mã nguồn vào staging
git add .

# 3. Tạo commit với nội dung cập nhật
git commit -m "feat(production): add complete backend architecture, deployment guide, and administrative system"

# 4. Đẩy mã nguồn lên nhánh chính (main) của GitHub
git push origin main
```

---

## BƯỚC 3: TRIỂN KHAI LÊN VERCEL (FRONT-END & SERVERLESS BACK-END)

### 3.1. Kết nối Repository vào Vercel
1. Truy cập [vercel.com](https://vercel.com) ➔ Đăng nhập bằng tài khoản GitHub của bạn.
2. Tại trang tổng quan (Dashboard), bấm nút **Add New...** ➔ Chọn **Project**.
3. Tìm kho lưu trữ `VecomNet-s_Tsunami_Team` ➔ Bấm **Import**.

### 3.2. Cấu hình Dự Án trên Vercel
- **Project Name**: `net-ocean-eco` (hoặc tên thương hiệu của bạn).
- **Framework Preset**: Chọn `Next.js` (Vercel tự động nhận diện).
- **Root Directory**: Để trống `./`.
- **Build and Output Settings**:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### 3.3. Nhập Biến Môi Trường (Environment Variables)
1. Kéo xuống mục **Environment Variables**.
2. Nhập lần lượt toàn bộ các cặp Key / Value đã được liệt kê ở **Mục 3** của tài liệu này.
3. Chọn áp dụng cho cả 3 môi trường: `Production`, `Preview`, `Development`.
4. Bấm nút **Deploy**.

> ⏳ Quá trình đóng gói sẽ diễn ra trong khoảng 1–2 phút. Khi hoàn tất, Vercel sẽ hiển thị màn hình chúc mừng kèm đường dẫn website dạng `https://net-ocean-eco.vercel.app`.

---

## BƯỚC 4: CẤU HÌNH TÊN MIỀN TÙY CHỈNH (CUSTOM DOMAIN & SSL)

Để vận hành thương mại điện tử thực tế, bạn cần sử dụng tên miền riêng (ví dụ: `netocean.vn` hoặc `tuiluoima.com`).

### 4.1. Thêm Domain trên Vercel Dashboard
1. Trên giao diện Vercel, chọn dự án của bạn ➔ **Settings** ➔ **Domains**.
2. Điền tên miền của bạn (ví dụ: `netocean.vn` và `www.netocean.vn`) ➔ Bấm **Add**.

### 4.2. Trỏ Bản Ghi DNS tại Nhà Cung Cấp Tên Miền
Truy cập trang quản lý DNS của nhà cung cấp tên miền (Mắt Bão, PA Việt Nam, Cloudflare...) và thêm 2 bản ghi sau:

| Loại (Type) | Tên bản ghi (Host / Name) | Giá trị trỏ đến (Value / Target) | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` (hoặc để trống) | `76.76.21.21` | 3600 |
| **CNAME** | `www` | `cname.vercel-dns.com.` | 3600 |

> ✅ Vercel sẽ tự động cấp chứng chỉ bảo mật **SSL (HTTPS)** miễn phí từ Let's Encrypt trong vòng 5–15 phút sau khi DNS được phân giải xong.

---

## BƯỚC 5: KÍCH HOẠT CỔNG THANH TOÁN TỰ ĐỘNG (VIETQR & PAYOS)

Hệ thống hỗ trợ 2 phương thức chuyển khoản:
1. **VietQR Tiêu Chuẩn (MB Bank)**: Hiển thị mã QR ngân hàng chuẩn NAPAS247 kèm cú pháp thanh toán đơn hàng. Khách quét app ngân hàng thanh toán ngay lập tức.
2. **PayOS Tự Động (Khớp lệnh thời gian thực)**:
   - Đăng ký tài khoản doanh nghiệp hoặc cá nhân tại [payos.vn](https://payos.vn).
   - Kết nối tài khoản ngân hàng của bạn.
   - Lấy 3 thông số: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
   - Cài đặt Webhook URL trên PayOS:
     ```text
     https://netocean.vn/api/payment/webhook
     ```
   - Khi khách hàng quét mã và tiền vào tài khoản ngân hàng, PayOS sẽ gửi tín hiệu webhook về máy chủ Next.js để tự động chuyển trạng thái đơn hàng sang **"ĐÃ THANH TOÁN (PAID)"** và trừ số lượng tồn kho ngay lập tức.

---

## BƯỚC 6: CẤU HÌNH DỊCH VỤ EMAIL TỰ ĐỘNG (RESEND / SMTP)

Mỗi khi có đơn hàng mới phát sinh:
- Khách hàng nhận được email biên nhận đẹp mắt kèm danh sách sản phẩm, số kg rác nhựa đã giảm thiểu và thông tin bảo hành điện tử.
- Quản trị viên xưởng nhận được thông báo đơn hàng mới để đóng gói và may lót.

### Các bước cấu hình Resend:
1. Đăng ký tại [resend.com](https://resend.com).
2. Vào mục **Domains** ➔ Bấm **Add Domain** (ví dụ: `netocean.vn`).
3. Cấu hình 3 bản ghi DNS (SPF, DKIM, DMARC) vào trình quản lý tên miền của bạn theo hướng dẫn của Resend để email không bị rơi vào hộp thư rác (Spam).
4. Vào mục **API Keys** ➔ Tạo khóa mới và điền vào biến `RESEND_API_KEY` trên Vercel.

---

## BƯỚC 7: QUY TRÌNH GHI CHIP NFC VÀO TÚI THẬT (NFC HARDWARE PROVISIONING)

Để tạo trải nghiệm chạm điện thoại kích hoạt bảo hành như vợt thể thao thông minh Sypik:

### 7.1. Chuẩn Bị Phần Cứng
- **Loại chip**: Mua thẻ chip dán hoặc nút cúc **NFC NTAG213** hoặc **NTAG215** (chuẩn ISO/IEC 14443-A, tần số 13.56 MHz, có lớp chống nước).
- **Vị trí tích hợp**: May âm bên trong lớp lót quai xách của túi, tại vị trí có thêu logo biểu tượng sóng biển NÉT.

### 7.2. Ghi Dữ Liệu Lên Chip Bằng Smartphone
1. Tải ứng dụng miễn phí **NFC Tools** trên điện thoại (có sẵn trên cả App Store và Google Play).
2. Mở ứng dụng ➔ Chọn tab **Write (Ghi)** ➔ Bấm **Add a record (Thêm bản ghi)**.
3. Chọn loại **Custom URL / URI**.
4. Nhập đường link Hộ Chiếu Điện Tử tương ứng với Serial của chiếc túi:
   ```text
   https://netocean.vn/passport/PACK-DN-2024-01-001
   ```
   *(Thay `PACK-DN-2024-01-001` bằng Serial thực tế được sinh từ tab Quản Trị Xưởng)*.
5. Bấm nút **Write** ➔ Áp mặt lưng điện thoại vào vị trí chip NFC trên túi xách để ghi link trong 1 giây.
6. *(Tùy chọn nâng cao)*: Chọn mục **Lock Tag** để khóa chip, chống người lạ ghi đè đường link khác lên sản phẩm.

### 7.3. Trải Nghiệm Khách Hàng Khi Mua Túi Về
- **Trước khi mua**: Khách chạm điện thoại ➔ Màn hình hiện ngày vớt lưới, tọa độ GPS bãi san hô Sơn Trà, người thợ may, chứng chỉ sinh thái.
- **Sau khi mua**: Khách hàng nhập Số điện thoại & Họ tên ➔ Hệ thống kích hoạt **Bảo hành điện tử 24 tháng chính chủ**, lưu trực tiếp vào cơ sở dữ liệu xưởng.

---

## BƯỚC 8: KHỞI TẠO DỮ LIỆU & VẬN HÀNH BÁN HÀNG

Sau khi trang web đã được triển khai lên tên miền chính thức:

1. **Truy cập Trang Quản Trị**:  
   Mở trình duyệt vào đường dẫn: `https://netocean.vn/admin/login`.
2. **Đăng nhập Hệ Điều Hành Xưởng**:  
   Nhập Master Key: `NET-OCEAN-ADMIN-2024` (hoặc bấm *Nạp Khóa Demo*).
3. **Nạp Danh Mục Sản Phẩm**:  
   Chuyển sang tab **"Sản Phẩm"** ➔ Bấm nút **"Tải Lại"** để máy chủ tự động đẩy 4 dòng túi biểu tượng lên Google Cloud Firestore.
4. **Nhập Kiện Lưới Đầu Tiên**:  
   Vào tab **"1. Nhập Lưới"** ➔ Bấm **"+ Nhập Kiện Mới & Gán Dải Túi"** ➔ Điền tọa độ vớt lưới (Đà Nẵng, Nam Ô, Cù Lao Chàm...) ➔ Hệ thống sẽ tự động cấp dải Serial và dải Mã Vạch phục vụ may lót.
5. **Đồng Bộ Dữ Liệu**:  
   Bấm nút **"⚡ Đồng Bộ Cloud Firestore"** ở thanh trên cùng để đảm bảo mọi dữ liệu kho hàng đã sẵn sàng phục vụ khách hàng trên toàn quốc.

---

## CHECKLIST KIỂM THỬ TRƯỚC KHI MỞ BÁN (PRE-LAUNCH CHECKLIST)

Trước khi công bố website chính thức tới người tiêu dùng, bạn cần kiểm tra tuần tự các hạng mục sau:

- [ ] **Kiểm tra Giao Diện & Trải Nghiệm Khách**:
  - [ ] Trang chủ tải mượt mà, hiệu ứng sóng đại dương Living Ocean Canvas hoạt động tốt.
  - [ ] Bộ tùy biến 3D (Customizer) xoay 360 độ, đổi màu túi và gắn charm trơn tru.
  - [ ] Trang Catalog lọc đúng theo danh mục túi tote, crossbody, bucket.
- [ ] **Kiểm tra Luồng Đặt Hàng & Giỏ Hàng**:
  - [ ] Thêm sản phẩm vào giỏ, chọn số lượng, tăng giảm chính xác.
  - [ ] Tại trang `/checkout`, bộ chọn Địa chỉ 3 cấp Việt Nam (Tỉnh/Thành ➔ Quận/Huyện ➔ Phường/Xã) hiển thị đầy đủ 63 tỉnh thành.
  - [ ] Phí vận chuyển tự động tính toán (Đồng giá 30k nội thành, miễn phí cho đơn trên 1.500.000đ).
- [ ] **Kiểm tra Thanh Toán & Trừ Kho**:
  - [ ] Đặt 1 đơn hàng thử nghiệm với phương thức Chuyển khoản QR.
  - [ ] Mã VietQR hiển thị đúng số tài khoản, số tiền và nội dung đơn hàng.
  - [ ] Vào trang `/admin?tab=inventory` xác nhận số lượng tồn kho của mẫu túi vừa đặt đã tự động giảm đi 1.
- [ ] **Kiểm tra Hộ Chiếu Điện Tử & Bảo Hành**:
  - [ ] Dùng điện thoại mở trang `/passport/PACK-DN-2024-01-001`.
  - [ ] Nhập thông tin khách hàng kích hoạt bảo hành điện tử 24 tháng.
  - [ ] Thẻ chuyển sang trạng thái kim cương xanh/vàng chính chủ.
- [ ] **Kiểm tra Tuân Thủ Pháp Lý & Chính Sách Thương Mại Điện Tử**:
  - [ ] Chân trang (Footer) hiển thị đầy đủ thông tin doanh nghiệp, mã số thuế, hotline và biểu tượng *"ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG"*.
  - [ ] Trang [`/policies`](file:///Users/3o/Documents/Study/Vecomnets/src/app/policies/page.tsx) hoạt động tốt với đủ 5 tab: Điều khoản dịch vụ, Chính sách bảo mật, Chính sách đổi trả & bảo hành, Chính sách vận chuyển, Phương thức thanh toán.

---

*Hệ thống NÉT đã hoàn toàn sẵn sàng vận hành thương mại điện tử thực tế. Chúc dự án ra mắt thành công và lan tỏa mạnh mẽ thông điệp tái chế bảo vệ đại dương!*
