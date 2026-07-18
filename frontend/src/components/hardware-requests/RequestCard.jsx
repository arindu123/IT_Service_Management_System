import { Button, Card, CardBody } from "../../design-system";
import RequestStatus, { PriorityBadge } from "./RequestStatus";
import { assignedOfficer } from "./requestConstants";

export default function RequestCard({ request, enumLabel, formatDate, onOpen, onManage, onDelete }) {
  return <Card className="request-mobile-card"><CardBody><div className="request-card-top"><strong>{request.ticketId}</strong><RequestStatus status={request.status} enumLabel={enumLabel}/></div><h2>{enumLabel("requestType",request.requestType)}</h2><p>{request.requesterProfile?.name || request.createdBy?.name || "Requester"} · {request.department}</p><dl><div><dt>Priority</dt><dd><PriorityBadge priority={request.priority} enumLabel={enumLabel}/></dd></div><div><dt>Submitted</dt><dd>{formatDate(request.createdAt)}</dd></div><div><dt>Assigned</dt><dd>{assignedOfficer(request)}</dd></div></dl><div className="request-card-actions"><Button variant="secondary" onClick={()=>onOpen(request)}>View</Button>{onManage&&<Button variant="ghost" onClick={()=>onManage(request)}>Manage</Button>}{onDelete&&<Button variant="danger" onClick={()=>onDelete(request)}>Delete</Button>}</div></CardBody></Card>;
}
