import API from "./apiClient";
const numberOrNull=(value)=>value==null||Number.isNaN(Number(value))?null:Number(value);
export function mapReportSummary(response={}){const tickets=response.tickets||{};const installed=numberOrNull(tickets.installed);const closed=numberOrNull(tickets.closed);return{tickets:{total:numberOrNull(tickets.total),completed:installed==null&&closed==null?null:(installed||0)+(closed||0)},assets:{total:numberOrNull(response.assets?.total)},repairs:{total:numberOrNull(response.repairs?.total)},inventory:{totalItems:numberOrNull(response.inventory?.totalItems),lowStockCount:numberOrNull(response.inventory?.lowStockCount)}};}
export default{async summary(){return mapReportSummary((await API.get("/dashboard/summary")).data);}};
