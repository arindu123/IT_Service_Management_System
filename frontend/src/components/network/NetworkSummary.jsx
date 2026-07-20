import { Card } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function NetworkSummary({ summary, formatDateTime }) {
  const { t } = useTranslation();
  const status = summary?.byStatus || {};
  const lastCycleAt = summary?.scheduler?.lastCycleAt;

  const cards = [
    [t('networkPage.totalDevices'), summary?.total ?? 0, "neutral"],
    [t('networkPage.online'), status.online ?? 0, "success"],
    [t('networkPage.warning'), status.warning ?? 0, "warning"],
    [t('networkPage.offline'), status.offline ?? 0, "danger"],
    [t('networkPage.paused'), status.paused ?? 0, "neutral"],
    [t('networkPage.openIncidents'), summary?.openIncidentCount ?? 0, "danger"],
    [t('networkPage.lastMonitoringCycle'), lastCycleAt ? formatDateTime(lastCycleAt) : t('networkPage.notChecked'), "info"],
  ];

  return (
    <div className="network-summary">
      {cards.map(([label, value, tone]) => (
        <Card key={label} className={`network-summary-card network-summary-card--${tone}`}>
          <span>{label}</span>
          <strong>{value}</strong>
        </Card>
      ))}
    </div>
  );
}
