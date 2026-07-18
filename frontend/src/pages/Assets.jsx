import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

const ASSET_CUSTODY_ROLES = ["admin", "system_admin", "head_of_it"];
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function Assets() {
  const navigate = useNavigate();
  const { enumLabel, formatDate: formatTranslatedDate, t } = useTranslation();

  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [expandedAssetId, setExpandedAssetId] = useState(null);
  const [savingDestroy, setSavingDestroy] = useState("");
  const [invoicePreview, setInvoicePreview] = useState(null);
  // Keep the compact table as the default while allowing users to switch to cards.
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("assetsViewMode") || "table");

  const changeViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("assetsViewMode", mode);
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const canManageCustody = ASSET_CUSTODY_ROLES.includes(currentUser?.role);

  const fetchAssets = useCallback(async () => {
    try {
      const response = await API.get("/assets", {
        headers: getAuthHeaders(),
        params: search.trim() ? { search: search.trim() } : {},
      });

      setAssets(response.data.assets);
    } catch (err) {
      setError(err.response?.data?.message || t("assets.loadError"));
    }
  }, [search, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchAssets, 250);
    return () => window.clearTimeout(timeoutId);
  }, [fetchAssets]);

  const destroyAsset = async (asset) => {
    const reason = window.prompt(`Destroy ${asset.itemNumber || asset.assetId}? Enter reason or reference:`);
    if (reason === null) return;

    setError("");
    setSuccess("");
    setSavingDestroy(asset._id);

    try {
      await API.put(`/assets/${asset._id}/destroy`, { reason }, { headers: getAuthHeaders() });
      setSuccess("Asset destroyed and removed from any assigned user.");
      await fetchAssets();
    } catch (err) {
      setError(err.response?.data?.message || "Could not destroy this asset");
    } finally {
      setSavingDestroy("");
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t("assets.eyebrow")}
        title={t("assets.title")}
        description="Register assets first, then issue, transfer, remove, or destroy them from Asset Custody."
        action={<Button onClick={() => navigate("/assets/add")}>{t("common.addNewAsset")}</Button>}
      />

      <Alert message={error} />
      {invoicePreview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-label="Invoice image preview">
          <div className="flex max-h-full w-full max-w-6xl flex-col rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Invoice image</p><h3 className="text-lg font-black text-slate-950">{invoicePreview.label}</h3></div>
              <div className="flex items-center gap-2">
                <a href={invoicePreview.src} download={`${invoicePreview.label}-invoice.${invoiceExtension(invoicePreview.src)}`} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-800">Download Invoice</a>
                <Button type="button" variant="secondary" onClick={() => setInvoicePreview(null)}>Close</Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-slate-100 p-3 text-center">
              <img src={invoicePreview.src} alt={invoicePreview.label} className="mx-auto max-h-[75vh] max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search item number, serial number, brand, model, user, department or ministry..."
          className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {search && (
          <Button type="button" variant="secondary" onClick={() => setSearch("")}>Clear</Button>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Asset register</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{assets.length} asset{assets.length === 1 ? "" : "s"}</h3>
          </div>
          {canManageCustody && (
            <Button type="button" variant="secondary" onClick={() => navigate("/asset-issues")}>Asset Custody</Button>
          )}
        </div>

        <div className="mb-5 flex items-center justify-end gap-2" role="group" aria-label="Asset display options">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">{t("assets.display")}</span>
          {[["table", "Table"], ["cards", "Box"]].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => changeViewMode(mode)}
              className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${viewMode === mode ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"}`}
              aria-pressed={viewMode === mode}
            >
              {label}
            </button>
          ))}
        </div>

        {assets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center text-sm font-semibold text-slate-500">
            {search ? t("assets.noSearchResults") : t("assets.empty")}
          </div>
        ) : (
          viewMode === "table" ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                  <tr><th className="px-4 py-3">Item number</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">Serial number</th><th className="px-4 py-3">Current user</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {assets.map((asset) => {
                    const owner = getOwner(asset); const status = asset.status || "active"; const expanded = expandedAssetId === asset._id;
                    return <tr key={asset._id} className="table-row-hover">
                      <td className="whitespace-nowrap px-4 py-3 font-black text-slate-900"><HighlightMatch value={asset.itemNumber || asset.assetId} search={search} /></td>
                      <td className="px-4 py-3 font-semibold text-slate-700"><HighlightMatch value={asset.deviceType === "other" ? asset.customDeviceType : enumLabel("deviceType", asset.deviceType)} search={search} /></td>
                      <td className="px-4 py-3 font-semibold text-slate-700"><HighlightMatch value={asset.serialNumber} search={search} /></td>
                      <td className="px-4 py-3 font-semibold text-slate-700"><HighlightMatch value={ownerSummary(owner)} search={search} /></td>
                      <td className="px-4 py-3"><Badge tone={statusTone(status)}>{enumLabel("assetStatus", status)}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right"><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setViewMode("cards"); setExpandedAssetId(expanded ? null : asset._id); }}>{expanded ? "Hide" : "Details"}</Button><Button type="button" onClick={() => navigate(`/assets/${asset._id}/edit`)}>Edit</Button></div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          ) : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const expanded = expandedAssetId === asset._id;
              const owner = getOwner(asset);
              const status = asset.status || "active";
              const lifecycle = Array.isArray(asset.lifecycleEvents) ? asset.lifecycleEvents : [];
              const latestEvent = lifecycle[lifecycle.length - 1];

              return (
                <article key={asset._id} className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${expanded ? "relative z-50" : "transition hover:border-blue-300 hover:shadow-md"}`}>
                  <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">Item number</p>
                        <h4 className="mt-1 truncate text-lg font-black text-slate-950"><HighlightMatch value={asset.itemNumber || asset.assetId} search={search} /></h4>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge tone={statusTone(status)}>{enumLabel("assetStatus", status)}</Badge>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm"><HighlightMatch value={asset.deviceType === "other" ? asset.customDeviceType : enumLabel("deviceType", asset.deviceType)} search={search} /></span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Detail label="Current user" value={ownerSummary(owner)} search={search} />
                      <Detail label="Custody status" value={enumLabel("assetStatus", status)} search={search} />
                      <Detail label="Serial number" value={asset.serialNumber} search={search} />
                      <Detail label="Last action" value={latestEvent ? actionLabel(latestEvent) : "Registered"} />
                    </div>

                    {expanded && (
                      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Asset details">
                        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
                          <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Asset details</p><h3 className="mt-1 text-2xl font-black text-slate-950">{asset.itemNumber || asset.assetId}</h3></div>
                            <Button type="button" variant="secondary" onClick={() => setExpandedAssetId(null)}>Close</Button>
                          </div>
                          <div className="space-y-5">
                        <section>
                          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Item specifications</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <Detail label="Brand" value={asset.brand} search={search} />
                            <Detail label="Model" value={asset.model} search={search} />
                            <Detail label="Serial number" value={asset.serialNumber} search={search} />
                            <Detail label="Product year" value={asset.productYear} search={search} />
                            <Detail label="Generation" value={asset.generation} search={search} />
                            <Detail label="Device type" value={asset.deviceType === "other" ? asset.customDeviceType : enumLabel("deviceType", asset.deviceType)} search={search} />
                            <Detail label="Asset value" value={asset.assetValue != null ? Number(asset.assetValue).toLocaleString() : "--"} search={search} />
                            <Detail label="Supplier" value={asset.supplier} search={search} />
                            <Detail label="Warranty" value={asset.hasWarranty === false ? "No warranty" : `${formatDate(asset.warrantyStartDate, formatTranslatedDate)} - ${formatDate(asset.warrantyEndDate || asset.warrantyDate, formatTranslatedDate)}`} />
                            <div className="col-span-2 min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Invoice image</p>
                              {asset.invoiceImage ? (
                                <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                  <img src={asset.invoiceImage} alt={`Invoice for ${asset.itemNumber || asset.assetId}`} className="h-20 w-24 rounded-lg border border-slate-200 bg-white object-contain" />
                                  <button type="button" onClick={() => setInvoicePreview({ src: asset.invoiceImage, label: asset.itemNumber || asset.assetId || "Invoice" })} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-800">View Invoice</button>
                                </div>
                              ) : <p className="mt-1 font-bold text-slate-700">Not attached</p>}
                            </div>
                            <Detail label="Notes" value={asset.notes} search={search} />
                          </div>
                        </section>

                        <section>
                          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Assignment details</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <Detail label="User name" value={owner.name || "Not assigned"} search={search} />
                            <Detail label="Employee ID" value={owner.employeeId || "--"} search={search} />
                            <Detail label="Issue date" value={formatDate(asset.issueDate, formatTranslatedDate)} />
                            <Detail label="Destroyed at" value={formatDate(asset.destroyedAt, formatTranslatedDate)} />
                            <Detail label="Added by" value={actorLabel(asset.createdBy)} search={search} />
                            <Detail label="Last updated by" value={actorLabel(asset.updatedBy)} search={search} />
                          </div>
                        </section>

                        {lifecycle.length > 0 && (
                          <section>
                            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Audit trail</p>
                            <div className="space-y-3">
                              {lifecycle.slice(-6).reverse().map((event, index) => (
                                <div key={`${event.action}-${event.at || index}`} className="border-l-2 border-blue-200 pl-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <strong className="text-sm font-black capitalize text-slate-900">{actionLabel(event)}</strong>
                                    <span className="text-[11px] font-bold text-slate-500">{formatDate(event.at, formatTranslatedDate)}</span>
                                  </div>
                                  <p className="mt-1 text-xs font-semibold text-slate-600">
                                    {actorLabel(event.actor, event.actorSnapshot)}
                                    {eventUserText(event) ? ` - ${eventUserText(event)}` : ""}
                                  </p>
                                  {event.notes && <p className="mt-1 text-xs font-medium text-slate-500">{event.notes}</p>}
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <Button type="button" variant="secondary" className="flex-1" onClick={() => setExpandedAssetId(expanded ? null : asset._id)}>
                        {expanded ? "Hide details" : "View details"}
                      </Button>
                      <Button type="button" className="flex-1" onClick={() => navigate(`/assets/${asset._id}/edit`)}>Edit</Button>
                      {canManageCustody && status !== "destroyed" && (
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          disabled={savingDestroy === asset._id}
                          onClick={() => destroyAsset(asset)}
                        >
                          {savingDestroy === asset._id ? "Destroying..." : "Destroy"}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}

export default Assets;

function HighlightMatch({ value, search }) {
  const text = String(value || "--");
  const term = search.trim();
  if (!term) return text;

  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "ig"));
  return parts.map((part, index) =>
    part.toLowerCase() === term.toLowerCase()
      ? <mark key={index} className="rounded bg-amber-200 px-0.5 font-bold text-slate-950">{part}</mark>
      : part
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Detail({ label, value, search = "" }) {
  return <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-1 truncate font-bold text-slate-700"><HighlightMatch value={value || "--"} search={search} /></p></div>;
}

function getOwner(asset = {}) {
  const assignedTo = asset.assignedTo || {};
  const snapshot = asset.assignedUserSnapshot || {};

  return {
    name: assignedTo.name || snapshot.name || asset.userName || "",
    employeeId: assignedTo.employeeId || snapshot.employeeId || asset.userId || "",
    department: assignedTo.department || snapshot.department || "",
    ministry: assignedTo.ministry || snapshot.ministry || "",
    designation: assignedTo.designation || snapshot.designation || "",
  };
}

function ownerSummary(owner) {
  if (!owner.name && !owner.employeeId) return "Not assigned";
  return `${owner.employeeId || "--"} - ${owner.name || "Unknown user"}`;
}

function actorLabel(actor, snapshot = {}) {
  return actor?.name || snapshot?.name || "--";
}

function statusTone(status) {
  if (status === "issued") return "blue";
  if (status === "under_repair") return "amber";
  if (status === "damaged" || status === "destroyed") return "red";
  if (status === "retired") return "slate";
  return "green";
}

function actionLabel(event = {}) {
  const labels = {
    created: "Added",
    updated: "Updated",
    issued: "Issued",
    returned: "Removed",
    transferred: "Transferred",
    destroyed: "Destroyed",
    deleted: "Deleted",
  };

  return labels[event.action] || "Updated";
}

function eventUserText(event = {}) {
  if (event.action === "issued") return `to ${userLabel(event.toUser, event.toUserSnapshot)}`;
  if (event.action === "returned" || event.action === "destroyed") return `from ${userLabel(event.fromUser, event.fromUserSnapshot)}`;
  if (event.action === "transferred") {
    return `${userLabel(event.fromUser, event.fromUserSnapshot)} to ${userLabel(event.toUser, event.toUserSnapshot)}`;
  }

  return "";
}

function userLabel(user, snapshot = {}) {
  const employeeId = user?.employeeId || snapshot?.employeeId || "--";
  const name = user?.name || snapshot?.name || "Unknown user";
  return `${employeeId} - ${name}`;
}

function formatDate(value, formatter) {
  return value ? formatter(value) : "--";
}

function invoiceExtension(dataUrl = "") {
  const mime = dataUrl.match(/^data:image\/([^;]+)/)?.[1] || "png";
  return mime === "jpeg" ? "jpg" : mime;
}
