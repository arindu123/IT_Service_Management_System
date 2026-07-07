import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, PageHeader } from "../components/ui";

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingUserId, setLoadingUserId] = useState(null);

  const roles = [
    { value: "admin", label: "Admin" },
    { value: "system_admin", label: "System Admin" },
    { value: "head_of_it", label: "Head of IT" },
    { value: "technician", label: "Technician" },
    { value: "department_user", label: "Department User" },
    { value: "store_keeper", label: "Store Keeper" },
    { value: "procurement_officer", label: "Procurement Officer" },
    { value: "management", label: "Management" },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await API.get("/auth/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data.users);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load users");
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setError("");
    setSuccess("");
    setLoadingUserId(userId);

    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/auth/role",
        { userId, role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess("User role updated successfully");
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user role");
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow="System Configuration"
        title="User Role Management"
        description="Administrators can view all registered users and assign permissions / roles."
      />

      {error && <Alert message={error} />}
      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          ✓ {success}
        </div>
      )}

      <section className="table-shell">
        <div className="table-toolbar">
          <div>
            <p className="table-label">{users.length} users registered</p>
            <h3 className="table-title">User Accounts</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Current Role</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td className="font-bold text-slate-950">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.employeeId || "--"}</td>
                    <td>{user.department || "--"}</td>
                    <td>
                      <Badge tone={roleTone(user.role)}>{formatLabel(user.role)}</Badge>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        disabled={loadingUserId === user._id}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="rounded border border-slate-300 px-2 py-1 text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        {roles.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      {loadingUserId === user._id && (
                        <span className="ml-2 text-xs text-slate-500 animate-pulse">Saving...</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}

function formatLabel(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roleTone(role) {
  if (role === "admin" || role === "system_admin") return "red";
  if (role === "head_of_it") return "violet";
  if (role === "technician") return "amber";
  if (role === "store_keeper") return "blue";
  if (role === "procurement_officer") return "green";
  return "slate";
}

export default Users;
