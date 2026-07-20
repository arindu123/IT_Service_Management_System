import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext";

export default function Breadcrumbs({ pathname, currentLabel }) {
  const { t } = useTranslation();
  const segments = pathname.split("/").filter(Boolean);
  const routeLabels = {
    dashboard: t('breadcrumbs.dashboard'), account: t('breadcrumbs.myAccount'), assets: t('breadcrumbs.assets'), "asset-issues": t('breadcrumbs.assetCustody'),
    tickets: t('breadcrumbs.hardwareRequests'), inventory: t('breadcrumbs.itInventory'), network: t('breadcrumbs.networkMonitoring'), repairs: t('breadcrumbs.repairs'),
    users: t('breadcrumbs.userManagement'), add: t('breadcrumbs.add'), create: t('breadcrumbs.create'), edit: t('breadcrumbs.edit'), unauthorized: t('breadcrumbs.unauthorized'),
  };
  const crumbs = segments.map((segment, index) => ({
    label: index === segments.length - 1 && currentLabel ? currentLabel : routeLabels[segment] || (segment.length > 16 ? t('breadcrumbs.details') : segment.replace(/-/g, " ")),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));
  return <nav className="enterprise-breadcrumbs" aria-label="Breadcrumb"><ol><li><Link to="/dashboard">{t('breadcrumbs.home')}</Link></li>{crumbs.map((crumb, index) => <li key={crumb.href}>{index === crumbs.length - 1 ? <span aria-current="page">{crumb.label}</span> : <Link to={crumb.href}>{crumb.label}</Link>}</li>)}</ol></nav>;
}
