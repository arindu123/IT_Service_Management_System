import { Button, Card, CardBody, CardHeader, TableEmptyState } from "../../design-system";
import { fileSize } from "./requestConstants";
import { useTranslation } from "../../i18n/LanguageContext";

export default function RequestEvidence({ files = [], formatDate, loading, canDelete, onView, onDownload, onDelete }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader title={t('requestPage.attachmentsTitle')} description={t('requestPage.evidenceFiles', { count: files.length })} />
      <CardBody>
        {files.length ? (
          <ul className="request-evidence-list">
            {files.map((file) => (
              <li key={file._id}>
                <div>
                  <strong>{file.originalName}</strong>
                  <span>{fileSize(file.size)} · {formatDate(file.uploadedAt || file.createdAt)}</span>
                </div>
                <div>
                  <Button variant="ghost" disabled={loading} onClick={() => onView(file)}>{t('requestPage.viewBtn')}</Button>
                  <Button variant="secondary" disabled={loading} onClick={() => onDownload(file)}>{t('requestPage.downloadBtn')}</Button>
                  {canDelete(file) && <Button variant="danger" disabled={loading} onClick={() => onDelete(file)}>{t('requestPage.deleteBtn')}</Button>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <TableEmptyState title={t('requestPage.noAttachments')} description={t('requestPage.noAttachmentsDesc')} />
        )}
      </CardBody>
    </Card>
  );
}
