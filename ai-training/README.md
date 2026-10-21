# Hướng Dẫn Huấn Luyện AI Móc Khoá Độc Bản Nét Studio (Nét Keychain LoRA + IP-Adapter)

Tài liệu và mã nguồn này cung cấp toàn bộ quy trình từ A đến Z để huấn luyện mô hình AI chuyên biệt tạo **Móc Khoá 2D Độc Bản (2D Flat Acrylic/Enamel Keychain Charm)** cho Nét Studio.

---

## 🎯 Mục Tiêu Đạt Được Sau Khi Huấn Luyện

1. **Chuẩn Phôi Móc Khoá 100%**: Luôn luôn sinh ra hình móc khoá có vòng xỏ kim loại trên đỉnh (`top hanging loop keyring`), viền cắt die-cut đậm rõ nét và nền trắng cô lập `#FFFFFF`.
2. **Bảo Toàn Nhận Diện Khách Hàng (85% - 95%)**: Nhờ module **IP-Adapter**, khi khách tải ảnh chân dung hoặc thú cưng lên, AI sẽ giữ đúng gương mặt, kiểu tóc, kính mắt và trang phục để đưa vào phôi móc khoá chibi.
3. **Chi Phí 0đ**: Huấn luyện hoàn toàn miễn phí trên **Google Colab (GPU T4 Free)** trong khoảng 45 - 60 phút.

---

## 📁 Cấu Trúc Thư Mục `ai-training`

```
ai-training/
├── README.md                           # Tài liệu hướng dẫn chi tiết này
├── train_net_keychain_lora.ipynb        # Jupyter Notebook 1-Click chạy trên Google Colab Free
├── dataset_captions.json               # 50 bộ prompt mô tả chuẩn hoá cho dataset mẫu
├── test_inference_ip_adapter.py        # Script chạy thử nghiệm LoRA + IP-Adapter trên máy/GPU
└── huggingface_space_app.py            # Code Serverless API deploy Free lên Hugging Face Space
```

---

## 🚀 Quy Trình Huấn Luyện 4 Bước

### Bước 1: Chuẩn bị Dataset (Ảnh mẫu)
* Chuẩn bị từ 40 đến 60 ảnh mẫu móc khoá 2D đẹp (chụp vuông 1024x1024 hoặc 768x768).
* Mỗi ảnh đi kèm một file `.txt` hoặc dòng trong `dataset_captions.json` chứa trigger word:
  `net_keychain, a 2d flat acrylic charm of [chủ_thể], direct front view, bold die-cut outline, white background`

### Bước 2: Chạy Huấn Luyện trên Google Colab (Chi phí 0đ)
1. Tải file `train_net_keychain_lora.ipynb` lên Google Drive.
2. Mở bằng **Google Colab**, chọn phần cứng: `Runtime -> Change runtime type -> T4 GPU` (Miễn phí).
3. Bấm **Run All (Chạy tất cả)**.
4. Quá trình train mất khoảng 45 - 60 phút. File trọng số xuất xưởng là:
   `net_keychain_sdxl_lora.safetensors` (~70MB).

### Bước 3: Kiểm tra thử nghiệm với IP-Adapter
* Chạy file `test_inference_ip_adapter.py` để kiểm tra độ nhận dạng ảnh khách.
* Khi truyền ảnh người thật vào, AI sẽ tự động biến thành móc khoá 2D tương ứng.

### Bước 4: Đưa lên Cloud làm API cho Website Nét Studio
* Đẩy code `huggingface_space_app.py` và file `net_keychain_sdxl_lora.safetensors` lên **Hugging Face Spaces** (chọn chế độ Zero-GPU Free).
* Website Next.js chỉ việc gửi request POST đến URL của Space để nhận ảnh hoàn thiện!
