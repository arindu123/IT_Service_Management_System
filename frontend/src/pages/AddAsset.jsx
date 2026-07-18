import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function AddAsset() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { enumLabel, t } = useTranslation();

  const [formData, setFormData] = useState({
    itemNumber: isEditing ? "" : generateItemNumber(),
    serialNumber: "",
    deviceType: "laptop",
    customDeviceType: "",
    brand: "",
    model: "",
    productYear: "",
    generation: "",
    assetValue: "",
    supplier: "",
    invoiceImage: "",
    hasWarranty: true,
    warrantyStartDate: "",
    warrantyEndDate: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const loadAsset = async () => {
      try {
        const response = await API.get(`/assets/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const asset = response.data;
        setFormData({
          itemNumber: asset.itemNumber || asset.assetId || "",
          serialNumber: asset.serialNumber || "",
          deviceType: asset.deviceType || "laptop",
          customDeviceType: asset.customDeviceType || "",
          brand: asset.brand || "",
          model: asset.model || "",
          productYear: asset.productYear || "",
          generation: asset.generation || "",
          assetValue: asset.assetValue ?? "",
          supplier: asset.supplier || "",
          invoiceImage: asset.invoiceImage || "",
          hasWarranty: asset.hasWarranty !== false,
          warrantyStartDate: asset.warrantyStartDate ? asset.warrantyStartDate.slice(0, 10) : "",
          warrantyEndDate: (asset.warrantyEndDate || asset.warrantyDate) ? (asset.warrantyEndDate || asset.warrantyDate).slice(0, 10) : "",
          notes: asset.notes || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Could not load this asset");
      }
    };

    loadAsset();
  }, [id, isEditing]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  };

  const handleInvoiceImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Select an invoice image up to 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormData((current) => ({ ...current, invoiceImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const payload = isEditing ? formData : { ...formData, itemNumber: undefined, assetId: undefined };
      const request = isEditing ? API.put(`/assets/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      }) : API.post("/assets", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await request;

      navigate("/assets");
    } catch (err) {
      setError(err.response?.data?.message || t("assets.createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t("assets.newEyebrow")}
        title={isEditing ? "Edit Asset" : t("assets.addTitle")}
        description={isEditing ? "Correct the item information, then save your changes." : "Register the asset first. Issue it to a registered user from Asset Custody after saving."}
      />

      <FormPanel className="max-w-none">
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="form-grid asset-form-readable xl:grid-cols-3">
          <SectionHeader number="01" title="Asset Identification" description="Core identifiers used to track this asset." />
          <Field label="Item Number">
            <input name="itemNumber" value={formData.itemNumber} readOnly placeholder="Auto-generated" required className="bg-slate-50" />
          </Field>

          <Field label={t("labels.serialNumber")}>
            <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder={t("placeholders.serialNumber")} required />
          </Field>

          <Field label={t("labels.deviceType")}>
            <select name="deviceType" value={formData.deviceType} onChange={handleChange}>
              <option value="computer">{enumLabel("deviceType", "computer")}</option>
              <option value="laptop">{enumLabel("deviceType", "laptop")}</option>
              <option value="printer">{enumLabel("deviceType", "printer")}</option>
              <option value="scanner">{enumLabel("deviceType", "scanner")}</option>
              <option value="network_device">{enumLabel("deviceType", "network_device")}</option>
              <option value="other">{enumLabel("deviceType", "other")}</option>
            </select>
          </Field>

          {formData.deviceType === "other" && (
            <Field label="Other Device Type">
              <input name="customDeviceType" value={formData.customDeviceType} onChange={handleChange} placeholder="Enter device type" required />
            </Field>
          )}

          <SectionHeader number="02" title="Device Specifications" description="Manufacturer and technical information." />
          <Field label={t("labels.brand")}>
            <input name="brand" value={formData.brand} onChange={handleChange} placeholder={t("placeholders.brand")} required />
          </Field>

          <Field label={t("labels.model")}>
            <input name="model" value={formData.model} onChange={handleChange} placeholder={t("placeholders.model")} required />
          </Field>

          <Field label="Product Year">
            <input type="number" name="productYear" min="2010" max="2100" value={formData.productYear} onChange={handleChange} placeholder="e.g. 2024" />
          </Field>

          <Field label="Generation">
            <input name="generation" value={formData.generation} onChange={handleChange} placeholder="e.g. 12th Gen" />
          </Field>

          <SectionHeader number="03" title="Purchase Information" description="Optional financial and supplier records." />
          <Field label="Asset Value" optional><input type="number" name="assetValue" min="0" step="0.01" value={formData.assetValue} onChange={handleChange} placeholder="0.00" /></Field>
          <Field label="Supplier" optional><input name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Enter supplier name" /></Field>
          <Field label="Invoice Image" optional className="md:col-span-2 xl:col-span-1">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <input type="file" accept="image/*" onChange={handleInvoiceImage} />
              <p className="mt-2 text-xs font-semibold text-slate-500">JPG, PNG or WebP, up to 5 MB.</p>
              {formData.invoiceImage && <img src={formData.invoiceImage} alt="Invoice preview" className="mt-4 h-28 rounded-lg border border-slate-200 bg-white object-contain p-1" />}
            </div>
          </Field>

          <SectionHeader number="04" title="Warranty Details" description="Record coverage dates or mark the asset as having no warranty." />
          <Field label="Warranty">
            <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold normal-case tracking-normal text-slate-700">
              <input type="checkbox" name="hasWarranty" checked={!formData.hasWarranty} onChange={(event) => setFormData({ ...formData, hasWarranty: !event.target.checked, warrantyStartDate: "", warrantyEndDate: "" })} className="h-4 w-4" />
              No Warranty
            </label>
          </Field>

          <Field label="Warranty Start Date">
            <input type="date" name="warrantyStartDate" value={formData.warrantyStartDate} onChange={handleChange} disabled={!formData.hasWarranty} required={formData.hasWarranty} />
          </Field>

          <Field label="Warranty End Date">
            <input type="date" name="warrantyEndDate" value={formData.warrantyEndDate} onChange={handleChange} disabled={!formData.hasWarranty} min={formData.warrantyStartDate || undefined} required={formData.hasWarranty} />
          </Field>

          <SectionHeader number="05" title="Additional Information" description="Any helpful notes about this asset." />
          <Field label={t("labels.notes")} className="md:col-span-2 xl:col-span-3">
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t("placeholders.assetNotes")} />
          </Field>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? t("common.saving") : isEditing ? "Save Changes" : t("common.saveAsset")}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/assets")}>{t("common.cancel")}</Button>
          </FormActions>
        </form>
      </FormPanel>
    </Layout>
  );
}

function Field({ label, children, className = "", optional = false }) {
  return (
    <div className={`field ${className}`.trim()}>
      <label>{label}{optional && <span className="ml-2 font-semibold normal-case tracking-normal text-slate-400">Optional</span>}</label>
      {children}
    </div>
  );
}

export default AddAsset;

function generateItemNumber() {
  return "IT/ASSET/0001";
}

function SectionHeader({ number, title, description }) {
  return (
    <div className="md:col-span-2 xl:col-span-3 mt-3 flex items-center gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3 first:mt-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-xs font-black text-white shadow-sm">{number}</span>
      <div>
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <p className="mt-0.5 text-sm font-medium leading-5 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
