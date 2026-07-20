import { Card, TableEmptyState } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function ReportTable() {
  const { t } = useTranslation();
  return (
    <Card className="report-table-section">
      <h2>{t('reportsPage.reportData')}</h2>
      <TableEmptyState title={t('reportsPage.selectReportCategory')} description={t('reportsPage.reportDataDescription')} />
    </Card>
  );
}
