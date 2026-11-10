import os
import sys
import math
import subprocess
import time
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080
FPS = 30
START_OFFSET = 7.5   # Skip opening setup
TOTAL_DUR = 251.0     # 251 seconds
TOTAL_FRAMES = int(TOTAL_DUR * FPS)  # 7530 frames

FONT_MAIN = "/Library/Fonts/Arial Unicode.ttf"
FONT_SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"

try:
    font_badge = ImageFont.truetype(FONT_SANS, 15)
    font_title = ImageFont.truetype(FONT_MAIN, 30)
    font_sub_title = ImageFont.truetype(FONT_MAIN, 17)
    font_bullet = ImageFont.truetype(FONT_MAIN, 17)
    font_stat_num = ImageFont.truetype(FONT_SANS, 21)
    font_stat_lbl = ImageFont.truetype(FONT_MAIN, 13)
    font_url = ImageFont.truetype(FONT_SANS, 14)
    font_sub_line1 = ImageFont.truetype(FONT_MAIN, 20)
    font_sub_line2 = ImageFont.truetype(FONT_MAIN, 16)
    font_header_brand = ImageFont.truetype(FONT_MAIN, 16)
except Exception as e:
    print(f"Font loading error: {e}")
    font_badge = font_title = font_sub_title = font_bullet = font_stat_num = font_stat_lbl = font_url = font_sub_line1 = font_sub_line2 = font_header_brand = ImageFont.load_default()

