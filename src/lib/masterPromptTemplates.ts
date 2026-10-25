/**
 * Master Prompt Templates & Slot-Filling Engine
 * Đảm bảo 100% tính thống nhất của bản vẽ 2D Keychain in 3D
 * Hỗ trợ toàn diện 6 nhóm chủ đề:
 * 1. Con người (Human Chibi)
 * 2. Con vật & Thú cưng (Animals & Pets)
 * 3. Hoa cỏ & Thiên nhiên (Flora & Marine Nature)
 * 4. Cảnh quan & Địa danh (Landmarks & Scenery)
 * 5. Vật thể, Đồ ăn & Đồ lưu niệm (Objects, Food & Souvenirs)
 * 6. Tự do sáng tạo (Freeform / Anything)
 */

export type CharmThemeCategory =
  | "human"
  | "animal"
  | "flora"
  | "landmark"
  | "object"
  | "freeform";

export interface PromptSlotConfig {
  id: CharmThemeCategory;
  name: string;
  icon: string;
  description: string;
  slots: {
    key: "subject" | "feature1" | "feature2" | "feature3";
    label: string;
    placeholder: string;
    suggestions: string[];
  }[];
}

export const CHARM_THEME_CONFIGS: PromptSlotConfig[] = [
  {
    id: "human",
    name: "Con người",
    icon: "👤",
    description: "Chân dung Chibi bạn bè, cặp đôi, em bé hay chính bạn",
    slots: [
      {
        key: "subject",
        label: "Bạn muốn tạo ai?",
        placeholder: "Ví dụ: Chàng trai, Cô gái, Em bé, Cặp đôi...",
        suggestions: ["Chàng trai trẻ", "Cô gái năng động", "Em bé má phúng phính", "Cặp đôi du lịch"],
      },
      {
        key: "feature1",
        label: "Kiểu tóc & Khuôn mặt",
        placeholder: "Ví dụ: Tóc ngắn vuốt dựng, đeo kính gọng vuông...",
        suggestions: ["Tóc short quiff vuốt dựng, đeo kính", "Tóc dài uốn xoăn nhẹ", "Tóc ngắn mái ngố đáng yêu", "Búi tóc hai bên đính hoa"],
      },
      {
        key: "feature2",
        label: "Trang phục & Màu sắc",
        placeholder: "Ví dụ: Áo phông đen cổ tròn, váy hoa vàng...",
        suggestions: ["Áo phông đen cổ tròn", "Sơ mi trắng thanh lịch", "Váy hoa vàng rực rỡ", "Áo hoodie trẻ trung"],
      },
      {
        key: "feature3",
        label: "Cầm theo gì / Tư thế tạo dáng",
        placeholder: "Ví dụ: Cầm ly cà phê sữa đá, vẫy tay chào...",
        suggestions: ["Tay cầm ly cà phê sữa đá tạo dáng", "Vẫy tay chào thân thiện", "Tay đút túi quần tự tin", "Ôm bó hoa muống biển"],
      },
    ],
  },
  {
    id: "animal",
    name: "Thú cưng & Con vật",
    icon: "🐾",
    description: "Chó mèo, thú cưng, rùa biển hay linh vật Sơn Trà",
    slots: [
      {
        key: "subject",
        label: "Loài vật gì?",
        placeholder: "Ví dụ: Chú chó Poodle, Bé mèo cam, Rùa biển...",
        suggestions: ["Chú cún Poodle nâu", "Bé mèo múp míp", "Rùa biển Sơn Trà", "Voọc Chà Vá linh vật"],
      },
      {
        key: "feature1",
        label: "Bộ lông & Nét mặt",
        placeholder: "Ví dụ: Lông vàng xù, mắt to tròn long lanh...",
        suggestions: ["Lông xoăn vàng xù, mắt to tròn", "Lông cam sọc trắng, má hồng", "Mai rùa ngọc bích hoa văn", "Mặt nâu cam mắt đen láy"],
      },
      {
        key: "feature2",
        label: "Trang phục / Phụ kiện",
        placeholder: "Ví dụ: Đeo nơ đỏ chuông vàng, quàng khăn len...",
        suggestions: ["Đeo nơ đỏ cổ chuông vàng", "Đội mũ len mini xinh xắn", "Quàng khăn caro ấm áp", "Đeo vòng hoa biển quanh cổ"],
      },
      {
        key: "feature3",
        label: "Hành động đáng yêu",
        placeholder: "Ví dụ: Ôm ly trà sữa trân châu, ngủ cuộn tròn...",
        suggestions: ["Hai chân trước ôm ly trà sữa", "Gặm chiếc bánh quy nhỏ", "Ngồi ngoan vẫy đuôi cười tươi", "Nằm cuộn tròn ngủ say"],
      },
    ],
  },
  {
    id: "flora",
    name: "Hoa cỏ & Thiên nhiên",
    icon: "🌸",
    description: "Hoa sen, muống biển, xương rồng hay san hô",
    slots: [
      {
        key: "subject",
        label: "Loài hoa / Cây gì?",
        placeholder: "Ví dụ: Hoa sen hồng, Hoa muống biển, Cành san hô...",
        suggestions: ["Hoa sen hồng men ngọc", "Hoa muống biển Mỹ Khê", "Cành san hô biển", "Cây xương rồng nhỏ"],
      },
      {
        key: "feature1",
        label: "Cánh hoa & Hình thể",
        placeholder: "Ví dụ: Cánh hoa nở bung đều, bo tròn mềm mại...",
        suggestions: ["Cánh sen nở rộ tầng lớp bo tròn", "5 cánh hoa tím mềm mại", "Nhánh san hô uốn lượn tự nhiên", "Cây mọng nước tròn xoe"],
      },
      {
        key: "feature2",
        label: "Màu sắc & Chất liệu men",
        placeholder: "Ví dụ: Màu hồng phấn chuyển lam ngọc, viền vàng kim...",
        suggestions: ["Men hồng phấn chuyển sắc ngọc", "Tím pastel viền đồng thau", "Xanh ngọc bích ánh vàng kim", "Xanh rêu mộc mạc men nung"],
      },
      {
        key: "feature3",
        label: "Chi tiết điểm xuyết",
        placeholder: "Ví dụ: Giọt sương mai long lanh, nhụy vàng óng...",
        suggestions: ["Giọt sương mai đọng trên cánh", "Nhụy hoa vàng óng tỏa sáng", "Một chú bướm nhỏ đậu nhẹ", "Lá sen xanh mướt làm đế"],
      },
    ],
  },
  {
    id: "landmark",
    name: "Cảnh quan & Địa danh",
    icon: "🌉",
    description: "Cầu Rồng, Cầu Vàng, Ngọn Hải Đăng hay Bãi biển",
    slots: [
      {
        key: "subject",
        label: "Địa danh nào?",
        placeholder: "Ví dụ: Cầu Rồng Đà Nẵng, Cầu Vàng Bà Nà, Ngọn Hải Đăng...",
        suggestions: ["Cầu Rồng Đà Nẵng", "Cầu Vàng bàn tay khổng lồ", "Ngọn Hải Đăng Tiên Sa", "Bãi biển Mỹ Khê bình minh"],
      },
      {
        key: "feature1",
        label: "Hình thể cách điệu 2D",
        placeholder: "Ví dụ: Thân rồng uốn lượn mạnh mẽ, bàn tay đá nâng cầu...",
        suggestions: ["Thân rồng vàng uốn lượn mini", "Đôi bàn tay rêu phong cổ kính", "Tháp hải đăng sọc trắng đỏ", "Mặt trời mọc trên mặt biển"],
      },
      {
        key: "feature2",
        label: "Hiệu ứng đặc trưng",
        placeholder: "Ví dụ: Đầu rồng phun lửa rực rỡ, ánh đèn hải đăng...",
        suggestions: ["Đầu rồng phun lửa vàng rực", "Dải lụa vàng lấp lánh ánh nắng", "Ánh đèn quét sáng ngọn tháp", "Vạt sóng biển xanh vỗ bờ"],
      },
      {
        key: "feature3",
        label: "Chi tiết bao quanh",
        placeholder: "Ví dụ: Vạt sóng nước sông Hàn, mây trời bồng bềnh...",
        suggestions: ["Sóng nước sông Hàn cách điệu", "Mây trắng bồng bềnh bao quanh", "Đàn hải âu chao lượn trên cao", "Khung vòm cầu biểu tượng"],
      },
    ],
  },
  {
    id: "object",
    name: "Vật thể & Đồ ăn",
    icon: "☕",
    description: "Ly cà phê phin, xe máy Vespa, máy ảnh, nón lá",
    slots: [
      {
        key: "subject",
        label: "Đồ vật / Món ăn gì?",
        placeholder: "Ví dụ: Ly cà phê phin sữa đá, Xe máy Vespa, Ổ bánh mì...",
        suggestions: ["Ly cà phê phin sữa đá", "Chiếc xe máy Vespa cổ", "Máy ảnh film vintage", "Chiếc nón lá truyền thống"],
      },
      {
        key: "feature1",
        label: "Đặc điểm & Kiểu dáng",
        placeholder: "Ví dụ: Phin nhôm nhỏ giọt, thân xe bo tròn màu kem...",
        suggestions: ["Phin nhôm nhỏ giọt bốc khói", "Thân xe bo tròn màu xanh mint", "Ống kính máy ảnh cổ điển", "Nón lá vẽ cành hoa sen"],
      },
      {
        key: "feature2",
        label: "Màu sắc & Phong cách",
        placeholder: "Ví dụ: Nâu cánh gián và sữa đặc, màu retro vintage...",
        suggestions: ["Nâu cà phê và sữa trắng sánh mịn", "Màu men lam gốm Hội An", "Màu da bò retro cao cấp", "Màu vàng rơm mộc mạc"],
      },
      {
        key: "feature3",
        label: "Chi tiết điểm xuyết (Tùy chọn)",
        placeholder: "Ví dụ: Khắc logo nhỏ, tia sáng, hoặc để trống để giữ nguyên bản...",
        suggestions: ["Không có nét mặt (Để nguyên bản tối giản)", "Khắc logo nhỏ", "Tia sáng lấp lánh", "Bỏ qua"],
      },
    ],
  },
  {
    id: "freeform",
    name: "Tự do sáng tạo",
    icon: "✨",
    description: "Bất kỳ ý tưởng độc lạ nào bạn nghĩ ra",
    slots: [
      {
        key: "subject",
        label: "Ý tưởng chính của bạn là gì?",
        placeholder: "Ví dụ: Trái đất xanh ôm chiếc túi lưới, Bút chì biết cười...",
        suggestions: ["Trái đất xanh đội nón lá", "Chiếc túi lưới ôm mầm cây", "Mặt trời đeo kính râm", "Ngôi sao biển cầm bóng bay"],
      },
      {
        key: "feature1",
        label: "Chi tiết hình dáng nhận diện",
        placeholder: "Ví dụ: Hình tròn bo viền, nét vẽ hoạt hình dễ thương...",
        suggestions: ["Dáng tròn xoe hoạt hình dễ thương", "Viền ngoài dày dặn sắc nét", "Tỷ lệ đầu to ngộ nghĩnh", "Hình khối mềm mại bo góc"],
      },
      {
        key: "feature2",
        label: "Màu sắc bạn yêu thích",
        placeholder: "Ví dụ: Xanh đại dương, vàng nắng biển, hồng pastel...",
        suggestions: ["Tone xanh đại dương mát mắt", "Vàng cam ấm áp rạng rỡ", "Hồng pastel nhẹ nhàng", "Phối màu tương phản nổi bật"],
      },
      {
        key: "feature3",
        label: "Thông điệp / Điểm nhấn bổ sung",
        placeholder: "Ví dụ: Cầm biểu ngữ Yêu Biển, đính viên ngọc nhỏ...",
        suggestions: ["Mang thông điệp bảo vệ đại dương", "Tạo cảm giác vui tươi lạc quan", "Gợi nhớ kỷ niệm Đà Nẵng", "Đính nơ hoặc chi tiết may mắn"],
      },
    ],
  },
];

