import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchOrdersForRole, updateOrderStatusInFirestore } from '../services/firebase';
import { useAppSelector } from '../store';
import { OrderRecord, OrderStatus, UserRole } from '../types/eyewear';

const KANBAN_COLUMNS: OrderStatus[] = [
  OrderStatus.ARRANGING,
  OrderStatus.READY,
  OrderStatus.SHIPPING,
  OrderStatus.COMPLETED,
];

function getNextStage(current: OrderStatus): OrderStatus | null {
  if (current === OrderStatus.ARRANGING) return OrderStatus.READY;
  if (current === OrderStatus.READY) return OrderStatus.SHIPPING;
  if (current === OrderStatus.SHIPPING) return OrderStatus.COMPLETED;
  return null;
}

export function StaffKanbanPage() {
  const { t, i18n } = useTranslation();
  const isVi = !i18n.language.startsWith('en');
  const { user } = useAppSelector((state) => state.auth);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.ADMIN)) return;
    void fetchOrdersForRole(user.uid, user.role)
      .then((list) => setOrders(list))
      .catch(() => setOrders([]));
  }, [user]);

  if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.ADMIN)) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#5C5A55]">
        {isVi
          ? 'Khu vực này chỉ dành cho Kỹ thuật viên xưởng tròng (STAFF).'
          : 'This area is restricted to Optical Lab Staff.'}
      </main>
    );
  }

  const handleAdvance = async (order: OrderRecord) => {
    const next = getNextStage(order.orderStatus);
    if (!next) return;
    await updateOrderStatusInFirestore(order, next);
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, orderStatus: next } : o))
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[#141413]">{t('staff.title')}</h1>
      <p className="mt-1 text-sm text-[#5C5A55]">{t('staff.subtitle')}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KANBAN_COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.orderStatus === col);
          return (
            <div
              key={col}
              className="rounded-xl border border-[#141413]/10 bg-[#F2EFE9] p-3.5"
            >
              <div className="mb-3 flex items-center justify-between border-b border-[#141413]/10 pb-2 text-xs font-semibold text-[#141413]">
                <span>{t(`orders.status.${col}`)}</span>
                <span className="font-mono-tabular text-[#5C5A55]">{colOrders.length}</span>
              </div>

              <div className="space-y-3">
                {colOrders.map((order) => {
                  const next = getNextStage(order.orderStatus);
                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border border-[#141413]/8 bg-white p-3 text-xs"
                    >
                      <div className="font-mono-tabular font-bold text-[#141413]">
                        #{order.orderCode}
                      </div>
                      <div className="mt-1 text-[#5C5A55]">{order.customerName}</div>
                      <div className="mt-1 line-clamp-2 text-[11px] text-[#7A7770]">
                        {order.itemsSummary}
                      </div>
                      {next && (
                        <button
                          type="button"
                          onClick={() => void handleAdvance(order)}
                          className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded bg-[#1F3A32] py-1.5 font-semibold text-white hover:bg-[#172C26] cursor-pointer"
                        >
                          <span>{t('staff.advanceBtn')}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
