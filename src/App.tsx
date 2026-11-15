import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartDrawer } from './components/cart/CartDrawer';
import { AuthModal } from './components/common/AuthModal';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { SocialFloatingHub } from './components/layout/SocialFloatingHub';
import { VirtualTryOnModal } from './components/tryon/VirtualTryOnModal';
import './i18n';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { StaffKanbanPage } from './pages/StaffKanbanPage';
import { StoreLocatorPage } from './pages/StoreLocatorPage';
import {
  auth,
  fetchNotificationsForUser,
  syncUserProfile,
} from './services/firebase';
import { store, useAppDispatch, useAppSelector } from './store';
import { setAuthReady, setUser } from './store/slices/authSlice';
import { setNotifications } from './store/slices/notificationSlice';

function AppShell() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        dispatch(setUser(null));
        dispatch(setAuthReady(true));
        return;
      }
      void syncUserProfile(fbUser)
        .then((profile) => {
          dispatch(setUser(profile));
        })
        .catch(() => {
          dispatch(setAuthReady(true));
        });
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user) {
      dispatch(setNotifications([]));
      return;
    }
    let active = true;
    void fetchNotificationsForUser(user.uid, user.role)
      .then((list) => {
        if (active) dispatch(setNotifications(list));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [dispatch, user]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F6] text-[#141413]">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
          <Route path="/thanh-toan" element={<CheckoutPage />} />
          <Route path="/don-hang" element={<OrdersPage />} />
          <Route path="/cua-hang" element={<StoreLocatorPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/staff" element={<StaffKanbanPage />} />
        </Routes>
      </div>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <VirtualTryOnModal />
      <SocialFloatingHub />
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </Provider>
  );
}
