import { useTranslation } from "../../i18n/LanguageContext";
import { Card, CardHeader, CardBody, StatusBadge } from "../../design-system";

export default function AssetSummary({ conditions, total }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader title={t('dashboardPage.assetConditionSummary')} description={t('dashboardPage.assetConditionDesc')} />
      <CardBody>
        <dl className="dashboard-definition-list">
          {conditions.map((condition) => (
            <div key={condition.label}><dt><StatusBadge status={condition.status} label={condition.label} /></dt><dd>{condition.value}</dd></div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}
