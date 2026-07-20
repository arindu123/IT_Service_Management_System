import { Input, Select } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

const roleDefs = [
  { value: "", labelKey: "userPage.allRoles" },
  { value: "admin", labelKey: "enums.roles.admin" },
  { value: "system_admin", labelKey: "enums.roles.system_admin" },
  { value: "head_of_it", labelKey: "enums.roles.head_of_it" },
  { value: "technician", labelKey: "enums.roles.technician" },
  { value: "department_user", labelKey: "enums.roles.department_user" },
  { value: "management", labelKey: "enums.roles.management" }
];

const statusDefs = [
  { value: "", labelKey: "userPage.allStatuses" },
  { value: "active", labelKey: "userPage.active" },
  { value: "inactive", labelKey: "userPage.inactive" }
];

export default function UserFilters({ filters, onChange }) {
  const { t } = useTranslation();
  const set = (key) => (event) => onChange({ ...filters, [key]: event.target.value });

  return (
    <section className="users-filters">
      <Input label={t('userPage.searchUsers')} placeholder={t('userPage.searchPlaceholder')} value={filters.search} onChange={set("search")} />
      <Select label={t('userPage.role')} value={filters.role} onChange={set("role")} options={roleDefs.map(r => ({ ...r, label: t(r.labelKey) }))} />
      <Select label={t('userPage.status')} value={filters.status} onChange={set("status")} options={statusDefs.map(s => ({ ...s, label: t(s.labelKey) }))} />
      <Input label={t('userPage.department')} value={filters.department} onChange={set("department")} />
    </section>
  );
}
