import { useMemo, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FilterBottomSheet } from '../components/storefront/FilterBottomSheet';
import { FilterSidebar } from '../components/storefront/FilterSidebar';
import { HeroSection } from '../components/storefront/HeroSection';
import { ProductCard } from '../components/storefront/ProductCard';
import { INITIAL_PRODUCTS } from '../data/products';
import { useDebounce } from '../hooks/useDebounce';
import { useUrlFilterSync } from '../hooks/useUrlFilterSync';
import { useAppDispatch, useAppSelector } from '../store';
import {
  filterProductsBy6Dimensions,
  resetAllFilters,
  setFaceShape,
} from '../store/slices/filterSlice';
import { FaceShape } from '../types/eyewear';

export function HomePage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const filter = useAppSelector((state) => state.filter);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const catalogRef = useRef<HTMLElement | null>(null);

  useUrlFilterSync(true);
  const debouncedSearch = useDebounce(filter.searchQuery, 300);

  const filteredProducts = useMemo(
    () =>
      filterProductsBy6Dimensions(INITIAL_PRODUCTS, {
        ...filter,
        searchQuery: debouncedSearch,
      }),
    [filter, debouncedSearch]
  );

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <HeroSection onExploreClick={scrollToCatalog} />

      <section ref={catalogRef} className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Quick Face Shape Horizontal Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-[#141413]/10 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-[#5C5A55]">
              {t('filters.faceShape.label')}:
            </span>
            {Object.values(FaceShape).map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => dispatch(setFaceShape(shape))}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter.faceShape === shape
                    ? 'bg-[#1F3A32] text-white'
                    : 'bg-[#EFECE5] text-[#5C5A55] hover:text-[#141413]'
                }`}
              >
                {t(`filters.faceShape.${shape}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono-tabular text-xs text-[#7A7770]">
              {t('filters.resultsCount', { count: filteredProducts.length })}
            </span>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#141413]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#141413] lg:hidden cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{t('filters.openMobile')}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="hidden lg:col-span-3 lg:block">
            <FilterSidebar />
          </div>

          <div className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-[#141413]/10 bg-white px-6 py-16 text-center">
                <p className="text-sm text-[#5C5A55]">{t('filters.noResults')}</p>
                <button
                  type="button"
                  onClick={() => dispatch(resetAllFilters())}
                  className="mt-4 rounded-lg bg-[#1F3A32] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  {t('filters.resetAll')}
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <FilterBottomSheet isOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} />
    </main>
  );
}
