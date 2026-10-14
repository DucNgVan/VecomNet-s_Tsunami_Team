# 📋 BỘ TÀI LIỆU KIỂM THỬ DÀNH CHO KHÁCH HÀNG (USER TEST CHECKLIST)
**Dự án:** NÉT - Sáng Tạo Sinh Thái Từ Lưới Ma (Eco Net Craft & Digital Story Passport)  
**Phiên bản kiểm thử:** v1.0.0-production-ready  
**Đối tượng thực hiện:** QA Tester, Khách hàng thử nghiệm, Product Owner  
**Môi trường:** Local (`http://localhost:3000`) hoặc Production Vercel  

---

## 🎯 MỤC TIÊU KIỂM THỬ
Xác thực toàn bộ hành trình trải nghiệm người dùng (End-to-End Customer Journey):
1. Khám phá thương hiệu & câu chuyện trục vớt lưới ma tại bán đảo Sơn Trà.
2. Trắc nghiệm AI Storytelling cá nhân hóa phong cách sống biển.
3. Trải nghiệm phòng thí nghiệm 3D NÉT Studio (chọn dáng túi, đổi màu, đính charm hộ mệnh, khắc thông điệp).
4. Mua sắm tại Shop & tiến hành Đặt hàng (COD hoặc Chuyển khoản VietQR tự động).
5. Theo dõi tiến độ gia công 4 bước tại trang Hồ Sơ (`/profile`).
6. **Quy trình Xác nhận giao nhận 2 chiều & Định danh số chiếc túi độc bản vào tài khoản cá nhân.**
7. Bảng điều khiển Dấu chân sinh thái cá nhân (Personal ESG Dashboard) & mở Căn cước NÉT Story Passport.

---

## 🛠️ CHUẨN BỊ MÔI TRƯỜNG TEST
- [ ] Chạy server phát triển: `npm run dev` (hoặc truy cập domain staging).
- [ ] Mở trình duyệt: Google Chrome / Safari / Edge (khuyến nghị mở DevTools `F12` chế độ Console để theo dõi).
- [ ] Chuẩn bị 01 tài khoản Google hoặc tài khoản email/mật khẩu để đăng ký mới.
- [ ] Đảm bảo thiết bị kết nối mạng Internet ổn định (kết nối Firebase Firestore & Cloudinary).

---

## GIAI ĐOẠN 1: KHÁM PHÁ TRANG CHỦ & ĐIỀU HƯỚNG (`/`)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-U-01** | Tải trang chủ & Giao diện đại dương | Truy cập `http://localhost:3000/` | - Hiệu ứng bọt khí đại dương `OceanBackdrop` chuyển động mượt.<br>- Thanh Header hiển thị đầy đủ logo NÉT, menu điều hướng, Giỏ hàng, nút Đăng nhập. | `[ ]` |
| **TC-U-02** | Số liệu tác động môi trường toàn hệ thống | Cuộn xuống phần Thống kê sinh thái (Impact Counter) | - Hiển thị các chỉ số: Số kg lưới ma thu gom, m² rạn san hô bảo hộ, kg CO₂e giảm thiểu.<br>- Số liệu nhảy hiệu ứng động mượt mà, không bị NaN hoặc lỗi font. | `[ ]` |
| **TC-U-03** | Thanh điều hướng (Header Navigation) | Nhấp lần lượt vào các liên kết: `Cửa Hàng`, `Đồng Sáng Tạo`, `Hải Đồ`, `Câu Chuyện` | - Chuyển trang đúng địa chỉ tương ứng (`/shop`, `/customizer`, `/passport`, `/story`).<br>- Không có trang nào bị lỗi 404 hoặc crash trắng trang. | `[ ]` |
| **TC-U-04** | Chân trang (Footer Navigation) | Cuộn xuống cuối trang, kiểm tra các mục liên kết pháp lý & đổi trả | - Hiển thị đúng link: "Chính Sách Đổi Trả & Bảo Hành Điện Tử" (`/policies`).<br>- Thông tin liên hệ xưởng NÉT tại Sơn Trà, Đà Nẵng đầy đủ. | `[ ]` |

