import { StoryQuizRecommendation } from "@/types";
import { CHARMS } from "@/data/products";

export interface QuizQuestionOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
}

export interface QuizQuestion {
  id: "vibe" | "memory" | "intention";
  stepNumber: number;
  question: string;
  description: string;
  options: QuizQuestionOption[];
}

export const STORY_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "vibe",
    stepNumber: 1,
    question: "Cảm xúc nào dẫn lối bạn đến vùng biển Đà Nẵng?",
    description: "Chọn năng lượng tâm thức hòa hợp nhất với chuyến hành trình của bạn.",
    options: [
      {
        id: "mythic",
        title: "Năng Lượng Huyền Thoại & Bùng Cháy",
        subtitle: "Khát khao chuyển mình mạnh mẽ, đón nguồn sinh khí thịnh vượng.",
        icon: "🔥",
        accentColor: "#f59e0b",
      },
      {
        id: "serene",
        title: "Thanh Bình & Tĩnh Lặng Đại Dương",
        subtitle: "Tìm về tiếng sóng vỗ về, chữa lành tâm hồn và lắng đọng suy tư.",
        icon: "🌊",
        accentColor: "#0284c7",
      },
      {
        id: "guardian",
        title: "Trách Nhiệm Bảo Tồn Sinh Thái Biển",
        subtitle: "Muốn trở thành một phần của hành động cứu lấy rạn san hô và sinh vật biển.",
        icon: "🪸",
        accentColor: "#10b981",
      },
      {
        id: "freedom",
        title: "Tự Do Phóng Khoáng & Khám Phá",
        subtitle: "Lướt gió trên cung đường đèo Hải Vân, đón ngọn hải đăng Sơn Trà.",
        icon: "✨",
        accentColor: "#8b5cf6",
      },
    ],
  },
  {
    id: "memory",
    stepNumber: 2,
    question: "Khoảnh khắc đại dương nào khắc sâu nhất trong tâm trí bạn?",
    description: "Hình ảnh chạm đến cảm xúc thị giác và giác quan của bạn nhiều nhất.",
    options: [
      {
        id: "dragon_fire",
        title: "Rồng Vàng Phun Lửa Bên Bờ Sông Hàn",
        subtitle: "Ánh lửa và làn nước hòa quyện giữa lòng thành phố lung linh về đêm.",
        icon: "🐉",
        accentColor: "#eab308",
      },
      {
        id: "mykhe_dawn",
        title: "Ánh Bình Minh Rực Rỡ Trên Sóng Mỹ Khê",
        subtitle: "Mặt trời đỏ ửng nhô lên từ chân trời xa, phủ hạt cát mịn ánh kim.",
        icon: "🌅",
        accentColor: "#f97316",
      },
      {
        id: "sontra_reef",
        title: "Rạn San Hô & Thảm Rừng Bán Đảo Sơn Trà",
        subtitle: "Làn nước trong vắt màu ngọc bích soi bóng vọoc chà vá chân nâu quý hiếm.",
        icon: "🐢",
        accentColor: "#14b8a6",
      },
      {
        id: "fisherman_rhythm",
        title: "Nhịp Thuyền Thúng Mộc Mạc Của Ngư Dân Làng Chài",
        subtitle: "Những giọt mồ hôi và nụ cười đôn hậu bên mẻ lưới vừa cập bến.",
        icon: "🛶",
        accentColor: "#0ea5e9",
      },
    ],
  },
  {
    id: "intention",
    stepNumber: 3,
    question: "Bạn muốn kỷ vật đồng hành mang theo thông điệp gì?",
    description: "Lời nhắn nhủ từ đại dương đồng hành cùng bạn trên mọi hành trình tương lai.",
    options: [
      {
        id: "resilience",
        title: "Sự Kiên Định & Bản Lĩnh Vươn Khơi",
        subtitle: "Giữ vững tay chèo, biến mọi thử thách thành sức mạnh tái sinh bất diệt.",
        icon: "🛡️",
        accentColor: "#eab308",
      },
      {
        id: "harmony",
        title: "Tình Yêu Tự Nhiên & Tinh Thần Hồi Sinh",
        subtitle: "Đồng điệu cùng nhịp thở đất trời, gieo mầm sống xanh cho thế hệ mai sau.",
        icon: "🌱",
        accentColor: "#10b981",
      },
      {
        id: "fortune",
        title: "May Mắn, Bình An & Năng Lượng Chữa Lành",
        subtitle: "Giữ tâm trí sáng trong như giọt lân tinh, thu hút điều thiện lành may mắn.",
        icon: "💎",
        accentColor: "#38bdf8",
      },
      {
        id: "limitless",
        title: "Khát Vọng Tự Do & Khám Phá Vô Tận",
        subtitle: "Không bao giờ ngừng bước, mở rộng tầm nhìn như chân trời biển rộng.",
        icon: "🧭",
        accentColor: "#6366f1",
      },
    ],
  },
];

