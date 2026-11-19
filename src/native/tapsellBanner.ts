import { Capacitor, registerPlugin } from "@capacitor/core";

export type BannerStatus =
  | "unavailable"
  | "idle"
  | "loading"
  | "loaded"
  | "shown"
  | "hidden"
  | "failed"
  | "destroyed"
  | "unconfigured";

export interface BannerState {
  status: BannerStatus;
  /** Reserved height in CSS pixels, when the native side knows it. */
  height?: number;
  message?: string;
}

interface TapsellBannerPlugin {
  loadBanner(): Promise<BannerState>;
  show(): Promise<void>;
  hide(): Promise<void>;
  getState(): Promise<BannerState>;
  addListener(
    eventName: "stateChanged",
    listener: (state: BannerState) => void,
  ): Promise<{ remove(): Promise<void> }>;
}

/**
 * Native bridge placeholder for the future Tapsell plugin.
 *
 * No advertising SDK is installed yet. The component that uses this bridge
 * checks isTapsellBannerAvailable(), so an absent plugin remains a no-op and
 * cannot leave an empty advertisement slot in the layout.
 */
export const TapsellBanner = registerPlugin<TapsellBannerPlugin>("TapsellBanner");

export function isTapsellBannerAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("TapsellBanner");
}
