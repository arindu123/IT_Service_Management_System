import { StatusBadge } from "../../design-system";
const labels={online:"Online",offline:"Offline",unknown:"Unknown",checking:"Checking",warning:"Warning",paused:"Paused"};
export default function DeviceStatus({ status }) { const value=status||"unknown"; const tone={online:"success",offline:"danger",unknown:"neutral",checking:"info",warning:"warning",paused:"neutral"}[value]||"neutral"; return <StatusBadge tone={tone}>{labels[value]||value}</StatusBadge>; }
