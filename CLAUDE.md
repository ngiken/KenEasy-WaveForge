# CLAUDE.md — KenEasy WaveForge

Browser-only audio visualizer & video generator: drop an audio file → choose canvas aspect ratio and wave style → customize background, labels, and trim → preview in real-time → record & export crisp MP4/WebM video locally. No backend, upload, install, or account.

## Layered architecture

```text
web/
  index.html              # semantic UI shell with glassmorphism layout
  styles.css              # KenEasy signature dark-glass design tokens & responsive styling
  config.js               # data layer: presets, aspect ratios, wave styles, render defaults, limits
  i18n.js                 # content layer: bilingual copy (zh/en) + reactive translator
  audio-engine.js         # domain audio: Web Audio API decoding, peak waveform cache, real-time analyzer, trimmer
  visualizer-renderer.js  # domain render: multi-layer Canvas visualizer (background, cover/vinyl, wave styles, overlay text)
  video-exporter.js       # domain export: MediaRecorder + canvas.captureStream + audio destination stream pipeline
  app.js                  # orchestration: state machine, event routing, playback loop, UI updates
  vendor/                 # pinned offline helper libraries & fonts + NOTICE.txt
docs/screenshots/         # visual screenshots and README animated quick-tour GIF
scratch/e2e/              # Playwright test harness, E2E checks, and visual capture scripts
```

Dependency direction is strictly one-way: `config → i18n / audio-engine / visualizer-renderer / video-exporter → app → DOM`.

Do not hard-code visual ratios, wave algorithms, or default copy inside UI event handlers. Keep constants in `config.js`, text in `i18n.js`, rendering algorithms in `visualizer-renderer.js`, and UI coordination in `app.js`.

## Product goals

1. **Instant and Frictionless**: Open a link and it works immediately. Includes built-in demo audio tracks for zero-friction testing.
2. **100% Client-Side & Private**: Audio and images never leave the user's browser tab.
3. **Multi-Platform Canvas Formats**:
   - 9:16 (Shorts/TikTok/Reels/Xiaohongshu)
   - 16:9 (Bilibili/YouTube widescreen)
   - 1:1 (Square vinyl/social cover)
4. **Rich Visualizer Styles**:
   - Spectrum Bars (dynamic gradient equalizer bars with reflection)
   - Mirrored Waves (symmetric audio wave with glow)
   - Vinyl Radial (spinning album vinyl with outward radial frequency particles)
   - Neon Ribbon (flowing bezier wave stream)
5. **Precise Segment Trimming**: Dual-handle or slider trimming to export only the climax/hook segment.
6. **High-Performance Export**: Hardware-accelerated Canvas recording via MediaRecorder to high-bitrate WebM / MP4 video.
7. **Offline-Capable**: Zero runtime CDN dependencies.

## Hard rules

1. Never commit secrets: `*.pem`, `*.p12`, `*.key`, `.env`, credentials.
2. Never copy signing keys or raw recordings from the parent workspace.
3. This directory is its own Git repository; never commit it through the parent workspace.
4. No backend, file-upload API, runtime CDN, analytics, or tracking.
5. All UI copy must have both English and Simplified Chinese translations in `i18n.js`.
6. Maintain KenEasy design standards: deep glass panels, pink-to-blue gradient accent (`linear-gradient(135deg, #fb7299, #00aeec)`), emerald accent (`#10b981`), dark background (`#0b0c0f`).
