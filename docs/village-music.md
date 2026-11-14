# Village exploration music

Ten original instrumental arrangements follow the supplied Japanese fantasy village brief. Instruments are synthesized approximations, not recordings of acoustic instruments. There are no vocals, choir samples, external music services or runtime note synthesis.

| Village | BPM | Arrangement |
| --- | ---: | --- |
| Nameless | 78 | Nostalgic shakuhachi, restrained koto, warm strings |
| Water | 82 | Flowing koto and harp, graceful flute, water bells |
| Fire | 102 | Rhythmic shamisen, flute, cello, controlled taiko |
| Lightning | 112 | Shamisen ostinato, taiko, low strings, quiet synth pulses |
| Wind | 92 | High flute, floating harp, wind chimes, strings |
| Earth | 76 | Low shakuhachi and cello, sparse shamisen, deep taiko |
| Wood | 86 | Bamboo-style flute, koto, kalimba, harp, soft strings |
| Ice | 66 | Sparse piano, lonely flute, crystal bells and violin; no drums |
| Light | 82 | Koto, celestial harp, distant bells, flute and strings; no choir |
| Dark | 72 | Low flute, sparse shamisen, cello and distant bells; no heavy percussion |

Each stereo loop contains 16 bars (34–58 seconds). Note tails and stereo room reflections wrap across the loop boundary. Tracks share an RMS target of 0.12 and stay below a 0.72 sample peak. Files use 22.05 kHz, 16-bit stereo PCM WAV to preserve exact loop timing and offline WebView decoding. The ten files total about 39 MiB.

`assets/music/scores.json` stores the compositions. `tools/build-village-music.py` deterministically renders them with Python, numpy and scipy; generated audio and `manifest.json` are checked in. Ordinary JS builds copy the audio without requiring Python. Both Android and Vercel builds include the tracks.

The initial loading screen fetches and decodes the saved village's track alongside
the UI and character models. Map-transition loading also waits for the destination
track. Playback reuses this decoded buffer; preloading uses an OfflineAudioContext
and does not open audible output before a user gesture. Muted/zero-volume music
does not delay loading. Music failures use the existing loading-error/reload flow.

The shared cache retains at most two decoded buffers and the player crossfades
village changes. Muting, a zero music slider, backgrounding and battle suppression
stop music sources. A late download cannot restart music after a battle begins.
Battles, battle pause/settings and battle results remain silent; exploration
resumes its village score. The old `stats.notes` counter tracks score subdivisions
for diagnostics rather than oscillator creation.

First input no longer decodes all recordings and renders all procedural cues
concurrently. A deduplicated background queue prepares one effect at a time,
with a 200 ms gap and idle scheduling, after the music has played for one second.
Mute/background/destroy cancel scheduled work. An effect actually requested by
gameplay still starts preparation directly and shares existing cache promises.

An isolated headless Edge cold-start comparison measured music start after the
first click at about 3,328 ms before and 103 ms after preload. First-second effect
decodes fell from 15 to zero; peak concurrent decodes fell from 15 to one.
This measures scheduling/preparation, not audible crackle on a physical device.
The report is `test-results/music-loading/before-after.json`.

Validation:

```powershell
.\.tools\node-v24.21.0-win-x64\node.exe tests/village-music-core.mjs
.\.tools\node-v24.21.0-win-x64\node.exe tests/audio-warmup-core.mjs
.\.tools\node-v24.21.0-win-x64\node.exe tools/build-android.mjs
.\.tools\node-v24.21.0-win-x64\node.exe tests/music-loading-browser.cjs
.\.tools\node-v24.21.0-win-x64\node.exe tests/audio-browser.cjs
.\.tools\node-v24.21.0-win-x64\node.exe tests/server.cjs
```

The browser test starts every loop near its end to exercise playback across the boundary. It also checks all village tracks, cache limits, real audio output, mute, background suspend/resume, battle suppression and spell/speech compatibility.
