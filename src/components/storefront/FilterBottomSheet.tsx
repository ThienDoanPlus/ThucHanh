import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FilterSidebar } from './FilterSidebar';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterBottomSheet({ isOpen, onClose }: FilterBottomSheetProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 backdrop-blur-xs lg:hidden">
      <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-[#FAF9F6] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-[#141413]/10 pb-3">
          <span className="text-sm font-semibold text-[#141413]">{t('filters.title')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="rounded-lg p-1.5 text-[#5C5A55] hover:bg-[#EAE6DE] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <FilterSidebar />

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#1F3A32] py-3 text-sm font-semibold text-white cursor-pointer"
        >
          {t('filters.openMobile')}
        </button>
      </div>
    </div>
  );
}