# 10 Chapters Definition
CHAPTERS = [
    {
        "start": 0.0,
        "end": 37.5,
        "badge": "CHƯƠNG 01/10 • TRANG CHỦ & TRẢI NGHIỆM BIỂN SÂU",
        "title": "Khám Phá Hệ Sinh Thái NÉT",
        "subtitle": "Không gian trải nghiệm sản phẩm xanh & chỉ số tác động ESG",
        "bullets": [
            "Giao diện Glassmorphism mô phỏng làn nước đại dương Sơn Trà",
            "Mô hình 3D WebGL trực quan hóa túi lưới tái chế từ mọi góc nhìn",
            "Bộ đếm tác động sinh thái ESG đồng bộ thời gian thực từ kho mẻ lưới"
        ],
        "stat_val": "142.5 kg Lưới • 285 m² San Hô",
        "stat_lbl": "CHỈ SỐ TÁC ĐỘNG BẢO VỆ MÔI TRƯỜNG BIỂN",
        "url": "https://www.net-s.id.vn",
        "subtitles": [
            (0.0, 10.0, "Chào mừng bạn đến với NÉT — Nền tảng thời trang bền vững từ lưới ma đại dương Việt Nam.", "Khám phá giao diện đại dương độc bản cùng thông điệp 'Từ biển cả · Đến ký ức riêng'."),
            (10.0, 20.0, "Trải nghiệm mô hình túi 3D tương tác sống động, cho phép xoay 360 độ và xem chi tiết từng thớ lưới.", "Khách hàng tương tác trực tiếp với vật liệu tái chế từ rác thải biển trước khi quyết định mua hàng."),
            (20.0, 30.0, "Tùy chọn chuyển đổi màu sắc thời trang, kết hợp vải lót rPET dệt từ chai nhựa thu gom.", "Mỗi chiếc túi đều mang một câu chuyện tái sinh kỳ diệu từ vùng biển Sơn Trà — Đà Nẵng."),
            (30.0, 37.5, "Hệ thống hiển thị trực quan các chỉ số ESG: 142.5kg lưới ma đã thu gom, bảo vệ 285m² san hô.", "Minh bạch dữ liệu giúp người tiêu dùng hiểu rõ giá trị sinh thái đóng góp cho đại dương.")
        ]
    },
    {
        "start": 37.5,
        "end": 62.5,
        "badge": "CHƯƠNG 02/10 • CỬA HÀNG BỀN VỮNG",
        "title": "Bộ Sưu Tập Thời Trang Tái Chế",
        "subtitle": "Khám phá các dòng túi Eco Tote và phụ kiện thời trang tuần hoàn",
        "bullets": [
            "Danh mục sản phẩm đa dạng từ túi tote, túi đeo chéo đến phụ kiện charm",
            "Minh bạch tuyệt đối lượng nhựa nguyên sinh cắt giảm trên mỗi sản phẩm",
            "Tích hợp nút chuyển thẳng sang Nét Studio để tự do cá nhân hóa"
        ],
        "stat_val": "100% Vật Liệu Tuần Hoàn",
        "stat_lbl": "GIẢM THIỂU 1.8KG RÁC NHỰA TRÊN MỖI TÚI",
        "url": "https://www.net-s.id.vn/shop",
        "subtitles": [
            (37.5, 47.0, "Truy cập Cửa hàng: Duyệt danh mục các mẫu túi Eco Tote và Charm thủ công tinh tế.", "Bộ lọc thông minh giúp phân loại theo chất liệu, kích thước và màu sắc yêu thích."),
            (47.0, 55.0, "Trang chi tiết cung cấp đầy đủ thông số kỹ thuật, tỷ lệ nhựa tái chế và câu chuyện mẻ lưới.", "Mỗi sản phẩm đều ghi rõ lượng CO2e giảm phát thải và khối lượng rác biển đã xử lý."),
            (55.0, 62.5, "Khách hàng bấm nút chuyển sang Nét Studio để bắt đầu tự tay tùy biến thiết kế riêng.", "Trải nghiệm mua sắm cá nhân hóa đột phá kết hợp giữa thời trang và công nghệ.")
        ]
    },
    {
        "start": 62.5,
        "end": 102.5,
        "badge": "CHƯƠNG 03/10 • NÉT STUDIO 3D CONFIGURATOR",
        "title": "Tự Do Phối Túi Độc Bản 3D",
        "subtitle": "Bộ tùy biến 3D WebGL thời gian thực với công nghệ Snap-to-Mesh",
        "bullets": [
            "Engine Three.js WebGL dựng mô hình túi thời gian thực siêu mượt mà",
            "Công nghệ Snap-to-Mesh tự động hít charm vào các mắt lưới chuẩn xác",
            "Tự động xuất bản vẽ kỹ thuật Blueprint để thợ may thủ công thực hiện"
        ],
        "stat_val": "Snap-to-Mesh Real-time",
        "stat_lbl": "BẢN VẼ BLUEPRINT KỸ THUẬT CHÍNH XÁC 100%",
        "url": "https://www.net-s.id.vn/studio",
        "subtitles": [
            (62.5, 72.0, "Nét Studio 3D: Không gian sáng tạo trực quan cho phép khách hàng tự phối chiếc túi độc bản.", "Tùy biến từ màu sắc thân túi, quai xách đến lớp lót chống thấm nước cao cấp."),
            (72.0, 82.0, "Thao tác xoay lật 360 độ, kiểm tra ánh sáng và đổ bóng vật liệu lưới thực tế ảo sống động.", "Dễ dàng thử nghiệm các gam màu: Đen Đại Dương, Xanh San Hô, Cam Hoàng Hôn."),
            (82.0, 92.0, "Kéo thả charm Cầu Rồng và Sóng Biển vào đúng tọa độ mắt lưới bằng công nghệ Snap-to-Mesh.", "Các charm tự động khóa ngàm vào mắt lưới tại tọa độ định sẵn #B2, #C4 vô cùng chính xác."),
            (92.0, 102.5, "Xem trước bản vẽ Blueprint kỹ thuật 3D, giá thành tự động cập nhật theo cấu hình lựa chọn.", "Thiết kế được mã hóa và sẵn sàng chuyển tiếp thẳng tới xưởng may thủ công của nghệ nhân.")
        ]
    },
    {
        "start": 102.5,
        "end": 119.5,
        "badge": "CHƯƠNG 04/10 • MINH BẠCH TIẾN ĐỘ",
        "title": "Tra Cứu Hành Trình Đơn Hàng",
        "subtitle": "Theo dõi 4 công đoạn chế tác thủ công khép kín thời gian thực",
        "bullets": [
            "Hành trình 4 bước khép kín từ đáy biển sâu đến tay người tiêu dùng",
            "Xác thực danh tính nghệ nhân may túi và mã định danh mẻ lưới ma",
            "Cập nhật thời gian thực từng công đoạn hoàn thiện thủ công"
        ],
        "stat_val": "Mã Đơn NET-REQ-4531",
        "stat_lbl": "4 BƯỚC SẢN XUẤT THỦ CÔNG MINH BẠCH",
        "url": "https://www.net-s.id.vn/tracking?code=NET-REQ-4531",
        "subtitles": [
            (102.5, 111.0, "Hệ thống Tra cứu đơn hàng: Nhập mã định danh NET-REQ-4531 để theo dõi sản phẩm.", "Người mua an tâm tuyệt đối với tiến độ chế tác minh bạch từ đầu đến cuối."),
            (111.0, 119.5, "Quy trình 4 bước: Thu gom lưới ma -> Sơ chế nghệ nhân -> May thủ công -> Giao hàng xanh.", "Mỗi bước đều có mốc thời gian, hình ảnh xác thực và chữ ký của nghệ nhân phụ trách.")
        ]
    },
    {
        "start": 119.5,
        "end": 130.5,
        "badge": "CHƯƠNG 05/10 • CĂN CƯỚC SỐ PHYGITAL",
        "title": "Digital Story Passport",
        "subtitle": "Hộ chiếu số vinh danh hành trình giải cứu biển Sơn Trà",
        "bullets": [
            "Mỗi sản phẩm gắn liền một Căn cước số định danh duy nhất",
            "Tọa độ GPS rạn san hô Sơn Trà nơi mẻ lưới ma được trục vớt",
            "Ghi nhận đóng góp trực tiếp của đội thợ lặn tình nguyện SASA"
        ],
        "stat_val": "GPS 16.1024°N 108.2611°E",
        "stat_lbl": "MÃ LÔ #NET-DANANG-2026-08 TRỤC VỚT SƠN TRÀ",
        "url": "https://www.net-s.id.vn/passport",
        "subtitles": [
            (119.5, 125.0, "Digital Story Passport — Căn cước số độc bản đi kèm từng sản phẩm vật lý (Mô hình Phygital).", "Khách hàng quét mã QR trên tag túi để truy cập toàn bộ hồ sơ xuất xứ mẻ lưới."),
            (125.0, 130.5, "Lưu trữ tọa độ GPS rạn san hô Sơn Trà: 16.1024°N 108.2611°E — nơi mẻ lưới được tháo gỡ.", "Vinh danh các chiến binh thợ lặn SASA đã trực tiếp lặn sâu cứu sống rạn san hô.")
        ]
    },
    {
        "start": 130.5,
        "end": 142.5,
        "badge": "CHƯƠNG 06/10 • ĐỘI NGŨ SÁNG LẬP",
        "title": "VecomNet's Tsunami Team",
        "subtitle": "Đội thi Business Digital Challenge 2026 với khát vọng bảo tồn biển",
        "bullets": [
            "Đội thi tâm huyết tham gia Business Digital Challenge 2026",
            "Kết hợp công nghệ số thương mại điện tử với bảo tồn sinh thái biển",
            "Khát vọng lan tỏa lối sống xanh và kinh tế tuần hoàn bền vững"
        ],
        "stat_val": "BDC 2026 Đà Nẵng",
        "stat_lbl": "SỨ MỆNH KINH TẾ TUẦN HOÀN BIỂN ĐẢO",
        "url": "https://www.net-s.id.vn/team",
        "subtitles": [
            (130.5, 136.5, "Trang Đội ngũ sáng lập: Gặp gỡ những bạn trẻ đứng sau dự án NÉT từ cuộc thi BDC 2026.", "Hành trình biến ý tưởng khởi nghiệp thành giải pháp kinh tế tuần hoàn thực tiễn."),
            (136.5, 142.5, "Sự kết hợp giữa công nghệ thương mại điện tử thế hệ mới và tình yêu biển cả quê hương.", "Tạo công ăn việc làm xanh cho ngư dân và phụ nữ làng chài ven biển miền Trung.")
        ]
    },
    {
        "start": 142.5,
        "end": 154.5,
        "badge": "CHƯƠNG 07/10 • TRUNG TÂM HỖ TRỢ",
        "title": "Chính Sách & Hậu Mãi Tuần Hoàn",
        "subtitle": "Cam kết sửa chữa trọn đời & thu hồi tái sinh không rác thải",
        "bullets": [
            "Chính sách bảo hành và sửa chữa mắt lưới trọn đời cho khách hàng",
            "Chương trình thu hồi túi cũ đổi điểm voucher mua sắm tái sinh",
            "Kênh liên hệ trực tiếp hỗ trợ khách hàng nhanh chóng 24/7"
        ],
        "stat_val": "Bảo Hành Trọn Đời",
        "stat_lbl": "CHƯƠNG TRÌNH THU HỒI TÁI SINH 100% SẢN PHẨM",
        "url": "https://www.net-s.id.vn/support",
        "subtitles": [
            (142.5, 148.5, "Trung tâm Chăm sóc khách hàng: Hướng dẫn bảo quản, sử dụng và vệ sinh túi lưới tái chế.", "Hỗ trợ giải đáp thắc mắc 24/7 qua các kênh hotline, email và chat trực tuyến."),
            (148.5, 154.5, "Chính sách cam kết bảo hành trọn đời và thu hồi sản phẩm cũ đổi voucher tái sinh.", "Đảm bảo 100% sản phẩm của NÉT không bao giờ trở thành rác thải quay trở lại đại dương.")
        ]
    },
    {
        "start": 154.5,
        "end": 166.5,
        "badge": "CHƯƠNG 08/10 • BẢO MẬT HỆ THỐNG",
        "title": "Xác Thực Cổng Quản Trị OS",
        "subtitle": "Hệ thống phân quyền truy cập bảo mật với Master Passkey",
        "bullets": [
            "Phân quyền chặt chẽ giữa khách hàng và ban điều hành xưởng may",
            "Cơ chế bảo mật Master Passkey mã hóa cấp xưởng may thủ công",
            "Kiểm soát an toàn dữ liệu tồn kho nguyên liệu và danh sách đơn"
        ],
        "stat_val": "Passkey Encrypted",
        "stat_lbl": "XÁC THỰC PHÂN QUYỀN WORKSHOP OS AN TOÀN",
        "url": "https://www.net-s.id.vn/login",
        "subtitles": [
            (154.5, 160.5, "Chuyển sang phân hệ Quản trị (Admin): Không gian điều hành sản xuất dành riêng cho xưởng may.", "Giao diện đăng nhập bảo mật ngăn chặn truy cập trái phép vào dữ liệu vận hành."),
            (160.5, 166.5, "Đăng nhập hệ thống bằng Master Passkey bảo mật cao cấp dành cho Quản đốc xưởng.", "Xác thực thành công và mở khóa toàn bộ các phân hệ điều phối xưởng may thủ công.")
        ]
    },
    {
        "start": 166.5,
        "end": 212.5,
        "badge": "CHƯƠNG 09/10 • QUẢN TRỊ KHO & KHUYẾN MÃI",
        "title": "Danh Mục Sản Phẩm & Voucher",
        "subtitle": "Cấu hình SKU, thông số vật liệu xanh và khuyến mãi kích cầu",
        "bullets": [
            "Quản lý 5 phiên bản màu sắc độc quyền cùng chỉ số vật liệu tái chế",
            "Theo dõi mức độ tiêu hao lưới ma trên từng đơn vị sản phẩm bán ra",
            "Thiết lập linh hoạt các chương trình Voucher xanh kích cầu tiêu dùng"
        ],
        "stat_val": "5 Dòng Sản Phẩm SKU",
        "stat_lbl": "QUẢN TRỊ TỒN KHO & CHIẾN DỊCH VOUCHER XANH",
        "url": "https://www.net-s.id.vn/admin?tab=products",
        "subtitles": [
            (166.5, 176.0, "Tab Quản lý sản phẩm: Xem xét toàn bộ 5 dòng túi lưới tái chế cùng thông số tồn kho.", "Mỗi SKU được định danh chính xác về số lượng, giá bán và cấu hình màu sắc."),
            (176.0, 188.0, "Hệ thống tính toán lượng nhựa nguyên sinh được cắt giảm trên từng sản phẩm bán ra.", "Quản đốc dễ dàng cập nhật tình trạng 'Còn hàng' hoặc 'Hết hàng' theo năng lực xưởng."),
            (188.0, 200.0, "Chuyển sang tab Voucher: Thiết lập các chương trình mã giảm giá khuyến khích mua sắm xanh.", "Cung cấp các mã giảm giá đặc quyền cho khách hàng đổi túi cũ hoặc mua theo combo."),
            (200.0, 212.5, "Quản lý số lượt kích hoạt tối đa, thời hạn hiệu lực và mức chiết khấu phần trăm linh hoạt.", "Theo dõi hiệu quả chiến dịch khuyến mãi xanh theo thời gian thực.")
        ]
    },
    {
        "start": 212.5,
        "end": 251.0,
        "badge": "CHƯƠNG 10/10 • VẬN HÀNH XƯỞNG THỦ CÔNG",
        "title": "Tổng Quan Điều Hành Xưởng May",
        "subtitle": "Cân đối kho nguyên liệu lưới ma 130kg và phân công nhiệm vụ nghệ nhân",
        "bullets": [
            "Cân đối kho nguyên liệu 130kg lưới ma đã qua xử lý sạch",
            "Cảnh báo nhiệm vụ xưởng gấp để kịp tiến độ giao nhận cho khách hàng",
            "Mô hình khép kín: Tái sinh rác thải biển thành giá trị kinh tế bền vững"
        ],
        "stat_val": "130 kg Kho Lưới Ma",
        "stat_lbl": "TỔNG LỰC ĐIỀU PHỐI XƯỞNG MAY NÉT WORKSHOP OS",
        "url": "https://www.net-s.id.vn/admin?tab=overview",
        "subtitles": [
            (212.5, 224.0, "Bảng điều khiển Tổng quan (Overview): Trái tim vận hành khép kín của xưởng may NÉT.", "Theo dõi lượng lưới ma tồn kho: 130kg nguyên liệu đã làm sạch sẵn sàng sản xuất."),
            (224.0, 236.0, "Hệ thống tự động cảnh báo các nhiệm vụ cấp bách: Phân bổ nghệ nhân may theo đơn đặt hàng.", "Tối ưu hóa năng suất thủ công và đảm bảo cam kết chất lượng từng đường kim mũi chỉ."),
            (236.0, 251.0, "NÉT — Giải pháp toàn diện kết hợp công nghệ thương mại điện tử và trách nhiệm xã hội ESG.", "Cảm ơn bạn đã đồng hành cùng NÉT trên hành trình tái sinh đại dương xanh Việt Nam!")
        ]
    }
]

