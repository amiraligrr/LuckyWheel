import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  destructive = false,
}: ConfirmDialogProps) {
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-5">
          <motion.button
            type="button"
            aria-label={cancelLabel}
            className="absolute inset-0 h-full w-full bg-[rgba(17,15,24,0.42)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            tabIndex={-1}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            className="glass relative w-full max-w-[350px] overflow-hidden rounded-[28px] p-5"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <div
              className={`mb-3 flex h-11 w-11 items-center justify-center rounded-[15px] ${
                destructive
                  ? "bg-[#FEF3F2] text-[#D92D20]"
                  : "bg-[rgba(18,18,24,0.06)] text-ink"
              }`}
            >
              <AlertTriangle size={20} strokeWidth={2.1} />
            </div>
            <h2 className="text-[18px] font-bold tracking-[-0.01em]">{title}</h2>
            <p className="mt-1.5 text-[13px] leading-6 text-muted">{message}</p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="secondary-btn h-12 flex-1 rounded-[15px] text-[14px] font-semibold"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex h-12 flex-1 items-center justify-center rounded-[15px] text-[14px] font-bold text-white transition active:scale-[0.98] ${
                  destructive ? "bg-[#D92D20]" : "bg-ink"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
