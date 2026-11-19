import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Trophy, X } from "lucide-react";
import { useMemo } from "react";
import { createPortal } from "react-dom";
import type { Result } from "../types";
import type { Translate } from "../lib/i18n";
import type { Language } from "../types";
import { PALETTE, readableInk } from "../lib/colors";
import { formatPercent } from "../lib/format";

interface ResultModalProps {
  result: Result | null;
  language: Language;
  t: Translate;
  onClose: () => void;
  onSpinAgain: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
  size: number;
  delay: number;
  round: boolean;
}

export function ResultModal({ result, language, t, onClose, onSpinAgain }: ResultModalProps) {
  const particles = useMemo<Particle[]>(() => {
    if (!result) return [];
    return Array.from({ length: 18 }, (_, index) => {
      const angle = (index / 18) * Math.PI * 2 + 0.25;
      const distance = 86 + ((index * 37) % 64);
      return {
        id: index,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance * 0.82,
        rotate: ((index * 53) % 140) - 70,
        color: index % 5 === 0 ? result.item.color : PALETTE[index % PALETTE.length],
        size: index % 3 === 0 ? 7 : index % 3 === 1 ? 5 : 4,
        delay: (index % 6) * 0.025,
        round: index % 2 === 0,
      };
    });
  }, [result]);

  return createPortal(
    <AnimatePresence>
      {result ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
          <motion.button
            type="button"
            aria-label={t("result.close")}
            className="absolute inset-0 h-full w-full bg-[rgba(20,18,28,0.44)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            tabIndex={-1}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("result.title")}
            className="glass no-scrollbar relative max-h-[calc(100dvh-28px)] w-full max-w-[355px] overflow-y-auto overscroll-contain rounded-[32px] px-6 pb-5 pt-7 text-center"
            initial={{ opacity: 0, scale: 0.92, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          >
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {particles.map((particle) => (
                <motion.span
                  key={particle.id}
                  className="absolute left-1/2 top-[36%]"
                  style={{
                    width: particle.size,
                    height: particle.size,
                   backgroundColor: particle.color,
                    borderRadius: particle.round ? 999 : 2,
                  }}
                  initial={{ opacity: 0.95, x: 0, y: 0, scale: 0.4, rotate: 0 }}
                  animate={{
                    opacity: 0,
                    x: particle.x,
                    y: particle.y,
                    scale: 1,
                    rotate: particle.rotate,
                  }}
                  transition={{ duration: 1.05, delay: particle.delay, ease: [0.16, 0.8, 0.3, 1] }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="icon-btn absolute end-3.5 top-3.5 h-8 w-8"
            >
              <X size={15} strokeWidth={2.2} />
            </button>

            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              {t("result.title")}
            </p>

            <motion.div
              className="relative mx-auto mt-5 flex h-[92px] w-[92px] items-center justify-center rounded-full"
              style={{ backgroundColor: result.item.color }}
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.08 }}
            >
              <span
                className="absolute inset-0 rounded-full opacity-30 blur-xl"
                style={{ backgroundColor: result.item.color }}
              />
              <Trophy
                size={38}
                strokeWidth={1.7}
                style={{ color: readableInk(result.item.color) }}
                className="relative"
              />
            </motion.div>

            <p className="mt-5 text-[11px] font-semibold text-muted">{t("result.subtitle")}</p>
            <h2
              className="mt-1 break-words text-[30px] font-extrabold leading-[1.2] tracking-[-0.025em] text-ink"
              style={{ textWrap: "balance" }}
            >
              {result.item.name}
            </h2>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(18,18,24,0.055)] px-3 py-1.5 text-[11.5px] font-semibold text-[#4d4d55]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: result.item.color }}
              />
              {t("result.chance", { percent: formatPercent(result.probability, language) })}
            </div>

            <p className="mx-auto mt-2.5 max-w-[250px] truncate text-[11.5px] font-medium text-muted">
              {t("result.fromWheel", { wheel: result.wheelName })}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onSpinAgain}
                className="primary-btn min-h-[52px] rounded-[17px] text-[14px] font-bold"
              >
                <RotateCcw size={16} strokeWidth={2.2} />
                {t("result.spinAgain")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="secondary-btn min-h-[48px] rounded-[16px] text-[13.5px] font-semibold"
              >
                {t("result.close")}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
