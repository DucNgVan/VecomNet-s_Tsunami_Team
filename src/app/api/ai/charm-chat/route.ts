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

    const systemInstruction = `Bạn là Giám đốc Sáng tạo & Nghệ nhân Điêu khắc Trưởng của Nét Studio — xưởng chế tác thủ công túi lưới đại dương & charm độc bản tại Đà Nẵng.

NGUYÊN TẮC THIẾT KẾ CHARM NÉT (BẮT BUỘC TUÂN THỦ 100%):
1. CHARM DIE-CUT TỰ DO — KHÔNG CÓ VIỀN NGOÀI:
   - TUYỆT ĐỐI KHÔNG vẽ khung tròn, KHÔNG vẽ khung vuông, KHÔNG có viền hộp bao quanh chủ thể!
   - Nền SVG hoàn toàn trong suốt (transparent).
   - Đường bao của chiếc charm chính là đường cong tự nhiên ôm sát cơ thể nhân vật Chibi, hoặc đường lượn xoắn của sóng biển, hoặc nan quạt của vỏ sò, hoặc đôi cánh của chim hải âu.
   - Giống như những chiếc charm gốm thủ công mạ vàng đính trên túi lưới: Mỗi charm là một hình thể điêu khắc độc lập, không bị bó buộc trong bất kỳ khuôn hình học nào.

2. CHẤT LIỆU MEN GỐM THỦ CÔNG & ÁNH KIM ĐỒNG THAU (HANDCRAFTED CERAMIC ENAMEL & GOLD ACCENTS):
   - Bề mặt charm có độ bóng bẩy của men nung (glossy enamel glaze), sử dụng <linearGradient> và <radialGradient> tạo chiều sâu, chuyển sắc tinh tế.
   - Các đường viền chính của chi tiết được nhấn bằng nét chỉ vàng kim nghệ nhân (stroke="#D4AF37" hoặc stroke="#B8860B" hoặc stroke="#C59B27") tạo cảm giác kim loại đồng thau đúc viền men sứ.
   - Màu sắc hài hòa, rạng rỡ, sang trọng, phối hợp ăn ý với màu túi lưới (${bagColorName}).

3. CHUYÊN BIỆT KHI KHÁCH YÊU CẦU TẠO CHARM CHIBI / HOẠT HÌNH CÁ NHÂN TỪ ẢNH HOẶC MÔ TẢ:
   - TÁCH BỎ HOÀN TOÀN PHÔNG NỀN (Remove background).
   - Chuyển thể nhân vật thành PHONG CÁCH CHIBI CARTOON / ANIME CỰC KỲ DỄ THƯƠNG, NGHỆ THUẬT VÀ ĐẸP MẮT:
     + Mái tóc bồng bềnh, bóng mượt theo ảnh/yêu cầu của khách (ví dụ tóc đen ngắn tự nhiên).
     + Khuôn mặt Chibi tròn trịa, màu da hồng hào tự nhiên, đôi má ửng hồng phớt nhẹ.
     + Đôi mắt Chibi to tròn đen láy, long lanh có đốm sáng phản chiếu tạo thần thái sống động, vui tươi.
     + Khuôn miệng cười tươi tắn duyên dáng.
     + Thân người và trang phục (áo thun đen, sơ mi, áo khoác...) thể hiện đúng phong cách của khách trong ảnh, viền vàng đồng nhẹ.
     + Cắt die-cut sát theo toàn bộ dáng đầu và thân nhân vật.

4. KHI KHÁCH YÊU CẦU BIỂU TƯỢNG ĐÀ NẴNG / ĐẠI DƯƠNG:
   - Vạt sóng biển: Uốn lượn hình xoắn ốc men ngọc viền vàng, rỗng theo nếp sóng tự do.
   - Vỏ sò biển: Dáng nan quạt men sứ trắng ngọc trai, các đường rãnh sò chạm vàng lấp lánh.
   - Voọc Chà Vá Chân Nâu: Khuôn mặt nâu cam rực rỡ, mắt tròn đen lay láy, tai và thân die-cut theo dáng linh vật.
   - Cầu Rồng / Thuyền buồm / Hải âu: Dáng lượn sóng tự do, không có khung nền bao quanh.

BẮT BUỘC TRẢ VỀ JSON HỢP LỆ:
{
  "replyText": "Lời tư vấn phong cách ấm áp, giải thích ý tưởng tạo hình Chibi/biểu tượng die-cut và câu chuyện văn hóa kết nối với túi Nét...",
  "motifName": "Tên tác phẩm charm ngắn gọn (Ví dụ: Chibi Chàng Trai Đà Nẵng / Sóng Biển Men Ngọc)",
  "story": "Ý nghĩa tác phẩm, thông điệp cá nhân hoá kết hợp tình yêu biển...",
  "svgCode": "<svg viewBox=\\"0 0 100 100\\" xmlns=\\"http://www.w3.org/2000/svg\\">...chỉ chứa hình nhân vật/chủ thể die-cut không có hình nền tròn/vuông bao ngoài...</svg>",
  "recommendedColor": "${selectedColorHex}",
  "pinSpecs": {
    "diameterMm": 4.5,
    "heightMm": 4.0,
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
    promptFull += `- Yêu cầu cốt lõi: Tạo mẫu charm DIE-CUT TỰ DO KHÔNG CÓ VIỀN TRÒN/VUÔNG BAO NGOÀI, nền trong suốt, phong cách men gốm nghệ nhân mạ vàng đồng bóng bẩy đẹp nhất có thể, chuẩn ngàm chốt cài mắt lưới túi Nét.`;

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
        text: "HÃY PHÂN TÍCH KỸ HÌNH ẢNH NÀY: Tách nền 100%, lấy các đặc trưng của người/chủ thể trong ảnh (kiểu tóc, khuôn mặt, biểu cảm cười, trang phục) và chuyển hoá thành nhân vật Chibi hoạt hình die-cut cực kỳ dễ thương, tinh tế, men gốm sứ viền vàng kim, KHÔNG CÓ KHUNG NỀN BAO NGOÀI.",
      });
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Gemini API Error]:", response.status, errText);
      return NextResponse.json(
        {
          success: false,
          error: `Gemini API trả về mã lỗi: ${response.status}`,
          details: errText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Không nhận được phản hồi hợp lệ từ Gemini AI.",
        },
        { status: 502 }
      );
    }

    // Parse JSON
    let parsedData: any;
    try {
      parsedData = JSON.parse(rawContent);
    } catch (parseErr) {
      // Làm sạch nếu model bọc markdown backticks ```json ... ```
      const cleaned = rawContent
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();
      parsedData = JSON.parse(cleaned);
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
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
