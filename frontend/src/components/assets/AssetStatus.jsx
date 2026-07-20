import {StatusBadge} from "../../design-system";
import{useTranslation}from"../../i18n/LanguageContext";
const tones={active:"success",issued:"info",under_repair:"warning",damaged:"danger",retired:"neutral",destroyed:"danger"};
export default function AssetStatus({status="active",enumLabel}){return <StatusBadge status={status} tone={tones[status]||"neutral"} label={enumLabel?enumLabel("assetStatus",status):undefined}/>;}
export function ConditionBadge({condition}){const{t}=useTranslation();const map={good:[t('assetPage.good'),"success"],maintenance:[t('assetPage.maintenance'),"warning"],poor:[t('assetPage.needsAttention'),"danger"],retired:[t('assetPage.retired'),"neutral"]};const [label,tone]=map[condition]||[condition,"neutral"];return <StatusBadge label={label} tone={tone}/>;}
