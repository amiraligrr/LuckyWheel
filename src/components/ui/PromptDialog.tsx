import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel: string;
  cancelLabel: string;
  maxLength?: number;
  onClose: () => void;
  onConfirm: (value: string) => void;
  validate?: (value: string) => string | null;
}

export function PromptDialog({
  open,
  title,
  description,
  label,
  placeholder,
  initialValue = "",
  confirmLabel,
  cancelLabel,
  maxLength = 32,
  onClose,
  onConfirm,
  validate,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) return;
    setValue(initialValue);
    setError(null);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.select();
    }, 220);
    return () => window.clearTimeout(timer);
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const submit = () => {
    const trimmed = value.trim();
    const nextError = validate?.(trimmed) ?? (trimmed ? null : label);
    if (nextError) {
      setError(nextError);
      return;
    }
    onConfirm(trimmed);
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-5">
          <motion.button
            type="button"
            aria-label={cancelLabel}
            className="absolute inset-0 h-full w-full bg-[rgba(17,15,24,0.4)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            tabIndex={-1}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${inputId}-title`}
            className="glass relative w-full max-w-[360px] overflow-hidden rounded-[28px] p-5"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <h2 id={`${inputId}-title`} className="text-[19px] font-bold tracking-[-0.01em]">
              {title}
            </h2>
            {description ? <p className="mt-1 text-[12px] leading-5 text-muted">{description}</p> : null}
            <label htmlFor={inputId} className="mt-4 block text-[12px] font-semibold text-muted">
              {label}
            </label>
            <input
              ref={inputRef}
              id={inputId}
              value={value}
              maxLength={maxLength}
              placeholder={placeholder}
              onChange={(event) => {
                setValue(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
              className="mt-1.5 h-12 w-full rounded-[14px] border border-[rgba(18,18,24,0.09)] bg-white/80 px-3.5 text-[15px] font-semibold text-ink outline-none transition focus:border-[rgba(18,18,24,0.26)] focus:bg-white"
            />
            {error ? <p className="mt-2 text-[12px] font-medium text-[#B42318]">{error}</p> : null}
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
                onClick={submit}
                className="primary-btn h-12 min-h-0 flex-1 rounded-[15px] text-[14px] font-bold"
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
