export default function PingStatus({ device }) { return <span className="network-ping">{device.responseTimeMs != null ? `${device.responseTimeMs} ms` : "No response"}</span>; }
