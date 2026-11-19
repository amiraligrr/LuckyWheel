import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "wheel.amiraligrr.app",
  appName: "چرخونه شانسی",
  webDir: "dist",
  android: {
    backgroundColor: "#F6F6F8",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: "#F6F6F8",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
  },
};

export default config;
