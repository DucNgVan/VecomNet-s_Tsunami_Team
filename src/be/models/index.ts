// ============================================================================
// NÉT BACKEND MODELS & DATA CONTRACTS
// Thư mục BE: Định nghĩa cấu trúc dữ liệu cho toàn bộ máy chủ backend
// ============================================================================

export interface BackendProduct {
  id: string;
  name: string;
  category: "tote" | "bucket" | "crossbody" | "clutch" | "accessories" | "custom";
  basePrice: number;
  description: string;
  plasticOffsetKg: number;
  coralProtectedSqM: number;
  co2AvoidedKg: number;
  imageUrl: string;
  model3dUrl?: string;
  defaultColor: string;
  availableColors: {
    id: string;
    name: string;
    hex: string;
    story: string;
  }[];
  inStock: boolean;
  stockCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendOrderItem {
  cartItemId: string;
  bagBaseId?: string;
  type: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  plasticOffsetKg: number;
  details?: {
    colorName?: string;
    charmsCount?: number;
    charmsList?: string[];
    configuration?: any;
  };
}

export interface BackendCustomer {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes?: string;
}

export interface BackendOrder {
  orderId: string;
  orderCode: string;
  createdAt: string;
  customer: BackendCustomer;
  items: BackendOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  totalPlasticOffsetKg: number;
  assignedBatchId: string;
  assignedBagSerialId?: string | null;
  paymentMethod: "cod" | "vnpay" | "momo" | "bank_transfer";
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded";
  fulfillmentStatus: "received" | "crafting" | "quality_check" | "delivering" | "delivered" | "cancelled";
  userId?: string;
  vietQr?: {
    qrUrl: string;
    bankName: string;
    accountNo: string;
    accountHolder: string;
    transferMemo: string;
    amount: number;
  };
  paidAt?: string;
  notes?: string;
}

export interface BackendInventoryItem {
  serialId: string;
  sourcePackId: string;
  bagBaseId: string;
  bagName: string;
  colorId?: string;
  colorName: string;
  manufacturedAt: string;
  workshopName: string;
  seaRegion: string;
  coordinates: { lat: number; lng: number };
  plasticConsumedKg: number;
  status: "in_stock" | "assigned_to_order" | "delivered";
  assignedOrderCode?: string;
  qrUrl: string;
  barcode: string;
  nfcTagUid: string;
  isClaimed: boolean;
  warrantyStatus: "unactivated" | "active" | "expired";
  warrantyMonths: number;
  warrantyActivatedAt?: string;
  warrantyExpiresAt?: string;
  claimedBy?: {
    fullName: string;
    phone: string;
    email?: string;
  };
}

export interface BackendNetPack {
  packId: string;
  seaRegion: string;
  locationDetails: string;
  coordinates: { lat: number; lng: number };
  recoveryDate: string;
  totalWeightKg: number;
  remainingWeightKg: number;
  depthMeters: number;
  diverTeam: string;
  netPolymer: string;
  status: "recovered" | "in_production" | "depleted";
  notes?: string;
  createdAt: string;
  producedBagModel?: string;
  producedBagCount?: number;
  serialRangeStart?: string;
  serialRangeEnd?: string;
  barcodeRangeStart?: string;
  barcodeRangeEnd?: string;
}
