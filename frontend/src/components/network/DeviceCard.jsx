import { Button, Card } from "../../design-system";
import DeviceStatus from "./DeviceStatus";
import PingStatus from "./PingStatus";
import { useTranslation } from "../../i18n/LanguageContext";

export default function DeviceCard({ device, onView, onCheck, onPause, onResume }) {
  const { t } = useTranslation();
  return (
    <Card className="network-device-card">
      <div className="network-card-heading">
        <strong>{device.name}</strong>
        <DeviceStatus status={device.status} />
      </div>
      <p>{device.ipAddress || device.hostname || t('networkPage.noAddress')}</p>
      <dl>
        <div>
          <dt>{t('networkPage.type')}</dt>
          <dd>{device.deviceType}</dd>
        </div>
        <div>
          <dt>{t('networkPage.location')}</dt>
          <dd>{[device.building, device.room].filter(Boolean).join(" / ") || "—"}</dd>
        </div>
        <div>
          <dt>{t('networkPage.response')}</dt>
          <dd><PingStatus device={device} /></dd>
        </div>
      </dl>
      <div className="network-card-actions">
        <Button variant="ghost" onClick={() => onView(device)}>{t('networkPage.view')}</Button>
        {onCheck && <Button variant="secondary" onClick={() => onCheck(device)}>{t('networkPage.check')}</Button>}
        {device.monitoringEnabled === false
          ? onResume && <Button variant="ghost" onClick={() => onResume(device)}>{t('networkPage.resume')}</Button>
          : onPause && <Button variant="ghost" onClick={() => onPause(device)}>{t('networkPage.pausedStatus')}</Button>}
      </div>
    </Card>
  );
}
