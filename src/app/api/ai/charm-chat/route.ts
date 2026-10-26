import { NextRequest, NextResponse } from "next/server";
import {
  buildMaster2DKeychainPrompt,
  CharmThemeCategory,
  SlotValues,
} from "@/lib/masterPromptTemplates";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Đảm bảo server có đủ thời gian (60s) để AI đồ hoạ vẽ và trau chuốt bản vẽ 2D hoàn hảo nhất

interface ChatRequestPayload {
  prompt?: string;
  imageBase64?: string; // Optional user uploaded sketch or photo
  history?: Array<{ sender: "ai" | "user"; text: string }>;
  customText?: string;
  selectedColor?: string;
  customShape?: string;
  bagColor?: string;
  bagColorName?: string;
  category?: CharmThemeCategory | "auto";
  slots?: SlotValues;
}

/**
 * Gọi mô hình LoRA SDXL trên Hugging Face Spaces (Zero-GPU Gradio 5/6 SSE API hoặc REST fallback)
 * Ưu tiên gọi Hugging Face Space cho đến khi báo hết GPU hoặc gặp lỗi
 */
async function callLoraKeychainModel(
  baseUrl: string,
  prompt: string,
  imageBase64?: string
): Promise<string | null> {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const hfToken = process.env.HF_TOKEN;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (hfToken) {
    headers["Authorization"] = `Bearer ${hfToken}`;
  }

  // 1. ƯU TIÊN SỐ 1: Gọi trực tiếp FastAPI REST endpoint /api/generate-keychain (hỗ trợ cả có ảnh gốc hoặc text-only)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s cho ZeroGPU
    const bodyPayload: any = { prompt };
    if (imageBase64) bodyPayload.imageBase64 = imageBase64;

    const aiRes = await fetch(`${cleanBase}/api/generate-keychain`, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (aiRes.ok) {
      const aiJson = await aiRes.json();
      if (aiJson.imageUrl) {
        console.log("[Hugging Face Space] Tạo ảnh móc khoá thành công từ /api/generate-keychain!");
        return aiJson.imageUrl;
      }
    } else {
      console.warn(`[Hugging Face Space Status ${aiRes.status}]:`, await aiRes.text().catch(() => ""));
    }
  } catch (restErr) {
    console.warn("[Hugging Face Space REST Warning]:", restErr);
  }

  // 2. Dự phòng giao thức Gradio 5/6 Call & SSE Stream
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const initRes = await fetch(`${cleanBase}/gradio_api/call/generate_keychain`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: [prompt, imageBase64 ? { url: imageBase64 } : null],
      }),
      signal: controller.signal,
    });

    if (initRes.ok) {
      const initData = await initRes.json();
      const eventId = initData.event_id;

      if (eventId) {
        const streamRes = await fetch(
          `${cleanBase}/gradio_api/call/generate_keychain/${eventId}`,
          { headers, signal: controller.signal }
        );

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith("event: complete")) {
                const nextLine = lines[i + 1] || "";
                if (nextLine.startsWith("data: ")) {
                  clearTimeout(timeoutId);
                  const rawData = nextLine.replace("data: ", "").trim();
                  const parsed = JSON.parse(rawData);
                  const fileObj = Array.isArray(parsed) ? parsed[0] : parsed;
                  const remoteUrl = fileObj?.url;
                  if (remoteUrl) {
                    try {
                      const imgFetch = await fetch(remoteUrl);
                      if (imgFetch.ok) {
                        const arrayBuf = await imgFetch.arrayBuffer();
                        const b64 = Buffer.from(arrayBuf).toString("base64");
                        const mime = imgFetch.headers.get("content-type") || "image/webp";
                        return `data:${mime};base64,${b64}`;
                      }
                    } catch (fetchErr) {
                      console.warn("Could not convert image to base64, using remote URL:", fetchErr);
                    }
                    return remoteUrl;
                  }
                }
              } else if (lines[i].startsWith("event: error")) {
                clearTimeout(timeoutId);
                console.warn("[Gradio SSE Error Event]:", lines[i + 1] || "");
                break;
              }
            }
          }
        }
      }
    }
    clearTimeout(timeoutId);
  } catch (gradioErr) {
    console.warn("[Gradio API Warning]:", gradioErr);
  }

  // 3. Fallback cuối cùng cho trường hợp Text-to-Image qua REST endpoint
  if (!imageBase64) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);
      const aiRes = await fetch(`${cleanBase}/api/generate-keychain`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        if (aiJson.imageUrl) {
          return aiJson.imageUrl;
        }
      }
    } catch (customErr) {
      console.warn("[Custom Endpoint Warning]:", customErr);
    }
  }

  return null;
}

