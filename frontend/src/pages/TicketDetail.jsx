import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import ApprovalPanel from "../components/hardware-requests/ApprovalPanel";
import RequestActions from "../components/hardware-requests/RequestActions";
import RequestDetails from "../components/hardware-requests/RequestDetails";
import RequestEvidence from "../components/hardware-requests/RequestEvidence";
import RequestForm from "../components/hardware-requests/RequestForm";
import RequestTimeline from "../components/hardware-requests/RequestTimeline";
import { APPROVAL_ROLES, canDeleteEvidence, canManageOwnRequest, WORKFLOW_ROLES } from "../components/hardware-requests/requestConstants";
import { ConfirmationDialog, ErrorState, Modal, useToast } from "../design-system";
import hardwareRequestService from "../services/hardwareRequestService";
import { useTranslation } from "../i18n/LanguageContext";
import "../components/hardware-requests/hardware-requests.css";

function TicketDetail(){
  const {id}=useParams();const navigate=useNavigate();const [searchParams,setSearchParams]=useSearchParams();
  const {enumLabel,formatDate,formatDateTime,t}=useTranslation();const {toast}=useToast();const [user]=useState(()=>JSON.parse(localStorage.getItem("user")||"{}"));
  const [request,setRequest]=useState(null);const [editForm,setEditForm]=useState(null);const [technicians,setTechnicians]=useState([]);const [loading,setLoading]=useState(true);const [actionLoading,setActionLoading]=useState(false);const [error,setError]=useState("");const [editOpen,setEditOpen]=useState(false);const [deleteOpen,setDeleteOpen]=useState(false);const [evidenceToDelete,setEvidenceToDelete]=useState(null);

  useEffect(()=>{let active=true;hardwareRequestService.get(id).then((item)=>{if(!active)return;setRequest(item);setEditForm(toEditForm(item));const action=searchParams.get("action");if(action&&canManageOwnRequest(item,user)){setEditOpen(action==="edit");setDeleteOpen(action==="delete");}else if(action){setError(t("ticketDetail.cannotAction",{action}));}if(action)setSearchParams({}, {replace:true});}).catch((err)=>{if(active)setError(err.response?.data?.message||t("ticketDetail.loadError"));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[id,searchParams,setSearchParams,t,user]);
  useEffect(()=>{if(!APPROVAL_ROLES.includes(user.role))return;let active=true;hardwareRequestService.listTechnicians().then((items)=>{if(active)setTechnicians(items);}).catch(()=>{});return()=>{active=false;};},[user.role]);

  const runUpdate=async(action,message)=>{setActionLoading(true);setError("");try{const updated=await action();setRequest(updated);setEditForm(toEditForm(updated));toast(message,{tone:"success"});return updated;}catch(err){setError(err.response?.data?.message||t("ticketDetail.updateError"));return null;}finally{setActionLoading(false);}};
  const updateRequest=async(event)=>{event.preventDefault();const updated=await runUpdate(()=>hardwareRequestService.update(id,editForm),t("ticketDetail.ticketUpdated"));if(updated)setEditOpen(false);};
  const deleteRequest=async()=>{setActionLoading(true);try{await hardwareRequestService.remove(id);toast(`${request.ticketId} deleted`,{tone:"success"});navigate("/tickets");}catch(err){setError(err.response?.data?.message||t("ticketDetail.deleteError"));setDeleteOpen(false);setActionLoading(false);}};
  const deleteEvidence=async()=>{if(!evidenceToDelete)return;const updated=await runUpdate(()=>hardwareRequestService.removeEvidence(id,evidenceToDelete._id),t("ticketDetail.evidenceDeleted"));if(updated)setEvidenceToDelete(null);};
  const openEvidence=async(file)=>{setActionLoading(true);setError("");const preview=window.open("","_blank");if(!preview){setError(t("tickets.popupBlocked"));setActionLoading(false);return;}preview.opener=null;try{const response=await hardwareRequestService.download(id,file._id);const url=URL.createObjectURL(new Blob([response.data],{type:response.headers["content-type"]||response.data.type}));preview.location.href=url;window.setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(err){preview.close();setError(err.response?.data?.message||t("ticketDetail.openEvidenceError"));}finally{setActionLoading(false);}};
  const downloadEvidence=async(file)=>{setActionLoading(true);setError("");try{const response=await hardwareRequestService.download(id,file._id);const url=URL.createObjectURL(new Blob([response.data]));const link=document.createElement("a");link.href=url;link.download=file.originalName;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);}catch(err){setError(err.response?.data?.message||t("ticketDetail.downloadFileError"));}finally{setActionLoading(false);}};

  if(loading)return <Layout><main className="hardware-request-page"><div className="request-loading-skeleton" role="status" aria-label="Loading request details"/></main></Layout>;
  if(!request)return <Layout><main className="hardware-request-page"><ErrorState title="Request unavailable" message={error||t("ticketDetail.notFound")}/></main></Layout>;
  const canEdit=canManageOwnRequest(request,user);const canWorkflow=WORKFLOW_ROLES.includes(user.role);const canApprove=APPROVAL_ROLES.includes(user.role);
  return <Layout><main className="hardware-request-page">
    <header className="request-page-header"><div><p className="request-kicker">Hardware request</p><h1>{request.ticketId}</h1><p>{request.issueDescription}</p></div></header>
    {error&&<ErrorState title="Action could not be completed" message={error}/>} 
    <div className="request-details-layout"><div className="request-details-stack"><RequestDetails request={request} enumLabel={enumLabel} formatDate={formatDate}/><RequestTimeline history={request.statusHistory} enumLabel={enumLabel} formatDateTime={formatDateTime}/><RequestEvidence files={request.attachments} formatDate={formatDate} loading={actionLoading} canDelete={(file)=>canDeleteEvidence(file,user)} onView={openEvidence} onDownload={downloadEvidence} onDelete={setEvidenceToDelete}/></div><aside className="request-details-sidebar">{canWorkflow&&<ApprovalPanel key={`${request._id}-${request.updatedAt}`} request={request} enumLabel={enumLabel} loading={actionLoading} canApprove={canApprove} technicians={technicians} onSave={(payload)=>runUpdate(()=>hardwareRequestService.updateStatus(id,payload),"Workflow updated")} onApprove={(comment)=>runUpdate(()=>hardwareRequestService.acknowledge(id,comment),"Request approved for processing")} onReject={(comment)=>runUpdate(()=>hardwareRequestService.reject(id,comment),"Request rejected")} onAssign={canApprove?(technicianId)=>runUpdate(()=>hardwareRequestService.assign(id,technicianId),"Technician assigned"):undefined}/>}<RequestActions canEdit={canEdit} loading={actionLoading} onEdit={()=>setEditOpen(true)} onDelete={()=>setDeleteOpen(true)} onBack={()=>navigate("/tickets")}/></aside></div>
    <Modal open={editOpen} onClose={()=>setEditOpen(false)} title={`Update ${request.ticketId}`} size="lg">{editForm&&<RequestForm mode="edit" form={editForm} setForm={setEditForm} user={user} onSubmit={updateRequest} onCancel={()=>setEditOpen(false)} loading={actionLoading} error="" enumLabel={enumLabel}/>}</Modal>
    <ConfirmationDialog open={deleteOpen} onClose={()=>setDeleteOpen(false)} onConfirm={deleteRequest} danger loading={actionLoading} title="Delete hardware request" message={`Delete ${request.ticketId}? This action cannot be undone.`} confirmLabel="Delete request"/>
    <ConfirmationDialog open={Boolean(evidenceToDelete)} onClose={()=>setEvidenceToDelete(null)} onConfirm={deleteEvidence} danger loading={actionLoading} title="Delete attachment" message={evidenceToDelete?`Delete ${evidenceToDelete.originalName}? This action cannot be undone.`:""} confirmLabel="Delete attachment"/>
  </main></Layout>;
}
function toEditForm(request){const preferred=request.preferredInstallationTime?new Date(request.preferredInstallationTime):null;return{requestType:request.requestType||"fault",hardwareCategory:request.hardwareCategory||"other",currentAssetTag:request.currentAssetTag||"",issueDescription:request.issueDescription||"",businessImpact:request.businessImpact||"",requestedSpecification:request.requestedSpecification||"",priority:request.priority||"medium",preferredInstallationTime:preferred&&!Number.isNaN(preferred.getTime())?new Date(preferred.getTime()-preferred.getTimezoneOffset()*60000).toISOString().slice(0,16):"",remarks:request.remarks||""};}
export default TicketDetail;
