import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import type { Language, Wheel as WheelModel, WheelItem } from "../types";
import { PALETTE, readableInk } from "../lib/colors";
import { formatPercent, formatWeight } from "../lib/format";
import {
  computeSegments,
  isValidWeight,
  itemProbability,
  parseWeightInput,
  validateWheel,
} from "../lib/wheel";
import { createId } from "../lib/id";
import type { Translate } from "../lib/i18n";
import { itemsCountLabel } from "../lib/i18n";
import { IconButton } from "./ui/IconButton";
import { Sheet } from "./ui/Sheet";
import { ConfirmDialog } from "./ui/ConfirmDialog";

interface ItemsSheetProps {
  open: boolean;
  wheel: WheelModel;
  language: Language;
  t: Translate;
  onClose: () => void;
  onChange: (items: WheelItem[]) => void;
  notify: (message: string) => void;
  tap: () => void;
}

type EditorState = { mode: "new" } | { mode: "edit"; itemId: string } | null;

export function ItemsSheet({
  open,
  wheel,
  language,
  t,
  onClose,
  onChange,
  notify,
  tap,
}: ItemsSheetProps) {
  const [editor, setEditor] = useState<EditorState>(null);
  const [name, setName] = useState("");
  const [weightInput, setWeightInput] = useState("10");
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WheelItem | null>(null);

  useEffect(() => {
    if (!open) {
      setEditor(null);
      setError(null);
      setDeleteTarget(null);
    }
  }, [open]);

  useEffect(() => {
    setEditor(null);
    setError(null);
    setDeleteTarget(null);
  }, [wheel.id]);

  const segments = useMemo(() => computeSegments(wheel.items), [wheel.items]);
  const totalWeight = useMemo(
    () => wheel.items.reduce((sum, item) => sum + (isValidWeight(item.weight) ? item.weight : 0), 0),
    [wheel.items],
  );
  const validation = useMemo(() => validateWheel(wheel.items), [wheel.items]);
  const editingItem =
    editor?.mode === "edit" ? wheel.items.find((item) => item.id === editor.itemId) : null;
  const editingIndex =
    editor?.mode === "edit" ? wheel.items.findIndex((item) => item.id === editor.itemId) : -1;
  const parsedWeight = parseWeightInput(weightInput);
  const otherTotal = wheel.items
    .filter((item) => item.id !== (editor?.mode === "edit" ? editor.itemId : undefined))
    .reduce((sum, item) => sum + (isValidWeight(item.weight) ? item.weight : 0), 0);
  const previewTotal = otherTotal + (isValidWeight(parsedWeight) ? parsedWeight : 0);
  const preview =
    isValidWeight(parsedWeight) && previewTotal > 0
      ? formatPercent(itemProbability(parsedWeight, previewTotal), language)
      : null;

  const beginAdd = () => {
    tap();
    setEditor({ mode: "new" });
    setName("");
    setWeightInput("10");
    setColor(PALETTE[wheel.items.length % PALETTE.length]);
    setError(null);
  };

  const beginEdit = (item: WheelItem) => {
    tap();
    setEditor({ mode: "edit", itemId: item.id });
    setName(item.name);
    setWeightInput(String(item.weight));
    setColor(item.color);
    setError(null);
  };

  const leaveEditor = () => {
    setEditor(null);
    setError(null);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("items.nameRequired"));
      return;
    }
    if (trimmed.length > 32) {
      setError(t("items.nameTooLong"));
      return;
    }
    if (!isValidWeight(parsedWeight)) {
      setError(t("items.weightInvalid"));
      return;
    }

    tap();
    if (editor?.mode === "edit") {
      onChange(
        wheel.items.map((item) =>
          item.id === editor.itemId
            ? { ...item, name: trimmed, weight: parsedWeight, color }
            : item,
        ),
      );
      notify(t("items.saved"));
    } else {
      onChange([
        ...wheel.items,
        { id: createId("item"), name: trimmed, weight: parsedWeight, color },
      ]);
      notify(t("items.added"));
    }
    setEditor(null);
    setError(null);
  };

  const move = (direction: -1 | 1) => {
    if (editor?.mode !== "edit" || editingIndex < 0) return;
    const target = editingIndex + direction;
    if (target < 0 || target >= wheel.items.length) return;
    const next = [...wheel.items];
    [next[editingIndex], next[target]] = [next[target], next[editingIndex]];
    onChange(next);
    tap();
    notify(t("items.reordered"));
  };

  const requestDelete = (item: WheelItem) => {
    if (wheel.items.length <= 1) {
      notify(t("items.deleteLast"));
      return;
    }
    setDeleteTarget(item);
  };

  const confirmDelete = () => {
    const item = deleteTarget;
    if (!item) return;
    if (wheel.items.length <= 1) {
      notify(t("items.deleteLast"));
      return;
    }
    onChange(wheel.items.filter((candidate) => candidate.id !== item.id));
    if (editor?.mode === "edit" && editor.itemId === item.id) {
      setEditor(null);
    }
    tap();
    notify(t("items.deleted"));
  };

  const BackIcon = language === "fa" ? ArrowRight : ArrowLeft;
  const RowChevron = language === "fa" ? ChevronLeft : ChevronRight;

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={editor ? (editor.mode === "new" ? t("items.new") : t("items.edit")) : t("items.title")}
        subtitle={editor ? wheel.name : t("items.subtitle")}
        closeLabel={t("common.close")}
        headerAction={
          editor ? (
            <IconButton label={t("common.back")} onClick={leaveEditor} className="mt-0.5 h-9 w-9">
              <BackIcon size={17} strokeWidth={2.2} />
            </IconButton>
          ) : undefined
        }
        footer={
          editor ? (
            <button type="button" onClick={save} className="primary-btn min-h-[52px] rounded-[17px] text-[14px] font-bold">
              {t("common.save")}
            </button>
          ) : undefined
        }
      >
        {editor ? (
          <div className="pb-2">
            <div className="soft-card mt-1 flex items-center gap-3 rounded-[18px] p-3.5">
              <span
                className="h-10 w-10 shrink-0 rounded-full shadow-[0_6px_16px_-8px_rgba(20,20,40,0.45)]"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-muted">{t("items.probability")}</p>
                <p className="mt-0.5 text-[20px] font-bold leading-none">{preview ?? "—"}</p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-[12px] font-semibold text-muted">{t("items.nameLabel")}</span>
              <input
                value={name}
                maxLength={32}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    save();
                  }
                }}
                placeholder={t("items.namePlaceholder")}
                className="mt-1.5 h-12 w-full rounded-[14px] border border-[rgba(18,18,24,0.09)] bg-white/85 px-3.5 text-[15px] font-semibold text-ink outline-none transition focus:border-[rgba(18,18,24,0.26)] focus:bg-white"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-[12px] font-semibold text-muted">{t("items.weightLabel")}</span>
              <input
                value={weightInput}
                inputMode="decimal"
                dir="ltr"
                onChange={(event) => {
                  setWeightInput(event.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    save();
                  }
                }}
                className="mt-1.5 h-12 w-full rounded-[14px] border border-[rgba(18,18,24,0.09)] bg-white/85 px-3.5 text-[15px] font-semibold text-ink outline-none transition focus:border-[rgba(18,18,24,0.26)] focus:bg-white"
              />
              <span className="mt-1.5 block text-[10.5px] leading-5 text-muted">{t("items.weightHint")}</span>
            </label>

            {preview ? (
              <p className="mt-2 rounded-[12px] bg-white/60 px-3 py-2 text-[11px] font-medium leading-5 text-[#55555d]">
                {t("items.probabilityPreview", { percent: preview })}
              </p>
            ) : null}

            <div className="mt-5">
              <span className="text-[12px] font-semibold text-muted">{t("items.colorLabel")}</span>
              <div className="mt-2.5 grid grid-cols-6 gap-2.5">
                {PALETTE.map((swatch) => {
                  const selected = color === swatch;
                  return (
                    <button
                      key={swatch}
                      type="button"
                      aria-label={swatch}
                      aria-pressed={selected}
                      onClick={() => {
                        setColor(swatch);
                        tap();
                      }}
                      className={`relative aspect-square rounded-full border transition ${
                        selected
                          ? "scale-105 border-white shadow-[0_0_0_2px_rgba(17,17,20,0.75),0_6px_14px_-8px_rgba(17,17,20,0.4)]"
                          : "border-white/70"
                      }`}
                      style={{ backgroundColor: swatch }}
                    >
                      {selected ? (
                        <Check
                          size={14}
                          strokeWidth={3}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ color: readableInk(swatch) }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-[12px] bg-[#FEF3F2] px-3 py-2 text-[11.5px] font-semibold leading-5 text-[#B42318]">
                {error}
              </p>
            ) : null}

            {editor.mode === "edit" && editingItem ? (
              <div className="mt-6 rounded-[18px] border border-[var(--hairline)] bg-white/45 p-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => move(-1)}
                    disabled={editingIndex <= 0}
                    className="secondary-btn h-11 min-h-0 flex-1 gap-1.5 rounded-[13px] text-[11.5px] font-semibold disabled:opacity-35"
                  >
                    <ArrowUp size={14} />
                    {t("items.moveUp")}
                  </button>
                  <button
                    type="button"
                    onClick={() => move(1)}
                    disabled={editingIndex >= wheel.items.length - 1}
                    className="secondary-btn h-11 min-h-0 flex-1 gap-1.5 rounded-[13px] text-[11.5px] font-semibold disabled:opacity-35"
                  >
                    <ArrowDown size={14} />
                    {t("items.moveDown")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => requestDelete(editingItem)}
                  className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-[13px] text-[11.5px] font-semibold text-[#D92D20] transition active:bg-[#FEF3F2]"
                >
                  <Trash2 size={14} />
                  {t("common.delete")}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            <div className="soft-card rounded-[22px] p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-semibold text-muted">{t("items.total")}</span>
                <span className="text-[17px] font-bold tracking-[-0.02em]">
                  {formatWeight(totalWeight, language)}
                </span>
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-black/[0.05]">
                {segments.map((segment) => (
                  <span
                    key={segment.item.id}
                    className="h-full first:rounded-s-full last:rounded-e-full"
                    style={{
                      width: `${Math.max(segment.probability, 0)}%`,
                      backgroundColor: segment.item.color,
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-muted">
                <span>{t("items.distribution")}</span>
                <span>{itemsCountLabel(language, wheel.items.length)}</span>
              </div>
              {!validation.ok ? (
                <p className="mt-3 text-[10.5px] font-medium leading-5 text-[#B42318]">
                  {validation.issue === "weight"
                    ? t("items.validationWeight")
                    : validation.issue === "empty"
                      ? t("items.validationEmpty")
                      : validation.issue === "name"
                        ? t("items.validationName")
                        : t("items.validationTotal")}
                </p>
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              {wheel.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-[rgba(18,18,24,0.12)] bg-white/35 px-5 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-muted">
                    <Plus size={21} />
                  </span>
                  <p className="mt-3 text-[13px] font-semibold">{t("items.empty")}</p>
                  <p className="mt-1 text-[11px] text-muted">{t("items.emptyHint")}</p>
                </div>
              ) : (
                wheel.items.map((item, index) => {
                  const probability = segments[index]?.probability ?? 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => beginEdit(item)}
                      className="soft-card flex w-full items-center gap-3 rounded-[18px] p-3 text-start pressable"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold leading-5">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] font-medium text-muted">
                          {t("items.weightValue", {
                            weight: formatWeight(item.weight, language),
                          })}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-black/[0.045] px-2.5 py-1 text-[10.5px] font-bold">
                        {formatPercent(probability, language)}
                      </span>
                      <RowChevron size={14} className="shrink-0 text-[#b0b0b8]" />
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={beginAdd}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[rgba(18,18,24,0.16)] bg-white/35 text-[12.5px] font-semibold text-[#55555d] transition active:scale-[0.99] active:bg-white/70"
            >
              <Plus size={16} strokeWidth={2.2} />
              {t("items.add")}
            </button>
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("items.deleteTitle")}
        message={
          deleteTarget
            ? t("items.deleteMessage", { name: deleteTarget.name })
            : ""
        }
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
