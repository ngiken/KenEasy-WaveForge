/**
 * KenEasy WaveForge - Application Orchestrator
 * Connects DOM events, AudioEngine, VisualizerRenderer, and VideoExporter.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize i18n
  I18N.init();

  // 2. DOM Elements
  const canvas = document.getElementById('visualizer-canvas');
  const previewWrapper = document.getElementById('preview-wrapper');
  const fileDropZone = document.getElementById('file-drop-zone');
  const audioFileInput = document.getElementById('audio-file-input');
  const bgFileInput = document.getElementById('bg-file-input');
  const coverFileInput = document.getElementById('cover-file-input');

  const btnTryDemo = document.getElementById('btn-try-demo');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const playIcon = document.getElementById('play-icon');
  const btnExport = document.getElementById('btn-export');
  const btnLangZh = document.getElementById('btn-lang-zh');
  const btnLangEn = document.getElementById('btn-lang-en');

  // Input & Option Controls
  const inputTitle = document.getElementById('input-title');
  const inputAuthor = document.getElementById('input-author');
  const sliderBgBlur = document.getElementById('slider-bg-blur');
  const valBgBlur = document.getElementById('val-bg-blur');
  const sliderBgVignette = document.getElementById('slider-bg-vignette');
  const valBgVignette = document.getElementById('val-bg-vignette');
  const sliderSensitivity = document.getElementById('slider-sensitivity');
  const valSensitivity = document.getElementById('val-sensitivity');

  const toggleCover = document.getElementById('toggle-cover');
  const toggleTimecode = document.getElementById('toggle-timecode');
  const toggleWatermark = document.getElementById('toggle-watermark');

  // Timeline & Trimming
  const timelineCanvas = document.getElementById('timeline-canvas');
  const trimStartInput = document.getElementById('trim-start');
  const trimEndInput = document.getElementById('trim-end');
  const trimDurationDisplay = document.getElementById('trim-duration-display');
  const btnResetTrim = document.getElementById('btn-reset-trim');
  const btnPlaySelection = document.getElementById('btn-play-selection');

  // Export Modal
  const exportModal = document.getElementById('export-modal');
  const exportProgressFill = document.getElementById('export-progress-fill');
  const exportProgressText = document.getElementById('export-progress-text');
  const exportEtaText = document.getElementById('export-eta-text');
  const btnCancelExport = document.getElementById('btn-cancel-export');
  const exportSuccessBox = document.getElementById('export-success-box');
  const btnDownloadVideo = document.getElementById('btn-download-video');
  const btnCloseModal = document.getElementById('btn-close-modal');

  // Audio Meta Info
  const audioInfoBar = document.getElementById('audio-info-bar');
  const audioNameEl = document.getElementById('audio-name');
  const audioDurationEl = document.getElementById('audio-duration');
  const btnClearAudio = document.getElementById('btn-clear-audio');

  // 3. Engine Instances
  const audioEngine = new AudioEngine();
  const renderer = new VisualizerRenderer(canvas);
  const exporter = new VideoExporter({
    canvas,
    audioEngine,
    renderer,
  });

  let exportedVideoResult = null;
  let isDraggingTimeline = false;

  // 4. Set Initial Setup
  function applyRatio(ratioId) {
    const config = CONFIG.ASPECT_RATIOS[ratioId] || CONFIG.ASPECT_RATIOS['9:16'];
    renderer.setDimensions(config.width, config.height, ratioId);

    // Update Preview Container Aspect Ratio
    previewWrapper.setAttribute('data-ratio', ratioId);
    if (ratioId === '9:16') {
      previewWrapper.style.aspectRatio = '9 / 16';
    } else if (ratioId === '16:9') {
      previewWrapper.style.aspectRatio = '16 / 9';
    } else {
      previewWrapper.style.aspectRatio = '1 / 1';
    }

    // Active pill button state
    document.querySelectorAll('[data-ratio]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-ratio') === ratioId);
    });
  }

  applyRatio('9:16');

  // 5. Main Canvas Animation Loop
  function animationLoop() {
    const freqData = audioEngine.getFrequencyData();
    const timeData = audioEngine.getTimeDomainData();
    const currentTime = audioEngine.getCurrentTime();
    const duration = audioEngine.duration;
    const isPlaying = audioEngine.isPlaying;

    renderer.renderFrame({
      freqData,
      timeData,
      currentTime,
      duration,
      isPlaying,
    });

    // Update Timeline Playhead
    if (audioEngine.duration > 0 && !isDraggingTimeline) {
      renderTimelinePlayhead(currentTime);
    }

    requestAnimationFrame(animationLoop);
  }
  requestAnimationFrame(animationLoop);

  // 6. Timeline Rendering
  function drawTimelineWaveform() {
    if (!timelineCanvas) return;
    const ctx = timelineCanvas.getContext('2d');
    const w = timelineCanvas.width = timelineCanvas.parentElement.clientWidth || 300;
    const h = timelineCanvas.height = 48;

    ctx.fillStyle = 'rgba(24, 27, 33, 0.7)';
    ctx.fillRect(0, 0, w, h);

    const peaks = audioEngine.peaks;
    if (!peaks || peaks.length === 0) {
      // Draw placeholder dashed line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    const barW = Math.max(1, w / peaks.length);
    const theme = renderer.getTheme();

    // Waveform bars
    ctx.fillStyle = `${theme.primary}aa`;
    for (let i = 0; i < peaks.length; i++) {
      const barH = Math.max(2, peaks[i] * (h * 0.85));
      const x = i * barW;
      const y = (h - barH) / 2;
      ctx.fillRect(x, y, barW - 1, barH);
    }

    // Shade outside trim area
    const startX = (audioEngine.trimStart / audioEngine.duration) * w;
    const endX = (audioEngine.trimEnd / audioEngine.duration) * w;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, startX, h);
    ctx.fillRect(endX, 0, w - endX, h);

    // Trim handles
    ctx.fillStyle = theme.secondary;
    ctx.fillRect(startX - 2, 0, 4, h);
    ctx.fillRect(endX - 2, 0, 4, h);
  }

  function renderTimelinePlayhead(currentTime) {
    if (!timelineCanvas || audioEngine.duration <= 0) return;
    drawTimelineWaveform();

    const ctx = timelineCanvas.getContext('2d');
    const w = timelineCanvas.width;
    const h = timelineCanvas.height;
    const playheadX = (currentTime / audioEngine.duration) * w;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playheadX - 1.5, 0, 3, h);
  }

  function updateTrimUI() {
    const start = audioEngine.trimStart;
    const end = audioEngine.trimEnd;
    const dur = Math.max(0, end - start);

    trimStartInput.value = start.toFixed(1);
    trimEndInput.value = end.toFixed(1);
    trimDurationDisplay.textContent = `${dur.toFixed(1)}s`;
    drawTimelineWaveform();
  }

  // 7. Load Audio Handlers
  async function handleAudioLoad(meta) {
    audioNameEl.textContent = meta.fileName;
    audioDurationEl.textContent = renderer.formatTime(meta.duration);
    audioInfoBar.style.display = 'flex';
    fileDropZone.classList.add('has-file');

    inputTitle.value = meta.fileName;
    renderer.title = meta.fileName;

    updateTrimUI();
    drawTimelineWaveform();
  }

  async function loadFile(file) {
    if (!file) return;
    try {
      fileDropZone.classList.add('loading');
      const meta = await audioEngine.loadAudioFile(file);
      await handleAudioLoad(meta);
    } catch (err) {
      console.error(err);
      alert(I18N.t('formatNotSupported'));
    } finally {
      fileDropZone.classList.remove('loading');
    }
  }

  // Demo audio synthesis
  btnTryDemo.addEventListener('click', async () => {
    try {
      btnTryDemo.disabled = true;
      btnTryDemo.textContent = I18N.t('generatingDemo');
      const meta = await audioEngine.generateDemoBuffer();
      await handleAudioLoad(meta);
      audioEngine.play();
    } catch (e) {
      console.error(e);
    } finally {
      btnTryDemo.disabled = false;
      btnTryDemo.textContent = I18N.t('tryDemo');
    }
  });

  // Drag and Drop
  fileDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropZone.classList.add('drag-over');
  });
  fileDropZone.addEventListener('dragleave', () => {
    fileDropZone.classList.remove('drag-over');
  });
  fileDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadFile(e.dataTransfer.files[0]);
    }
  });

  audioFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      loadFile(e.target.files[0]);
    }
  });

  btnClearAudio.addEventListener('click', () => {
    audioEngine.stop();
    audioEngine.audioBuffer = null;
    audioEngine.duration = 0;
    audioInfoBar.style.display = 'none';
    fileDropZone.classList.remove('has-file');
    audioFileInput.value = '';
    drawTimelineWaveform();
  });

  // Play / Pause Controls
  btnPlayPause.addEventListener('click', () => {
    if (!audioEngine.audioBuffer) {
      // Auto-load demo on play if empty!
      btnTryDemo.click();
      return;
    }
    audioEngine.togglePlay();
  });

  audioEngine.onStateChange = (playing) => {
    btnPlayPause.classList.toggle('playing', playing);
    playIcon.textContent = playing ? '⏸' : '▶';
    const textEl = btnPlayPause.querySelector('.btn-label');
    if (textEl) {
      textEl.textContent = playing ? I18N.t('pause') : I18N.t('play');
    }
  };

  btnPlaySelection.addEventListener('click', () => {
    if (!audioEngine.audioBuffer) return;
    audioEngine.play(audioEngine.trimStart);
  });

  // Timeline Interactions
  timelineCanvas.addEventListener('click', (e) => {
    if (audioEngine.duration <= 0) return;
    const rect = timelineCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * audioEngine.duration;
    audioEngine.seek(targetTime);
  });

  // Trim Inputs
  trimStartInput.addEventListener('change', () => {
    const s = parseFloat(trimStartInput.value) || 0;
    audioEngine.setTrim(s, audioEngine.trimEnd);
    updateTrimUI();
  });

  trimEndInput.addEventListener('change', () => {
    const e = parseFloat(trimEndInput.value) || audioEngine.duration;
    audioEngine.setTrim(audioEngine.trimStart, e);
    updateTrimUI();
  });

  btnResetTrim.addEventListener('click', () => {
    audioEngine.setTrim(0, audioEngine.duration);
    updateTrimUI();
  });

  // Aspect Ratio Selection
  document.querySelectorAll('[data-ratio]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ratioId = btn.getAttribute('data-ratio');
      applyRatio(ratioId);
    });
  });

  // Style Selection
  document.querySelectorAll('[data-style]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const styleId = btn.getAttribute('data-style');
      renderer.setStyle(styleId);
      document.querySelectorAll('[data-style]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-style') === styleId);
      });
    });
  });

  // Color Theme Selection
  document.querySelectorAll('[data-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const themeId = btn.getAttribute('data-theme');
      renderer.setTheme(themeId);
      document.querySelectorAll('[data-theme]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-theme') === themeId);
      });
      drawTimelineWaveform();
    });
  });

  // Background Mode Selection
  document.querySelectorAll('[data-bg]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bgId = btn.getAttribute('data-bg');
      renderer.setBgMode(bgId);
      document.querySelectorAll('[data-bg]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-bg') === bgId);
      });

      const customBgControls = document.getElementById('custom-bg-controls');
      if (customBgControls) {
        customBgControls.style.display = bgId === 'custom-image' ? 'block' : 'none';
      }
    });
  });

  // Custom Background Upload
  bgFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          renderer.setCustomBgImage(img);
          renderer.setBgMode('custom-image');
          document.querySelector('[data-bg="custom-image"]')?.click();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Custom Vinyl Cover Upload
  coverFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          renderer.setCoverImage(img);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('btn-remove-cover')?.addEventListener('click', () => {
    renderer.setCoverImage(null);
    coverFileInput.value = '';
  });

  // Sliders & Toggles
  sliderBgBlur.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valBgBlur.textContent = `${val}px`;
    renderer.bgBlur = val;
  });

  sliderBgVignette.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valBgVignette.textContent = `${val}%`;
    renderer.bgVignette = val;
  });

  sliderSensitivity.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    valSensitivity.textContent = `${val.toFixed(1)}x`;
    audioEngine.setGain(val);
  });

  toggleCover.addEventListener('change', (e) => {
    renderer.showCover = e.target.checked;
  });

  toggleTimecode.addEventListener('change', (e) => {
    renderer.showTimecode = e.target.checked;
  });

  toggleWatermark.addEventListener('change', (e) => {
    renderer.showWatermark = e.target.checked;
  });

  // Typography Inputs
  inputTitle.addEventListener('input', (e) => {
    renderer.title = e.target.value;
  });

  inputAuthor.addEventListener('input', (e) => {
    renderer.author = e.target.value;
  });

  // Export Flow
  btnExport.addEventListener('click', async () => {
    if (!audioEngine.audioBuffer) {
      alert(I18N.t('readyToPlay'));
      return;
    }

    exportModal.classList.add('open');
    exportProgressFill.style.width = '0%';
    exportProgressText.textContent = '0%';
    exportEtaText.textContent = '--';
    exportSuccessBox.style.display = 'none';
    btnCancelExport.style.display = 'inline-flex';

    exporter.onProgress = ({ progress, etaSec }) => {
      const pct = Math.round(progress * 100);
      exportProgressFill.style.width = `${pct}%`;
      exportProgressText.textContent = `${pct}%`;
      exportEtaText.textContent = `${etaSec}s`;
    };

    try {
      exportedVideoResult = await exporter.startExport();
      exportSuccessBox.style.display = 'block';
      btnCancelExport.style.display = 'none';
    } catch (err) {
      if (err.message !== 'Cancelled') {
        console.error(err);
        alert(I18N.t('recordingFailed'));
        exportModal.classList.remove('open');
      }
    }
  });

  btnCancelExport.addEventListener('click', () => {
    exporter.cancel();
    exportModal.classList.remove('open');
  });

  btnDownloadVideo.addEventListener('click', () => {
    if (exportedVideoResult) {
      VideoExporter.downloadBlob(exportedVideoResult.blob, exportedVideoResult.fileName);
    }
  });

  btnCloseModal.addEventListener('click', () => {
    exportModal.classList.remove('open');
  });

  // Keyboard Shortcuts (Space for Play/Pause)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      btnPlayPause.click();
    }
  });

  // Language Switch
  btnLangZh.addEventListener('click', () => {
    I18N.setLang('zh');
    btnLangZh.classList.add('active');
    btnLangEn.classList.remove('active');
  });

  btnLangEn.addEventListener('click', () => {
    I18N.setLang('en');
    btnLangEn.classList.add('active');
    btnLangZh.classList.remove('active');
  });

  window.addEventListener('languagechange', (e) => {
    const lang = e.detail.lang;
    btnLangZh.classList.toggle('active', lang === 'zh');
    btnLangEn.classList.toggle('active', lang === 'en');
  });

  // Window resize handler for timeline redraw
  window.addEventListener('resize', () => {
    drawTimelineWaveform();
  });
});
