import os
import sys
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH = 1920
HEIGHT = 1080
FPS = 30

FONT_MAIN = "/Library/Fonts/Arial Unicode.ttf"
FONT_SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"

try:
    font_badge = ImageFont.truetype(FONT_SANS, 16)
    font_title = ImageFont.truetype(FONT_MAIN, 36)
    font_sub = ImageFont.truetype(FONT_MAIN, 20)
    font_bullet = ImageFont.truetype(FONT_MAIN, 18)
    font_stat_num = ImageFont.truetype(FONT_SANS, 22)
    font_stat_lbl = ImageFont.truetype(FONT_MAIN, 14)
    font_url = ImageFont.truetype(FONT_SANS, 14)
    font_footer = ImageFont.truetype(FONT_MAIN, 13)
except Exception as e:
    print(f"Font loading error: {e}")
    font_badge = font_title = font_sub = font_bullet = font_stat_num = font_stat_lbl = font_url = font_footer = ImageFont.load_default()

SCENES = [
    {
        "id": "net_but_intro",
        "dur": 7.0,
        "badge": "MỞ MÀN ĐẶC TRƯNG • NÉT BÚT KHỞI NGUYÊN",
        "title": "Chữ Ký 'Nét' & Trải Nghiệm Đầu Tiên",
        "subtitle": "Nét bút ký tự uốn lượn chạm vào tâm thức: 'Từ biển cả · Đến ký ức riêng'",
        "bullets": [
            "Hiệu ứng nét bút ký tự phác họa chữ 'Nets' trên giấy dó linen sang trọng",
            "Định vị tinh thần thương hiệu: Chắt chiu từng mắt lưới ma đại dương",
            "Chuyển cảnh mượt mà giải mã vào không gian 3D WebGL biển sâu"
        ],
        "stat_val": "Chữ Ký Thương Hiệu",
        "stat_lbl": "TỪ BIỂN CẢ · ĐẾN KÝ ỨC RIÊNG",
        "image": "net_but",
        "url": "https://www.net-s.id.vn",
        "scroll": "stroke"
    },
    {
        "id": "intro",
        "dur": 10.0,
        "badge": "KHỞI NGUỒN BIỂN SÂU • ECO-LUXURY",
        "title": "NÉT — Tái Sinh Lưới Ma Đại Dương",
        "subtitle": "Nền tảng thương mại điện tử bền vững cao cấp từ rác thải biển Việt Nam",
        "bullets": [
            "640.000 tấn lưới ma đe dọa rạn san hô Sơn Trà mỗi năm",
            "Chuyển hóa rác biển thành túi xách & charm thủ công độc bản",
            "Mô hình Phygital: Sản phẩm vật lý gắn liền Căn cước số"
        ],
        "stat_val": "85$ Giá Trị • 68% Margin",
        "stat_lbl": "THỊ TRƯỜNG DỰ KIẾN 7.2M$ MIỀN TRUNG",
        "image": "docs/concept-poster.png",
        "url": "https://www.net-s.id.vn",
        "scroll": "zoom"
    },
    {
        "id": "archify",
        "dur": 11.0,
        "badge": "ARCHIFY • FLOW STRUCTURE SHOWCASE",
        "title": "Kiến Trúc Luồng Hợp Nhất Hệ Thống",
        "subtitle": "Khép kín 3 tầng: Khách Hàng (User) ↔ Core AI Engine ↔ Xưởng May (Admin)",
        "bullets": [
            "Phân hệ 1: Trục vớt nguyên liệu & mã hóa lô lưới tự động",
            "Phân hệ 2: Trắc nghiệm cảm xúc AI & NÉT Studio 3D Configurator",
            "Phân hệ 3: Thanh toán VietQR & Giao nhận xác thực 2 chiều"
        ],
        "stat_val": "Archify Showcase v3.2",
        "stat_lbl": "SIGNAL-FLOW INTERACTIVE ARCHITECTURE",
        "image": "demo_captures/archify_flow_structure.png",
        "url": "https://www.net-s.id.vn/architecture/flow-structure",
        "scroll": "horizontal"
    },
    {
        "id": "homepage",
        "dur": 11.0,
        "badge": "USER FLOW 01 • TRANG CHỦ & 3D WEBGL",
        "title": "Khám Phá Đại Dương & Chỉ Số ESG",
        "subtitle": "Hiệu ứng bọt khí phát quang và bộ đếm sinh thái theo thời gian thực",
        "bullets": [
            "OceanCanvas3D Three.js mô phỏng vi sinh vật lân tinh phát quang",
            "Chỉ số ESG toàn hệ thống cập nhật tự động từ dữ liệu mẻ lưới",
            "Thiết kế Glassmorphism đa tầng mô phỏng tinh thể nước biển sâu"
        ],
        "stat_val": "142.5 kg Lưới • 285 m² San Hô",
        "stat_lbl": "GIẢM THIỂU 342 KG CO₂E TOÀN HỆ THỐNG",
        "image": "demo_captures/01_homepage.png",
        "url": "https://www.net-s.id.vn/",
        "scroll": "vertical"
    },
    {
        "id": "ai_quiz",
        "dur": 11.0,
        "badge": "USER FLOW 02 • AI STORYTELLING",
        "title": "Trắc Nghiệm AI 'My Da Nang Story'",
        "subtitle": "Đánh thức cảm xúc du khách qua 3 câu hỏi gợi mở tâm hồn",
        "bullets": [
            "3 câu hỏi: Mood biển • Kỷ niệm Đà Nẵng • Tâm niệm cá nhân",
            "Gemini AI gợi ý dáng túi và charm di sản (Cầu Rồng, Sóng Nam Ô)",
            "Tự động tạo đoạn thơ đề tặng riêng biệt lưu vào Căn cước số"
        ],
        "stat_val": "Gemini AI & GPT-4o",
        "stat_lbl": "TỰ ĐỘNG CHUYỂN CẤU HÌNH VÀO 3D STUDIO",
        "image": "demo_captures/02_ai_quiz.png",
        "url": "https://www.net-s.id.vn/quiz",
        "scroll": "vertical"
    },
    {
        "id": "studio",
        "dur": 11.0,
        "badge": "USER FLOW 03 • NÉT STUDIO 3D",
        "title": "NÉT Studio 3D & Snap-to-Mesh",
        "subtitle": "Phòng thí nghiệm đồng sáng tạo: Tùy biến túi 360° & Đính charm hộ mệnh",
        "bullets": [
            "Render 3D túi tuixach.glb phản quang sợi nylon tái chế đa góc nhìn",
            "Cơ chế Snap-to-Mesh tự động neo charm vào đúng tọa độ mắt lưới (#B2, #C4)",
            "Xuất bản vẽ kỹ thuật & snapshot phối cảnh cho nghệ nhân xưởng may"
        ],
        "stat_val": "Snap Grid #A1-#D8",
        "stat_lbl": "CHỐNG VA CHẠM CƠ HỌC CHO NGHỆ NHÂN",
        "image": "demo_captures/03_studio_customizer.png",
        "url": "https://www.net-s.id.vn/customizer",
        "scroll": "vertical"
    },
    {
        "id": "checkout",
        "dur": 11.0,
        "badge": "USER FLOW 04 • THANH TOÁN SIÊU TỐC",
        "title": "Cửa Hàng & Thanh Toán VietQR 1-Page",
        "subtitle": "Mua sắm liền mạch với tính toán giảm thiểu rác nhựa và VietQR Open Banking",
        "bullets": [
            "Minh bạch lượng rác nhựa thu gom trên từng mẫu túi (-0.65kg, -0.85kg)",
            "Thanh toán 1 trang tinh gọn hỗ trợ VietQR tự động khớp đơn và COD",
            "Trừ kho tức thời & sinh mã đơn hàng NET-ORD-2026 kèm tiến độ xưởng"
        ],
        "stat_val": "VietQR PayOS Callback",
        "stat_lbl": "TỰ ĐỘNG KHỚP NỘI DUNG CHUYỂN KHOẢN TỨC THỜI",
        "image": "demo_captures/05_checkout_vietqr.png",
        "url": "https://www.net-s.id.vn/checkout",
        "scroll": "vertical"
    },
    {
        "id": "passport",
        "dur": 11.0,
        "badge": "USER FLOW 05 • GIAO NHẬN 2 CHIỀU & PASSPORT",
        "title": "Xác Nhận 2 Chiều & Story Passport",
        "subtitle": "Cách mạng hóa định danh số: Thay thế thẻ nhựa NFC bằng 2-Way Handshake",
        "bullets": [
            "Shop giao xong (delivered) ➔ Khách bấm nhận trên Profile cá nhân",
            "Chiếc túi tự động định danh số vĩnh viễn vào tài khoản người dùng",
            "Mở Story Passport: Hải đồ GPS rạn san hô Sơn Trà, thơ & chỉ số ESG"
        ],
        "stat_val": "16.1024°N • 108.2611°E",
        "stat_lbl": "HẢI TRÌNH TRUY XUẤT NGUỒN GỐC ĐỘC BẢN",
        "image": "demo_captures/06_story_passport.png",
        "url": "https://www.net-s.id.vn/passport/NET-DN-20241010-82A",
        "scroll": "vertical"
    },
    {
        "id": "admin_supply",
        "dur": 11.0,
        "badge": "ADMIN FLOW 01 • TIẾP NHẬN NGUYÊN LIỆU",
        "title": "Xưởng NÉT: Tiếp Nhận Kiện Lưới Thô",
        "subtitle": "Khởi tạo chuỗi cung ứng khép kín từ biển sâu bán đảo Sơn Trà",
        "bullets": [
            "Tồn kho được quyết định bằng Lệnh nhập lưới và Lệnh may xưởng",
            "Ghi nhận GPS lặn biển, khối lượng 142.5kg, thợ lặn SASA Đà Nẵng",
            "Hệ thống tự động cấp mã lô BATCH-DN-82A và URL căn cước số"
        ],
        "stat_val": "142.5 kg Nylon PA6",
        "stat_lbl": "ĐỘI THỢ LẶN SASA SƠN TRÀ • ĐỘ SÂU 14.5M",
        "image": "demo_captures/08c_admin_supply_chain.png",
        "url": "https://www.net-s.id.vn/admin#supply-chain",
        "scroll": "vertical"
    },
    {
        "id": "admin_overview",
        "dur": 11.0,
        "badge": "ADMIN FLOW 02 • LỆNH MAY & ĐỊNH MỨC",
        "title": "Lệnh Cắt May & Kho Thành Phẩm Serial",
        "subtitle": "Tính toán tiêu hao vật liệu tự động và cấp phát mã Serial độc bản",
        "bullets": [
            "Thuật toán định mức: 0.65 kg lưới/túi ➔ Tự động trừ kho nguyên liệu mẻ",
            "Tự động sinh mã Serial duy nhất (NET-DN-...) và Barcode 128 may lót",
            "Xuất file CSV kiểm kê kho thành phẩm chuẩn tiếng Việt UTF-8 1-click"
        ],
        "stat_val": "Định Mức 0.65 kg/Túi",
        "stat_lbl": "TỰ ĐỘNG SINH SERIAL & BARCODE 128",
        "image": "demo_captures/08a_admin_overview.png",
        "url": "https://www.net-s.id.vn/admin#overview",
        "scroll": "vertical"
    },
    {
        "id": "admin_orders",
        "dur": 11.0,
        "badge": "ADMIN FLOW 03 • ĐIỀU HÀNH ĐƠN HÀNG",
        "title": "Quản Lý Đơn Hàng & Giao Nhận 2 Chiều",
        "subtitle": "Điều phối tiến độ chế tác 4 bước và kích hoạt trạng thái giao nhận số",
        "bullets": [
            "Tự động gán mã Serial túi có sẵn trong kho cho từng đơn hàng",
            "Cập nhật tiến độ: Đang may (crafting) ➔ Vận chuyển ➔ Đã giao (delivered)",
            "Ghi nhận shopDeliveredConfirmed: true, mở quyền nhận túi cho khách"
        ],
        "stat_val": "Tiến Độ Xưởng 4 Bước",
        "stat_lbl": "ĐỒNG BỘ FIRESTORE THỜI GIAN THỰC",
        "image": "demo_captures/08b_admin_orders.png",
        "url": "https://www.net-s.id.vn/admin#orders",
        "scroll": "vertical"
    },
    {
        "id": "b2b",
        "dur": 11.0,
        "badge": "B2B PARTNERSHIP • ESG ENGINE",
        "title": "Quà Tặng Doanh Nghiệp & Máy Tính ESG",
        "subtitle": "Giải pháp quà lưu niệm bền vững cho các tập đoàn & hội nghị quốc tế",
        "bullets": [
            "Mô phỏng tức thì số lượng túi đặt hàng theo quy mô sự kiện (50 - 5.000 túi)",
            "Báo cáo kiểm toán ESG tự động: kg rác đại dương, m² san hô bảo tồn",
            "Tùy biến logo thương hiệu kết hợp charm di sản văn hóa Việt Nam"
        ],
        "stat_val": "ESG Audit Ready",
        "stat_lbl": "BÁO CÁO PHỤC VỤ CHỈ SỐ BỀN VỮNG DOANH NGHIỆP",
        "image": "demo_captures/09_b2b_esg.png",
        "url": "https://www.net-s.id.vn/b2b",
        "scroll": "vertical"
    },
    {
        "id": "outro",
        "dur": 10.0,
        "badge": "NÉT GRAND FINALE • SỨ MỆNH",
        "title": "NÉT — Reclaiming Oceans. Weaving Memories.",
        "subtitle": "Biến rác đại dương thành kỷ vật di sản và câu chuyện sống mãi theo thời gian",
        "bullets": [
            "Đơn vị thực hiện: VecomNet's Tsunami Team — BDC 2026",
            "Biên lợi nhuận 68% • Thị trường mục tiêu 7.2M$ miền Trung Việt Nam",
            "Nền tảng đã hoàn thiện và sẵn sàng phục vụ du khách toàn cầu"
        ],
        "stat_val": "www.net-s.id.vn",
        "stat_lbl": "TRẢI NGHIỆM TRỰC TIẾP TRÊN MỌI THIẾT BỊ",
        "image": "demo_captures/archify_architecture.png",
        "url": "https://www.net-s.id.vn/",
        "scroll": "zoom"
    }
]