---

## GIAI ĐOẠN 2: TRẮC NGHIỆM AI "MY DA NANG STORY" (`/quiz` HOẶC `/story`)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-U-05** | Khởi động bài trắc nghiệm AI | Truy cập `/story` hoặc `/quiz`, bấm nút "Bắt Đầu Trắc Nghiệm" | - Màn hình hiển thị câu hỏi trắc nghiệm bước 1.<br>- Hiệu ứng chuyển động mượt mà, giao diện phong cách biển sâu. | `[ ]` |
| **TC-U-06** | Hoàn thành 3 câu hỏi trắc nghiệm | Chọn lần lượt:<br>1. Mood/Vibe biển (Bình yên, Khám phá, Năng lượng)<br>2. Kỷ niệm Đà Nẵng (Bình minh Mỹ Khê, Bán đảo Sơn Trà, Đêm cầu Rồng)<br>3. Tâm niệm cá nhân | - Mỗi lựa chọn đổi màu kích hoạt rõ ràng.<br>- Bấm "Tiếp Tục" chuyển câu hỏi chính xác. | `[ ]` |
| **TC-U-07** | Hiển thị kết quả AI Storytelling | Chờ AI tổng hợp kết quả (1-2 giây) | - Xuất hiện thẻ Căn Cước Tâm Hồn với: Dáng túi gợi ý, Bảng màu lưới đại dương phù hợp, Bộ 2-3 Charm hộ mệnh.<br>- Đoạn thơ đề tặng (Poetic Dedication) mang dấu ấn biển cả. | `[ ]` |
| **TC-U-08** | Chuyển sang NÉT Studio 3D | Nhấn nút "Tạo Chiếc Túi Của Bạn Tại NÉT Studio" | - Hệ thống tự động chuyển sang trang `/customizer`.<br>- Toàn bộ cấu hình (Dáng túi, Màu sắc, Charm đã chọn từ Quiz) được nạp nguyên vẹn vào Studio 3D. | `[ ]` |

---

## GIAI ĐOẠN 3: NÉT STUDIO 3D ĐỒNG SÁNG TẠO (`/customizer`)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-U-09** | Tương tác Canvas 3D | Dùng chuột hoặc ngón tay xoay mô hình túi trên canvas | - Mô hình lưới 3D xoay 360 độ mượt mà.<br>- Có thể phóng to, thu nhỏ và quan sát chi tiết từng mắt lưới. | `[ ]` |
| **TC-U-10** | Lựa chọn dáng túi từ Bộ sưu tập | Bấm chọn lần lượt các dáng túi trong danh sách (Tote, Crossbody, v.v.) | - Mô hình túi 3D trên màn hình thay đổi tương ứng.<br>- Giá tiền cơ sở và kích thước cập nhật theo dáng túi. | `[ ]` |
| **TC-U-11** | Đổi màu sợi lưới tái chế | Chọn các hạt màu: Xanh Thẳm, Rêu Phong, Cam San Hô, Đen Huyền Bí | - Sợi lưới trên mô hình 3D đổi màu theo thời gian thực.<br>- Tên màu sắc hiển thị đúng trên thẻ thông tin. | `[ ]` |
| **TC-U-12** | Đính Charm hộ mệnh lên mắt lưới | Nhấp chọn các Charm kim loại (Rùa Biển, Vỏ Ốc, San Hô, Mỏ Nêu, Đuôi Cá Heo) | - Charm được gắn trực tiếp lên vị trí mắt lưới của túi.<br>- Hiển thị số lượng charm đã chọn (tối đa theo quy định).<br>- Giá sản phẩm tự động cộng thêm giá tiền tương ứng của Charm. | `[ ]` |
| **TC-U-13** | Khắc thông điệp kỷ vật | Nhập câu chữ vào ô "Thông Điệp Khắc Độc Bản" (VD: *Biển xanh trong tim - 2026*) | - Text hiển thị trên thẻ bài kỷ vật giả lập.<br>- Lưu trữ nội dung vào cấu hình túi. | `[ ]` |
| **TC-U-14** | Chụp snapshot & Thêm vào Giỏ Hàng | Nhấn nút "Thêm Vào Giỏ Hàng" | - Hệ thống tự động render ảnh chụp 3D góc nhìn hiện tại.<br>- Drawer giỏ hàng trượt ra từ bên phải, hiển thị đúng: Tên túi, màu sắc, số lượng charm, ảnh thumbnail và giá tiền chính xác.<br>- Huy hiệu số lượng trên icon giỏ hàng ở Header tăng thêm 1. | `[ ]` |

