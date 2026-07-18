import { DateField, Input, Select } from "../../design-system";
import { PRIORITIES, REQUEST_STATUSES } from "./requestConstants";

export default function RequestFilters({ filters, onChange, enumLabel }) {
  const change = (field) => (event) => onChange({ ...filters, [field]: event.target.value });
  return <section className="request-toolbar" aria-label="Request filters">
    <Input label="Search" type="search" value={filters.search} onChange={change("search")} placeholder="Request ID, requester, device or description" />
    <Select label="Status" value={filters.status} onChange={change("status")}><option value="">All statuses</option>{REQUEST_STATUSES.map((value)=><option key={value} value={value}>{enumLabel("status",value)}</option>)}</Select>
    <Select label="Priority" value={filters.priority} onChange={change("priority")}><option value="">All priorities</option>{PRIORITIES.map((value)=><option key={value} value={value}>{enumLabel("priority",value)}</option>)}</Select>
    <DateField label="Submitted date" optional value={filters.date} onChange={change("date")} />
  </section>;
}
