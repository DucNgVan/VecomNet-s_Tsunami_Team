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
  fulfillmentStatus: 'received' | 'crafting' | 'quality_check' | 'delivering' | 'delivered';
  userId?: string;
};
