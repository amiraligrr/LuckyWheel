import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

interface ToastProps {
  toast: { id: number; text: string } | null;
}

export function Toast({ toast }: ToastProps) {
  return createPortal(
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+26px)] z-[100] flex justify-center px-6"
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 430, damping: 32 }}
        >
          <div className="max-w-[330px] rounded-full bg-[rgba(17,17,20,0.96)] px-4 py-2.5 text-center text-[12.5px] font-semibold leading-5 text-white shadow-[0_18px_40px_-16px_rgba(10,10,16,0.7)]">
            {toast.text}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
