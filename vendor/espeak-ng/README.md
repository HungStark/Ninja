# Bundled Vietnamese speech reader

The game communicates with a separate eSpeak-NG worker using text requests and
mono PCM responses. It does not require Android voice installation or network
access. `worker.js` is licensed GPL-3.0-or-later, with the license in
`package/COPYING`.

Upstream distribution: `@echogarden/espeak-ng-emscripten` **0.3.5**.
The unmodified published JS and data are in `package/`.
NPM integrity: `sha512-Izbkm7NWccwb//RKgOp1/0k21StKN1DFIn+K7GU1XN7n6pmSi4bsk/0tYUsgQbysC4GVyrVompNmLInU/BFE+A==`.

Sources, license, build scripts and notices are provided together with the
reader in every APK and static distribution:

- `wrapper-source.tgz`: distribution repository snapshot
  `ea36b43595facf07f1c5dc487b9f0de3340c1b5e`, including the identical published
  binary assets, from https://github.com/echogarden-project/espeak-ng-emscripten.
- `source.tgz`: complete engine/fork source, voice data and Emscripten build
  scripts, snapshot `9a550bef455f03b459f51796e3482833aab7fbc0`, from
  https://github.com/echogarden-project/espeak-ng/tree/fork.
- `package/COPYING`: GNU GPL version 3.

To rebuild the reader, unpack the engine source on Linux with the Emscripten
SDK, CMake and native C/C++ build tools, copy `pre-runtime.js` over its `emscripten/pre.js` (the exact prelude shipped
in the published module), then run its `build-emscripten.sh`.
Copy the resulting `emscripten/espeak-ng.js` and `espeak-ng.data` to `package/`.
The game build copies this directory verbatim; it never downloads speech at
runtime. The game-specific worker selects `vi` and converts signed 16-bit
samples to float PCM at the engine's reported sample rate.
