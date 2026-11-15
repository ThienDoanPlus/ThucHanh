import { Minus, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { removeFromCart, setCartOpen, updateQuantity } from '../../store/slices/cartSlice';
import { formatCurrencyVnd } from '../../utils/formatters';

export function CartDrawer() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isVi = !i18n.language.startsWith('en');

  const { items, isCartOpen } = useAppSelector((state) => state.cart);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice + item.lensPrice) * item.quantity,
    0
  );

  if (!isCartOpen) return null;

  const navigateToProduct = (slug: string) => {
    dispatch(setCartOpen(false));
    navigate(`/san-pham/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = () => {
    dispatch(setCartOpen(false));
    navigate('/thanh-toan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
      <div
        className="flex h-full w-full max-w-md flex-col bg-[#FAF9F6] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[#141413]/10 px-6 py-4">
          <h2 className="font-display text-2xl font-semibold text-[#141413]">
            {t('cart.title')}
          </h2>
          <button
            type="button"
            onClick={() => dispatch(setCartOpen(false))}
            aria-label="Close bag"
            className="rounded-lg p-2 text-[#5C5A55] hover:bg-[#EAE6DE] hover:text-[#141413] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#7A7770]">{t('cart.empty')}</div>
          ) : (
            <div className="divide-y divide-[#141413]/8">
              {items.map((item) => (
                <div key={item.cartKey} className="flex gap-4 py-4">
                  <button
                    type="button"
                    onClick={() => navigateToProduct(item.slug)}
                    className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-[#F2EFE9] cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={isVi ? item.nameVi : item.nameEn}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => navigateToProduct(item.slug)}
                      className="text-left text-sm font-semibold text-[#141413] hover:underline cursor-pointer"
                    >
                      {isVi ? item.nameVi : item.nameEn}
                    </button>
                    <div className="mt-1 text-xs text-[#7A7770]">
                      {t(`product.lensOptions.${item.lensType}`)}
                    </div>
                    <div className="font-mono-tabular mt-1 text-sm font-medium text-[#141413]">
                      {formatCurrencyVnd((item.unitPrice + item.lensPrice) * item.quantity)}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-[#141413]/15 bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                cartKey: item.cartKey,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          aria-label="Decrease quantity"
                          className="p-1.5 text-[#5C5A55] hover:text-[#141413] cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-mono-tabular px-2.5 text-xs font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                cartKey: item.cartKey,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          aria-label="Increase quantity"
                          className="p-1.5 text-[#5C5A55] hover:text-[#141413] cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => dispatch(removeFromCart(item.cartKey))}
                        className="inline-flex items-center gap-1 text-xs text-[#7A7770] hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{t('cart.remove')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#141413]/10 bg-white px-6 py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#5C5A55]">{t('cart.subtotal')}</span>
            <span className="font-mono-tabular text-lg font-semibold text-[#141413]">
              {formatCurrencyVnd(subtotal)}
            </span>
          </div>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={handleCheckout}
            className="mt-4 w-full rounded-lg bg-[#1F3A32] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172C26] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {t('cart.checkout')}
          </button>
        </div>
      </div>
    </div>
  );
}
