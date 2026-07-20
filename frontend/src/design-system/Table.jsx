import { Button, Spinner } from "./Button";
import { cx } from "./utils";

export function DataTable({ columns, data = [], rowKey = "id", renderCell, sort, onSort, loading = false, emptyTitle = "No records found", emptyDescription, pagination, className, caption }) {
  const changeSort = (column) => {
    if (!column.sortable || !onSort) return;
    const direction = sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc";
    onSort({ key: column.key, direction });
  };
  return <section className={cx("gov-table-shell", className)}><div className="gov-table-scroll"><table className="gov-table">{caption && <caption className="sr-only">{caption}</caption>}<thead><tr>{columns.map((column) => <th key={column.key} scope="col" style={column.width ? { width: column.width } : undefined}>{column.sortable ? <button type="button" className="gov-table-sort" onClick={() => changeSort(column)} aria-sort={sort?.key === column.key ? `${sort.direction}ending` : "none"}>{column.header}<span aria-hidden="true">{sort?.key === column.key ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button> : column.header}</th>)}</tr></thead>{!loading && data.length > 0 && <tbody>{data.map((row, index) => <tr key={typeof rowKey === "function" ? rowKey(row) : row[rowKey] ?? index}>{columns.map((column) => <td key={column.key}>{renderCell ? renderCell(row, column, index) : row[column.key]}</td>)}</tr>)}</tbody>}</table></div>{loading ? <TableLoadingState /> : data.length === 0 ? <TableEmptyState title={emptyTitle} description={emptyDescription} /> : null}{pagination && <TablePagination {...pagination} />}</section>;
}

export function TableEmptyState({ title = "No records found", description }) { return <div className="gov-table-state"><div><strong>{title}</strong>{description && <p>{description}</p>}</div></div>; }
export function TableLoadingState({ label = "Loading records" }) { return <div className="gov-table-state" aria-live="polite"><div><Spinner label={label} /><p>{label}…</p></div></div>; }
export function TablePagination({ page = 1, pageSize = 10, total = 0, onPageChange, disabled = false }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <nav className="gov-table-pagination" aria-label="Table pagination"><span>Page {page} of {pages} · {total} records</span><div><Button variant="ghost" disabled={disabled || page <= 1} onClick={() => onPageChange?.(page - 1)}>Previous</Button><Button variant="ghost" disabled={disabled || page >= pages} onClick={() => onPageChange?.(page + 1)}>Next</Button></div></nav>;
}
