import { cx } from "./utils";

export function Spinner({ label = "Loading" }) {
  return <span className="gov-spinner" role="status" aria-label={label} />;
}

export function Button({ variant = "primary", loading = false, block = false, children, className, disabled, ...props }) {
  return <button className={cx("gov-button", `gov-button--${variant}`, block && "gov-button--block", className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <Spinner />}<span>{children}</span></button>;
}

export function IconButton({ label, children, className, loading = false, disabled, ...props }) {
  return <button className={cx("gov-icon-button", className)} aria-label={label} title={label} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading ? <Spinner label={label} /> : children}</button>;
}
