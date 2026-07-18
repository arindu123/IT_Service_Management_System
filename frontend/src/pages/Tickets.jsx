import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ApprovalPanel from "../components/hardware-requests/ApprovalPanel";
import RequestFilters from "../components/hardware-requests/RequestFilters";
import RequestHeader from "../components/hardware-requests/RequestHeader";
import RequestTable from "../components/hardware-requests/RequestTable";
import { APPROVAL_ROLES, canManageOwnRequest, WORKFLOW_ROLES } from "../components/hardware-requests/requestConstants";
import { ConfirmationDialog, ErrorState, Modal, useToast } from "../design-system";
import useHardwareRequests from "../hooks/useHardwareRequests";
import hardwareRequestService from "../services/hardwareRequestService";
import { useTranslation } from "../i18n/LanguageContext";
import "../components/hardware-requests/hardware-requests.css";

function Tickets() {
  const navigate = useNavigate();
  const { enumLabel, formatDate, t } = useTranslation();
  const { toast } = useToast();
  const { filteredRequests, filters, setFilters, loading, error, setError, replaceRequest, removeRequest } = useHardwareRequests(t("tickets.loadError"));
  const [managedRequest,setManagedRequest]=useState(null);
  const [deleteRequest,setDeleteRequest]=useState(null);
  const [actionLoading,setActionLoading]=useState(false);
  const user=JSON.parse(localStorage.getItem("user")||"{}");
  const canManage=WORKFLOW_ROLES.includes(user.role);

  const runUpdate=async(action,successMessage)=>{setActionLoading(true);setError("");try{const updated=await action();replaceRequest(updated);setManagedRequest(updated);toast(successMessage,{tone:"success"});}catch(err){setError(err.response?.data?.message||t("tickets.updateError"));}finally{setActionLoading(false);}};
  const confirmDelete=async()=>{if(!deleteRequest)return;setActionLoading(true);try{await hardwareRequestService.remove(deleteRequest._id);removeRequest(deleteRequest._id);toast(`${deleteRequest.ticketId} deleted`,{tone:"success"});setDeleteRequest(null);}catch(err){setError(err.response?.data?.message||t("tickets.deleteError"));}finally{setActionLoading(false);}};

  return <Layout><main className="hardware-request-page">
    <RequestHeader onCreate={()=>navigate("/tickets/create")}/>
    {error&&<ErrorState title="Hardware requests unavailable" message={error}/>} 
    <RequestFilters filters={filters} onChange={setFilters} enumLabel={enumLabel}/>
    <RequestTable requests={filteredRequests} loading={loading} enumLabel={enumLabel} formatDate={formatDate} canManage={canManage} canDelete={(request)=>canManageOwnRequest(request,user)} onOpen={(request)=>navigate(`/tickets/${request._id}`)} onManage={setManagedRequest} onDelete={setDeleteRequest}/>
    <Modal open={Boolean(managedRequest)} onClose={()=>setManagedRequest(null)} title={managedRequest?`Manage ${managedRequest.ticketId}`:"Manage request"} size="lg">
      {managedRequest&&<ApprovalPanel key={`${managedRequest._id}-${managedRequest.updatedAt}`} request={managedRequest} enumLabel={enumLabel} loading={actionLoading} canApprove={APPROVAL_ROLES.includes(user.role)} onSave={(payload)=>runUpdate(()=>hardwareRequestService.updateStatus(managedRequest._id,payload),"Workflow updated")} onApprove={(comment)=>runUpdate(()=>hardwareRequestService.acknowledge(managedRequest._id,comment),"Request approved for processing")} onReject={(comment)=>runUpdate(()=>hardwareRequestService.reject(managedRequest._id,comment),"Request rejected")}/>} 
    </Modal>
    <ConfirmationDialog open={Boolean(deleteRequest)} onClose={()=>setDeleteRequest(null)} onConfirm={confirmDelete} danger loading={actionLoading} title="Delete hardware request" message={deleteRequest?`Delete ${deleteRequest.ticketId}? This action cannot be undone.`:""} confirmLabel="Delete request"/>
  </main></Layout>;
}
export default Tickets;
