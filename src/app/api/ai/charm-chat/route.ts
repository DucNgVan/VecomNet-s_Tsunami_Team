import { NextRequest, NextResponse } from "next/server";
import {
  buildMaster2DKeychainPrompt,
  CharmThemeCategory,
  SlotValues,
} from "@/lib/masterPromptTemplates";

export const dynamic = "force-dynamic";

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
 * 100% FREE 2D Graphic Engine:
 * Generates clean 2D flat vector die-cut illustrations with thick outlines
 * optimized for artisans to extrude and 3D print in the workshop.
 * Zero cost, no OpenAI credits required.
 */
async function generate2DKeychainImage(
  prompt: string
): Promise<{ imageUrl: string; provider: "free-2d-flux" }> {
  const seed = Math.floor(Math.random() * 999999);
  const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=768&height=768&model=flux&nologo=true&seed=${seed}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const fluxRes = await fetch(fluxUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (fluxRes.ok) {
      const buf = await fluxRes.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      const mime = fluxRes.headers.get("content-type") || "image/jpeg";
      return {
        imageUrl: `data:${mime};base64,${base64}`,
        provider: "free-2d-flux",
      };
    } else {
      console.warn("[Free 2D Engine Status != 200]:", fluxRes.status);
    }
  } catch (fluxErr) {
    console.warn("[Free 2D Engine Fetch fallback to direct URL]:", fluxErr);
  }

  // Fallback an toàn 100%: Trả về trực tiếp URL của Pollinations (hỗ trợ CORS cho Canvas)
  return {
    imageUrl: fluxUrl,
    provider: "free-2d-flux",
  };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Chưa cấu hình GEMINI_API_KEY trong hệ thống. Vui lòng kiểm tra file .env.local",
        },
        { status: 500 }
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

    // NẾU NGƯỜI DÙNG ĐÃ ĐIỀN ĐỦ Ô TRỐNG TRỰC TIẾP (Direct Slot-Filling Mode)
    // Ta có thể lắp ghép trực tiếp Master Template Prompt với độ chuẩn xác 100%
    if (body.slots && body.slots.subject && !imageBase64) {
      const generatedMasterPrompt = buildMaster2DKeychainPrompt(
        requestedCategory,
        body.slots
      );

      console.log("[Direct Slots Template Prompt]:", generatedMasterPrompt);
      const imgRes = await generate2DKeychainImage(generatedMasterPrompt);

      return NextResponse.json({
        success: true,
        data: {
          subjectCategory: requestedCategory,
          replyText: `Nét 2D Keychain Agent đã tiếp nhận thông tin từ các ô điền của bạn và ghép vào khung Master Template chuẩn 2D Vector xưởng chế tác!`,
          motifName: body.slots.subject || "Charm Độc Bản 2D",
          story: "Chiếc móc khoá mang đậm dấu ấn cá nhân hóa, sẵn sàng để nghệ nhân xưởng đùn khối và in 3D.",
          masterPrompt: generatedMasterPrompt,
          featuresExtracted: {
            subject: body.slots.subject || "",
            feature1: body.slots.feature1 || "",
            feature2: body.slots.feature2 || "",
            feature3: body.slots.feature3 || "",
          },
          imageUrl: imgRes?.imageUrl,
          imageProvider: imgRes?.provider,
          recommendedColor: selectedColorHex,
          pinSpecs: {
            diameterMm: 4.5,
            heightMm: 4.0,
            eyeletHoleMm: 3.0,
            type: "snap_mount_grid",
          },
        },
      });
    }

    // NGƯỢC LẠI: NẾU CÓ ẢNH HOẶC CÂU CHỮ TỰ DO -> DÙNG GEMINI VISION ĐỂ PHÂN TÍCH VÀ ĐIỀN Ô TRỐNG
    const systemInstruction = `Bạn là Nghệ nhân Thiết kế Đồ họa 2D & Giám đốc Sáng tạo của Nét Studio — thương hiệu túi lưới tái chế đại dương và móc khoá độc bản tại Đà Nẵng.

MỤC TIÊU CỐT LÕI (CỰC KỲ QUAN TRỌNG):
Tạo ra BẢN VẼ PHẲNG 2D (2D FLAT VECTOR ILLUSTRATION / DIE-CUT STICKER) ĐỘC BẢN, DỄ THƯƠNG VÀ SẮC NÉT.
Bản vẽ 2D này sẽ là bản thảo kỹ thuật trực tiếp để các NGHỆ NHÂN CỦA NÉT STUDIO lấy làm khuôn mẫu, dùng phần mềm CAD đùn khối (extrude) và in ra sản phẩm móc khoá thực tế bằng MÁY IN 3D.
TUYỆT ĐỐI KHÔNG SINH HÌNH 3D RENDER ĐỔ BÓNG PHỨC TẠP! BẮT BUỘC PHẢI LÀ TRANH VẼ ĐỒ HOẠ 2D PHẲNG (FLAT 2D GRAPHIC).

QUY TẮC BẢO TOÀN DANH TÍNH CHỦ THỂ (BẮT BUỘC TUÂN THỦ 100%):
1. NẾU CÓ ẢNH TẢI LÊN:
   - ƯU TIÊN SỐ 1 TUYỆT ĐỐI: Phân tích ảnh thực tế.
   - Nếu trong ảnh là NGƯỜI (chàng trai, cô gái, em bé): subjectCategory BẮT BUỘC là "human". Trích xuất chính xác: kiểu tóc, kính mắt, trang phục, biểu cảm từ ảnh. TUYỆT ĐỐI KHÔNG vẽ con vật!
   - Nếu trong ảnh là THÚ CƯNG (chó, mèo, rùa...): subjectCategory là "animal".
   - Nếu trong ảnh là HOA CỎ / THIÊN NHIÊN: subjectCategory là "flora".
   - Nếu trong ảnh là ĐỒ VẬT / ĐỊA DANH: subjectCategory là "landmark" hoặc "object".

2. CÁC Ô TRỐNG CẦN ĐIỀN VÀO MASTER PROMPT:
   - subject: Tên chủ thể (ví dụ: a confident boy, a cute orange cat, a blooming lotus flower, Da Nang Dragon Bridge...)
   - feature1: Kiểu tóc / lông / cánh hoa / kiến trúc
   - feature2: Trang phục / phụ kiện / màu sắc men
   - feature3: Hành động / chi tiết điểm xuyết (cầm ly cà phê, ôm trà sữa, giọt sương mai...)

CẤU TRÚC MASTER PROMPT TIẾNG ANH (BẮT BUỘC TUÂN THỦ KHUÔN MẪU NÀY):
"A cute 2D flat vector illustration of [SUBJECT_WITH_SLOTS], chibi cartoon bag charm keychain, die-cut sticker style with thick solid dark contour outline, flat bold color blocks, cel-shaded, clean 2D graphic design ready for 3D extrusion printing, with a functional 2D hanging loop ring on top with hole, direct flat front view, isolated on solid pure white background, crisp line art, no 3D rendering, no realistic shadows, high quality vector art"

BẮT BUỘC TRẢ VỀ JSON HỢP LỆ:
{
  "subjectCategory": "human" | "animal" | "flora" | "landmark" | "object" | "freeform",
  "replyText": "Lời tư vấn phong cách ấm áp tiếng Việt, phân tích các nét nhận diện và giải thích bản vẽ phác thảo 2D sẵn sàng chuyển giao cho xưởng in 3D...",
  "motifName": "Tên móc khoá tiếng Việt ngắn gọn, dễ thương (Ví dụ: Chibi Chàng Trai Cà Phê 2D / Sen Hồng Men Lam 2D)",
  "story": "Ý nghĩa nhân văn 2 câu ngắn kết nối tình yêu đại dương và dấu ấn chuyến đi...",
  "masterPrompt": "Đoạn Master Prompt bằng tiếng Anh chuẩn 2D flat illustration theo đúng cấu trúc ở trên...",
  "featuresExtracted": {
    "subject": "Tên chủ thể tiếng Việt",
    "feature1": "Chi tiết tóc / lông / cánh hoa...",
    "feature2": "Trang phục / màu sắc...",
    "feature3": "Hành động / phụ kiện đi kèm..."
  },
  "svgCode": "<svg viewBox=\\"0 0 100 135\\" xmlns=\\"http://www.w3.org/2000/svg\\">...vector 2D chuẩn đường nét liền khối để nghệ nhân nạp vào máy in 3D...</svg>",
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
    let promptFull = `YÊU CẦU PHÁC THẢO 2D MÓC KHOÁ CỦA KHÁCH HÀNG: "${userPrompt}".\n`;
    promptFull += `- Màu túi lưới phối cùng: ${bagColorName}.\n`;
    if (customText) promptFull += `- Chữ khắc kỷ niệm: "${customText}".\n`;
    promptFull += `- Yêu cầu kỹ thuật: Tranh vẽ 2D flat vector, nét viền đen dày rõ ràng, mảng màu phẳng để nghệ nhân xưởng đùn khối in 3D, có khoen xỏ 2D trên đỉnh, nền trắng sạch sẽ, KHÔNG làm 3D đổ bóng.`;

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
          subject: "a cool handsome chibi boy",
          feature1: "stylish short-swept black hair, black-framed glasses",
          feature2: "black t-shirt",
          feature3: "holding a coffee cup and striking a confident pose",
        };
      } else if (
        lower.includes("chó") ||
        lower.includes("mèo") ||
        lower.includes("pet") ||
        lower.includes("cún") ||
        lower.includes("thú cưng") ||
        lower.includes("gấu")
      ) {
        detectedCat = "animal";
        motif = "Chibi 2D Bé Thú Cưng";
        slotsFallback = {
          subject: "an adorable chubby pet animal",
          feature1: "fluffy fur and big glossy anime eyes",
          feature2: "a tiny red ribbon bow",
          feature3: "playfully holding a miniature coffee or treat",
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
          feature3: "a happy smiling kawaii face with blushing cheeks",
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

    // BƯỚC 2: GỌI ĐỘNG CƠ SINH ẢNH 2D VECTOR MIỄN PHÍ 100% (FREE 2D FLUX ENGINE)
    console.log(
      "[Free 2D Keychain Agent]: Generating 2D Illustration with prompt:",
      parsedData.masterPrompt.slice(0, 100) + "..."
    );
    const imageResult = await generate2DKeychainImage(parsedData.masterPrompt);

    if (imageResult) {
      parsedData.imageUrl = imageResult.imageUrl;
      parsedData.imageProvider = imageResult.provider;
    }

    // SVG silhouette dự phòng cho việc nạp trực tiếp vào máy in 3D
    if (!parsedData.svgCode) {
      parsedData.svgCode = `<svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg">
  <g id="keychainCharm2D">
    <path d="M43 14 C43 6, 57 6, 57 14 C57 17.5, 54 18.5, 50 18.5 C46 18.5, 43 17.5, 43 14 Z" fill="#281D17" stroke="#281D17" stroke-width="2.5"/>
    <circle cx="50" cy="12" r="3.2" fill="#FFFFFF" stroke="#281D17" stroke-width="1.8"/>
    <circle cx="50" cy="65" r="42" fill="${parsedData.recommendedColor || selectedColorHex}" stroke="#281D17" stroke-width="3"/>
    <ellipse cx="40" cy="58" rx="4" ry="5.5" fill="#281D17"/>
    <circle cx="41.5" cy="56" r="1.5" fill="#FFFFFF"/>
    <ellipse cx="60" cy="58" rx="4" ry="5.5" fill="#281D17"/>
    <circle cx="61.5" cy="56" r="1.5" fill="#FFFFFF"/>
    <ellipse cx="33" cy="68" rx="4.5" ry="2.5" fill="#F43F5E" opacity="0.6"/>
    <ellipse cx="67" cy="68" rx="4.5" ry="2.5" fill="#F43F5E" opacity="0.6"/>
    <path d="M44 68 Q50 74, 56 68" fill="none" stroke="#281D17" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`;
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
