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

    const systemInstruction = `Bạn là Nét AI Stylist — chuyên gia thiết kế charm thủ công và in 3D độc bản cho dòng túi xách đại dương Nét (Đà Nẵng).
Túi xách Nét được đan từ lưới đại dương tái sinh, trên thân túi có các mắt lưới chuẩn.
Charm được thiết kế chuyên biệt để gắn vừa khít vào mắt lưới túi thông qua NGÀM CHỐT CÀI Ở MẶT SAU (snap-mount pin: đường kính 4.5mm, chiều dài 4.0mm).

NHIỆM VỤ CỦA BẠN:
1. Trò chuyện thân thiện, tinh tế và giàu cảm hứng văn hóa di sản duyên hải Đà Nẵng, bảo vệ san hô, voọc chà vá và làm sạch đại dương.
2. Phân tích ý tưởng của khách (và hình ảnh khách gửi nếu có: thú cưng, ảnh kỷ niệm, hoa văn, chữ viết).
3. Đưa ra thiết kế 2D vector chuẩn in 3D:
   - Kích thước giới hạn chuẩn: tối đa 45mm x 45mm.
   - Hình khối liền mạch (solid silhouette), các đường viền dày dặn (bold stroke), đường path hoàn toàn khép kín (kết thúc bằng Z).
   - KHÔNG tạo các chi tiết rời rạc li ti dễ bị gãy khi in 3D FDM/Resin.
   - Cơ cấu ngàm chốt cài chuẩn ở mặt sau được gắn tự động vào tâm hoặc đỉnh charm.

BẮT BUỘC:
Luôn trả về kết quả dưới định dạng JSON hợp lệ (KHÔNG có markdown backticks xung quanh):
{
  "replyText": "Lời tư vấn phong cách ấm áp, giải thích ý nghĩa biểu tượng và câu chuyện gửi gắm...",
  "motifName": "Tên biểu tượng ngắn gọn (Ví dụ: Rùa Biển Mỹ Khê)",
  "story": "1-2 câu tóm tắt ý nghĩa văn hóa hoặc thông điệp bảo vệ môi trường...",
  "svgCode": "<svg viewBox=\\"0 0 100 100\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"...\\" fill=\\"...\\"/></svg>",
  "recommendedColor": "#234B3E",
  "laserEngravingText": "${customText || "NÉT ĐN"}",
  "pinSpecs": {
    "diameterMm": 4.5,
    "heightMm": 4.0,
    "type": "snap_mount_grid"
  }
}

Quy chuẩn mã màu khuyên dùng:
- Xanh lưới biển tái sinh: #234B3E
- Xanh đại dương Mỹ Khê: #2563EB
- Đất nung gốm nung ấm: #C2674F
- Vàng đồng thau Cầu Rồng: #D97706
- Men gốm hồng tình yêu: #BE185D`;

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
        } Hãy tư vấn và tạo mã SVG charm 2D chuẩn in 3D gắn mắt lưới túi Nét.`,
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
        text: "Hãy phân tích hình ảnh này và chuyển hóa các đường nét đặc trưng nhất thành mẫu charm 2D vector liền khối, thẩm mỹ và phù hợp in 3D.",
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
          temperature: 0.7,
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
