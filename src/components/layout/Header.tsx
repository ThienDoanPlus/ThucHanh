import { useEffect, useState } from 'react';
import { Bell, LogIn, LogOut, ShoppingBag, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_BOOTSTRAP_EMAIL, markNotificationReadInFirestore, signOutUser } from '../../services/firebase';
import { useAppDispatch, useAppSelector } from '../../store';
import { openLoginModal, openTryOnModal, setActiveRolePreview, setUser } from '../../store/slices/authSlice';
import { setCartOpen } from '../../store/slices/cartSlice';
import { markNotificationRead, setNotificationPanelOpen } from '../../store/slices/notificationSlice';
import { UserRole } from '../../types/eyewear';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export function Header() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isVi = !i18n.language.startsWith('en');

  const { user } = useAppSelector((state) => state.auth);
  const { items, lastCartAddedAt } = useAppSelector((state) => state.cart);
  const { items: notifications, isPanelOpen } = useAppSelector((state) => state.notification);

  const [isBumping, setIsBumping] = useState(false);

  const totalBagCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const isPrivilegedWorkspace = user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF;
  const isRealAdminAccount = user?.email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL;

  useEffect(() => {
    if (!lastCartAddedAt) return;
    setIsBumping(true);
    const timer = window.setTimeout(() => {
      setIsBumping(false);
    }, 680);
    return () => {
      window.clearTimeout(timer);
    };
  }, [lastCartAddedAt]);

  const handleSignOut = async () => {
    await signOutUser();
    dispatch(setUser(null));
    navigate('/');
  };

  const handleNotificationClick = async (id: string) => {
    dispatch(markNotificationRead(id));
    try {
      await markNotificationReadInFirestore(id);
    } catch {
      // Non-blocking sync
    }
  };

  return (
    <div className="sticky top-0 z-40 border-b border-[#141413]/10 bg-[#FAF9F6]/95 backdrop-blur-md">
      {/* Compact Utility Strip (Language, Notifications, Auth) */}
      <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#141413]/6 px-4 py-1.5 text-xs text-[#5C5A55] sm:px-6">
        <p className="hidden truncate sm:block">{t('announcement')}</p>
        <div className="ml-auto flex items-center gap-3">
          {isRealAdminAccount && (
            <div className="hidden items-center gap-1 rounded bg-[#EFECE5] px-1.5 py-0.5 md:flex">
              {([UserRole.CUSTOMER, UserRole.STAFF, UserRole.ADMIN] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    dispatch(setActiveRolePreview(r));
                    if (r === UserRole.ADMIN) navigate('/admin');
                    else if (r === UserRole.STAFF) navigate('/staff');
                    else navigate('/');
                  }}
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                    user?.role === r
                      ? 'bg-[#1F3A32] text-white'
                      : 'text-[#5C5A55] hover:text-[#141413]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          <LanguageSwitcher />

          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => dispatch(setNotificationPanelOpen(!isPanelOpen))}
                aria-label="Notifications"
                className="relative flex items-center gap-1 rounded-md px-2 py-1 text-[#141413] hover:bg-[#EAE6DE] cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5" />
                {unreadNotifs > 0 && (
                  <span className="font-mono-tabular text-[11px] font-semibold text-[#1F3A32]">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {isPanelOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#141413]/10 bg-white p-3 shadow-lg">
                  <div className="mb-2 flex items-center justify-between border-b border-[#141413]/8 pb-2">
                    <span className="text-xs font-semibold text-[#141413]">
                      {isVi ? 'Thông báo đơn hàng' : 'Order Notifications'}
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatch(setNotificationPanelOpen(false))}
                      className="text-xs text-[#7A7770] hover:text-[#141413] cursor-pointer"
                    >
                      {isVi ? 'Đóng' : 'Close'}
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[#7A7770]">
                      {isVi ? 'Chưa có thông báo mới.' : 'No new notifications.'}
                    </p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => void handleNotificationClick(n.id)}
                          className={`w-full rounded-lg p-2.5 text-left transition-colors cursor-pointer ${
                            n.isRead ? 'bg-[#FAF9F6]' : 'bg-[#F0F4F2]'
                          }`}
                        >
                          <div className="text-xs font-semibold text-[#141413]">
                            {isVi ? n.titleVi : n.titleEn}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#5C5A55]">
                            {isVi ? n.bodyVi : n.bodyEn}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[140px] truncate font-medium text-[#141413] sm:inline">
                <UserIcon className="mr-1 inline h-3 w-3" />
                {user.displayName}
              </span>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[#5C5A55] hover:bg-[#EAE6DE] hover:text-[#141413] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{t('nav.signOut')}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => dispatch(openLoginModal('DEFAULT'))}
              className="inline-flex items-center gap-1 rounded px-2 py-1 font-medium text-[#1F3A32] hover:bg-[#EAE6DE] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{t('nav.signIn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        <Link
          to={user?.role === UserRole.ADMIN ? '/admin' : user?.role === UserRole.STAFF ? '/staff' : '/'}
          className="font-display text-xl font-bold tracking-tight text-[#141413] whitespace-nowrap shrink-0"
        >
          {t('brand')}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[#5C5A55] md:flex">
          {!isPrivilegedWorkspace && (
            <>
              <Link
                to="/"
                className={`transition-colors hover:text-[#141413] whitespace-nowrap shrink-0 ${
                  location.pathname === '/' ? 'text-[#141413] underline underline-offset-4' : ''
                }`}
              >
                {t('nav.collection')}
              </Link>
              <button
                type="button"
                onClick={() => dispatch(openTryOnModal(null))}
                className="transition-colors hover:text-[#141413] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t('nav.tryOn')}
              </button>
              <Link
                to="/don-hang"
                className={`transition-colors hover:text-[#141413] whitespace-nowrap shrink-0 ${
                  location.pathname === '/don-hang'
                    ? 'text-[#141413] underline underline-offset-4'
                    : ''
                }`}
              >
                {t('nav.orders')}
              </Link>
              <Link
                to="/cua-hang"
                className={`transition-colors hover:text-[#141413] whitespace-nowrap shrink-0 ${
                  location.pathname === '/cua-hang'
                    ? 'text-[#141413] underline underline-offset-4'
                    : ''
                }`}
              >
                {t('nav.store')}
              </Link>
            </>
          )}

          {user?.role === UserRole.ADMIN && (
            <Link
              to="/admin"
              className="text-[#1F3A32] font-semibold underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              {t('nav.admin')}
            </Link>
          )}
          {(user?.role === UserRole.STAFF || user?.role === UserRole.ADMIN) && (
            <Link
              to="/staff"
              className="hover:text-[#141413] whitespace-nowrap shrink-0"
            >
              {t('nav.staff')}
            </Link>
          )}
        </nav>

        <div className="flex items-center shrink-0">
          {!isPrivilegedWorkspace ? (
            <button
              type="button"
              onClick={() => dispatch(setCartOpen(true))}
              className="relative inline-flex items-center gap-2 rounded-lg bg-[#1F3A32] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#172C26] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className={`h-4 w-4 ${isBumping ? 'animate-cart-bump' : ''}`} />
              <span>{t('nav.cart')}</span>
              <span
                key={totalBagCount}
                className={`font-mono-tabular rounded bg-white/20 px-1.5 py-0.5 text-[11px] ${
                  isBumping ? 'animate-badge-pop' : ''
                }`}
              >
                {totalBagCount}
              </span>
              {isBumping && (
                <span className="animate-fly-item pointer-events-none absolute -top-3 right-2 text-xs font-bold text-[#1F3A32]">
                  +1
                </span>
              )}
            </button>
          ) : (
            <Link
              to={user?.role === UserRole.ADMIN ? '/admin' : '/staff'}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A32] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
            >
              {user?.role === UserRole.ADMIN ? t('nav.admin') : t('nav.staff')}
            </Link>
          )}
        </div>
      </header>
    </div>
  );
}
