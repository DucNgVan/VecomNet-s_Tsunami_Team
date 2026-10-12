// Danh mục địa giới hành chính Việt Nam & biểu phí vận chuyển chuẩn TMĐT

export interface ProvinceData {
  id: string;
  name: string;
  districts: {
    id: string;
    name: string;
    wards: string[];
  }[];
}

export const VIETNAM_PROVINCES: ProvinceData[] = [
  {
    id: "danang",
    name: "Đà Nẵng",
    districts: [
      {
        id: "haichau",
        name: "Quận Hải Châu",
        wards: [
          "Phường Hải Châu 1",
          "Phường Hải Châu 2",
          "Phường Thạch Thang",
          "Phường Thanh Bình",
          "Phường Thuận Phước",
          "Phường Hòa Thuận Đông",
          "Phường Hòa Thuận Tây",
          "Phường Nam Dương",
          "Phường Phước Ninh",
          "Phường Bình Thuận",
          "Phường Bình Hiên",
          "Phường Hòa Cường Bắc",
          "Phường Hòa Cường Nam",
        ],
      },
      {
        id: "sontra",
        name: "Quận Sơn Trà",
        wards: [
          "Phường An Hải Bắc",
          "Phường An Hải Tây",
          "Phường An Hải Đông",
          "Phường Phước Mỹ",
          "Phường Mân Thái",
          "Phường Thọ Quang",
          "Phường Nại Hiên Đông",
        ],
      },
      {
        id: "nguhanhson",
        name: "Quận Ngũ Hành Sơn",
        wards: [
          "Phường Mỹ An",
          "Phường Khuê Mỹ",
          "Phường Hòa Quý",
          "Phường Hòa Hải",
        ],
      },
      {
        id: "thanhkhe",
        name: "Quận Thanh Khê",
        wards: [
          "Phường Vĩnh Trung",
          "Phường Tân Chính",
          "Phường Thạc Gián",
          "Phường Chính Gián",
          "Phường Tam Thuận",
          "Phường Xuân Hà",
          "Phường An Khê",
          "Phường Hòa Khê",
          "Phường Thanh Khê Đông",
          "Phường Thanh Khê Tây",
        ],
      },
      {
        id: "lienchieu",
        name: "Quận Liên Chiểu",
        wards: [
          "Phường Hòa Minh",
          "Phường Hòa Khánh Bắc",
          "Phường Hòa Khánh Nam",
          "Phường Hòa Hiệp Bắc",
          "Phường Hòa Hiệp Nam (Làng Nam Ô)",
        ],
      },
      {
        id: "camle",
        name: "Quận Cẩm Lệ",
        wards: [
          "Phường Khuê Trung",
          "Phường Hòa Thọ Đông",
          "Phường Hòa Thọ Tây",
          "Phường Hòa An",
          "Phường Hòa Phát",
          "Phường Hòa Xuân",
        ],
      },
      {
        id: "hoavang",
        name: "Huyện Hòa Vang",
        wards: [
          "Xã Hòa Châu",
          "Xã Hòa Tiến",
          "Xã Hòa Phước",
          "Xã Hòa Phong",
          "Xã Hòa Khương",
          "Xã Hòa Nhơn",
          "Xã Hòa Ninh",
          "Xã Hòa Bắc",
          "Xã Hòa Liên",
        ],
      },
    ],
  },
  {
    id: "hcm",
    name: "Hồ Chí Minh",
    districts: [
      {
        id: "q1",
        name: "Quận 1",
        wards: [
          "Phường Bến Nghé",
          "Phường Bến Thành",
          "Phường Cầu Kho",
          "Phường Cầu Ông Lãnh",
          "Phường Cô Giang",
          "Phường Đa Kao",
          "Phường Nguyễn Cư Trinh",
          "Phường Nguyễn Thái Bình",
          "Phường Phạm Ngũ Lão",
          "Phường Tân Định",
        ],
      },
      {
        id: "q3",
        name: "Quận 3",
        wards: [
          "Phường Võ Thị Sáu",
          "Phường 1",
          "Phường 2",
          "Phường 3",
          "Phường 4",
          "Phường 9",
          "Phường 11",
          "Phường 14",
        ],
      },
      {
        id: "thuduc",
        name: "Thành phố Thủ Đức",
        wards: [
          "Phường Thảo Điền",
          "Phường An Phú",
          "Phường An Khánh",
          "Phường Thủ Thiêm",
          "Phường Hiệp Bình Chánh",
          "Phường Linh Trung",
          "Phường Tăng Nhơn Phú A",
        ],
      },
      {
        id: "q7",
        name: "Quận 7",
        wards: [
          "Phường Tân Phong (Phú Mỹ Hưng)",
          "Phường Tân Phú",
          "Phường Tân Quy",
          "Phường Tân Hưng",
          "Phường Bình Thuận",
        ],
      },
      {
        id: "binhthanh",
        name: "Quận Bình Thạnh",
        wards: [
          "Phường 1",
          "Phường 2",
          "Phường 14",
          "Phường 19",
          "Phường 22",
          "Phường 25",
        ],
      },
      {
        id: "phunhuan",
        name: "Quận Phú Nhuận",
        wards: ["Phường 1", "Phường 2", "Phường 7", "Phường 9", "Phường 15"],
      },
    ],
  },
  {
    id: "hanoi",
    name: "Hà Nội",
    districts: [
      {
        id: "hoankiem",
        name: "Quận Hoàn Kiếm",
        wards: [
          "Phường Tràng Tiền",
          "Phường Hàng Bạc",
          "Phường Hàng Đào",
          "Phường Cửa Đông",
          "Phường Cửa Nam",
          "Phường Lý Thái Tổ",
          "Phường Phan Chu Trinh",
        ],
      },
      {
        id: "badinh",
        name: "Quận Ba Đình",
        wards: [
          "Phường Điện Biên",
          "Phường Đội Cấn",
          "Phường Giảng Võ",
          "Phường Kim Mã",
          "Phường Liễu Giai",
          "Phường Ngọc Hà",
        ],
      },
      {
        id: "tayho",
        name: "Quận Tây Hồ",
        wards: [
          "Phường Quảng An",
          "Phường Xuân La",
          "Phường Yên Phụ",
          "Phường Tứ Liên",
          "Phường Nhật Tân",
        ],
      },
      {
        id: "caugiay",
        name: "Quận Cầu Giấy",
        wards: [
          "Phường Dịch Vọng",
          "Phường Dịch Vọng Hậu",
          "Phường Mai Dịch",
          "Phường Nghĩa Đô",
          "Phường Nghĩa Tân",
          "Phường Quan Hoa",
          "Phường Trung Hòa",
        ],
      },
      {
        id: "dongda",
        name: "Quận Đống Đa",
        wards: [
          "Phường Cát Linh",
          "Phường Hàng Bột",
          "Phường Láng Hạ",
          "Phường Láng Thượng",
          "Phường Ô Chợ Dừa",
        ],
      },
      {
        id: "haibatrung",
        name: "Quận Hai Bà Trưng",
        wards: [
          "Phường Bách Khoa",
          "Phường Bạch Đằng",
          "Phường Lê Đại Hành",
          "Phường Minh Khai",
          "Phường Vĩnh Tuy",
        ],
      },
    ],
  },
  {
    id: "quangnam",
    name: "Quảng Nam",
    districts: [
      {
        id: "hoian",
        name: "Thành phố Hội An",
        wards: [
          "Phường Minh An (Phố Cổ)",
          "Phường Cẩm Phô",
          "Phường Cẩm Nam",
          "Phường Cẩm Châu",
          "Phường Cẩm An (Biển An Bàng)",
          "Phường Cửa Đại",
          "Xã Tân Hiệp (Đảo Cù Lao Chàm)",
        ],
      },
      {
        id: "tamky",
        name: "Thành phố Tam Kỳ",
        wards: ["Phường An Mỹ", "Phường An Xuân", "Phường Hòa Thuận", "Phường Tân Thạnh"],
      },
    ],
  },
  {
    id: "khanhhoa",
    name: "Khánh Hòa",
    districts: [
      {
        id: "nhatrang",
        name: "Thành phố Nha Trang",
        wards: [
          "Phường Lộc Thọ",
          "Phường Vĩnh Nguyên",
          "Phường Vĩnh Hải",
          "Phường Phước Hải",
          "Phường Tân Lập",
        ],
      },
      {
        id: "camranh",
        name: "Thành phố Cam Ranh",
        wards: ["Phường Ba Ngòi", "Phường Cam Lợi", "Phường Cam Linh"],
      },
    ],
  },
  {
    id: "bariavungtau",
    name: "Bà Rịa - Vũng Tàu",
    districts: [
      {
        id: "vungtau",
        name: "Thành phố Vũng Tàu",
        wards: ["Phường 1", "Phường 2", "Phường Thắng Tam", "Phường Nguyễn An Ninh"],
      },
      {
        id: "condao",
        name: "Huyện Côn Đảo",
        wards: ["Thị trấn Côn Đảo", "Khu dân cư 1", "Khu dân cư 2", "Khu dân cư 7"],
      },
    ],
  },
  {
    id: "haiphong",
    name: "Hải Phòng",
    districts: [
      {
        id: "hongbang",
        name: "Quận Hồng Bàng",
        wards: ["Phường Hoàng Văn Thụ", "Phường Minh Khai", "Phường Phan Bội Châu"],
      },
      {
        id: "catba",
        name: "Huyện Cát Hải (Cát Bà)",
        wards: ["Thị trấn Cát Bà", "Xã Trân Châu", "Xã Việt Hải"],
      },
    ],
  },
  {
    id: "cantho",
    name: "Cần Thơ",
    districts: [
      {
        id: "ninhkieu",
        name: "Quận Ninh Kiều",
        wards: ["Phường Tân An", "Phường An Cư", "Phường Cái Khế", "Phường Xuân Khánh"],
      },
    ],
  },
  {
    id: "binhduong",
    name: "Bình Dương",
    districts: [
      {
        id: "thudaumot",
        name: "Thành phố Thủ Dầu Một",
        wards: ["Phường Phú Cường", "Phường Hiệp Thành", "Phường Phú Hòa"],
      },
    ],
  },
  {
    id: "kiengiang",
    name: "Kiên Giang",
    districts: [
      {
        id: "phuquoc",
        name: "Thành phố Phú Quốc",
        wards: [
          "Phường Dương Đông",
          "Phường An Thới",
          "Xã Gành Dầu",
          "Xã Cửa Cạn",
          "Xã Hàm Ninh",
        ],
      },
    ],
  },
  {
    id: "hue",
    name: "Thừa Thiên Huế",
    districts: [
      {
        id: "tp_hue",
        name: "Thành phố Huế",
        wards: ["Phường Vĩnh Ninh", "Phường Phú Hội", "Phường Thuận Thành", "Phường Kim Long"],
      },
    ],
  },
];

// Các tỉnh thành mở rộng khác của Việt Nam
export const OTHER_PROVINCES = [
  "An Giang", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", 
  "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", 
  "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", 
  "Hậu Giang", "Hòa Bình", "Hưng Yên", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", 
  "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", 
  "Phú Yên", "Quảng Bình", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", 
  "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Tiền Giang", 
  "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

// Tính phí vận chuyển tự động
export function calculateShippingFee(subtotal: number, provinceName: string): number {
  if (subtotal >= 1500000) {
    return 0; // Miễn phí vận chuyển cho đơn hàng từ 1.5 triệu
  }
  if (provinceName === "Đà Nẵng") {
    return 20000; // Nội thành xưởng sản xuất
  }
  return 35000; // Giao hàng tiêu chuẩn toàn quốc
}
