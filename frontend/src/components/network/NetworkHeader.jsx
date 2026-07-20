import { Button } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function NetworkHeader({ onAdd, canManage }) {
  const { t } = useTranslation();
  return (
    <header className="network-header">
      <div>
        <p className="network-kicker">{t('networkPage.infrastructure')}</p>
        <h1>{t('networkPage.title')}</h1>
        <p>{t('networkPage.description')}</p>
      </div>
      {canManage && <Button onClick={onAdd}>{t('networkPage.addDevice')}</Button>}
    </header>
  );
}
