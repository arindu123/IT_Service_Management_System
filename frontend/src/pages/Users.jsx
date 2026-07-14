import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, PageHeader } from "../components/ui";

function Users() {
  const [users, setUsers] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [loadingResetId, setLoadingResetId] = useState(null);

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

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchResetRequests = async () => {
    try {
      const response = await API.get("/auth/password-reset/requests", {
        headers: getAuthHeaders(),
      });
      setResetRequests(response.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load password reset requests");
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialData = async () => {
      try {
        const [usersResponse, resetRequestsResponse] = await Promise.all([
          API.get("/auth/users", {
            headers: getAuthHeaders(),
          }),
          API.get("/auth/password-reset/requests", {
            headers: getAuthHeaders(),
          }),
        ]);

        if (!ignore) {
          setUsers(usersResponse.data.users);
          setResetRequests(resetRequestsResponse.data.requests || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || "Failed to load user management data");
        }
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setError("");
    setSuccess("");
    setLoadingUserId(userId);

    try {
      await API.put(
        "/auth/role",
        { userId, role: newRole },
        {
          headers: getAuthHeaders(),
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

  const handleApproveReset = async (requestId) => {
    setError("");
    setSuccess("");
    setLoadingResetId(requestId);

    try {
      const response = await API.put(
        `/auth/password-reset/requests/${requestId}/approve`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      setSuccess("Password reset request approved. The requester can continue on their reset page.");
      setResetRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId ? response.data.request : request
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve password reset request");
    } finally {
      setLoadingResetId(null);
    }
  };

  const handleCancelReset = async (requestId) => {
    setError("");
    setSuccess("");
    setLoadingResetId(requestId);

    try {
      const response = await API.put(
        `/auth/password-reset/requests/${requestId}/cancel`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      setSuccess("Password reset request cancelled.");
      setResetRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId ? response.data.request : request
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel password reset request");
    } finally {
      setLoadingResetId(null);
    }
  };

  const pendingResetCount = resetRequests.filter((request) => request.status === "pending").length;

  return (
    <Layout>
      <PageHeader
        eyebrow="System Configuration"
        title="User Role Management"
        description="Administrators can manage roles and approve password reset requests."
      />

      {error && <Alert message={error} />}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          OK {success}
        </div>
      )}

      <section className="table-shell mb-6">
        <div className="table-toolbar">
          <div>
            <p className="table-label">{pendingResetCount} pending request(s)</p>
            <h3 className="table-title">Password Reset Requests</h3>
          </div>
          <button type="button" onClick={fetchResetRequests} className="btn-secondary">
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Employee ID</th>
                <th>Method</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {resetRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No password reset requests found
                  </td>
                </tr>
              ) : (
                resetRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <p className="font-bold text-slate-950">{request.user?.name || "Unknown user"}</p>
                      <p className="text-xs font-semibold text-slate-500">{request.user?.email || "--"}</p>
                    </td>
                    <td>{request.employeeId || request.user?.employeeId || "--"}</td>
                    <td>{formatResetMethod(request.method)}</td>
                    <td>
                      <Badge tone={resetTone(request.status)}>{formatLabel(request.status)}</Badge>
                    </td>
                    <td>{formatDate(request.requestedAt)}</td>
                    <td>
                      {request.status === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveReset(request.id)}
                            disabled={loadingResetId === request.id}
                            className="rounded-lg bg-[#1257ff] px-3 py-2 text-xs font-black text-white hover:bg-[#0c46d6] disabled:cursor-not-allowed disabled:bg-blue-300"
                          >
                            {loadingResetId === request.id ? "Approving..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelReset(request.id)}
                            disabled={loadingResetId === request.id}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : request.status === "approved" ? (
                        <span className="text-sm font-semibold text-emerald-700">
                          Approved. Link kept private.
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-slate-500">
                          {request.status === "completed" ? "Password changed" : "No action available"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

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
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        {roles.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      {loadingUserId === user._id && (
                        <span className="ml-2 animate-pulse text-xs text-slate-500">Saving...</span>
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

function resetTone(status) {
  if (status === "pending") return "amber";
  if (status === "approved") return "green";
  if (status === "completed") return "blue";
  if (status === "cancelled") return "red";
  return "slate";
}

function formatResetMethod(method = "") {
  if (method === "it_admin") return "IT Admin";
  if (method === "email") return "Email";
  return formatLabel(method || "--");
}

function formatDate(value) {
  if (!value) return "--";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default Users;
