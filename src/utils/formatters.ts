import { LensOptionType } from '../types/eyewear';

export function formatCurrencyVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
}

export function generateOrderCode(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `KINH-${randomDigits}`;
}

export function buildVietQrImageUrl(params: {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  orderCode: string;
}): string {
  const cleanCode = params.orderCode.replace(/[^a-zA-Z0-9]/g, ' ').trim();
  const addInfo = encodeURIComponent(cleanCode);
  const accountName = encodeURIComponent(params.accountName);
  const amount = Math.max(0, Math.round(params.amount));
  return `https://img.vietqr.io/image/${params.bankId}-${params.accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}

export function getLensAddonPrice(lensType: LensOptionType): number {
  switch (lensType) {
    case LensOptionType.BLUE_LIGHT:
      return 350_000;
    case LensOptionType.PHOTOCHROMIC:
      return 650_000;
    case LensOptionType.PRESCRIPTION:
      return 550_000;
    case LensOptionType.FRAME_ONLY:
    default:
      return 0;
  }
}