TOTAL_DURATION = sum(s["dur"] for s in SCENES)
TOTAL_FRAMES = int(TOTAL_DURATION * FPS)
print(f"Total Video Duration: {TOTAL_DURATION}s ({TOTAL_FRAMES} frames at {FPS}fps)")

# Pre-load and cache scene images
cached_images = {}
for sc in SCENES:
    path = sc["image"]
    if os.path.exists(path):
        try:
            im = Image.open(path).convert("RGB")
            cached_images[path] = im
            print(f"Loaded {path} ({im.size[0]}x{im.size[1]})")
        except Exception as e:
            print(f"Error loading {path}: {e}")

# Pre-generate bioluminescent particles for background
import random
random.seed(42)
PARTICLES = []
for _ in range(70):
    PARTICLES.append({
        "x": random.randint(0, WIDTH),
        "y": random.randint(0, HEIGHT),
        "r": random.uniform(1.2, 3.5),
        "speed": random.uniform(0.2, 0.8),
        "alpha": random.randint(30, 110),
        "phase": random.uniform(0, math.pi * 2)
    })

# Draw background gradient once
bg_base = Image.new("RGB", (WIDTH, HEIGHT), (2, 9, 20))
d_bg = ImageDraw.Draw(bg_base)
for y in range(HEIGHT):
    factor = y / HEIGHT
    r = int(2 + factor * 2)
    g = int(12 - factor * 5)
    b = int(28 - factor * 14)
    d_bg.line([(0, y), (WIDTH, y)], fill=(r, g, b))

