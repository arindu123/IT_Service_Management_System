import { useTranslation } from "../../i18n/LanguageContext";

export default function ReportHeader() {
  const { t } = useTranslation();
  return (
    <header className="report-header">
      <div>
        <p>{t('reportsPage.analyticsGovernance')}</p>
        <h1>{t('reportsPage.title')}</h1>
        <span>{t('reportsPage.description')}</span>
      </div>
    </header>
  );
}
