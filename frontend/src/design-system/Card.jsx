import { cx } from "./utils";

export function Card({ children, variant = "default", className, ...props }) {
  return <section className={cx("gov-card", variant !== "default" && `gov-card--${variant}`, className)} {...props}>{children}</section>;
}
export function CardHeader({ title, description, action, children, className }) {
  return <header className={cx("gov-card-header", className)}><div>{title && <h3 className="gov-card-title">{title}</h3>}{description && <p className="gov-card-description">{description}</p>}{children}</div>{action}</header>;
}
export function CardBody({ children, className }) { return <div className={cx("gov-card-body", className)}>{children}</div>; }
export function CardFooter({ children, className }) { return <footer className={cx("gov-card-footer", className)}>{children}</footer>; }
