"""
NÉT STUDIO — CLOUD API SERVICE (DEPLOY LÊN HUGGING FACE SPACES ZERO-GPU HOẶC REPLICATE)
Chức năng: Cung cấp API trực tiếp cho website Next.js gọi vào khi khách bấm nút "Tạo Móc Khoá Độc Bản".
Chi phí: 0đ (Hugging Face Spaces Zero-GPU).
"""

import os
import io
import base64
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from PIL import Image
from diffusers import StableDiffusionXLPipeline
from diffusers.utils import load_image

app = FastAPI(title="Nét Studio 2D Keychain AI API")

# Load model weights
device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

print("⏳ Khởi động mô hình Nét Keychain AI...")
pipeline = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=dtype,
    variant="fp16" if device == "cuda" else None,
).to(device)

# Nạp LoRA nếu có sẵn
LORA_PATH = os.getenv("LORA_PATH", "./net_keychain_sdxl_lora.safetensors")
if os.path.exists(LORA_PATH):
    print(f"✓ Nạp LoRA: {LORA_PATH}")
    pipeline.load_lora_weights(LORA_PATH)

# Nạp IP-Adapter nếu có GPU
if device == "cuda":
    try:
        pipeline.load_ip_adapter(
            "h94/IP-Adapter",
            subfolder="sdxl_models",
            weight_name="ip-adapter-plus_sdxl_vit-h.safetensors"
        )
        pipeline.set_ip_adapter_scale(0.7)
        print("✓ Nạp IP-Adapter Plus thành công!")
    except Exception as e:
        print(f"⚠️ Cảnh báo nạp IP-Adapter: {e}")

class GenerateRequest(BaseModel):
    prompt: str
    imageBase64: Optional[str] = None
    customText: Optional[str] = ""

class GenerateResponse(BaseModel):
    success: bool
    imageUrl: str
    message: str

@app.post("/api/generate-keychain", response_model=GenerateResponse)
async def generate_keychain_api(req: GenerateRequest):
    try:
        full_prompt = (
            f"net_keychain, a 2D flat die-cut acrylic keychain charm of {req.prompt}, "
            "direct flat front view, bold clean black contour die-cut outline, "
            "vibrant flat colors, top hanging loop with attached silver metal key ring, "
            "isolated on pure solid white #FFFFFF background, no shadows, 2d sticker vector art"
        )
        negative_prompt = (
            "3d render, realistic photo, photorealistic, shadow on floor, grey background, "
            "gradient background, blurry, deformed, ugly, metal glare"
        )

        ip_image = None
        if req.imageBase64:
            clean_base64 = req.imageBase64.split(",")[-1]
            image_data = base64.b64decode(clean_base64)
            ip_image = Image.open(io.BytesIO(image_data)).convert("RGB").resize((1024, 1024))

        kwargs = {
            "prompt": full_prompt,
            "negative_prompt": negative_prompt,
            "num_inference_steps": 28,
            "guidance_scale": 7.5,
        }
        if ip_image and device == "cuda":
            kwargs["ip_adapter_image"] = ip_image

        generated = pipeline(**kwargs).images[0]

        # Convert to Base64
        buffered = io.BytesIO()
        generated.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        data_url = f"data:image/png;base64,{img_str}"

        return GenerateResponse(
            success=True,
            imageUrl=data_url,
            message="Đã tạo móc khoá 2D độc bản thành công!"
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Nét Studio 2D Keychain AI API"}
