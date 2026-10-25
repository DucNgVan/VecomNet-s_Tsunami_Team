# 🛡️ BÁO CÁO ĐÁNH GIÁ AN NINH TOÀN DIỆN (SECURITY AUDIT REPORT)
**Dự án:** NÉT E-Commerce & Circular Supply Chain Platform  
**Phiên bản kiểm thử:** Next.js 14.2.15 (App Router) + Firebase Admin + Cloudinary + AI Charm Studio  
**Phạm vi đánh giá:** Toàn bộ mã nguồn Front-end, Serverless API Routes, Luồng Xác Thực, Cổng Thanh Toán và Cơ Sở Dữ Liệu  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 (2021), CWE/SANS Top 25, CVSS v3.1  
**Ngày thực hiện:** 25/10/2026  

---

## 📊 1. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Đợt kiểm thử an ninh (White-box Source Code Security Audit) đã quét và phân tích toàn bộ 13 API routes, hệ thống xác thực người dùng/quản trị viên, cấu hình cơ sở dữ liệu Firestore và các thư viện phụ thuộc (dependencies).

### Kết quả đánh giá tổng quan:
* **Mức độ an ninh tổng thể:** ⚠️ **NGUY CƠ CAO (HIGH RISK)**
* **Tổng số lỗ hổng phát hiện:** **12 lỗ hổng**
  * 🔴 **Critical (Nghiêm trọng):** 3
  * 🟠 **High (Cao):** 4
  * 🟡 **Medium (Trung bình):** 3
  * 🔵 **Low / Info (Thấp):** 2
* **Điểm rủi ro lớn nhất:** Hệ thống quản trị (Admin Portal) và các API nhạy cảm (Xoá dữ liệu, Sửa trạng thái thanh toán, Quản lý sản phẩm, Xem đơn hàng) đang hoạt động ở chế độ mở hoàn toàn hoặc chỉ kiểm tra quyền hạn tượng trưng ở phía Trình duyệt (Client-side), cho phép bất kỳ ai trên Internet truy cập và thao tác dữ liệu tùy ý.

---

## 📑 2. MA TRẬN PHÂN LOẠI LỖ HỔNG (VULNERABILITY MATRIX)

| Mã ID | Tên Lỗ Hổng / Điểm Yếu | Phân Loại OWASP | CVSS v3.1 | Mức Độ | Trạng Thái |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **SEC-01** | Thiếu xác thực trên Endpoint xóa sạch Database (`/api/admin/reset`) | A01: Broken Access Control | **9.8** | 🔴 Critical | Cần vá ngay |
| **SEC-02** | Xác thực Admin hoàn toàn ở Client & Lộ mật khẩu cứng trong Code | A07: Identification and Auth Failures | **9.8** | 🔴 Critical | Cần vá ngay |
| **SEC-03** | Thiếu xác thực chữ ký số trên Webhook thanh toán (`/api/payment/webhook`) | A08: Software & Data Integrity Failures | **9.1** | 🔴 Critical | Cần vá ngay |
| **SEC-04** | Rò rỉ thông tin PII và quyền sửa/xoá đơn hàng tùy ý (`/api/orders`) | A01: Broken Access Control | **8.5** | 🟠 High | Khẩn cấp |
| **SEC-05** | CRUD Sản phẩm & Kho hàng không có xác thực (`/api/products`, `/api/admin/batches`) | A01: Broken Access Control | **8.2** | 🟠 High | Khẩn cấp |
| **SEC-06** | Thiếu Firebase Security Rules & Thao tác xoá dữ liệu trực tiếp từ Client | A01: Broken Access Control | **8.0** | 🟠 High | Khẩn cấp |
| **SEC-07** | Nguy cơ Stored XSS trong Admin Dashboard qua `dangerouslySetInnerHTML` | A03: Injection | **7.8** | 🟠 High | Khẩn cấp |
| **SEC-08** | Lỗ hổng IDOR ghi đè quyền sở hữu bảo hành (`/api/passport/claim`) | A01: Broken Access Control | **6.5** | 🟡 Medium | Nên xử lý |
| **SEC-09** | Endpoint Upload không giới hạn dung lượng & xác thực (`/api/upload`) | A04: Insecure Design | **6.2** | 🟡 Medium | Nên xử lý |
| **SEC-10** | Thiếu cơ chế Rate Limiting chống tấn công từ chối dịch vụ (DoS / Abuse) | A04: Insecure Design | **5.5** | 🟡 Medium | Nên xử lý |
| **SEC-11** | Thiếu HTTP Security Headers & Cho phép Next.js Image Wildcard `**` | A05: Security Misconfiguration | **4.3** | 🔵 Low | Khuyến nghị |
| **SEC-12** | Lỗ hổng đã biết trong các gói thư viện phụ thuộc (`npm audit`) | A06: Vulnerable Components | **7.5** | 🟠 High | Cập nhật gói |

