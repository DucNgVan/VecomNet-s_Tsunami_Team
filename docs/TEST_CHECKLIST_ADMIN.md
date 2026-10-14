# 📋 BỘ TÀI LIỆU KIỂM THỬ DÀNH CHO QUẢN TRỊ VIÊN & XƯỞNG MAY (ADMIN TEST CHECKLIST)
**Dự án:** NÉT - Sáng Tạo Sinh Thái Từ Lưới Ma (Eco Net Craft & Digital Story Passport)  
**Phiên bản kiểm thử:** v1.0.0-production-ready  
**Đối tượng thực hiện:** Quản trị viên hệ thống (Admin), Trưởng xưởng sản xuất (Workshop Manager), Điều phối viên chuỗi cung ứng (Supply Chain Lead), QA Tester  
**Môi trường:** Local (`http://localhost:3000/admin`) hoặc Production Vercel  

---

## 🎯 MỤC TIÊU KIỂM THỬ
Xác thực toàn bộ quy trình vận hành và điều hành chuỗi cung ứng khép kín:
1. **Nguyên lý cốt lõi của hệ thống NÉT:** Số lượng hàng có sẵn trong kho được quyết định bằng **Lệnh nhập lưới ma trục vớt và Lệnh cắt may xưởng**, KHÔNG PHẢI nhập tùy tiện ở trang mẫu mã bộ sưu tập.
2. Kiểm tra chuỗi cung ứng 3 cấp độ: Kiện lưới ma thô (`net_packs`) ➔ Lệnh sản xuất cắt may ➔ Kho thành phẩm có Serial & Căn cước số (`bag_items`).
3. Quản lý danh mục mẫu mã bộ sưu tập (chỉ định nghĩa kiểu dáng, giá niêm yết và ảnh đại diện).
4. **Quy trình Quản lý Đơn hàng & Xác nhận Giao nhận 2 chiều (Shop giao + Khách nhận):**
   - Tự động gán mã Serial túi cho đơn hàng.
   - Shop chuyển trạng thái "Đã Giao Xong" (`delivered`) ➔ Tự động lưu `shopDeliveredConfirmed: true`.
   - Theo dõi trạng thái khách hàng xác nhận nhận hàng và định danh túi.
   - Cung cấp link định danh độc bản để gửi cho khách hàng.
5. Kiểm tra các chức năng quản trị hệ thống: Xuất file CSV kiểm kê kho, Reset kho về mẻ lưới thực (mã ID bắt đầu từ 1), Xóa database túi đã định danh để kiểm thử sạch.

---

## 🛠️ CHUẨN BỊ MÔI TRƯỜNG TEST
- [ ] Khởi chạy ứng dụng: `npm run dev`.
- [ ] Mở trình duyệt vào đường dẫn: `http://localhost:3000/admin`.
- [ ] Mở tab song song: Tab 1 là Trang Quản trị (`/admin`), Tab 2 là Trang Khách hàng (`/profile` hoặc `/shop`) để kiểm tra tính đồng bộ dữ liệu thời gian thực.
- [ ] Mở Console trình duyệt (`F12`) để đảm bảo không có lỗi runtime JavaScript.

---

## GIAI ĐOẠN 1: ĐĂNG NHẬP & TỔNG QUAN HỆ THỐNG (ADMIN DASHBOARD TAB)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-A-01** | Truy cập trang Quản trị | Truy cập `http://localhost:3000/admin` | - Trang Admin tải mượt mà với 4 tab chính:<br>1. *Tổng Quan (Dashboard)*<br>2. *Chuỗi Cung Ứng & Xưởng May (Supply Chain)*<br>3. *Đơn Hàng & Giao Nhận (Orders)*<br>4. *Mẫu Mã Bộ Sưu Tập (Products)*. | `[ ]` |
| **TC-A-02** | Kiểm tra 4 Thẻ KPI vận hành | Quan sát 4 khối thống kê trên cùng | - **Doanh Thu Bán Hàng**: Hiển thị tổng tiền từ các đơn hàng thực tế (VND).<br>- **Đơn Đặt Hàng**: Hiển thị tổng số đơn thực tế.<br>- **Lưới Ma Đã Thu Gom**: Tổng số kg lưới trục vớt từ các kiện.<br>- **Túi Thành Phẩm Sẵn Sàng**: Số túi có Serial sẵn sàng bán (`in_stock`). | `[ ]` |
| **TC-A-03** | Khối Cảnh báo Vận hành (Smart Alerts) | Quan sát phần "Cảnh Báo Vận Hành & Khuyến Nghị Xử Lý" | - Tự động hiển thị các cảnh báo thông minh nếu:<br>+ Có đơn hàng mới chờ xưởng xử lý.<br>+ Có dáng túi sắp hết hàng trong kho.<br>+ Có kiện lưới ma mới nhập cần phân bổ lệnh may. | `[ ]` |
| **TC-A-04** | Các nút Lối tắt Thao tác nhanh (Quick Actions) | Nhấp lần lượt các nút: "Nhập Kiện Lưới Mới", "Tạo Lệnh May", "Xem Đơn Hàng" | - Chuyển đúng sang tab tương ứng với đúng form mở sẵn, không bị lỗi state. | `[ ]` |

