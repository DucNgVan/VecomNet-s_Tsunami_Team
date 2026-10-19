export type BagMeshColor = {
  id: string;
  name: string;
  hex: string;
  glowHex: string;
  accentHex: string;
  description: string;
};

export type AnchorPoint = {
  id: string;
  x: number; // % 0-100 on the bag grid
  y: number; // % 0-100 on the bag grid
  label: string;
};

export type BagBase = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  basePrice: number;
  plasticOffsetKg: number;
  dimensions: string;
  capacity: string;
  colors: BagMeshColor[];
  anchorPoints: AnchorPoint[];
  maxCharms: number;
  modelType: 'tote' | 'hobo' | 'bucket' | 'mini';
  image: string;
  model3dUrl?: string;
  stockCount?: number;
  inStock?: boolean;
};

export type CharmCategory = 'marine' | 'celestial' | 'geometry' | 'special';

export type Charm = {
  id: string;
  name: string;
  vietnameseName: string;
  category: CharmCategory;
  price: number;
  plasticOffsetGrams: number;
  material: string;
  description: string;
  color: string;
  glowColor: string;
  symbol: string;
  iconName: string;
  model3dUrl?: string;
  image?: string;
  inStock?: boolean;
  stockCount?: number;
};

export type PlacedCharm = {
  instanceId: string;
  charmId: string;
  charm: Charm;
  anchorId: string;
  x: number;
  y: number;
  rotation: number;
};

export type CustomBagConfiguration = {
  id: string;
  bagBase: BagBase;
  selectedColor: BagMeshColor;
  placedCharms: PlacedCharm[];
  totalPrice: number;
  totalPlasticOffsetKg: number;
  customSnapshotUrl?: string;
  customName?: string;
  createdAt: string;
};

export type ProductCombo = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice: number;
  plasticOffsetKg: number;
  bagBase: BagBase;
  color: BagMeshColor;
  includedCharms: Charm[];
  image: string;
  badge?: string;
  inStock?: boolean;
  stockCount?: number;
};

export type CartItemType = 'custom_bag' | 'base_bag' | 'charm_single' | 'combo';

export type CartItem = {
  cartItemId: string;
  type: CartItemType;
  title: string;
  price: number;
  quantity: number;
  image: string;
  plasticOffsetKg: number;
  bagBaseId?: string;
  stockCount?: number;
  details?: {
    colorName?: string;
    charmsCount?: number;
    charmsList?: string[];
    configuration?: CustomBagConfiguration;
  };
};

export type TraceBatch = {
  batchId: string;
  seaRegion: string;
  locationDetails: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  recoveryDate: string;
  plasticRecoveredKg: number;
  marineAnimalsSavedCount: number;
  depthMeters: number;
  recoveryTeam: string;
  verificationHash: string;
  images: string[];
  story: string;
  netPolymer?: string;
  colorway?: string;
  assignedPrototypeSku?: string;
  calculatedYieldBags?: number;
  co2OffsetKg?: number;
  createdAt?: string;
};

export type StoryQuizAnswer = {
  vibe: string;
  memory: string;
  intention: string;
};

export type StoryQuizRecommendation = {
  vibe: string;
  memory: string;
  intention: string;
  title: string;
  poeticDedication: string;
  recommendedCharmIds: string[];
  suggestedAnchors: { charmId: string; anchorId: string }[];
  impactEstimateKg: number;
};

export type Order = {
  orderId: string;
  orderCode: string;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    dob?: string;
    note?: string;
  };
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  totalPlasticOffsetKg: number;
  assignedBatchId: string;
  paymentMethod: 'cod' | 'vnpay' | 'momo' | 'bank_transfer';
  paymentStatus: 'pending' | 'paid';
  fulfillmentStatus: 'received' | 'crafting' | 'quality_check' | 'delivering' | 'delivered' | 'cancelled';
  userId?: string;
  assignedBagSerialId?: string;
  assignedSerialIds?: string[];
  shopDeliveredConfirmed?: boolean;
  shopDeliveredAt?: string;
  customerReceivedConfirmed?: boolean;
  customerReceivedAt?: string;
  isClaimed?: boolean;
  claimedAt?: string;
  claimedByUserId?: string;
};

export type NetPack = {
  packId: string;
  seaRegion: string;
  locationDetails: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  recoveryDate: string;
  totalWeightKg: number;
  remainingWeightKg: number;
  depthMeters: number;
  diverTeam: string;
  netPolymer: string;
  status: 'new' | 'in_production' | 'depleted';
  notes?: string;
  createdAt: string;
  // Factory batch planning & serial allocation
  producedBagModel?: string;
  producedBagCount?: number;
  serialRangeStart?: string;
  serialRangeEnd?: string;
  barcodeRangeStart?: string;
  barcodeRangeEnd?: string;
};

export type ManufacturedBagItem = {
  serialId: string;
  sourcePackId: string;
  bagBaseId: string;
  bagName: string;
  colorId: string;
  colorName: string;
  manufacturedAt: string;
  workshopName: string;
  seaRegion: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  plasticConsumedKg: number;
  status: 'in_stock' | 'assigned_to_order' | 'delivered';
  assignedOrderCode?: string;
  qrUrl: string;
  // Physical Garment Barcode & Digital Passport Warranty Identity
  barcode: string; // 1D Barcode (Code 128 / EAN format: e.g. "893882082001")
  nfcTagUid?: string; // Digital Identity UID / Barcode tag
  isClaimed: boolean; // Has the customer claimed ownership into their account?
  warrantyStatus: 'unactivated' | 'active' | 'expired';
  warrantyMonths: number; // e.g. 24 months
  warrantyActivatedAt?: string; // e.g. "2026-10-10 19:15"
  warrantyExpiresAt?: string; // e.g. "2028-10-10"
  claimedBy?: {
    fullName: string;
    phone: string;
    email?: string;
    customerUid?: string;
  };
};

export type PostCategory =
  | 'rescue_log'
  | 'artisan_story'
  | 'eco_news'
  | 'craft_guide';

export type Article = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: PostCategory;
  authorName: string;
  readingTimeMinutes?: number;
  published: boolean;
  featured?: boolean;
  publishedAt: string;
  updatedAt?: string;
  tags?: string[];
};
