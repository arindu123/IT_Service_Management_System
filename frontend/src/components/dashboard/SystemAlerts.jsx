import { useTranslation } from "../../i18n/LanguageContext";
import { AlertBanner } from "../../design-system";

export default function SystemAlerts({ model }) {
  const { t } = useTranslation();
  const { attention } = model;
  if (!attention.total) {
    return <AlertBanner tone="success" title={t('ui.noDataAvailable')}>{t('dashboardPage.allItemsAboveMinimum')}</AlertBanner>;
  }

  const details = [
    attention.pendingApprovals && `${attention.pendingApprovals} ${t('dashboardPage.requestsAwaitingReview')}`,
    attention.damagedAssets && `${attention.damagedAssets} ${t('dashboardPage.damagedAssets')}`,
    attention.lowStock && `${attention.lowStock} ${t('dashboardPage.inventoryAlertCount')}`,
  ].filter(Boolean).join(" · ");

  return <AlertBanner tone="warning" title={t('dashboardPage.operationalItemsRequireAttention')}>{details}</AlertBanner>;
}