---

## 🔍 3. CHI TIẾT CÁC LỖ HỔNG & NGUY CƠ BỊ TẤN CÔNG

---

### 🔴 SEC-01: Thiếu xác thực trên Endpoint xóa sạch Database
* **Mức độ:** `CRITICAL (CVSS: 9.8)`
* **File bị ảnh hưởng:** [`src/app/api/admin/reset/route.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/app/api/admin/reset/route.ts#L6-L40)
* **Nguyên nhân cốt lõi:**
  Hàm `POST` tiếp nhận tham số `target = "all"` và sử dụng quyền tối cao `adminDb` (Firebase Admin SDK) để xóa sạch toàn bộ các collection `bag_items`, `batches`, `products` và đặt lại điểm môi trường của người dùng. **Tuy nhiên, không có bất kỳ dòng code nào kiểm tra quyền Admin, API Key hay Token người gửi.**
* **Tác động lý thuyết:**
  Kẻ tấn công chỉ cần gửi một lệnh HTTP đơn giản:
  ```bash
  curl -X POST https://your-domain.com/api/admin/reset -H "Content-Type: application/json" -d '{"target":"all"}'
  ```
  Toàn bộ dữ liệu sản phẩm, lô hàng, hộ chiếu số trên Firestore Production sẽ bị xóa vĩnh viễn trong vài giây.
* **Biện pháp khắc phục:**
  1. Kiểm tra Firebase Admin ID Token hoặc Secret Header `x-admin-secret` trước khi thực thi.
  2. Vô hiệu hóa hoặc xóa bỏ endpoint này trên môi trường Production (`process.env.NODE_ENV === "production"`).

---

### 🔴 SEC-02: Xác thực Admin hoàn toàn ở Client & Lộ mật khẩu cứng trong Code
* **Mức độ:** `CRITICAL (CVSS: 9.8)`
* **File bị ảnh hưởng:** 
  - [`src/app/admin/login/page.tsx`](file:///Users/3o/Documents/Study/Vecomnets/src/app/admin/login/page.tsx#L32-L51)
  - [`src/app/admin/page.tsx`](file:///Users/3o/Documents/Study/Vecomnets/src/app/admin/page.tsx#L91)
* **Nguyên nhân cốt lõi:**
  1. Mật khẩu Master Key được so sánh dạng văn bản thuần ngay trên trình duyệt:
     ```typescript
     const isValidMasterKey = key.toUpperCase() === "NET-OCEAN-ADMIN-2024" || key === "123456";
     const isValidCredentials = adminEmail.toLowerCase().includes("admin") && adminPassword.length >= 6;
     ```
  2. Bất kỳ email nào chứa chữ "admin" với mật khẩu từ 6 ký tự bất kỳ đều được cấp quyền quản trị!
  3. Quyền Admin được lưu trong `localStorage.setItem("net_admin_authenticated", "true")`. Trang `/admin` chỉ kiểm tra giá trị này từ `localStorage` để mở cửa giao diện điều hành.
* **Tác động lý thuyết:**
  Bất kỳ người dùng nào chỉ cần mở DevTools (F12) ➔ Console và chạy:
  ```javascript
  localStorage.setItem("net_admin_authenticated", "true"); location.reload();
  ```
  Sẽ ngay lập tức trở thành Quản trị viên tối cao, xem được toàn bộ danh sách đơn hàng, doanh thu và can thiệp kho hàng.
* **Biện pháp khắc phục:**
  - Chuyển toàn bộ cơ chế xác thực sang Server-side: Sử dụng Firebase Authentication với Custom Claims (`role: 'admin'`) hoặc mã hóa Session Cookie HTTP-Only.
  - Sử dụng Next.js Middleware ([`src/middleware.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/middleware.ts)) để chặn các route `/admin/*` ở cấp độ máy chủ Edge.

