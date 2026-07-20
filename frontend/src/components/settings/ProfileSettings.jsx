import { Card } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function ProfileSettings({ user }) {
  const { t } = useTranslation();
  return (
    <Card>
      <h2>{t('settingsPage.myProfile')}</h2>
      <dl className="settings-list">
        <div className="settings-row">
          <dt>{t('settingsPage.name')}</dt>
          <dd>{user.name || "—"}</dd>
        </div>
        <div className="settings-row">
          <dt>{t('settingsPage.employeeId')}</dt>
          <dd>{user.employeeId || "—"}</dd>
        </div>
        <div className="settings-row">
          <dt>{t('settingsPage.email')}</dt>
          <dd>{user.email || "—"}</dd>
        </div>
        <div className="settings-row">
          <dt>{t('settingsPage.department')}</dt>
          <dd>{user.department || "—"}</dd>
        </div>
      </dl>
      <p className="settings-note">{t('settingsPage.profileEditingNotSupported')}</p>
    </Card>
  );
}
