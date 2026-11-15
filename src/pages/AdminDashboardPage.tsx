import { FormEvent, useEffect, useState } from 'react';
import { Check, Eye, EyeOff, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { INITIAL_PRODUCTS } from '../data/products';
import {
  approveQrOrderInFirestore,
  fetchOrdersForRole,
  fetchReviewsByProduct,
  fetchStoreSettings,
  moderateReviewInFirestore,
  saveStoreSettings,
  upsertProductInFirestore,
} from '../services/firebase';
import { useAppSelector } from '../store';
import {
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  ReviewRecord,
  UserRole,
} from '../types/eyewear';
import { formatCurrencyVnd } from '../utils/formatters';

type AdminTab = 'qrApproval' | 'products' | 'settings' | 'reviews';

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const isVi = !i18n.language.startsWith('en');
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<AdminTab>('qrApproval');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const [bankId, setBankId] = useState('MB');
  const [accountNo, setAccountNo] = useState('0901234567');
  const [accountName, setAccountName] = useState('LUMINA OPTICS STORE');
  const [customQrUrl, setCustomQrUrl] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) return;
    void fetchOrdersForRole(user.uid, UserRole.ADMIN)
      .then((list) => setOrders(list))
      .catch(() => setOrders([]));

    void fetchReviewsByProduct('', true)
      .then((list) => setReviews(list))
      .catch(() => setReviews([]));

    void fetchStoreSettings()
      .then((s) => {
        setBankId(s.bankId);
        setAccountNo(s.accountNo);
        setAccountName(s.accountName);
        setCustomQrUrl(s.customQrUrl);
      })
      .catch(() => {});
  }, [user]);

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#5C5A55]">
        {isVi
          ? 'Khu vực này chỉ dành cho tài khoản Quản trị viên (ADMIN).'
          : 'This area is restricted to Administrator (ADMIN) accounts.'}
      </main>
    );
  }

  const pendingQrOrders = orders.filter(
    (o) => o.paymentMethod === PaymentMethod.QR_CODE && o.paymentStatus === PaymentStatus.UNPAID
  );

  const handleApproveQr = async (order: OrderRecord) => {
    await approveQrOrderInFirestore(order);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? { ...o, paymentStatus: PaymentStatus.PAID, orderStatus: OrderStatus.ARRANGING }
          : o
      )
    );
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    await saveStoreSettings({ bankId, accountNo, accountName, customQrUrl });
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleModerateReview = async (id: string, status: 'APPROVED' | 'HIDDEN') => {
    await moderateReviewInFirestore(id, status);
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleStockBump = async (product: Product, delta: number) => {
    const updated = { ...product, stock: Math.max(0, product.stock + delta) };
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    await upsertProductInFirestore(updated);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[#141413]">{t('admin.title')}</h1>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-[#141413]/10 pb-3">
        {(['qrApproval', 'products', 'settings', 'reviews'] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab
                ? 'bg-[#1F3A32] text-white'
                : 'bg-[#EFECE5] text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            {t(`admin.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'qrApproval' && (
        <section className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#141413]">
            {isVi
              ? `Đơn hàng chờ duyệt chuyển khoản QR (${pendingQrOrders.length})`
              : `Pending QR Transfer Approvals (${pendingQrOrders.length})`}
          </h2>
          {pendingQrOrders.length === 0 ? (
            <div className="rounded-xl border border-[#141413]/10 bg-white p-8 text-center text-sm text-[#7A7770]">
              {isVi ? 'Không có đơn QR nào đang chờ duyệt.' : 'No pending QR orders.'}
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQrOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#141413]/10 bg-white p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-[#1F3A32]" />
                      <span className="font-mono-tabular text-sm font-bold">
                        #{order.orderCode}
                      </span>
                      <span className="text-xs text-[#5C5A55]">· {order.customerName}</span>
                    </div>
                    <div className="mt-1 text-xs text-[#7A7770]">
                      {order.customerPhone} · {order.itemsSummary}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono-tabular text-base font-bold text-[#1F3A32]">
                      {formatCurrencyVnd(order.totalAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleApproveQr(order)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F3A32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172C26] cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{t('admin.approveQrBtn')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'products' && (
        <section className="mt-6 overflow-x-auto rounded-xl border border-[#141413]/10 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#141413]/10 bg-[#FAF9F6] text-[#5C5A55]">
              <tr>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">{isVi ? 'Tên gọng' : 'Frame'}</th>
                <th className="px-4 py-3 font-semibold">{isVi ? 'Giá' : 'Price'}</th>
                <th className="px-4 py-3 font-semibold">{isVi ? 'Tồn kho' : 'Stock'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141413]/8">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono-tabular px-4 py-3">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-[#141413]">
                    {isVi ? p.nameVi : p.nameEn}
                  </td>
                  <td className="font-mono-tabular px-4 py-3">{formatCurrencyVnd(p.price)}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleStockBump(p, -1)}
                        className="rounded border border-[#141413]/15 px-2 py-0.5 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono-tabular w-8 text-center">{p.stock}</span>
                      <button
                        type="button"
                        onClick={() => void handleStockBump(p, 1)}
                        className="rounded border border-[#141413]/15 px-2 py-0.5 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'settings' && (
        <form
          onSubmit={(e) => void handleSaveSettings(e)}
          className="mt-6 max-w-xl space-y-4 rounded-xl border border-[#141413]/10 bg-white p-6"
        >
          <label className="block text-xs text-[#5C5A55]">
            <span>{isVi ? 'Mã Ngân hàng (VietQR Bank ID)' : 'Bank ID (VietQR)'}</span>
            <input
              required
              type="text"
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm text-[#141413]"
            />
          </label>
          <label className="block text-xs text-[#5C5A55]">
            <span>{isVi ? 'Số tài khoản thụ hưởng' : 'Beneficiary Account Number'}</span>
            <input
              required
              type="text"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              className="font-mono-tabular mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm text-[#141413]"
            />
          </label>
          <label className="block text-xs text-[#5C5A55]">
            <span>{isVi ? 'Tên chủ tài khoản' : 'Account Holder Name'}</span>
            <input
              required
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm text-[#141413]"
            />
          </label>
          <label className="block text-xs text-[#5C5A55]">
            <span>
              {isVi
                ? 'URL Ảnh QR cá nhân của bạn (Để trống nếu dùng VietQR tự động)'
                : 'Your Custom QR Image URL (Leave blank for dynamic VietQR)'}
            </span>
            <input
              type="url"
              value={customQrUrl}
              onChange={(e) => setCustomQrUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              className="mt-1 w-full rounded-lg border border-[#141413]/15 px-3 py-2 text-sm text-[#141413]"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[#1F3A32] px-5 py-2.5 text-xs font-semibold text-white cursor-pointer"
          >
            {settingsSaved ? '✓ Saved' : t('admin.saveSettings')}
          </button>
        </form>
      )}

      {activeTab === 'reviews' && (
        <section className="mt-6 space-y-3">
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-[#141413]/10 bg-white p-8 text-center text-sm text-[#7A7770]">
              {isVi ? 'Chưa có đánh giá nào cần kiểm duyệt.' : 'No reviews to moderate.'}
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#141413]/10 bg-white p-4"
              >
                <div>
                  <div className="text-xs font-semibold text-[#141413]">
                    {rev.authorName} · {rev.rating}★ · [{rev.status}]
                  </div>
                  <p className="mt-1 text-sm text-[#5C5A55]">{rev.comment}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleModerateReview(rev.id, 'APPROVED')}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#1F3A32] px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleModerateReview(rev.id, 'HIDDEN')}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#141413]/15 px-3 py-1.5 text-xs font-medium text-[#5C5A55] cursor-pointer"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </main>
  );
}
