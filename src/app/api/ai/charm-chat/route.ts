import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ChatRequestPayload {
  prompt?: string;
  imageBase64?: string; // Optional user uploaded sketch or photo
  history?: Array<{ sender: "ai" | "user"; text: string }>;
  customText?: string;
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

    if (!userPrompt && !imageBase64) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập ý tưởng thiết kế hoặc tải lên hình ảnh phác thảo!",
        },
        { status: 400 }
      );
    }

    const systemInstruction = `Bạn là Nét AI Stylist — chuyên gia thiết kế charm thủ công nghệ thuật cao cấp gắn túi xách đại dương Nét (Đà Nẵng).
Túi xách Nét được đan từ lưới đại dương tái sinh, trên thân túi có các mắt lưới chuẩn.
Charm được gắn vừa khít vào mắt lưới túi thông qua NGÀM CHỐT CÀI Ở MẶT SAU (snap-mount pin: đường kính 4.5mm, chiều dài 4.0mm).

NHIỆM VỤ CỦA BẠN:
1. Trò chuyện thân thiện, tinh tế và giàu cảm xúc văn hóa Đà Nẵng, biển Mỹ Khê, Sơn Trà và thời trang tái sinh bền vững.
2. Phân tích yêu cầu và hình ảnh khách gửi (ảnh cá nhân, thú cưng, ảnh kỷ niệm, hoa văn, hoặc chữ khắc).
3. ĐẶC BIỆT KHI KHÁCH YÊU CẦU TẠO CHARM CHIBI / HOẠT HÌNH / CHÂN DUNG / CÁ NHÂN HOÁ:
   - Hãy chuyển hoá thành một mẫu huy hiệu charm CHIBI / CARTOON CỰC KỲ DỄ THƯƠNG, NGHỆ THUẬT VÀ ĐẦY ĐỦ CHI TIẾT.
   - Luôn tạo mã SVG 2D (viewBox="0 0 100 100") dạng Huy hiệu Charm Enamel Pin cao cấp:
     + Khung viền huy hiệu kim loại/vàng đồng sang trọng bao quanh: <circle cx="50" cy="50" r="49" fill="#DAA520"/> hoặc <rect ... rx="16" fill="#DAA520"/>
     + Nền trong sáng màu tôn nổi nhân vật: ví dụ <circle cx="50" cy="50" r="46" fill="#FFFDF9"/>
     + Nhân vật chibi có mái tóc rõ lọn/nếp, khuôn mặt tròn đáng yêu với màu da tự nhiên (#FFDDC1 hoặc #FCD3B2), đôi mắt to tròn long lanh có đốm sáng (#000000 với highlight trắng), đôi má ửng hồng dễ thương (#FFB6C1), nụ cười tươi tắn (#8B0000 hoặc #E11D48), và trang phục có màu sắc tương phản nổi bật.
   - TUYỆT ĐỐI KHÔNG vẽ một hình khối đơn điệu, không vẽ khối vuông trơn hay bóng mờ một màu! Mỗi bộ phận (tóc, mặt, mắt, má, áo, viền) phải là một thẻ path/circle/rect riêng với màu sắc sống động!
4. KHI KHÁCH YÊU CẦU BIỂU TƯỢNG ĐÀ NẴNG / ĐẠI DƯƠNG (Rùa biển, Voọc Sơn Trà, Cầu Rồng, Vỏ ốc, Sóng biển):
   - Tạo hình vector đa tầng sắc nét, có hoạ tiết nổi (vân mai rùa, vảy rồng, đường xoắn ốc...) nổi bật trên nền huy hiệu.

BẮT BUỘC:
Luôn trả về kết quả dưới định dạng JSON hợp lệ:
{
  "replyText": "Lời tư vấn phong cách ấm áp, giải thích ý nghĩa biểu tượng chibi/hoa văn và câu chuyện...",
  "motifName": "Tên biểu tượng ngắn gọn (Ví dụ: Chibi Cá Nhân Áo Xanh)",
  "story": "1-2 câu tóm tắt ý nghĩa phong cách và thông điệp cá nhân hoá...",
  "svgCode": "<svg viewBox=\\"0 0 100 100\\" xmlns=\\"http://www.w3.org/2000/svg\\">...đa tầng chi tiết rõ nét...</svg>",
  "recommendedColor": "#2563EB",
  "laserEngravingText": "${customText || "NÉT ĐN"}",
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

    // Phần nội dung gửi lần này
    const currentParts: any[] = [];
    if (userPrompt) {
      currentParts.push({
        text: `Khách hàng yêu cầu: "${userPrompt}". ${
          customText ? `Chữ muốn khắc: "${customText}".` : ""
        } Hãy tạo mẫu charm vector SVG 2D đa tầng chi tiết, thẩm mỹ cao (nếu là chibi/cartoon thì vẽ khuôn mặt, mắt to long lanh, tóc, áo và viền huy hiệu vàng đồng) chuẩn gắn mắt lưới túi Nét.`,
      });
    }

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
        text: "Hãy phân tích hình ảnh này và chuyển hóa các đường nét đặc trưng của người/vật thể trong ảnh thành mẫu charm chibi cartoon 2D vector nhiều chi tiết (mặt, mắt, tóc, nụ cười, trang phục) trên huy hiệu viền vàng đồng.",
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
          temperature: 0.6,
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
