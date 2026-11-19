import { useMemo } from "react";
import { History as HistoryIcon, Trash2, Trophy } from "lucide-react";
import type { HistoryEntry, Language } from "../types";
import type { Translate } from "../lib/i18n";
import { dayKey, formatDay, formatTime, isToday, isYesterday } from "../lib/format";
import { withAlpha } from "../lib/colors";
import { IconButton } from "./ui/IconButton";
import { Sheet } from "./ui/Sheet";

interface HistorySheetProps {
  open: boolean;
  history: HistoryEntry[];
  language: Language;
  t: Translate;
  onClose: () => void;
  onClear: () => void;
}

interface DayGroup {
  key: string;
  label: string;
  entries: HistoryEntry[];
}

export function HistorySheet({
  open,
  history,
  language,
  t,
  onClose,
  onClear,
}: HistorySheetProps) {
  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of history) {
      const key = dayKey(entry.timestamp);
      const bucket = map.get(key);
      if (bucket) bucket.push(entry);
      else map.set(key, [entry]);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b[0].timestamp - a[0].timestamp)
      .map(([key, entries]) => {
        const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
        const timestamp = sorted[0].timestamp;
        const label = isToday(timestamp)
          ? t("history.today")
          : isYesterday(timestamp)
            ? t("history.yesterday")
            : formatDay(timestamp, language);
        return { key, label, entries: sorted };
      });
  }, [history, language, t]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("history.title")}
      subtitle={t("history.subtitle")}
      closeLabel={t("common.close")}
      headerAction={
        <IconButton
          label={t("history.clear")}
          onClick={onClear}
          disabled={history.length === 0}
          className="mt-0.5 h-9 w-9"
        >
          <Trash2 size={16} strokeWidth={2} />
        </IconButton>
      }
    >
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-[rgba(18,18,24,0.12)] bg-white/35 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#8a8a92] shadow-[0_12px_28px_-18px_rgba(20,20,40,0.35)]">
            <HistoryIcon size={24} strokeWidth={1.8} />
          </span>
          <p className="mt-4 text-[13.5px] font-semibold">{t("history.empty")}</p>
          <p className="mt-1 max-w-[220px] text-[11px] leading-5 text-muted">
            {t("history.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key}>
              <h3 className="mb-2 px-1 text-[10.5px] font-bold text-[#77777f]">{group.label}</h3>
              <div className="space-y-2">
                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="soft-card flex items-center gap-3 rounded-[18px] p-3"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: withAlpha(entry.color, 0.16) }}
                    >
                      <Trophy size={15} strokeWidth={1.9} style={{ color: entry.color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold leading-5">{entry.itemName}</p>
                      <p className="mt-0.5 truncate text-[10.5px] font-medium text-muted">
                        {entry.wheelName}
                      </p>
                    </div>
                    <time
                      className="shrink-0 text-[10px] font-medium tabular-nums text-muted"
                      dateTime={new Date(entry.timestamp).toISOString()}
                      dir="ltr"
                    >
                      {formatTime(entry.timestamp, language)}
                    </time>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Sheet>
  );
}
