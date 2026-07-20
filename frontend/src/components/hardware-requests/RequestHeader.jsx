import { Button } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function RequestHeader({ onCreate }) {
  const { t } = useTranslation();
  return (
    <header className="request-page-header">
      <div>
        <p className="request-kicker">{t('requestPage.serviceManagement')}</p>
        <h1>{t('requestPage.hardwareRequests')}</h1>
        <p>{t('requestPage.submitTraceableRequest')}</p>
      </div>
      <Button onClick={onCreate}>{t('requestPage.createRequest')}</Button>
    </header>
  );
}
