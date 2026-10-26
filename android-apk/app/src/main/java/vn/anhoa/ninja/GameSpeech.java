package vn.anhoa.ninja;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Speech is provided by Android, not the optional Web Speech API in WebView. */
public final class GameSpeech {
    private final Activity activity;
    private final WebView web;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private TextToSpeech tts;
    private boolean initialized, closed, foreground = true, paused;
    private volatile String state = "initializing", engine = "", voiceName = "", message = "Đang chuẩn bị giọng đọc tiếng Việt…";
    private volatile boolean networkVoice;
    private Request current;
    private long serial;

    private static final class Request {
        final String id, text;
        final float rate, pitch, volume;
        int offset, startOffset;
        String internalId;
        Request(String text, String id, float rate, float pitch, float volume) {
            this.text = text; this.id = id; this.rate = rate; this.pitch = pitch; this.volume = volume;
        }
    }

    public GameSpeech(Activity activity, WebView web) {
        this.activity = activity; this.web = web;
        ui.post(this::initialize);
    }

    private void initialize() {
        if (closed) return;
        state = "initializing"; message = "Đang chuẩn bị giọng đọc tiếng Việt…";
        try {
            tts = new TextToSpeech(activity.getApplicationContext(), result -> ui.post(() -> {
                if (closed) return;
                initialized = result == TextToSpeech.SUCCESS;
                if (!initialized) { failEngine("Không khởi động được bộ đọc. Hãy kiểm tra giọng nói Android."); return; }
                engine = tts.getDefaultEngine();
                tts.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { ui.post(() -> { if (matches(id)) emit("start", current.id, ""); }); }
                    @Override public void onDone(String id) { ui.post(() -> { if (matches(id)) { String requestId = current.id; current = null; paused = false; emit("done", requestId, ""); } }); }
                    @Override public void onError(String id) { onError(id, TextToSpeech.ERROR); }
                    @Override public void onError(String id, int code) { ui.post(() -> { if (matches(id)) failCurrent("Giọng đọc gặp lỗi. Hãy thử tải giọng tiếng Việt để dùng ngoại tuyến."); }); }
                    @Override public void onRangeStart(String id, int start, int end, int frame) {
                        ui.post(() -> { if (matches(id)) current.offset = current.startOffset + start; });
                    }
                });
                selectVietnameseVoice();
                if (current != null) { if ("ready".equals(state)) { if (!paused) play(); } else failCurrent(message); }
            }));
        } catch (RuntimeException error) { failEngine("Máy chưa có bộ đọc tiếng Việt. Mở cài đặt để bổ sung giọng đọc."); }
    }

    private boolean matches(String id) { return !closed && !paused && current != null && id.equals(current.internalId); }

    private void selectVietnameseVoice() {
        if (closed || !initialized) return;
        try {
            int language = tts.setLanguage(new Locale("vi", "VN"));
            Set<Voice> available = tts.getVoices();
            List<Voice> vietnamese = new ArrayList<>();
            if (available != null) for (Voice voice : available) {
                if ("vi".equalsIgnoreCase(voice.getLocale().getLanguage())) vietnamese.add(voice);
            }
            vietnamese.sort(Comparator.comparing(Voice::isNetworkConnectionRequired)
                    .thenComparing((Voice v) -> !"VN".equalsIgnoreCase(v.getLocale().getCountry()))
                    .thenComparing(Voice::getName));
            Voice selected = null;
            for (Voice voice : vietnamese) if (tts.setVoice(voice) == TextToSpeech.SUCCESS) { selected = voice; break; }
            if (selected == null && language < TextToSpeech.LANG_AVAILABLE) {
                state = "missing-voice"; voiceName = ""; networkVoice = false;
                message = "Máy chưa có giọng tiếng Việt. Chọn Cài giọng tiếng Việt bên dưới.";
            } else {
                if (selected == null) selected = tts.getVoice();
                state = "ready";
                voiceName = selected == null ? "vi-VN" : selected.getName();
                networkVoice = selected != null && selected.isNetworkConnectionRequired();
                message = networkVoice ? "Giọng tiếng Việt đã sẵn sàng; tải thêm giọng để dùng ngoại tuyến." : "Giọng tiếng Việt đã sẵn sàng.";
            }
        } catch (RuntimeException error) { state = "unavailable"; message = "Không truy cập được giọng đọc Android. Hãy kiểm tra cài đặt giọng nói."; }
        emit("status", "", message);
    }

    @JavascriptInterface public String getStatus() {
        JSONObject status = new JSONObject();
        try {
            status.put("state", state).put("message", message).put("engine", engine)
                    .put("voice", voiceName).put("language", "vi-VN").put("network", networkVoice);
            AudioManager audio = (AudioManager) activity.getSystemService(Activity.AUDIO_SERVICE);
            status.put("mediaMuted", audio != null && audio.getStreamVolume(AudioManager.STREAM_MUSIC) == 0);
        } catch (Exception ignored) { }
        return status.toString();
    }

    @JavascriptInterface public void speak(String text, String id, float rate, float pitch, float volume) {
        ui.post(() -> {
            if (closed || !foreground) return;
            stopNow();
            if (text == null || text.trim().isEmpty() || id == null) return;
            String line = text.trim();
            if (line.length() > TextToSpeech.getMaxSpeechInputLength()) {
                emit("error", id, "Đoạn thoại quá dài để đọc trong một lượt."); return;
            }
            current = new Request(line, id, Math.max(.5f, Math.min(3f, rate)), Math.max(.5f, Math.min(1.5f, pitch)), Math.max(0, Math.min(1, volume)));
            if ("initializing".equals(state)) return; // Only the most recent line waits for initialization.
            if (!"ready".equals(state)) { failCurrent(message); return; }
            play();
        });
    }

    private void play() {
        if (closed || !foreground || current == null || !"ready".equals(state)) return;
        try {
            paused = false; current.startOffset = current.offset; current.internalId = "anhoa-" + (++serial);
            tts.setSpeechRate(current.rate); tts.setPitch(current.pitch);
            Bundle params = new Bundle();
            params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, current.volume);
            params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC);
            int result = tts.speak(current.text.substring(current.offset), TextToSpeech.QUEUE_FLUSH, params, current.internalId);
            if (result == TextToSpeech.ERROR) failCurrent("Chưa phát được giọng đọc. Hãy kiểm tra giọng tiếng Việt đã cài.");
        } catch (RuntimeException error) { failCurrent("Chưa phát được giọng đọc. Hãy mở cài đặt giọng nói Android."); }
    }

    @JavascriptInterface public void stop() { ui.post(this::stopNow); }
    private void stopNow() {
        current = null; paused = false;
        if (tts != null) try { tts.stop(); } catch (RuntimeException ignored) { }
    }
    @JavascriptInterface public void pause() { ui.post(() -> { if (current != null && !paused) { paused = true; current.internalId = null; if (tts != null) try { tts.stop(); } catch (RuntimeException ignored) { } } }); }
    @JavascriptInterface public void resume() { ui.post(() -> { if (paused && foreground && current != null) { paused = false; if ("ready".equals(state)) play(); else if (!"initializing".equals(state)) failCurrent(message); } }); }
    @JavascriptInterface public void installVoiceData() { ui.post(() -> openSettings(true)); }
    @JavascriptInterface public void openVoiceSettings() { ui.post(() -> openSettings(false)); }
    private void openSettings(boolean install) {
        if (closed) return;
        stopNow();
        try {
            Intent intent = new Intent(install ? TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA : "com.android.settings.TTS_SETTINGS");
            if (install && !engine.isEmpty()) intent.setPackage(engine);
            activity.startActivity(intent);
        } catch (ActivityNotFoundException error) {
            try { activity.startActivity(new Intent("com.android.settings.TTS_SETTINGS")); }
            catch (ActivityNotFoundException ignored) { activity.startActivity(new Intent(Settings.ACTION_SETTINGS)); }
        }
    }

    public void pageReady() { ui.post(() -> emit("status", "", message)); }
    public void background() { foreground = false; stopNow(); }
    public void foreground() {
        foreground = true;
        String defaultEngine = Settings.Secure.getString(activity.getContentResolver(), Settings.Secure.TTS_DEFAULT_SYNTH);
        if (initialized && defaultEngine != null && !defaultEngine.equals(engine)) {
            stopNow(); tts.shutdown(); initialized = false; initialize();
        }
        else if (initialized) selectVietnameseVoice();
        else if (!"initializing".equals(state)) { if (tts != null) tts.shutdown(); initialize(); }
    }
    public void close() { closed = true; stopNow(); if (tts != null) tts.shutdown(); }
    private void failEngine(String reason) { state = "unavailable"; message = reason; emit("status", "", reason); if (current != null) failCurrent(reason); }
    private void failCurrent(String reason) { if (current == null) return; String id = current.id; current = null; paused = false; emit("error", id, reason); }
    private void emit(String type, String id, String reason) {
        if (closed) return;
        try {
            JSONObject event = new JSONObject().put("type", type).put("id", id).put("message", reason).put("state", state);
            web.evaluateJavascript("window.dispatchEvent(new CustomEvent('anhoa:native-speech',{detail:" + event.toString() + "}));", null);
        } catch (RuntimeException | org.json.JSONException ignored) { }
    }
}
