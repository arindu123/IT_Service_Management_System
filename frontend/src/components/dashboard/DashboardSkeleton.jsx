import { useTranslation } from "../../i18n/LanguageContext";

export default function DashboardSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="dashboard-skeleton" role="status" aria-label={t('dashboard.loading')}>
      <span className="sr-only">{t('dashboard.loading')}</span>
      <div className="dashboard-skeleton-alert" />
      <div className="dashboard-stats-grid">{Array.from({ length: 5 }, (_, index) => <div className="dashboard-skeleton-card" key={index} />)}</div>
      <div className="dashboard-skeleton-panel" />
      <div className="dashboard-section-grid"><div className="dashboard-skeleton-panel" /><div className="dashboard-skeleton-panel" /></div>
    </div>
  );
}
