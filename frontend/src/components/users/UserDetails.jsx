import { Modal } from "../../design-system";
import RoleBadge from "./RoleBadge";
import UserStatus from "./UserStatus";
import { useTranslation } from "../../i18n/LanguageContext";

export default function UserDetails({ user, open, onClose }) {
  const { t } = useTranslation();
  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title={user.name} size="large">
      <div className="user-details-grid">
        <div>
          <small>{t('userPage.profileInformation')}</small>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
          <span>{t('userPage.employeeId')}: {user.employeeId || "—"}</span>
        </div>
        <div>
          <small>{t('userPage.accountInformation')}</small>
          <UserStatus user={user} />
          <span>{t('userPage.department')}: {user.department || "—"}</span>
          <span>{t('userPage.lastActivity')}: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}</span>
        </div>
        <div>
          <small>{t('userPage.assignedRole')}</small>
          <RoleBadge role={user.role} />
        </div>
        <div>
          <small>{t('userPage.permissionsSummary')}</small>
          <span>{t('userPage.accessGovernedByRole')}</span>
        </div>
      </div>
    </Modal>
  );
}
