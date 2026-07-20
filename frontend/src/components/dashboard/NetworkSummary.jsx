import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/LanguageContext";
import { Button, Card, CardHeader, CardBody, StatusBadge } from "../../design-system";

export default function NetworkSummary({ network, canView }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader title={t('dashboardPage.networkMonitoringSummary')} description={t('dashboardPage.networkMonitoringDesc')} />
      <CardBody>
        <dl className="dashboard-definition-list dashboard-definition-list--compact">
          <div><dt>{t('dashboardPage.totalDevices')}</dt><dd>{network.available ? network.total : "—"}</dd></div>
          <div><dt><StatusBadge status="online" /></dt><dd>{network.available ? network.online : "—"}</dd></div>
          <div><dt><StatusBadge status="offline" /></dt><dd>{network.available ? network.offline : "—"}</dd></div>
          <div><dt>{t('dashboardPage.lastCheckTime')}</dt><dd>{network.lastCheckedAt ? new Date(network.lastCheckedAt).toLocaleString() : t('dashboardPage.notReported')}</dd></div>
        </dl>
        <div className="dashboard-card-action"><Button variant="secondary" disabled={!canView} onClick={() => navigate("/network")}>{t('dashboardPage.viewNetworkMonitoring')}</Button></div>
      </CardBody>
    </Card>
  );
}
