import { NextRequest, NextResponse } from "next/server";

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
  category?: string; // human | animal | flora | landmark_object | creative_abstract | auto
}

/**
 * 100% FREE 2D Graphic Engine:
 * Generates clean 2D flat vector die-cut illustrations with thick outlines
 * optimized for artisans to extrude and 3D print in the workshop.
 * Zero cost, no OpenAI credits required.
 */
async function generate2DKeychainImage(
  prompt: string
): Promise<{ imageUrl: string; provider: "free-2d-flux" } | null> {
  try {
    const seed = Math.floor(Math.random() * 999999);
    const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}?width=768&height=768&model=flux&nologo=true&seed=${seed}`;

    const fluxRes = await fetch(fluxUrl);
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
    console.warn("[Free 2D Engine Exception]:", fluxErr);
  }

  return null;
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

    if (!userPrompt && !imageBase64) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập ý tưởng thiết kế hoặc tải lên hình ảnh phác thảo!",
        },
        { status: 400 }
      );
    }

    const systemInstruction = `Bạn là Nghệ nhân Thiết kế Đồ họa 2D & Giám đốc Sáng tạo của Nét Studio — thương hiệu túi lưới tái chế đại dương và móc khoá độc bản tại Đà Nẵng.

MỤC TIÊU CỐT LÕI (CỰC KỲ QUAN TRỌNG):
Tạo ra BẢN VẼ PHẲNG 2D (2D FLAT VECTOR ILLUSTRATION / DIE-CUT STICKER) ĐỘC BẢN, DỄ THƯƠNG VÀ SẮC NÉT.
Bản vẽ 2D này sẽ là bản thảo kỹ thuật trực tiếp để các NGHỆ NHÂN CỦA NÉT STUDIO lấy làm khuôn mẫu, dùng phần mềm CAD đùn khối (extrude) và in ra sản phẩm móc khoá thực tế bằng MÁY IN 3D.
TUYỆT ĐỐI KHÔNG SINH HÌNH 3D RENDER ĐỔ BÓNG PHỨC TẠP! BẮT BUỘC PHẢI LÀ TRANH VẼ ĐỒ HOẠ 2D PHẲNG (FLAT 2D GRAPHIC).

QUY CHUẨN ĐỒ HOẠ 2D CHUẨN XƯỞNG CHẾ TÁC:
1. ĐƯỜNG NÉT & MẢNG MÀU:
   - Nét viền ngoài (contour line art) màu đen/nâu sẫm RÕ NÉT, DÀY DẶN và LIỀN MẠCH để nghệ nhân dễ dàng bóc tách viền cắt laser hoặc đùn khối in 3D.
   - Các mảng màu phẳng (flat color blocks) rõ ràng, màu sắc rực rỡ, phân định ranh giới dứt khoát.
   - KHÔNG đổ bóng 3D phức tạp, KHÔNG bề mặt chất liệu đất sét nổi khối, KHÔNG góc phối cảnh 3D.
   - Góc nhìn trực diện 100% thẳng góc (Direct flat front view).

2. TÍCH HỢP KHOEN MÓC KHOÁ 2D TRÊN ĐỈNH:
   - Luôn có một vòng khoen tròn 2D (hanging loop ring with a hole) được vẽ nối liền trên đỉnh đầu/thân của nhân vật để làm lỗ xỏ móc khoá.

3. PHÂN LOẠI CHỦ THỂ THÔNG MINH (Dù khách gửi ảnh hay chỉ gõ text):
   - Con người: Chibi 2D hoạt hình đáng yêu (đầu to, mắt to tròn, má hồng, giữ đặc trưng tóc, kính, trang phục).
   - Con vật / Thú cưng: Chibi thú cưng 2D múp míp, mắt to đen láy, biểu cảm ngộ nghĩnh (ôm ly cà phê, ôm cá, đeo nơ).
   - Hoa cỏ & Thiên nhiên: Hoa sen, hoa muống biển, san hô cách điệu 2D men gốm viền đậm.
   - Đồ vật & Địa danh: Cầu Rồng, ly cà phê phin, nón lá cách điệu 2D sticker kawaii.
   - Ý tưởng chỉ có text: Tự động tưởng tượng và làm giàu chi tiết thành bản vẽ 2D hoàn chỉnh.

CẤU TRÚC MASTER PROMPT TIẾNG ANH (BẮT BUỘC TUÂN THỦ KHUÔN MẪU NÀY):
"A cute 2D flat vector illustration of [SUBJECT], chibi cartoon bag charm keychain, die-cut sticker style with thick solid dark contour outline, flat bold color blocks, cel-shaded, clean 2D graphic design ready for 3D extrusion printing, with a functional 2D hanging loop ring on top with hole, direct flat front view, isolated on solid pure white background, crisp line art, no 3D rendering, no realistic shadows, high quality vector art"

BẮT BUỘC TRẢ VỀ JSON HỢP LỆ:
{
  "subjectCategory": "human" | "animal" | "flora" | "landmark_object" | "creative_abstract",
  "replyText": "Lời tư vấn phong cách ấm áp tiếng Việt, phân tích các nét nhận diện và giải thích bản vẽ phác thảo 2D sẵn sàng chuyển giao cho xưởng in 3D...",
  "motifName": "Tên móc khoá tiếng Việt ngắn gọn, dễ thương (Ví dụ: Chibi Bé Mèo Cam 2D / Sen Hồng Men Lam 2D)",
  "story": "Ý nghĩa nhân văn 2 câu ngắn kết nối tình yêu đại dương và dấu ấn chuyến đi...",
  "masterPrompt": "Đoạn Master Prompt bằng tiếng Anh chuẩn 2D flat illustration theo đúng cấu trúc ở trên...",
  "featuresExtracted": {
    "subject": "Tên chủ thể",
    "features": "Chi tiết đặc trưng 2D (nét vẽ, biểu cảm, trang phục...)",
    "colors": "Mảng màu chủ đạo",
    "accessory": "Khoen xỏ móc khoá 2D trên đỉnh"
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
    if (body.category && body.category !== "auto") {
      promptFull += `- Nhóm chủ đề: ${body.category}.\n`;
    }
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
        text: "PHÂN TÍCH ẢNH NÀY: Chuyển thể nhân vật/chủ thể thành bản vẽ 2D flat chibi sticker có nét viền đen dày, mảng màu phẳng và khoen móc 2D trên đỉnh để nghệ nhân xưởng đùn khối in 3D.",
      });
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    // Danh sách model ưu tiên (Gemini Flash-Lite có hạn mức lớn, phản hồi siêu nhanh và hỗ trợ đa phương thức Vision)
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
              console.log(`[Gemini Model ${modelName} Success]:`, parsedData.motifName);
              break; // Thành công thì dừng cascade
            }
          }
        } else {
          console.warn(`[Gemini Model ${modelName} Status != 200]:`, response.status);
        }
      } catch (apiErr) {
        console.warn(`[Gemini Model ${modelName} Fetch Exception]:`, apiErr);
      }
    }

    // Nếu tất cả model Gemini đều bị lỗi kết nối hoặc quota, dùng bộ phân tích thông minh chuẩn xác
    if (!parsedData || !parsedData.masterPrompt) {
      const lower = userPrompt.toLowerCase();
      let detectedCat = "human";
      let motif = "Chàng Trai Chibi 2D Cá Tính";
      let engSubject = "a cool handsome chibi boy with short swept black hair and modern glasses wearing black t-shirt and holding a coffee cup";

      // Kiểm tra người trước tiên: Bất kỳ dấu hiệu nào về con người hoặc có ảnh tải lên đều ưu tiên là người
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
        motif = "Chibi Chàng Trai Cà Phê";
        engSubject = "a cute 2D chibi boy with stylish short swept black hair, black-framed glasses, wearing black t-shirt and holding a coffee cup";
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
        engSubject = "an adorable chubby cute pet animal with big glossy anime eyes wearing a tiny bow";
      } else if (
        lower.includes("hoa") ||
        lower.includes("sen") ||
        lower.includes("cúc") ||
        lower.includes("lá") ||
        lower.includes("cây")
      ) {
        detectedCat = "flora";
        motif = "Hoa Ngọc 2D Biển Xanh";
        engSubject = "a blooming lotus flower with clean graphic petals and delicate outlines";
      } else {
        detectedCat = "landmark_object";
        motif = "Biểu Tượng 2D Kỷ Niệm Nét";
        engSubject = "a cute kawaii mini landmark icon inspired by Da Nang Dragon Bridge";
      }

      parsedData = {
        subjectCategory: detectedCat,
        replyText: `Nét 2D Keychain Agent đã tiếp nhận ý tưởng "${userPrompt}" của bạn và tạo bản phác thảo 2D vector sắc nét, sẵn sàng để nghệ nhân xưởng đùn khối in 3D!`,
        motifName: motif,
        story: "Mỗi bản vẽ 2D là một tác phẩm khởi đầu độc bản, lưu giữ ký ức tươi đẹp và hành trình bảo vệ đại dương.",
        masterPrompt: `A cute 2D flat vector illustration of ${engSubject}, chibi cartoon bag charm keychain, die-cut sticker style with thick solid dark contour outline, flat bold color blocks, cel-shaded, clean 2D graphic design ready for 3D extrusion printing, with a functional 2D hanging loop ring on top with hole, direct flat front view, isolated on solid pure white background, crisp line art, no 3D rendering, no realistic shadows, high quality vector art`,
        featuresExtracted: {
          subject: motif,
          features: "Bản vẽ 2D flat vector nét viền đen đậm",
          colors: selectedColorHex,
          accessory: "Khoen xỏ 2D liền khối trên đỉnh",
        },
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
    console.log("[Free 2D Keychain Agent]: Generating 2D Illustration with prompt:", parsedData.masterPrompt.slice(0, 100) + "...");
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
