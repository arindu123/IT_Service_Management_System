import { StatusBadge } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

export default function RoleBadge({ role }) {
  const { enumLabel } = useTranslation();
  const tone = role === "admin" || role === "system_admin" ? "danger" : role === "technician" ? "warning" : "info";
  return <StatusBadge tone={tone} label={enumLabel("roles", role) || String(role || "unknown").replace(/_/g, " ")} />;
}
