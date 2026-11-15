import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Copy, Mail, MapPin, QrCode, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { dispatchOrderConfirmationEmail, validateServerVoucher } from '../services/api';
import {
  createOrderInFirestore,
  fetchStoreSettings,
  fetchVoucherUsagesForUser,
} from '../services/firebase';
import { useAppDispatch, useAppSelector } from '../store';
import { openLoginModal } from '../store/slices/authSlice';
import { clearCart } from '../store/slices/cartSlice';
import {
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StoreSettings,
} from '../types/eyewear';
import {
  buildVietQrImageUrl,
  formatCurrencyVnd,
  generateOrderCode,
} from '../utils/formatters';
import {
  calculateUrbanRoadDistanceKm,
  DELIVERY_PRESET_ZONES,
  getShippingFeeByDistance,
} from '../utils/shipping';
import {
  calculateDiscountBreakdown,
  DiscountCalculationResult,
  VoucherUsageHistoryItem,
} from '../utils/voucher';

export function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const isVi = !i18n.language.startsWith('en');

  const { user } = useAppSelector((state) => state.auth);
  const { items } = useAppSelector((state) => state.cart);

  const [customerName, setCustomerName] = useState(user?.displayName ?? '');
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState(DELIVERY_PRESET_ZONES[0].id);

  const [voucherInput, setVoucherInput] = useState('');
  const [usageHistory, setUsageHistory] = useState<VoucherUsageHistoryItem[]>([]);
  const [discountResult, setDiscountResult] = useState<DiscountCalculationResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.QR_CODE);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.displayName);
      setCustomerEmail((prev) => prev || user.email);
      void fetchVoucherUsagesForUser(user.uid)
        .then((history) => setUsageHistory(history))
        .catch(() => setUsageHistory([]));
    }
    void fetchStoreSettings()
      .then((s) => setStoreSettings(s))
      .catch(() => {
        setStoreSettings({
          bankId: 'MB',
          accountNo: '0901234567',
          accountName: 'LUMINA OPTICS STORE',
          customQrUrl: '',
          updatedAt: new Date().toISOString(),
        });
      });
  }, [user]);

  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice + item.lensPrice) * item.quantity,
    0
  );
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const zone =
    DELIVERY_PRESET_ZONES.find((z) => z.id === selectedZoneId) ?? DELIVERY_PRESET_ZONES[0];
  const distanceKm = calculateUrbanRoadDistanceKm(zone.coords);
  const shippingFee = getShippingFeeByDistance(distanceKm);

  const liveDiscount =
    discountResult ??
    calculateDiscountBreakdown({
      subtotal,
      totalQuantity,
      userId: user?.uid,
      customerEmail,
      customerPhone,
      usageHistory,
    });

  const totalAmount = Math.max(0, subtotal - liveDiscount.discountAmount + shippingFee);

  const handleApplyVoucher = async () => {
    const res = await validateServerVoucher({
      voucherCode: voucherInput,
      subtotal,
      totalQuantity,
      userId: user?.uid,
      customerEmail,
      customerPhone,
      usageHistory,
    });
    setDiscountResult(res);
  };

  const handleCopy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      dispatch(openLoginModal('DEFAULT'));
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const serverDiscount = await validateServerVoucher({
        voucherCode: voucherInput,
        subtotal,
        totalQuantity,
        userId: user.uid,
        customerEmail,
        customerPhone,
        usageHistory,
      });

      const finalTotal = Math.max(0, subtotal - serverDiscount.discountAmount + shippingFee);
      const orderCode = generateOrderCode();
      const itemsSummary = items
        .map((i) => `${i.nameVi} x${i.quantity} (${i.lensType})`)
        .join('; ');

      const created = await createOrderInFirestore({
        orderCode,
        userId: user.uid,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        distanceKm,
        shippingFee,
        subtotal,
        discountAmount: serverDiscount.discountAmount,
        totalAmount: finalTotal,
        voucherCode: serverDiscount.appliedCode ?? undefined,
        paymentMethod,
        paymentStatus: PaymentStatus.UNPAID,
        orderStatus: OrderStatus.PENDING,
        itemsCount: totalQuantity,
        itemsSummary,
      });

      await dispatchOrderConfirmationEmail({
        orderCode,
        customerName,
        customerEmail,
        totalAmount: finalTotal,
        paymentMethod,
      });

      dispatch(clearCart());
      setPlacedOrder(created);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : isVi
            ? 'Không thể tạo đơn hàng. Vui lòng thử lại.'
            : 'Unable to create order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    const bankId = storeSettings?.bankId ?? 'MB';
    const accountNo = storeSettings?.accountNo ?? '0901234567';
    const accountName = storeSettings?.accountName ?? 'LUMINA OPTICS STORE';
    const transferRef = placedOrder.orderCode.replace('-', ' ');
    const qrImgUrl =
      storeSettings?.customQrUrl ||
      buildVietQrImageUrl({
        bankId,
        accountNo,
        accountName,
        amount: placedOrder.totalAmount,
        orderCode: transferRef,
      });

    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[#141413]/10 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 text-[#1F3A32]">
            <CheckCircle2 className="h-7 w-7" />
            <h1 className="font-display text-3xl font-semibold text-[#141413]">
              #{placedOrder.orderCode}
            </h1>
          </div>

          <p className="mt-3 flex items-center gap-2 text-xs text-[#5C5A55]">
            <Mail className="h-4 w-4 text-[#1F3A32]" />
            <span>{t('checkout.gmailSent', { email: placedOrder.customerEmail })}</span>
          </p>

          {placedOrder.paymentMethod === PaymentMethod.QR_CODE && (
            <div className="mt-6 grid gap-6 rounded-xl border border-[#1F3A32]/20 bg-[#F7F6F2] p-5 sm:grid-cols-12">
              <div className="flex flex-col items-center justify-center sm:col-span-5">
                <img
                  src={qrImgUrl}
                  alt="QR Payment Code"
                  referrerPolicy="no-referrer"
                  className="h-56 w-56 rounded-xl border border-[#141413]/10 bg-white object-contain p-2"
                />
              </div>
              <div className="space-y-3 sm:col-span-7">
                <h2 className="text-sm font-semibold text-[#141413]">
                  {t('checkout.qrInstructionTitle')}
                </h2>
                <div className="text-xs text-[#5C5A55]">
                  {bankId} · {accountName}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                  <span className="font-mono-tabular font-semibold">{accountNo}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('acct', accountNo)}
                    className="inline-flex items-center gap-1 font-medium text-[#1F3A32] cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedKey === 'acct' ? t('checkout.copied') : t('checkout.copyAccount')}</span>
                  </button>
                </div>

                <div className="text-xs font-medium text-[#5C5A55]">
                  {t('checkout.transferContent')}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                  <span className="font-mono-tabular font-semibold text-[#1F3A32]">
                    {transferRef}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('note', transferRef)}
                    className="inline-flex items-center gap-1 font-medium text-[#1F3A32] cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedKey === 'note' ? t('checkout.copied') : t('checkout.copyNote')}</span>
                  </button>
                </div>

                <div className="font-mono-tabular pt-1 text-lg font-bold text-[#1F3A32]">
                  {formatCurrencyVnd(placedOrder.totalAmount)}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/don-hang"
              className="rounded-lg bg-[#1F3A32] px-5 py-2.5 text-xs font-semibold text-white"
            >
              {t('nav.orders')}
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-[#141413]/15 px-5 py-2.5 text-xs font-semibold text-[#141413]"
            >
              {t('cart.continue')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[#141413]">
        {t('checkout.title')}
      </h1>

      {!user && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#8C6D46]/30 bg-[#FAF5EC] px-4 py-3 text-xs text-[#141413]">
          <span>
            {isVi
              ? 'Vui lòng đăng nhập Google/Gmail để xác thực đơn hàng và nhận thông báo trạng thái.'
              : 'Please sign in with Google/Gmail to place an order and receive status alerts.'}
          </span>
          <button
            type="button"
            onClick={() => dispatch(openLoginModal('DEFAULT'))}
            className="rounded-md bg-[#1F3A32] px-3 py-1.5 font-semibold text-white cursor-pointer"
          >
            {t('nav.signIn')}
          </button>
        </div>
      )}

      <form onSubmit={(e) => void handlePlaceOrder(e)} className="mt-6 grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-xl border border-[#141413]/10 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#141413]">{t('checkout.customerInfo')}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs text-[#5C5A55]">
                <span>{t('checkout.fullName')}</span>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm text-[#141413]"
                />
              </label>
              <label className="block text-xs text-[#5C5A55]">
                <span>{t('checkout.phone')}</span>
                <input
                  required
                  minLength={8}
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0901234567"
                  className="mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm text-[#141413]"
                />
              </label>
              <label className="block text-xs text-[#5C5A55] sm:col-span-2">
                <span>{t('checkout.email')}</span>
                <input
                  required
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm text-[#141413]"
                />
              </label>
              <label className="block text-xs text-[#5C5A55] sm:col-span-2">
                <span>{t('checkout.zonePreset')}</span>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm text-[#141413]"
                >
                  {DELIVERY_PRESET_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {isVi ? z.labelVi : z.labelEn}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-[#5C5A55] sm:col-span-2">
                <span>{t('checkout.address')}</span>
                <input
                  required
                  minLength={5}
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder={isVi ? 'Số nhà, tên đường, phường, quận...' : 'Street, ward, district...'}
                  className="mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm text-[#141413]"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-[#141413]/10 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#141413]">{t('checkout.paymentMethod')}</h2>
            <div className="mt-3 space-y-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod(PaymentMethod.QR_CODE)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm cursor-pointer ${
                  paymentMethod === PaymentMethod.QR_CODE
                    ? 'border-[#1F3A32] bg-[#F0F4F2] font-semibold'
                    : 'border-[#141413]/12'
                }`}
              >
                <QrCode className="h-4 w-4 text-[#1F3A32]" />
                <span>{t('checkout.qrMethod')}</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod(PaymentMethod.COD)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm cursor-pointer ${
                  paymentMethod === PaymentMethod.COD
                    ? 'border-[#1F3A32] bg-[#F0F4F2] font-semibold'
                    : 'border-[#141413]/12'
                }`}
              >
                <Truck className="h-4 w-4 text-[#5C5A55]" />
                <span>{t('checkout.codMethod')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary & Anti-Abuse Voucher */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-[#141413]/10 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#141413]">{t('cart.title')}</h2>

            <div className="mt-3 divide-y divide-[#141413]/8 text-xs">
              {items.map((item) => (
                <div key={item.cartKey} className="flex justify-between py-2.5">
                  <div>
                    <div className="font-medium text-[#141413]">
                      {isVi ? item.nameVi : item.nameEn} × {item.quantity}
                    </div>
                    <div className="text-[#7A7770]">{t(`product.lensOptions.${item.lensType}`)}</div>
                  </div>
                  <div className="font-mono-tabular font-semibold">
                    {formatCurrencyVnd((item.unitPrice + item.lensPrice) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-[#141413]/10 pt-4">
              <div className="text-xs font-semibold text-[#141413]">{t('checkout.voucherLabel')}</div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  placeholder={t('checkout.voucherPlaceholder')}
                  className="flex-1 rounded-lg border border-[#141413]/15 px-3 py-2 text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={() => void handleApplyVoucher()}
                  className="rounded-lg bg-[#EFECE5] px-4 py-2 text-xs font-semibold text-[#141413] hover:bg-[#E4DFD5] cursor-pointer"
                >
                  {t('checkout.applyVoucher')}
                </button>
              </div>
              {liveDiscount.errorCode && (
                <p className="mt-1.5 text-xs text-red-600">
                  {liveDiscount.errorCode === 'HOLIDAY_VOUCHER_USED_THIS_YEAR'
                    ? isVi
                      ? `Đã dùng năm ${new Date().getFullYear()} · Mở lại năm ${liveDiscount.lockedUntilYear}`
                      : `Used in ${new Date().getFullYear()} · Reopens in ${liveDiscount.lockedUntilYear}`
                    : liveDiscount.errorCode}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t border-[#141413]/10 pt-4 text-xs">
              <div className="flex justify-between text-[#5C5A55]">
                <span>{t('cart.subtotal')}</span>
                <span className="font-mono-tabular">{formatCurrencyVnd(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#5C5A55]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {t('checkout.distance')}
                </span>
                <span className="font-mono-tabular">{distanceKm} km</span>
              </div>
              <div className="flex justify-between text-[#5C5A55]">
                <span>{t('checkout.shippingFee')}</span>
                <span className="font-mono-tabular">
                  {shippingFee === 0 ? t('checkout.freeship') : formatCurrencyVnd(shippingFee)}
                </span>
              </div>
              {liveDiscount.discountAmount > 0 && (
                <div className="flex justify-between font-medium text-[#1F3A32]">
                  <span>
                    {t('checkout.discount')} ({liveDiscount.appliedRule})
                  </span>
                  <span className="font-mono-tabular">
                    -{formatCurrencyVnd(liveDiscount.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#141413]/10 pt-3 text-base font-bold text-[#141413]">
                <span>{t('checkout.total')}</span>
                <span className="font-mono-tabular text-[#1F3A32]">
                  {formatCurrencyVnd(totalAmount)}
                </span>
              </div>
            </div>

            {errorMsg && <p className="mt-3 text-xs text-red-600">{errorMsg}</p>}

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="mt-5 w-full rounded-xl bg-[#1F3A32] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#172C26] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? '...' : t('checkout.placeOrder')}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
