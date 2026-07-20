import { Card } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function ReportSummary({ data, loading }) {
  const { t } = useTranslation();
  const display = (value) => loading ? "…" : value == null ? t('reportsPage.unavailable') : value;

  const cards = [
    [t('reportsPage.totalRequests'), data?.tickets?.total],
    [t('reportsPage.completedRequests'), data?.tickets?.completed],
    [t('reportsPage.assetCount'), data?.assets?.total],
    [t('reportsPage.repairCount'), data?.repairs?.total],
    [t('reportsPage.inventoryItems'), data?.inventory?.totalItems]
  ];

  return (
    <div className="report-summary" aria-busy={loading}>
      {cards.map(([label, value]) => (
        <Card key={label}>
          <span>{label}</span>
          <strong>{display(value)}</strong>
        </Card>
      ))}
    </div>
  );
}