---

## GIAI ĐOẠN 2: TIẾP NHẬN KIỆN LƯỚI MA THÔ (SUPPLY CHAIN - BƯỚC 1)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-A-05** | Mở form nhập kiện lưới ma mới | Chuyển sang tab **Chuỗi Cung Ứng**, chọn Bước 1: "1. Kiện Lưới Trục Vớt", bấm "Nhập Kiện Lưới Mới" | - Modal form tiếp nhận kiện lưới hiển thị đầy đủ các trường thông tin hải đồ. | `[ ]` |
| **TC-A-06** | Kiểm tra Validation form kiện lưới | Bỏ trống các trường bắt buộc hoặc nhập số kg âm (-5kg) rồi bấm "Lưu Kiện Lưới" | - Hệ thống chặn lại và báo lỗi yêu cầu nhập khối lượng hợp lệ (> 0kg) và chọn vùng biển. | `[ ]` |
| **TC-A-07** | Nhập kiện lưới ma thành công | Nhập dữ liệu mẻ lưới thực tế:<br>- Mã kiện: `PACK-DN-2024-TEST`<br>- Vùng biển: `Bán Đảo Sơn Trà - Hòn Sụp`<br>- Ngày trục vớt: Chọn ngày hiện tại<br>- Khối lượng: `25.5` kg<br>- Độ sâu: `14` m<br>- Đội thợ lặn: `Đội Tình Nguyện SASA Đà Nẵng`<br>- Loại polymer: `Nylon PA6`<br>Bấm nút **"Lưu Kiện Lưới Vào Hệ Thống"** | - Modal đóng lại.<br>- Toast thông báo thêm kiện lưới thành công.<br>- Kiện lưới mới xuất hiện ngay trên đầu danh sách với:<br>+ Tổng khối lượng: `25.5 kg`<br>+ Khối lượng khả dụng: `25.5 kg` (chưa tiêu hao).<br>- Đồng bộ trực tiếp lên Cloud Firestore `net_packs`. | `[ ]` |
| **TC-A-08** | Lọc và tra cứu kiện lưới | Nhập từ khóa `Sơn Trà` hoặc mã kiện vào thanh tìm kiếm | - Danh sách lọc chính xác kiện lưới cần tìm. | `[ ]` |

---

## GIAI ĐOẠN 3: LỆNH CẮT MAY & CHẾ TÁC THÀNH PHẨM (SUPPLY CHAIN - BƯỚC 2)

