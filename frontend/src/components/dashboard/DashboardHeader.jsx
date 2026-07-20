import { useTranslation } from "../../i18n/LanguageContext";
import { Button } from "../../design-system";

export default function DashboardHeader({ lastUpdated, refreshing, onRefresh }) {
  const { t } = useTranslation();
  return (
    <header className="dashboard-page-header">
      <div>
        <p className="dashboard-kicker">{t('dashboardPage.operationalSummary')}</p>
        <h1>{t('common.appName')}</h1>
        <p>{t('dashboardPage.currentWorkloadDesc')}</p>
      </div>
      <div className="dashboard-header-actions">
        <span aria-live="polite">{t('ui.lastUpdated')}: {lastUpdated || t('common.notAvailable')}</span>
        <Button variant="secondary" loading={refreshing} onClick={onRefresh}>{t('common.refresh')}</Button>
      </div>
    </header>
  );
}
