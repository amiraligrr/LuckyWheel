import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import {
  ChevronDown,
  CircleDot,
  History as HistoryIcon,
  ListChecks,
  Loader2,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { AppData, HistoryEntry, Language, Result, Wheel as WheelModel, WheelItem } from "./types";
import type { WheelIssue } from "./lib/wheel";
import { buildSpinPlan, itemProbability, validateWheel } from "./lib/wheel";
import { createT, itemsCountLabel, type Translate } from "./lib/i18n";
import { HISTORY_LIMIT, loadData, saveData } from "./lib/storage";
import {
  createBlankWheel,
  createInitialData,
  wheelFromPreset,
  type PresetDefinition,
} from "./lib/presets";
import { createId } from "./lib/id";
import { Wheel, type WheelHandle } from "./components/Wheel";
import { ResultModal } from "./components/ResultModal";
import { ItemsSheet } from "./components/ItemsSheet";
import { WheelsSheet } from "./components/WheelsSheet";
import { HistorySheet } from "./components/HistorySheet";
import { SettingsSheet } from "./components/SettingsSheet";
import { InfoSheet } from "./components/InfoSheet";
import { Attribution } from "./components/Attribution";
import { AdsSlot } from "./components/AdsSlot";
import { IconButton } from "./components/ui/IconButton";
import { PromptDialog } from "./components/ui/PromptDialog";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { Toast } from "./components/ui/Toast";

type Overlay = "items" | "wheels" | "history" | "settings" | "privacy" | "terms" | null;

type WheelPromptState =
  | { mode: "create" }
  | { mode: "rename"; wheelId: string; initialValue: string };

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

function validationMessage(t: Translate, issue?: WheelIssue): string {
  switch (issue) {
    case "empty":
      return t("items.validationEmpty");
    case "name":
      return t("items.validationName");
    case "weight":
      return t("items.validationWeight");
    case "color":
      return t("items.validationColor");
    case "total":
      return t("items.validationTotal");
    default:
      return t("common.error");
  }
}

function uniqueWheelName(base: string, wheels: WheelModel[]): string {
  let candidate = base;
  let index = 2;
  while (wheels.some((wheel) => wheel.name === candidate)) {
    candidate = `${base} ${index}`;
    index += 1;
  }
  return candidate;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const language = data.settings.language;
  const t = useMemo(() => createT(language), [language]);
  const activeWheel = data.wheels.find((wheel) => wheel.id === data.activeWheelId) ?? data.wheels[0];

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [wheelPrompt, setWheelPrompt] = useState<WheelPromptState | null>(null);

  const wheelRef = useRef<WheelHandle>(null);
  const toastCounter = useRef(0);

  const notify = useCallback((text: string) => {
    toastCounter.current += 1;
    setToast({ id: toastCounter.current, text });
  }, []);

  const tap = useCallback(() => {
    if (!Capacitor.isNativePlatform()) return;
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }, []);

  const celebrate = useCallback(() => {
    if (!Capacitor.isNativePlatform()) return;
    void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    document.title = t("app.name");
  }, [language, t]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const backState = useRef({ overlay, result, spinning, prompt: wheelPrompt, confirm: confirmState });
  backState.current = { overlay, result, spinning, prompt: wheelPrompt, confirm: confirmState };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove(): Promise<void> } | undefined;
    CapacitorApp.addListener("backButton", () => {
      const current = backState.current;
      if (current.spinning) return;
      if (current.prompt) {
        setWheelPrompt(null);
        return;
      }
      if (current.confirm) {
        setConfirmState(null);
        return;
      }
      if (current.overlay === "privacy" || current.overlay === "terms") {
        setOverlay("settings");
        return;
      }
      if (current.overlay) {
        setOverlay(null);
        return;
      }
      if (current.result) {
        setResult(null);
        return;
      }
      void CapacitorApp.minimizeApp().catch(() => {});
    })
      .then((listener) => {
        handle = listener;
      })
      .catch(() => {});
    return () => {
      if (handle) void handle.remove();
    };
  }, []);

  const updateItems = useCallback(
    (items: WheelItem[]) => {
      if (!activeWheel) return;
      setData((previous) => ({
        ...previous,
        wheels: previous.wheels.map((wheel) =>
          wheel.id === activeWheel.id ? { ...wheel, items, updatedAt: Date.now() } : wheel,
        ),
      }));
    },
    [activeWheel],
  );

  const performSpin = useCallback(async () => {
    if (spinning || !activeWheel) return;
    if (activeWheel.items.length === 0) {
      setOverlay("items");
      return;
    }
    const validation = validateWheel(activeWheel.items);
    if (!validation.ok) {
      notify(validationMessage(t, validation.issue));
      return;
    }

    setResult(null);
    setSpinning(true);
    tap();

    try {
      const prefersReduced =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const plan = buildSpinPlan(activeWheel.items, wheelRef.current?.rotation() ?? 0, {
        reducedMotion: prefersReduced,
      });
      await wheelRef.current?.spin(plan);
      await delay(430);

      const winner = activeWheel.items[plan.index];
      const timestamp = Date.now();
      const nextResult: Result = {
        wheelName: activeWheel.name,
        item: winner,
        probability: itemProbability(winner.weight, validation.totalWeight),
        timestamp,
      };
      const entry: HistoryEntry = {
        id: createId("history"),
        wheelId: activeWheel.id,
        wheelName: activeWheel.name,
        itemName: winner.name,
        color: winner.color,
        timestamp,
      };

      setResult(nextResult);
      setData((previous) => ({
        ...previous,
        history: [entry, ...previous.history].slice(0, HISTORY_LIMIT),
      }));
      celebrate();
    } catch {
      notify(t("common.error"));
    } finally {
      setSpinning(false);
    }
  }, [activeWheel, celebrate, notify, spinning, t, tap]);

  const handleSpinAgain = useCallback(() => {
    setResult(null);
    window.setTimeout(() => {
      void performSpin();
    }, 240);
  }, [performSpin]);

  const selectWheel = useCallback(
    (wheel: WheelModel) => {
      if (spinning) return;
      tap();
      setOverlay(null);
      setData((previous) => ({ ...previous, activeWheelId: wheel.id }));
      wheelRef.current?.reset();
      notify(t("wheels.switched"));
    },
    [notify, spinning, t, tap],
  );

  const submitWheelPrompt = useCallback(
    (value: string) => {
      if (!wheelPrompt) return;
      const name = value.trim();
      if (!name) {
        notify(t("wheels.nameRequired"));
        return;
      }
      tap();
      if (wheelPrompt.mode === "create") {
        const wheel = createBlankWheel(uniqueWheelName(name, data.wheels), language);
        setData((previous) => ({
          ...previous,
          wheels: [...previous.wheels, wheel],
          activeWheelId: wheel.id,
        }));
        setOverlay(null);
        wheelRef.current?.reset();
        notify(t("wheels.created"));
      } else {
        setData((previous) => ({
          ...previous,
          wheels: previous.wheels.map((wheel) =>
            wheel.id === wheelPrompt.wheelId
              ? { ...wheel, name, updatedAt: Date.now() }
              : wheel,
          ),
        }));
        notify(t("wheels.renamed"));
      }
      setWheelPrompt(null);
    },
    [data.wheels, language, notify, t, tap, wheelPrompt],
  );

  const duplicateWheel = useCallback(
    (wheel: WheelModel) => {
      tap();
      const now = Date.now();
      const copy: WheelModel = {
        id: createId("wheel"),
        name: uniqueWheelName(`${wheel.name} ${t("wheels.copySuffix")}`, data.wheels),
        items: wheel.items.map((item) => ({ ...item, id: createId("item") })),
        createdAt: now,
        updatedAt: now,
      };
      setData((previous) => ({ ...previous, wheels: [...previous.wheels, copy] }));
      notify(t("wheels.duplicated"));
    },
    [data.wheels, notify, t, tap],
  );

  const requestDeleteWheel = useCallback(
    (wheel: WheelModel) => {
      if (data.wheels.length <= 1) {
        notify(t("wheels.deleteLast"));
        return;
      }
      setConfirmState({
        title: t("wheels.deleteTitle"),
        message: t("wheels.deleteMessage", { name: wheel.name }),
        confirmLabel: t("common.delete"),
        destructive: true,
        onConfirm: () => {
          tap();
          setData((previous) => {
            const wheels = previous.wheels.filter((candidate) => candidate.id !== wheel.id);
            const activeWheelId =
              previous.activeWheelId === wheel.id ? wheels[0].id : previous.activeWheelId;
            return { ...previous, wheels, activeWheelId };
          });
          if (activeWheel?.id === wheel.id) wheelRef.current?.reset();
          notify(t("wheels.deleted"));
        },
      });
    },
    [activeWheel, data.wheels.length, notify, t, tap],
  );

  const addPreset = useCallback(
    (preset: PresetDefinition) => {
      tap();
      const base = wheelFromPreset(preset, language);
      setData((previous) => {
        const wheel = { ...base, name: uniqueWheelName(base.name, previous.wheels) };
        return {
          ...previous,
          wheels: [...previous.wheels, wheel],
          activeWheelId: wheel.id,
        };
      });
      setOverlay(null);
      wheelRef.current?.reset();
      notify(t("wheels.created"));
    },
    [language, notify, t, tap],
  );

  const requestClearHistory = useCallback(() => {
    if (data.history.length === 0) return;
    setConfirmState({
      title: t("history.clearTitle"),
      message: t("history.clearMessage", { count: data.history.length }),
      confirmLabel: t("common.delete"),
      destructive: true,
      onConfirm: () => {
        tap();
        setData((previous) => ({ ...previous, history: [] }));
        notify(t("history.cleared"));
      },
    });
  }, [data.history.length, notify, t, tap]);

  const changeLanguage = useCallback(
    (next: Language) => {
      if (next === language) return;
      tap();
      setData((previous) => ({
        ...previous,
        settings: { ...previous.settings, language: next },
      }));
    },
    [language, tap],
  );

  if (!activeWheel) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <img src="/logo.png" alt="" className="h-16 w-16 rounded-[20px] object-cover" />
        <p className="text-[15px] font-semibold">{t("app.name")}</p>
        <button
          type="button"
          className="primary-btn max-w-[240px]"
          onClick={() => setData(createInitialData())}
        >
          {t("common.confirm")}
        </button>
      </div>
    );
  }

  const wheelCountLabel =
    activeWheel.items.length === 0
      ? t("home.emptyWheelHint")
      : itemsCountLabel(language, activeWheel.items.length);

  return (
    <>
      <div className="app-bg" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <header className="flex items-center gap-3 pt-[calc(env(safe-area-inset-top)+16px)]">
          <img
            src="/logo.png"
            alt=""
            className="h-11 w-11 shrink-0 rounded-[14px] object-cover shadow-[0_10px_24px_-14px_rgba(20,20,40,0.5)]"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-extrabold tracking-[-0.02em] text-ink">
              {t("app.name")}
            </h1>
            <p className="mt-0.5 truncate text-[10.5px] font-medium text-muted">
              {t("app.tagline")}
            </p>
          </div>
          <IconButton
            label={t("header.settings")}
            onClick={() => setOverlay("settings")}
            disabled={spinning}
          >
            <SlidersHorizontal size={17} strokeWidth={2.1} />
          </IconButton>
        </header>

        <main className="flex flex-1 flex-col" aria-busy={spinning}>
          <button
            type="button"
            onClick={() => setOverlay("wheels")}
            disabled={spinning}
            className="soft-card mx-auto mt-4 flex h-10 max-w-full items-center gap-2 rounded-full px-4 text-[11.5px] font-semibold text-ink transition active:scale-[0.99] disabled:opacity-50"
            aria-label={t("home.selectWheel")}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-ink/70" />
            <span className="max-w-[140px] truncate">{activeWheel.name}</span>
            <span className="text-[#b0b0b8]">·</span>
            <span className="shrink-0 font-medium text-muted">
              {itemsCountLabel(language, activeWheel.items.length)}
            </span>
            <ChevronDown size={13} strokeWidth={2.2} className="shrink-0 text-muted" />
          </button>

          <div className="mx-auto mt-3 w-full max-w-[360px]">
            <Wheel
              ref={wheelRef}
              items={activeWheel.items}
              spinning={spinning}
              disabled={spinning}
              spinLabel={t("home.spinAria")}
              hubLabel={t("home.spin")}
              countLabel={wheelCountLabel}
              onSpin={() => void performSpin()}
              onAddOption={() => setOverlay("items")}
            />
          </div>

          <p className="mt-1 text-center text-[10px] font-medium leading-5 text-muted">
            {t("home.probabilityHint")}
          </p>

          <button
            type="button"
            onClick={() => {
              if (activeWheel.items.length === 0) {
                tap();
                setOverlay("items");
                return;
              }
              void performSpin();
            }}
            disabled={spinning}
            className="primary-btn mt-4 text-[15px] font-bold tracking-[-0.01em]"
          >
            {spinning ? (
              <Loader2 size={18} strokeWidth={2.2} className="animate-spin" />
            ) : activeWheel.items.length === 0 ? (
              <Plus size={18} strokeWidth={2.2} />
            ) : (
              <Sparkles size={18} strokeWidth={2.2} />
            )}
            {spinning
              ? t("home.spinning")
              : activeWheel.items.length === 0
                ? t("home.addOption")
                : t("home.spin")}
          </button>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOverlay("items")}
              disabled={spinning}
              className="soft-card pressable flex h-[58px] flex-col items-center justify-center gap-1 rounded-[17px] text-[10.5px] font-semibold text-[#55555d] disabled:opacity-40"
            >
              <ListChecks size={16} strokeWidth={2.1} />
              {t("home.options")}
            </button>
            <button
              type="button"
              onClick={() => setOverlay("wheels")}
              disabled={spinning}
              className="soft-card pressable flex h-[58px] flex-col items-center justify-center gap-1 rounded-[17px] text-[10.5px] font-semibold text-[#55555d] disabled:opacity-40"
            >
              <CircleDot size={16} strokeWidth={2.1} />
              {t("home.wheels")}
            </button>
            <button
              type="button"
              onClick={() => setOverlay("history")}
              disabled={spinning}
              className="soft-card pressable flex h-[58px] flex-col items-center justify-center gap-1 rounded-[17px] text-[10.5px] font-semibold text-[#55555d] disabled:opacity-40"
            >
              <HistoryIcon size={16} strokeWidth={2.1} />
              {t("home.history")}
            </button>
          </div>

          <div className="mt-auto">
            <Attribution t={t} />
          </div>
        </main>

        <AdsSlot visible={overlay === null && result === null} />
      </div>

      <ResultModal
        result={result}
        language={language}
        t={t}
        onClose={() => setResult(null)}
        onSpinAgain={handleSpinAgain}
      />

      <ItemsSheet
        open={overlay === "items"}
        wheel={activeWheel}
        language={language}
        t={t}
        onClose={() => setOverlay(null)}
        onChange={updateItems}
        notify={notify}
        tap={tap}
      />

      <WheelsSheet
        open={overlay === "wheels"}
        wheels={data.wheels}
        activeWheelId={data.activeWheelId}
        language={language}
        t={t}
        onClose={() => setOverlay(null)}
        onSwitch={selectWheel}
        onCreate={() => setWheelPrompt({ mode: "create" })}
        onRename={(wheel) =>
          setWheelPrompt({ mode: "rename", wheelId: wheel.id, initialValue: wheel.name })
        }
        onDuplicate={duplicateWheel}
        onDelete={requestDeleteWheel}
        onAddPreset={addPreset}
      />

      <HistorySheet
        open={overlay === "history"}
        history={data.history}
        language={language}
        t={t}
        onClose={() => setOverlay(null)}
        onClear={requestClearHistory}
      />

      <SettingsSheet
        open={overlay === "settings"}
        language={language}
        historyCount={data.history.length}
        t={t}
        onClose={() => setOverlay(null)}
        onLanguageChange={changeLanguage}
        onClearHistory={requestClearHistory}
        onOpenPrivacy={() => setOverlay("privacy")}
        onOpenTerms={() => setOverlay("terms")}
      />

      <InfoSheet
        open={overlay === "privacy"}
        kind="privacy"
        language={language}
        t={t}
        onClose={() => setOverlay(null)}
        onBack={() => setOverlay("settings")}
      />
      <InfoSheet
        open={overlay === "terms"}
        kind="terms"
        language={language}
        t={t}
        onClose={() => setOverlay(null)}
        onBack={() => setOverlay("settings")}
      />

      <PromptDialog
        open={wheelPrompt !== null}
        title={wheelPrompt?.mode === "rename" ? t("wheels.renameTitle") : t("wheels.newTitle")}
        label={t("wheels.nameLabel")}
        placeholder={t("wheels.namePlaceholder")}
        initialValue={wheelPrompt?.mode === "rename" ? wheelPrompt.initialValue : ""}
        confirmLabel={
          wheelPrompt?.mode === "rename" ? t("wheels.rename") : t("wheels.create")
        }
        cancelLabel={t("common.cancel")}
        maxLength={32}
        onClose={() => setWheelPrompt(null)}
        onConfirm={submitWheelPrompt}
        validate={(value) => {
          if (!value.trim()) return t("wheels.nameRequired");
          if (value.trim().length > 32) return t("wheels.nameTooLong");
          return null;
        }}
      />

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ""}
        message={confirmState?.message ?? ""}
        confirmLabel={confirmState?.confirmLabel ?? t("common.confirm")}
        cancelLabel={t("common.cancel")}
        destructive={confirmState?.destructive}
        onConfirm={() => confirmState?.onConfirm()}
        onClose={() => setConfirmState(null)}
      />

      <Toast toast={toast} />
    </>
  );
}
