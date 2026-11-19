import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Languages,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { Language } from "../types";
import type { Translate } from "../lib/i18n";
import { settingsHistoryLabel } from "../lib/i18n";
import { Sheet } from "./ui/Sheet";
import { GithubMark } from "./ui/GithubMark";

interface SettingsSheetProps {
  open: boolean;
  language: Language;
  historyCount: number;
  t: Translate;
  onClose: () => void;
  onLanguageChange: (language: Language) => void;
  onClearHistory: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

function LinkRow({
  icon,
  title,
  detail,
  onClick,
  forward,
}: {
  icon: ReactNode;
  title: string;
  detail?: string;
  onClick: () => void;
  forward: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3.5 py-3 text-start transition active:bg-black/[0.025]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[rgba(18,18,24,0.045)] text-[#55555d]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-5">{title}</span>
        {detail ? (
          <span className="mt-0.5 block text-[10.5px] font-medium text-muted">{detail}</span>
        ) : null}
      </span>
      <span className="text-[#b0b0b8]">{forward}</span>
    </button>
  );
}

export function SettingsSheet({
  open,
  language,
  historyCount,
  t,
  onClose,
  onLanguageChange,
  onClearHistory,
  onOpenPrivacy,
  onOpenTerms,
}: SettingsSheetProps) {
  const Forward = language === "fa" ? ChevronLeft : ChevronRight;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("settings.title")}
      subtitle={t("settings.subtitle")}
      closeLabel={t("common.close")}
    >
      <section>
        <h3 className="px-1 text-[11px] font-bold text-[#77777f]">{t("settings.language")}</h3>
        <div className="soft-card mt-2 rounded-[20px] p-3.5">
          <div className="flex items-center gap-2 text-[12px] font-semibold">
            <Languages size={15} strokeWidth={2} />
            {t("settings.language")}
          </div>
          <div className="segmented mt-3">
            <button
              type="button"
              data-active={language === "fa"}
              onClick={() => onLanguageChange("fa")}
            >
              {t("settings.persian")}
            </button>
            <button
              type="button"
              data-active={language === "en"}
              onClick={() => onLanguageChange("en")}
            >
              {t("settings.english")}
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-5 text-muted">{t("settings.languageHint")}</p>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="px-1 text-[11px] font-bold text-[#77777f]">{t("settings.data")}</h3>
        <div className="soft-card mt-2 overflow-hidden rounded-[20px]">
          <button
            type="button"
            onClick={onClearHistory}
            disabled={historyCount === 0}
            className="flex w-full items-center gap-3 px-3.5 py-3.5 text-start transition active:bg-black/[0.025] disabled:opacity-40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#FEF3F2] text-[#D92D20]">
              <Trash2 size={16} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold leading-5">
                {t("settings.clearHistory")}
              </span>
              <span className="mt-0.5 block text-[10.5px] font-medium text-muted">
                {settingsHistoryLabel(language, historyCount)}
              </span>
            </span>
          </button>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="px-1 text-[11px] font-bold text-[#77777f]">{t("settings.about")}</h3>
        <div className="soft-card mt-2 overflow-hidden rounded-[22px]">
          <div className="flex items-center gap-3.5 p-4">
            <img
              src="/logo.png"
              alt=""
              className="h-14 w-14 shrink-0 rounded-[17px] object-cover shadow-[0_10px_24px_-14px_rgba(20,20,40,0.5)]"
            />
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-6">{t("app.name")}</p>
              <p className="mt-0.5 text-[10.5px] font-medium text-muted">
                {t("settings.version", { version: __APP_VERSION__ })}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted">
                {t("settings.description")}
              </p>
            </div>
          </div>
          <div className="border-t border-[var(--hairline)]">
            <LinkRow
              icon={<ShieldCheck size={16} strokeWidth={2} />}
              title={t("settings.privacy")}
              onClick={onOpenPrivacy}
              forward={<Forward size={15} />}
            />
            <div className="mx-3.5 border-t border-[var(--hairline)]" />
            <LinkRow
              icon={<FileText size={16} strokeWidth={2} />}
              title={t("settings.terms")}
              onClick={onOpenTerms}
              forward={<Forward size={15} />}
            />
            <div className="mx-3.5 border-t border-[var(--hairline)]" />
            <a
              href="https://github.com/amiraligrr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 px-3.5 py-3 text-start transition active:bg-black/[0.025]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[rgba(18,18,24,0.045)] text-[#55555d]">
                <GithubMark size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold leading-5">
                  {t("settings.developer")}
                </span>
                <span className="mt-0.5 block text-[10.5px] font-medium text-muted">
                  Amiraligrr
                </span>
              </span>
              <span className="text-[#b0b0b8]">
                <Forward size={15} />
              </span>
            </a>
          </div>
        </div>
      </section>
    </Sheet>
  );
}
