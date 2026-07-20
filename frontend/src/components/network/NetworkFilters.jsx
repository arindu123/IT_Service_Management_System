import { Input, Select } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

const types = [
  { value: "", labelKey: "networkPage.allDeviceTypes" },
  { value: "pc", labelKey: "networkPage.pc" },
  { value: "server", labelKey: "networkPage.server" },
  { value: "printer", labelKey: "networkPage.printer" },
  { value: "router", labelKey: "networkPage.router" },
  { value: "switch", labelKey: "networkPage.switchDevice" },
  { value: "access_point", labelKey: "networkPage.accessPoint" },
  { value: "cctv_nvr", labelKey: "networkPage.cctvNvr" },
  { value: "biometric", labelKey: "networkPage.biometric" },
  { value: "other", labelKey: "networkPage.other" }
];

const statuses = [
  { value: "", labelKey: "networkPage.allStatuses" },
  { value: "online", labelKey: "networkPage.online" },
  { value: "offline", labelKey: "networkPage.offline" },
  { value: "unknown", labelKey: "networkPage.unknownStatus" },
  { value: "warning", labelKey: "networkPage.warning" },
  { value: "paused", labelKey: "networkPage.paused" }
];

export default function NetworkFilters({ filters, onChange }) {
  const { t } = useTranslation();
  const set = (key) => (event) => onChange({ ...filters, [key]: event.target.value });

  return (
    <section className="network-filters" aria-label="Network device filters">
      <Input label={t('networkPage.searchDevices')} placeholder={t('networkPage.nameHostOrIp')} value={filters.search} onChange={set("search")} />
      <Select label={t('networkPage.status')} value={filters.status} onChange={set("status")} options={statuses.map(s => ({ ...s, label: t(s.labelKey) }))} />
      <Select label={t('networkPage.deviceType')} value={filters.deviceType} onChange={set("deviceType")} options={types.map(t2 => ({ ...t2, label: t(t2.labelKey) }))} />
      <Input label={t('networkPage.department')} value={filters.department} onChange={set("department")} />
      <Input label={t('networkPage.building')} value={filters.building} onChange={set("building")} />
    </section>
  );
}