def get_chapter(sec):
    for ch in CHAPTERS:
        if ch["start"] <= sec < ch["end"]:
            return ch
    return CHAPTERS[-1]

def get_subtitle(ch, sec):
    for sub in ch["subtitles"]:
        if sub[0] <= sec < sub[1]:
            return sub[2], sub[3]
    return ch["subtitles"][-1][2], ch["subtitles"][-1][3]

# Pre-render base background template for maximum rendering performance
print("Pre-rendering master background base template...")
base_img = Image.new("RGB", (WIDTH, HEIGHT), (6, 13, 26))
draw_base = ImageDraw.Draw(base_img)

# Gradient & tech grid
for y in range(HEIGHT):
    ratio = y / HEIGHT
    r = int(5 + ratio * 7)
    g = int(14 + ratio * 15)
    b = int(28 + ratio * 28)
    draw_base.line([(0, y), (WIDTH, y)], fill=(r, g, b))

for x in range(0, WIDTH, 80):
    draw_base.line([(x, 0), (x, HEIGHT)], fill=(255, 255, 255, 6))
for y in range(0, HEIGHT, 80):
    draw_base.line([(0, y), (WIDTH, y)], fill=(255, 255, 255, 6))

# Top Brand Bar
draw_base.text((42, 24), "NÉT · TÁI SINH LƯỚI MA ĐẠI DƯƠNG", font=font_header_brand, fill=(0, 240, 255, 240))
draw_base.rounded_rectangle([330, 22, 490, 46], radius=6, fill=(16, 185, 129, 35), outline=(16, 185, 129, 180), width=1)
draw_base.text((342, 26), "OFFICIAL DEMO", font=font_badge, fill=(52, 211, 153, 255))
draw_base.text((1580, 24), "PRODUCTION: WWW.NET-S.ID.VN", font=font_url, fill=(148, 163, 184, 220))

