import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchOrdersForRole } from '../services/firebase';
import { useAppDispatch, useAppSelector } from '../store';
import { openLoginModal } from '../store/slices/authSlice';
import { OrderRecord, UserRole } from '../types/eyewear';
import { formatCurrencyVnd } from '../utils/formatters';

export function OrdersPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void fetchOrdersForRole(user.uid, UserRole.CUSTOMER)
      .then((list) => setOrders(list))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[#141413]">{t('orders.title')}</h1>

      {!user ? (
        <div className="mt-6 rounded-xl border border-[#141413]/10 bg-white p-8 text-center">
          <button
            type="button"
            onClick={() => dispatch(openLoginModal('DEFAULT'))}
            className="rounded-lg bg-[#1F3A32] px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
          >
            {t('nav.signIn')}
          </button>
        </div>
      ) : loading ? (
        <div className="mt-6 text-sm text-[#7A7770]">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#141413]/10 bg-white p-8 text-center text-sm text-[#7A7770]">
          {t('orders.empty')}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-[#141413]/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#141413]/8 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#1F3A32]" />
                  <span className="font-mono-tabular text-sm font-bold text-[#141413]">
                    #{order.orderCode}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <span className="text-[#5C5A55]">{t(`orders.payment.${order.paymentStatus}`)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#1F3A32]">
                    {t(`orders.status.${order.orderStatus}`)}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm text-[#5C5A55]">{order.itemsSummary}</div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#7A7770]">
                <span>{order.shippingAddress}</span>
                <span className="font-mono-tabular text-sm font-semibold text-[#141413]">
                  {formatCurrencyVnd(order.totalAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
