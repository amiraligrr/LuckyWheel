import type { ReactNode } from "react";
import {
  Copy,
  Gift,
  Pencil,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";
import type { Language, Wheel as WheelModel } from "../types";
import type { Translate } from "../lib/i18n";
import { itemsCountLabel } from "../lib/i18n";
import { formatWeight } from "../lib/format";
import { PRESETS, type PresetDefinition, type PresetIcon } from "../lib/presets";
import { isValidWeight } from "../lib/wheel";
import { Sheet } from "./ui/Sheet";

interface WheelsSheetProps {
  open: boolean;
  wheels: WheelModel[];
  activeWheelId: string;
  language: Language;
  t: Translate;
  onClose: () => void;
  onSwitch: (wheel: WheelModel) => void;
  onCreate: () => void;
  onRename: (wheel: WheelModel) => void;
  onDuplicate: (wheel: WheelModel) => void;
  onDelete: (wheel: WheelModel) => void;
  onAddPreset: (preset: PresetDefinition) => void;
}

const PRESET_ICONS: Record<PresetIcon, ReactNode> = {
  trophy: <Trophy size={17} strokeWidth={2} />,
  users: <Users size={17} strokeWidth={2} />,
  utensils: <Utensils size={17} strokeWidth={2} />,
  scale: <Scale size={17} strokeWidth={2} />,
  gift: <Gift size={17} strokeWidth={2} />,
  sparkles: <Sparkles size={17} strokeWidth={2} />,
};

function MiniAction({
  label,
  onClick,
  children,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90 ${
        danger ? "text-[#b6473f] active:bg-[#FEF3F2]" : "text-[#77777f] active:bg-black/[0.05]"
      }`}
    >
      {children}
    </button>
  );
}

export function WheelsSheet({
  open,
  wheels,
  activeWheelId,
  language,
  t,
  onClose,
  onSwitch,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
  onAddPreset,
}: WheelsSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("wheels.title")}
      subtitle={t("wheels.subtitle")}
      closeLabel={t("common.close")}
    >
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[12px] font-bold text-[#55555d]">{t("wheels.presets")}</h3>
          <span className="text-[10px] font-medium text-muted">{t("wheels.presetsHint")}</span>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onAddPreset(preset)}
              className="flex min-h-[68px] items-center gap-2.5 rounded-[17px] border border-white/70 p-3 text-start transition active:scale-[0.98]"
              style={{ backgroundColor: preset.tint }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-white/75 text-[#4b4b53]">
                {PRESET_ICONS[preset.icon]}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-bold leading-5 text-ink">
                  {t(preset.nameKey)}
                </span>
                <span className="mt-0.5 block truncate text-[9.5px] font-medium leading-4 text-[#77777f]">
                  {t(preset.descriptionKey)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[12px] font-bold text-[#55555d]">{t("wheels.myWheels")}</h3>
          <span className="text-[10px] font-medium text-muted">{wheels.length}</span>
        </div>

        <div className="mt-2.5 space-y-2">
          {wheels.map((wheel) => {
            const active = wheel.id === activeWheelId;
            const totalWeight = wheel.items.reduce(
              (sum, item) => sum + (isValidWeight(item.weight) ? item.weight : 0),
              0,
            );
            return (
              <div
                key={wheel.id}
                className={`soft-card rounded-[19px] p-3 transition ${
                  active ? "ring-1 ring-[rgba(17,17,20,0.13)]" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => onSwitch(wheel)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-bold leading-5 text-ink">
                        {wheel.name}
                      </span>
                      {active ? (
                        <span className="shrink-0 rounded-full bg-ink px-1.5 py-0.5 text-[8px] font-bold leading-3 text-white">
                          {t("wheels.active")}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-muted">
                      <span>{itemsCountLabel(language, wheel.items.length)}</span>
                      <span className="opacity-40">·</span>
                      <span>
                        {t("home.totalWeight")} {formatWeight(totalWeight, language)}
                      </span>
                    </span>
                    <span className="mt-2 flex h-1.5 items-center gap-1">
                      {wheel.items.slice(0, 8).map((item) => (
                        <span
                          key={item.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      ))}
                      {wheel.items.length === 0 ? (
                        <span className="h-1.5 w-6 rounded-full bg-black/[0.05]" />
                      ) : null}
                    </span>
                  </button>

                  <div className="-me-1 flex shrink-0 items-center gap-0.5">
                    <MiniAction label={t("wheels.rename")} onClick={() => onRename(wheel)}>
                      <Pencil size={13.5} strokeWidth={2} />
                    </MiniAction>
                    <MiniAction label={t("wheels.duplicate")} onClick={() => onDuplicate(wheel)}>
                      <Copy size={13.5} strokeWidth={2} />
                    </MiniAction>
                    <MiniAction label={t("wheels.delete")} danger onClick={() => onDelete(wheel)}>
                      <Trash2 size={13.5} strokeWidth={2} />
                    </MiniAction>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[rgba(18,18,24,0.16)] bg-white/35 text-[12.5px] font-semibold text-[#55555d] transition active:scale-[0.99] active:bg-white/70"
        >
          <Plus size={16} strokeWidth={2.2} />
          {t("wheels.new")}
        </button>
      </section>
    </Sheet>
  );
}
