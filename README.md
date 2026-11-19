# چرخونه شانسی — Lucky Wheel

<p align="center">
  <img src="assets/logo.png" width="160" alt="Lucky Wheel app icon" />
</p>

<p align="center">
  A beautiful, lightweight Android random wheel with weighted probabilities.
</p>

<p align="center">
  <a href="https://github.com/amiraligrr">GitHub</a>
</p>

---

## فارسی

**چرخونه شانسی** یک اپلیکیشن اندروید سبک و مینیمال برای قرعه‌کشی، انتخاب تصادفی و تصمیم‌گیری است. هر گزینه می‌تواند وزن دلخواه داشته باشد و شانس آن به‌صورت خودکار محاسبه می‌شود. اندازه‌ی هر قطعه روی چرخ دقیقاً با وزن آن متناسب است؛ بنابراین نتیجه‌ی انیمیشن همیشه با نتیجه‌ی واقعی یکی است.

تمام داده‌ها روی همین دستگاه ذخیره می‌شوند. هیچ حساب کاربری، سرور یا پایگاه داده‌ی ابری وجود ندارد. تبلیغات فقط به‌صورت بنر Tapsell و در نوار پایین صفحه‌ی اصلی نمایش داده می‌شوند.

---

## Features

- Weighted random wheel with decimal weights
- Segment angles proportional to item weights
- Single weighted random draw per spin, then an exact animation landing
- Multiple independent wheels
- Create, rename, duplicate and delete wheels
- Six editable presets (raffle, names, food, decisions, prizes, party challenges)
- Add, edit, delete and reorder wheel items
- Per-item color, weight and live probability
- Result modal with the selected item and its probability
- Persistent local history with date and time
- Persian (RTL) and English (LTR) interfaces
- Local-only storage; no login or backend
- Native Tapsell banner integration, home screen only
- Graceful behavior when ads are unavailable or offline

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion + Web Animations API |
| Icons | Lucide React |
| Mobile shell | Capacitor 8.6.2 |
| Android | Java/Kotlin bridge, Gradle 8.14.3, AGP 8.13.0 |
| Android SDK | minSdk 24, compileSdk/targetSdk 36 |
| Ads | Tapsell Mediation + legacy adapter |
| Tests | Vitest |
| Persistence | `localStorage` |

---

## Project Structure

```text
.
├── src/
│   ├── components/          # Wheel, result modal, sheets and UI
│   ├── lib/                 # Wheel math, probability, storage, i18n, presets
│   ├── native/              # Capacitor Tapsell bridge declaration
│   ├── App.tsx              # Application shell and state
│   ├── main.tsx             # Entry point
│   └── styles.css           # Design system
├── assets/                  # Source app icon for Android asset generation
├── public/                  # Shared web icons
├── android/                 # Capacitor Android project
│   └── app/src/main/java/
│       └── wheel/amiraligrr/app/TapsellBannerPlugin.java
├── index.html
├── capacitor.config.ts
├── package.json
└── vite.config.ts
```

---

## Requirements

- Node.js 20+
- npm 10+
- JDK **21** (required by Capacitor 8)
- Android SDK with API 36 and build-tools 36
- Gradle 8.14.3 (or use the Android wrapper)

---

## Getting Started

```bash
npm install
npm run dev
```

Open the Vite URL in a browser. The web version intentionally does not render advertisements; the native Tapsell banner is only available in the Android build.

---

## Build the Web App

```bash
npm run typecheck
npm test
npm run build
```

The web output is written to `dist/`.

---

## Build Android

Capacitor needs the web build first:

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

Set `JAVA_HOME` to a full JDK 21:

```bash
export JAVA_HOME=/path/to/jdk-21
export PATH="$JAVA_HOME/bin:$PATH"
```

The debug APK will be at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Tapsell Configuration

Tapsell credentials are **not committed** to this repository.

Create `android/local.properties` locally (it is ignored by Git):

