import { Card, Select } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

const languages = [
  { value: "en", label: "English" },
  { value: "si", label: "සිංහල" },
  { value: "ta", label: "தமிழ்" }
];

export default function SystemPreferences() {
  const { t } = useTranslation();
  return (
    <Card>
      <h2>{t('settingsPage.systemPreferences')}</h2>
      <Select label={t('settingsPage.interfaceLanguage')} value={localStorage.getItem("language") || "en"} disabled options={languages} />
      <p className="settings-note">{t('settingsPage.languageNote')}</p>
    </Card>
  );
}
