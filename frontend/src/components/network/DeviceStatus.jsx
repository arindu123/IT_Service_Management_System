import { StatusBadge } from "../../design-system";
import { useTranslation } from "../../i18n/LanguageContext";

const labelKeys = {
  online: "networkPage.online",
  offline: "networkPage.offline",
  unknown: "networkPage.unknownStatus",
  checking: "networkPage.checkingStatus",
  warning: "networkPage.warningStatus",
  paused: "networkPage.pausedStatus"
};

export default function DeviceStatus({ status }) {
  const { t } = useTranslation();
  const value = status || "unknown";
  const tone = { online: "success", offline: "danger", unknown: "neutral", checking: "info", warning: "warning", paused: "neutral" }[value] || "neutral";
  return <StatusBadge tone={tone}>{t(labelKeys[value]) || value}</StatusBadge>;
}
