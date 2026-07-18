export const DEVICE_TYPES=["computer","laptop","printer","scanner","network_device","other"];
export const ASSET_STATUSES=["active","issued","under_repair","damaged","retired","destroyed"];
export const CUSTODY_ROLES=["admin","system_admin","head_of_it"];
export function ownerOf(asset={}){const user=asset.assignedTo||{};const snapshot=asset.assignedUserSnapshot||{};return{name:user.name||snapshot.name||asset.userName||"",employeeId:user.employeeId||snapshot.employeeId||asset.userId||"",department:user.department||snapshot.department||asset.department||""};}
export function ownerLabel(asset){const owner=ownerOf(asset);return owner.name?`${owner.employeeId||"—"} - ${owner.name}`:"Not assigned";}
export function assetName(asset){return [asset.brand,asset.model].filter(Boolean).join(" ")||asset.customDeviceType||"Unnamed asset";}
export function warrantyLabel(asset,formatDate){if(asset.hasWarranty===false)return"No warranty";const end=asset.warrantyEndDate||asset.warrantyDate;if(!end)return"Not recorded";return `Until ${formatDate(end)}`;}
export function invoiceExtension(data=""){const mime=data.match(/^data:image\/([^;]+)/)?.[1]||"png";return mime==="jpeg"?"jpg":mime;}
