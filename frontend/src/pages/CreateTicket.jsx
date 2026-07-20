import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import RequestForm from "../components/hardware-requests/RequestForm";
import hardwareRequestService from "../services/hardwareRequestService";
import { useTranslation } from "../i18n/LanguageContext";
import { useToast } from "../design-system";
import "../components/hardware-requests/hardware-requests.css";

const initial=(user)=>({assetId:"",requestType:"fault",hardwareCategory:"monitor",currentAssetTag:"",issueDescription:"",businessImpact:"",requestedSpecification:"",priority:"medium",department:user.department||"",preferredInstallationTime:"",remarks:""});
function CreateTicket(){
  const navigate=useNavigate();const {enumLabel,t}=useTranslation();const {toast}=useToast();
  const user=JSON.parse(localStorage.getItem("user")||"{}");const [form,setForm]=useState(()=>initial(user));const [files,setFiles]=useState([]);const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  const submit=async(event)=>{event.preventDefault();if(form.issueDescription.trim().length<10){setError(t("tickets.issueDescriptionMustBe10"));return;}setLoading(true);setError("");try{const request=await hardwareRequestService.create(form);if(files.length)await hardwareRequestService.upload(request._id,files);toast(t("tickets.hardwareRequestSubmitted"),{tone:"success"});navigate("/tickets");}catch(err){setError(err.response?.data?.message||t("tickets.submitError"));}finally{setLoading(false);}};
  return <Layout><main className="hardware-request-page"><header className="request-page-header"><div><p className="request-kicker">{t("tickets.createEyebrow")}</p><h1>{t("tickets.createTitle")}</h1><p>{t("tickets.createDescription")}</p></div></header><RequestForm form={form} setForm={setForm} user={user} files={files} onFiles={(event)=>setFiles(Array.from(event.target.files||[]))} onSubmit={submit} onCancel={()=>navigate("/tickets")} loading={loading} error={error} enumLabel={enumLabel}/></main></Layout>;
}
export default CreateTicket;
