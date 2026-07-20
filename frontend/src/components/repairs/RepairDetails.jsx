import { Card, CardBody, CardHeader, Modal } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";
import RepairActions from "./RepairActions";
import RepairAssignment from "./RepairAssignment";
import RepairStatus from "./RepairStatus";
import RepairTimeline from "./RepairTimeline";
import { formatDate, repairAsset } from "./repairUtils";

const Item = ({ label, value, t }) => <div><dt>{label}</dt><dd>{value || t("repairPage.notRecorded")}</dd></div>;

export default function RepairDetails({ repair, open, onClose, canManage, onEdit, onDelete, deleting }) {
  const { t } = useTranslation();
  if (!repair) return null;
  return <Modal open={open} onClose={onClose} title={`${t("repairPage.repairId")} · ${repair.rrNumber || repair.repairId}`} size="lg">
    <div className="repair-details-stack">
      <Card><CardHeader title={t("repairPage.repairSummary")} action={<RepairStatus status={repair.repairStatus} />} /><CardBody><dl className="repair-detail-grid">
        <Item label={t("repairPage.repairId")} value={repair.repairId} t={t}/><Item label={t("repairPage.rrNumber")} value={repair.rrNumber} t={t}/><Item label={t("repairPage.type")} value={repair.type} t={t}/><Item label={t("repairPage.model")} value={repair.model} t={t}/><Item label={t("repairPage.requestedByLabel")} value={repair.userName} t={t}/><Item label={t("repairPage.office")} value={repair.office} t={t}/><Item label={t("repairPage.receivedDate")} value={formatDate(repair.receivedDate)} t={t}/>
      </dl></CardBody></Card>
      <Card><CardHeader title={t("repairPage.asset")}/><CardBody><dl className="repair-detail-grid"><Item label={t("repairPage.asset")} value={repairAsset(repair)} t={t}/><Item label={t("repairPage.serialNumber")} value={repair.serialNumber} t={t}/><Item label={t("repairPage.servicePrinter")} value={repair.servicePrinter} t={t}/></dl></CardBody></Card>
      <Card><CardHeader title={t("repairPage.errorDescription")}/><CardBody><dl className="repair-detail-grid"><Item label={t("repairPage.errorDescription")} value={repair.errorDescription} t={t}/><Item label={t("repairPage.specialNote")} value={repair.specialNote} t={t}/></dl></CardBody></Card>
      <RepairAssignment repair={repair}/><RepairTimeline repair={repair}/>
      <Card><CardHeader title={t("repairPage.notes")}/><CardBody><dl className="repair-detail-grid"><Item label={t("repairPage.returnSituation")} value={repair.returnSituation} t={t}/><Item label={t("repairPage.returnDate")} value={formatDate(repair.returnDate)} t={t}/><Item label={t("repairPage.notes")} value={repair.notes} t={t}/><Item label={t("repairPage.completionDate")} value={formatDate(repair.completionDate)} t={t}/></dl></CardBody></Card>
      <Card><CardHeader title={t("repairPage.attachments")}/><CardBody><p className="repair-not-available">{t("repairPage.attachmentsNotProvided")}</p></CardBody></Card>
      {canManage && <RepairActions onEdit={onEdit} onDelete={onDelete} deleting={deleting}/>} 
    </div>
  </Modal>;
}
