import { useTranslation } from "../../i18n/LanguageContext";

export default function SettingsHeader() {
  const { t } = useTranslation();
  return (
    <header className="settings-header">
      <p>{t('settingsPage.systemConfiguration')}</p>
      <h1>{t('settingsPage.title')}</h1>
      <span>{t('settingsPage.description')}</span>
    </header>
  );
}
