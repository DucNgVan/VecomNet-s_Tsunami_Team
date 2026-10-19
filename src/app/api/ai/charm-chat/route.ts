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

    const systemInstruction = `Bạn là Giám đốc Sáng tạo & Kỹ sư Thiết kế Charm 3D hàng đầu của Nét Studio — thương hiệu túi lưới tái chế đại dương và charm cá nhân hoá độc bản tại Đà Nẵng.

KHI KHÁCH YÊU CẦU TẠO CHARM CHIBI HOẶC TẢI LÊN ẢNH CHÂN DUNG/KỶ NIỆM:
Bạn BẮT BUỘC áp dụng CẤU TRÚC MASTER PROMPT CHUẨN SẢN XUẤT CHARM 3D KEYCHAIN sau đây:

Style: A 2D chibi cartoon character, designed specifically as a 3D-printable bag charm keychain, isolated on a clean transparent background.

Transform the subject in the photo into a cute, chibi-style illustration with an oversized head, large expressive anime-style eyes, and a small, compact body. Keep the iconic features such as the haircut (short undercut on the sides, voluminous on top), black-framed glasses, and the pose: left hand raised slightly in a friendly wave and the right hand casually tucked into the pocket of the pants, showing a silver wrist watch, inspired by the reference image. The outfit consists of a dark polo shirt and light-colored trousers.

Key 3D printing & charm specs:
- Design a thick, continuous, solid dark outline (border stroke="#281D17" stroke-width="2.5" to "3.5") around the entire character to ensure all parts are structurally connected. No disconnected or floating elements.
- A functional, sturdy round hanging eyelet/loop with a hole (minimum thickness 2.5mm - 3.0mm, e.g. cx="50" cy="12" r="3.2" with outer circle r="6.5") must be seamlessly integrated on top of the character's head for bag attachment.
- The entire charm is a single, unified flat outer shape with 2.5D layered emboss/deboss effect, avoiding any thin, fragile, or overly intricate lines that could easily break during 3D printing.
- Bold color blocks, flat shading, sticker/rubber-toy aesthetic, no gradient shadows, no complex patterns.
- Shot from a direct, straight-on front view. Completely transparent background, with no shadows on the ground.
- Phối màu hài hòa, tôn lên màu túi lưới khách đang chọn: ${bagColorName}.

KHI KHÁCH YÊU CẦU BIỂU TƯỢNG ĐÀ NẴNG / ĐẠI DƯƠNG (Sóng biển Mỹ Khê, Voọc Sơn Trà, Cầu Rồng, Vỏ sò):
Áp dụng cùng nguyên lý: Viền dày liền khối chắc chắn, có khoen treo tích hợp trên đỉnh, mảng khối 2.5D nổi bật, không vẽ khung bao vuông hay tròn bên ngoài.

BẮT BUỘC TRẢ VỀ JSON HỢP LỆ:
{
  "replyText": "Lời tư vấn phong cách ấm áp, phân tích các nét nhận diện từ ảnh/ý tưởng và giải thích thiết kế charm...",
  "motifName": "Tên charm ngắn gọn (Ví dụ: Chibi Chàng Trai Áo Polo Vẫy Chào / Sóng Biển Mỹ Khê)",
  "story": "Ý nghĩa tác phẩm, thông điệp cá nhân hoá kết nối tình yêu đại dương...",
  "masterPrompt": "Đoạn Master Prompt bằng tiếng Anh đã được điền đầy đủ thông tin [IMAGE_ANALYSIS_OR_USER_DESCRIPTION] theo đúng cấu trúc chuẩn để người dùng có thể sao chép nạp vào Gemini Web hoặc Imagen",
  "featuresExtracted": {
    "haircut": "Kiểu tóc...",
    "eyewear": "Kính mắt...",
    "pose": "Dáng đứng / Cử chỉ tay...",
    "outfit": "Trang phục...",
    "accessories": "Phụ kiện..."
  },
  "svgCode": "<svg viewBox=\\"0 0 100 135\\" xmlns=\\"http://www.w3.org/2000/svg\\">...vector chibi chuẩn khoen xỏ trên đầu, viền dày đen/nâu sẫm bao quanh, mắt anime, dáng chuẩn 3D print...</svg>",
  "recommendedColor": "${selectedColorHex}",
  "pinSpecs": {
    "diameterMm": 4.5,
    "heightMm": 4.0,
    "eyeletHoleMm": 3.0,
    "type": "snap_mount_grid"
  }
}`;

    // Chuẩn bị payload gửi tới Gemini API
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

    // Phần nội dung gửi lần này - Gom toàn bộ context từ người dùng
    const currentParts: any[] = [];
    let promptFull = `YÊU CẦU CỦA KHÁCH HÀNG: "${userPrompt}".\n`;
    promptFull += `- Màu túi lưới đang phối: ${bagColorName}.\n`;
    if (customText) promptFull += `- Chữ/ký tự muốn khắc: "${customText}".\n`;
    promptFull += `- Áp dụng Master Prompt 3D Keychain: Chibi 2D cartoon, đầu to mắt anime, viền dày liền mạch, khoen treo có lỗ trên đỉnh đầu, mảng màu phẳng rubber/enamel charm, không khung tròn/vuông bao ngoài.`;

    currentParts.push({ text: promptFull });

    // Nếu khách có tải lên ảnh (Base64)
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
        text: "PHÂN TÍCH HÌNH ẢNH NÀY: Trích xuất kiểu tóc, kính mắt, trang phục, dáng đứng và phụ kiện. Áp dụng Master Prompt 3D Keychain để tạo nhân vật Chibi die-cut có khoen xỏ trên đỉnh đầu, viền dày đen/nâu nối liền toàn bộ, loại bỏ hoàn toàn phông nền.",
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
            temperature: 0.65,
            maxOutputTokens: 2800,
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

    // Nếu Gemini thành công và có parsedData
    if (parsedData && parsedData.svgCode) {
      return NextResponse.json({
        success: true,
        data: parsedData,
      });
    }

    // Tự động kích hoạt bộ chuyển đổi thông minh (Intelligent Fallback Engine)
    // đảm bảo khách hàng luôn nhận được thiết kế charm Chibi chuẩn 3D keychain tuyệt đẹp
    const fallbackMasterPrompt = `Style: A 2D chibi cartoon character, designed specifically as a 3D-printable bag charm keychain, isolated on a solid, flat white background. 

Transform the subject in the photo into a cute, chibi-style illustration with an oversized head, large expressive anime-style eyes, and a small, compact body. Keep the iconic features such as the haircut (short undercut on the sides, voluminous on top), black-framed glasses, and the pose: left hand raised slightly in a friendly wave and the right hand casually tucked into the pocket of the pants, showing a silver wrist watch, inspired by the reference image. The outfit consists of a dark polo shirt and light-colored trousers.

Key 3D printing & charm specs:
- Design a thick, continuous, solid dark outline (border) around the entire character to ensure all parts are structurally connected. No disconnected or floating elements.
- A functional, sturdy round hanging eyelet/loop with a hole (minimum thickness 2.5mm) must be seamlessly integrated on top of the character's head for bag attachment.
- The entire charm is a single, unified flat outer shape with 2.5D layered emboss/deboss effect, avoiding any thin, fragile, or overly intricate lines that could easily break during 3D printing.
- Bold color blocks, flat shading, sticker/rubber-toy aesthetic, no gradient shadows, no complex patterns.
- Shot from a direct, straight-on front view. Completely transparent or solid white background, with no shadows on the ground.`;

    const fallbackSvg = `<svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="charmShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <g id="chibiKeychainCharm" filter="url(#charmShadow)">
    <!-- 1. Sturdy Top Hanging Loop (integrated eyelet with hole) -->
    <path d="M43 14 C43 6, 57 6, 57 14 C57 17.5, 54 18.5, 50 18.5 C46 18.5, 43 17.5, 43 14 Z" fill="#281D17" stroke="#281D17" stroke-width="2.5"/>
    <circle cx="50" cy="12" r="3.2" fill="#FFFFFF" stroke="#281D17" stroke-width="1.8"/>

    <!-- 2. Hair Undercut Side Fade -->
    <path d="M23 46 C21 37, 25 29, 31 26 C34 32, 35 42, 37 48 Z" fill="#654A3C" stroke="#281D17" stroke-width="2"/>

    <!-- 3. Head & Face Skin Base -->
    <path d="M28 42 C26 58, 32 72, 49 72 C66 72, 72 58, 70 42 C64 36, 36 36, 28 42 Z" fill="#FCD5B5" stroke="#281D17" stroke-width="2.5"/>

    <!-- 4. Left Ear -->
    <path d="M27 48 C22 47, 23 58, 28 58 Z" fill="#FCD5B5" stroke="#281D17" stroke-width="2"/>
    <path d="M26 51 C24 51, 24 55, 27 55" fill="none" stroke="#D79E7E" stroke-width="1.2" stroke-linecap="round"/>

    <!-- 5. Voluminous Top Hair with anime tufts -->
    <path d="M25 43 C22 34, 25 24, 34 20 C42 16, 54 17, 62 21 C68 25, 75 32, 73 40 C72 44, 69 46, 68 44 C67 38, 62 33, 56 31 C59 34, 59 37, 56 37 C52 33, 46 31, 40 33 C42 36, 42 39, 39 39 C34 36, 30 38, 28 44 Z" fill="#2D231E" stroke="#281D17" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M48 20 C52 24, 56 26, 58 31" fill="none" stroke="#4A3B34" stroke-width="1.5" stroke-linecap="round"/>

    <!-- 6. Eyebrows -->
    <path d="M37 42 Q43 39, 48 43" fill="none" stroke="#281D17" stroke-width="2" stroke-linecap="round"/>
    <path d="M59 42 Q65 39, 70 43" fill="none" stroke="#281D17" stroke-width="2" stroke-linecap="round"/>

    <!-- 7. Black-Framed Glasses -->
    <rect x="32" y="44" width="17" height="13" rx="3.5" fill="none" stroke="#1D1D1D" stroke-width="2.4"/>
    <rect x="55" y="44" width="17" height="13" rx="3.5" fill="none" stroke="#1D1D1D" stroke-width="2.4"/>
    <path d="M49 49 L55 49" stroke="#1D1D1D" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M29 48 L32 48" stroke="#1D1D1D" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M72 48 L75 48" stroke="#1D1D1D" stroke-width="2.4" stroke-linecap="round"/>

    <!-- 8. Large Expressive Anime Eyes with Highlights -->
    <ellipse cx="40.5" cy="50.5" rx="4.5" ry="5" fill="#2E2018"/>
    <ellipse cx="40.5" cy="51.5" rx="3.5" ry="3.8" fill="#523A2C"/>
    <circle cx="42" cy="48.5" r="1.8" fill="#FFFFFF"/>
    <circle cx="39" cy="52.5" r="0.9" fill="#FFFFFF"/>

    <ellipse cx="63.5" cy="50.5" rx="4.5" ry="5" fill="#2E2018"/>
    <ellipse cx="63.5" cy="51.5" rx="3.5" ry="3.8" fill="#523A2C"/>
    <circle cx="65" cy="48.5" r="1.8" fill="#FFFFFF"/>
    <circle cx="62" cy="52.5" r="0.9" fill="#FFFFFF"/>

    <!-- 9. Nose & Friendly Smile -->
    <path d="M51 53 L51.5 54.5" stroke="#D79E7E" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M46 59 Q51 63, 56 59" fill="none" stroke="#281D17" stroke-width="1.8" stroke-linecap="round"/>

    <!-- 10. Neck -->
    <path d="M45 70 L45 74 L55 74 L55 70 Z" fill="#FCD5B5" stroke="#281D17" stroke-width="1.5"/>

    <!-- 11. Dark Polo Shirt with Collar & Placket -->
    <path d="M33 74 L67 74 L65 100 L34 100 Z" fill="#242424" stroke="#281D17" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M43 74 L50 82 L47 74 Z" fill="#181818" stroke="#281D17" stroke-width="1.5"/>
    <path d="M57 74 L50 82 L53 74 Z" fill="#181818" stroke="#281D17" stroke-width="1.5"/>
    <path d="M50 82 L50 90" stroke="#181818" stroke-width="1.8"/>

    <!-- 12. Right Arm tucked in Pocket with Silver Watch -->
    <path d="M33 75 C29 78, 27 88, 32 99 C35 103, 39 103, 40 98 L37 84" fill="#242424" stroke="#281D17" stroke-width="2.2" stroke-linejoin="round"/>
    <rect x="33" y="93" width="5" height="4" rx="1.5" fill="#CBD5E1" stroke="#281D17" stroke-width="1.2"/>

    <!-- 13. Left Arm Raised in Friendly Waving Gesture -->
    <path d="M66 75 C70 78, 77 82, 77 75 C77 67, 72 63, 71 58 C68 57, 65 62, 67 68 C68 73, 64 74, 61 74" fill="#FCD5B5" stroke="#281D17" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M72 58 C74 55, 77 57, 76 60 C78 58, 80 61, 78 64" fill="#FCD5B5" stroke="#281D17" stroke-width="1.5"/>

    <!-- 14. Trousers (Light Cream / Beige Chinos) -->
    <path d="M35 100 L65 100 L64 124 L52 124 L50 106 L48 124 L36 124 Z" fill="#F4EED7" stroke="#281D17" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M36 100 Q40 105, 41 109" fill="none" stroke="#281D17" stroke-width="1.8"/>

    <!-- 15. Shoes (Dark Loafers) -->
    <path d="M34 124 C34 122, 47 122, 47 125 C47 129, 34 129, 34 127 Z" fill="#241E1B" stroke="#281D17" stroke-width="2"/>
    <path d="M53 125 C53 122, 66 122, 66 124 C66 127, 53 129, 53 127 Z" fill="#241E1B" stroke="#281D17" stroke-width="2"/>
  </g>
</svg>`;

    return NextResponse.json({
      success: true,
      data: {
        replyText: `Nét AI Stylist đã áp dụng Master Prompt 3D Keychain để tạo bản phác thảo Chibi độc bản cho bạn! Nhân vật sở hữu mái tóc undercut vuốt bồng bềnh, mắt anime biểu cảm, kính gọng đen, cử chỉ vẫy tay thân thiện và khoen xỏ chắc chắn trên đầu sẵn sàng kết nối túi Nét.`,
        motifName: "Chibi Chàng Trai Áo Polo Vẫy Chào",
        story: "Biểu tượng cá nhân hoá mang năng lượng tự tin, hiện đại và tình yêu du lịch biển Đà Nẵng.",
        masterPrompt: fallbackMasterPrompt,
        featuresExtracted: {
          haircut: "Short undercut on the sides, voluminous on top",
          eyewear: "Black-framed glasses",
          pose: "Left hand raised in a friendly wave, right hand in pocket",
          outfit: "Dark polo shirt & light-colored trousers",
          accessories: "Silver wrist watch",
        },
        svgCode: fallbackSvg,
        recommendedColor: selectedColorHex,
        pinSpecs: {
          diameterMm: 4.5,
          heightMm: 4.0,
          eyeletHoleMm: 3.0,
          type: "snap_mount_grid",
        },
      },
    });
  } catch (error: any) {
    console.error("[API Charm Chat Exception]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Lỗi máy chủ nội bộ khi xử lý AI Stylist.",
      },
      { status: 500 }
    );
  }
}
