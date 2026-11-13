"""Render original instrumental village loops offline using numpy/scipy.

All melodies and synthetic instrument models are original; no recorded samples.
Circular mixing includes the previous loop's reverb tails at the loop boundary.
"""
import json
import math
import wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1]
RATE = 22050
SCORES = json.loads((ROOT / 'assets/music/scores.json').read_text(encoding='utf-8'))


def voice(kind, midi, duration, rng):
    hz = 440 * 2 ** ((midi - 69) / 12)
    sustained = kind in ('flute', 'shakuhachi', 'strings', 'cello', 'violin', 'pulse')
    tail = .55 if sustained else (3.8 if 'bell' in kind or kind in ('crystal', 'chime') else 2.3)
    t = np.arange(math.ceil((duration + tail) * RATE), dtype=np.float64) / RATE
    result = np.zeros_like(t)
    if kind in ('flute', 'shakuhachi'):
        vibrato = np.clip((t - .22) / .55, 0, 1) * .003
        phase = 2 * np.pi * hz * t + hz * vibrato / 5.1 * np.sin(2 * np.pi * 5.1 * t)
        phase -= .035 * hz * np.exp(-t * 18)
        for h, weight in enumerate([1, .19, .055, .018], 1):
            if hz * h < RATE * .43:
                result += weight * np.sin(phase * h)
        breath = sosfilt(butter(2, [500, 3200], fs=RATE, btype='bandpass', output='sos'), rng.normal(0, 1, len(t)))
        result += breath * (.065 if kind == 'shakuhachi' else .03)
        result *= np.minimum(1, t / .11) ** 1.3 * np.clip((duration + .35 - t) / .35, 0, 1)
        result *= .92 + .04 * np.sin(2 * np.pi * 2.7 * t)
    elif kind in ('strings', 'cello', 'violin'):
        for detune in (-5.5, 0, 4.2):
            for h in range(1, 6):
                if hz * h < RATE * .43:
                    result += np.sin(2 * np.pi * hz * 2 ** (detune / 1200) * h * t + h * .13 * np.sin(2 * np.pi * 4.7 * t)) / (h ** 1.65 * 3)
        result *= np.minimum(1, t / .65) * np.clip((duration + .5 - t) / .65, 0, 1)
    elif kind == 'pulse':
        result = np.sin(2 * np.pi * hz * t) + .16 * np.sin(2 * np.pi * hz * 2 * t)
        result *= np.minimum(1, t / .03) * np.exp(-t * 7) * np.clip((duration - t) / .08, 0, 1)
    elif kind in ('waterbell', 'templebell', 'crystal', 'chime', 'kalimba'):
        for ratio, weight, decay in [(1, 1, 2.3), (2.756, .24, 1.2), (5.404, .065, .55), (8.933, .024, .3)]:
            if hz * ratio < RATE * .43:
                result += weight * np.sin(2 * np.pi * hz * ratio * t) * np.exp(-t / (decay * (.55 if kind == 'kalimba' else 1)))
        result *= np.minimum(1, t / .006)
    elif kind == 'taiko':
        phase = 2 * np.pi * (hz * .6 * t + hz * .4 * (1 - np.exp(-t * 15)) / 15)
        result = np.sin(phase) * np.exp(-t * 4.5) + .32 * np.sin(phase * 1.58) * np.exp(-t * 8)
        body = sosfilt(butter(2, 1500, fs=RATE, output='sos'), rng.normal(0, 1, len(t)))
        result += body * .2 * np.exp(-t * 40)
        result *= np.minimum(1, t / .004)
    else:
        decay = {'koto': 1.25, 'shamisen': .55, 'harp': 1.8, 'piano': 1.6}[kind]
        power = {'koto': 1.3, 'shamisen': 1.05, 'harp': 1.9, 'piano': 1.65}[kind]
        for h in range(1, 13):
            partial = hz * h * math.sqrt(1 + (.0001 if kind == 'piano' else .00022) * h * h)
            if partial < RATE * .43:
                result += np.sin(2 * np.pi * partial * t) * np.exp(-t * h ** .55 / decay) / h ** power
        result *= np.minimum(1, t / (.007 if kind == 'piano' else .003))
        result += rng.normal(0, .055 if kind == 'shamisen' else .012, len(t)) * np.exp(-t * 180)
    # Silent endpoints on each voice avoid clicks, including wrapped notes.
    result *= np.minimum(1, np.maximum(0, len(t) - 1 - np.arange(len(t))) / (RATE * .025))
    return result.astype(np.float32)


