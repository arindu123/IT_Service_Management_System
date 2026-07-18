import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { cx } from "./utils";

const focusableSelector = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, footer, size = "md", closeLabel = "Close dialog", closeOnBackdrop = true, className }) {
  const titleId = useId();
  const modalRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => modalRef.current?.querySelector(focusableSelector)?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key !== "Tab" || !modalRef.current) return;
      const items = [...modalRef.current.querySelectorAll(focusableSelector)];
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = previousOverflow; previousFocus?.focus?.(); };
  }, [onClose, open]);
  if (!open) return null;
  return createPortal(<div className="gov-modal-backdrop" onMouseDown={(event) => { if (closeOnBackdrop && event.target === event.currentTarget) onClose?.(); }}><section ref={modalRef} className={cx("gov-modal", size !== "md" && `gov-modal--${size}`, className)} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><header className="gov-modal-header"><h2 id={titleId} className="gov-modal-title">{title}</h2><button type="button" className="gov-modal-close" aria-label={closeLabel} onClick={onClose}>×</button></header><div className="gov-modal-body">{children}</div>{footer && <footer className="gov-modal-footer">{footer}</footer>}</section></div>, document.body);
}

export function ConfirmationDialog({ open, onClose, onConfirm, title = "Confirm action", message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, loading = false }) {
  return <Modal open={open} onClose={onClose} title={title} size="sm" closeOnBackdrop={!loading} footer={<><Button variant="secondary" disabled={loading} onClick={onClose}>{cancelLabel}</Button><Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}>{message && <div>{message}</div>}</Modal>;
}