---

## GIAI ĐOẠN 4: GIỎ HÀNG & MUA SẮM CỬA HÀNG (`/shop`)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-U-15** | Xem danh mục sản phẩm có sẵn | Truy cập `/shop`, cuộn xem danh sách sản phẩm | - Hiển thị đúng các mẫu mã thuộc Bộ sưu tập đang mở bán.<br>- Mỗi sản phẩm hiển thị: Ảnh bìa, Tên dáng túi, Giá bán, Lượng rác nhựa giảm thiểu (-0.65kg, -0.8kg,...). | `[ ]` |
| **TC-U-16** | Xem chi tiết sản phẩm / Story mẻ lưới | Bấm vào sản phẩm hoặc nút "Xem Hải Đồ Mẻ Lưới" | - Mở modal/trang chi tiết sản phẩm hoặc link sang `/passport` tương ứng.<br>- Thể hiện rõ nguồn gốc kiện lưới trục vớt tại Sơn Trà. | `[ ]` |
| **TC-U-17** | Thêm sản phẩm có sẵn vào giỏ hàng | Bấm nút "Chọn Mua" trên một sản phẩm tại Shop | - Sản phẩm được thêm vào Giỏ hàng.<br>- Drawer giỏ hàng mở ra, tính tổng tiền gộp chung với sản phẩm custom (nếu có). | `[ ]` |
| **TC-U-18** | Điều chỉnh số lượng trong giỏ hàng | Bấm nút `+`, `-` hoặc nút `Xóa` trên từng mục trong Giỏ hàng | - Bấm `+`: Số lượng tăng, tổng tiền tăng theo đúng giá nhân số lượng.<br>- Bấm `-`: Số lượng giảm (nếu về 1 không bấm giảm được nữa).<br>- Bấm icon thùng rác: Mục đó bị xóa sạch khỏi giỏ hàng. | `[ ]` |

---

## GIAI ĐOẠN 5: TIẾN HÀNH ĐẶT HÀNG & THANH TOÁN (`/checkout`)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-U-19** | Chuyển sang trang Thanh Toán | Từ Drawer giỏ hàng, bấm nút "Tiến Hành Đặt Hàng" | - Chuyển sang trang `/checkout`.<br>- Cột bên phải tóm tắt danh sách sản phẩm, tạm tính, phí vận chuyển (miễn phí nếu đủ điều kiện) và tổng thanh toán. | `[ ]` |
| **TC-U-20** | Điền thông tin giao nhận | Nhập đầy đủ:<br>- Họ tên: *Nguyễn Văn Test*<br>- Số điện thoại: *0905123456*<br>- Địa chỉ: *Số 123 đường Bạch Đằng, Đà Nẵng*<br>- Email: *test@net.eco* | - Form kiểm tra tính hợp lệ (báo lỗi nếu thiếu số điện thoại hoặc sai định dạng email).<br>- Tự động lưu thông tin vào tài khoản nếu đã đăng nhập. | `[ ]` |
| **TC-U-21** | Thanh toán COD (Tiền mặt khi nhận) | Chọn phương thức "Thanh Toán Khi Nhận Hàng (COD)", bấm "Hoàn Tất Đơn Hàng" | - Trạng thái thanh toán của đơn ghi nhận `unpaid` (Chờ thanh toán).<br>- Trừ tồn kho tương ứng trong kho hàng.<br>- Chuyển hướng sang trang `/order-success`. | `[ ]` |
| **TC-U-22** | Thanh toán Chuyển khoản VietQR | Chọn phương thức "Chuyển Khoản Ngân Hàng (VietQR)", bấm "Hoàn Tất Đơn Hàng" | - Chuyển sang trang `/order-success`.<br>- Xuất hiện khung mã VietQR động với đúng số tiền và nội dung chuyển khoản bắt buộc `NET [MãĐơn]`.<br>- Bấm nút "Tôi Đã Chuyển Khoản Xong" -> Hệ thống ghi nhận trạng thái xác nhận. | `[ ]` |

