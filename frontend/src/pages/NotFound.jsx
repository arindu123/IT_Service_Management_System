import { Link } from "react-router-dom";
import { Card, CardBody } from "../design-system";

export default function NotFound() {
  return <main className="shell-state-page"><Card variant="elevated"><CardBody><p className="shell-state-code">404</p><h1>Page not found</h1><p>The requested page does not exist or may have been moved.</p><Link className="gov-button gov-button--primary" to="/dashboard">Return to Dashboard</Link></CardBody></Card></main>;
}
