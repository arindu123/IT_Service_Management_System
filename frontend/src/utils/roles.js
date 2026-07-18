export const IT_INVENTORY_ROLES = [
  "admin",
  "system_admin",
  "head_of_it",
  "technician",
  "store_keeper",
];

export const NETWORK_MONITORING_VIEW_ROLES = [
  "admin",
  "system_admin",
  "head_of_it",
  "technician",
  "management",
];

export const NETWORK_MONITORING_MANAGE_ROLES = [
  "admin",
  "system_admin",
  "head_of_it",
  "technician",
];

export function hasRole(user, roles) {
  return Boolean(user?.role && roles.includes(user.role));
}
