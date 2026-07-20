import { StatusBadge } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function UserStatus({ user }) {
  const { t } = useTranslation();
  const active = user.isActive !== false && user.status !== "inactive";
  return <StatusBadge tone={active ? "success" : "neutral"} label={active ? t('userPage.active') : t('userPage.inactive')} />;
}