# Pre-render Chapter Base Templates (Left Card + Right Bezel Header)
chapter_templates = {}
card_x0, card_y0 = 40, 68
card_x1, card_y1 = 515, 915

mock_x0, mock_y0 = 535, 68
mock_w, mock_h = 1345, 847
mock_x1, mock_y1 = mock_x0 + mock_w, mock_y0 + mock_h
head_h = 42

for idx, ch in enumerate(CHAPTERS):
    c_img = base_img.copy()
    c_draw = ImageDraw.Draw(c_img)
    
    # Left Card
    c_draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=16, fill=(10, 22, 40), outline=(0, 240, 255, 60), width=1)
    c_draw.line([(card_x0 + 20, card_y0 + 1), (card_x1 - 20, card_y0 + 1)], fill=(0, 240, 255, 180), width=2)

    # Badge
    badge_w = 410
    c_draw.rounded_rectangle([card_x0 + 20, card_y0 + 24, card_x0 + badge_w, card_y0 + 52], radius=6, fill=(0, 240, 255, 30), outline=(0, 240, 255, 140), width=1)
    c_draw.text((card_x0 + 28, card_y0 + 28), ch["badge"], font=font_badge, fill=(0, 240, 255, 255))

    # Title
    c_draw.text((card_x0 + 24, card_y0 + 68), ch["title"], font=font_title, fill=(255, 255, 255, 255))

    # Subtitle
    c_draw.text((card_x0 + 24, card_y0 + 115), ch["subtitle"], font=font_sub_title, fill=(148, 163, 184, 255))

    c_draw.line([(card_x0 + 24, card_y0 + 150), (card_x1 - 24, card_y0 + 150)], fill=(255, 255, 255, 25), width=1)

    # Bullets
    for b_idx, bullet in enumerate(ch["bullets"]):
        by = card_y0 + 175 + b_idx * 90
        c_draw.ellipse([card_x0 + 24, by + 4, card_x0 + 48, by + 28], fill=(16, 185, 129, 35), outline=(16, 185, 129, 200), width=1)
        c_draw.text((card_x0 + 30, by + 5), "✓", font=font_bullet, fill=(16, 185, 129, 255))
        
        words = bullet.split(" ")
        mid = len(words) // 2 + 1
        b_l1 = " ".join(words[:mid])
        b_l2 = " ".join(words[mid:])
        c_draw.text((card_x0 + 60, by + 2), b_l1, font=font_bullet, fill=(241, 245, 249, 255))
        c_draw.text((card_x0 + 60, by + 26), b_l2, font=font_bullet, fill=(203, 213, 225, 220))

    # Stat Card inside Left Panel
    stat_y0 = card_y1 - 130
    stat_y1 = card_y1 - 25
    c_draw.rounded_rectangle([card_x0 + 20, stat_y0, card_x1 - 20, stat_y1], radius=12, fill=(8, 18, 34), outline=(0, 240, 255, 80), width=1)
    c_draw.ellipse([card_x0 + 38, stat_y0 + 22, card_x0 + 84, stat_y0 + 68], fill=(0, 240, 255, 30), outline=(0, 240, 255, 180), width=1)
    c_draw.text((card_x0 + 52, stat_y0 + 28), "★", font=font_title, fill=(0, 240, 255, 255))
    c_draw.text((card_x0 + 100, stat_y0 + 22), ch["stat_val"], font=font_stat_num, fill=(255, 255, 255, 255))
    c_draw.text((card_x0 + 100, stat_y0 + 56), ch["stat_lbl"], font=font_stat_lbl, fill=(0, 240, 255, 220))

    # Right Studio Display Bezel
    c_draw.rounded_rectangle([mock_x0, mock_y0, mock_x1, mock_y1], radius=18, fill=(13, 22, 38), outline=(56, 189, 248, 70), width=1)

    # Window Header Bar
    c_draw.rounded_rectangle([mock_x0, mock_y0, mock_x1, mock_y0 + head_h + 10], radius=18, fill=(10, 18, 32))
    c_draw.rectangle([mock_x0, mock_y0 + head_h, mock_x1, mock_y0 + head_h + 10], fill=(10, 18, 32))
    c_draw.line([(mock_x0, mock_y0 + head_h), (mock_x1, mock_y0 + head_h)], fill=(255, 255, 255, 20), width=1)

    # Traffic light buttons
    c_draw.ellipse([mock_x0 + 18, mock_y0 + 15, mock_x0 + 28, mock_y0 + 25], fill=(239, 68, 68))
    c_draw.ellipse([mock_x0 + 34, mock_y0 + 15, mock_x0 + 44, mock_y0 + 25], fill=(245, 158, 11))
    c_draw.ellipse([mock_x0 + 50, mock_y0 + 15, mock_x0 + 60, mock_y0 + 25], fill=(16, 185, 129))

    # URL Pill
    url_box_w = 580
    url_box_x = mock_x0 + (mock_w - url_box_w) // 2
    c_draw.rounded_rectangle([url_box_x, mock_y0 + 8, url_box_x + url_box_w, mock_y0 + 34], radius=13, fill=(18, 30, 52), outline=(255, 255, 255, 25), width=1)
    c_draw.text((url_box_x + 22, mock_y0 + 13), f"🔒  {ch['url']}", font=font_url, fill=(148, 163, 184, 255))

    chapter_templates[ch["badge"]] = c_img

