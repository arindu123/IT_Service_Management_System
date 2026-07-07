export const IT_INVENTORY_ROLES = [
  "admin",
  "system_admin",
  "head_of_it",
  "technician",
  "store_keeper",
];

export function hasRole(user, roles) {
  return Boolean(user?.role && roles.includes(user.role));
}
