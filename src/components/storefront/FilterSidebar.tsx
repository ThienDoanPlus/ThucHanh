import { RotateCcw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  resetAllFilters,
  setColorTone,
  setFaceShape,
  setFrameStyle,
  setGender,
  setMaterial,
  setPriceRange,
  setSearchQuery,
} from '../../store/slices/filterSlice';
import {
  ColorTone,
  FaceShape,
  FrameMaterial,
  FrameStyle,
  GenderTarget,
  PriceRange,
} from '../../types/eyewear';

interface FilterSidebarProps {
  onAfterChange?: () => void;
}

export function FilterSidebar({ onAfterChange }: FilterSidebarProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const filter = useAppSelector((state) => state.filter);

  const renderGroup = <T extends string>(
    title: string,
    values: T[],
    selected: T,
    getLabel: (val: T) => string,
    onSelect: (val: T) => void
  ) => (
    <div className="border-b border-[#141413]/8 pb-4">
      <div className="mb-2.5 text-xs font-semibold text-[#141413]">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((val) => {
          const isActive = selected === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => {
                onSelect(val);
                onAfterChange?.();
              }}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#1F3A32] text-white'
                  : 'bg-[#EFECE5] text-[#5C5A55] hover:bg-[#E4DFD5] hover:text-[#141413]'
              }`}
            >
              {getLabel(val)}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#141413]">{t('filters.title')}</h2>
        <button
          type="button"
          onClick={() => {
            dispatch(resetAllFilters());
            onAfterChange?.();
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#8C6D46] hover:text-[#141413] cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{t('filters.resetAll')}</span>
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7770]" />
        <input
          type="text"
          value={filter.searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder={t('filters.searchPlaceholder')}
          className="w-full rounded-lg border border-[#141413]/15 bg-white py-2 pr-3 pl-9 text-xs text-[#141413] placeholder:text-[#8E8A82] focus:border-[#1F3A32] focus:outline-none"
        />
      </div>

      {renderGroup(
        t('filters.faceShape.label'),
        Object.values(FaceShape),
        filter.faceShape,
        (val) => t(`filters.faceShape.${val}`),
        (val) => dispatch(setFaceShape(val))
      )}

      {renderGroup(
        t('filters.frameStyle.label'),
        Object.values(FrameStyle),
        filter.frameStyle,
        (val) => t(`filters.frameStyle.${val}`),
        (val) => dispatch(setFrameStyle(val))
      )}

      {renderGroup(
        t('filters.material.label'),
        Object.values(FrameMaterial),
        filter.material,
        (val) => t(`filters.material.${val}`),
        (val) => dispatch(setMaterial(val))
      )}

      {renderGroup(
        t('filters.gender.label'),
        Object.values(GenderTarget),
        filter.gender,
        (val) => t(`filters.gender.${val}`),
        (val) => dispatch(setGender(val))
      )}

      {renderGroup(
        t('filters.colorTone.label'),
        Object.values(ColorTone),
        filter.colorTone,
        (val) => t(`filters.colorTone.${val}`),
        (val) => dispatch(setColorTone(val))
      )}

      {renderGroup(
        t('filters.priceRange.label'),
        Object.values(PriceRange),
        filter.priceRange,
        (val) => t(`filters.priceRange.${val}`),
        (val) => dispatch(setPriceRange(val))
      )}
    </aside>
  );
}
