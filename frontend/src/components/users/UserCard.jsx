import { Card, Button } from "../../design-system";
import RoleBadge from "./RoleBadge";
import UserStatus from "./UserStatus";
import { useTranslation } from "../../i18n/LanguageContext";

export default function UserCard({ user, onView }) {
  const { t } = useTranslation();
  return (
    <Card className="user-card">
      <div className="user-card-head">
        <strong>{user.name}</strong>
        <UserStatus user={user} />
      </div>
      <p>{user.email}</p>
      <dl>
        <div>
          <dt>{t('userPage.employeeId')}</dt>
          <dd>{user.employeeId || "—"}</dd>
        </div>
        <div>
          <dt>{t('userPage.role')}</dt>
          <dd><RoleBadge role={user.role} /></dd>
        </div>
        <div>
          <dt>{t('userPage.department')}</dt>
          <dd>{user.department || "—"}</dd>
        </div>
      </dl>
      <Button variant="ghost" onClick={() => onView(user)}>{t('userPage.viewDetails')}</Button>
    </Card>
  );
}
