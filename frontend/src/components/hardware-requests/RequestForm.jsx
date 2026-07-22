import { useEffect, useState } from "react";
import { Button, Card, CardBody, FileUpload, Input, Select, Textarea, ValidationMessage } from "../../design-system";
import { HARDWARE_CATEGORIES, PRIORITIES, REQUEST_TYPES } from "./requestConstants";
import { useTranslation } from "../../i18n/LanguageContext";
import { assetService } from "../../services/assetService";

const assetDeviceToHardwareCategory = (deviceType) => {
  if (["computer", "laptop"].includes(deviceType)) return "laptop_desktop";
  if (HARDWARE_CATEGORIES.includes(deviceType)) return deviceType;
  return "";
};

const assetLabel = (asset) =>
  [asset.itemNumber || asset.assetId, asset.brand, asset.model].filter(Boolean).join(" ");

export default function RequestForm({ form, setForm, user, files = [], onFiles, onSubmit, onCancel, loading, error, mode = "create", enumLabel }) {
  const { t } = useTranslation();
  const [myAssets, setMyAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(() => mode === "create");

  useEffect(() => {
    if (mode !== "create") return;
    let active = true;
    assetService.listMyAssigned()
      .then((assets) => {
        if (active) setMyAssets(assets);
      })
      .catch(() => {
        if (active) setMyAssets([]);
      })
      .finally(() => {
        if (active) setAssetsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode]);

  const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  const selectedAsset = myAssets.find((asset) => asset._id === form.assetId);

  const handleAssetSelect = (event) => {
    const selectedId = event.target.value;
    if (!selectedId) {
      setForm((value) => ({ ...value, assetId: "", currentAssetTag: "" }));
      return;
    }
    const selectedAsset = myAssets.find((a) => a._id === selectedId);
    if (selectedAsset) {
      setForm((value) => ({
        ...value,
        assetId: selectedAsset._id,
        currentAssetTag: selectedAsset.itemNumber || selectedAsset.assetId || "",
        hardwareCategory: assetDeviceToHardwareCategory(selectedAsset.deviceType) || value.hardwareCategory,
      }));
    }
  };

  return (
    <form className="request-form" onSubmit={onSubmit} noValidate>
      {error && <ValidationMessage>{error}</ValidationMessage>}
      {mode === "create" && (
        <Card variant="muted" className="request-form-card request-form-card--compact">
          <CardBody className="request-form-card-body">
            <div className="request-form-section-heading">
              <h2 className="request-form-section-title">{t('requestPage.requesterInformation')}</h2>
            </div>
            <div className="request-form-grid">
              <Input label={t('requestPage.employeeId')} value={user.employeeId || t('requestPage.notAvailable')} disabled />
              <Input label={t('requestPage.name')} value={user.name || t('requestPage.currentUser')} disabled />
              <Input label={t('requestPage.department')} value={user.department || form.department || t('requestPage.unassigned')} disabled />
              <Input label={t('requestPage.contact')} value={user.phone || user.email || t('requestPage.notAvailable')} disabled />
            </div>
          </CardBody>
        </Card>
      )}
      <Card className="request-form-card">
        <CardBody className="request-form-card-body">
          <div className="request-form-section-heading">
            <h2 className="request-form-section-title">{t('requestPage.requestInformation')}</h2>
          </div>
          <div className="request-form-grid request-form-grid--primary">
            {mode === "create" && (
              <div className="request-asset-picker">
                <Select label={t('requestPage.assetTag')} required name="assetId" value={form.assetId || ""} onChange={handleAssetSelect}>
                  <option value="">{assetsLoading ? t('requestPage.loadingIssuedAssets') : t('requestPage.selectIssuedAsset')}</option>
                  {myAssets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {assetLabel(asset)} ({asset.serialNumber})
                    </option>
                  ))}
                </Select>
                {!assetsLoading && !myAssets.length && <p className="request-issued-assets-empty">{t('requestPage.noIssuedAssets')}</p>}
                {selectedAsset && (
                  <div className="request-issued-asset is-selected" aria-live="polite">
                    <strong>{selectedAsset.itemNumber || selectedAsset.assetId}</strong>
                    <span>{selectedAsset.brand} {selectedAsset.model} | {selectedAsset.serialNumber}</span>
                    <span className="request-issued-asset-selected">Selected</span>
                  </div>
                )}
              </div>
            )}
            <Select label={t('requestPage.requestTypeLabel')} required name="requestType" value={form.requestType} onChange={change}>
              {REQUEST_TYPES.map((value) => <option key={value} value={value}>{enumLabel("requestType", value)}</option>)}
            </Select>
            <Select label={t('requestPage.deviceType')} required name="hardwareCategory" value={form.hardwareCategory} onChange={change}>
              {HARDWARE_CATEGORIES.map((value) => <option key={value} value={value}>{enumLabel("hardwareCategory", value)}</option>)}
            </Select>
            <Select label={t('requestPage.priority')} name="priority" value={form.priority} onChange={change}>
              {PRIORITIES.map((value) => <option key={value} value={value}>{enumLabel("priority", value)}</option>)}
            </Select>
            <Input type="datetime-local" label={t('requestPage.preferredInstallationTime')} optional name="preferredInstallationTime" value={form.preferredInstallationTime} onChange={change} />
          </div>
          <div className="request-form-stack">
            <Textarea label={t('requestPage.issueDescription')} required name="issueDescription" value={form.issueDescription} onChange={change} minLength="10" helpText={t('requestPage.provideAtLeast10Chars')} />
            <Textarea label={t('requestPage.businessImpact')} optional name="businessImpact" value={form.businessImpact} onChange={change} />
            <Input label={t('requestPage.requestedSpecification')} optional name="requestedSpecification" value={form.requestedSpecification} onChange={change} />
            <Textarea label={t('requestPage.remarks')} optional name="remarks" value={form.remarks} onChange={change} />
          </div>
        </CardBody>
      </Card>
      {mode === "create" && (
        <div className="request-form-evidence">
          <FileUpload label={t('requestPage.supportingEvidence')} optional multiple accept=".jpg,.jpeg,.png,.pdf,.mp4,.mov,.webm" onChange={onFiles} helpText={t('requestPage.evidenceDescription')}>
            {files.length > 0 && <span>{t('requestPage.filesSelected', { count: files.length })}</span>}
          </FileUpload>
        </div>
      )}
      <div className="request-form-actions">
        <Button type="button" variant="secondary" disabled={loading} onClick={onCancel}>{t('requestPage.cancel')}</Button>
        <Button type="submit" loading={loading}>{mode === "edit" ? t('requestPage.saveChanges') : t('requestPage.submitRequest')}</Button>
      </div>
    </form>
  );
}
