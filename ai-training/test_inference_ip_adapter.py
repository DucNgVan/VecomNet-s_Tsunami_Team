"""
NÉT STUDIO — SCRIPT KIỂM THỬ IP-ADAPTER + NÉT KEYCHAIN LORA
Chức năng: Nhận ảnh thật của khách hàng + Câu lệnh Prompt,
giữ nguyên gương mặt và kiểu tóc của khách, biến thành móc khoá 2D độc bản.
"""

import torch
from PIL import Image
from diffusers import StableDiffusionXLPipeline
from diffusers.utils import load_image

def generate_personalized_keychain(
    user_image_path: str,
    custom_prompt: str,
    lora_path: str = "./output_lora",
    output_path: str = "result_keychain.png"
):
    print("⏳ Đang tải mô hình nền tảng SDXL Base 1.0...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    pipeline = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=dtype,
        variant="fp16" if device == "cuda" else None,
    ).to(device)

    # 1. Nạp LoRA Nét Keychain (Định hình phôi móc khoá có khoen và viền die-cut)
    print(f"⏳ Nạp trọng số LoRA từ: {lora_path}...")
    pipeline.load_lora_weights(lora_path)

    # 2. Nạp IP-Adapter Plus SDXL (Giữ nhận diện khuôn mặt và dáng người)
    print("⏳ Nạp IP-Adapter Plus SDXL...")
    pipeline.load_ip_adapter(
        "h94/IP-Adapter",
        subfolder="sdxl_models",
        weight_name="ip-adapter-plus_sdxl_vit-h.safetensors"
    )
    # Tỉ lệ ảnh hưởng của ảnh khách (0.6 - 0.75 là mức vàng: vừa giống khách vừa chuẩn dáng móc khoá)
    pipeline.set_ip_adapter_scale(0.7)

    # 3. Đọc ảnh người dùng tải lên
    print(f"⏳ Đang xử lý ảnh mẫu tham chiếu: {user_image_path}...")
    user_image = load_image(user_image_path).resize((1024, 1024))

    # 4. Master Prompt chuẩn
    full_prompt = (
        f"net_keychain, a 2D flat die-cut acrylic keychain charm of {custom_prompt}, "
        "direct flat front view, bold clean black contour die-cut outline, "
        "vibrant flat colors, top hanging loop with attached silver metal key ring, "
        "isolated on pure solid white #FFFFFF background, no shadows, 2d sticker vector art"
    )
    negative_prompt = (
        "3d render, realistic photo, photorealistic, shadow on floor, grey background, "
        "gradient background, blurry, deformed, extra limbs, ugly, metal shine, glare"
    )

    print("🎨 Nghệ nhân AI đang vẽ móc khoá 2D độc bản...")
    result = pipeline(
        prompt=full_prompt,
        ip_adapter_image=user_image,
        negative_prompt=negative_prompt,
        num_inference_steps=30,
        guidance_scale=7.5,
    ).images[0]

    result.save(output_path)
    print(f"✨ Thành công! Bản vẽ móc khoá độc bản đã lưu tại: {output_path}")

if __name__ == "__main__":
    import sys
    user_img = sys.argv[1] if len(sys.argv) > 1 else "sample_user.jpg"
    prompt_detail = sys.argv[2] if len(sys.argv) > 2 else "a cool chibi boy with glasses and black t-shirt"
    generate_personalized_keychain(user_img, prompt_detail)