---

## GIAI ĐOẠN 6: TRANG XÁC NHẬN ĐƠN HÀNG THÀNH CÔNG (`/order-success`)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-U-23** | Kiểm tra thông tin đơn hàng đã tạo | Quan sát các thông tin trên trang `/order-success` | - Hiển thị đúng: Mã đơn hàng (dạng `NET-ORD-xxxx`), Ngày đặt, Tên người nhận, Tổng tiền.<br>- Hiển thị thanh tiến độ 4 bước tại xưởng NÉT (Bước 1: "Đã Tiếp Nhận Đơn"). | `[ ]` |
| **TC-U-24** | Thông báo email và điều hướng Profile | Đọc thông báo gửi email và kiểm tra các nút hành động | - Có thông báo: *"Hóa đơn điện tử chi tiết và hướng dẫn định danh số chiếc túi vào tài khoản đã được gửi đến email..."*<br>- Xuất hiện nút nổi bật màu xanh ngọc bích: **`[Theo Dõi Đơn & Định Danh Túi Tại Hồ Sơ]`**. | `[ ]` |
| **TC-U-25** | Chuyển sang trang Profile cá nhân | Bấm vào nút `Theo Dõi Đơn & Định Danh Túi Tại Hồ Sơ` | - Chuyển hướng ngay lập tức đến trang `/profile`.<br>- Đơn hàng vừa tạo xuất hiện trên đầu danh sách "Theo Dõi Đơn Hàng & Tiến Độ Xưởng Chế Tác". | `[ ]` |

---

## GIAI ĐOẠN 7: PROFILE, XÁC NHẬN GIAO NHẬN 2 CHIỀU & ĐỊNH DANH TÚI (`/profile`)

