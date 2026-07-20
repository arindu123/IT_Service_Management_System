import { Link } from "react-router-dom";
import { Card, CardBody } from "../design-system";
import { useTranslation } from "../i18n/LanguageContext";

export default function NotFound() {
  const { t } = useTranslation();
  return <main className="shell-state-page"><Card variant="elevated"><CardBody><p className="shell-state-code">404</p><h1>{t('ui.pageNotFound')}</h1><p>{t('ui.pageNotFoundDescription')}</p><Link className="gov-button gov-button--primary" to="/dashboard">{t('ui.returnToDashboard')}</Link></CardBody></Card></main>;
}
