export const INVENTORY_CATEGORIES=["computer_parts","printer_parts","network_parts","cables","accessories","other"];
export function currency(value){return `Rs. ${Number(value||0).toFixed(2)}`;}
export function itemStatus(item){const quantity=Number(item.quantity)||0;const reorder=Number(item.reorderLevel)||0;if(quantity===0)return"critical";if(quantity<=reorder)return"low";return"available";}
