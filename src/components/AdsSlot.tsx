import { useEffect } from "react";
import { isTapsellBannerAvailable, TapsellBanner } from "../native/tapsellBanner";

interface AdsSlotProps {
  visible: boolean;
}

/**
 * The native Tapsell banner owns its Android view and bottom bar. This
 * component only requests one load and toggles show/hide. It renders nothing
 * itself: there is no fake ad, no web placeholder and no empty layout gap.
 */
export function AdsSlot({ visible }: AdsSlotProps) {
  const available = isTapsellBannerAvailable();

  useEffect(() => {
    if (!available) return;
    void TapsellBanner.loadBanner().catch(() => {});
  }, [available]);

  useEffect(() => {
    if (!available) return;
    let disposed = false;
    let handle: { remove(): Promise<void> } | undefined;
    TapsellBanner.addListener("stateChanged", () => {})
      .then((listener) => {
        if (disposed) void listener.remove();
        else handle = listener;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      if (handle) void handle.remove();
    };
  }, [available]);

  useEffect(() => {
    if (!available) return;
    const action = visible ? TapsellBanner.show() : TapsellBanner.hide();
    void action.catch(() => {});
  }, [available, visible]);

  return null;
}