export interface SlotValues {
  subject?: string;
  feature1?: string;
  feature2?: string;
  feature3?: string;
}

/**
 * Helper kiểm tra người dùng có từ chối / bỏ qua chi tiết đó hay không
 */
function isNegativeOrEmpty(val?: string): boolean {
  if (!val) return true;
  const clean = val.trim().toLowerCase();
  return (
    clean === "" ||
    /^(không|k|ko|bỏ qua|none|no|không có|để nguyên|trống|không cần|giữ nguyên|không thêm)$/i.test(
      clean
    )
  );
}

/**
 * Xây dựng câu Master Prompt hoàn chỉnh từ các ô điền của người dùng
 */
export function buildMaster2DKeychainPrompt(
  category: CharmThemeCategory,
  slots: SlotValues
): string {
  const s = (slots.subject || "").trim();
  const f1 = (slots.feature1 || "").trim();
  const f2 = (slots.feature2 || "").trim();
  const f3 = (slots.feature3 || "").trim();

  let subjectDescription = "";

  switch (category) {
    case "human": {
      const subject = s || "a young person";
      const hair = !isNegativeOrEmpty(f1) ? `with ${f1}` : "";
      const outfit = !isNegativeOrEmpty(f2) ? `, wearing ${f2}` : "";
      const pose = !isNegativeOrEmpty(f3) ? `, ${f3}` : "";
      subjectDescription = `an adorable kawaii 2D anime chibi ${subject} ${hair}${outfit}${pose}, oversized cute round head, chubby cheeks with soft pink blush, happy smiling crescent anime eyes`.replace(/\s+/g, " ").trim();
      break;
    }
    case "animal": {
      const pet = s || "a cute pet animal";
      const fur = !isNegativeOrEmpty(f1) ? `with ${f1}` : "";
      const acc = !isNegativeOrEmpty(f2) ? `, wearing ${f2}` : "";
      const act = !isNegativeOrEmpty(f3) ? `, ${f3}` : "";
      subjectDescription = `an adorable chibi ${pet} ${fur}${acc}${act}`.replace(/\s+/g, " ").trim();
      break;
    }
    case "flora": {
      const flower = s || "a blooming flower";
      const petals = !isNegativeOrEmpty(f1) ? `with ${f1}` : "";
      const colors = !isNegativeOrEmpty(f2) ? `, rendered in ${f2}` : "";
      const accent = !isNegativeOrEmpty(f3) ? `, accented with ${f3}` : "";
      subjectDescription = `a stylized blooming ${flower} ${petals}${colors}${accent}`.replace(/\s+/g, " ").trim();
      break;
    }
    case "landmark": {
      const mark = s || "Da Nang Dragon Bridge";
      const style = !isNegativeOrEmpty(f1) ? `stylized with ${f1}` : "";
      const effect = !isNegativeOrEmpty(f2) ? `, featuring ${f2}` : "";
      const surrounding = !isNegativeOrEmpty(f3) ? `, surrounded by ${f3}` : "";
      subjectDescription = `a 2D landmark icon of ${mark} ${style}${effect}${surrounding}`.replace(/\s+/g, " ").trim();
      break;
    }
    case "object": {
      const item = s || "a souvenir object";
      const style = !isNegativeOrEmpty(f1) ? `styled with ${f1}` : "";
      const color = !isNegativeOrEmpty(f2) ? `, in ${f2}` : "";
      // TUYỆT ĐỐI KHÔNG TỰ ĐỘNG THÊM MẶT CƯỜI HAY BIỂU CẢM NẾU NGƯỜI DÙNG BỎ QUA HOẶC NÓI KHÔNG
      const extra = !isNegativeOrEmpty(f3) ? `, featuring ${f3}` : "";
      subjectDescription = `a 2D flat ${item} ${style}${color}${extra}`.replace(/\s+/g, " ").trim();
      break;
    }
    case "freeform":
    default: {
      const idea = s || "a creative design";
      const shape = !isNegativeOrEmpty(f1) ? `featuring ${f1}` : "";
      const pal = !isNegativeOrEmpty(f2) ? `, in ${f2}` : "";
      const touch = !isNegativeOrEmpty(f3) ? `, with ${f3}` : "";
      subjectDescription = `a creative 2D charm of ${idea} ${shape}${pal}${touch}`.replace(/\s+/g, " ").trim();
      break;
    }
  }

  // Khung sườn kỹ thuật 2D Acrylic Keychain chuẩn xưởng chế tác
  return `a cute custom acrylic keychain charm of an adorable 2D anime chibi character: ${subjectDescription}, clear transparent laser-cut die-cut acrylic border around the character, silver metal keychain ring on top, isolated on pure solid white #FFFFFF background, clean vector sticker art, no other objects, no background clutter, no collage`;
}
