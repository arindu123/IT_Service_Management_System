import { Link } from "react-router-dom";

const routeLabels = {
  dashboard: "Dashboard", account: "My Account", assets: "Assets", "asset-issues": "Asset Custody Records",
  tickets: "Hardware Requests", inventory: "IT Inventory", network: "Network Monitoring", repairs: "Repairs",
  users: "User Management", add: "Add", create: "Create", edit: "Edit", unauthorized: "Unauthorized",
};

export default function Breadcrumbs({ pathname, currentLabel }) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    label: index === segments.length - 1 && currentLabel ? currentLabel : routeLabels[segment] || (segment.length > 16 ? "Details" : segment.replace(/-/g, " ")),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));
  return <nav className="enterprise-breadcrumbs" aria-label="Breadcrumb"><ol><li><Link to="/dashboard">Home</Link></li>{crumbs.map((crumb, index) => <li key={crumb.href}>{index === crumbs.length - 1 ? <span aria-current="page">{crumb.label}</span> : <Link to={crumb.href}>{crumb.label}</Link>}</li>)}</ol></nav>;
}
