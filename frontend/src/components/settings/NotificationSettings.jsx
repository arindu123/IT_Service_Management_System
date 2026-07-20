import { AlertBanner, Card } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function NotificationSettings() {
  const { t } = useTranslation();
  return (
    <Card>
      <h2>{t('settingsPage.notificationPreferences')}</h2>
      <AlertBanner tone="info" title={t('settingsPage.managedBySystem')}>
        {t('settingsPage.notificationNote')}
      </AlertBanner>
    </Card>
  );
}
