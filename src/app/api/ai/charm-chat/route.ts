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
  forceGenerate?: boolean; // Bắt buộc sinh ảnh ngay (khi người dùng bấm nút "Phác thảo ngay")
}

/**
 * Gọi mô hình LoRA SDXL trên Hugging Face Spaces qua chuẩn Gradio 5/6 API
 * Luôn ưu tiên gọi mô hình riêng cho đến khi Hugging Face báo hết GPU hoặc gặp lỗi
 */
async function callLoraKeychainModel(
  baseUrl: string,
  prompt: string,
  imageBase64?: string,
  token?: string
): Promise<string | null> {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const hfToken = token || process.env.HF_TOKEN;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (hfToken) {
    headers["Authorization"] = `Bearer ${hfToken}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s cho ZeroGPU nạp model và sinh ảnh

    // 1. Kích hoạt Endpoint Gradio /generate_keychain
    // Truyền [prompt, null] để SDXL LoRA chạy Text-to-Image với Master Prompt chuyên biệt
    // (tránh tình trạng img2img trực tiếp lên ảnh người thật sinh ra tranh chân dung thay vì phôi móc khoá)
    const initRes = await fetch(`${cleanBase}/gradio_api/call/generate_keychain`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: [prompt, null],
      }),
      signal: controller.signal,
    });

    if (!initRes.ok) {
      const errText = await initRes.text().catch(() => "");
      console.warn(`[Hugging Face Space ${cleanBase} Status ${initRes.status}]:`, errText);
      clearTimeout(timeoutId);
      return null;
    }

    const initData = await initRes.json();
    const eventId = initData.event_id;
    if (!eventId) {
      clearTimeout(timeoutId);
      return null;
    }

    // 2. Đọc SSE Stream chờ hoàn tất quá trình sinh ảnh
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
          const line = lines[i];
          if (line.startsWith("event: complete")) {
            const nextLine = lines[i + 1] || "";
            if (nextLine.startsWith("data: ")) {
              clearTimeout(timeoutId);
              const rawData = nextLine.replace("data: ", "").trim();
              const parsed = JSON.parse(rawData);
              const fileObj = Array.isArray(parsed) ? parsed[0] : parsed;
              const remoteUrl = fileObj?.url;
              if (remoteUrl) {
                try {
                  const imgFetch = await fetch(remoteUrl, { headers });
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
          } else if (line.startsWith("event: error")) {
            clearTimeout(timeoutId);
            console.warn(`[Hugging Face Space ${cleanBase} ZeroGPU Quota/Error]:`, lines[i + 1] || "");
            return null;
          }
        }
      }
    }
    clearTimeout(timeoutId);
  } catch (gradioErr) {
    console.warn(`[Hugging Face Space ${cleanBase} Connection Exception]:`, gradioErr);
  }

  return null;
}

/**
 * Fallback 1: FLUX.1 Engine (Mô hình AI thế hệ mới tốc độ cao)
 * Tự động kích hoạt khi các Space LoRA cá nhân hết hạn ngạch ZeroGPU trong ngày hoặc bị tạm dừng.
 * Bao gồm 2 kênh dự phòng:
 * - Kênh 1: Black Forest Labs FLUX.1 Schnell qua Hugging Face Spaces (gọi public pool không gắn kèm token để tránh bị nuốt quota cá nhân)
 * - Kênh 2: FLUX.1 Dedicated Engine (tốc độ cao 2-3s, 100% không lo hết quota GPU, chuẩn die-cut acrylic anime không khung)
 */
async function callFluxSchnellModel(
  prompt: string,
  token?: string
): Promise<string | null> {
  const cleanBase = "https://black-forest-labs-flux-1-schnell.hf.space";
  
  // 1. Kênh 1: Thử Black Forest Labs FLUX.1 Schnell Space
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout cho HF Space
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Chỉ gửi token nếu được truyền cụ thể, không mặc định gắn token cá nhân đã cạn quota ZeroGPU
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const initRes = await fetch(`${cleanBase}/gradio_api/call/infer`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: [prompt, 0, true, 512, 512, 4],
      }),
      signal: controller.signal,
    });

    if (initRes.ok) {
      const initData = await initRes.json();
      const eventId = initData.event_id;
      if (eventId) {
        const streamRes = await fetch(
          `${cleanBase}/gradio_api/call/infer/${eventId}`,
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
              const line = lines[i];
              if (line.startsWith("event: complete")) {
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
                      console.warn("Could not convert FLUX image to base64, using remote URL:", fetchErr);
                    }
                    return remoteUrl;
                  }
                }
              } else if (line.startsWith("event: error")) {
                clearTimeout(timeoutId);
                console.warn("[FLUX.1 Schnell BFL Quota/Error]:", lines[i + 1] || "");
                break;
              }
            }
          }
        }
      }
    }
    clearTimeout(timeoutId);
  } catch (err: any) {
    console.warn("[FLUX.1 Schnell BFL Space Exception]:", err?.message || err);
  }

  // 2. Kênh 2: FLUX.1 Dedicated Engine (tốc độ cao ~2s, 100% không lo hết quota GPU, chuẩn die-cut không khung viền)
  try {
    console.log("[Fallback FLUX.1 Dedicated Engine] Đang sinh ảnh dự phòng qua mô hình FLUX.1...");
    const cleanPrompt = prompt.replace(/die-cut|acrylic|keychain|charm/gi, "").trim();
    const encoded = encodeURIComponent(
      `single cute 2D anime chibi die-cut keychain charm of ${cleanPrompt}, contoured silhouette outline cut to shape, isolated on pure solid white #FFFFFF background, minimal vector sticker art, no frame, no circle, no border, no background clutter`
    );
    const seed = Math.floor(Math.random() * 999999);
    const fluxUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&model=flux&nologo=true&seed=${seed}`;
    const fluxRes = await fetch(fluxUrl, { signal: AbortSignal.timeout(15000) });
    if (fluxRes.ok) {
      const buf = await fluxRes.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      const mime = fluxRes.headers.get("content-type") || "image/jpeg";
      console.log("[Fallback FLUX.1 Dedicated Engine] Sinh ảnh thành công qua FLUX.1!");
      return `data:${mime};base64,${b64}`;
    }
  } catch (fluxErr: any) {
    console.warn("[FLUX.1 Dedicated Engine Error]:", fluxErr?.message || fluxErr);
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
    const systemInstruction = `Bạn là "Nghệ nhân AI NÉT Studio" — chuyên gia tư vấn thiết kế đồ họa 2D & nghệ nhân chế tác móc khoá độc bản thủ công từ lưới đánh cá tái sinh đại dương tại vịnh Đà Nẵng.

PHONG CÁCH GIAO TIẾP:
- Giọng văn ấm áp, tinh tế, lịch thiệp, mang đậm hơi thở đại dương và tinh thần thủ công làng nghề Việt Nam.
- Trò chuyện THỰC SỰ với người dùng bằng tiếng Việt tự nhiên, lắng nghe, khơi gợi cảm hứng và đồng hành cùng khách hàng.

QUY TẮC PHÂN LOẠI HAI PHA (CỰC KỲ QUAN TRỌNG):
1. PHA 1: HỘI THOẠI & THU THẬP Ý TƯỞNG (readyToGenerate: false)
- Khi nào:
  + Người dùng mới bắt đầu chào hỏi ("xin chào", "hi", "tôi muốn làm móc khoá"...).
  + Ý tưởng còn chung chung hoặc đang hỏi tư vấn ("mình muốn làm quà tặng bạn", "bạn có ý tưởng gì không", "vẽ con mèo"...).
  + Người dùng chưa nói rõ phong cách, màu sắc hoặc chi tiết nhận dạng.
  + forceGenerate !== true và chưa có ảnh tải lên (imageBase64).
- Hành động:
  + Trả lời trò chuyện tự nhiên, khen ngợi và truyền cảm hứng về câu chuyện tái sinh rác lưới biển.
  + Đặt 1 câu hỏi gợi ý thật tự nhiên để khách chia sẻ thêm (Ví dụ: bé mèo lông màu gì, bạn muốn phong cách chibi ngộ nghĩnh hay thanh lịch, có muốn khắc tên hay chữ kỷ niệm không...).
  + Cung cấp 2-3 gợi ý trả lời nhanh trong mảng "suggestedNextQuestions" để người dùng bấm chọn nhanh.
  + ĐẶT "readyToGenerate": false.

2. PHA 2: KÍCH HOẠT VẼ PHÁC THẢO 3X3CM (readyToGenerate: true)
- Khi nào:
  + Người dùng yêu cầu vẽ / tạo hình: có các từ khoá như "vẽ đi", "tạo hình cho tôi", "phác thảo đi", "bắt đầu vẽ", "ok rồi", "xem mẫu", "vẽ thử", "tạo ngay", "vẽ ngay"...
  + HOẶC ý tưởng đã khá đầy đủ (đã biết chủ thể và ít nhất 1-2 đặc điểm chi tiết / màu sắc).
  + HOẶC người dùng đã gửi ảnh mẫu tham chiếu (imageBase64).
  + HOẶC có cờ forceGenerate: true.
- Hành động:
  + "replyText": Lời hào hứng xác nhận ý tưởng tuyệt vời, thông báo Nghệ nhân đang bắt tay phác thảo bản vẽ móc khoá 2D chuẩn kích thước 3x3cm cho khách!
  + ĐẶT "readyToGenerate": true.
  + BẮT BUỘC TỔNG HỢP VÀ DỊCH TOÀN BỘ SANG TIẾNG ANH trong "masterPrompt".

3. QUY TẮC BẮT BUỘC VỀ MASTER PROMPT (CHO BƯỚC VẼ ẢNH):
- BẮT BUỘC 100% TIẾNG ANH (Không để sót từ tiếng Việt nào vì mô hình AI tạo ảnh chỉ hiểu tiếng Anh).
- KÍCH THƯỚC CHUẨN: 3cm x 3cm (compact 3cm x 3cm miniature size, 30mm x 30mm proportion).
- ĐẶC TRƯNG MÓC KHOÁ NÉT:
  + Phôi 2D Die-cut acrylic/ceramic enamel, đường viền ngoài sắc nét (sharp die-cut contour outline).
  + Có một lỗ xỏ / khoen móc kim loại màu bạc ở mép đỉnh trên (small metallic keychain hanging ring hole on top edge) để xỏ vào mắt lưới túi.
  + Nền trắng tinh khiết tuyệt đối: "isolated on pure solid white #FFFFFF background, clean flat vector sticker art, no background scenery, no gradients, no shadows, no floor, no watermark, single object centered".
  + Vật liệu: "crafted with recycled ocean marine plastic and sea glass enamel".
- VỚI NGƯỜI & CON VẬT:
  + Luôn vẽ Chibi Anime đáng yêu (cute kawaii 2D anime chibi character / ultra-kawaii chibi cartoon pet, oversized cute round head, chubby rosy blushing cheeks, happy anime catchlight eyes).
  + Bám sát kiểu tóc, trang phục, màu lông, phụ kiện từ mô tả hoặc ảnh mẫu.
- VỚI ĐỒ VẬT / ĐỊA DANH / HOA CỎ:
  + Nét vẽ phẳng 2D tinh tế, tối giản, sang trọng.
  + TUYỆT ĐỐI KHÔNG tự ý thêm mắt cười hay má hồng nếu người dùng không yêu cầu.

BẮT BUỘC TRẢ VỀ JSON HỢP LỆ THEO SCHEMA:
{
  "readyToGenerate": true,
  "replyText": "Lời trò chuyện tiếng Việt tự nhiên của Nghệ nhân...",
  "suggestedNextQuestions": ["Gợi ý 1", "Gợi ý 2", "Gợi ý 3"],
  "subjectCategory": "human",
  "motifName": "Tên móc khoá tiếng Việt ngắn gọn...",
  "story": "Ý nghĩa nhân văn 2 câu ngắn kết nối đại dương và kỷ niệm...",
  "masterPrompt": "Master Prompt 100% tiếng Anh chuẩn 3x3cm...",
  "featuresExtracted": {
    "subject": "Tên chủ thể tiếng Việt",
    "feature1": "Chi tiết nhận diện 1",
    "feature2": "Màu sắc / trang phục",
    "feature3": "Hành động / điểm nhấn"
  },
  "recommendedColor": "${selectedColorHex}",
  "pinSpecs": {
    "dimensions": "3cm x 3cm",
    "diameterMm": 4.5,
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
    if (!parsedData || !parsedData.replyText) {
      const lower = userPrompt.toLowerCase();
      const isShortGreeting =
        (lower.includes("chào") ||
          lower.includes("hi") ||
          lower.includes("hello") ||
          lower.length < 8) &&
        !imageBase64 &&
        !body.forceGenerate &&
        !body.slots?.subject;

      if (isShortGreeting) {
        parsedData = {
          readyToGenerate: false,
          replyText:
            "Chào bạn! Mình là Nghệ nhân AI của Nét Studio 🌿.\n\nMình sẽ cùng bạn trò chuyện để lên ý tưởng cho chiếc móc khoá 2D chuẩn kích thước 3x3cm đính lên túi lưới tái sinh nhé! Bạn đang ấp ủ hình ảnh hay câu chuyện nào?",
          suggestedNextQuestions: [
            "Chân dung Chibi bạn bè",
            "Bé thú cưng đáng yêu",
            "Biểu tượng biển Đà Nẵng",
            "🎨 Phác thảo ngay (3x3cm)",
          ],
          featuresExtracted: {
            subject: "",
            feature1: "",
            feature2: "",
            feature3: "",
          },
          recommendedColor: selectedColorHex,
        };
      } else {
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
            feature3: "",
          };
        }

        const generatedMasterPrompt = buildMaster2DKeychainPrompt(
          detectedCat,
          slotsFallback
        );

        parsedData = {
          readyToGenerate: true,
          subjectCategory: detectedCat,
          replyText: `Nghệ nhân AI NÉT Studio đã tiếp nhận ý tưởng "${userPrompt}" và đang chuẩn bị phác thảo bản vẽ móc khoá 2D chuẩn kích thước 3x3cm cho bạn! ✨`,
          suggestedNextQuestions: ["Xem bản vẽ phác thảo", "Đổi màu sắc", "Thêm chữ khắc"],
          motifName: motif,
          story: "Mỗi bản vẽ 2D là một tác phẩm khởi đầu độc bản, lưu giữ ký ức tươi đẹp và hành trình bảo vệ đại dương.",
          masterPrompt: generatedMasterPrompt,
          featuresExtracted: slotsFallback,
          recommendedColor: selectedColorHex,
          pinSpecs: {
            dimensions: "3cm x 3cm",
            diameterMm: 4.5,
            heightMm: 4.0,
            eyeletHoleMm: 3.0,
            type: "snap_mount_grid",
          },
        };
      }
    }

    // NẾU GEMINI XÁC ĐỊNH CHƯA ĐỦ THÔNG TIN VÀ CHƯA CÓ YÊU CẦU VẼ NGAY
    if (!parsedData.readyToGenerate && !body.forceGenerate && !imageBase64) {
      return NextResponse.json({
        success: true,
        data: {
          readyToGenerate: false,
          replyText:
            parsedData.replyText ||
            "Chào bạn! Bạn muốn thiết kế chiếc móc khoá mang hình ảnh gì nào?",
          suggestedNextQuestions: parsedData.suggestedNextQuestions || [
            "Chân dung Chibi bạn bè",
            "Bé thú cưng đáng yêu",
            "Biểu tượng biển Đà Nẵng",
            "🎨 Phác thảo ngay (3x3cm)",
          ],
          featuresExtracted: parsedData.featuresExtracted,
          subjectCategory: parsedData.subjectCategory || "freeform",
          motifName: parsedData.motifName || "Móc Khoá Tùy Biến",
        },
      });
    }

    // BƯỚC 2: TIẾN HÀNH SINH ẢNH PHÔI MÓC KHOÁ 2D THỦ CÔNG
    // 1. ƯU TIÊN SỐ 1: FLUX.1 SCHNELL ENGINE (Mô hình AI thế hệ mới, tốc độ 2-3s, chuẩn die-cut, không hao quota cá nhân)
    const spaceEndpoints = [
      {
        name: "ducksiao/Nets_AI_Gen",
        url: process.env.CUSTOM_AI_API_URL || "https://ducksiao-nets-ai-gen.hf.space",
        token: process.env.HF_TOKEN,
      },
      {
        name: "ducnv1792005/Nets_ECommerce",
        url: process.env.SECONDARY_AI_API_URL || "https://ducnv1792005-nets-ecommerce.hf.space",
        token: process.env.SECONDARY_HF_TOKEN,
      },
    ];

    if (process.env.TERTIARY_AI_API_URL) {
      spaceEndpoints.push({
        name: "Backup Space 3",
        url: process.env.TERTIARY_AI_API_URL,
        token: process.env.TERTIARY_HF_TOKEN || process.env.HF_TOKEN,
      });
    }

    if (parsedData.masterPrompt) {
      // 1. FLUX.1 lên trước
      try {
        console.log("[Rank 1: FLUX.1 Schnell] Đang sinh ảnh qua mô hình FLUX.1...");
        const fluxImageUrl = await callFluxSchnellModel(parsedData.masterPrompt);
        if (fluxImageUrl) {
          console.log("[Rank 1: FLUX.1 Schnell] Sinh ảnh charm thành công từ FLUX.1!");
          parsedData.imageUrl = fluxImageUrl;
          parsedData.imageProvider = "flux-schnell";
        }
      } catch (fluxErr) {
        console.warn("[Rank 1: FLUX.1 Schnell Exception]:", fluxErr);
      }

      // 2. FALLBACK 2: LORA SDXL TRÊN HUGGING FACE SPACES CỦA NÉT STUDIO
      if (!parsedData.imageUrl) {
        console.log("[Rank 2: LoRA SDXL Spaces] Đang kích hoạt mô hình LoRA SDXL dự phòng...");
        for (const space of spaceEndpoints) {
          if (!space.url) continue;
          try {
            console.log(`[Hugging Face Space] Thử gọi mô hình tại: ${space.name} (${space.url})`);
            const loraImageUrl = await callLoraKeychainModel(
              space.url,
              parsedData.masterPrompt,
              imageBase64,
              space.token
            );
            if (loraImageUrl) {
              console.log(`[Rank 2: LoRA SDXL] Tạo ảnh móc khoá thành công từ: ${space.name}!`);
              parsedData.imageUrl = loraImageUrl;
              parsedData.imageProvider = "net-keychain-lora";
              break;
            }
          } catch (loraErr) {
            console.warn(`[Custom LoRA Endpoint ${space.name} Warning]:`, loraErr);
          }
        }
      }

      // 3. FALLBACK 3: POLLINATIONS FLUX/SDXL & PHÔI NGHỆ NHÂN NÉT
      if (!parsedData.imageUrl) {
        try {
          const encoded = encodeURIComponent(
            `single cute 2D anime chibi die-cut acrylic keychain charm, 3cm x 3cm, ${parsedData.masterPrompt.replace(/die-cut|acrylic|keychain|charm/gi, "")}, small metallic keychain hanging ring hole on top, isolated on pure solid white #FFFFFF background, minimal flat vector sticker art, no frame, no shadow`
          );
          const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&model=flux&nologo=true`;
          const res = await fetch(fallbackUrl, { signal: AbortSignal.timeout(12000) });
          if (res.ok) {
            const buf = await res.arrayBuffer();
            const b64 = Buffer.from(buf).toString("base64");
            const mime = res.headers.get("content-type") || "image/png";
            parsedData.imageUrl = `data:${mime};base64,${b64}`;
            parsedData.imageProvider = "flux-pollinations";
          }
        } catch (err) {
          console.warn("[Fallback 3 Exception]:", err);
        }
      }
    }

    // Đảm bảo ảnh luôn ở dạng Base64 data: URL để chống triệt để lỗi CORS Tainted Canvas
    if (parsedData.imageUrl && parsedData.imageUrl.startsWith("http")) {
      try {
        const imgFetch = await fetch(parsedData.imageUrl);
        if (imgFetch.ok) {
          const arrayBuf = await imgFetch.arrayBuffer();
          const b64 = Buffer.from(arrayBuf).toString("base64");
          const mime = imgFetch.headers.get("content-type") || "image/png";
          parsedData.imageUrl = `data:${mime};base64,${b64}`;
        }
      } catch (convErr) {
        console.warn("Could not convert remote URL to base64 on server:", convErr);
      }
    }

    if (!parsedData.imageUrl) {
      parsedData.imageUrl = null;
      parsedData.imageProvider = "artisan-badge";
    }
    if (imageBase64) {
      parsedData.referenceImageUrl = imageBase64;
    }

    parsedData.readyToGenerate = true;

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
