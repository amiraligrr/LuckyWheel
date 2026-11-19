import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import "@fontsource-variable/vazirmatn";
import "@fontsource-variable/inter";
import "./styles.css";
import { App } from "./App";

async function configureNativeShell() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Older Android versions may ignore edge-to-edge configuration.
  }
  try {
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    // The system bar is still usable with the theme defaults.
  }
  try {
    await StatusBar.setBackgroundColor({ color: "#F6F6F8" });
  } catch {
    // Android 15+ controls the bar colour through edge-to-edge.
  }
}

void configureNativeShell();

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestAnimationFrame(() => {
  window.setTimeout(() => {
    if (!Capacitor.isNativePlatform()) return;
    void SplashScreen.hide().catch(() => {});
  }, 320);
});