> [!IMPORTANT]
> **Nguyên lý phát triển bắt buộc:** Số lượng hàng có sẵn trong kho được quyết định bằng số lượng sản xuất từ mẻ lưới, từ đó mới nhập được số lượng hàng đang có. Không được nhập số lượng tùy tiện trong trang mẫu mã bộ sưu tập.

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-A-09** | Mở tab Lệnh May Xưởng | Chọn Bước 2: "2. Lệnh Cắt May Xưởng" trong tab Chuỗi Cung Ứng | - Hiển thị giao diện tạo lệnh sản xuất.<br>- Danh sách dropdown "Chọn Dáng Túi Cần May" **chỉ hiển thị các mẫu mã đang có trong Bộ Sưu Tập**. | `[ ]` |
| **TC-A-10** | Chọn kiện lưới nguồn & Mẫu mã | - Chọn kiện lưới vừa tạo (`PACK-DN-2024-TEST` - còn 25.5kg).<br>- Chọn dáng túi: `NÉT Tote Signature`.<br>- Chọn phối màu: `Đại Dương Xanh`. | - Hệ thống tự động hiển thị định mức tiêu hao nguyên liệu (VD: 0.65 kg lưới/túi). | `[ ]` |
| **TC-A-11** | Nhập số lượng & Tính toán tiêu hao tự động | Nhập số lượng cần may: `10` túi | - Hệ thống tự động tính: `10 túi * 0.65kg = 6.5 kg` lưới tiêu hao.<br>- Hiển thị khối lượng còn lại dự kiến của kiện: `25.5 - 6.5 = 19.0 kg`. | `[ ]` |
| **TC-A-12** | Test chặn vượt quá khối lượng kiện (Edge Case) | Nhập số lượng may vượt quá khả dụng (VD: `100` túi = 65kg > 25.5kg) | - Hệ thống hiển thị cảnh báo màu đỏ: *"Khối lượng lưới cần dùng vượt quá khối lượng còn lại trong kiện!"*.<br>- Nút bấm bị vô hiệu hóa hoặc chặn không cho tạo lệnh. | `[ ]` |
| **TC-A-13** | Khởi tạo lệnh sản xuất thành công | Đặt số lượng `5` túi, chọn Xưởng may: *Xưởng Lưới Biển Sơn Trà*, bấm nút **"Khởi Tạo Lệnh Cắt May"** | 1. Toast thông báo sản xuất thành công 5 túi thành phẩm.<br>2. Kiện lưới nguồn bị trừ chính xác `5 * 0.65 = 3.25 kg` (khối lượng còn lại giảm còn 22.25 kg).<br>3. Tự động sinh ra 5 chiếc túi độc bản có: Mã Serial duy nhất (dạng `NET-DN-...`), Mã vạch may lót Barcode 128, Mã QR Passport.<br>4. KPI "Túi Thành Phẩm Sẵn Sàng" tăng thêm 5 túi. | `[ ]` |

---

## GIAI ĐOẠN 4: KHO THÀNH PHẨM & CĂN CƯỚC SỐ (SUPPLY CHAIN - BƯỚC 3)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-A-14** | Kiểm tra danh sách Kho thành phẩm | Chuyển sang Bước 3: "3. Kho Thành Phẩm & Căn Cước Số" | - Hiển thị bảng danh sách toàn bộ các túi đã may xong.<br>- Mỗi túi có đầy đủ các cột: Mã Serial, Mã vạch (Barcode 128), Tên túi & Màu, Kiện lưới nguồn, Trạng thái kho (`Sẵn sàng bán`), Bảo Hành Điện Tử 24T (`Chưa kích hoạt`). | `[ ]` |
| **TC-A-15** | Tìm kiếm & Lọc kho thành phẩm | Nhập mã Serial hoặc chọn bộ lọc trạng thái "Sẵn sàng bán" | - Bảng lọc tức thì các sản phẩm khớp điều kiện. | `[ ]` |
| **TC-A-16** | Xem trực tiếp Story Passport của túi | Bấm vào biểu tượng liên kết hoặc nút "Story Passport" của một chiếc túi trong bảng | - Mở trang `/passport/{batchId}?itemId={serialId}` trong tab mới.<br>- Hiển thị thông tin Căn Cước Số xuất xưởng của đúng chiếc túi đó. | `[ ]` |
| **TC-A-17** | Xuất File CSV Kiểm Kê Kho (Export CSV) | Bấm nút **"Xuất File CSV Kiểm Kê Kho"** | - Trình duyệt tự động tải xuống file `NET_Kiem_Ke_Kho_Thanh_Pham_YYYYMMDD.csv`.<br>- Mở file bằng Excel hoặc Numbers: Đầy đủ các cột dữ liệu, tiếng Việt hiển thị chuẩn UTF-8 có dấu, không bị lỗi font (mojibake). | `[ ]` |

---

## GIAI ĐOẠN 5: QUẢN LÝ ĐƠN HÀNG & GIAO NHẬN 2 CHIỀU (ORDERS TAB)

