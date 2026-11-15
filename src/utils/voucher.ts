export interface VoucherUsageHistoryItem {
  voucherCode: string;
  userId?: string;
  customerEmail: string;
  customerPhone: string;
  usedYear: number;
}

export interface VoucherDefinition {
  code: string;
  discountPercent: number;
  isFirstOrderOnly: boolean;
  isHolidaySpecial: boolean;
  validUntil: string;
  descriptionVi: string;
  descriptionEn: string;
}

export interface DiscountCalculationInput {
  voucherCode?: string;
  subtotal: number;
  totalQuantity: number;
  userId?: string;
  customerEmail: string;
  customerPhone: string;
  usageHistory: VoucherUsageHistoryItem[];
  currentDate?: Date;
}

export interface DiscountCalculationResult {
  isValid: boolean;
  appliedCode: string | null;
  discountAmount: number;
  appliedRule: 'NONE' | 'BULK_10' | 'VIP_15' | 'VOUCHER_10' | 'VOUCHER_20';
  errorCode?:
    | 'INVALID_VOUCHER'
    | 'EXPIRED_VOUCHER'
    | 'LIFETIME_VOUCHER_USED'
    | 'HOLIDAY_VOUCHER_USED_THIS_YEAR';
  lockedUntilYear?: number;
}

export const VOUCHER_CATALOG: VoucherDefinition[] = [
  {
    code: 'EYEWEAR10',
    discountPercent: 10,
    isFirstOrderOnly: true,
    isHolidaySpecial: false,
    validUntil: '2028-12-31T23:59:59Z',
    descriptionVi: 'Chào bạn mới — Giảm 10% (1 lần duy nhất mỗi khách hàng)',
    descriptionEn: 'Welcome gift — 10% off (once per customer lifetime)',
  },
  {
    code: 'TET2026',
    discountPercent: 20,
    isFirstOrderOnly: false,
    isHolidaySpecial: true,
    validUntil: '2028-12-31T23:59:59Z',
    descriptionVi: 'Ưu đãi Dịp Lễ — Giảm 20% (1 lần mỗi năm dương lịch)',
    descriptionEn: 'Holiday Special — 20% off (once per calendar year)',
  },
];

export function normalizeVoucherCode(rawCode: string): string {
  const upper = rawCode.trim().toUpperCase();
  // Legacy campaign alias ROSE10 maps directly to EYEWEAR10
  if (upper === 'ROSE10') return 'EYEWEAR10';
  if (upper === 'HOLIDAY20') return 'TET2026';
  return upper;
}

export function isHolidayVoucherUsedInCurrentYear(
  code: string,
  identity: { userId?: string; email: string; phone: string },
  usageHistory: VoucherUsageHistoryItem[],
  currentYear: number
): boolean {
  const normalized = normalizeVoucherCode(code);
  const normEmail = identity.email.trim().toLowerCase();
  const normPhone = identity.phone.trim();

  return usageHistory.some((item) => {
    const itemCode = normalizeVoucherCode(item.voucherCode);
    if (itemCode !== normalized || item.usedYear !== currentYear) return false;
    return (
      (Boolean(identity.userId) && item.userId === identity.userId) ||
      (Boolean(normEmail) && item.customerEmail.trim().toLowerCase() === normEmail) ||
      (Boolean(normPhone) && item.customerPhone.trim() === normPhone)
    );
  });
}

export function calculateDiscountBreakdown(input: DiscountCalculationInput): DiscountCalculationResult {
  const now = input.currentDate ?? new Date();
  const currentYear = now.getFullYear();

  let autoDiscount = 0;
  let autoRule: 'NONE' | 'BULK_10' | 'VIP_15' = 'NONE';

  if (input.subtotal >= 2_000_000) {
    autoDiscount = Math.round(input.subtotal * 0.15);
    autoRule = 'VIP_15';
  } else if (input.totalQuantity >= 2) {
    autoDiscount = Math.round(input.subtotal * 0.1);
    autoRule = 'BULK_10';
  }

  const rawCode = (input.voucherCode ?? '').trim();
  if (!rawCode) {
    return {
      isValid: true,
      appliedCode: null,
      discountAmount: autoDiscount,
      appliedRule: autoRule,
    };
  }

  const normalized = normalizeVoucherCode(rawCode);
  const voucher = VOUCHER_CATALOG.find((v) => v.code === normalized);

  if (!voucher) {
    return {
      isValid: false,
      appliedCode: null,
      discountAmount: autoDiscount,
      appliedRule: autoRule,
      errorCode: 'INVALID_VOUCHER',
    };
  }

  if (now.getTime() > new Date(voucher.validUntil).getTime()) {
    return {
      isValid: false,
      appliedCode: null,
      discountAmount: autoDiscount,
      appliedRule: autoRule,
      errorCode: 'EXPIRED_VOUCHER',
    };
  }

  const normEmail = input.customerEmail.trim().toLowerCase();
  const normPhone = input.customerPhone.trim();

  const matchingRecords = input.usageHistory.filter((record) => {
    if (normalizeVoucherCode(record.voucherCode) !== normalized) return false;
    return (
      (Boolean(input.userId) && record.userId === input.userId) ||
      (Boolean(normEmail) && record.customerEmail.trim().toLowerCase() === normEmail) ||
      (Boolean(normPhone) && record.customerPhone.trim() === normPhone)
    );
  });

  if (voucher.isFirstOrderOnly && matchingRecords.length > 0) {
    return {
      isValid: false,
      appliedCode: null,
      discountAmount: autoDiscount,
      appliedRule: autoRule,
      errorCode: 'LIFETIME_VOUCHER_USED',
    };
  }

  if (
    voucher.isHolidaySpecial &&
    isHolidayVoucherUsedInCurrentYear(
      normalized,
      { userId: input.userId, email: normEmail, phone: normPhone },
      input.usageHistory,
      currentYear
    )
  ) {
    return {
      isValid: false,
      appliedCode: null,
      discountAmount: autoDiscount,
      appliedRule: autoRule,
      errorCode: 'HOLIDAY_VOUCHER_USED_THIS_YEAR',
      lockedUntilYear: currentYear + 1,
    };
  }

  const voucherDiscount = Math.round(input.subtotal * (voucher.discountPercent / 100));
  if (voucherDiscount >= autoDiscount) {
    return {
      isValid: true,
      appliedCode: voucher.code,
      discountAmount: voucherDiscount,
      appliedRule: voucher.discountPercent === 20 ? 'VOUCHER_20' : 'VOUCHER_10',
    };
  }

  return {
    isValid: true,
    appliedCode: null,
    discountAmount: autoDiscount,
    appliedRule: autoRule,
  };
}
