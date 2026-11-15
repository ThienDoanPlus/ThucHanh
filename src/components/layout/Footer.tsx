import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { STORE_ADDRESS_EN, STORE_ADDRESS_VI } from '../../utils/shipping';

export function Footer() {
  const { i18n, t } = useTranslation();
  const isVi = !i18n.language.startsWith('en');

  return (
    <footer className="mt-20 border-t border-[#141413]/10 bg-[#F2EFE9]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="font-display text-2xl font-semibold text-[#141413]">{t('brand')}</div>
          <p className="mt-2 text-sm leading-relaxed text-[#5C5A55]">
            {isVi
              ? 'Thương hiệu kính mắt thiết kế tối giản, chế tác Titanium & Acetate chuẩn xác cho từng khuôn mặt.'
              : 'Minimalist optical atelier crafting precision Beta-Titanium and botanical Acetate frames.'}
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-wide text-[#141413]">
            {t('store.title')}
          </div>
          <p className="mt-2 flex items-start gap-2 text-sm text-[#5C5A55]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1F3A32]" />
            <span>{isVi ? STORE_ADDRESS_VI : STORE_ADDRESS_EN}</span>
          </p>
          <p className="mt-1 text-xs text-[#7A7770]">{t('store.hours')}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-[#5C5A55]">
          <Link to="/" className="hover:text-[#141413]">
            {t('nav.collection')}
          </Link>
          <Link to="/don-hang" className="hover:text-[#141413]">
            {t('nav.orders')}
          </Link>
          <Link to="/cua-hang" className="hover:text-[#141413]">
            {t('store.openGoogleMaps')}
          </Link>
        </div>
      </div>

      <div className="border-t border-[#141413]/8 px-4 py-4 text-center text-xs text-[#7A7770]">
        © {new Date().getFullYear()} LUMINA OPTICS. All rights reserved.
      </div>
    </footer>
  );
}
