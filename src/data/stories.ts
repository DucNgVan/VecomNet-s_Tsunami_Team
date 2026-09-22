export type StoryStep = {
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  highlight: string;
  icon: string;
};

export const RECYCLING_JOURNEY: StoryStep[] = [
  {
    stepNumber: "01",
    title: "Trục Vớt Lưới Ma Dưới Đáy Biển",
    subtitle: "Ghost Net Extraction",
    description:
      "Mỗi năm, hơn 640.000 tấn ngư cụ vô chủ ('lưới ma') bị bỏ lại dưới đáy biển, tiếp tục bẫy bắt và giết hại hàng triệu sinh vật biển. Đội ngũ thợ lặn chuyên nghiệp của NÉT lặn sâu từ 15-30m, dùng kéo định vị cắt rời các mảng lưới mắc kẹt trên rạn san hô.",
    highlight: "100% trục vớt thủ công không làm tổn hại đến rạn san hô tự nhiên",
    icon: "Anchor",
  },
  {
    stepNumber: "02",
    title: "Phân Loại & Tẩy Rửa Sinh Học",
    subtitle: "De-polymerization & Eco-Washing",
    description:
      "Lưới vớt lên được phân tách theo chất liệu (Nylon 6, Polypropylene, cước đơn). Qua công đoạn làm sạch bằng dung dịch enzym tự nhiên không chứa clo độc hại, loại bỏ rong rêu, muối biển và cặn trầm tích sau nhiều năm chìm sâu.",
    highlight: "Tiết kiệm 85% lượng nước so với quy trình tẩy hóa chất thông thường",
    icon: "Droplets",
  },
  {
    stepNumber: "03",
    title: "Kéo Sợi Tinh Chế Siêu Bền",
    subtitle: "Mechanical Regeneration",
    description:
      "Hạt nhựa tái sinh được đưa vào hệ thống đùn ép nhiệt phân áp suất cao để kéo thành sợi tơ cước Nylon siêu bền, dẻo dai hơn sợi nylon nguyên sinh tới 20% và có khả năng chống tia UV, kháng nước muối tuyệt đối.",
    highlight: "Giảm 70% lượng khí thải carbon so với sản xuất nylon mới từ dầu mỏ",
    icon: "Sparkles",
  },
  {
    stepNumber: "04",
    title: "Đan Thủ Công & Chế Tác Charm Thủy Tinh",
    subtitle: "Luxury Craftsmanship & Glass Fusion",
    description:
      "Dưới bàn tay khéo léo của các nghệ nhân làng nghề dệt lưới truyền thống Việt Nam, từng chiếc túi được đan mắt tổ ong kiên cố. Các charm đính kèm được nấu chảy từ chai thủy tinh và rác vụn biển mạ tráng gương, tạo nên tuyệt tác thời trang bền vững độc bản.",
    highlight: "Tạo việc làm bền vững cho hơn 80 thợ dệt và ngư dân chuyển đổi nghề",
    icon: "Gem",
  },
];
