TÀI LIỆU YÊU CẦU KỸ THUẬT (PRD) - WEBSITE E-COMMERCE "NÉT"
1. TỔNG QUAN DỰ ÁN
Dự án "Nét - Túi lưới tái chế & Charm" nhằm mục đích xây dựng một nền tảng thương mại điện tử bền vững, kinh doanh các sản phẩm túi làm từ lưới đánh cá tái chế kết hợp với các phụ kiện (Charm) trang trí. Điểm nhấn kỹ thuật trọng tâm là công cụ tùy biến sản phẩm trực quan, mang lại trải nghiệm cá nhân hóa tối đa cho khách hàng.
1.1. Mục tiêu hệ thống
Thiết lập kênh bán hàng D2C (Direct-to-Consumer) chuyên nghiệp.
Cung cấp bộ công cụ Customization 2D tương tác thời gian thực.
Xây dựng hệ thống truy xuất nguồn gốc (Traceability) để chứng minh tác động môi trường.
1.2. Tech Stack Đề xuất
Dựa trên tính chất phức tạp của công cụ Customization, khuyến nghị sử dụng mô hình Headless Commerce hoặc Custom Build:

Frontend: Next.js (React) để tối ưu SEO và hiệu năng rendering.
Customization Canvas: Fabric.js hoặc Konva.js (Xử lý 2D Canvas).
Backend: Node.js (NestJS) hoặc tích hợp Shopify Storefront API.
Database: PostgreSQL (cho dữ liệu sản phẩm/đơn hàng) và Redis (cho caching).
Storage: AWS S3 hoặc Google Cloud Storage (Lưu trữ ảnh custom của user).
2. SITEMAP & USER FLOW
2.1. Cấu trúc Website (Sitemap)
Trang chủ: Hero section (Brand story), Sản phẩm nổi bật, Call-to-action (CTA) dẫn vào Tool Custom.
Danh mục sản phẩm (Shop):
Product Listing: Túi cơ bản, Bộ sưu tập Charm rời.
Product Detail: Chi tiết thông số, chất liệu tái chế.
Customization Tool (Nét Lab): Giao diện thiết kế túi.
Our Story: Quy trình tái chế rác thải biển, giá trị cốt lõi của "Nét".
B2B / Gifting: Form liên hệ cho đơn hàng doanh nghiệp/quà tặng số lượng lớn.
Trang hỗ trợ: FAQ, Chính sách đổi trả, Tra cứu vận đơn.
Thanh toán: Giỏ hàng, Checkout (1-page), Thông báo thành công.
2.2. User Flow chính (Customization Flow)
Entry: User chọn "Thiết kế túi của bạn" từ Menu hoặc Homepage.
Selection: Chọn phôi túi (Base) -> Chọn màu sắc/kích thước.
Interaction: Mở khay Charm -> Kéo/Thả hoặc Click chọn Charm -> Di chuyển trên lưới túi.
Review: Xem tổng giá trị -> Chụp ảnh preview (tự động) -> Thêm vào giỏ.
Conversion: Điền thông tin -> Thanh toán -> Nhận email xác nhận kèm hình thiết kế.
3. YÊU CẦU TÍNH NĂNG (FUNCTIONAL REQUIREMENTS)
3.1. Tính năng E-commerce Cốt lõi
Tính năng
Mô tả chi tiết
Quản lý danh mục
Phân loại theo: Phôi túi, Charm theo chủ đề, Combo bán sẵn.
Biến thể sản phẩm
Hỗ trợ thuộc tính màu sắc, kích cỡ túi, chất liệu lưới.
Giỏ hàng nâng cao
Lưu trữ metadata của sản phẩm custom (tọa độ charm, ID phôi túi).
Cổng thanh toán
Tích hợp SDK: VNPay, Momo và phương thức COD.
Quản lý đơn hàng
Dashboard cho Admin theo dõi trạng thái: Chờ xử lý, Đang gia công (cho hàng custom), Đang giao, Hoàn tất.

