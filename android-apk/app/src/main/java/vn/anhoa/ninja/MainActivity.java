package vn.anhoa.ninja;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;

public final class MainActivity extends Activity {
    private WebView game;
    private GameSpeech speech;
    private static final String GAME_URL = "https://appassets.androidplatform.net/assets/index.html";

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams attributes = getWindow().getAttributes();
            attributes.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(attributes);
        }
        setVolumeControlStream(android.media.AudioManager.STREAM_MUSIC);
        game = new WebView(this);
        speech = new GameSpeech(this, game);
        game.addJavascriptInterface(speech, "AnHoaSpeech");
        game.setBackgroundColor(Color.rgb(19, 40, 49));
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportZoom(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        game.setWebChromeClient(new WebChromeClient());
        game.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse resource = assets.shouldInterceptRequest(request.getUrl());
                if (resource != null) return resource;
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                        java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) { speech.stop(); }
            @Override public void onPageFinished(WebView view, String url) { speech.pageReady(); }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                android.net.Uri url = request.getUrl();
                return !("https".equals(url.getScheme()) && "appassets.androidplatform.net".equals(url.getHost()) && ("/assets/index.html".equals(url.getPath()) || "/assets/index.en.html".equals(url.getPath())));
            }
        });
        setContentView(game);
        immerse();
        boolean deterministicTest = BuildConfig.DEBUG && getIntent().getBooleanExtra("anhoa.test", false);
        game.loadUrl(GAME_URL + (deterministicTest ? "?test=1&mode=duel" : ""));
    }
    private void immerse() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.systemBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
    }
    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immerse();
    }
    @Override protected void onPause() {
        if (speech != null) speech.background();
        game.evaluateJavascript("window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('blur'));", null);
        game.onPause();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (game != null) {
            game.onResume();
            if (speech != null) speech.foreground();
            game.evaluateJavascript("window.dispatchEvent(new Event('pageshow'));", null);
        }
    }
    @Override public void onBackPressed() {
        game.evaluateJavascript("(()=>{if(document.getElementById('audioSettings')?.hidden===false){document.getElementById('closeAudioSettings').click();return true;}const api=window.__AN_HOA__,s=api?.adventure?.();if(!api||(!api.state().started&&(!s||s.phase==='home')))return false;window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));return true;})()",
                handled -> { if ("false".equals(handled)) finish(); });
    }
    @Override protected void onDestroy() {
        if (speech != null) speech.close();
        if (game != null) { game.removeJavascriptInterface("AnHoaSpeech"); game.destroy(); }
        super.onDestroy();
    }
}
