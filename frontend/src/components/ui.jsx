export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h2 className="page-title">{title}</h2>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </div>
  );
}

export function Alert({ message }) {
  if (!message) return null;

  return (
    <div className="alert-danger" role="alert">
      <span className="alert-mark">!</span>
      <span>{message}</span>
    </div>
  );
}

export function Button({ children, className = "", variant = "primary", ...props }) {
  const variantClass = variant === "secondary" ? "btn-secondary" : "btn-primary";

  return (
    <button className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = "slate" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function DataTable({ columns, children, emptyLabel, metric }) {
  return (
    <section className="table-shell">
      <div className="table-toolbar">
        <div>
          <p className="table-label">{metric}</p>
          <h3 className="table-title">{emptyLabel}</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EmptyRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-cell">
        <div className="empty-mark">--</div>
        <p>{message}</p>
      </td>
    </tr>
  );
}

export function StatCard({ label, value, tone = "blue", meta }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <p>{label}</p>
      <div className="stat-value">{value}</div>
      {meta && <span>{meta}</span>}
    </div>
  );
}

export function FormPanel({ children }) {
  return <section className="form-panel">{children}</section>;
}

export function FormActions({ children }) {
  return <div className="form-actions">{children}</div>;
}
