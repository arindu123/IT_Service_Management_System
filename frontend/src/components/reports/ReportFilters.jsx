import { Input, Select } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

const categoryDefs = [
  { value: "", labelKey: "reportsPage.allCategories" },
  { value: "requests", labelKey: "reportsPage.serviceRequests" },
  { value: "assets", labelKey: "reportsPage.assets" },
  { value: "repairs", labelKey: "reportsPage.repairs" },
  { value: "inventory", labelKey: "reportsPage.inventory" }
];

const statusDefs = [
  { value: "", labelKey: "reportsPage.allStatuses" },
  { value: "open", labelKey: "reportsPage.open" },
  { value: "completed", labelKey: "reportsPage.completed" },
  { value: "pending", labelKey: "reportsPage.pending" }
];

export default function ReportFilters({ filters, onChange }) {
  const { t } = useTranslation();
  const set = (key) => (event) => onChange({ ...filters, [key]: event.target.value });

  return (
    <section className="report-filters">
      <Input type="date" label={t('reportsPage.fromDate')} value={filters.from} onChange={set("from")} />
      <Input type="date" label={t('reportsPage.toDate')} value={filters.to} onChange={set("to")} />
      <Select label={t('reportsPage.category')} value={filters.category} onChange={set("category")} options={categoryDefs.map(c => ({ ...c, label: t(c.labelKey) }))} />
      <Select label={t('reportsPage.allStatuses')} value={filters.status} onChange={set("status")} options={statusDefs.map(s => ({ ...s, label: t(s.labelKey) }))} />
      <Input label={t('labels.department')} value={filters.department} onChange={set("department")} />
    </section>
  );
}