> [!IMPORTANT]
> Đây là quy trình nghiệp vụ cốt lõi mới thay thế hoàn toàn NFC vật lý. Hãy kiểm tra thật kỹ từng bước sau:

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-U-26** | Đăng nhập tài khoản thành viên | Đăng nhập bằng tài khoản đã dùng khi đặt hàng | - Tên thành viên, avatar và email hiển thị đúng trên đầu trang.<br>- Cấp bậc thành viên (Member Eco Tier) tính toán chuẩn xác. | `[ ]` |
| **TC-U-27** | Sửa thông tin tài khoản | Bấm nút "Sửa Thông Tin", đổi họ tên / địa chỉ nhận hàng, bấm "Lưu Thay Đổi" | - Toast thông báo cập nhật thành công.<br>- Thông tin mới được lưu vào Firestore `users/{uid}`. | `[ ]` |
| **TC-U-28** | Đổi Avatar bằng Cloudinary | Di chuột vào avatar, bấm "Đổi ảnh", chọn 1 file ảnh (JPG/PNG < 8MB) | - Hiển thị biểu tượng xoay `Đang tải ảnh...`.<br>- Ảnh được upload lên Cloudinary và cập nhật avatar mới ngay lập tức. | `[ ]` |
| **TC-U-29** | Trạng thái đơn hàng: Đang gia công | Xem đơn hàng khi Admin chưa xác nhận giao xong | - Tiến trình hiển thị bước hiện tại (1. Tiếp Nhận Đơn hoặc 2. Đang Gia Công).<br>- Phía dưới có thanh ghi chú: *"Đơn hàng đang trong tiến trình... Sau khi shop giao và bạn bấm xác nhận đã nhận, liên kết định danh túi độc bản sẽ mở tự động."*<br>- **CHƯA** xuất hiện nút định danh túi. | `[ ]` |
| **TC-U-30** | Trạng thái đơn hàng: Shop đã giao xong | *(Giả lập: Sang trang Admin chuyển đơn thành `delivered`)*. Khách hàng F5 tải lại trang `/profile` | - Xuất hiện hộp thông báo màu vàng cam nổi bật: **"🚚 Shop NÉT Đã Giao Hàng Xong"**.<br>- Xuất hiện nút bấm màu xanh lá: **`[✅ Tôi Đã Nhận Được Túi]`**. | `[ ]` |
| **TC-U-31** | Khách hàng xác nhận đã nhận túi | Bấm nút **`[✅ Tôi Đã Nhận Được Túi]`** | - Nút hiển thị spinner "Đang xác nhận...".<br>- Toast thông báo: *"✅ Bạn đã xác nhận nhận hàng thành công! Vui lòng định danh túi bên dưới để đưa vào Bộ Sưu Tập cá nhân."*<br>- Trạng thái đơn hàng đổi ngay lập tức sang Trạng thái sẵn sàng định danh mà không cần F5. | `[ ]` |
| **TC-U-32** | Xuất hiện Link & Nút Định Danh Túi | Quan sát giao diện đơn hàng ngay sau khi bấm nhận | - Xuất hiện khung card viền gradient ngọc bích sang trọng: **"✨ Xác Nhận Giao Nhận 2 Chiều Thành Công — Sẵn Sàng Định Danh"**.<br>- Có 2 nút hành động: **`[✨ Định Danh Vào Tài Khoản]`** và **`[🔗 Sao Chép Link]`**. | `[ ]` |
| **TC-U-33** | Sao chép đường link định danh | Bấm nút **`[🔗 Sao Chép Link]`** | - Nút đổi sang chữ **"Đã Sao Chép!"**.<br>- Toast thông báo: *"Đã sao chép đường link định danh độc bản của túi!"*.<br>- Dán (Paste) vào thanh địa chỉ: Link có cấu trúc `/passport/{batchId}?itemId={serialId}&claim=true&orderCode={orderCode}`. | `[ ]` |
| **TC-U-34** | Thực hiện Định danh túi vào tài khoản | Bấm nút **`[✨ Định Danh Vào Tài Khoản]`** | 1. Toast báo: *"Đang kết nối hải đồ và đúc thẻ Căn Cước NÉT Story Passport..."*.<br>2. Bắn hiệu ứng pháo hoa Confetti rực rỡ toàn màn hình 🎉.<br>3. Toast báo: *"🎉 Định danh thành công mã túi [Serial]! Túi đã được bổ sung vào Bộ Sưu Tập và kích hoạt bảo hành điện tử 24 tháng."*<br>4. Thẻ đơn hàng chuyển sang huy hiệu xanh lục: **`✓ ĐÃ ĐỊNH DANH VÀO BỘ SƯU TẬP CỦA BẠN`** kèm nút **`[Mở Story Passport Của Túi]`**. | `[ ]` |
| **TC-U-35** | Túi xuất hiện trong Bộ Sưu Tập Cá Nhân | Cuộn lên mục **"Bộ Sưu Tập NÉT Story Passport Độc Bản Của Tôi"** | - Chiếc túi vừa định danh lập tức xuất hiện trong lưới tác phẩm.<br>- Hiển thị đúng: Mã túi độc bản (Serial ID), Lô gốc, Hình ảnh túi, Số lượng charm, Mã QR, và dòng thơ đề tặng.<br>- Số lượng kỷ vật của bạn tăng thêm 1. | `[ ]` |
| **TC-U-36** | Cập nhật Bảng tác động sinh thái (ESG Dashboard) | Quan sát Bảng điều khiển tác động môi trường cá nhân ở đầu trang | - Lượng rác nhựa giảm thiểu (-kg) tự động cộng thêm trọng lượng của chiếc túi vừa định danh.<br>- Số m² rạn san hô được cứu và kg CO₂e giảm phát thải tăng tương ứng.<br>- Thanh tiến trình thăng hạng thành viên nhích lên mức mới. | `[ ]` |