/**
 * Sinh ảnh móc khoá 2D dự phòng khi Hugging Face ZeroGPU bận hoặc hết hạn mức
 * Tuyệt đối không tạo khung tròn, chỉ lấy hình móc khoá bo viền theo chủ thể
 */
async function callFallbackKeychainImage(prompt: string): Promise<string | null> {
  try {
    const cleanPrompt = prompt.replace(/die-cut|acrylic|keychain|charm/gi, "").trim();
    const encoded = encodeURIComponent(
      `single cute 2D anime chibi die-cut keychain charm of ${cleanPrompt}, contoured silhouette outline cut to shape, isolated on pure solid white #FFFFFF background, minimal vector sticker art, no frame, no circle, no border, no background clutter, no medallion`
    );
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}`;
    const res = await fetch(url);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      const mime = res.headers.get("content-type") || "image/jpeg";
      return `data:${mime};base64,${b64}`;
    }
  } catch (err) {
    console.warn("[Fallback Image Error]:", err);
  }
  return null;
}

/**
 * NÉT STUDIO 2D KEYCHAIN DESIGN AGENT
 * Phân tích yêu cầu, tư vấn phong cách, trích xuất đặc trưng nhận dạng
 * và chuẩn hoá phôi móc khoá thủ công 2D cho nghệ nhân xưởng chế tác.
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        "[API Warning]: Chưa tìm thấy GEMINI_API_KEY trên môi trường host. Sẽ sử dụng bộ phân tích cục bộ và chuyển thẳng sang sinh ảnh."
      );
    }

    const body: ChatRequestPayload = await req.json();
    const userPrompt = (body.prompt || "").trim();
    const imageBase64 = body.imageBase64;
    const customText = (body.customText || "").trim();
    const bagColorName = body.bagColorName || "Túi Lưới Biển Xanh";
    const selectedColorHex = body.selectedColor || "#2563EB";
    const requestedCategory: CharmThemeCategory =
      body.category && body.category !== "auto" ? body.category : "human";

    if (!userPrompt && !imageBase64 && !body.slots?.subject) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập ý tưởng thiết kế, điền ô trống hoặc tải lên hình ảnh!",
        },
        { status: 400 }
      );
    }

    // NGƯỜI DÙNG CUNG CẤP Ô TRỐNG, Ý TƯỞNG HOẶC ẢNH MẪU:
    // DÙNG GEMINI FLASH-LITE ĐỂ PHÂN TÍCH, DỊCH SANG TIẾNG ANH & THIẾT KẾ MASTER PROMPT MÓC KHOÁ 2D
    const systemInstruction = `Bạn là Nghệ nhân Thiết kế Đồ họa 2D & Giám đốc Sáng tạo của Nét Studio — thương hiệu túi lưới tái chế đại dương và móc khoá độc bản tại Đà Nẵng.

MỤC TIÊU CỐT LÕI (CỰC KỲ QUAN TRỌNG):
Tạo ra BẢN VẼ MÓC KHOÁ 2D PHẲNG (2D FLAT ACRYLIC / ENAMEL KEYCHAIN CHARM) ĐỘC BẢN, SẮC NÉT, ĐÚNG NGHĨA LÀ MỘT CHIẾC MÓC KHOÁ THỰC TẾ.
Bản vẽ 2D này sẽ là bản thảo kỹ thuật trực tiếp để các NGHỆ NHÂN CỦA NÉT STUDIO lấy làm khuôn mẫu, dùng phần mềm CAD đùn khối (extrude) và in ra sản phẩm móc khoá thực tế bằng MÁY IN 3D.

TUYỆT ĐỐI TRÁNH NHỮNG LỖI SAU:
1. KHÔNG render 3D tả thực, KHÔNG vẽ đồ vật nổi khối như chụp ảnh studio.
2. KHÔNG có bóng kim loại phản chiếu tả thực (no photorealistic metallic reflection).
3. KHÔNG có nền dơ, KHÔNG đổ bóng gradient xám (no grey shadows, no background gradient).
4. BẮT BUỘC nền trắng tinh khiết tuyệt đối #FFFFFF (isolated on pure solid white #FFFFFF background) để bóc nền trong suốt sạch sẽ.
5. HÌNH DÁNG CHARM: TUYỆT ĐỐI KHÔNG TẠO KHUNG TRÒN, KHÔNG VẼ KHUNG VÒM, KHÔNG ĐẶT TRÊN MẶT ĐĨA/XU/HUY HIỆU (NO circular frame, NO round border, NO coin, NO medallion plate, NO picture frame). Bản vẽ BẮT BUỘC LÀ PHÔI MÓC KHOÁ DIE-CUT BO VIỀN SÁT THEO ĐƯỜNG NÉT CHỦ THỂ (die-cut contour directly along the subject silhouette). Viền ngoài bo die-cut sắc nét (bold dark die-cut outline), mảng màu phẳng (flat color blocks), phong cách 2D vector / sticker chibi. TUYỆT ĐỐI KHÔNG vẽ thêm khung bao quanh.
6. BẮT BUỘC DỊCH TOÀN BỘ CÁC Ô ĐIỀN CỦA KHÁCH TỪ TIẾNG VIỆT SANG TIẾNG ANH ĐỒ HOẠ CHUẨN XÁC TRONG masterPrompt (Tuyệt đối không để nguyên cụm từ tiếng Việt trong masterPrompt vì model sinh ảnh chỉ hiểu tiếng Anh).
7. ĐỐI VỚI VẬT THỂ (OBJECT), ĐỊA DANH (LANDMARK), HOA CỎ (FLORA) HOẶC KHI KHÁCH NÓI "KHÔNG" / BỎ QUA:
   - TUYỆT ĐỐI KHÔNG TỰ Ý THÊM NÉT MẶT, MẮT CƯỜI HAY MÁ HỒNG (NO smiling eyes, NO blushing cheeks, NO anime cartoon face on inanimate objects).
   - Chỉ thêm biểu cảm khuôn mặt nếu khách ĐÍCH DANH yêu cầu "có mặt cười", "mặt chibi".
   - Nếu khách chọn "không", "bỏ qua", "không có", hoặc để trống feature3, hãy giữ nguyên dáng vẻ chân thực, tinh tế, tối giản của vật thể!
8. TUYỆT ĐỐI CHỈ VẼ DUY NHẤT 1 CHIẾC MÓC KHOÁ Ở CHÍNH GIỮA (SINGLE ISOLATED CHARM ONLY - CỰC KỲ QUAN TRỌNG):
   - KHÔNG ĐƯỢC VẼ NHIỀU ĐỒ VẬT, KHÔNG VẼ BỘ SƯU TẬP (NO multiple items, NO duplicate keychains, NO collection, NO sticker sheet).
   - TUYỆT ĐỐI KHÔNG VẼ TRANH GHÉP, KHÔNG CHIA Ô LƯỚI (NO collage, NO grid, NO split screen).
   - TUYỆT ĐỐI KHÔNG VẼ THÊM ÁO KHOÁC, QUẦN ÁO HAY PHỤ KIỆN LƠ LỬNG XUNG QUANH (NO extra jackets, NO floating clothes, NO surrounding accessories, NO floating sketches).
   - CHỈ VẼ DUY NHẤT 1 NHÂN VẬT/CHỦ THỂ ĐỨNG CHÍNH GIỮA BỨC TRANH.
   - NỀN BẮT BUỘC LÀ TRẮNG TRỐNG HOÀN TOÀN #FFFFFF (pure solid white #FFFFFF background, completely empty background, no background objects).

QUY TẮC CỐT LÕI: CHIBI HOÁ / CARTOON HOÁ TẤT CẢ NGƯỜI & CON VẬT (BÁM SÁT 100% ẢNH MẪU):
1. NẾU TRONG ẢNH CÓ NGƯỜI (chân dung, selfie, chụp gương, toàn thân, cặp đôi, em bé):
   - MỤC TIÊU SỐ 1: Bắt buộc CHIBI HOÁ / CARTOON HOÁ người đó thành một nhân vật Chibi Anime cực kỳ dễ thương (cute kawaii 2D anime chibi character), giống hệt người trong ảnh nhưng ở phong cách hoạt hình!
   - TỶ LỆ CHIBI CUTE: Đầu to tròn đáng yêu (oversized cute round head), má bánh bao ửng hồng (chubby rosy blushing cheeks), mắt anime cười híp mí hoặc to tròn lấp lánh (happy smiling anime eyes), nụ cười tươi thân thiện.
   - BẢO TOÀN 100% DIỆN MẠO ĐỂ NHÌN VÀO LÀ BIẾT NGAY ĐÓ LÀ HỌ:
     * Kiểu tóc & Màu tóc: Bám sát kiểu tóc trong ảnh thật (tóc ngắn vuốt spiky, undercut, tóc uốn lượn sóng, tóc buộc đuôi ngựa, tóc mái ngố...).
     * Kính mắt: Nếu người trong ảnh đeo kính, giữ nguyên gọng kính (kính gọng đen, gọng tròn, gọng vuông...).
     * Râu & Nét mặt: Nếu có râu hoặc đặc điểm riêng thì giữ lại theo nét chibi tối giản.
     * Trang phục: Giữ nguyên màu sắc và kiểu dáng quần áo từ ảnh thật (áo thun đen, áo polo, áo hoodie, quần kaki...).
     * Tư thế: Bám sát tư thế từ ảnh thật! Nếu trong ảnh là tư thế chụp selfie trước gương: Chuyển thành nhân vật chibi đứng toàn thân, MỘT TAY CẦM CHIẾC SMARTPHONE TRẮNG MINI TẠO DÁNG CHỤP SELFIE, TAY CÒN LẠI ĐÚT TÚI QUẦN.
   - HÌNH THÁI MÓC KHOÁ: Nhân vật chibi được bao bọc bởi đường viền acrylic trong suốt (clear transparent laser-cut die-cut acrylic border around the character), phía trên đỉnh có khoen xỏ kim loại màu bạc (silver metal keychain ring on top), nền trắng tinh khiết tuyệt đối #FFFFFF.

2. NẾU TRONG ẢNH CÓ CON VẬT / THÚ CƯNG (chó, mèo, thỏ, chim, chuột hamster, thú cưng...):
   - MỤC TIÊU SỐ 1: Bắt buộc CHIBI HOÁ / CARTOON HOÁ con vật thành thú cưng Chibi cực kỳ dễ thương (ultra-kawaii chibi cartoon pet), giống hệt con vật trong ảnh!
   - TỶ LỆ CHIBI CUTE: Thân hình tròn xoe mũm mĩm, đầu tròn đáng yêu, đôi mắt to tròn long lanh có đốm sáng (big glossy anime catchlight eyes), má phúng phính ửng hồng, biểu cảm toe toét cười đáng yêu hoặc ngơ ngác kawaii.
   - BẢO TOÀN 100% ĐẶC ĐIỂM CON VẬT TỪ ẢNH MẪU:
     * Giống loài: Bám sát giống loài (Corgi, Poodle, Phốc sóc, mèo Anh lông ngắn, mèo mướp, mèo ba màu, Golden Retriever...).
     * Màu lông & Đốm lông: Đúng từng đốm màu từ ảnh thật (mảng lông trắng ở ngực, đốm đen quanh mắt, sọc vằn trên trán, tai một bên cụp một bên dựng...).
     * Vòng cổ & Phụ kiện: Nếu thú cưng đeo chuông, khăn quàng cổ hay nơ thì giữ nguyên màu sắc chi tiết.
     * Tư thế: Bám sát tư thế từ ảnh thật (ngồi ngoan ngoãn, nằm xòe chân, giơ chân chào, nghiêng đầu ngơ ngác...).
   - HÌNH THÁI MÓC KHOÁ: Thú cưng chibi được bao bọc bởi viền acrylic trong suốt (clear transparent die-cut acrylic border), khoen kim loại bạc trên đỉnh, nền trắng tinh #FFFFFF.

3. NẾU LÀ HOA CỎ / ĐỒ VẬT / ĐỊA DANH:
   - Giữ nét đồ hoạ 2D vector phẳng tinh tế, sắc sảo chuẩn phôi móc khoá.

4. NẾU KHÔNG CÓ ẢNH TẢI LÊN:
   - Tự do sáng tạo phôi móc khoá 2D độc bản hoàn toàn mới dựa trên ý tưởng và các ô trống khách hàng điền.

5. CẤU TRÚC MASTER PROMPT TIẾNG ANH (DỊCH TOÀN BỘ SANG TIẾNG ANH CHUẨN XÁC, BẮT BUỘC CÓ VIỀN ACRYLIC VÀ KHOEN):
   - Khi là Người: "a cute custom acrylic keychain charm of an adorable 2D anime chibi character based on the reference: [DETAILED_PERSON_TRAITS], oversized cute round head, chubby cheeks with soft pink blush, happy smiling crescent anime eyes, [CLOTHING_AND_POSE], clear transparent laser-cut die-cut acrylic border around the character, silver metal keychain ring on top, isolated on pure solid white #FFFFFF background, minimal vector sticker art, no background, no room, no real photo"
   - Khi là Con vật: "a cute custom acrylic keychain charm of an adorable kawaii chibi cartoon pet based on the reference: [DETAILED_ANIMAL_BREED_AND_TRAITS], big glossy sparkling anime eyes, chubby fluffy cheeks with soft pink blush, exact fur markings and colors from photo, [POSE_AND_ACCESSORIES], clear transparent laser-cut die-cut acrylic border around the animal, silver metal keychain ring on top, isolated on pure solid white #FFFFFF background, minimal vector sticker art, no background, no room, no real photo"

BẮT BUỘC TRẢ VỀ JSON HỢP LỆ:
{
  "subjectCategory": "human" | "animal" | "flora" | "landmark" | "object" | "freeform",
  "replyText": "Lời tư vấn phong cách ấm áp tiếng Việt, phân tích các nét nhận diện và giải thích bản vẽ phác thảo 2D sẵn sàng chuyển giao cho xưởng in 3D...",
  "motifName": "Tên móc khoá tiếng Việt ngắn gọn, dễ thương (Ví dụ: Chibi Chàng Trai Cà Phê 2D / Bình Nước Highland Kawaii 2D)",
  "story": "Ý nghĩa nhân văn 2 câu ngắn kết nối tình yêu đại dương và dấu ấn chuyến đi...",
  "masterPrompt": "Đoạn Master Prompt bằng tiếng Anh chuẩn 2D flat keychain theo đúng cấu trúc ở trên...",
  "featuresExtracted": {
    "subject": "Tên chủ thể tiếng Việt",
    "feature1": "Chi tiết tóc / lông / cánh hoa / kiểu dáng...",
    "feature2": "Trang phục / màu sắc...",
    "feature3": "Hành động / biểu cảm kawaii / phụ kiện đi kèm..."
  },
  "recommendedColor": "${selectedColorHex}",
  "pinSpecs": {
    "diameterMm": 4.5,
    "heightMm": 4.0,
    "eyeletHoleMm": 3.0,
    "type": "snap_mount_grid"
  }
}`;

    const contents: any[] = [];

    // Thêm lịch sử hội thoại gần nhất nếu có
    if (body.history && body.history.length > 0) {
      body.history.slice(-4).forEach((msg) => {
        contents.push({
          role: msg.sender === "ai" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      });
    }

    // Phần nội dung gửi lần này
    const currentParts: any[] = [];
    let promptFull = "";
    if (body.slots && body.slots.subject) {
      promptFull += `YÊU CẦU THIẾT KẾ MÓC KHOÁ 2D THEO CÁC Ô TRỐNG KHÁCH ĐÃ ĐIỀN:
- Nhóm chủ đề: ${requestedCategory}
- Ô 1 (Chủ thể chính): "${body.slots.subject}"
- Ô 2 (Đặc điểm nhận diện 1): "${body.slots.feature1 || ""}"
- Ô 3 (Đặc điểm nhận diện 2 / Trang phục / Màu): "${body.slots.feature2 || ""}"
- Ô 4 (Điểm nhấn / Biểu cảm kawaii / Hành động): "${body.slots.feature3 || ""}"
`;
    }
    if (userPrompt) {
      promptFull += `Ý TƯỞNG CỦA KHÁCH HÀNG: "${userPrompt}".\n`;
    }
    promptFull += `- Yêu cầu kỹ thuật cốt lõi: Bắt buộc là DUY NHẤT 1 CHIẾC MÓC KHOÁ 2D ĐƠN LẺ Ở CHÍNH GIỮA (a single isolated 2D flat acrylic keychain charm). Trên đỉnh có lỗ xỏ và 1 khoen móc kim loại duy nhất. Bản vẽ 2D vector phẳng, nét viền đen dày rõ ràng bo quanh thân, mảng màu phẳng, KHÔNG RENDER 3D, KHÔNG VẼ NHIỀU ĐỒ VẬT, KHÔNG VẼ TRANH GHÉP COLLAGE, KHÔNG VẼ ÁO KHOÁC VÀ PHỤ KIỆN LƠ LỬNG PHÍA SAU, NỀN TRẮNG TINH KHIẾT #FFFFFF TUYỆT ĐỐI. DỊCH TOÀN BỘ CÁC Ô SANG TIẾNG ANH TRONG masterPrompt.`;

    currentParts.push({ text: promptFull });

    // Nếu có ảnh tải lên (Base64)
    if (imageBase64) {
      let mimeType = "image/jpeg";
      let base64Data = imageBase64;

      if (imageBase64.includes(";base64,")) {
        const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      currentParts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
      currentParts.push({
        text: "PHÂN TÍCH ẢNH NÀY: Xác định chính xác chủ thể (người, thú cưng, hoa cỏ hay đồ vật), trích xuất đặc trưng nhận dạng rõ rệt nhất, và điền vào các ô trống để tạo Master Prompt 2D flat chibi sticker có nét viền đen dày và khoen xỏ trên đỉnh.",
      });
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    // Danh sách model ưu tiên cascade (Flash-Lite có hạn mức lớn, phản hồi siêu nhanh và hỗ trợ đa phương thức Vision)
    const geminiModels = [
      "gemini-2.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-2.5-flash",
    ];

    let parsedData: any = null;

    if (apiKey) {
      for (const modelName of geminiModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              contents,
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.65,
                maxOutputTokens: 2500,
                thinkingConfig: {
                  thinkingBudget: 0,
                },
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawContent) {
              const cleaned = rawContent
                .replace(/^```json/i, "")
                .replace(/^```/i, "")
                .replace(/```$/i, "")
                .trim();
              parsedData = JSON.parse(cleaned);
              if (parsedData && parsedData.masterPrompt) {
                console.log(`[Gemini Cascade ${modelName} Success]:`, parsedData.motifName);
                break;
              }
            }
          } else {
            console.warn(`[Gemini Cascade ${modelName} Status != 200]:`, response.status);
          }
        } catch (apiErr) {
          console.warn(`[Gemini Cascade ${modelName} Fetch Exception]:`, apiErr);
        }
      }
    }

    // Nếu tất cả model Gemini đều bị lỗi kết nối hoặc quota, dùng bộ phân tích thông minh chuẩn xác
    if (!parsedData || !parsedData.masterPrompt) {
      const lower = userPrompt.toLowerCase();
      let detectedCat: CharmThemeCategory = "human";
      let motif = "Chàng Trai Chibi 2D Cá Tính";
      let slotsFallback: SlotValues = {
        subject: "chàng trai",
        feature1: "tóc đen rẽ ngôi vuốt dựng, kính gọng to",
        feature2: "áo phông đen cổ tròn",
        feature3: "cầm ly cà phê sữa đá tạo dáng",
      };

      const isPerson =
        lower.includes("chàng trai") ||
        lower.includes("cô gái") ||
        lower.includes("bạn nam") ||
        lower.includes("bạn nữ") ||
        lower.includes("em bé") ||
        lower.includes("người") ||
        lower.includes("boy") ||
        lower.includes("girl") ||
        lower.includes("selfie") ||
        Boolean(imageBase64);

      if (isPerson) {
        detectedCat = "human";
        motif = "Chibi Chàng Trai Cà Phê 2D";
        slotsFallback = {
          subject: "a cute kawaii 2D anime chibi character of this person",
          feature1: "stylish short spiky black hair with undercut, round black-framed eyeglasses, happy smiling crescent anime eyes with rosy cheeks",
          feature2: "black t-shirt and beige pants",
          feature3: "holding a mini white smartphone taking a selfie with one hand, other hand in pocket",
        };
      } else if (
        lower.includes("chó") ||
        lower.includes("mèo") ||
        lower.includes("pet") ||
        lower.includes("cún") ||
        lower.includes("thú cưng") ||
        lower.includes("gấu") ||
        lower.includes("thỏ") ||
        lower.includes("chim")
      ) {
        detectedCat = "animal";
        motif = "Chibi 2D Bé Thú Cưng";
        slotsFallback = {
          subject: "an adorable kawaii chibi cartoon pet animal",
          feature1: "fluffy fur with big glossy sparkling anime eyes and soft pink blushing cheeks",
          feature2: "exact fur markings and colors, wearing a cute bell collar",
          feature3: "cheerful playful pose with a sweet smiling expression",
        };
      } else if (
        lower.includes("hoa") ||
        lower.includes("sen") ||
        lower.includes("cúc") ||
        lower.includes("lá") ||
        lower.includes("cây")
      ) {
        detectedCat = "flora";
        motif = "Hoa Ngọc 2D Biển Xanh";
        slotsFallback = {
          subject: "a blooming lotus flower",
          feature1: "smooth rounded graphic petals",
          feature2: "vibrant ceramic enamel colors",
          feature3: "tiny golden stamens and dewdrops",
        };
      } else if (
        lower.includes("cầu") ||
        lower.includes("hải đăng") ||
        lower.includes("biển") ||
        lower.includes("núi")
      ) {
        detectedCat = "landmark";
        motif = "Biểu Tượng 2D Kỷ Niệm Nét";
        slotsFallback = {
          subject: "Da Nang Dragon Bridge",
          feature1: "stylized curved dragon body",
          feature2: "bright yellow enamel colors",
          feature3: "miniature wave splashes",
        };
      } else {
        detectedCat = "object";
        motif = "Đồ Vật 2D Kỷ Niệm";
        slotsFallback = {
          subject: "a Vietnamese coffee phin",
          feature1: "vintage aluminum phin dropping coffee",
          feature2: "retro enamel colors",
          feature3: "", // Giữ nguyên bản, không tự động thêm nét mặt
        };
      }

      const generatedMasterPrompt = buildMaster2DKeychainPrompt(
        detectedCat,
        slotsFallback
      );

      parsedData = {
        subjectCategory: detectedCat,
        replyText: `Nét 2D Keychain Agent đã tiếp nhận ý tưởng "${userPrompt}" của bạn và lắp ghép vào khung Master Template 2D chuẩn xưởng chế tác!`,
        motifName: motif,
        story: "Mỗi bản vẽ 2D là một tác phẩm khởi đầu độc bản, lưu giữ ký ức tươi đẹp và hành trình bảo vệ đại dương.",
        masterPrompt: generatedMasterPrompt,
        featuresExtracted: slotsFallback,
        recommendedColor: selectedColorHex,
        pinSpecs: {
          diameterMm: 4.5,
          heightMm: 4.0,
          eyeletHoleMm: 3.0,
          type: "snap_mount_grid",
        },
      };
    }

    // BƯỚC 2: CHUẨN HOÁ PHÔI MÓC KHOÁ 2D THỦ CÔNG
    // 1. ƯU TIÊN SỐ 1: Gọi mô hình LoRA SDXL chuyên biệt trên Hugging Face Spaces của Nét Studio
    const customAiEndpoint =
      process.env.CUSTOM_AI_API_URL ||
      "https://ducnv1792005-nets-ecommerce.hf.space";
    if (customAiEndpoint && parsedData.masterPrompt) {
      try {
        console.log(`[Hugging Face Space] Đang gửi yêu cầu tới mô hình riêng: ${customAiEndpoint}`);
        const loraImageUrl = await callLoraKeychainModel(
          customAiEndpoint,
          parsedData.masterPrompt,
          imageBase64
        );
        if (loraImageUrl) {
          console.log("[Hugging Face Space] Tạo ảnh móc khoá thành công từ mô hình LoRA SDXL!");
          parsedData.imageUrl = loraImageUrl;
          parsedData.imageProvider = "net-keychain-lora";
        }
      } catch (loraErr) {
        console.warn("[Custom LoRA Endpoint Warning]:", loraErr);
      }
    }

    // 2. Dự phòng AI tức thì: CHỈ KHI Hugging Face Space bị lỗi hoặc hết hạn mức GPU
    if (!parsedData.imageUrl && parsedData.masterPrompt) {
      console.warn("[Hugging Face Space không phản hồi hoặc hết GPU -> Kích hoạt fallback 2D]");
      try {
        const fallbackTarget =
          parsedData.featuresExtracted?.subject ||
          parsedData.motifName ||
          userPrompt ||
          "acrylic charm";
        const fallbackImg = await callFallbackKeychainImage(fallbackTarget);
        if (fallbackImg) {
          parsedData.imageUrl = fallbackImg;
          parsedData.imageProvider = "keychain-ai-fallback";
        }
      } catch (fallbackErr) {
        console.warn("[Fallback AI Warning]:", fallbackErr);
      }
    }

    // 3. Dự phòng cấp cuối: Nếu không tạo được ảnh AI, hiển thị phôi nghệ nhân (không gán ảnh gốc vào imageUrl để tránh bị nhầm ảnh chụp với bản vẽ 2D)
    if (!parsedData.imageUrl) {
      parsedData.imageUrl = null;
      parsedData.imageProvider = "artisan-badge";
    }
    if (imageBase64) {
      parsedData.referenceImageUrl = imageBase64;
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("[Free 2D Keychain Agent Exception]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Lỗi máy chủ nội bộ khi xử lý 2D Keychain Agent.",
      },
      { status: 500 }
    );
  }
}