> [!IMPORTANT]
> **Quy trình Xác nhận 2 chiều bắt buộc:** Khi Admin chuyển trạng thái sang `delivered`, hệ thống tự động ghi nhận `shopDeliveredConfirmed: true`. Đơn hàng chỉ hoàn tất định danh khi Khách hàng bấm nhận trên Profile.

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-A-18** | Xem danh sách đơn hàng thực tế | Chuyển sang tab **Đơn Hàng & Giao Nhận** | - Danh sách hiển thị đầy đủ các đơn hàng do khách đặt.<br>- Mỗi dòng hiển thị: Mã đơn (dạng `NET-ORD-xxxx`), Ngày đặt, Tên khách hàng, SĐT, Sản phẩm trong đơn, Tổng tiền, Trạng thái thanh toán, Dropdown tiến độ giao hàng, Badge trạng thái 2 chiều. | `[ ]` |
| **TC-A-19** | Kiểm tra gán Serial túi cho đơn hàng | Quan sát cột sản phẩm hoặc mở modal chi tiết đơn hàng | - Đơn hàng đã được tự động gán mã Serial túi có sẵn từ kho thành phẩm (hoặc có mục gán Serial thủ công).<br>- Sản phẩm trong kho đổi trạng thái sang `assigned_to_order` (Đã gán theo đơn). | `[ ]` |
| **TC-A-20** | Cập nhật tiến độ: Đang gia công | Tại dropdown trạng thái của đơn, chọn `crafting` (Đang gia công chế tác) | - Cập nhật trạng thái thành công.<br>- Sang tab Khách hàng (`/profile`): Khách hàng thấy thanh tiến trình nhảy sang bước 2 "Đang Gia Công". | `[ ]` |
| **TC-A-21** | Cập nhật tiến độ: Đang vận chuyển | Tại dropdown trạng thái, chọn `delivering` (Đang vận chuyển giao hàng) | - Cập nhật thành công.<br>- Sang tab Khách hàng: Khách hàng thấy bước 4 "Vận Chuyển". | `[ ]` |
| **TC-A-22** | Shop xác nhận Đã giao xong (`delivered`) | Tại dropdown trạng thái, chọn **`delivered`** (Đã giao hàng thành công) | 1. Hệ thống tự động ghi nhận `shopDeliveredConfirmed: true` và lưu thời gian `shopDeliveredAt`.<br>2. Badge dưới dropdown hiển thị: **`⏳ Chờ khách nhận`**.<br>3. Đồng bộ ngay lập tức lên Firestore `orders/{orderId}`.<br>4. Sang tab Khách hàng (`/profile`): Lập tức xuất hiện nút **`[✅ Tôi Đã Nhận Được Túi]`**. | `[ ]` |
| **TC-A-23** | Khách bấm nhận -> Badge đổi sang "Khách đã nhận" | *(Tại tab Khách hàng, bấm `[✅ Tôi Đã Nhận Được Túi]`)*. Quay lại tab Admin F5 tải lại trang | - Badge trạng thái đơn hàng trên bảng Admin tự động chuyển thành: **`✅ Khách Đã Nhận`**.<br>- Hệ thống đã ghi nhận `customerReceivedConfirmed: true`. | `[ ]` |
| **TC-A-24** | Khách định danh túi -> Badge đổi sang "Đã định danh" | *(Tại tab Khách hàng, bấm `[✨ Định Danh Vào Tài Khoản]`)*. Quay lại tab Admin | - Badge trạng thái đơn hàng trên bảng Admin tự động chuyển thành: **`👜 Đã Định Danh`** (màu xanh ngọc bích).<br>- Ghi nhận `isClaimed: true` và `claimedByUserId`. | `[ ]` |
| **TC-A-25** | Modal Chi tiết đơn & Nút Sao chép Link Định Danh | Bấm vào nút "Chi Tiết" trên một đơn hàng | - Popup chi tiết đơn mở ra.<br>- Hiển thị khối: **"Trạng Thái Xác Nhận Giao Hàng & Định Danh"**.<br>- Khi đơn đã được giao và khách đã nhận: Xuất hiện nút **`[Sao Chép Link]`** để Admin có thể copy link định danh gửi thủ công qua tin nhắn/Zalo/Email cho khách nếu khách yêu cầu. | `[ ]` |
| **TC-A-26** | In phiếu giao hàng (Packing Slip) | Trong modal chi tiết, bấm nút **"In Phiếu Giao Hàng"** | - Mở hộp thoại in trình duyệt chuẩn A4/A5.<br>- Định dạng phiếu giao hàng chuẩn xưởng may NÉT, có mã vạch và thông tin người nhận rõ ràng. | `[ ]` |

---

## GIAI ĐOẠN 6: QUẢN LÝ MẪU MÃ BỘ SƯU TẬP (PRODUCTS CATALOG TAB)

