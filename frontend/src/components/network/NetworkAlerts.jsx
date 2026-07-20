import { AlertBanner } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function NetworkAlerts({ incidents }) {
  const { t } = useTranslation();

  if (!incidents?.length) {
    return (
      <AlertBanner tone="success" title={t('networkPage.noActiveNetworkAlerts')}>
        {t('networkPage.allDevicesWithinThreshold')}
      </AlertBanner>
    );
  }

  return (
    <div className="network-alerts">
      {incidents.map((i) => (
        <AlertBanner key={i._id} tone="danger" title={i.deviceId?.name || t('networkPage.deviceOffline')}>
          {i.message || t('networkPage.lastHeartbeatTimeout')}
        </AlertBanner>
      ))}
    </div>
  );
}
