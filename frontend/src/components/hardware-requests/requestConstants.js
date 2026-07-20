export const REQUEST_STATUSES = ["submitted","acknowledged","need_more_information","under_review","technician_assigned","inventory_check","procurement_required","in_procurement","item_available","installation_scheduled","installed","closed","rejected","cancelled"];
export const REQUEST_TYPES = ["fault","replacement","upgrade","performance_issue","procurement","other"];
export const HARDWARE_CATEGORIES = ["monitor","mouse","keyboard","ram","storage","cpu","printer","laptop_desktop","network_device","scanner","accessories","other"];
export const PRIORITIES = ["low","medium","high","critical"];
export const WORKFLOW_ROLES = ["admin","system_admin","head_of_it","technician","store_keeper","procurement_officer"];
export const APPROVAL_ROLES = ["admin","system_admin","head_of_it"];

export function getUserId(user = {}) { return user.id || user._id || ""; }
export function getPersonId(person) { return typeof person === "string" ? person : person?._id || person?.id || ""; }
export function canManageOwnRequest(request, user) { return Boolean(getUserId(user) && getPersonId(request?.createdBy) === getUserId(user) && ["draft","submitted"].includes(request?.status)); }
export function canDeleteEvidence(attachment, user) { return Boolean(getUserId(user) && (getPersonId(attachment?.uploadedBy) === getUserId(user) || ["admin","system_admin"].includes(user.role))); }
export function assignedOfficer(request) { return request.assignedTechnician?.name || request.assignedTechnician?.email || "Not assigned"; }
export function fileSize(bytes = 0) { if (!bytes) return "0 Bytes"; const units=["Bytes","KB","MB","GB"]; const index=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1); return `${Math.round((bytes/Math.pow(1024,index))*100)/100} ${units[index]}`; }
