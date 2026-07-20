import { useState } from "react";
import { AlertBanner, Button, DateField, Input, Select, Textarea } from "../../design-system";
import { REQUEST_STATUSES } from "./requestConstants";
import { useTranslation } from "../../i18n/LanguageContext";

const fromRequest = (request) => ({
  status: request.status || "acknowledged",
  expectedFulfillmentDate: dateValue(request.expectedFulfillmentDate),
  itemAvailability: request.itemAvailability || "",
  procurementStatus: request.procurementStatus || "",
  installationSchedule: dateTimeValue(request.installationSchedule),
  nextAction: request.nextAction || "",
  remarks: request.remarks || "",
  comment: ""
});

export default function ApprovalPanel({ request, enumLabel, loading, canApprove, technicians = [], onSave, onApprove, onReject, onAssign }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => fromRequest(request));
  const [technicianId, setTechnicianId] = useState(request.assignedTechnician?._id || "");
  const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  const submit = (event) => { event.preventDefault(); onSave(form); };

  return (
    <form className="approval-panel" onSubmit={submit}>
      {request.status === "submitted" && (
        <AlertBanner tone="warning" title={t('requestPage.pendingAdministratorAction')}>
          {t('requestPage.reviewAndRecord')}
        </AlertBanner>
      )}
      {canApprove && (
        <div className="approval-quick-actions">
          <Button type="button" onClick={() => onApprove(form.comment)}>{t('requestPage.approveForReview')}</Button>
          <Button type="button" variant="danger" disabled={!form.comment.trim()} onClick={() => onReject(form.comment)}>{t('requestPage.reject')}</Button>
        </div>
      )}
      {canApprove && onAssign && (
        <div className="approval-assignment">
          <Select label={t('requestPage.assignTechnician')} value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}>
            <option value="">{t('requestPage.selectTechnician')}</option>
            {technicians.map((technician) => (
              <option key={technician._id} value={technician._id}>{technician.name} ({technician.employeeId || technician.email})</option>
            ))}
          </Select>
          <Button type="button" variant="secondary" disabled={!technicianId} loading={loading} onClick={() => onAssign(technicianId)}>{t('requestPage.assign')}</Button>
        </div>
      )}
      <div className="request-form-grid">
        <Select label={t('requestPage.status')} name="status" value={form.status} onChange={change}>
          {REQUEST_STATUSES.map((status) => <option key={status} value={status}>{enumLabel("status", status)}</option>)}
        </Select>
        <DateField label={t('requestPage.expectedFulfillmentDate')} optional name="expectedFulfillmentDate" value={form.expectedFulfillmentDate} onChange={change} />
        <Select label={t('requestPage.itemAvailability')} optional name="itemAvailability" value={form.itemAvailability} onChange={change}>
          <option value="">{t('requestPage.notUpdated')}</option>
          {["stock_check_pending", "available_in_stock", "reserved", "procurement_required", "received"].map((value) => (
            <option key={value} value={value}>{enumLabel("itemAvailability", value)}</option>
          ))}
        </Select>
        <Select label={t('requestPage.procurementStatus')} optional name="procurementStatus" value={form.procurementStatus} onChange={change}>
          <option value="">{t('requestPage.notUpdated')}</option>
          {["not_required", "requested", "approved", "ordered", "received", "delayed", "cancelled"].map((value) => (
            <option key={value} value={value}>{enumLabel("procurementStatus", value)}</option>
          ))}
        </Select>
        <Input type="datetime-local" label={t('requestPage.installationSchedule')} optional name="installationSchedule" value={form.installationSchedule} onChange={change} />
        <Input label={t('requestPage.nextAction')} optional name="nextAction" value={form.nextAction} onChange={change} />
      </div>
      <Textarea label={t('requestPage.comments')} optional name="comment" value={form.comment} onChange={change} helpText={t('requestPage.rejectionReasonRequired')} />
      <Textarea label={t('requestPage.internalRemarks')} optional name="remarks" value={form.remarks} onChange={change} />
      <div className="approval-footer">
        <Button type="submit" loading={loading}>{t('requestPage.saveWorkflowUpdate')}</Button>
      </div>
    </form>
  );
}

function dateValue(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function dateTimeValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
