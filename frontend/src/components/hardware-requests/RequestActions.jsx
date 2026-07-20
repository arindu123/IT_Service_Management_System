import { Button, Card, CardBody, CardHeader } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function RequestActions({ canEdit, loading, onEdit, onDelete, onBack }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader title={t('requestPage.actionsTitle')} />
      <CardBody>
        <div className="request-action-list">
          {canEdit && <Button onClick={onEdit}>{t('requestPage.updateRequest')}</Button>}
          {canEdit && <Button variant="danger" loading={loading} onClick={onDelete}>{t('requestPage.deleteRequest')}</Button>}
          <Button variant="secondary" onClick={onBack}>{t('requestPage.backToHardwareRequests')}</Button>
          {!canEdit && <p>{t('requestPage.requestCanBeEdited')}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