export function generateStoryRecommendation(
  vibeId: string,
  memoryId: string,
  intentionId: string
): StoryQuizRecommendation {
  const vibeOpt =
    STORY_QUIZ_QUESTIONS[0].options.find((o) => o.id === vibeId) ||
    STORY_QUIZ_QUESTIONS[0].options[0];
  const memOpt =
    STORY_QUIZ_QUESTIONS[1].options.find((o) => o.id === memoryId) ||
    STORY_QUIZ_QUESTIONS[1].options[0];
  const intOpt =
    STORY_QUIZ_QUESTIONS[2].options.find((o) => o.id === intentionId) ||
    STORY_QUIZ_QUESTIONS[2].options[0];

  let recommendedCharmIds: string[] = [];
  let suggestedAnchors: { charmId: string; anchorId: string }[] = [];
  let title = "Vũ Điệu Biển Khơi Đà Nẵng";
  let poeticDedication = "";

  if (memoryId === "dragon_fire" || vibeId === "mythic") {
    recommendedCharmIds = ["charm-caurong", "charm-bioluminescent-drop", "charm-dolphin"];
    suggestedAnchors = [
      { charmId: "charm-caurong", anchorId: "a2" }, // Tâm trên cao
      { charmId: "charm-bioluminescent-drop", anchorId: "a5" }, // Trung tâm túi
      { charmId: "charm-dolphin", anchorId: "a8" }, // Trọng tâm dưới
    ];
    title = "Hộ Thần Sông Hàn & Rồng Lửa Vươn Khơi";
    poeticDedication =
      "Được tôi luyện từ ánh lửa kiêu hùng của Rồng thiêng Đà Nẵng và thắt chặt bởi sợi lưới đại dương kiên cường, thiết kế này trao cho bạn bản lĩnh vững vàng trước mọi phong ba.";
  } else if (memoryId === "sontra_reef" || vibeId === "guardian") {
    recommendedCharmIds = ["charm-turtle", "charm-starfish", "charm-bioluminescent-drop"];
    suggestedAnchors = [
      { charmId: "charm-turtle", anchorId: "a2" },
      { charmId: "charm-starfish", anchorId: "a5" },
      { charmId: "charm-bioluminescent-drop", anchorId: "a8" },
    ];
    title = "Sứ Giả Hồi Sinh San Hô Sơn Trà";
    poeticDedication =
      "Mỗi nút thắt là một hơi thở san hô được giải phóng. Chiếc túi của bạn mang linh hồn của loài rùa biển tự do, gìn giữ sắc xanh ngọc bích nguyên sơ của vịnh Đà Nẵng.";
  } else if (memoryId === "mykhe_dawn" || vibeId === "serene") {
    recommendedCharmIds = ["charm-bioluminescent-drop", "charm-dolphin", "charm-starfish"];
    suggestedAnchors = [
      { charmId: "charm-bioluminescent-drop", anchorId: "a2" },
      { charmId: "charm-dolphin", anchorId: "a5" },
      { charmId: "charm-starfish", anchorId: "a8" },
    ];
    title = "Bình Minh Mỹ Khê & Giọt Sóng Chữa Lành";
    poeticDedication =
      "Thu giữ ánh ban mai rực rỡ và những bọt sóng vỗ về của biển Mỹ Khê, chiếc túi là chiếc neo bình yên cho tâm hồn bạn giữa nhịp sống hối hả đời thường.";
  } else {
    recommendedCharmIds = ["charm-whale-tail", "charm-dolphin", "charm-caurong"];
    suggestedAnchors = [
      { charmId: "charm-whale-tail", anchorId: "a2" },
      { charmId: "charm-dolphin", anchorId: "a5" },
      { charmId: "charm-caurong", anchorId: "a8" },
    ];
    title = "Khát Vọng Tự Do Hải Trình Vô Tận";
    poeticDedication =
      "Hòa cùng nhịp thở kiên cường của ngư dân làng chài và sức mạnh vô song của cá voi đại dương, tác phẩm này là lời chúc mở lối cho những chân trời thênh thang phía trước.";
  }

  // Calculate environmental impact from selected charms + base bag
  const baseBagOffset = 1.6; // kg
  const charmsOffsetGrams = recommendedCharmIds.reduce((sum, id) => {
    const c = CHARMS.find((item) => item.id === id);
    return sum + (c ? c.plasticOffsetGrams : 250);
  }, 0);
  const totalOffsetKg = Number((baseBagOffset + charmsOffsetGrams / 1000).toFixed(2));

  return {
    vibe: vibeOpt.title,
    memory: memOpt.title,
    intention: intOpt.title,
    title,
    poeticDedication,
    recommendedCharmIds,
    suggestedAnchors,
    impactEstimateKg: totalOffsetKg,
  };
}
