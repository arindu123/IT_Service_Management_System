import { useTranslation } from "../../i18n/LanguageContext";

export default function UserHeader({ count }) {
  const { t } = useTranslation();
  return (
    <header className="users-header">
      <div>
        <p className="users-kicker">{t('userPage.administration')}</p>
        <h1>{t('userPage.title')}</h1>
        <p>{t('userPage.description')}</p>
      </div>
      <span>{t('userPage.registeredUsers', { count })}</span>
    </header>
  );
}
