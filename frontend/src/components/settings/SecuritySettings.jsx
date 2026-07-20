import { Button, Card } from "../../design-system";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/LanguageContext";

export default function SecuritySettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Card>
      <h2>{t('settingsPage.securityPreferences')}</h2>
      <p>{t('settingsPage.securityDescription')}</p>
      <Button variant="secondary" onClick={() => navigate("/forgot-password")}>{t('settingsPage.resetPassword')}</Button>
      <p className="settings-note">{t('settingsPage.securityNote')}</p>
    </Card>
  );
}
