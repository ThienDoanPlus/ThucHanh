import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  calculateUrbanRoadDistanceKm,
  DELIVERY_PRESET_ZONES,
  getShippingFeeByDistance,
  STORE_ADDRESS_EN,
  STORE_ADDRESS_VI,
  STORE_ORIGIN,
} from '../utils/shipping';
import { formatCurrencyVnd } from '../utils/formatters';

export function StoreLocatorPage() {
  const { t, i18n } = useTranslation();
  const isVi = !i18n.language.startsWith('en');

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${STORE_ORIGIN.lat},${STORE_ORIGIN.lng}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[#141413] sm:text-4xl">
        {t('store.title')}
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-12">
        <div className="space-y-4 rounded-2xl border border-[#141413]/10 bg-white p-6 lg:col-span-6">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#1F3A32]" />
            <div>
              <div className="text-sm font-semibold text-[#141413]">LUMINA OPTICS Flagship</div>
              <p className="mt-1 text-sm text-[#5C5A55]">
                {isVi ? STORE_ADDRESS_VI : STORE_ADDRESS_EN}
              </p>
              <p className="mt-1 text-xs text-[#7A7770]">{t('store.hours')}</p>
            </div>
          </div>

          <div className="font-mono-tabular rounded-lg bg-[#FAF9F6] px-4 py-3 text-xs text-[#5C5A55]">
            GPS Origin: {STORE_ORIGIN.lat}, {STORE_ORIGIN.lng}
          </div>

          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A32] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#172C26]"
          >
            <Navigation className="h-4 w-4" />
            <span>{t('store.openGoogleMaps')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="rounded-2xl border border-[#141413]/10 bg-white p-6 lg:col-span-6">
          <h2 className="text-sm font-semibold text-[#141413]">
            {isVi
              ? 'Bảng cước giao hàng theo cự ly (Haversine × 1.35)'
              : 'Dynamic Delivery Fee Tiers (Haversine × 1.35)'}
          </h2>
          <div className="mt-4 divide-y divide-[#141413]/8 text-xs">
            {DELIVERY_PRESET_ZONES.map((zone) => {
              const dist = calculateUrbanRoadDistanceKm(zone.coords);
              const fee = getShippingFeeByDistance(dist);
              return (
                <div key={zone.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-[#141413]">
                      {isVi ? zone.labelVi : zone.labelEn}
                    </div>
                    <div className="font-mono-tabular mt-0.5 text-[#7A7770]">{dist} km</div>
                  </div>
                  <div className="font-mono-tabular font-semibold text-[#1F3A32]">
                    {fee === 0 ? t('checkout.freeship') : formatCurrencyVnd(fee)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