print("Templates pre-rendered successfully.")

# Setup FFmpeg Input Pipe
input_video = "/Users/3o/Downloads/Ghi Màn hình 2026-11-06 lúc 17.14.56.mov"
view_w = 1325
view_h = 788
frame_size_in = view_w * view_h * 3

ffmpeg_in_cmd = [
    "ffmpeg", "-loglevel", "error",
    "-ss", str(START_OFFSET),
    "-t", str(TOTAL_DUR),
    "-i", input_video,
    "-vf", f"crop=2940:1746:0:70,scale={view_w}:{view_h}",
    "-r", str(FPS),
    "-f", "rawvideo",
    "-pix_fmt", "rgb24",
    "-"
]

# Setup FFmpeg Output Pipe with Audio
soundtrack_wav = "demo_captures/soundtrack_user_demo.wav"
out_video = "public/assets/NET_User_Demo_Processed_1080p.mp4"
os.makedirs("public/assets", exist_ok=True)

ffmpeg_out_cmd = [
    "ffmpeg", "-y", "-loglevel", "warning",
    "-f", "rawvideo",
    "-vcodec", "rawvideo",
    "-s", f"{WIDTH}x{HEIGHT}",
    "-pix_fmt", "rgb24",
    "-r", str(FPS),
    "-i", "-",
    "-i", soundtrack_wav,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    out_video
]

