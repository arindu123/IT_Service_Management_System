import { Button, Card, CardBody, FileUpload, Input, Select, Textarea, ValidationMessage } from "../../design-system";
import { HARDWARE_CATEGORIES, PRIORITIES, REQUEST_TYPES } from "./requestConstants";
import { useTranslation } from "../../i18n/LanguageContext";

export default function RequestForm({ form, setForm, user, files = [], onFiles, onSubmit, onCancel, loading, error, mode = "create", enumLabel }) {
  const { t } = useTranslation();
  const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));

  return (
    <form className="request-form" onSubmit={onSubmit} noValidate>
      {error && <ValidationMessage>{error}</ValidationMessage>}
      {mode === "create" && (
        <Card variant="muted">
          <CardBody>
            <h2 className="request-form-section-title">{t('requestPage.requesterInformation')}</h2>
            <div className="request-form-grid">
              <Input label={t('requestPage.employeeId')} value={user.employeeId || t('requestPage.notAvailable')} disabled />
              <Input label={t('requestPage.name')} value={user.name || t('requestPage.currentUser')} disabled />
              <Input label={t('requestPage.department')} value={user.department || form.department || t('requestPage.unassigned')} disabled />
              <Input label={t('requestPage.contact')} value={user.phone || user.email || t('requestPage.notAvailable')} disabled />
            </div>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardBody>
          <h2 className="request-form-section-title">{t('requestPage.requestInformation')}</h2>
          <div className="request-form-grid">
            <Select label={t('requestPage.requestTypeLabel')} required name="requestType" value={form.requestType} onChange={change}>
              {REQUEST_TYPES.map((value) => <option key={value} value={value}>{enumLabel("requestType", value)}</option>)}
            </Select>
            <Select label={t('requestPage.deviceType')} required name="hardwareCategory" value={form.hardwareCategory} onChange={change}>
              {HARDWARE_CATEGORIES.map((value) => <option key={value} value={value}>{enumLabel("hardwareCategory", value)}</option>)}
            </Select>
            {mode === "create" && <Input label={t('requestPage.assetTag')} optional name="assetId" value={form.assetId || ""} onChange={change} />}
            <Input label={t('requestPage.assetTag')} optional name="currentAssetTag" value={form.currentAssetTag} onChange={change} />
            <Select label={t('requestPage.priority')} name="priority" value={form.priority} onChange={change}>
              {PRIORITIES.map((value) => <option key={value} value={value}>{enumLabel("priority", value)}</option>)}
            </Select>
            <Input type="datetime-local" label={t('requestPage.preferredInstallationTime')} optional name="preferredInstallationTime" value={form.preferredInstallationTime} onChange={change} />
          </div>
          <Textarea label={t('requestPage.issueDescription')} required name="issueDescription" value={form.issueDescription} onChange={change} minLength="10" helpText={t('requestPage.provideAtLeast10Chars')} />
          <Textarea label={t('requestPage.businessImpact')} optional name="businessImpact" value={form.businessImpact} onChange={change} />
          <Input label={t('requestPage.requestedSpecification')} optional name="requestedSpecification" value={form.requestedSpecification} onChange={change} />
          <Textarea label={t('requestPage.remarks')} optional name="remarks" value={form.remarks} onChange={change} />
        </CardBody>
      </Card>
      {mode === "create" && (
        <FileUpload label={t('requestPage.supportingEvidence')} optional multiple accept=".jpg,.jpeg,.png,.pdf,.mp4,.mov,.webm" onChange={onFiles} helpText={t('requestPage.evidenceDescription')}>
          {files.length > 0 && <span>{t('requestPage.filesSelected', { count: files.length })}</span>}
        </FileUpload>
      )}
      <div className="request-form-actions">
        <Button type="button" variant="secondary" disabled={loading} onClick={onCancel}>{t('requestPage.cancel')}</Button>
        <Button type="submit" loading={loading}>{mode === "edit" ? t('requestPage.saveChanges') : t('requestPage.submitRequest')}</Button>
      </div>
    </form>
  );
}
