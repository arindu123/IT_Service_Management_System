import { Card, CardBody, CardHeader } from "../../design-system";
import RequestStatus, { PriorityBadge } from "./RequestStatus";
import { assignedOfficer } from "./requestConstants";

const Item=({label,children,wide})=><div className={wide?"request-detail-item request-detail-item--wide":"request-detail-item"}><dt>{label}</dt><dd>{children||"Not available"}</dd></div>;
export default function RequestDetails({ request, enumLabel, formatDate }) {
  const requester=request.requesterProfile||request.createdBy||{};
  return <div className="request-details-stack">
    <Card><CardHeader title="Request summary" action={<RequestStatus status={request.status} enumLabel={enumLabel}/>}/><CardBody><dl className="request-detail-grid"><Item label="Request ID">{request.ticketId}</Item><Item label="Requester">{requester.name}</Item><Item label="Department">{request.department||requester.department}</Item><Item label="Created date">{formatDate(request.createdAt)}</Item><Item label="Priority"><PriorityBadge priority={request.priority} enumLabel={enumLabel}/></Item><Item label="Assigned officer">{assignedOfficer(request)}</Item></dl></CardBody></Card>
    <Card><CardHeader title="Request information"/><CardBody><dl className="request-detail-grid"><Item label="Device type">{enumLabel("hardwareCategory",request.hardwareCategory)}</Item><Item label="Request type">{enumLabel("requestType",request.requestType)}</Item><Item label="Asset tag">{request.currentAssetTag}</Item><Item label="Requested specification">{request.requestedSpecification}</Item><Item label="Reason / description" wide>{request.issueDescription}</Item><Item label="Business impact" wide>{request.businessImpact}</Item><Item label="Remarks" wide>{request.remarks}</Item></dl></CardBody></Card>
  </div>;
}
