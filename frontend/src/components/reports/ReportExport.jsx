import { AlertBanner } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function ReportExport() {
  const { t } = useTranslation();
  return (
    <AlertBanner tone="info" title={t('reportsPage.exportAvailability')}>
      {t('reportsPage.exportNotProvided')}
    </AlertBanner>
  );
}