# Render function for 1 frame
def render_frame(frame_idx, current_scene, scene_frame_idx, scene_total_frames):
    t_global = frame_idx / TOTAL_FRAMES
    t_scene = scene_frame_idx / scene_total_frames
    
    # Smooth easing
    ease_in_out = 0.5 - 0.5 * math.cos(math.pi * t_scene)
    
    # Base background
    img = bg_base.copy()
    draw = ImageDraw.Draw(img, "RGBA")
    
    # Draw animated particles
    for p in PARTICLES:
        px = int((p["x"] + frame_idx * p["speed"] * 0.5) % WIDTH)
        py = int((p["y"] + math.sin(frame_idx * 0.03 + p["phase"]) * 12) % HEIGHT)
        alpha = int(p["alpha"] * (0.6 + 0.4 * math.sin(frame_idx * 0.05 + p["phase"])))
        r = p["r"]
        draw.ellipse([px - r, py - r, px + r, py + r], fill=(0, 240, 255, alpha))
    
    # Subtle ambient radial glow behind desktop mockup
    glow_x, glow_y = 1250, 520
    glow_r = 380
    draw.ellipse([glow_x - glow_r, glow_y - glow_r, glow_x + glow_r, glow_y + glow_r], fill=(0, 60, 100, 28))
    
    # ================= LEFT PRESENTATION PANEL =================
    card_x0, card_y0 = 80, 110
    card_x1, card_y1 = 660, 930
    
    # Glassmorphic card background
    draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=20, fill=(7, 16, 32, 220), outline=(0, 240, 255, 60), width=1)
    # Card top edge highlight
    draw.line([(card_x0 + 20, card_y0), (card_x1 - 20, card_y0)], fill=(0, 240, 255, 120), width=2)
    
    # Badge Pill
    badge_text = current_scene["badge"]
    badge_w = len(badge_text) * 8.5 + 24
    draw.rounded_rectangle([card_x0 + 30, card_y0 + 35, card_x0 + 30 + badge_w, card_y0 + 67], radius=16, fill=(0, 240, 255, 25), outline=(0, 240, 255, 180), width=1)
    draw.text((card_x0 + 42, card_y0 + 42), badge_text, font=font_badge, fill=(0, 240, 255, 255))
    
    # Title (wrapped if needed)
    title_text = current_scene["title"]
    draw.text((card_x0 + 30, card_y0 + 85), title_text, font=font_title, fill=(255, 255, 255, 255))
    
    # Subtitle
    sub_text = current_scene["subtitle"]
    # Wrap subtitle into 2 lines if long
    if len(sub_text) > 42:
        words = sub_text.split(" ")
        mid = len(words) // 2
        line1 = " ".join(words[:mid])
        line2 = " ".join(words[mid:])
        draw.text((card_x0 + 30, card_y0 + 155), line1, font=font_sub, fill=(148, 163, 184, 255))
        draw.text((card_x0 + 30, card_y0 + 185), line2, font=font_sub, fill=(148, 163, 184, 255))
        bullet_start_y = card_y0 + 240
    else:
        draw.text((card_x0 + 30, card_y0 + 160), sub_text, font=font_sub, fill=(148, 163, 184, 255))
        bullet_start_y = card_y0 + 225

    # Decorative separator line
    draw.line([(card_x0 + 30, bullet_start_y - 15), (card_x1 - 30, bullet_start_y - 15)], fill=(255, 255, 255, 25), width=1)
    
    # Bullet Points (with glowing checkmark pills)
    for b_idx, bullet in enumerate(current_scene["bullets"]):
        by = bullet_start_y + b_idx * 75
        # Checkmark badge
        draw.ellipse([card_x0 + 30, by + 4, card_x0 + 54, by + 28], fill=(16, 185, 129, 40), outline=(16, 185, 129, 200), width=1)
        draw.text((card_x0 + 36, by + 6), "✓", font=font_bullet, fill=(16, 185, 129, 255))
        
        # Wrap bullet text
        b_words = bullet.split(" ")
        if len(bullet) > 36:
            mid = len(b_words) // 2 + 1
            b_l1 = " ".join(b_words[:mid])
            b_l2 = " ".join(b_words[mid:])
            draw.text((card_x0 + 66, by + 2), b_l1, font=font_bullet, fill=(241, 245, 249, 240))
            draw.text((card_x0 + 66, by + 26), b_l2, font=font_bullet, fill=(203, 213, 225, 210))
        else:
            draw.text((card_x0 + 66, by + 6), bullet, font=font_bullet, fill=(241, 245, 249, 240))
    
    # Bottom Stat Card inside left panel
    stat_box_y0 = card_y1 - 140
    stat_box_y1 = card_y1 - 30
    draw.rounded_rectangle([card_x0 + 25, stat_box_y0, card_x1 - 25, stat_box_y1], radius=14, fill=(10, 25, 48, 200), outline=(0, 240, 255, 80), width=1)
    # Stat Icon / Glow
    draw.ellipse([card_x0 + 45, stat_box_y0 + 22, card_x0 + 95, stat_box_y0 + 72], fill=(0, 240, 255, 30), outline=(0, 240, 255, 180), width=1)
    draw.text((card_x0 + 62, stat_box_y0 + 32), "★", font=font_title, fill=(0, 240, 255, 255))
    
    draw.text((card_x0 + 112, stat_box_y0 + 25), current_scene["stat_val"], font=font_stat_num, fill=(255, 255, 255, 255))
    draw.text((card_x0 + 112, stat_box_y0 + 58), current_scene["stat_lbl"], font=font_stat_lbl, fill=(0, 240, 255, 220))

    # ================= RIGHT DESKTOP MOCKUP =================
    # Subtle floating motion
    mockup_float = math.sin(frame_idx * 0.06) * 4.0
    mock_x0 = 700
    mock_y0 = int(100 + mockup_float)
    mock_w = 1140
    mock_h = 820
    mock_x1 = mock_x0 + mock_w
    mock_y1 = mock_y0 + mock_h
    
    # Outer Monitor Bezel (Deep Slate Titanium)
    draw.rounded_rectangle([mock_x0, mock_y0, mock_x1, mock_y1], radius=18, fill=(15, 23, 42, 255), outline=(56, 189, 248, 80), width=1)
    # Ambient shadow behind monitor
    draw.rounded_rectangle([mock_x0 - 4, mock_y0 - 4, mock_x1 + 4, mock_y1 + 4], radius=22, outline=(0, 240, 255, 25), width=2)
    
    # Browser Header Bar
    head_h = 42
    draw.rounded_rectangle([mock_x0, mock_y0, mock_x1, mock_y0 + head_h + 10], radius=18, fill=(11, 18, 32, 255))
    draw.rectangle([mock_x0, mock_y0 + head_h, mock_x1, mock_y0 + head_h + 10], fill=(11, 18, 32, 255))
    draw.line([(mock_x0, mock_y0 + head_h), (mock_x1, mock_y0 + head_h)], fill=(255, 255, 255, 20), width=1)
    
    # 3 Window Buttons (Red, Yellow, Green)
    draw.ellipse([mock_x0 + 18, mock_y0 + 14, mock_x0 + 30, mock_y0 + 26], fill=(239, 68, 68, 255))
    draw.ellipse([mock_x0 + 36, mock_y0 + 14, mock_x0 + 48, mock_y0 + 26], fill=(245, 158, 11, 255))
    draw.ellipse([mock_x0 + 54, mock_y0 + 14, mock_x0 + 66, mock_y0 + 26], fill=(16, 185, 129, 255))
    
    # Browser URL Pill Bar
    url_box_w = 520
    url_box_x = mock_x0 + (mock_w - url_box_w) // 2
    draw.rounded_rectangle([url_box_x, mock_y0 + 8, url_box_x + url_box_w, mock_y0 + 34], radius=13, fill=(20, 32, 54, 255), outline=(255, 255, 255, 25), width=1)
    url_str = f"🔒  {current_scene['url']}"
    draw.text((url_box_x + 20, mock_y0 + 13), url_str, font=font_url, fill=(148, 163, 184, 255))
    
    # Inner Viewport (Screen Content)
    view_x0 = mock_x0 + 1
    view_y0 = mock_y0 + head_h + 1
    view_w = mock_w - 2
    view_h = mock_h - head_h - 2
    
    if current_scene.get("image") == "net_but":
        frame_idx_clamped = min(209, scene_frame_idx)
        frame_file = f"demo_captures/net_but_frames/frame_{frame_idx_clamped:04d}.png"
        if os.path.exists(frame_file):
            stroke_img = Image.open(frame_file).convert("RGB")
            if stroke_img.size != (view_w, view_h):
                stroke_img = stroke_img.resize((view_w, view_h), Image.Resampling.LANCZOS)
            img.paste(stroke_img, (view_x0, view_y0))
    else:
        raw_img = cached_images.get(current_scene["image"])
        if raw_img:
            # Camera Pan & Zoom Animation
            mode = current_scene.get("scroll", "vertical")
            orig_w, orig_h = raw_img.size
            
            if mode == "vertical":
                # Scale to fit width, then scroll downwards
                scale = view_w / orig_w
                scaled_h = int(orig_h * scale)
                scaled_img = raw_img.resize((view_w, scaled_h), Image.Resampling.LANCZOS)
                max_scroll = max(0, scaled_h - view_h)
                scroll_offset = int(ease_in_out * max_scroll)
                crop_box = (0, scroll_offset, view_w, scroll_offset + view_h)
                cropped = scaled_img.crop(crop_box)
            elif mode == "horizontal":
                # Scale to fit height, then scroll sideways
                scale = view_h / orig_h
                scaled_w = int(orig_w * scale)
                scaled_img = raw_img.resize((scaled_w, view_h), Image.Resampling.LANCZOS)
                max_scroll = max(0, scaled_w - view_w)
                scroll_offset = int(ease_in_out * max_scroll)
                crop_box = (scroll_offset, 0, scroll_offset + view_w, view_h)
                cropped = scaled_img.crop(crop_box)
            else: # zoom
                zoom_factor = 1.0 + 0.08 * ease_in_out
                target_w = int(view_w * zoom_factor)
                target_h = int(view_h * zoom_factor)
                scaled_img = raw_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
                cx, cy = target_w // 2, target_h // 2
                crop_box = (cx - view_w // 2, cy - view_h // 2, cx + view_w // 2, cy + view_h // 2)
                cropped = scaled_img.crop(crop_box)
            
            img.paste(cropped, (view_x0, view_y0))
    
    # Soft screen glass reflection sheen
    d_view = ImageDraw.Draw(img, "RGBA")
    d_view.polygon([(view_x0 + view_w - 320, view_y0), (view_x0 + view_w, view_y0), (view_x0 + view_w, view_y0 + 260)], fill=(255, 255, 255, 8))
    
    # ================= BOTTOM PROGRESS & FOOTER =================
    prog_y = 1045
    prog_h = 5
    # Base rail
    draw.rectangle([0, prog_y, WIDTH, prog_y + prog_h], fill=(15, 23, 42, 255))
    # Active fill
    prog_w = int(WIDTH * t_global)
    draw.rectangle([0, prog_y, prog_w, prog_y + prog_h], fill=(0, 240, 255, 255))
    # Glow head
    if prog_w > 0:
        draw.ellipse([prog_w - 5, prog_y - 2, prog_w + 5, prog_y + 7], fill=(255, 255, 255, 255))
        
    # Bottom chapter label
    scene_idx = SCENES.index(current_scene) + 1
    footer_text = f"NÉT PRODUCT LAUNCH DEMO • CHƯƠNG {scene_idx:02d}/{len(SCENES):02d}: {current_scene['title']} • DOMAIN: WWW.NET-S.ID.VN"
    draw.text((card_x0, 1015), footer_text, font=font_footer, fill=(100, 116, 139, 255))
    
    return img

print("Initializing FFmpeg raw video stream...")
out_video = "demo_captures/rendered_video_silent.mp4"

cmd = [
    "ffmpeg", "-y",
    "-f", "rawvideo",
    "-vcodec", "rawvideo",
    "-s", f"{WIDTH}x{HEIGHT}",
    "-pix_fmt", "rgb24",
    "-r", str(FPS),
    "-i", "-",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "fast",
    "-crf", "18",
    out_video
]

proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

current_scene_idx = 0
scene_start_frame = 0

print("Rendering frames directly into FFmpeg pipeline...")
for f in range(TOTAL_FRAMES):
    # Determine current scene
    accum = 0
    sc = SCENES[0]
    sc_start = 0
    sc_dur_frames = int(sc["dur"] * FPS)
    
    for s_item in SCENES:
        dur_f = int(s_item["dur"] * FPS)
        if f < accum + dur_f:
            sc = s_item
            sc_start = accum
            sc_dur_frames = dur_f
            break
        accum += dur_f
    
    scene_f = f - sc_start
    frame_img = render_frame(f, sc, scene_f, sc_dur_frames)
    proc.stdin.write(frame_img.tobytes())
    
    if f % 150 == 0 or f == TOTAL_FRAMES - 1:
        pct = (f / TOTAL_FRAMES) * 100
        sec = f / FPS
        print(f"Rendered frame {f}/{TOTAL_FRAMES} ({pct:.1f}%) — {sec:.1f}s / {TOTAL_DURATION}s")

proc.stdin.close()
proc.wait()
print(f"Silent video complete: {out_video}")

# Mux silent video with generated soundtrack
final_video = "public/assets/NET_Product_Demo_FullHD.mp4"
print(f"Muxing audio track into final master: {final_video}...")

mux_cmd = [
    "ffmpeg", "-y",
    "-i", out_video,
    "-i", "demo_captures/soundtrack.wav",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    final_video
]

res = subprocess.run(mux_cmd, capture_output=True, text=True)
if res.returncode == 0:
    print(f"SUCCESS! Master Video Rendered: {final_video}")
else:
    print(f"Muxing error: {res.stderr}")
