import { Select, TableEmptyState } from "../../design-system";
import DeviceStatus from "./DeviceStatus";
import { useTranslation } from "../../i18n/LanguageContext";

const ranges = [
  { value: "24h", labelKey: "networkPage.last24Hours" },
  { value: "7d", labelKey: "networkPage.last7Days" },
  { value: "30d", labelKey: "networkPage.last30Days" }
];

export default function NetworkActivity({ history, range, onRangeChange, formatDateTime }) {
  const { t } = useTranslation();

  return (
    <section className="network-activity">
      <div className="network-section-heading">
        <h2>{t('networkPage.statusHistory')}</h2>
        <Select label={t('networkPage.historyRange')} value={range} onChange={event => onRangeChange(event.target.value)} options={ranges.map(r => ({ ...r, label: t(r.labelKey) }))} />
      </div>
      {history?.length ? (
        <div className="network-history" role="table">
          {history.map((item, index) => (
            <div className="network-history-row" key={item._id || index}>
              <span>{item.checkedAt ? formatDateTime(item.checkedAt) : "—"}</span>
              <DeviceStatus status={item.status} />
              <span>{item.responseTimeMs != null ? `${item.responseTimeMs} ms` : t('networkPage.noResponse')}</span>
            </div>
          ))}
        </div>
      ) : (
        <TableEmptyState title={t('networkPage.noStatusHistory')} description={t('networkPage.checksWillAppear')} />
      )}
    </section>
  );
}
