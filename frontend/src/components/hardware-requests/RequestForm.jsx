import { Button, Card, CardBody, FileUpload, Input, Select, Textarea, ValidationMessage } from "../../design-system";
import { HARDWARE_CATEGORIES, PRIORITIES, REQUEST_TYPES } from "./requestConstants";

export default function RequestForm({ form, setForm, user, files=[], onFiles, onSubmit, onCancel, loading, error, mode="create", enumLabel }) {
  const change=(event)=>setForm((value)=>({...value,[event.target.name]:event.target.value}));
  return <form className="request-form" onSubmit={onSubmit} noValidate>
    {error&&<ValidationMessage>{error}</ValidationMessage>}
    {mode==="create"&&<Card variant="muted"><CardBody><h2 className="request-form-section-title">Requester information</h2><div className="request-form-grid"><Input label="Employee ID" value={user.employeeId||"Not available"} disabled/><Input label="Name" value={user.name||"Current user"} disabled/><Input label="Department" value={user.department||form.department||"Unassigned"} disabled/><Input label="Contact" value={user.phone||user.email||"Not available"} disabled/></div></CardBody></Card>}
    <Card><CardBody><h2 className="request-form-section-title">Request information</h2><div className="request-form-grid">
      <Select label="Request type" required name="requestType" value={form.requestType} onChange={change}>{REQUEST_TYPES.map((value)=><option key={value} value={value}>{enumLabel("requestType",value)}</option>)}</Select>
      <Select label="Hardware category" required name="hardwareCategory" value={form.hardwareCategory} onChange={change}>{HARDWARE_CATEGORIES.map((value)=><option key={value} value={value}>{enumLabel("hardwareCategory",value)}</option>)}</Select>
      {mode==="create"&&<Input label="Linked asset ID" optional name="assetId" value={form.assetId||""} onChange={change}/>}<Input label="Asset tag or serial" optional name="currentAssetTag" value={form.currentAssetTag} onChange={change}/>
      <Select label="Priority" name="priority" value={form.priority} onChange={change}>{PRIORITIES.map((value)=><option key={value} value={value}>{enumLabel("priority",value)}</option>)}</Select>
      <Input type="datetime-local" label="Preferred installation time" optional name="preferredInstallationTime" value={form.preferredInstallationTime} onChange={change}/>
    </div><Textarea label="Issue description" required name="issueDescription" value={form.issueDescription} onChange={change} minLength="10" helpText="Provide at least 10 characters describing the issue or requirement."/><Textarea label="Business impact" optional name="businessImpact" value={form.businessImpact} onChange={change}/><Input label="Requested specification" optional name="requestedSpecification" value={form.requestedSpecification} onChange={change}/><Textarea label="Remarks" optional name="remarks" value={form.remarks} onChange={change}/></CardBody></Card>
    {mode==="create"&&<FileUpload label="Supporting evidence" optional multiple accept=".jpg,.jpeg,.png,.pdf,.mp4,.mov,.webm" onChange={onFiles} helpText="JPG, PNG, PDF, MP4, MOV or WebM; maximum 5 files and 20 MB per file.">{files.length>0&&<span>{files.length} file(s) selected</span>}</FileUpload>}
    <div className="request-form-actions"><Button type="button" variant="secondary" disabled={loading} onClick={onCancel}>Cancel</Button><Button type="submit" loading={loading}>{mode==="edit"?"Save changes":"Submit Request"}</Button></div>
  </form>;
}
