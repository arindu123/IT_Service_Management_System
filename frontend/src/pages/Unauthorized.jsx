import { Link } from "react-router-dom";
import { Card, CardBody } from "../design-system";

export default function Unauthorized() {
  return <main className="shell-state-page"><Card variant="elevated"><CardBody><p className="shell-state-code">403</p><h1>Access restricted</h1><p>Your account does not have permission to open this area. Contact the system administrator if you believe this is incorrect.</p><Link className="gov-button gov-button--primary" to="/account">Return to My Account</Link></CardBody></Card></main>;
}
