import { Button, Modal } from "../../design-system";
import DeviceStatus from "./DeviceStatus";
import PingStatus from "./PingStatus";
import NetworkActivity from "./NetworkActivity";
import { useTranslation } from "../../i18n/LanguageContext";

export default function DeviceDetails({ device, open, onClose, history, range, onRangeChange, uptimePercent, formatDateTime, loading, onCheck }) {
  const { t } = useTranslation();
  if (!device) return null;

  return (
    <Modal open={open} onClose={onClose} title={device.name || t('networkPage.deviceName')} size="large">
      <div className="network-details">
        {loading && <p role="status">{t('networkPage.loadingDeviceDetails')}</p>}
        <section>
          <h2>{t('networkPage.deviceOverview')}</h2>
          <div className="network-detail-grid">
            <div>
              <small>{t('networkPage.status')}</small>
              <DeviceStatus status={device.status} />
            </div>
            <div>
              <small>{t('networkPage.deviceType')}</small>
              <strong>{device.deviceType || "—"}</strong>
            </div>
            <div>
              <small>{t('networkPage.ipInformation')}</small>
              <strong>{device.ipAddress || device.hostname || "—"}</strong>
            </div>
            <div>
              <small>{t('networkPage.lastResponse')}</small>
              <strong><PingStatus device={device} /></strong>
            </div>
            <div>
              <small>{t('networkPage.availability')}</small>
              <strong>{uptimePercent}%</strong>
            </div>
            <div>
              <small>{t('networkPage.lastChecked')}</small>
              <strong>{device.lastCheckedAt ? formatDateTime(device.lastCheckedAt) : "—"}</strong>
            </div>
          </div>
        </section>
        <NetworkActivity history={history} range={range} onRangeChange={onRangeChange} formatDateTime={formatDateTime} />
        {onCheck && (
          <div className="network-detail-actions">
            <Button onClick={() => onCheck(device)}>{t('networkPage.checkNow')}</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
