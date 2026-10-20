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
 * Image Generation Engine with automatic fallback:
 * 1. Checks OpenAI API Key (gpt-image-1 / dall-e-3)
 * 2. Falls back seamlessly to High-Resolution 3D Flux Engine
 */
async function generateKeychainImage(
  prompt: string
): Promise<{ imageUrl: string; provider: "openai" | "flux-3d" } | null> {
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Try OpenAI if configured
  if (openaiKey && openaiKey.trim().startsWith("sk-")) {
    try {
      const oaiRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      if (oaiRes.ok) {
        const oaiData = await oaiRes.json();
        const oaiUrl = oaiData.data?.[0]?.url;
        if (oaiUrl) {
          // Fetch image buffer to avoid expired temporary URLs and CORS
          const imgFetch = await fetch(oaiUrl);
          if (imgFetch.ok) {
            const buf = await imgFetch.arrayBuffer();
            const base64 = Buffer.from(buf).toString("base64");
            const mime = imgFetch.headers.get("content-type") || "image/png";
            return {
              imageUrl: `data:${mime};base64,${base64}`,
              provider: "openai",
            };
          }
          return { imageUrl: oaiUrl, provider: "openai" };
        }
      } else {
        const errJson = await oaiRes.json().catch(() => ({}));
        console.warn("[OpenAI Image Gen Quota/Status Notice]:", oaiRes.status, errJson?.error?.code || "");
      }
    } catch (oaiErr) {
      console.warn("[OpenAI Image Gen Exception]:", oaiErr);
    }
  }

  // 2. High-Resolution 3D Flux Engine (Pollinations Flux)
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
        provider: "flux-3d",
      };
    } else {
      console.warn("[Flux Engine Status != 200]:", fluxRes.status);
    }
  } catch (fluxErr) {
    console.warn("[Flux Engine Exception]:", fluxErr);
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

    const systemInstruction = `Bạn là Giám đốc Sáng tạo & Kỹ sư Thiết kế Móc Khoá 3D Độc Bản (Lead 3D Keychain Agent) của Nét Studio — thương hiệu túi lưới tái chế đại dương và charm cá nhân hoá thủ công tại Đà Nẵng.

NHIỆM VỤ CỦA BẠN:
Tiếp nhận MỌI YÊU CẦU của khách hàng — dù là ảnh người, ảnh thú cưng, ảnh hoa cỏ, ảnh đồ vật, hay chỉ là vài dòng chữ miêu tả ý tưởng — để phân tích, tạo ra câu chuyện thương hiệu truyền cảm hứng và soạn thảo MASTER PROMPT 3D KEYCHAIN tiếng Anh hoàn mỹ cho cỗ máy sinh ảnh 3D.

QUY TẮC PHÂN LOẠI & TẠO HÌNH NGHỆ THUẬT (BẮT BUỘC):
1. NHÓM CON NGƯỜI (subjectCategory: "human"):
   - Tỷ lệ Chibi 1:1 hoặc 1:1.2 cực kỳ đáng yêu, đầu to tròn trán bướng dễ thương, đôi mắt anime to tròn long lanh có ánh phản chiếu, đôi má ửng hồng.
   - Giữ trọn đặc trưng nhận diện từ ảnh/mô tả: kiểu tóc (undercut, uốn xoăn, búi cao...), kính mắt, nụ cười, trang phục và phụ kiện (đồng hồ, nón, túi mini).
   - Tư thế thân thiện: vẫy tay chào (friendly waving hand) hoặc tay đút túi cá tính.

2. NHÓM CON VẬT & THÚ CƯNG (subjectCategory: "animal"):
   - Phong cách thú bông vinyl / đất sét 3D múp míp (chubby body), lông mềm mịn, mắt to đen láy long lanh ngây thơ.
   - Tạo dáng tinh nghịch: ngồi ngoan ngoãn, vẫy đuôi, hoặc hai tay ôm một món đồ nhỏ (ôm cá, gặm xương, cầm ly trà sữa, ôm quả cầu len).

3. NHÓM HOA CỎ & THIÊN NHIÊN (subjectCategory: "flora"):
   - Phong cách men sứ bóng bẩy (glossy ceramic enamel / polymer clay), cánh hoa bo tròn mềm mại múp míp dễ thương, viền kim loại vàng kim đồng thau sang trọng.
   - Thêm giọt sương mai long lanh hoặc nhụy hoa cách điệu ánh vàng.

4. NHÓM ĐỊA DANH, ĐỒ ĂN & ĐỒ VẬT (subjectCategory: "landmark_object"):
   - Cầu Rồng, Cầu Vàng, ly cà phê phin, máy ảnh vintage, bánh mì, nón lá... được biến thể thành phiên bản đồ chơi mini chibi có biểu cảm gương mặt kawaii dễ thương.

5. NẾU KHÁCH CHỈ GÕ VÀI CHỮ Ý TƯỞNG (Không có ảnh):
   - Sử dụng trí tưởng tượng đỉnh cao để làm giàu ý tưởng (Prompt Enrichment), tạo nên hình tượng móc khoá sống động, rực rỡ và dễ thương nhất.

QUY CHUẨN KỸ THUẬT SẢN XUẤT 3D KEYCHAIN TRONG MASTER PROMPT (BẮT BUỘC):
- "A functional, sturdy metallic round hanging loop ring with a hole seamlessly integrated on top for keychain attachment".
- "Thick solid continuous outline, all parts structurally connected, no floating or fragile parts".
- "Shot from a direct straight-on front view, studio rim lighting, isolated on solid pure white background, 8k resolution, photorealistic cute render, collectible vinyl toy with smooth glossy polymer clay finish, no background shadows".

BẮT BUỘC TRẢ VỀ JSON HỢP LỆ VỚI CẤU TRÚC SAU:
{
  "subjectCategory": "human" | "animal" | "flora" | "landmark_object" | "creative_abstract",
  "replyText": "Lời tư vấn phong cách ấm áp bằng tiếng Việt, phân tích các nét nhận diện và giải thích vẻ đẹp của chiếc móc khoá...",
  "motifName": "Tên móc khoá tiếng Việt ngắn gọn, dễ thương (Ví dụ: Chibi Cún Poodle Nơ Đỏ / Bé Mèo Cam Ôm Cà Phê / Sen Hồng Men Ngọc)",
  "story": "Ý nghĩa nhân văn 2-3 câu ngắn kết nối tình yêu đại dương và phong cách sống xanh...",
  "masterPrompt": "Đoạn Master Prompt bằng tiếng Anh chi tiết, bắt đầu bằng 'A cute 3D chibi miniature keychain charm of [SUBJECT]...'",
  "featuresExtracted": {
    "subject": "Tên chủ thể chính",
    "features": "Chi tiết đặc trưng (tóc, mắt, dáng, cánh hoa, lông...)",
    "colors": "Màu sắc chủ đạo",
    "accessory": "Phụ kiện đi kèm nếu có"
  },
  "svgCode": "<svg viewBox=\\"0 0 100 135\\" xmlns=\\"http://www.w3.org/2000/svg\\">...vector silhouette chuẩn khoen xỏ trên đầu để làm phôi in 3D STL...</svg>",
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
    let promptFull = `YÊU CẦU THIẾT KẾ MÓC KHOÁ CỦA KHÁCH HÀNG: "${userPrompt}".\n`;
    promptFull += `- Màu túi lưới phối cùng: ${bagColorName}.\n`;
    if (customText) promptFull += `- Chữ khắc kỷ niệm: "${customText}".\n`;
    if (body.category && body.category !== "auto") {
      promptFull += `- Nhóm chủ đề người dùng chọn: ${body.category}.\n`;
    }
    promptFull += `- Áp dụng Master Prompt 3D Keychain: đồ chơi Chibi 3D vinyl/clay dễ thương, có khoen xỏ kim loại trên đỉnh, khối liền chắc chắn, nền trắng tinh khiết.`;

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
        text: "PHÂN TÍCH HÌNH ẢNH NÀY: Xác định chủ thể (người, thú cưng, hoa cỏ hay đồ vật), trích xuất đặc trưng nhận dạng rõ rệt nhất, và tạo Master Prompt 3D Keychain tuyệt đẹp chuẩn tỷ lệ đáng yêu.",
      });
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let parsedData: any = null;

    try {
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
            temperature: 0.7,
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
        }
      } else {
        console.warn("[Gemini API Status != 200]:", response.status);
      }
    } catch (apiErr) {
      console.warn("[Gemini Fetch Exception]:", apiErr);
    }

    // Nếu Gemini không phản hồi được, dùng bộ phân tích thông minh dựa trên từ khoá
    if (!parsedData || !parsedData.masterPrompt) {
      const lower = userPrompt.toLowerCase();
      let detectedCat = "human";
      let motif = "Chibi Bạn Trẻ Hiện Đại";
      let engSubject = "a friendly smiling young person with modern haircut and stylish outfit";

      if (
        lower.includes("chó") ||
        lower.includes("mèo") ||
        lower.includes("pet") ||
        lower.includes("cún") ||
        lower.includes("thú") ||
        lower.includes("gấu")
      ) {
        detectedCat = "animal";
        motif = "Bé Thú Cưng Đáng Yêu";
        engSubject = "an adorable chubby cute pet animal with big glossy anime eyes wearing a tiny scarf";
      } else if (
        lower.includes("hoa") ||
        lower.includes("sen") ||
        lower.includes("cúc") ||
        lower.includes("lá") ||
        lower.includes("cây")
      ) {
        detectedCat = "flora";
        motif = "Hoa Ngọc Biển Xanh";
        engSubject = "a blooming lotus flower with glossy ceramic enamel petals and delicate brass edges";
      } else if (
        lower.includes("cầu") ||
        lower.includes("cà phê") ||
        lower.includes("rồng") ||
        lower.includes("xe") ||
        lower.includes("biển")
      ) {
        detectedCat = "landmark_object";
        motif = "Biểu Tượng Kỷ Niệm Nét";
        engSubject = "a cute kawaii mini landmark icon inspired by Da Nang Dragon Bridge and ocean waves";
      }

      parsedData = {
        subjectCategory: detectedCat,
        replyText: `Nét Keychain Agent đã tiếp nhận ý tưởng "${userPrompt}" của bạn và thiết kế nên chiếc móc khoá 3D độc bản, giữ trọn nét dễ thương và tình yêu phong cách sống xanh!`,
        motifName: motif,
        story: "Mỗi chiếc móc khoá là một câu chuyện riêng mang theo tinh thần đại dương và dấu ấn kỷ niệm đáng nhớ.",
        masterPrompt: `A cute 3D chibi miniature keychain charm of ${engSubject}, collectible vinyl toy aesthetic with smooth glossy polymer clay finish, adorable chubby proportions, a functional metallic hanging loop ring with a hole seamlessly attached on top for keychain, direct front view, studio rim lighting, isolated on solid pure white background, 8k resolution, photorealistic cute render, no background noise`,
        featuresExtracted: {
          subject: motif,
          features: "3D Chibi tỷ lệ tròn xoe đáng yêu",
          colors: selectedColorHex,
          accessory: "Khoen móc kim loại tích hợp trên đỉnh",
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

    // BƯỚC 2: GỌI ĐỘNG CƠ SINH ẢNH 3D THỰC THỤ (OpenAI hoặc 3D Flux Engine)
    console.log("[Keychain Agent]: Generating 3D Charm Image with prompt:", parsedData.masterPrompt.slice(0, 100) + "...");
    const imageResult = await generateKeychainImage(parsedData.masterPrompt);

    if (imageResult) {
      parsedData.imageUrl = imageResult.imageUrl;
      parsedData.imageProvider = imageResult.provider;
    }

    // Đảm bảo luôn có svgCode dự phòng cho in 3D STL
    if (!parsedData.svgCode) {
      parsedData.svgCode = `<svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="charmShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>
  <g id="keychainCharm" filter="url(#charmShadow)">
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
    console.error("[Keychain Agent Exception]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Lỗi máy chủ nội bộ khi xử lý Keychain Agent.",
      },
      { status: 500 }
    );
  }
}
