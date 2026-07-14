import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function Assets() {
  const navigate = useNavigate();
  const { enumLabel, t } = useTranslation();

  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedAssetId, setExpandedAssetId] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/assets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: search.trim() ? { search: search.trim() } : {},
        });

        setAssets(response.data.assets);
      } catch (err) {
        setError(err.response?.data?.message || t("assets.loadError"));
      }
    };

    const timeoutId = window.setTimeout(fetchAssets, 250);
    return () => window.clearTimeout(timeoutId);
  }, [search, t]);

  return (
    <Layout>
      <PageHeader
        eyebrow={t("assets.eyebrow")}
        title={t("assets.title")}
        description={t("assets.description")}
        action={<Button onClick={() => navigate("/assets/add")}>{t("common.addNewAsset")}</Button>}
      />

      <Alert message={error} />

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
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">Responsive view</span>
        </div>

        {assets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center text-sm font-semibold text-slate-500">
            {search ? "No assets match this search." : t("assets.empty")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const expanded = expandedAssetId === asset._id;
              return (
                <article key={asset._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">Item number</p>
                        <h4 className="mt-1 truncate text-lg font-black text-slate-950"><HighlightMatch value={asset.itemNumber || asset.assetId} search={search} /></h4>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm"><HighlightMatch value={enumLabel("deviceType", asset.deviceType)} search={search} /></span>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Detail label="User ID" value={asset.userId || "--"} search={search} />
                        <Detail label="User Name" value={asset.userName || "Not assigned"} search={search} />
                      </div>
                    </div>

                    {expanded && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <section>
                          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Item specifications</p>
                          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-white p-3 text-sm">
                            <Detail label="Brand" value={asset.brand} search={search} />
                            <Detail label="Model" value={asset.model} search={search} />
                            <Detail label="Serial number" value={asset.serialNumber} search={search} />
                            <Detail label="Product year" value={asset.productYear} search={search} />
                            <Detail label="Generation" value={asset.generation} search={search} />
                            <Detail label="Device type" value={enumLabel("deviceType", asset.deviceType)} search={search} />
                            <Detail label="Location" value={asset.location} search={search} />
                            <Detail label="Warranty date" value={formatDate(asset.warrantyDate)} />
                            <Detail label="Notes" value={asset.notes} search={search} />
                          </div>
                        </section>
                        <section>
                          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Assignment details</p>
                          <div className="grid grid-cols-2 gap-3 rounded-xl bg-blue-50/70 p-3 text-sm">
                            <Detail label="User name" value={asset.userName || "Not assigned"} search={search} />
                            <Detail label="User ID" value={asset.userId || "--"} search={search} />
                            <Detail label="Department" value={asset.department} search={search} />
                            <Detail label="Ministry" value={asset.ministry} search={search} />
                            <Detail label="Issue date" value={formatDate(asset.issueDate)} />
                          </div>
                        </section>
                      </div>
                    )}

                    <div className="flex gap-2 border-t border-slate-100 pt-4">
                      <Button type="button" variant="secondary" className="flex-1" onClick={() => setExpandedAssetId(expanded ? null : asset._id)}>
                        {expanded ? "Hide details" : "View details"}
                      </Button>
                      <Button type="button" className="flex-1" onClick={() => navigate(`/assets/${asset._id}/edit`)}>Edit</Button>
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

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "--";
}