```properties
sdk.dir=/path/to/Android/Sdk
TAPSELL_MEDIATION_APP_ID=YOUR_MEDIATION_APP_ID
TAPSELL_BANNER_ZONE_ID=YOUR_BANNER_ZONE_ID
```

A template is available at `android/local.properties.example`.

`android/app/build.gradle` reads these values and injects:

- the Tapsell App ID through the `TapsellMediationAppKey` manifest placeholder;
- the banner zone through `BuildConfig.TAPSELL_BANNER_ZONE_ID`.

The banner is implemented by `TapsellBannerPlugin.java`:

- one request per app session;
- no automatic retry after failure;
- native `BannerContainer` rendered below the WebView;
- hidden on sheets and result screens;
- the banner is destroyed with the activity;
- unfilled/failed requests leave no blank reserved strip.

Current dependency versions:

```groovy
implementation "ir.tapsell:tapsell:1.4.0-alpha04"
implementation "ir.tapsell.mediation.adapter:legacy:1.4.0-alpha04"
```

The current project uses the 1.4.0 alpha line because the configured Tapsell credential uses the secret-key format supported by that line. A stable migration to `1.3.0` requires a UUID-based Mediation App ID from the Tapsell dashboard.

Never commit real Tapsell credentials, keystores or signing passwords.

---

## Release Signing

The release key is not part of this repository. Create `android/keystore.properties` locally:

```properties
storeFile=keystore/your-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=YOUR_KEY_ALIAS
keyPassword=YOUR_KEY_PASSWORD
```

A template is available at `android/keystore.properties.example`.

Keep the keystore and its properties file outside Git and back them up securely. The release build is configured with R8/minification:

```bash
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

Outputs:

```text
android/app/build/outputs/apk/release/app-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

Signed APKs/AABs are build artifacts and are not committed because they contain client-side SDK identifiers.

---

## Tests

```bash
npm test
npm run typecheck
```

The test suite covers:

- weighted segment geometry;
- weighted random selection;
- decimal weights;
- exact animation landing angles;
- one-item wheels;
- Persian/Arabic number parsing;
- validation;
- local storage sanitization and persistence.

---

## Local Data and Privacy

- All wheels, items, history and settings are stored in `localStorage` under `lucky-wheel.data.v1`.
- No account, login, server or cloud database is used.
- No analytics or user-tracking backend is implemented.
- History can be cleared from Settings.
- Uninstalling the app removes local data.
- Tapsell may receive the device advertising identifier and technical information required to serve a banner ad, subject to Tapsell's privacy policy.
- The app's Privacy and Terms text is available in-app under Settings.

Android permissions are limited to app/ads functionality:

- `INTERNET`
- `com.google.android.gms.permission.AD_ID`
- network/state permissions required by Tapsell/WorkManager
- `VIBRATE` for optional haptic feedback

No location, camera, microphone or storage permission is requested.

---

## Design

- Light theme only
- Off-white translucent surfaces, soft shadows and large radii
- Vazirmatn for Persian and Inter for Latin text
- Responsive layout with safe-area support
- Native bottom barrier for the Tapsell banner, separate from the WebView content
- Expensive full-screen blurs and SVG drop shadows avoided for mobile performance

---

## Status / Limitations

- Version: `1.0.0` (`versionCode 1`)
- Package: `wheel.amiraligrr.app`
- Tapsell banner integration has been tested on a physical Android 13 device.
- The current ad SDK is `1.4.0-alpha04` because of the configured secret-key credential format.
- A stable migration to `1.3.0` requires a UUID Mediation App ID and a new verification pass.
- A public Privacy Policy URL and store screenshots are publication prerequisites and are not included in this repository.
- Release APK/AAB outputs are intentionally not committed.

---

## Credits

Made by **Amiraligrr**.

made by Amiraligrr , for everyone , everywhere.

GitHub: <https://github.com/amiraligrr>

---

## License

No license is granted by this repository. All rights are reserved by the author unless a separate license is added.
