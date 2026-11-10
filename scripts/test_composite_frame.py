import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080

FONT_MAIN = "/Library/Fonts/Arial Unicode.ttf"
FONT_SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"

try:
    font_badge = ImageFont.truetype(FONT_SANS, 15)
    font_title = ImageFont.truetype(FONT_MAIN, 32)
    font_bullet = ImageFont.truetype(FONT_MAIN, 17)
    font_stat_num = ImageFont.truetype(FONT_SANS, 22)
    font_stat_lbl = ImageFont.truetype(FONT_MAIN, 13)
    font_url = ImageFont.truetype(FONT_SANS, 14)
    font_sub_title = ImageFont.truetype(FONT_MAIN, 18)
    font_sub_text = ImageFont.truetype(FONT_MAIN, 20)
    font_header_brand = ImageFont.truetype(FONT_MAIN, 16)
except Exception as e:
    print(f"Font loading error: {e}")
    font_badge = font_title = font_bullet = font_stat_num = font_stat_lbl = font_url = font_sub_title = font_sub_text = font_header_brand = ImageFont.load_default()

def create_sample_frame(video_sec, out_path):
    # Extract cropped user frame
    temp_raw = f"/tmp/sample_crop_{int(video_sec)}.png"
    subprocess.run([
        'ffmpeg', '-y', '-ss', str(video_sec), '-i', '/Users/3o/Downloads/Ghi Màn hình 2026-11-06 lúc 17.14.56.mov',
        '-vf', 'crop=2940:1746:0:70,scale=1325:788', '-vframes', '1', temp_raw
    ], capture_output=True)

    user_img = Image.open(temp_raw).convert("RGB")

    # Canvas
    img = Image.new("RGB", (WIDTH, HEIGHT), (6, 13, 26))
    draw = ImageDraw.Draw(img)

    # 1. Background Gradient & Decorative Grid
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(5 + ratio * 7)
        g = int(14 + ratio * 15)
        b = int(28 + ratio * 28)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Tech grid
    for x in range(0, WIDTH, 80):
        draw.line([(x, 0), (x, HEIGHT)], fill=(255, 255, 255, 6))
    for y in range(0, HEIGHT, 80):
        draw.line([(0, y), (WIDTH, y)], fill=(255, 255, 255, 6))

    # Top Brand Bar
    draw.text((42, 24), "NÉT · TÁI SINH LƯỚI MA ĐẠI DƯƠNG", font=font_header_brand, fill=(0, 240, 255, 240))
    draw.rounded_rectangle([330, 22, 490, 46], radius=6, fill=(16, 185, 129, 35), outline=(16, 185, 129, 180), width=1)
    draw.text((342, 26), "OFFICIAL DEMO", font=font_badge, fill=(52, 211, 153, 255))
    draw.text((1580, 24), "PRODUCTION: WWW.NET-S.ID.VN", font=font_url, fill=(148, 163, 184, 220))

    # 2. Left Information Card
    card_x0, card_y0 = 40, 68
    card_x1, card_y1 = 515, 915
    draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=16, fill=(10, 22, 40), outline=(0, 240, 255, 60), width=1)
    # Ambient glow line at top of card
    draw.line([(card_x0 + 20, card_y0 + 1), (card_x1 - 20, card_y0 + 1)], fill=(0, 240, 255, 180), width=2)

    # Badge
    draw.rounded_rectangle([card_x0 + 24, card_y0 + 24, card_x0 + 360, card_y0 + 52], radius=6, fill=(0, 240, 255, 30), outline=(0, 240, 255, 140), width=1)
    draw.text((card_x0 + 34, card_y0 + 28), "CHƯƠNG 03/10 • NÉT STUDIO 3D", font=font_badge, fill=(0, 240, 255, 255))

    # Title
    draw.text((card_x0 + 24, card_y0 + 68), "Tự Do Phối Túi Độc Bản 3D", font=font_title, fill=(255, 255, 255, 255))

    # Subtitle
    sub_title = "Bộ tùy biến 3D WebGL thời gian thực với Snap-to-Mesh"
    draw.text((card_x0 + 24, card_y0 + 115), sub_title, font=font_sub_title, fill=(148, 163, 184, 255))

    draw.line([(card_x0 + 24, card_y0 + 150), (card_x1 - 24, card_y0 + 150)], fill=(255, 255, 255, 25), width=1)

    # Bullets
    bullets = [
        "Engine Three.js WebGL dựng mô hình túi thời gian thực siêu mượt mà",
        "Công nghệ Snap-to-Mesh tự động hít charm vào các mắt lưới chuẩn xác",
        "Tự động xuất bản vẽ kỹ thuật Blueprint để thợ may thủ công thực hiện"
    ]
    for b_idx, bullet in enumerate(bullets):
        by = card_y0 + 175 + b_idx * 90
        draw.ellipse([card_x0 + 24, by + 4, card_x0 + 48, by + 28], fill=(16, 185, 129, 35), outline=(16, 185, 129, 200), width=1)
        draw.text((card_x0 + 30, by + 5), "✓", font=font_bullet, fill=(16, 185, 129, 255))
        
        words = bullet.split(" ")
        mid = len(words) // 2 + 1
        b_l1 = " ".join(words[:mid])
        b_l2 = " ".join(words[mid:])
        draw.text((card_x0 + 60, by + 2), b_l1, font=font_bullet, fill=(241, 245, 249, 255))
        draw.text((card_x0 + 60, by + 26), b_l2, font=font_bullet, fill=(203, 213, 225, 220))

    # Stat Card inside Left Panel
    stat_y0 = card_y1 - 130
    stat_y1 = card_y1 - 25
    draw.rounded_rectangle([card_x0 + 20, stat_y0, card_x1 - 20, stat_y1], radius=12, fill=(8, 18, 34), outline=(0, 240, 255, 80), width=1)
    draw.ellipse([card_x0 + 38, stat_y0 + 22, card_x0 + 84, stat_y0 + 68], fill=(0, 240, 255, 30), outline=(0, 240, 255, 180), width=1)
    draw.text((card_x0 + 52, stat_y0 + 28), "★", font=font_title, fill=(0, 240, 255, 255))
    draw.text((card_x0 + 100, stat_y0 + 22), "Snap-to-Mesh 3D Engine", font=font_stat_num, fill=(255, 255, 255, 255))
    draw.text((card_x0 + 100, stat_y0 + 56), "BẢN VẼ BLUEPRINT KỸ THUẬT CHÍNH XÁC", font=font_stat_lbl, fill=(0, 240, 255, 220))

    # 3. Right Apple Studio Display Mockup
    mock_x0, mock_y0 = 535, 68
    mock_w, mock_h = 1345, 847
    mock_x1, mock_y1 = mock_x0 + mock_w, mock_y0 + mock_h

    # Bezel
    draw.rounded_rectangle([mock_x0, mock_y0, mock_x1, mock_y1], radius=18, fill=(13, 22, 38), outline=(56, 189, 248, 70), width=1)

    # Window Header Bar
    head_h = 42
    draw.rounded_rectangle([mock_x0, mock_y0, mock_x1, mock_y0 + head_h + 10], radius=18, fill=(10, 18, 32))
    draw.rectangle([mock_x0, mock_y0 + head_h, mock_x1, mock_y0 + head_h + 10], fill=(10, 18, 32))
    draw.line([(mock_x0, mock_y0 + head_h), (mock_x1, mock_y0 + head_h)], fill=(255, 255, 255, 20), width=1)

    # Traffic light buttons
    draw.ellipse([mock_x0 + 18, mock_y0 + 15, mock_x0 + 28, mock_y0 + 25], fill=(239, 68, 68))
    draw.ellipse([mock_x0 + 34, mock_y0 + 15, mock_x0 + 44, mock_y0 + 25], fill=(245, 158, 11))
    draw.ellipse([mock_x0 + 50, mock_y0 + 15, mock_x0 + 60, mock_y0 + 25], fill=(16, 185, 129))

    # URL Pill
    url_box_w = 560
    url_box_x = mock_x0 + (mock_w - url_box_w) // 2
    draw.rounded_rectangle([url_box_x, mock_y0 + 8, url_box_x + url_box_w, mock_y0 + 34], radius=13, fill=(18, 30, 52), outline=(255, 255, 255, 25), width=1)
    draw.text((url_box_x + 22, mock_y0 + 13), "🔒  https://www.net-s.id.vn/studio", font=font_url, fill=(148, 163, 184, 255))

    # Paste User Screen
    view_x0 = mock_x0 + 10
    view_y0 = mock_y0 + head_h + 8
    img.paste(user_img, (view_x0, view_y0))

    # 4. Lower Third Subtitle Bar
    sub_x0, sub_y0 = 40, 932
    sub_x1, sub_y1 = 1880, 1044
    draw.rounded_rectangle([sub_x0, sub_y0, sub_x1, sub_y1], radius=14, fill=(8, 18, 34), outline=(0, 240, 255, 60), width=1)
    
    # Subtitle icon / badge
    draw.rounded_rectangle([sub_x0 + 24, sub_y0 + 20, sub_x0 + 110, sub_y0 + 50], radius=6, fill=(16, 185, 129, 35), outline=(16, 185, 129, 180), width=1)
    draw.text((sub_x0 + 34, sub_y0 + 25), "THUYẾT MINH", font=font_badge, fill=(52, 211, 153, 255))
    
    # Live Subtitle Text
    sub_line_1 = "Kéo thả charm Cầu Rồng và Sóng Biển vào đúng tọa độ mắt lưới bằng công nghệ Snap-to-Mesh."
    sub_line_2 = "Xem trước bản vẽ Blueprint kỹ thuật 3D, giá thành tự động cập nhật và sẵn sàng may đo thủ công."
    draw.text((sub_x0 + 130, sub_y0 + 22), sub_line_1, font=font_sub_text, fill=(255, 255, 255, 255))
    draw.text((sub_x0 + 130, sub_y0 + 60), sub_line_2, font=font_sub_title, fill=(148, 163, 184, 240))

    # 5. Progress Bar
    bar_x0, bar_y0 = 40, 1060
    bar_x1, bar_y1 = 1880, 1066
    draw.rounded_rectangle([bar_x0, bar_y0, bar_x1, bar_y1], radius=3, fill=(255, 255, 255, 20))
    progress = 0.38
    fill_x1 = int(bar_x0 + progress * (bar_x1 - bar_x0))
    draw.rounded_rectangle([bar_x0, bar_y0, fill_x1, bar_y1], radius=3, fill=(0, 240, 255))

    img.save(out_path, quality=95)
    print(f"Sample frame saved to {out_path}")

create_sample_frame(85.0, "/tmp/sample_composite_frame.png")