> [!IMPORTANT]
> **Quy định thiết kế:** Trang Thêm mẫu mã sản phẩm CHỈ là tạo mẫu mã (kiểu dáng, giá niêm yết, ảnh đại diện), **hoàn toàn KHÔNG CÓ trường nhập số lượng trong đó**. Số lượng thực tế trong kho hoàn toàn phụ thuộc vào việc nhập lưới và tạo lệnh may ở Tab Chuỗi Cung Ứng.

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-A-27** | Xem danh mục mẫu mã | Chuyển sang tab **Mẫu Mã Bộ Sưu Tập** | - Hiển thị danh sách các mẫu mã dáng túi đang lưu trong hệ thống.<br>- Hiển thị: Ảnh đại diện, Tên dáng túi, Phân loại, Giá niêm yết cơ sở, Lượng rác nhựa giảm thiểu, Số lượng tồn kho thực tế (lấy từ kho thành phẩm). | `[ ]` |
| **TC-A-28** | Kiểm tra form thêm mẫu mã mới | Bấm nút **"Thêm Mẫu Mã Mới"** | - Modal mở ra.<br>- **Xác nhận KHÔNG CÓ ô nhập số lượng**.<br>- Chỉ có các trường: Tên mẫu túi, Mã SKU, Giá niêm yết (VND), Trọng lượng nhựa giảm thiểu (kg), Ảnh sản phẩm (Cloudinary), Mô tả chất liệu. | `[ ]` |
| **TC-A-29** | Upload ảnh mẫu mã mới qua Cloudinary | Bấm nút chọn ảnh, upload 1 file ảnh dáng túi mới | - Ảnh tự động tải lên Cloudinary AI và trả về URL an toàn (HTTPS).<br>- Ảnh preview hiển thị sắc nét trong form. | `[ ]` |
| **TC-A-30** | Lưu mẫu mã mới & Đồng bộ sang NÉT Studio | Điền thông tin và bấm "Lưu Mẫu Mã" | 1. Mẫu mới xuất hiện trong danh mục quản trị.<br>2. Sang trang NÉT Studio (`/customizer`): Dáng túi mới lập tức xuất hiện trong danh sách lựa chọn của khách hàng.<br>3. Sang trang Cửa Hàng (`/shop`): Mẫu mới hiển thị sẵn sàng để khách tham khảo. | `[ ]` |

---

## GIAI ĐOẠN 7: CÔNG CỤ RESET VÀ DỌN DẸP DATABASE (SYSTEM RESET CONTROLS)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-A-31** | Reset Kho & Kiện lưới về Database thực tế | Tại tab Chuỗi Cung Ứng, bấm nút **"Reset Kho Về Mẻ Lưới Thực Tế"** | 1. Hệ thống hỏi xác nhận (Confirm alert).<br>2. Bấm Đồng ý ➔ Toàn bộ kho cũ bị xóa sạch.<br>3. Khởi tạo lại với dữ liệu mẻ lưới thực nghiệm ban đầu.<br>4. Mã Serial túi bắt đầu đánh số lại từ `001`.<br>5. Bảng kiểm kê kho cập nhật sạch sẽ. | `[ ]` |
| **TC-A-32** | Xóa sạch database túi đã định danh của khách | Bấm nút **"Xóa Hết Database Túi Đã Định Danh"** | 1. Xóa toàn bộ các bản ghi túi cá nhân trong Firestore `bag_items` và LocalStorage.<br>2. Sang trang Profile của khách hàng: Mục "Bộ Sưu Tập NÉT Story Passport Độc Bản" trở về trạng thái mảng rỗng (0 túi), chuẩn bị sẵn sàng cho chu kỳ kiểm thử mới. | `[ ]` |
| **TC-A-33** | Reset & Đồng bộ lại Dấu chân sinh thái của Member | Tại trang Profile của khách hàng, bấm nút **"Cập Nhật Tác Động"** sau khi reset | - Hệ thống quét lại các đơn hàng và túi thực tế.<br>- Nếu chưa có túi nào được định danh: Chỉ số rác biển trở về `0.00 kg`, San hô trở về `0.0 m²`, CO₂ trở về `0.00 kg`.<br>- Cấp bậc thành viên đưa về `Cấp 0 (Khởi đầu hành trình xanh)`. | `[ ]` |

---

## 📊 TỔNG KẾT KIỂM THỬ ADMIN & XƯỞNG MAY (ADMIN TEST RESULTS)
- **Tổng số Test Cases:** 33 bước kiểm thử
- **Số bước ĐẠT (Pass):** _______ / 33
- **Số bước LỖI (Fail):** _______ / 33
- **Người thực hiện kiểm thử:** _____________________________
- **Ngày hoàn thành:** _____ / _____ / 2026
