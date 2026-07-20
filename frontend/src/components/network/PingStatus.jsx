import { useTranslation } from "../../i18n/LanguageContext";

export default function PingStatus({ device }) {
  const { t } = useTranslation();
  return (
    <span className="network-ping">
      {device.responseTimeMs != null ? `${device.responseTimeMs} ms` : t('networkPage.noResponse')}
    </span>
  );
}
