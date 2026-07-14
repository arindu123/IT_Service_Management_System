import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, FormActions, FormPanel, PageHeader } from "../components/ui";

function AssetIssues() {
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ userId: "", itemId: "", issueDate: new Date().toISOString().slice(0, 10), notes: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
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
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      await API.post("/asset-issues", form, { headers });
      setForm({ userId: "", itemId: "", issueDate: new Date().toISOString().slice(0, 10), notes: "" });
      await load();
    } catch (err) { setError(err.response?.data?.message || "Could not issue item"); }
    finally { setSaving(false); }
  };

  const returnItem = async (id) => {
    try { await API.put(`/asset-issues/${id}/return`, {}, { headers }); await load(); }
    catch (err) { setError(err.response?.data?.message || "Could not return item"); }
  };

  const activeItemIds = new Set(issues.filter((issue) => issue.status === "issued").map((issue) => issue.item?._id));
  const selectedUser = users.find((user) => user._id === form.userId);

  return <Layout>
    <PageHeader eyebrow="Asset issues" title="Issue an Item" description="Connect a registered user with a registered item." />
    <FormPanel><Alert message={error} />
      <form onSubmit={submit} className="form-grid">
        <Field label="Select User"><select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}><option value="">Select user</option>{users.map((user) => <option key={user._id} value={user._id}>{user.employeeId || user._id} — {user.name} ({user.department || "No department"})</option>)}</select></Field>
        <Field label="User ID"><input value={selectedUser?.employeeId || selectedUser?._id || ""} placeholder="Auto-filled after selecting a user" disabled /></Field>
        <Field label="User Name"><input value={selectedUser?.name || ""} placeholder="Auto-filled after selecting a user" disabled /></Field>
        <Field label="Department"><input value={selectedUser?.department || ""} placeholder="Auto-filled after selecting a user" disabled /></Field>
        <Field label="Ministry"><input value={selectedUser?.ministry || ""} placeholder="Auto-filled after selecting a user" disabled /></Field>
        <Field label="Item ID"><select required value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}><option value="">Select item</option>{items.filter((item) => !activeItemIds.has(item._id)).map((item) => <option key={item._id} value={item._id}>{item.itemNumber || item.assetId} — {item.brand} {item.model}</option>)}</select></Field>
        <Field label="Issue Date"><input required type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></Field>
        <Field label="Notes"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" /></Field>
        <FormActions><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Issue Item"}</Button></FormActions>
      </form>
    </FormPanel>
    <div className="mt-8"><DataTable metric={`${issues.length} records`} emptyLabel="Issue Records" emptyMessage="No item issues recorded yet." columns={["User ID", "User Name", "Department", "Ministry", "Item Number", "Item", "Issue Date", "Status", "Action"]}>
      {issues.length === 0 ? <EmptyRow colSpan="9" message="No item issues recorded yet." /> : issues.map((issue) => <tr key={issue._id}>
        <td>{issue.user?.employeeId || issue.user?._id || "--"}</td><td>{issue.user?.name || "Deleted user"}</td><td>{issue.user?.department || "--"}</td><td>{issue.user?.ministry || "--"}</td><td>{issue.item?.itemNumber || "--"}</td><td>{issue.item ? `${issue.item.brand} ${issue.item.model}` : "Deleted item"}</td><td>{new Date(issue.issueDate).toLocaleDateString()}</td><td><Badge tone={issue.status === "issued" ? "blue" : "green"}>{issue.status}</Badge></td><td>{issue.status === "issued" && <Button type="button" variant="secondary" onClick={() => returnItem(issue._id)}>Return</Button>}</td>
      </tr>)}
    </DataTable></div>
  </Layout>;
}
function Field({ label, children }) { return <div className="field"><label>{label}</label>{children}</div>; }
export default AssetIssues;
