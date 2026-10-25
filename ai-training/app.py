import os
import io
import base64
import torch
import spaces
from PIL import Image
from pydantic import BaseModel
from typing import Optional
import gradio as gr
from diffusers import StableDiffusionXLPipeline
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

# 1. Khởi tạo mô hình SDXL Base và nạp trọng số LoRA Nét Studio
print("⏳ Đang tải mô hình SDXL Base...")
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
    variant="fp16",
    use_safetensors=True
).to("cuda")

LORA_PATH = os.getenv("LORA_PATH", "./net_keychain_sdxl_lora.safetensors")
if os.path.exists(LORA_PATH):
    print(f"✓ Nạp LoRA thành công từ: {LORA_PATH}")
    pipe.load_lora_weights(LORA_PATH)
else:
    print(f"⚠️ Cảnh báo: Không tìm thấy file {LORA_PATH}")

# 2. Hàm sinh ảnh cốt lõi gắn trực tiếp @spaces.GPU cho ZeroGPU nhận diện (duration=20s tối ưu quota)
@spaces.GPU(duration=20)
def generate_keychain(prompt: str, user_image: Optional[Image.Image] = None) -> Image.Image:
    if not prompt or prompt.strip() == "":
        prompt = "a cute 2D acrylic keychain charm"
    
    # Chuẩn hoá prompt, tránh bị lặp từ khoá
    clean_p = prompt.replace("net_keychain,", "").replace("net_keychain", "").strip()
    prefix_check = "a 2d flat die-cut acrylic keychain charm of"
    if clean_p.lower().startswith(prefix_check):
        clean_p = clean_p[len(prefix_check):].strip()
    if clean_p.lower().startswith("a cute 2d flat die-cut acrylic keychain charm of"):
        clean_p = clean_p[len("a cute 2d flat die-cut acrylic keychain charm of"):].strip()

    full_prompt = (
        f"net_keychain, a single isolated 2D flat die-cut acrylic charm of {clean_p}, "
        "centered single subject, clean bold black contour die-cut outline, "
        "vibrant flat colors, "
        "isolated on pure solid white #FFFFFF background, clean empty background, minimal vector sticker art"
    )
    negative_prompt = (
        "multiple items, multiple keychains, collage, grid, sheet, collection, extra objects, "
        "jacket sketches, surrounding clothes, floating accessories, background clutter, "
        "patterned background, split screen, frame, arch frame, yellow frame, hanging metal loops, key ring, "
        "border, text, watermark, 3d render, "
        "realistic photo, photorealistic, shadow on floor, grey background, gradient background, "
        "blurry, deformed, ugly, metal glare"
    )
    result = pipe(
        prompt=full_prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=28,
        guidance_scale=7.5,
    ).images[0]
    return result

# 3. Tạo giao diện Gradio Blocks
with gr.Blocks(title="Nét Studio 2D Keychain AI") as demo:
    gr.Markdown("# 🎨 NÉT STUDIO — 2D KEYCHAIN AI GENERATOR")
    gr.Markdown("Mô hình AI tạo **Móc khoá 2D Độc Bản (2D Flat Acrylic Keychain Charm)** từ lưới ma đại dương.")
    
    with gr.Row():
        with gr.Column():
            prompt_input = gr.Textbox(
                label="Mô tả ý tưởng (Prompt)",
                placeholder="Ví dụ: a cool chibi Vietnamese boy with glasses, black t-shirt",
                lines=3
            )
            image_input = gr.Image(label="Ảnh tham chiếu (Tuỳ chọn)", type="pil")
            btn = gr.Button("✨ Tạo Móc Khoá 2D", variant="primary")
        with gr.Column():
            output_image = gr.Image(label="Bản vẽ Móc Khoá 2D Độc Bản")
    
    # ZeroGPU yêu cầu hàm truyền vào fn phải được bọc trực tiếp bởi @spaces.GPU
    btn.click(
        fn=generate_keychain,
        inputs=[prompt_input, image_input],
        outputs=[output_image],
        api_name="generate_keychain"
    )

# 4. Gắn thêm REST API endpoint cho Website Nét Studio Next.js
class GenerateRequest(BaseModel):
    prompt: str
    imageBase64: Optional[str] = None
    customText: Optional[str] = ""

async def api_generate_keychain(req: GenerateRequest):
    try:
        input_image = None
        if req.imageBase64:
            clean_base64 = req.imageBase64.split(",")[-1]
            image_data = base64.b64decode(clean_base64)
            input_image = Image.open(io.BytesIO(image_data)).convert("RGB").resize((1024, 1024))
        
        result_img = generate_keychain(req.prompt, input_image)

        buffered = io.BytesIO()
        result_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        data_url = f"data:image/png;base64,{img_str}"

        return {
            "success": True,
            "imageUrl": data_url,
            "message": "Đã tạo móc khoá 2D độc bản thành công!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

demo.app.add_api_route("/api/generate-keychain", api_generate_keychain, methods=["POST"])
demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Khởi chạy bằng demo.launch() chuẩn của Hugging Face Gradio Space
if __name__ == "__main__":
    demo.launch()
