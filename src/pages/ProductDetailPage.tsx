import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Check, Sparkles, Star, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { INITIAL_PRODUCTS } from '../data/products';
import {
  fetchOrdersForRole,
  fetchReviewsByProduct,
  submitProductReview,
} from '../services/firebase';
import { useAppDispatch, useAppSelector } from '../store';
import { openLoginModal, openTryOnModal } from '../store/slices/authSlice';
import { addToCart } from '../store/slices/cartSlice';
import {
  LensOptionType,
  OrderStatus,
  PrescriptionSpec,
  ReviewRecord,
  UserRole,
} from '../types/eyewear';
import { formatCurrencyVnd, getLensAddonPrice } from '../utils/formatters';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const isVi = !i18n.language.startsWith('en');

  const { user } = useAppSelector((state) => state.auth);

  const product = INITIAL_PRODUCTS.find((p) => p.slug === slug) ?? INITIAL_PRODUCTS[0];

  const [lensType, setLensType] = useState<LensOptionType>(LensOptionType.FRAME_ONLY);
  const [rx, setRx] = useState<PrescriptionSpec>({
    odSph: '-1.50',
    odCyl: '0.00',
    odAxis: '0',
    osSph: '-1.25',
    osCyl: '0.00',
    osAxis: '0',
    pdMm: '62',
  });
  const [justAdded, setJustAdded] = useState(false);

  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 1400);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  useEffect(() => {
    let active = true;
    void fetchReviewsByProduct(product.id)
      .then((list) => {
        if (active) setReviews(list);
      })
      .catch(() => {
        // Fallback silently when offline
      });

    if (user) {
      void fetchOrdersForRole(user.uid, UserRole.CUSTOMER)
        .then((orders) => {
          if (!active) return;
          const completed = orders.find(
            (o) =>
              o.orderStatus === OrderStatus.COMPLETED &&
              o.itemsSummary.includes(product.nameVi.slice(0, 14))
          );
          setEligibleOrderId(completed?.id ?? null);
        })
        .catch(() => {
          if (active) setEligibleOrderId(null);
        });
    } else {
      setEligibleOrderId(null);
    }

    return () => {
      active = false;
    };
  }, [product.id, product.nameVi, user]);

  const lensPrice = getLensAddonPrice(lensType);
  const totalUnitPrice = product.price + lensPrice;

  const handleRxImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRx((prev) => ({ ...prev, prescriptionImageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddToBag = () => {
    dispatch(
      addToCart({
        productId: product.id,
        slug: product.slug,
        nameVi: product.nameVi,
        nameEn: product.nameEn,
        imageUrl: product.imageUrl,
        unitPrice: product.price,
        lensType,
        lensPrice,
        quantity: 1,
        prescription: lensType === LensOptionType.PRESCRIPTION ? rx : undefined,
      })
    );
    setJustAdded(true);
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      dispatch(openLoginModal('DEFAULT'));
      return;
    }
    if (!eligibleOrderId) return;
    setReviewError(null);
    try {
      await submitProductReview({
        productId: product.id,
        orderId: eligibleOrderId,
        userId: user.uid,
        authorName: user.displayName,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
      setReviewComment('');
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Error submitting review');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C5A55] hover:text-[#141413]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{t('cart.continue')}</span>
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        {/* Sticky Product Gallery */}
        <div className="lg:col-span-6">
          <div className="sticky top-28 space-y-4">
            <div className="aspect-4/3 w-full overflow-hidden rounded-2xl border border-[#141413]/8 bg-[#F2EFE9]">
              <img
                src={product.imageUrl}
                alt={isVi ? product.nameVi : product.nameEn}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => dispatch(openTryOnModal(product.slug))}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#141413]/20 bg-white py-3 text-sm font-semibold text-[#141413] transition-colors hover:bg-[#EFECE5] cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#8C6D46]" />
              <span>{t('product.tryOnAi')}</span>
            </button>

            <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#141413]/8 bg-white p-4 text-center">
              <div>
                <div className="text-[11px] text-[#7A7770]">{t('product.width')}</div>
                <div className="font-mono-tabular mt-0.5 text-sm font-semibold">
                  {product.frameWidthMm} mm
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#7A7770]">{t('product.bridge')}</div>
                <div className="font-mono-tabular mt-0.5 text-sm font-semibold">
                  {product.bridgeMm} mm
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#7A7770]">{t('product.temple')}</div>
                <div className="font-mono-tabular mt-0.5 text-sm font-semibold">
                  {product.templeMm} mm
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contiguous Purchase & Lens Config Module */}
        <div className="lg:col-span-6">
          <div className="flex items-center gap-2 text-xs text-[#7A7770]">
            <span>{product.sku}</span>
            <span aria-hidden="true">·</span>
            <span>{t(`filters.material.${product.material}`)}</span>
            <span aria-hidden="true">·</span>
            <span>{t('product.inStock', { count: product.stock })}</span>
          </div>

          <h1 className="mt-2 font-display text-3xl font-semibold text-[#141413] sm:text-4xl">
            {isVi ? product.nameVi : product.nameEn}
          </h1>

          <div className="mt-3 flex items-center gap-4">
            <span className="font-mono-tabular text-2xl font-semibold text-[#1F3A32]">
              {formatCurrencyVnd(totalUnitPrice)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[#5C5A55]">
              <Star className="h-4 w-4 fill-[#B79248] text-[#B79248]" />
              <span className="font-mono-tabular font-semibold">
                {product.averageRating.toFixed(1)}
              </span>
              <span>({product.totalReviews})</span>
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#5C5A55]">
            {isVi ? product.descriptionVi : product.descriptionEn}
          </p>

          <div className="mt-4 text-xs text-[#5C5A55]">
            <span className="font-semibold text-[#141413]">{t('product.suitableFaces')}: </span>
            {product.suitableFaces.map((f) => t(`filters.faceShape.${f}`)).join(' · ')}
          </div>

          {/* 3+ Lens Configuration Options */}
          <div className="mt-7 border-t border-[#141413]/10 pt-6">
            <h2 className="text-sm font-semibold text-[#141413]">
              {t('product.lensConfigTitle')}
            </h2>

            <div className="mt-3 space-y-2.5">
              {Object.values(LensOptionType).map((opt) => {
                const addon = getLensAddonPrice(opt);
                const selected = lensType === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLensType(opt)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#1F3A32] bg-[#F0F4F2] font-semibold text-[#141413]'
                        : 'border-[#141413]/12 bg-white text-[#5C5A55] hover:border-[#141413]/30'
                    }`}
                  >
                    <span>{t(`product.lensOptions.${opt}`)}</span>
                    <span className="font-mono-tabular text-xs font-semibold text-[#1F3A32]">
                      {addon === 0 ? '0 ₫' : `+${formatCurrencyVnd(addon)}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {lensType === LensOptionType.PRESCRIPTION && (
              <div className="mt-4 rounded-xl border border-[#141413]/12 bg-white p-4">
                <div className="text-xs font-semibold text-[#141413]">{t('product.rxTitle')}</div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                  <div className="font-medium text-[#5C5A55]">{t('product.rxRight')}</div>
                  <input
                    type="text"
                    value={rx.odSph}
                    onChange={(e) => setRx({ ...rx, odSph: e.target.value })}
                    placeholder="SPH"
                    className="font-mono-tabular rounded border border-[#141413]/15 px-2 py-1.5"
                  />
                  <input
                    type="text"
                    value={rx.odCyl}
                    onChange={(e) => setRx({ ...rx, odCyl: e.target.value })}
                    placeholder="CYL"
                    className="font-mono-tabular rounded border border-[#141413]/15 px-2 py-1.5"
                  />
                  <input
                    type="text"
                    value={rx.odAxis}
                    onChange={(e) => setRx({ ...rx, odAxis: e.target.value })}
                    placeholder="AXIS"
                    className="font-mono-tabular rounded border border-[#141413]/15 px-2 py-1.5"
                  />

                  <div className="font-medium text-[#5C5A55]">{t('product.rxLeft')}</div>
                  <input
                    type="text"
                    value={rx.osSph}
                    onChange={(e) => setRx({ ...rx, osSph: e.target.value })}
                    placeholder="SPH"
                    className="font-mono-tabular rounded border border-[#141413]/15 px-2 py-1.5"
                  />
                  <input
                    type="text"
                    value={rx.osCyl}
                    onChange={(e) => setRx({ ...rx, osCyl: e.target.value })}
                    placeholder="CYL"
                    className="font-mono-tabular rounded border border-[#141413]/15 px-2 py-1.5"
                  />
                  <input
                    type="text"
                    value={rx.osAxis}
                    onChange={(e) => setRx({ ...rx, osAxis: e.target.value })}
                    placeholder="AXIS"
                    className="font-mono-tabular rounded border border-[#141413]/15 px-2 py-1.5"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-[#5C5A55]">
                    <span>{t('product.rxPd')}</span>
                    <input
                      type="text"
                      value={rx.pdMm}
                      onChange={(e) => setRx({ ...rx, pdMm: e.target.value })}
                      className="font-mono-tabular w-16 rounded border border-[#141413]/15 px-2 py-1"
                    />
                  </label>

                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#141413]/15 px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#FAF9F6] cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{t('product.rxUpload')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleRxImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {rx.prescriptionImageUrl && (
                  <p className="mt-2 text-[11px] font-medium text-[#1F3A32]">
                    ✓ {isVi ? 'Đã đính kèm ảnh phiếu đo thị lực' : 'Prescription image attached'}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToBag}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F3A32] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#172C26] cursor-pointer"
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>{t('product.addedCheck')}</span>
                </>
              ) : (
                <span>
                  {t('product.addToCart')} · {formatCurrencyVnd(totalUnitPrice)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verified Purchase Reviews */}
      <section className="mt-16 border-t border-[#141413]/10 pt-10">
        <h2 className="font-display text-2xl font-semibold text-[#141413]">
          {t('product.reviewsTitle')}
        </h2>

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            {reviews.length === 0 ? (
              <p className="text-sm text-[#7A7770]">
                {isVi
                  ? 'Chưa có đánh giá công khai cho mẫu gọng này.'
                  : 'No public reviews yet for this frame.'}
              </p>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl border border-[#141413]/8 bg-white p-4"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#141413]">{rev.authorName}</span>
                    <span className="text-[#1F3A32]">{t('product.verifiedPurchase')}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#B79248]">
                    {'★'.repeat(rev.rating)}
                  </div>
                  <p className="mt-2 text-sm text-[#5C5A55]">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl border border-[#141413]/10 bg-white p-5 lg:col-span-5">
            <h3 className="text-sm font-semibold text-[#141413]">{t('product.writeReview')}</h3>
            {!eligibleOrderId ? (
              <p className="mt-2 text-xs leading-relaxed text-[#7A7770]">
                {t('product.reviewEligibilityHint')}
              </p>
            ) : reviewSubmitted ? (
              <p className="mt-3 text-xs font-medium text-[#1F3A32]">
                {isVi
                  ? 'Cảm ơn bạn! Đánh giá đã được gửi chờ kiểm duyệt.'
                  : 'Thank you! Your review has been submitted for moderation.'}
              </p>
            ) : (
              <form onSubmit={(e) => void handleReviewSubmit(e)} className="mt-4 space-y-3">
                <label className="block text-xs text-[#5C5A55]">
                  <span>{isVi ? 'Số sao' : 'Rating'}</span>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ★
                      </option>
                    ))}
                  </select>
                </label>
                <textarea
                  required
                  minLength={3}
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={isVi ? 'Chia sẻ cảm nhận khi đeo gọng kính...' : 'Share your fit and comfort impression...'}
                  className="w-full rounded-lg border border-[#141413]/15 p-3 text-sm"
                />
                {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#1F3A32] py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  {t('product.submitReview')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
