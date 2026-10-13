import { Article } from "@/types";

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

export const INITIAL_ARTICLES: Article[] = [
  {
    id: "art-son-tra-rescue",
    slug: "giai-cuu-ran-san-ho-son-tra",
    title: "Hành Trình Giải Cứu 65kg Lưới Ma Tại Rạn Bãi Bụt - Sơn Trà",
    subtitle: "Nhật ký thám hiểm độ sâu 24m cùng đội lặn tình nguyện Đà Nẵng SAS",
    excerpt:
      "Đội ngũ thợ lặn tình nguyện chuyên nghiệp lặn sâu 24m, dùng kéo định vị cắt rời mảng lưới cước trùm lên rạn san hô sừng hươu đang bị nghẹt thở.",
    content:
      "Dưới làn nước xanh ngắt của bán đảo Sơn Trà, một mảng lưới rê vô chủ dài gần 50 mét đã vướng chặt vào rạn san hô sừng hươu cổ thụ suốt nhiều tháng. Những mắt lưới cước sắc lẹm siết chặt, chặn ánh sáng mặt trời và biến rạn san hô thành một 'chiếc bẫy tử thần' vô hình.\n\nSau 4 giờ lặn cẩn trọng ở độ sâu 24 mét, nhóm thợ lặn Đà Nẵng SAS cùng NÉT đã cắt rời thành công 65kg lưới ma mà không làm gãy một nhánh san hô nào. Toàn bộ lượng lưới này lập tức được đưa về trạm xưởng Nam Ô để bắt đầu hành trình tái sinh thành những chiếc túi thời trang bền vững.",
    coverImage: "/assets/products/tote-blue.png",
    category: "rescue_log",
    authorName: "Đội Lặn NÉT & Đà Nẵng SAS",
    readingTimeMinutes: 4,
    published: true,
    featured: true,
    publishedAt: "2026-10-08",
    tags: ["Trục Vớt", "Sơn Trà", "San Hô", "Nét Xanh"],
  },
  {
    id: "art-nam-o-artisans",
    slug: "chuyen-lang-nghe-dan-luoi-nam-o",
    title: "Ký Sự Làng Nghề Nam Ô: Bàn Tay Nghệ Nhân Thổi Hồn Vào Sợi Cước Tái Sinh",
    subtitle: "Sự kết hợp giữa bí quyết dệt lưới nghìn đời và thiết kế thời trang hiện đại",
    excerpt:
      "Hơn 80 nghệ nhân đan lát truyền thống biến kỹ thuật mắt lưới tổ ong thành các phom túi thời trang sang trọng và bền chắc qua nhiều thập kỷ.",
    content:
      "Làng chài Nam Ô nép mình bên chân đèo Hải Vân nổi tiếng với truyền thống đi biển và nghề đan vá lưới đánh cá truyền đời. Khi nghề cá dần thay đổi, nhiều nghệ nhân lớn tuổi đối mặt với nguy cơ mai một nghề tổ.\n\nDự án NÉT ra đời đã mở ra một hướng đi mới: Sợi nylon sau khi được kéo tinh chế từ lưới ma được chuyển trực tiếp về các hộ nghệ nhân. Với đôi bàn tay thuần thục, các cô bác nghệ nhân đan từng mắt lưới tổ ong chịu lực gấp 3 lần bình thường, tạo nên phom dáng độc bản không chiếc nào giống chiếc nào.",
    coverImage: "/assets/products/crossbody-sand.png",
    category: "artisan_story",
    authorName: "Ban Biên Tập NÉT Craft",
    readingTimeMinutes: 5,
    published: true,
    featured: true,
    publishedAt: "2026-10-09",
    tags: ["Nghệ Nhân", "Nam Ô", "Thủ Công", "Văn Hóa"],
  },
  {
    id: "art-ghost-net-crisis",
    slug: "hiem-hoa-luoi-ma-dai-duong",
    title: "Tại Sao 'Lưới Ma' Lại Nguy Hiểm Gấp 10 Lần Rác Thải Nhựa Thông Thường?",
    subtitle: "Vòng lặp tử thần kéo dài 600 năm dưới đáy biển sâu",
    excerpt:
      "Ngư cụ vô chủ không tự tiêu hủy mà liên tục bẫy bắt sinh vật biển trong một vòng lặp tàn khốc nếu không có bàn tay con người can thiệp.",
    content:
      "Theo ước tính của Liên Hợp Quốc, mỗi năm có hơn 640.000 tấn ngư cụ bị bỏ lại hoặc trôi dạt trên các đại dương toàn cầu. Khác với túi nylon thông thường, lưới đánh cá được sản xuất từ sợi nhựa kỹ thuật cao cấp (Nylon-6 và Polyethylene) cực kỳ bền chắc, có tuổi thọ phân rã lên tới hơn 600 năm.\n\nKhi chìm xuống đáy biển, lưới ma tiếp tục 'đánh bắt vô tội vạ': cá vướng vào chết, xác cá lại thu hút rùa biển và chim biển đến ăn, khiến chúng tiếp tục mắc bẫy. Việc thu gom và tái sinh lưới ma chính là cách nhanh nhất để cứu sống trực tiếp các hệ sinh thái biển.",
    coverImage: "/assets/products/bucket-blue.png",
    category: "eco_news",
    authorName: "Viện Nghiên Cứu Môi Trường Biển",
    readingTimeMinutes: 3,
    published: true,
    featured: false,
    publishedAt: "2026-10-10",
    tags: ["Môi Trường", "Lưới Ma", "ESG", "Đại Dương"],
  },
];
