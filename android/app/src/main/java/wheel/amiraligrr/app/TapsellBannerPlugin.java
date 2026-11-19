package wheel.amiraligrr.app;

import android.graphics.Color;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.webkit.WebView;
import android.widget.FrameLayout;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import ir.tapsell.mediation.Tapsell;
import ir.tapsell.mediation.ad.AdStateListener;
import ir.tapsell.mediation.ad.request.BannerSize;
import ir.tapsell.mediation.ad.request.RequestResultListener;
import ir.tapsell.mediation.ad.views.banner.BannerContainer;

/**
 * Native banner bridge. The React layer never renders an advertisement; it only
 * asks this plugin to show or hide the real Tapsell view.
 *
 * One request is made per app session. A failed or unfilled request collapses
 * the bar and is never retried automatically, so the app stays usable offline.
 */
@CapacitorPlugin(name = "TapsellBanner")
public class TapsellBannerPlugin extends Plugin {

    private static final String STATE_IDLE = "idle";
    private static final String STATE_LOADING = "loading";
    private static final String STATE_LOADED = "loaded";
    private static final String STATE_SHOWN = "shown";
    private static final String STATE_HIDDEN = "hidden";
    private static final String STATE_FAILED = "failed";
    private static final String STATE_DESTROYED = "destroyed";
    private static final String STATE_UNCONFIGURED = "unconfigured";

    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private static volatile boolean initialized = false;
    private static boolean initializationListenerAttached = false;

    private FrameLayout host;
    private BannerContainer bannerContainer;
    private String adId;
    private String state = STATE_IDLE;
    private boolean requested = false;
    private boolean requestFinished = false;
    private boolean loaded = false;
    private boolean shown = false;
    private boolean visible = true;
    private boolean marginSaved = false;
    private int originalBottomMargin = 0;

    @PluginMethod
    public void loadBanner(PluginCall call) {
        if (requested) {
            call.resolve(stateObject());
            return;
        }
        if (BuildConfig.TAPSELL_BANNER_ZONE_ID == null || BuildConfig.TAPSELL_BANNER_ZONE_ID.trim().isEmpty()) {
            state = STATE_UNCONFIGURED;
            call.resolve(stateObject());
            return;
        }

        requested = true;
        state = STATE_LOADING;
        final android.app.Activity activity = getActivity();
        if (activity == null) {
            state = STATE_FAILED;
            call.resolve(stateObject());
            return;
        }

        activity.runOnUiThread(() -> {
            if (!createBannerHost(activity)) {
                state = STATE_FAILED;
                notifyState();
                return;
            }
            attachInitializationListener();
            scheduleRequest();
        });
        call.resolve(stateObject());
    }