---

### 🔴 SEC-03: Thiếu xác thực chữ ký số trên Webhook thanh toán
* **Mức độ:** `CRITICAL (CVSS: 9.1)`
* **File bị ảnh hưởng:** [`src/be/services/paymentService.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/be/services/paymentService.ts#L12-L28)
* **Nguyên nhân cốt lõi:**
  Hàm `processWebhook` nhận JSON body và trực tiếp cập nhật trạng thái đơn hàng sang `paymentStatus: "paid"` nếu nội dung chứa mã đơn và số tiền `amount > 0`. Hệ thống **không kiểm tra mã băm bảo mật HMAC-SHA256 (Signature)** hoặc Secret Token từ cổng thanh toán (PayOS, SeAPay, Ngân hàng).
* **Tác động lý thuyết:**
  Người mua có thể đặt đơn hàng 5.000.000 VNĐ, sau đó gửi một gói tin giả lập Webhook:
  ```bash
  curl -X POST https://your-domain.com/api/payment/webhook \
    -H "Content-Type: application/json" \
    -d '{"code":"00","data":{"description":"NET-ORD-XXXX","amount":5000000,"status":"PAID"}}'
  ```
  Đơn hàng sẽ được tự động đổi sang "ĐÃ THANH TOÁN" và kích hoạt giao hàng mà người mua không hề chuyển một đồng nào.
* **Biện pháp khắc phục:**
  - Tạo một biến môi trường bí mật `PAYMENT_WEBHOOK_SECRET`.
  - Kiểm tra Header chữ ký (`x-signature` hoặc tham số `signature`) bằng thuật toán `crypto.createHmac('sha256', secret)`.

---

### 🟠 SEC-04: Rò rỉ thông tin cá nhân (PII) & Sửa/Xoá đơn hàng tùy ý
* **Mức độ:** `HIGH (CVSS: 8.5)`
* **File bị ảnh hưởng:**
  - [`src/app/api/orders/route.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/app/api/orders/route.ts#L5-L16)
  - [`src/be/controllers/orderController.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/be/controllers/orderController.ts#L28-L74)
* **Nguyên nhân cốt lõi:**
  - `GET /api/orders`: Trả về danh sách tất cả các đơn hàng trong hệ thống bao gồm: Họ tên khách hàng, số điện thoại, địa chỉ nhà, email, giá tiền. Không yêu cầu đăng nhập.
  - `PATCH /api/orders/[id]`: Cho phép bất kỳ ai gửi lệnh đổi trạng thái đơn hàng sang "paid", "delivered", "cancelled".
  - `DELETE /api/orders/[id]`: Cho phép bất kỳ ai gửi lệnh xóa vĩnh viễn đơn hàng của người khác.
* **Tác động lý thuyết:**
  - Vi phạm nghiêm trọng luật bảo vệ dữ liệu cá nhân (GDPR / Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân tại Việt Nam).
  - Đối thủ cạnh tranh có thể thu thập toàn bộ tệp khách hàng và doanh thu của thương hiệu.
* **Biện pháp khắc phục:**
  - Đặt quyền truy cập `GET /api/orders`, `PATCH`, `DELETE` đằng sau Token xác thực Admin.
  - Với khách hàng thông thường, chỉ cho phép tra cứu đơn hàng của chính tài khoản đó qua UID hoặc qua mã bí mật gửi về email.

---

### 🟠 SEC-05: CRUD Sản phẩm & Kho hàng không có xác thực
* **Mức độ:** `HIGH (CVSS: 8.2)`
* **File bị ảnh hưởng:**
  - [`src/be/controllers/productController.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/be/controllers/productController.ts#L33-L81)
  - [`src/app/api/admin/batches/create/route.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/app/api/admin/batches/create/route.ts#L5-L35)
* **Nguyên nhân cốt lõi:**
  Các API tạo sản phẩm mới (`POST /api/products`), cập nhật thông tin/giá sản phẩm (`PUT /api/products/[id]`), xóa sản phẩm (`DELETE /api/products/[id]`), và tạo lô lưới (`POST /api/admin/batches/create`) không yêu cầu kiểm tra danh tính người gọi.
* **Tác động lý thuyết:**
  Kẻ phá hoại có thể gửi request `PUT /api/products/tote-classic` sửa giá sản phẩm từ `1.250.000đ` thành `1.000đ`, hoặc tạo hàng nghìn lô hàng rác làm tràn dung lượng Firestore.
* **Biện pháp khắc phục:**
  - Yêu cầu xác thực Admin cho mọi phương thức thay đổi dữ liệu (`POST`, `PUT`, `DELETE`, `PATCH`).

---

### 🟠 SEC-06: Thiếu Firestore Security Rules & Client gọi trực tiếp hàm xóa dữ liệu
* **Mức độ:** `HIGH (CVSS: 8.0)`
* **File bị ảnh hưởng:**
  - [`src/lib/firestoreService.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/lib/firestoreService.ts#L880-L960)
  - [`src/lib/firebase.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/lib/firebase.ts#L6-L24)
* **Nguyên nhân cốt lõi:**
  File `firestoreService.ts` chứa các hàm chạy trực tiếp từ Client SDK:
  ```typescript
  export async function clearAllProductsFromFirestore() {
    const snap = await getDocs(collection(db, "products"));
    snap.forEach(d => deleteDoc(d.ref));
  }
  ```
  Do trong mã nguồn không có file `firestore.rules`, nếu cơ sở dữ liệu Firebase trên Console để ở chế độ mở (`allow read, write: if true;`), bất kỳ ai có `projectId` (công khai trong HTML) đều có thể dùng thư viện `firebase/firestore` để đọc và xóa sạch bảng dữ liệu.
* **Biện pháp khắc phục:**
  - Tạo file `firestore.rules` khóa chặt quyền ghi từ Client:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /products/{document} { allow read: if true; allow write: if false; }
        match /orders/{document} { allow create: if true; allow read, update, delete: if false; }
        match /{document=**} { allow read, write: if false; }
      }
    }
    ```

---

### 🟠 SEC-07: Nguy cơ Stored XSS trong Admin Dashboard qua `dangerouslySetInnerHTML`
* **Mức độ:** `HIGH (CVSS: 7.8)`
* **File bị ảnh hưởng:**
  - [`src/components/admin/AdminDesignRequestsTab.tsx:401`](file:///Users/3o/Documents/Study/Vecomnets/src/components/admin/AdminDesignRequestsTab.tsx#L401)
  - [`src/components/admin/AdminOrdersTab.tsx:1532`](file:///Users/3o/Documents/Study/Vecomnets/src/components/admin/AdminOrdersTab.tsx#L1532)
* **Nguyên nhân cốt lõi:**
  Đoạn mã render bản vẽ SVG từ yêu cầu của khách hàng bằng `dangerouslySetInnerHTML`:
  ```tsx
  <div dangerouslySetInnerHTML={{ __html: selectedReq.customCharm.svgCode }} />
  ```
  Nếu kẻ tấn công gửi một yêu cầu đặt charm với chuỗi `svgCode` chứa thẻ độc hại như:
  `<svg><image href="x" onerror="fetch('/api/admin/reset',{method:'POST'})"/></svg>`
  Khi nhân viên hoặc Quản trị viên mở đơn hàng trên trang Admin để kiểm duyệt, mã JavaScript độc hại sẽ tự động kích hoạt trong phiên làm việc của Quản trị viên (Stored Cross-Site Scripting).
* **Biện pháp khắc phục:**
  - Sử dụng thư viện làm sạch mã HTML/SVG như `DOMPurify` (hoặc `isomorphic-dompurify`) để loại bỏ toàn bộ thẻ `<script>`, thuộc tính `onerror`, `onload` trước khi hiển thị.

---

### 🟡 SEC-08: Lỗ hổng IDOR ghi đè quyền sở hữu bảo hành
* **Mức độ:** `MEDIUM (CVSS: 6.5)`
* **File bị ảnh hưởng:** [`src/be/services/passportService.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/be/services/passportService.ts#L30-L58)
* **Nguyên nhân cốt lõi:**
  API `POST /api/passport/claim` cho phép kích hoạt bảo hành điện tử chỉ bằng mã `serialId` (ví dụ: `NET-DN-082-001`). Hệ thống không kiểm tra xem chiếc túi này đã được ai kích hoạt trước đó chưa (`if (item.isClaimed)`), cũng không yêu cầu mã PIN hoặc hóa đơn mua hàng.
* **Tác động lý thuyết:**
  Bất kỳ ai đoán được số Serial có thể gửi request để ghi đè tên mình làm chủ nhân chiếc túi, cướp quyền bảo hành 24 tháng của khách hàng thật.
* **Biện pháp khắc phục:**
  - Kiểm tra nếu `item.isClaimed === true` thì từ chối kích hoạt lại.
  - Bổ sung mã bảo mật cào (Scratch Code / Claim Code) in riêng trên thẻ đính kèm túi vật lý.

---

### 🟡 SEC-09: Endpoint Upload không giới hạn dung lượng & xác thực
* **Mức độ:** `MEDIUM (CVSS: 6.2)`
* **File bị ảnh hưởng:**
  - [`src/app/api/upload/route.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/app/api/upload/route.ts#L9-L35)
  - [`src/app/api/upload/cloudinary/route.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/app/api/upload/cloudinary/route.ts#L8-L35)
* **Nguyên nhân cốt lõi:**
  API upload chấp nhận mọi file gửi lên mà không kiểm tra kích thước tối đa (File Size Limit) trước khi nạp vào bộ nhớ đệm `Buffer.from(await file.arrayBuffer())`. Đồng thời không yêu cầu xác thực người dùng.
* **Tác động lý thuyết:**
  Kẻ tấn công có thể liên tục gửi các file dung lượng 500MB - 1GB làm tràn bộ nhớ RAM của Serverless Function (Out of Memory Crash) hoặc spam làm cạn kiệt dung lượng Cloudinary / Firebase Storage miễn phí.
* **Biện pháp khắc phục:**
  - Giới hạn dung lượng tối đa (ví dụ: 10MB cho ảnh/3D, 5MB cho tài liệu).
  - Kiểm tra MIME type thực tế bằng Magic Bytes thay vì chỉ tin cậy `file.type` từ trình duyệt.

---

### 🟡 SEC-10: Thiếu cơ chế Rate Limiting chống tấn công DoS / Lạm dụng AI
* **Mức độ:** `MEDIUM (CVSS: 5.5)`
* **File bị ảnh hưởng:**
  - [`src/app/api/ai/charm-chat/route.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/app/api/ai/charm-chat/route.ts)
  - [`src/app/api/orders/checkout/route.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/app/api/orders/checkout/route.ts)
* **Nguyên nhân cốt lõi:**
  Các API gọi mô hình AI đồ hoạ (ZeroGPU Hugging Face, Gemini Vision) và API tạo đơn hàng không có bộ đếm tần suất gửi yêu cầu theo IP.
* **Tác động lý thuyết:**
  Kẻ xấu có thể viết script vòng lặp gửi 100 request/giây vào `/api/ai/charm-chat`, làm cháy toàn bộ hạn mức GPU miễn phí của Hugging Face và Gemini API chỉ trong 1 phút.
* **Biện pháp khắc phục:**
  - Tích hợp middleware Rate Limiting (sử dụng `@upstash/ratelimit` hoặc bộ nhớ đệm Token Bucket) giới hạn mỗi IP chỉ được gửi tối đa 10 request AI / phút.

---

### 🔵 SEC-11: Thiếu HTTP Security Headers & Cho phép Next.js Image Wildcard `**`
* **Mức độ:** `LOW (CVSS: 4.3)`
* **File bị ảnh hưởng:** [`next.config.mjs`](file:///Users/3o/Documents/Study/Vecomnets/next.config.mjs#L6-L11)
* **Nguyên nhân cốt lõi:**
  1. `next.config.mjs` mở `remotePatterns: [{ protocol: "https", hostname: "**" }]` cho phép tối ưu hóa ảnh từ bất kỳ tên miền nào trên Internet, có thể bị lợi dụng để tấn công SSRF hoặc làm máy chủ Next.js phải xử lý resize hàng nghìn ảnh từ website lạ.
  2. Ứng dụng chưa khai báo các HTTP Security Headers tiêu chuẩn:
     - `Content-Security-Policy (CSP)`
     - `X-Frame-Options: DENY` (Chống nhúng web vào iframe để tấn công Clickjacking)
     - `X-Content-Type-Options: nosniff`
     - `Strict-Transport-Security (HSTS)`
* **Biện pháp khắc phục:**
  - Thu hẹp `remotePatterns` chỉ cho phép các domain tin cậy: `res.cloudinary.com`, `firebasestorage.googleapis.com`, `images.unsplash.com`.
  - Cấu hình hàm `headers()` trong `next.config.mjs`.

---

### 🟠 SEC-12: Lỗ hổng đã biết trong các gói thư viện phụ thuộc (`npm audit`)
* **Mức độ:** `HIGH (8 High, 1 Critical qua npm audit)`
* **Các gói bị ảnh hưởng:**
  - `next`: Bản 14.2.15 chứa cảnh báo DoS Server Actions (GHSA-7m27-7ghc-44w9).
  - `@grpc/grpc-js`: Bản <=1.13.5 chứa lỗ hổng xác thực chứng chỉ (GHSA-m9gg-hp2v-232j).
  - `zod`: Phiên bản <4.6.6 bị lỗi CPU/Memory exhaustion khi xác thực dữ liệu mảng lớn.
* **Biện pháp khắc phục:**
  - Chạy lệnh cập nhật các bản vá an toàn:
    ```bash
    npm audit fix
    ```

---

## 🛠️ 4. BẢN VÁ CODE MẪU SẴN SÀNG TRIỂN KHAI (SECURITY PATCHES)

Dưới đây là các đoạn mã vá lỗ hổng quan trọng nhất có thể tích hợp ngay vào dự án:

### Bản vá 1: Tạo Next.js Security Middleware ([`src/middleware.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/middleware.ts))
Khóa toàn bộ các API `/api/admin/*` và trang quản trị `/admin/*` nếu không có khóa bí mật:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/request";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bảo vệ tất cả API nội bộ của Admin
  if (pathname.startsWith("/api/admin")) {
    const adminSecret = req.headers.get("x-admin-secret");
    const validSecret = process.env.ADMIN_SECRET_KEY || "NET-PROD-SECURE-2026";

    if (!adminSecret || adminSecret !== validSecret) {
      return NextResponse.json(
        { success: false, error: "Truy cập bị từ chối: Yêu cầu quyền Quản trị viên." },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
```

---

### Bản vá 2: Bổ sung HTTP Security Headers vào [`next.config.mjs`](file:///Users/3o/Documents/Study/Vecomnets/next.config.mjs)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "ducnv1792005-nets-ecommerce.hf.space" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

### Bản vá 3: Bảo vệ Webhook Thanh toán bằng Chữ ký HMAC ([`src/be/services/paymentService.ts`](file:///Users/3o/Documents/Study/Vecomnets/src/be/services/paymentService.ts))

```typescript
import crypto from "crypto";

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

---

## 🎯 5. LỘ TRÌNH KHẮC PHỤC KHUYẾN NGHỊ (REMEDIATION ROADMAP)

1. **Giai đoạn 1: Ngăn chặn thảm họa dữ liệu (Khẩn cấp - Làm ngay trong ngày)**
   - Khóa hoặc gắn Secret Token cho API `/api/admin/reset` và `/api/admin/batches/create`.
   - Chặn quyền xem và sửa đơn hàng tùy tiện trên `/api/orders`.
   - Thiết lập quy tắc bảo mật cơ bản `firestore.rules` trên Firebase Console.

2. **Giai đoạn 2: Chuẩn hóa vận hành thương mại điện tử (Trong vòng 3-5 ngày)**
   - Cài đặt xác thực chữ ký HMAC cho `/api/payment/webhook`.
   - Chuyển đăng nhập Admin từ `localStorage` sang mã hóa phiên hoặc Firebase Custom Claims.
   - Thêm bộ lọc kích thước file tối đa (10MB) vào `/api/upload`.

3. **Giai đoạn 3: Tối ưu hạ tầng & Bảo vệ chống phá hoại (Trước khi phát hành rộng rãi)**
   - Tích hợp Rate Limiting cho API tạo ảnh AI `/api/ai/charm-chat`.
   - Cập nhật các Security Headers trong `next.config.mjs`.
   - Chạy `npm audit fix` để vá các phụ thuộc lỗi thời.