print("Launching FFmpeg pipeline...")
proc_in = subprocess.Popen(ffmpeg_in_cmd, stdout=subprocess.PIPE, bufsize=frame_size_in * 10)
proc_out = subprocess.Popen(ffmpeg_out_cmd, stdin=subprocess.PIPE, bufsize=frame_size_in * 10)

sub_x0, sub_y0 = 40, 932
sub_x1, sub_y1 = 1880, 1044
bar_x0, bar_y0 = 40, 1060
bar_x1, bar_y1 = 1880, 1066
view_x0 = mock_x0 + 10
view_y0 = mock_y0 + head_h + 8

start_time = time.time()
frame_count = 0

print(f"Beginning frame compositing for {TOTAL_FRAMES} frames ({TOTAL_DUR}s)...")

try:
    while frame_count < TOTAL_FRAMES:
        raw_bytes = proc_in.stdout.read(frame_size_in)
        if len(raw_bytes) < frame_size_in:
            print(f"Reached EOF from input stream at frame {frame_count}")
            break

        sec = frame_count / FPS
        current_ch = get_chapter(sec)
        sub_l1, sub_l2 = get_subtitle(current_ch, sec)

        # 1. Base frame from chapter template
        template = chapter_templates[current_ch["badge"]]
        frame_img = template.copy()

        # 2. Paste scaled user screen into monitor
        user_screen = Image.frombytes("RGB", (view_w, view_h), raw_bytes)
        frame_img.paste(user_screen, (view_x0, view_y0))

        # 3. Draw Subtitles and Progress Bar
        draw = ImageDraw.Draw(frame_img)

        # Subtitle Box
        draw.rounded_rectangle([sub_x0, sub_y0, sub_x1, sub_y1], radius=14, fill=(8, 18, 34), outline=(0, 240, 255, 60), width=1)
        draw.rounded_rectangle([sub_x0 + 24, sub_y0 + 20, sub_x0 + 120, sub_y0 + 50], radius=6, fill=(16, 185, 129, 35), outline=(16, 185, 129, 180), width=1)
        draw.text((sub_x0 + 32, sub_y0 + 25), "THUYẾT MINH", font=font_badge, fill=(52, 211, 153, 255))

        draw.text((sub_x0 + 140, sub_y0 + 22), sub_l1, font=font_sub_line1, fill=(255, 255, 255, 255))
        draw.text((sub_x0 + 140, sub_y0 + 60), sub_l2, font=font_sub_line2, fill=(148, 163, 184, 240))

        # Progress Track
        draw.rounded_rectangle([bar_x0, bar_y0, bar_x1, bar_y1], radius=3, fill=(255, 255, 255, 20))
        progress = frame_count / TOTAL_FRAMES
        fill_x1 = int(bar_x0 + progress * (bar_x1 - bar_x0))
        if fill_x1 > bar_x0:
            draw.rounded_rectangle([bar_x0, bar_y0, fill_x1, bar_y1], radius=3, fill=(0, 240, 255))

        # 4. Pipe raw frame to FFmpeg encoder
        proc_out.stdin.write(frame_img.tobytes())
        frame_count += 1

        if frame_count % 300 == 0:
            elapsed = time.time() - start_time
            fps_proc = frame_count / elapsed
            eta = (TOTAL_FRAMES - frame_count) / fps_proc
            print(f"Rendered {frame_count}/{TOTAL_FRAMES} frames ({sec:.1f}s / {TOTAL_DUR}s) - {fps_proc:.1f} fps - ETA: {eta:.0f}s")

except Exception as e:
    print(f"Error during compositing: {e}")
finally:
    proc_in.stdout.close()
    proc_in.wait()
    proc_out.stdin.close()
    proc_out.wait()

elapsed_total = time.time() - start_time
print(f"✅ Processing completed in {elapsed_total:.1f}s ({frame_count} frames, {frame_count/elapsed_total:.1f} fps)!")
print(f"Output video: {out_video}")
