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

The player loads the current track on demand, retains at most two decoded buffers and crossfades village changes. Muting, a zero music slider, backgrounding and battle suppression stop music sources. A late download cannot restart music after a battle begins. Battles, battle pause/settings and battle results remain silent; exploration resumes its village score. The old `stats.notes` counter now tracks score subdivisions for diagnostics rather than oscillator creation.

Validation:

```powershell
.\.tools\node-v24.21.0-win-x64\node.exe tests/village-music-core.mjs
.\.tools\node-v24.21.0-win-x64\node.exe tools/build-android.mjs
.\.tools\node-v24.21.0-win-x64\node.exe tests/audio-browser.cjs
.\.tools\node-v24.21.0-win-x64\node.exe tests/server.cjs
```

The browser test starts every loop near its end to exercise playback across the boundary. It also checks all village tracks, cache limits, real audio output, mute, background suspend/resume, battle suppression and spell/speech compatibility.
