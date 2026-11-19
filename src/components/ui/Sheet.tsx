import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerAction?: ReactNode;
  closeLabel: string;
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  headerAction,
  closeLabel,
}: SheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 260);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label={closeLabel}
            className="absolute inset-0 h-full w-full bg-[rgba(20,18,28,0.3)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            tabIndex={-1}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="sheet-surface absolute inset-x-0 bottom-0 top-[max(10px,env(safe-area-inset-top))] mx-auto flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-[30px] border-t border-white/80 shadow-[0_-24px_80px_-30px_rgba(22,18,40,0.45)] sm:top-[max(18px,env(safe-area-inset-top))] sm:rounded-t-[34px]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.9 }}
          >
            <div className="flex justify-center pb-1 pt-2.5">
              <div className="h-[5px] w-9 rounded-full bg-[rgba(18,18,24,0.14)]" />
            </div>
            <header className="flex items-start gap-3 px-5 pb-3 pt-1">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[22px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
                {subtitle ? (
                  <p className="mt-0.5 truncate text-[12px] font-medium text-muted">{subtitle}</p>
                ) : null}
              </div>
              {headerAction}
              <button
                ref={closeRef}
                type="button"
                aria-label={closeLabel}
                onClick={onClose}
                className="icon-btn -me-1 mt-0.5 h-9 w-9"
              >
                <X size={17} strokeWidth={2.2} />
              </button>
            </header>
            <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
              {children}
            </div>
            {footer ? (
              <div className="border-t border-[var(--hairline)] bg-[#f7f7f9]/95 px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3">
                {footer}
              </div>
            ) : null}
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
