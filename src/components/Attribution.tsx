import type { Translate } from "../lib/i18n";
import { GithubMark } from "./ui/GithubMark";

interface AttributionProps {
  t: Translate;
}

export function Attribution({ t }: AttributionProps) {
  return (
    <footer className="flex justify-center px-2 pb-1 pt-5">
      <a
        href="https://github.com/amiraligrr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("footer.github")}
        className="inline-flex max-w-full items-start justify-center gap-1.5 text-center text-[10px] font-medium leading-4 text-[#8a8a92] transition-colors duration-200 hover:text-ink active:text-ink"
        dir="ltr"
      >
        <GithubMark size={12} className="mt-[2px] shrink-0" />
        <span className="min-w-0 leading-4">{t("footer.madeBy")}</span>
      </a>
    </footer>
  );
}
