import { AiTryOnAnalysis } from '../types/eyewear';
import { Coordinates } from '../utils/shipping';
import { DiscountCalculationResult, VoucherUsageHistoryItem } from '../utils/voucher';

export async function fetchAiTryOnQuota(userId: string): Promise<{ used: number; limit: number; remaining: number }> {
  const response = await fetch(`/api/v1/ai-tryon/quota?userId=${encodeURIComponent(userId)}`, {
    headers: {
      'x-user-id': userId,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }
  return (await response.json()) as { used: number; limit: number; remaining: number };
}

export async function analyzeFaceForTryOn(params: {
  userId: string;
  imageBase64: string;
  mimeType: string;
  selectedFrameName: string;
}): Promise<AiTryOnAnalysis> {
  const response = await fetch('/api/v1/ai-tryon/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': params.userId,
    },
    body: JSON.stringify({
      imageBase64: params.imageBase64,
      mimeType: params.mimeType,
      selectedFrameName: params.selectedFrameName,
    }),
  });

  if (!response.ok) {
    const errPayload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(errPayload.error ?? `HTTP_${response.status}`);
  }

  return (await response.json()) as AiTryOnAnalysis;
}

export async function calculateServerShipping(coords: Coordinates): Promise<{
  distanceKm: number;
  shippingFee: number;
  tier: string;
}> {
  const response = await fetch('/api/v1/shipping/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coords),
  });
  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }
  return (await response.json()) as { distanceKm: number; shippingFee: number; tier: string };
}

export async function validateServerVoucher(params: {
  voucherCode?: string;
  subtotal: number;
  totalQuantity: number;
  userId?: string;
  customerEmail: string;
  customerPhone: string;
  usageHistory: VoucherUsageHistoryItem[];
}): Promise<DiscountCalculationResult> {
  const response = await fetch('/api/v1/vouchers/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }
  return (await response.json()) as DiscountCalculationResult;
}

export async function dispatchOrderConfirmationEmail(params: {
  orderCode: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentMethod: string;
}): Promise<{ dispatched: boolean; mode: string }> {
  const response = await fetch('/api/v1/notifications/send-order-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    return { dispatched: false, mode: 'QUEUE_FALLBACK' };
  }
  return (await response.json()) as { dispatched: boolean; mode: string };
}
