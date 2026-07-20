/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cx } from "./utils";

export function AlertBanner({ tone = "info", title, children, className, action }) {
  return <div className={cx("gov-alert", `gov-alert--${tone}`, className)} role={tone === "danger" ? "alert" : "status"}><div><strong>{title}</strong>{children && <div>{children}</div>}</div>{action}</div>;
}
export function ErrorState({ title = "Something went wrong", message, action }) { return <AlertBanner tone="danger" title={title} action={action}>{message}</AlertBanner>; }
export function SuccessState({ title = "Completed successfully", message, action }) { return <AlertBanner tone="success" title={title} action={action}>{message}</AlertBanner>; }

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const toast = useCallback((message, options = {}) => {
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, tone: options.tone || "info" }]);
    globalThis.setTimeout(() => dismiss(id), options.duration ?? 5000);
    return id;
  }, [dismiss]);
  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);
  return <ToastContext.Provider value={value}>{children}<div className="gov-toast-region" aria-live="polite" aria-label="Notifications">{toasts.map((item) => <div key={item.id} className={cx("gov-toast", `gov-toast--${item.tone}`)} role={item.tone === "danger" ? "alert" : "status"}><span>{item.message}</span><button type="button" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}>×</button></div>)}</div></ToastContext.Provider>;
}
export function useToast() { const context = useContext(ToastContext); if (!context) throw new Error("useToast must be used inside ToastProvider"); return context; }