    @PluginMethod
    public void show(PluginCall call) {
        visible = true;
        final android.app.Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(this::showInternal);
        }
        call.resolve();
    }

    @PluginMethod
    public void hide(PluginCall call) {
        visible = false;
        final android.app.Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(this::hideInternal);
        }
        call.resolve();
    }

    @PluginMethod
    public void getState(PluginCall call) {
        call.resolve(stateObject());
    }

    private boolean createBannerHost(android.app.Activity activity) {
        if (host != null) return true;
        FrameLayout root = activity.findViewById(android.R.id.content);
        if (root == null) return false;

        host = new FrameLayout(activity);
        host.setBackgroundColor(Color.parseColor("#F6F6F8"));
        host.setVisibility(View.INVISIBLE);

        int navigationInset = navigationInset(root);
        host.setPadding(0, 0, 0, navigationInset);

        View divider = new View(activity);
        divider.setBackgroundColor(Color.parseColor("#E9E9EE"));
        FrameLayout.LayoutParams dividerParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(activity, 1), Gravity.TOP);
        host.addView(divider, dividerParams);

        bannerContainer = new BannerContainer(activity);
        FrameLayout.LayoutParams bannerParams = new FrameLayout.LayoutParams(
                dp(activity, 320), dp(activity, 50), Gravity.TOP | Gravity.CENTER_HORIZONTAL);
        bannerParams.topMargin = dp(activity, 8);
        bannerParams.bottomMargin = dp(activity, 8);
        host.addView(bannerContainer, bannerParams);

        FrameLayout.LayoutParams hostParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM);
        root.addView(host, hostParams);
        return true;
    }

    private void attachInitializationListener() {
        if (initializationListenerAttached) return;
        initializationListenerAttached = true;
        try {
            Tapsell.setInitializationListener(() -> {
                initialized = true;
                MAIN.post(this::requestOnce);
            });
        } catch (Throwable ignored) {
            initializationListenerAttached = false;
        }
    }

    private void scheduleRequest() {
        if (initialized) {
            requestOnce();
            return;
        }
        // Auto-initialization normally completes before the WebView asks for the
        // banner. This fallback keeps a slow cold start from waiting forever.
        MAIN.postDelayed(this::requestOnce, 5000);
    }

    private void requestOnce() {
        if (requestFinished) return;
        requestFinished = true;
        android.app.Activity activity = getActivity();
        if (activity == null || bannerContainer == null) {
            state = STATE_FAILED;
            notifyState();
            return;
        }
        String zoneId = BuildConfig.TAPSELL_BANNER_ZONE_ID;
        if (zoneId == null || zoneId.trim().isEmpty()) {
            state = STATE_UNCONFIGURED;
            notifyState();
            return;
        }

        try {
            Tapsell.requestBannerAd(zoneId, BannerSize.BANNER_320_50, new RequestResultListener() {
                @Override
                public void onSuccess(String loadedAdId) {
                    adId = loadedAdId;
                    loaded = true;
                    state = STATE_LOADED;
                    MAIN.post(() -> {
                        notifyState();
                        showLoadedAd();
                    });
                }

                @Override
                public void onFailure(String message) {
                    adId = null;
                    loaded = false;
                    state = STATE_FAILED;
                    MAIN.post(() -> {
                        hideHost();
                        notifyState();
                    });
                }
            });
        } catch (Throwable error) {
            state = STATE_FAILED;
            hideHost();
            notifyState();
        }
    }

    private void showLoadedAd() {
        if (!loaded || adId == null || bannerContainer == null) return;
        if (!visible) {
            state = STATE_HIDDEN;
            notifyState();
            return;
        }
        android.app.Activity activity = getActivity();
        if (activity == null) return;

        if (!shown) {
            try {
                Tapsell.showBannerAd(adId, bannerContainer, activity, new AdStateListener.Banner() {
                    @Override
                    public void onAdImpression() {
                        state = STATE_SHOWN;
                        notifyState();
                    }

                    @Override
                    public void onAdClicked() {
                        notifyState();
                    }

                    @Override
                    public void onAdFailed(String message) {
                        loaded = false;
                        shown = false;
                        state = STATE_FAILED;
                        MAIN.post(() -> {
                            hideHost();
                            notifyState();
                        });
                    }
                });
                shown = true;
            } catch (Throwable error) {
                loaded = false;
                shown = false;
                state = STATE_FAILED;
                hideHost();
                notifyState();
                return;
            }
        }

        if (host != null) {
            host.setVisibility(View.VISIBLE);
            host.post(this::applyWebViewInset);
        }
        state = STATE_SHOWN;
        notifyState();
    }

    private void showInternal() {
        if (!loaded || adId == null) {
            notifyState();
            return;
        }
        showLoadedAd();
    }

    private void hideInternal() {
        hideHost();
        if (STATE_SHOWN.equals(state)) state = STATE_HIDDEN;
        notifyState();
    }

    private void hideHost() {
        if (host != null) host.setVisibility(View.INVISIBLE);
        resetWebViewInset();
    }

    private void applyWebViewInset() {
        WebView webView = getBridge().getWebView();
        if (webView == null || host == null) return;
        ViewGroup.LayoutParams rawParams = webView.getLayoutParams();
        if (!(rawParams instanceof ViewGroup.MarginLayoutParams)) return;
        ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) rawParams;
        if (!marginSaved) {
            originalBottomMargin = params.bottomMargin;
            marginSaved = true;
        }
        params.bottomMargin = host.getHeight();
        webView.setLayoutParams(params);
    }

    private void resetWebViewInset() {
        WebView webView = getBridge().getWebView();
        if (webView == null || !marginSaved) return;
        ViewGroup.LayoutParams rawParams = webView.getLayoutParams();
        if (rawParams instanceof ViewGroup.MarginLayoutParams) {
            ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) rawParams;
            params.bottomMargin = originalBottomMargin;
            webView.setLayoutParams(params);
        }
        marginSaved = false;
    }

    private int navigationInset(View view) {
        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(view);
        if (insets == null) return 0;
        Insets bars = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
        return bars.bottom;
    }

    private static int dp(android.content.Context context, int value) {
        return Math.round(value * context.getResources().getDisplayMetrics().density);
    }

    private JSObject stateObject() {
        JSObject data = new JSObject();
        data.put("status", state);
        if (host != null && getContext() != null) {
            float density = getContext().getResources().getDisplayMetrics().density;
            data.put("height", Math.round(host.getHeight() / density));
        }
        return data;
    }

    private void notifyState() {
        MAIN.post(() -> {
            if (getBridge() == null) return;
            notifyListeners("stateChanged", stateObject());
        });
    }

    @Override
    protected void handleOnDestroy() {
        final String currentAdId = adId;
        adId = null;
        loaded = false;
        shown = false;
        requested = false;
        requestFinished = false;
        state = STATE_DESTROYED;

        if (currentAdId != null) {
            try {
                Tapsell.destroyBannerAd(currentAdId);
            } catch (Throwable ignored) {
                // The SDK may already have released the ad.
            }
        }

        if (host != null) {
            resetWebViewInset();
            ViewParent parent = host.getParent();
            if (parent instanceof ViewGroup) {
                ((ViewGroup) parent).removeView(host);
            }
            host = null;
        }
        bannerContainer = null;
        super.handleOnDestroy();
    }
}