---

## GIAI ĐOẠN 8: CĂN CƯỚC SỐ & NÉT STORY PASSPORT ĐỘC BẢN (`/passport/[batchId]`)

| Mã Test | Tên Bước Kiểm Thử | Thao Tác Thực Hiện | Kết Quả Kỳ Vọng | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| **TC-U-37** | Mở Passport từ Bộ Sưu Tập | Tại thẻ túi trên trang Profile, bấm nút "Mở Hải Đồ & Story Passport Của Túi" | - Mở trang `/passport/{batchId}?itemId={serialId}`.<br>- Tiêu đề hiển thị: **"Xác Thực Căn Cước & Kích Hoạt Bảo Hành"** (không còn chữ NFC). | `[ ]` |
| **TC-U-38** | Kiểm tra thẻ bảo chứng độc bản (Đã kích hoạt) | Xem thông tin Hero Card trên cùng của Passport | - Huy hiệu xanh ngọc bích: **"✓ ĐÃ ĐỊNH DANH SỞ HỮU & BẢO HÀNH CHÍNH HÃNG"**.<br>- Tên chủ nhân sở hữu: Đúng tên khách hàng.<br>- Thời hạn bảo hành: 24 tháng toàn diện (hiển thị ngày hết hạn cụ thể).<br>- Mã vạch dệt may trong túi (Barcode 128) & Mã Căn Cước Số hiển thị rõ. | `[ ]` |
| **TC-U-39** | Mở bằng Link Định Danh trực tiếp | Mở tab ẩn danh (Incognito), dán đường link đã copy ở TC-U-33 (`...&claim=true&orderCode=...`) | - Trang Passport nhận diện mã túi từ link.<br>- Nếu chưa đăng nhập: Cho phép nhập Họ tên + SĐT để kích hoạt nhanh.<br>- Bấm Kích hoạt -> Bắn pháo hoa Confetti và ghi nhận thông tin bảo hành thành công. | `[ ]` |
| **TC-U-40** | Kiểm tra bản đồ tọa độ hải đồ (GPS Map) | Bấm sang tab "Hải Đồ Sơn Trà" hoặc cuộn xem bản đồ tọa độ | - Bản đồ hiển thị tọa độ nơi trục vớt mẻ lưới tại Vịnh Đà Nẵng / Bán đảo Sơn Trà / Bãi Bụt.<br>- Thể hiện độ sâu trục vớt (m), ngày thu gom và tên đội thợ lặn tình nguyện. | `[ ]` |
| **TC-U-41** | Chia sẻ Hải Đồ & Căn Cước | Bấm nút "Chia Sẻ Passport Sản Phẩm" | - Link URL của trang được sao chép vào clipboard.<br>- Nút chuyển thành "Đã Sao Chép Liên Kết!". | `[ ]` |

---

## 📊 TỔNG KẾT KIỂM THỬ KHÁCH HÀNG (USER TEST RESULTS)
- **Tổng số Test Cases:** 41 bước kiểm thử
- **Số bước ĐẠT (Pass):** _______ / 41
- **Số bước LỖI (Fail):** _______ / 41
- **Người thực hiện kiểm thử:** _____________________________
- **Ngày hoàn thành:** _____ / _____ / 2026