3.2. Tính năng Product Customization (Trọng tâm)
Đây là module phức tạp nhất, yêu cầu Dev Frontend xử lý kỹ phần tương tác:

Giao diện Canvas: Sử dụng Canvas 2D để render hình ảnh phôi túi làm background.
Hệ thống lưới (Grid Logic):
Thiết lập các điểm neo (Anchor points) trên mặt túi tương ứng với mắt lưới.
Charm khi kéo thả sẽ tự động "Snap" vào các điểm neo gần nhất để đảm bảo tính thẩm mỹ và thực tế khi gia công.
Logic Ràng buộc:
Giới hạn số lượng Charm tối đa trên một mẫu túi (theo diện tích bề mặt).
Ngăn chặn việc chồng lấp (Overlap) giữa các Charm nếu cần thiết.
Real-time Pricing:
Tổng giá = Giá phôi túi + Σ(Giá từng loại charm).
Cập nhật ngay lập tức khi user thêm/bớt charm.
Snapshot Generation: Khi user bấm "Thêm vào giỏ", hệ thống export canvas thành file ảnh (PNG/WebP) và lưu vào server để nhân viên đóng gói nhìn theo mẫu.
3.3. Truy xuất nguồn gốc & Tác động (QR Code)
Cơ chế: Mỗi lô sản xuất rác thải tái chế được gán một mã Batch ID.
Đơn hàng B2B/Gift: Hệ thống tự động tạo mã QR duy nhất cho mỗi đơn hàng/set quà.
Trang Landing Page Traceability: Khi quét QR, khách hàng xem được:
Tọa độ/Vùng biển nơi rác được thu gom.
Số kg nhựa đã được tái chế từ đơn hàng này.
Video/Hình ảnh quy trình sản xuất thực tế.
4. YÊU CẦU UI/UX
4.1. Nguyên tắc thiết kế
Mobile-First: Tối ưu hóa vùng chạm (Touch targets) cho việc kéo thả charm trên màn hình cảm ứng nhỏ.
Aesthetic: Sử dụng phong cách Minimalism, bảng màu trung tính (Earthy tones) để làm nổi bật màu sắc của túi và charm.
Loading State: Sử dụng Skeleton screen trong khi load các asset hình ảnh của Tool Customization.
4.2. Chỉ số trải nghiệm (UX Metrics)
Time to Interact (TTI): Tool Customization phải sẵn sàng tương tác trong < 2.5 giây.
Interaction Smoothness: Tốc độ khung hình (FPS) khi kéo thả object trên canvas không thấp hơn 60fps.
5. BẢO MẬT & PERFORMANCE
5.1. Performance
Image Optimization: Sử dụng định dạng WebP cho toàn bộ ảnh sản phẩm. Cung cấp nhiều kích thước (Responsive Images) qua CDN.
Caching Strategy: Cấu hình Cache-Control cho các tài sản tĩnh (Icons, Charm SVG).
Lazy Loading: Áp dụng cho các phần tử ngoài màn hình đầu tiên (Below the fold).
5.2. Bảo mật
SSL: Chứng chỉ HTTPS bắt buộc toàn trang.
Data Integrity: Validate giá tiền ở phía Server-side, không tin cậy hoàn toàn vào dữ liệu giá gửi từ Frontend.
API Security: Sử dụng JWT (JSON Web Token) cho các request từ user đã đăng ký và rate limiting để chống spam form B2B.
6. THÔNG TIN PHỤ TRỢ (PLACEHOLDERS)
Dưới đây là các thông tin cần bổ sung sau khi chốt phương án triển khai:

Đại diện ký duyệt tài liệu: Person
Ngày bắt đầu giai đoạn phát triển: Date
Tài liệu thiết kế chi tiết (Figma): File
Địa điểm kho/văn phòng vận hành: Place

