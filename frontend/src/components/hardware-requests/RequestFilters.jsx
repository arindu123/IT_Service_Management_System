import { DateField, Input, Select } from "../../design-system";
import { PRIORITIES, REQUEST_STATUSES } from "./requestConstants";
import { useTranslation } from "../../i18n/LanguageContext";

export default function RequestFilters({ filters, onChange, enumLabel }) {
  const { t } = useTranslation();
  const change = (field) => (event) => onChange({ ...filters, [field]: event.target.value });
  return (
    <section className="request-toolbar" aria-label={t('requestPage.searchLabel')}>
      <Input label={t('requestPage.searchLabel')} type="search" value={filters.search} onChange={change("search")} placeholder={t('requestPage.searchPlaceholder')} />
      <Select label={t('requestPage.status')} value={filters.status} onChange={change("status")}>
        <option value="">{t('requestPage.allStatuses')}</option>
        {REQUEST_STATUSES.map((value) => <option key={value} value={value}>{enumLabel("status", value)}</option>)}
      </Select>
      <Select label={t('requestPage.priority')} value={filters.priority} onChange={change("priority")}>
        <option value="">{t('requestPage.allPriorities')}</option>
        {PRIORITIES.map((value) => <option key={value} value={value}>{enumLabel("priority", value)}</option>)}
      </Select>
      <DateField label={t('requestPage.submittedDateLabel')} optional value={filters.date} onChange={change("date")} />
    </section>
  );
}
