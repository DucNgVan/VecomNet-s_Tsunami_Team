import { TraceBatch } from "@/types";

export const TRACE_BATCHES: TraceBatch[] = [
  {
    batchId: "NET-VN-DN-2024-082",
    seaRegion: "Rạn San Hô Nam Ô, Vịnh Đà Nẵng",
    locationDetails: "Tọa độ 16°08'42.1\"N 108°08'15.4\"E, độ sâu 18m",
    coordinates: {
      lat: 16.145028,
      lng: 108.137611,
    },
    recoveryDate: "15/08/2024",
    plasticRecoveredKg: 3420,
    marineAnimalsSavedCount: 47,
    depthMeters: 18,
    recoveryTeam: "Biệt Đội Thợ Lặn Bảo Tồn Biển Sơn Trà & NÉT Ocean Labs",
    verificationHash: "0x7f9a2b84c391d1e4e2098bc5630a9e7f891048b8",
    images: [
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=1000&q=80",
    ],
    story:
      "Lô rác lưới ma khổng lồ mắc kẹt trên rạn san hô Nam Ô hơn 3 năm, làm ngạt thở các dải san hô vàng và đe dọa đàn cá ngựa. Nhóm 14 thợ lặn chuyên nghiệp đã cắt gỡ liên tục trong 4 ngày, trục vớt 3.42 tấn lưới cước nilon siêu bền và đưa về nhà máy tuyển lựa.",
  },
  {
    batchId: "NET-VN-PQ-2024-091",
    seaRegion: "Quần Đảo Thổ Chu & An Thới, Phú Quốc",
    locationDetails: "Tọa độ 09°58'31.0\"N 103°59'48.0\"E, độ sâu 24m",
    coordinates: {
      lat: 9.975278,
      lng: 103.996667,
    },
    recoveryDate: "28/08/2024",
    plasticRecoveredKg: 4850,
    marineAnimalsSavedCount: 68,
    depthMeters: 24,
    recoveryTeam: "Phú Quốc Marine Life Rescue & NÉT Volunteers",
    verificationHash: "0x3e18a994cb9201f98ac980287df5621ca0938b81",
    images: [
      "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
    ],
    story:
      "Vớt được 4.85 tấn lưới giã cào trôi nổi ở hải lưu Tây Nam. Giải cứu thành công 3 cá thể đồi mồi quý hiếm bị quấn chặt chân chèo và bàn giao cho Trạm cứu hộ động vật hoang dã Vườn quốc gia Phú Quốc.",
  },
  {
    batchId: "NET-VN-CD-2024-104",
    seaRegion: "Khu Bảo Tồn Biển Hòn Bảy Cạnh, Côn Đảo",
    locationDetails: "Tọa độ 08°39'45.0\"N 106°40'12.0\"E, độ sâu 15m",
    coordinates: {
      lat: 8.6625,
      lng: 106.67,
    },
    recoveryDate: "10/09/2024",
    plasticRecoveredKg: 2190,
    marineAnimalsSavedCount: 35,
    depthMeters: 15,
    recoveryTeam: "Biệt Đội Kiểm Lâm Côn Đảo & NÉT Eco-Artisans",
    verificationHash: "0x9812fc44a98dbcc210874e50882e391bda828751",
    images: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80",
    ],
    story:
      "Khu vực bãi đẻ trọng yếu của rùa biển Việt Nam. Lưới cước trôi dạt đe dọa các cá thể rùa mẹ lên bờ sinh sản đã được thu gom hoàn toàn, phục hồi nguyên trạng thềm cát tinh khiết.",
  },
];

export const TOTAL_IMPACT_STATS = {
  totalPlasticDivertedKg: 10460,
  ghostNetsRecoveredKm: 142.8,
  marineCreaturesSaved: 150,
  co2EmissionsReducedKg: 24800,
  artisanHoursInvested: 6400,
};
