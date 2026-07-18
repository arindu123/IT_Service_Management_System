import { Button } from "../../design-system";

export default function RequestHeader({ onCreate }) {
  return <header className="request-page-header"><div><p className="request-kicker">Service management</p><h1>Hardware Requests</h1><p>Manage employee hardware requests and workflow status.</p></div><Button onClick={onCreate}>Create Request</Button></header>;
}
