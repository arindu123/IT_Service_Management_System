import { Link } from "react-router-dom";
import { Card, CardBody } from "../design-system";
import { useTranslation } from "../i18n/LanguageContext";

export default function Unauthorized() {
  const { t } = useTranslation();
  return <main className="shell-state-page"><Card variant="elevated"><CardBody><p className="shell-state-code">403</p><h1>{t('ui.accessRestricted')}</h1><p>{t('ui.accessRestrictedDescription')}</p><Link className="gov-button gov-button--primary" to="/account">{t('ui.returnToMyAccount')}</Link></CardBody></Card></main>;
}
