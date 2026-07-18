import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, FormActions, FormPanel, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

const EMPTY_ISSUE_FORM = {
  userId: "",
  itemId: "",
  issueDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function AssetIssues() {
  const { enumLabel, formatDate: formatTranslatedDate, message } = useTranslation();
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_ISSUE_FORM);
  const [userSearch, setUserSearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [transfer, setTransfer] = useState({ issueId: "", userId: "", search: "", notes: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState("");

  const load = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [issueResponse, userResponse, itemResponse] = await Promise.all([
        API.get("/asset-issues", { headers }),
        API.get("/auth/users", { headers }),
        API.get("/assets", { headers }),
      ]);

      setIssues(issueResponse.data.issues || []);
      setUsers(userResponse.data.users || []);
      setItems(itemResponse.data.assets || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load issue records");
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const activeItemIds = useMemo(
    () => new Set(issues.filter((issue) => issue.status === "issued").map((issue) => issue.item?._id)),
    [issues]
  );
  const selectedUser = users.find((user) => user._id === form.userId);
  const selectedItem = items.find((item) => item._id === form.itemId);
  const activeIssues = issues.filter((issue) => issue.status === "issued");

  const filteredUsers = useMemo(() => filterUsers(users, userSearch), [userSearch, users]);
  const filteredTransferUsers = useMemo(() => filterUsers(users, transfer.search), [transfer.search, users]);
  const availableItems = useMemo(
    () => filterAssets(
      items.filter((item) => !activeItemIds.has(item._id) && !["issued", "destroyed", "retired", "damaged", "under_repair"].includes(item.status)),
      assetSearch
    ),
    [activeItemIds, assetSearch, items]
  );

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (transfer.issueId) return;
    resetMessages();
    setSaving("issue");

    try {
      await API.post("/asset-issues", form, { headers: getAuthHeaders() });
      setForm(EMPTY_ISSUE_FORM);
      setUserSearch("");
      setAssetSearch("");
      setSuccess("Asset issued successfully");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not issue asset");
    } finally {
      setSaving("");
    }
  };

  const returnItem = async (issue) => {
    resetMessages();
    setSaving(`${issue._id}-return`);

    try {
      await API.put(`/asset-issues/${issue._id}/return`, {}, { headers: getAuthHeaders() });
      setSuccess(`${assetLabel(issue.item)} removed from ${personLabel(issue.user, issue.userSnapshot)}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove asset from user");
    } finally {
      setSaving("");
    }
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    resetMessages();
    setSaving(`${transfer.issueId}-transfer`);

    try {
      await API.put(
        `/asset-issues/${transfer.issueId}/transfer`,
        { newUserId: transfer.userId, notes: transfer.notes },
        { headers: getAuthHeaders() }
      );
      setTransfer({ issueId: "", userId: "", search: "", notes: "" });
      setSuccess("Asset transferred successfully");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not transfer asset");
    } finally {
      setSaving("");
    }
  };

  const destroyItem = async (issue) => {
    const reason = window.prompt(`Destroy ${assetLabel(issue.item)}? Enter reason or reference:`);
    if (reason === null) return;

    resetMessages();
    setSaving(`${issue._id}-destroy`);

    try {
      await API.put(`/asset-issues/${issue._id}/destroy`, { reason }, { headers: getAuthHeaders() });
      setSuccess(`${assetLabel(issue.item)} destroyed and removed from user`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not destroy asset");
    } finally {
      setSaving("");
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={message("Asset custody")}
        title={message("Issue, Transfer and Destroy Assets")}
        description={message("Assign registered assets to registered users, move custody between users, and keep an action trail.")}
      />

      <Alert message={error} />
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <FormPanel>
        <form onSubmit={submit} className="form-grid">
          <Field label={message("Search registered users")}>
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder={message("Search by employee ID, name, department or email")}
            />
          </Field>
          <Field label={message("Select user")}>
            <select required value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })}>
              <option value="">{message("Select user")}</option>
              {filteredUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {personLabel(user)} - {user.department || "No department"}
                </option>
              ))}
            </select>
          </Field>

          <Field label={message("User details")}>
            <input value={selectedUser ? `${selectedUser.employeeId || selectedUser._id} - ${selectedUser.name}` : ""} disabled placeholder={message("Auto-filled")} />
          </Field>
          <Field label={message("Department / ministry")}>
            <input value={selectedUser ? `${selectedUser.department || "--"} / ${selectedUser.ministry || "--"}` : ""} disabled placeholder={message("Auto-filled")} />
          </Field>

          <Field label={message("Search available assets")}>
            <input
              value={assetSearch}
              onChange={(event) => setAssetSearch(event.target.value)}
              placeholder={message("Search item number, serial, brand or model")}
            />
          </Field>
          <Field label={message("Select asset")}>
            <select required value={form.itemId} onChange={(event) => setForm({ ...form, itemId: event.target.value })}>
              <option value="">{message("Select available asset")}</option>
              {availableItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {assetLabel(item)} - {item.serialNumber}
                </option>
              ))}
            </select>
          </Field>

          <Field label={message("Asset details")}>
            <input value={selectedItem ? `${selectedItem.brand} ${selectedItem.model} (${enumLabel("assetStatus", selectedItem.status || "active")})` : ""} disabled placeholder={message("Auto-filled")} />
          </Field>
          <Field label={message("Issue date")}>
            <input required type="date" value={form.issueDate} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} />
          </Field>

          <Field label={message("Issue notes")} className="md:col-span-2">
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={message("Optional remarks, reference number or handover note")} />
          </Field>

          <FormActions>
            <Button type="submit" disabled={saving === "issue" || Boolean(transfer.issueId)}>{message(saving === "issue" ? "Issuing..." : "Issue Asset")}</Button>
          </FormActions>
        </form>
      </FormPanel>

      {transfer.issueId && (
        <FormPanel>
          <form onSubmit={submitTransfer} className="form-grid">
            <Field label={message("Transfer asset")}>
              <input value={assetLabel(issues.find((issue) => issue._id === transfer.issueId)?.item)} disabled />
            </Field>
            <Field label={message("Search new user")}>
              <input
                value={transfer.search}
                onChange={(event) => setTransfer({ ...transfer, search: event.target.value, userId: "" })}
                placeholder={message("Search by employee ID, name, department or email")}
              />
            </Field>
            <Field label={message("New user")}>
              <select required value={transfer.userId} onChange={(event) => setTransfer({ ...transfer, userId: event.target.value })}>
                <option value="">{message("Select new user")}</option>
                {filteredTransferUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {personLabel(user)} - {user.department || "No department"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={message("Transfer notes")}>
              <input value={transfer.notes} onChange={(event) => setTransfer({ ...transfer, notes: event.target.value })} placeholder={message("Optional")} />
            </Field>
            <FormActions>
              <Button type="submit" disabled={saving === `${transfer.issueId}-transfer`}>{message("Transfer")}</Button>
              <Button type="button" variant="secondary" onClick={() => setTransfer({ issueId: "", userId: "", search: "", notes: "" })}>{message("Cancel")}</Button>
            </FormActions>
          </form>
        </FormPanel>
      )}

      <div className="mt-8">
        <DataTable
          metric={`${activeIssues.length} ${message("currently issued")}`}
          emptyLabel={message("Asset Custody Records")}
          columns={[message("Asset"), message("Current user"), message("Status"), message("Issued by"), message("Last action"), message("Actions")]}
        >
          {issues.length === 0 ? (
            <EmptyRow colSpan="6" message={message("No asset issue records yet.")} />
          ) : (
            issues.map((issue) => (
              <tr key={issue._id}>
                <td>
                  <strong className="block text-slate-950">{assetLabel(issue.item)}</strong>
                  <span className="block text-xs font-bold text-slate-500">{issue.item?.serialNumber || "--"}</span>
                </td>
                <td>
                  <strong className="block text-slate-900">{personLabel(issue.user, issue.userSnapshot)}</strong>
                  <span className="block text-xs font-bold text-slate-500">{issue.user?.department || issue.userSnapshot?.department || "--"}</span>
                </td>
                <td><Badge tone={statusTone(issue.status)}>{enumLabel("assetStatus", issue.status)}</Badge></td>
                <td>{actorLabel(issue.issuedBy, issue.issuedBySnapshot)}</td>
                <td>
                  <strong className="block text-slate-800">{lastActionLabel(issue)}</strong>
                  <span className="block text-xs font-bold text-slate-500">{formatTranslatedDate(lastActionDate(issue))}</span>
                </td>
                <td>
                  {issue.status === "issued" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" disabled={saving === `${issue._id}-return`} onClick={() => returnItem(issue)}>{message("Remove")}</Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setTransfer({ issueId: issue._id, userId: "", search: "", notes: "" })}
                      >
                        {message("Transfer")}
                      </Button>
                      <Button type="button" disabled={saving === `${issue._id}-destroy`} onClick={() => destroyItem(issue)}>{message("Destroy")}</Button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">{message("Closed")}</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>
    </Layout>
  );
}

function Field({ label, children, className = "" }) {
  return <div className={`field ${className}`.trim()}><label>{label}</label>{children}</div>;
}

function filterUsers(users, search) {
  const term = search.trim().toLowerCase();
  if (!term) return users.slice(0, 30);

  return users.filter((user) =>
    [user.employeeId, user.name, user.email, user.department, user.ministry, user.designation]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  ).slice(0, 30);
}

function filterAssets(items, search) {
  const term = search.trim().toLowerCase();
  if (!term) return items.slice(0, 50);

  return items.filter((item) =>
    [item.itemNumber, item.assetId, item.serialNumber, item.brand, item.model, item.department, item.location]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  ).slice(0, 50);
}

function personLabel(user, snapshot = {}) {
  const person = user || {};
  const fallback = snapshot || {};
  return `${person.employeeId || fallback.employeeId || person._id || "--"} - ${person.name || fallback.name || "Unknown user"}`;
}

function assetLabel(item = {}) {
  return `${item?.itemNumber || item?.assetId || "--"} ${item?.brand || ""} ${item?.model || ""}`.trim();
}

function actorLabel(actor, snapshot = {}) {
  return actor?.name || snapshot?.name || "--";
}

function statusTone(status) {
  if (status === "issued") return "blue";
  if (status === "transferred") return "violet";
  if (status === "destroyed") return "red";
  return "green";
}

function lastActionLabel(issue) {
  if (issue.status === "destroyed") return `Destroyed by ${actorLabel(issue.destroyedBy, issue.destroyedBySnapshot)}`;
  if (issue.status === "transferred") return `Transferred by ${actorLabel(issue.transferredBy, issue.transferredBySnapshot)}`;
  if (issue.status === "returned") return `Removed by ${actorLabel(issue.returnedBy, issue.returnedBySnapshot)}`;
  return `Issued by ${actorLabel(issue.issuedBy, issue.issuedBySnapshot)}`;
}

function lastActionDate(issue) {
  return issue.destroyDate || issue.transferDate || issue.returnDate || issue.issueDate || issue.updatedAt;
}

export default AssetIssues;