def render(identifier, score):
    rng = np.random.default_rng(sum(ord(c) for c in identifier) + 7919)
    beat = 60 / score['bpm']
    count = round(64 * beat * RATE)
    mix = np.zeros((count, 2), dtype=np.float32)
    events = []

    def degree(value):
        octave, index = divmod(value, len(score['scale']))
        return score['root'] + score['scale'][index] + 12 * octave

    def add(kind, midi, at, duration, level, pan=0):
        data = voice(kind, midi, duration * beat, rng)
        # Deterministic timing and dynamics keep the arrangement from sounding rigid.
        start = round((at * beat + rng.uniform(-.009, .009)) * RATE) % count
        gains = np.array([math.sqrt((1 - pan) / 2), math.sqrt((1 + pan) / 2)]) * level * rng.uniform(.94, 1.06)
        offset = 0
        while offset < len(data):
            size = min(len(data) - offset, count - start)
            mix[start:start + size] += data[offset:offset + size, None] * gains
            offset += size
            start = 0
        events.append({'instrument': kind, 'midi': midi, 'beat': at})

    for repetition in range(2):
        for i, (at, pitch, length) in enumerate(score['melody']):
            variation = 1 if repetition and i in (3, 9) and identifier not in ('ice', 'dark', 'earth') else 0
            add(score['lead'], degree(pitch + variation) + score['leadOctave'], at + repetition * 32, length, .155 if score['lead'] != 'piano' else .19, -.12)
            if identifier == 'ice' and i in (1, 3, 5, 7):
                add('shakuhachi', degree(pitch) - 12, at + repetition * 32 + .2, length, .065, .22)

    for bar in range(16):
        chord = score['chords'][(bar // 2) % 4]
        if bar % 2 == 0:
            for j, note in enumerate(chord[:3]):
                register = 0 if score['strings'] == 'violin' else -12
                add(score['strings'], score['root'] + register + note, bar * 4, 7.8, .029 if identifier != 'ice' else .019, -.45 + j * .45)
        step = .5 if identifier in ('water', 'lightning', 'wind') else 1
        if identifier in ('earth', 'ice', 'dark'):
            step = 2
        for i in range(round(4 / step)):
            if identifier == 'dark' and (bar + i) % 3:
                continue
            if identifier == 'nameless' and i in (1, 3) and bar % 2 == 0:
                continue
            at = bar * 4 + i * step
            note = score['root'] + chord[(i + bar) % len(chord)] - (12 if identifier in ('earth', 'dark') else 0)
            add(score['pluck'], note, at + (.025 if i % 2 else 0), .8, .072 if identifier != 'lightning' else .064, .32)
        if identifier in ('water', 'wind', 'wood', 'light'):
            for i in (0, 2, 3):
                add('harp', score['root'] + chord[i % len(chord)] + 12, bar * 4 + i + .5, 1.2, .032, -.4)
        if score['bells'] and bar % (4 if identifier in ('ice', 'dark', 'light') else 2) == 0:
            add(score['bells'], degree(3 + bar % 3) + (12 if identifier != 'dark' else 0), bar * 4 + (1.5 if identifier == 'wood' else .5), 2.5, .034 if identifier != 'wood' else .055, .55)
        if score['drums'] != 'none':
            hits = [(0, .12), (2.5, .065)] if identifier == 'fire' else [(0, .10), (1.5, .042), (2, .067), (3.5, .035)] if identifier == 'lightning' else [(0, .095)]
            for at, level in hits:
                if identifier == 'earth' and bar % 2:
                    continue
                add('taiko', 34 if at == 0 else 41, bar * 4 + at, .65, level, -.08)
        if identifier == 'lightning':
            for i in range(4):
                add('pulse', score['root'] - 12 + chord[i % 2], bar * 4 + i + .5, .4, .022, -.25)

    # Render a stereo room once; wrap the tails into the loop beginning.
    dry = mix.copy()
    for i, delay in enumerate((.073, .113, .179, .269, .397, .563, .811, 1.13, 1.57)):
        shifted = np.roll(dry[:, ::-1] if i % 2 else dry, round(delay * RATE), axis=0)
        mix += shifted * score['space'] * .61 ** (i / 2 + 1)
    mix = np.tanh(mix * 1.15)
    rms = float(np.sqrt(np.mean(mix.astype(np.float64) ** 2)))
    mix *= min(.12 / max(rms, 1e-9), .72 / max(float(np.max(np.abs(mix))), 1e-9))
    pcm = np.round(mix * 32767).astype('<i2')
    destination = ROOT / 'assets/music' / (identifier + '.wav')
    with wave.open(str(destination), 'wb') as file:
        file.setnchannels(2)
        file.setsampwidth(2)
        file.setframerate(RATE)
        file.writeframes(pcm.tobytes())
    return {'id': identifier, 'bpm': score['bpm'], 'seconds': count / RATE, 'bars': 16, 'sampleRate': RATE, 'channels': 2, 'instruments': sorted({e['instrument'] for e in events}), 'notes': len(events), 'rms': float(np.sqrt(np.mean(mix.astype(np.float64) ** 2))), 'peak': float(np.max(np.abs(mix))), 'loopBoundaryDelta': float(np.max(np.abs(mix[0] - mix[-1]))), 'bytes': destination.stat().st_size}


if __name__ == '__main__':
    reports = []
    for identifier, score in SCORES.items():
        report = render(identifier, score)
        reports.append(report)
        print(f"{identifier}: {report['bpm']} BPM, {report['seconds']:.2f}s, {', '.join(report['instruments'])}", flush=True)
    (ROOT / 'assets/music/manifest.json').write_text(json.dumps(reports, indent=2) + '\n', encoding='utf-8')
