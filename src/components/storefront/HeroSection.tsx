import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HERO_BANNER_IMAGE } from '../../data/products';
import { useAppDispatch } from '../../store';
import { openTryOnModal } from '../../store/slices/authSlice';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export function HeroSection({ onExploreClick }: HeroSectionProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 pb-10 sm:px-6 lg:pt-12">
      <div className="grid items-stretch gap-8 lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="text-xs font-medium tracking-wide text-[#7A7770]">{t('hero.kicker')}</p>
          <h1
            className="mt-3 font-display text-4xl leading-[1.1] font-semibold text-[#141413] sm:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            {t('hero.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5C5A55]">
            {t('hero.subtitle')}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExploreClick}
              className="rounded-lg bg-[#1F3A32] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172C26] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('hero.ctaExplore')}
            </button>
            <button
              type="button"
              onClick={() => dispatch(openTryOnModal(null))}
              className="inline-flex items-center gap-2 rounded-lg border border-[#141413]/20 bg-white px-5 py-3 text-sm font-semibold text-[#141413] transition-colors hover:bg-[#F2EFE9] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#8C6D46]" />
              <span>{t('hero.ctaTryOn')}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="aspect-16/9 h-full w-full overflow-hidden rounded-2xl bg-[#EFECE5]">
            <img
              src={HERO_BANNER_IMAGE}
              alt="LUMINA OPTICS handcrafted titanium and tortoise eyewear"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
