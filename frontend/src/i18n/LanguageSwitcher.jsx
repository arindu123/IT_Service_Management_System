import { useTranslation } from "./LanguageContext";

function LanguageSwitcher({ className = "" }) {
  const { language, languages, setLanguage, t } = useTranslation();

  return (
    <div className={`language-switcher ${className}`.trim()} aria-label={t("language.switcherLabel")}>
      {languages.map((item) => (
        <button
          key={item.code}
          type="button"
          className={language === item.code ? "is-active" : ""}
          onClick={() => setLanguage(item.code)}
          aria-pressed={language === item.code}
          title={item.nativeName}
        >
          <span>{item.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
