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
  // Sử dụng endpoint chuẩn tối ưu của Pollinations với nologo và seed ngẫu nhiên
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=768&height=768&nologo=true&seed=${seed}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const fluxRes = await fetch(pollUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (fluxRes.ok) {
      const buf = await fluxRes.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      const mime = fluxRes.headers.get("content-type") || "image/jpeg";
      // Đảm bảo không trả về file JSON lỗi dưới dạng base64
      if (mime.includes("image")) {
        return {
          imageUrl: `data:${mime};base64,${base64}`,
          provider: "free-2d-flux",
        };
      }
    } else {
      console.warn("[Free 2D Engine Status != 200]:", fluxRes.status);
    }
  } catch (fluxErr) {
    console.warn("[Free 2D Engine Fetch fallback to direct URL]:", fluxErr);
  }

  // Fallback an toàn 100%: Trả về trực tiếp URL của Pollinations (hỗ trợ CORS cho Canvas)
  return {
    imageUrl: pollUrl,
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
5. HÌNH DÁNG MÓC KHOÁ: Phải có khoen xỏ tròn và vòng móc kim loại trên đỉnh (top hanging loop with metal keyring). Viền ngoài bo die-cut sắc nét (bold dark die-cut outline), mảng màu phẳng (flat color blocks), phong cách 2D vector / sticker chibi.
6. BẮT BUỘC DỊCH TOÀN BỘ CÁC Ô ĐIỀN CỦA KHÁCH TỪ TIẾNG VIỆT SANG TIẾNG ANH ĐỒ HOẠ CHUẨN XÁC TRONG masterPrompt (Tuyệt đối không để nguyên cụm từ tiếng Việt trong masterPrompt vì model sinh ảnh chỉ hiểu tiếng Anh).
7. ĐỐI VỚI VẬT THỂ (OBJECT), ĐỊA DANH (LANDMARK), HOA CỎ (FLORA) HOẶC KHI KHÁCH NÓI "KHÔNG" / BỎ QUA:
   - TUYỆT ĐỐI KHÔNG TỰ Ý THÊM NÉT MẶT, MẮT CƯỜI HAY MÁ HỒNG (NO smiling eyes, NO blushing cheeks, NO anime cartoon face on inanimate objects).
   - Chỉ thêm biểu cảm khuôn mặt nếu khách ĐÍCH DANH yêu cầu "có mặt cười", "mặt chibi".
   - Nếu khách chọn "không", "bỏ qua", "không có", hoặc để trống feature3, hãy giữ nguyên dáng vẻ chân thực, tinh tế, tối giản của vật thể!

QUY TẮC BẢO TOÀN DANH TÍNH CHỦ THỂ (BẮT BUỘC TUÂN THỦ 100%):
1. NẾU CÓ ẢNH TẢI LÊN:
   - ƯU TIÊN SỐ 1 TUYỆT ĐỐI: Phân tích ảnh thực tế.
   - Nếu trong ảnh là NGƯỜI (chàng trai, cô gái, em bé): subjectCategory BẮT BUỘC là "human". Trích xuất chính xác: kiểu tóc, kính mắt, trang phục, biểu cảm từ ảnh. TUYỆT ĐỐI KHÔNG vẽ con vật!
   - Nếu trong ảnh là THÚ CƯNG (chó, mèo, rùa...): subjectCategory là "animal".
   - Nếu trong ảnh là HOA CỎ / THIÊN NHIÊN: subjectCategory là "flora".
   - Nếu trong ảnh là ĐỒ VẬT / ĐỊA DANH: subjectCategory là "landmark" hoặc "object".

2. CÁC Ô TRỐNG CẦN ĐIỀN VÀO MASTER PROMPT:
   - subject: Tên chủ thể đã dịch sang tiếng Anh (ví dụ: a cute cream coffee tumbler with highland logo, a confident chibi boy, a cute orange cat, a blooming lotus flower, Da Nang Dragon Bridge...)
   - feature1: Kiểu dáng / kiểu tóc / lông / cánh hoa / kiến trúc
   - feature2: Trang phục / phụ kiện / màu sắc men gốm phẳng
   - feature3: Hành động / chi tiết điểm xuyết (đôi mắt cười kawaii, cầm ly cà phê, ôm trà sữa, giọt sương mai...)

CẤU TRÚC MASTER PROMPT TIẾNG ANH (BẮT BUỘC DỊCH TOÀN BỘ SANG TIẾNG ANH, TUYỆT ĐỐI KHÔNG ĐỂ TIẾNG VIỆT):
"A cute 2D flat die-cut acrylic keychain charm of [TRANSLATED_ENGLISH_SUBJECT_AND_DETAILS], flat vector art, thick bold clean black die-cut contour outline, vibrant flat color blocks, featuring an integrated round hanging loop hole with attached silver metal key ring on top, direct flat front view, 2D flat sticker illustration, isolated on pure solid white #FFFFFF background, clean vector lines, no 3D rendering, no realistic shadows, no metallic reflections, no background gradient, high quality vector art"

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
    promptFull += `- Màu túi lưới phối cùng: ${bagColorName}.\n`;
    if (customText) promptFull += `- Chữ khắc kỷ niệm: "${customText}".\n`;
    promptFull += `- Yêu cầu kỹ thuật cốt lõi: Bắt buộc là MÓC KHOÁ 2D (2D flat acrylic / die-cut keychain charm). Trên đỉnh có lỗ xỏ và khoen móc kim loại. Bản vẽ 2D vector phẳng, nét viền đen dày rõ ràng, mảng màu phẳng, KHÔNG RENDER 3D, KHÔNG BÓNG KIM LOẠI PHẢN CHIẾU, NỀN TRẮNG TINH KHIẾT #FFFFFF TUYỆT ĐỐI. DỊCH TOÀN BỘ CÁC Ô SANG TIẾNG ANH TRONG masterPrompt.`;
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
