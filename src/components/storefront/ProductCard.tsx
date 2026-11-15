import { useEffect, useState } from 'react';
import { Check, Glasses, Sparkles, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { openTryOnModal } from '../../store/slices/authSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { LensOptionType, Product } from '../../types/eyewear';
import { formatCurrencyVnd } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const isVi = !i18n.language.startsWith('en');

  const [justAdded, setJustAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => {
      setJustAdded(false);
    }, 1400);
    return () => {
      window.clearTimeout(timer);
    };
  }, [justAdded]);

  const handleQuickAdd = () => {
    dispatch(
      addToCart({
        productId: product.id,
        slug: product.slug,
        nameVi: product.nameVi,
        nameEn: product.nameEn,
        imageUrl: product.imageUrl,
        unitPrice: product.price,
        lensType: LensOptionType.FRAME_ONLY,
        lensPrice: 0,
        quantity: 1,
      })
    );
    setJustAdded(true);
  };

  return (
    <article className="group flex flex-col justify-between rounded-xl border border-[#141413]/8 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <Link
          to={`/san-pham/${product.slug}`}
          className="block aspect-4/3 w-full overflow-hidden rounded-lg bg-[#F2EFE9]"
        >
          {!imgFailed ? (
            <img
              src={product.imageUrl}
              alt={isVi ? product.nameVi : product.nameEn}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[#EFECE5] text-[#7A7770]">
              <Glasses className="h-8 w-8" />
              <span className="mt-2 text-xs">{product.sku}</span>
            </div>
          )}
        </Link>

        {/* Zero-pill unboxed metadata with typographic separators */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#7A7770]">
          <span>{t(`filters.material.${product.material}`)}</span>
          <span aria-hidden="true">·</span>
          <span>{t(`filters.frameStyle.${product.frameStyle}`)}</span>
        </div>

        <Link
          to={`/san-pham/${product.slug}`}
          className="mt-1 block text-base font-semibold leading-snug text-[#141413] hover:underline"
        >
          {isVi ? product.nameVi : product.nameEn}
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono-tabular text-[15px] font-semibold text-[#141413]">
            {formatCurrencyVnd(product.price)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-[#5C5A55]">
            <Star className="h-3.5 w-3.5 fill-[#B79248] text-[#B79248]" />
            <span className="font-mono-tabular">{product.averageRating.toFixed(1)}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleQuickAdd}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            justAdded
              ? 'bg-[#2C5B4D] text-white'
              : 'bg-[#1F3A32] text-white hover:bg-[#172C26]'
          }`}
        >
          {justAdded ? (
            <span className="inline-flex items-center justify-center gap-1">
              <Check className="h-3.5 w-3.5" />
              <span>{t('product.addedCheck')}</span>
            </span>
          ) : (
            t('product.addToCart')
          )}
        </button>

        <button
          type="button"
          onClick={() => dispatch(openTryOnModal(product.slug))}
          title={t('product.tryOnAi')}
          className="inline-flex items-center gap-1 rounded-lg border border-[#141413]/15 bg-[#FAF9F6] px-3 py-2 text-xs font-medium text-[#141413] transition-colors hover:bg-[#EFECE5] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#8C6D46]" />
          <span>{t('product.tryOnAi')}</span>
        </button>
      </div>
    </article>
  );
}
