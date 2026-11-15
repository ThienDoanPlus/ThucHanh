import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('en') ? 'en' : 'vi';

  const switchLang = (lang: 'vi' | 'en') => {
    void i18n.changeLanguage(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lumina_lang', lang);
    }
  };

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-md bg-[#E8E4DC] p-0.5 text-xs"
      role="group"
      aria-label="Language switcher"
    >
      <button
        type="button"
        onClick={() => switchLang('vi')}
        className={`px-2 py-1 rounded font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          current === 'vi'
            ? 'bg-white text-[#141413] shadow-xs'
            : 'text-[#5C5A55] hover:text-[#141413]'
        }`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => switchLang('en')}
        className={`px-2 py-1 rounded font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          current === 'en'
            ? 'bg-white text-[#141413] shadow-xs'
            : 'text-[#5C5A55] hover:text-[#141413]'
        }`}
      >
        EN
      </button>
    </div>
  );
}
