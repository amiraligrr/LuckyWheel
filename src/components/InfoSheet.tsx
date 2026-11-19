import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from "lucide-react";
import type { Language } from "../types";
import type { Translate } from "../lib/i18n";
import { IconButton } from "./ui/IconButton";
import { Sheet } from "./ui/Sheet";

type InfoKind = "privacy" | "terms";

interface InfoSheetProps {
  open: boolean;
  kind: InfoKind;
  language: Language;
  t: Translate;
  onClose: () => void;
  onBack: () => void;
}

export function InfoSheet({ open, kind, language, t, onClose, onBack }: InfoSheetProps) {
  const title = kind === "privacy" ? t("privacy.title") : t("terms.title");
  const updated = kind === "privacy" ? t("privacy.updated") : t("terms.updated");
  const paragraphs =
    kind === "privacy"
      ? [t("privacy.p1"), t("privacy.p2"), t("privacy.p3"), t("privacy.p4")]
      : [t("terms.p1"), t("terms.p2"), t("terms.p3"), t("terms.p4")];
  const BackIcon = language === "fa" ? ArrowRight : ArrowLeft;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={updated}
      closeLabel={t("common.close")}
      headerAction={
        <IconButton label={t("common.back")} onClick={onBack} className="mt-0.5 h-9 w-9">
          <BackIcon size={17} strokeWidth={2.2} />
        </IconButton>
      }
    >
      <div className="soft-card rounded-[24px] p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[rgba(18,18,24,0.05)] text-[#44444c]">
          {kind === "privacy" ? (
            <ShieldCheck size={22} strokeWidth={1.9} />
          ) : (
            <FileText size={22} strokeWidth={1.9} />
          )}
        </div>
        <div className="mt-5 space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-[12.5px] leading-7 text-[#55555d]">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
      <p className="mt-4 px-1 text-center text-[10px] leading-5 text-muted">
        {t("app.name")} — {t("app.tagline")}
      </p>
    </Sheet>
  );
}
