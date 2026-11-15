import { describe, expect, it } from 'vitest';
import { calculateDiscountBreakdown, VoucherUsageHistoryItem } from '../utils/voucher';

describe('Anti-Abuse Promotion & Voucher Engine', () => {
  const history: VoucherUsageHistoryItem[] = [
    {
      voucherCode: 'EYEWEAR10',
      userId: 'user-1',
      customerEmail: 'alice@gmail.com',
      customerPhone: '0901112223',
      usedYear: 2026,
    },
    {
      voucherCode: 'TET2026',
      userId: 'user-1',
      customerEmail: 'alice@gmail.com',
      customerPhone: '0901112223',
      usedYear: 2026,
    },
  ];

  it('blocks EYEWEAR10 / ROSE10 reuse across matching email, phone, or userId', () => {
    const byEmail = calculateDiscountBreakdown({
      voucherCode: 'EYEWEAR10',
      subtotal: 1_000_000,
      totalQuantity: 1,
      userId: 'user-99',
      customerEmail: 'ALICE@gmail.com',
      customerPhone: '0988888888',
      usageHistory: history,
    });
    expect(byEmail.isValid).toBe(false);
    expect(byEmail.errorCode).toBe('LIFETIME_VOUCHER_USED');

    const byAliasPhone = calculateDiscountBreakdown({
      voucherCode: 'ROSE10',
      subtotal: 1_000_000,
      totalQuantity: 1,
      userId: 'user-99',
      customerEmail: 'bob@gmail.com',
      customerPhone: '0901112223',
      usageHistory: history,
    });
    expect(byAliasPhone.isValid).toBe(false);
    expect(byAliasPhone.errorCode).toBe('LIFETIME_VOUCHER_USED');
  });

  it('locks holiday voucher within same calendar year and automatically unlocks on Jan 1 next year', () => {
    const locked2026 = calculateDiscountBreakdown({
      voucherCode: 'TET2026',
      subtotal: 1_000_000,
      totalQuantity: 1,
      userId: 'user-1',
      customerEmail: 'alice@gmail.com',
      customerPhone: '0901112223',
      usageHistory: history,
      currentDate: new Date('2026-11-15T10:00:00Z'),
    });
    expect(locked2026.isValid).toBe(false);
    expect(locked2026.errorCode).toBe('HOLIDAY_VOUCHER_USED_THIS_YEAR');
    expect(locked2026.lockedUntilYear).toBe(2027);

    const unlocked2027 = calculateDiscountBreakdown({
      voucherCode: 'TET2026',
      subtotal: 1_000_000,
      totalQuantity: 1,
      userId: 'user-1',
      customerEmail: 'alice@gmail.com',
      customerPhone: '0901112223',
      usageHistory: history,
      currentDate: new Date('2027-01-01T00:05:00Z'),
    });
    expect(unlocked2027.isValid).toBe(true);
    expect(unlocked2027.discountAmount).toBe(200_000);
  });

  it('applies automatic 10% bulk discount (>= 2 items) and 15% VIP discount (>= 2,000,000 VND)', () => {
    const bulk = calculateDiscountBreakdown({
      subtotal: 1_500_000,
      totalQuantity: 2,
      customerEmail: 'new@gmail.com',
      customerPhone: '0909999999',
      usageHistory: [],
    });
    expect(bulk.appliedRule).toBe('BULK_10');
    expect(bulk.discountAmount).toBe(150_000);

    const vip = calculateDiscountBreakdown({
      subtotal: 2_200_000,
      totalQuantity: 1,
      customerEmail: 'new@gmail.com',
      customerPhone: '0909999999',
      usageHistory: [],
    });
    expect(vip.appliedRule).toBe('VIP_15');
    expect(vip.discountAmount).toBe(330_000);
  });

  it('rejects unknown voucher codes', () => {
    const invalid = calculateDiscountBreakdown({
      voucherCode: 'FAKE99',
      subtotal: 1_000_000,
      totalQuantity: 1,
      customerEmail: 'a@gmail.com',
      customerPhone: '0900000000',
      usageHistory: [],
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errorCode).toBe('INVALID_VOUCHER');
  });
});
