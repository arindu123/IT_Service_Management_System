import {StatusBadge} from "../../design-system";
const tones={active:"success",issued:"info",under_repair:"warning",damaged:"danger",retired:"neutral",destroyed:"danger"};
export default function AssetStatus({status="active",enumLabel}){return <StatusBadge status={status} tone={tones[status]||"neutral"} label={enumLabel?enumLabel("assetStatus",status):undefined}/>;}
export function ConditionBadge({condition}){const map={good:["Good","success"],maintenance:["Maintenance","warning"],poor:["Needs attention","danger"],retired:["Retired","neutral"]};const [label,tone]=map[condition]||[condition,"neutral"];return <StatusBadge label={label} tone={tone}/>;}
