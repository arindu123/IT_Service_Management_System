import { Card, CardBody, CardHeader, Modal } from "../../design-system";
import RepairActions from "./RepairActions";
import RepairAssignment from "./RepairAssignment";
import RepairStatus from "./RepairStatus";
import RepairTimeline from "./RepairTimeline";
import { formatDate, repairAsset } from "./repairUtils";

const Item = ({ label, value }) => <div><dt>{label}</dt><dd>{value || "Not recorded"}</dd></div>;

export default function RepairDetails({ repair, open, onClose, canManage, onEdit, onDelete, deleting }) {
  if (!repair) return null;
  return <Modal open={open} onClose={onClose} title={`Repair · ${repair.rrNumber || repair.repairId}`} size="lg">
    <div className="repair-details-stack">
      <Card><CardHeader title="Repair summary" action={<RepairStatus status={repair.repairStatus} />} /><CardBody><dl className="repair-detail-grid">
        <Item label="Repair ID" value={repair.repairId}/><Item label="RR number" value={repair.rrNumber}/><Item label="Type" value={repair.type}/><Item label="Model" value={repair.model}/><Item label="Requested by" value={repair.userName}/><Item label="Office" value={repair.office}/><Item label="Received date" value={formatDate(repair.receivedDate)}/>
      </dl></CardBody></Card>
      <Card><CardHeader title="Asset information"/><CardBody><dl className="repair-detail-grid"><Item label="Asset" value={repairAsset(repair)}/><Item label="Serial number" value={repair.serialNumber}/><Item label="Service printer" value={repair.servicePrinter}/></dl></CardBody></Card>
      <Card><CardHeader title="Problem description"/><CardBody><dl className="repair-detail-grid"><Item label="Error description" value={repair.errorDescription}/><Item label="Special note" value={repair.specialNote}/></dl></CardBody></Card>
      <RepairAssignment repair={repair}/><RepairTimeline repair={repair}/>
      <Card><CardHeader title="Resolution notes"/><CardBody><dl className="repair-detail-grid"><Item label="Return situation" value={repair.returnSituation}/><Item label="Return date" value={formatDate(repair.returnDate)}/><Item label="Notes" value={repair.notes}/><Item label="Completion date" value={formatDate(repair.completionDate)}/></dl></CardBody></Card>
      <Card><CardHeader title="Attachments"/><CardBody><p className="repair-not-available">Attachments are not provided by the existing Repair API.</p></CardBody></Card>
      {canManage && <RepairActions onEdit={onEdit} onDelete={onDelete} deleting={deleting}/>} 
    </div>
  </Modal>;
}
