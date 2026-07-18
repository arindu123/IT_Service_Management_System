import { useId } from "react";
import { cx } from "./utils";

export function ValidationMessage({ type = "error", children, id }) {
  if (!children) return null;
  return <p id={id} className={`gov-field-${type}`} role={type === "error" ? "alert" : undefined}>{children}</p>;
}

function FieldShell({ id, label, required, optional, helpText, error, success, children, className }) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  return <div className={cx("gov-field", className)}><label className="gov-field-label" htmlFor={id}>{label}{required && <span className="gov-field-required" aria-hidden="true"> *</span>}{optional && <span className="gov-field-optional"> (Optional)</span>}</label>{children({ describedBy })}{helpText && <ValidationMessage type="help" id={helpId}>{helpText}</ValidationMessage>}<ValidationMessage type="error" id={errorId}>{error}</ValidationMessage><ValidationMessage type="success">{success}</ValidationMessage></div>;
}

function useFieldId(id) { const generated = useId(); return id || generated; }

export function Input({ id, label, error, helpText, success, optional, className, inputClassName, required, ...props }) {
  const fieldId = useFieldId(id);
  return <FieldShell {...{ id: fieldId, label, error, helpText, success, optional, className, required }}>{({ describedBy }) => <input id={fieldId} className={cx("gov-field-control", error && "gov-field-control--error", inputClassName)} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />}</FieldShell>;
}
export function Select({ id, label, error, helpText, success, optional, className, selectClassName, required, children, options, ...props }) {
  const fieldId = useFieldId(id);
  const renderedOptions = options?.map((option, index) => {
    const normalized = Array.isArray(option) ? { value: option[0], label: option[1] } : option;
    if (!normalized) return null;
    return <option key={normalized.value ?? index} value={normalized.value ?? ""} disabled={normalized.disabled}>{normalized.label ?? normalized.value ?? ""}</option>;
  });
  return <FieldShell {...{ id: fieldId, label, error, helpText, success, optional, className, required }}>{({ describedBy }) => <select id={fieldId} className={cx("gov-field-control", error && "gov-field-control--error", selectClassName)} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props}>{options ? renderedOptions : children}</select>}</FieldShell>;
}
export function Textarea({ id, label, error, helpText, success, optional, className, textareaClassName, required, ...props }) {
  const fieldId = useFieldId(id);
  return <FieldShell {...{ id: fieldId, label, error, helpText, success, optional, className, required }}>{({ describedBy }) => <textarea id={fieldId} className={cx("gov-field-control gov-textarea", error && "gov-field-control--error", textareaClassName)} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />}</FieldShell>;
}
export function DateField(props) { return <Input type="date" {...props} />; }
export function FileUpload({ id, label, error, helpText, success, optional, className, required, accept, multiple, onChange, children }) {
  const fieldId = useFieldId(id);
  return <FieldShell {...{ id: fieldId, label, error, helpText, success, optional, className, required }}>{({ describedBy }) => <div className="gov-file-upload"><input id={fieldId} type="file" required={required} accept={accept} multiple={multiple} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={describedBy} />{children}</div>}</FieldShell>;
}
