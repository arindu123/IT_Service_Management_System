import { Button, DataTable } from "../../design-system";
import RoleBadge from "./RoleBadge";
import UserStatus from "./UserStatus";
import UserCard from "./UserCard";
import { useTranslation } from "../../i18n/LanguageContext";

const columnDefs = [
  { key: "id", headerKey: "userPage.employeeId" },
  { key: "name", headerKey: "userPage.name" },
  { key: "email", headerKey: "userPage.email" },
  { key: "department", headerKey: "userPage.department" },
  { key: "role", headerKey: "userPage.role" },
  { key: "status", headerKey: "userPage.status" },
  { key: "actions", headerKey: "userPage.actions" }
];

export default function UserTable({ users, loading, onView, onRoleChange, saving }) {
  const { t } = useTranslation();

  const cols = columnDefs.map(col => ({
    ...col,
    header: t(col.headerKey)
  }));

  const cell = (u, c) => ({
    id: u.employeeId || "—",
    name: <strong>{u.name}</strong>,
    email: u.email,
    department: u.department || "—",
    role: (
      <div className="user-role-cell">
        <RoleBadge role={u.role} />
        <select aria-label={`${t('userPage.role')} ${u.name}`} value={u.role} disabled={saving === u._id} onChange={e => onRoleChange(u, e.target.value)}>
          {["admin", "system_admin", "head_of_it", "technician", "department_user", "store_keeper", "procurement_officer", "management"].map(r => (
            <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
    ),
    status: <UserStatus user={u} />,
    actions: <Button variant="ghost" onClick={() => onView(u)}>{t('userPage.viewDetails')}</Button>
  }[c.key]);

  return (
    <>
      <div className="users-table-desktop">
        <DataTable columns={cols} data={users} loading={loading} rowKey="_id" caption={t('userPage.userAccounts')} emptyTitle={t('userPage.noUsersFound')} renderCell={cell} />
      </div>
      <div className="users-card-list">
        {!loading && users.map(u => <UserCard key={u._id} user={u} onView={onView} />)}
      </div>
    </>
  );
}
