export enum FaceShape {
  ALL = 'ALL',
  ROUND = 'ROUND',
  SQUARE = 'SQUARE',
  OVAL = 'OVAL',
  LONG = 'LONG',
}

export enum FrameStyle {
  ALL = 'ALL',
  SQUARE = 'SQUARE',
  ROUND = 'ROUND',
  CAT_EYE = 'CAT_EYE',
  AVIATOR = 'AVIATOR',
  RIMLESS = 'RIMLESS',
  BROWLINE = 'BROWLINE',
}

export enum FrameMaterial {
  ALL = 'ALL',
  TITANIUM = 'TITANIUM',
  ACETATE = 'ACETATE',
  METAL_PVD = 'METAL_PVD',
  TR90 = 'TR90',
}

export enum GenderTarget {
  ALL = 'ALL',
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNISEX = 'UNISEX',
  KIDS = 'KIDS',
}

export enum ColorTone {
  ALL = 'ALL',
  BLACK = 'BLACK',
  TORTOISE = 'TORTOISE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  ROSE = 'ROSE',
  CLEAR_CRYSTAL = 'CLEAR_CRYSTAL',
}

export enum PriceRange {
  ALL = 'ALL',
  UNDER_500K = 'UNDER_500K',
  BETWEEN_500K_1M = 'BETWEEN_500K_1M',
  BETWEEN_1M_2M = 'BETWEEN_1M_2M',
  OVER_2M = 'OVER_2M',
}

export enum LensOptionType {
  FRAME_ONLY = 'FRAME_ONLY',
  BLUE_LIGHT = 'BLUE_LIGHT',
  PHOTOCHROMIC = 'PHOTOCHROMIC',
  PRESCRIPTION = 'PRESCRIPTION',
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export enum PaymentMethod {
  QR_CODE = 'QR_CODE',
  COD = 'COD',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ARRANGING = 'ARRANGING',
  READY = 'READY',
  SHIPPING = 'SHIPPING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  price: number;
  stock: number;
  frameStyle: Exclude<FrameStyle, FrameStyle.ALL>;
  material: Exclude<FrameMaterial, FrameMaterial.ALL>;
  gender: Exclude<GenderTarget, GenderTarget.ALL>;
  colorTone: Exclude<ColorTone, ColorTone.ALL>;
  suitableFaces: Exclude<FaceShape, FaceShape.ALL>[];
  imageUrl: string;
  frameWidthMm: number;
  bridgeMm: number;
  templeMm: number;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
}

export interface PrescriptionSpec {
  odSph: string;
  odCyl: string;
  odAxis: string;
  osSph: string;
  osCyl: string;
  osAxis: string;
  pdMm: string;
  prescriptionImageUrl?: string;
}

export interface CartItem {
  cartKey: string;
  productId: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  imageUrl: string;
  unitPrice: number;
  lensType: LensOptionType;
  lensPrice: number;
  quantity: number;
  prescription?: PrescriptionSpec;
}

export interface FilterState {
  faceShape: FaceShape;
  frameStyle: FrameStyle;
  material: FrameMaterial;
  gender: GenderTarget;
  colorTone: ColorTone;
  priceRange: PriceRange;
  searchQuery: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  photoURL?: string;
  role: UserRole;
  fcmToken?: string;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  distanceKm: number;
  shippingFee: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  voucherCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  itemsCount: number;
  itemsSummary: string;
  items?: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRecord {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  targetRole: UserRole;
  titleVi: string;
  titleEn: string;
  bodyVi: string;
  bodyEn: string;
  orderCode?: string;
  isRead: boolean;
  createdAt: string;
}

export interface StoreSettings {
  bankId: string;
  accountNo: string;
  accountName: string;
  customQrUrl: string;
  updatedAt: string;
}

export interface AiTryOnAnalysis {
  detectedFaceShape: Exclude<FaceShape, FaceShape.ALL>;
  confidence: number;
  estimatedPdMm: number;
  summaryVi: string;
  summaryEn: string;
  recommendedSlugs: string[];
  remainingQuota: number;
}
