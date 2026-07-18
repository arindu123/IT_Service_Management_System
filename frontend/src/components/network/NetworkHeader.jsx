import { Button } from "../../design-system";
export default function NetworkHeader({ onAdd, canManage }) { return <header className="network-header"><div><p className="network-kicker">INFRASTRUCTURE</p><h1>Network Monitoring</h1><p>Monitor connected devices, availability and infrastructure status.</p></div>{canManage && <Button onClick={onAdd}>Add device</Button>}</header>; }
