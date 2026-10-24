/**
 * KenEasy WaveForge - Application Orchestrator (v1.1.0 High-Fidelity Edition)
 * Connects DOM events, AudioEngine, VisualizerRenderer, VideoExporter,
 * interactive dual-handle timeline, ObjectURL memory management, and Glass Toast system.
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
  const syncLangUI = (lang = I18N.currentLang) => {
    btnLangZh.classList.toggle('active', lang === 'zh');
    btnLangEn.classList.toggle('active', lang === 'en');
  };
  syncLangUI();

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

  // Timeline & Dual-Handle Trimming Elements
  const timelineWrapper = document.getElementById('timeline-wrapper');
  const timelineCanvas = document.getElementById('timeline-canvas');
  const trimMaskStart = document.getElementById('trim-mask-start');
  const trimMaskEnd = document.getElementById('trim-mask-end');
  const trimHandleStart = document.getElementById('trim-handle-start');
  const trimHandleEnd = document.getElementById('trim-handle-end');
  const timelinePlayhead = document.getElementById('timeline-playhead');

  const trimStartInput = document.getElementById('trim-start');
  const trimEndInput = document.getElementById('trim-end');
  const trimDurationDisplay = document.getElementById('trim-duration-display');
  const btnResetTrim = document.getElementById('btn-reset-trim');
  const btnPlaySelection = document.getElementById('btn-play-selection');

  // Export Modal & PiP
  const exportModal = document.getElementById('export-modal');
  const pipCanvas = document.getElementById('pip-canvas');
  const exportProgressFill = document.getElementById('export-progress-fill');
  const exportProgressText = document.getElementById('export-progress-text');
  const exportEtaText = document.getElementById('export-eta-text');
  const btnCancelExport = document.getElementById('btn-cancel-export');
  const exportSuccessBox = document.getElementById('export-success-box');
  const btnDownloadVideo = document.getElementById('btn-download-video');
  const btnCloseModal = document.getElementById('btn-close-modal');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // Audio Meta Info
  const audioInfoBar = document.getElementById('audio-info-bar');
  const audioNameEl = document.getElementById('audio-name');
  const audioDurationEl = document.getElementById('audio-duration');
  const btnClearAudio = document.getElementById('btn-clear-audio');

  // ObjectURL Memory Trackers
  let currentBgObjectUrl = null;
  let currentCoverObjectUrl = null;
  let exportedVideoResult = null;

  // 3. Engine Instances
  const audioEngine = new AudioEngine();
  const renderer = new VisualizerRenderer(canvas);
  window.audioEngine = audioEngine;
  window.renderer = renderer;
  const exporter = new VideoExporter({
    canvas,
    audioEngine,
    renderer,
    pipCanvas,
  });

  // 4. Glass Toast Helper
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `glass-toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;
    const icon = type === 'error' ? '⚠️' : type === 'success' ? '✨' : '💡';
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 320);
    }, 3200);
  }

  // 5. Set Initial Setup
  function applyRatio(ratioId) {
    const config = CONFIG.ASPECT_RATIOS[ratioId] || CONFIG.ASPECT_RATIOS['9:16'];
    renderer.setDimensions(config.width, config.height, ratioId);

    // Update Preview Container Aspect Ratio
    previewWrapper.setAttribute('data-ratio', ratioId);
    previewWrapper.style.aspectRatio = `${config.width} / ${config.height}`;

    // Active pill button state
    document.querySelectorAll('[data-ratio]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-ratio') === ratioId);
    });
  }

  applyRatio('9:16');

  // 6. Main Canvas Animation Loop with Battery/Background Conservation
  let isPageVisible = true;
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
  });

  function animationLoop() {
    // In background tab and paused: throttle loop to save CPU/battery
    if (!isPageVisible && !audioEngine.isPlaying && !exporter.isRecording) {
      setTimeout(() => requestAnimationFrame(animationLoop), 250);
      return;
    }

    const freqData = audioEngine.getFrequencyData();
    const timeData = renderer.waveStyleId === 'wave' ? audioEngine.getTimeDomainData() : null;
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

    // Update Timeline Playhead position
    if (audioEngine.duration > 0 && !activeHandle) {
      updateTimelinePlayhead(currentTime);
    }

    requestAnimationFrame(animationLoop);
  }
  requestAnimationFrame(animationLoop);

  // 7. Timeline Waveform & Dual-Handle Interactive Trimming
  function drawTimelineWaveform() {
    if (!timelineCanvas) return;
    const ctx = timelineCanvas.getContext('2d');
    const w = timelineCanvas.width = timelineCanvas.parentElement.clientWidth || 300;
    const h = timelineCanvas.height = 52;

    ctx.fillStyle = 'rgba(24, 27, 33, 0.75)';
    ctx.fillRect(0, 0, w, h);

    const peaks = audioEngine.peaks;
    if (!peaks || peaks.length === 0) {
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

    // Waveform peak bars
    ctx.fillStyle = `${theme.primary}aa`;
    for (let i = 0; i < peaks.length; i++) {
      const barH = Math.max(2, peaks[i] * (h * 0.82));
      const x = i * barW;
      const y = (h - barH) / 2;
      ctx.fillRect(x, y, barW - 1, barH);
    }

    updateHandlesFromEngine();
  }

  function updateHandlesFromEngine() {
    if (audioEngine.duration <= 0) {
      trimMaskStart.style.width = '0%';
      trimMaskEnd.style.width = '0%';
      trimHandleStart.style.left = '0%';
      trimHandleEnd.style.left = '100%';
      return;
    }

    const startPct = (audioEngine.trimStart / audioEngine.duration) * 100;
    const endPct = (audioEngine.trimEnd / audioEngine.duration) * 100;

    trimMaskStart.style.width = `${startPct}%`;
    trimMaskEnd.style.width = `${100 - endPct}%`;
    trimHandleStart.style.left = `${startPct}%`;
    trimHandleEnd.style.left = `${endPct}%`;
  }

  let lastPlayheadPct = -1;
  function updateTimelinePlayhead(currentTime) {
    if (!timelinePlayhead || audioEngine.duration <= 0) return;
    const playheadPct = Math.min(100, Math.max(0, (currentTime / audioEngine.duration) * 100));
    if (Math.abs(playheadPct - lastPlayheadPct) > 0.05) {
      timelinePlayhead.style.left = `${playheadPct}%`;
      lastPlayheadPct = playheadPct;
    }
  }

  function updateTrimUI() {
    const start = audioEngine.trimStart;
    const end = audioEngine.trimEnd;
    const dur = Math.max(0, end - start);

    trimStartInput.value = start.toFixed(1);
    trimEndInput.value = end.toFixed(1);
    trimDurationDisplay.textContent = `${dur.toFixed(1)}s`;
    updateHandlesFromEngine();
  }

  // Dual-Handle Dragging State Machine
  let activeHandle = null; // 'start' | 'end'

  function onHandlePointerDown(handleType, e) {
    if (audioEngine.duration <= 0) return;
    e.preventDefault();
    e.stopPropagation();
    activeHandle = handleType; timelineWrapper._cachedRect = timelineWrapper.getBoundingClientRect();

    if (handleType === 'start') trimHandleStart.classList.add('dragging');
    if (handleType === 'end') trimHandleEnd.classList.add('dragging');

    window.addEventListener('pointermove', onHandlePointerMove);
    window.addEventListener('pointerup', onHandlePointerUp);
  }

  function onHandlePointerMove(e) {
    if (!activeHandle || audioEngine.duration <= 0) return;
    const rect = timelineWrapper._cachedRect || timelineWrapper.getBoundingClientRect();
    const clientX = e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = ratio * audioEngine.duration;

    if (activeHandle === 'start') {
      const safeEnd = Math.max(0, audioEngine.trimEnd - 0.2);
      const newStart = Math.min(targetTime, safeEnd);
      audioEngine.setTrim(newStart, audioEngine.trimEnd);
    } else if (activeHandle === 'end') {
      const safeStart = Math.min(audioEngine.duration - 0.5, audioEngine.trimStart + 0.5);
      const newEnd = Math.max(targetTime, safeStart);
      audioEngine.setTrim(audioEngine.trimStart, newEnd);
    }

    updateTrimUI();
  }

  function onHandlePointerUp() {
    if (!activeHandle) return;
    trimHandleStart.classList.remove('dragging');
    trimHandleEnd.classList.remove('dragging');
    activeHandle = null;
    window.removeEventListener('pointermove', onHandlePointerMove);
    window.removeEventListener('pointerup', onHandlePointerUp);
  }

  trimHandleStart.addEventListener('pointerdown', (e) => onHandlePointerDown('start', e));
  trimHandleEnd.addEventListener('pointerdown', (e) => onHandlePointerDown('end', e));

  // Click on timeline seeks playback
  timelineWrapper.addEventListener('click', (e) => {
    if (e.target.closest('.trim-handle')) return;
    if (audioEngine.duration <= 0) return;
    const rect = timelineWrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * audioEngine.duration;
    audioEngine.seek(targetTime);
    updateTimelinePlayhead(targetTime);
  });

  // 8. Load Audio Handlers
  async function handleAudioLoad(meta) {
    audioNameEl.textContent = meta.fileName;
    audioDurationEl.textContent = renderer.formatTime(meta.duration);
    audioInfoBar.style.display = 'flex';
    fileDropZone.classList.add('has-file');

    inputTitle.value = meta.fileName;
    renderer.title = inputTitle.value;

    updateTrimUI();
    drawTimelineWaveform();
  }

  async function loadFile(file) {
    if (!file) return;
    const exts = (window.CONFIG?.LIMITS?.SUPPORTED_AUDIO_EXTENSIONS) || ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
    const validExt = exts.some(ext => (file.name || '').toLowerCase().endsWith(ext));
    if (!file.type.startsWith('audio/') && !validExt) {
      showToast(I18N.t('formatNotSupported'), 'error');
      return;
    }
    const maxLimit = (window.CONFIG && CONFIG.LIMITS && CONFIG.LIMITS.MAX_AUDIO_SIZE_BYTES) || (100 * 1024 * 1024);
    if (file.size > maxLimit) {
      audioFileInput.value = '';
      showToast(I18N.t('sizeExceeded'), 'error');
      return;
    }
    try {
      fileDropZone.classList.add('loading');
      const meta = await audioEngine.loadAudioFile(file);
      await handleAudioLoad(meta);
      showToast(`${I18N.t('audioLoaded')}: ${meta.fileName}`, 'success');
    } catch (err) {
      console.error(err);
      showToast(I18N.t('formatNotSupported'), 'error');
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
      showToast(I18N.t('demoReady'), 'success');
    } catch (e) {
      console.error(e);
      showToast(I18N.t('errorSynthesizeDemo'), 'error');
    } finally {
      btnTryDemo.disabled = false;
      btnTryDemo.textContent = I18N.t('tryDemo');
    }
  });

  // Drag and Drop
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  fileDropZone.addEventListener('click', (e) => {
    if (e.target === audioFileInput || e.target.closest('#btn-try-demo')) return;
    audioFileInput.click();
  });

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
    audioEngine.reset();
    inputTitle.value = '';
    renderer.title = '';
    updateTrimUI();
    updateTimelinePlayhead(0);
    audioInfoBar.style.display = 'none';
    fileDropZone.classList.remove('has-file');
    audioFileInput.value = '';
    drawTimelineWaveform();
  });

  // Play / Pause Controls
  btnPlayPause.addEventListener('click', () => {
    if (!audioEngine.audioBuffer) {
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
      textEl.setAttribute('data-i18n', playing ? 'pause' : 'play');
      textEl.textContent = playing ? I18N.t('pause') : I18N.t('play');
    }
  };

  btnPlaySelection.addEventListener('click', (e) => {
    e.preventDefault();
    if (!audioEngine.audioBuffer) {
      showToast(I18N.t('toastNoAudio'), 'error');
      return;
    }
    audioEngine.play(audioEngine.trimStart);
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

  // Color Theme Selection (Supports 5 themes including mono-gold)
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

  // Background Mode Selection (dark-glass, neon-vortex, custom-image)
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

  // Custom Background Upload with ObjectURL Memory Management
  // Architecture: Decouple view trigger for background upload
  const btnUploadBg = document.getElementById('btn-upload-bg');
  btnUploadBg?.addEventListener('click', () => {
    bgFileInput?.click();
  });

  bgFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!isSafeImg(file)) {
        bgFileInput.value = '';
        showToast(I18N.t('formatNotSupported'), 'error');
        return;
      }
      if (currentBgObjectUrl) URL.revokeObjectURL(currentBgObjectUrl);
      currentBgObjectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        renderer.setCustomBgImage(img);
        renderer.setBgMode('custom-image');
        document.querySelector('[data-bg="custom-image"]')?.click();
      };
      img.onerror = () => {
        showToast(I18N.t('formatNotSupported'), 'error');
      };
      img.src = currentBgObjectUrl;
    }
  });

  // Custom Vinyl Cover Upload with ObjectURL Memory Management
  document.getElementById('btn-upload-cover')?.addEventListener('click', () => {
    coverFileInput?.click();
  });
  const isSafeImg = (f) => f && ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 20 * 1024 * 1024;
  coverFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!isSafeImg(file)) { showToast(I18N.t('formatNotSupported'), 'error'); return; }
      if (currentCoverObjectUrl) URL.revokeObjectURL(currentCoverObjectUrl);
      currentCoverObjectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => renderer.setCoverImage(img);
      img.onerror = () => {
        if (currentCoverObjectUrl) { URL.revokeObjectURL(currentCoverObjectUrl); currentCoverObjectUrl = null; }
        showToast(I18N.t('formatNotSupported'), 'error');
      };
      img.src = currentCoverObjectUrl;
    }
  });

  document.getElementById('btn-remove-cover')?.addEventListener('click', () => {
    if (currentCoverObjectUrl) {
      URL.revokeObjectURL(currentCoverObjectUrl);
      currentCoverObjectUrl = null;
    }
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
    renderer.visualGain = val;
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
      showToast(I18N.t('toastNoAudio'), 'error');
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
      exportProgressFill.style.width = '100%';
      exportProgressText.textContent = '100%';
      exportEtaText.textContent = '0s';
      exportSuccessBox.style.display = 'block';
      btnCancelExport.style.display = 'none';
      showToast(I18N.t('toastExportReady'), 'success');
    } catch (err) {
      if (err.message !== 'Cancelled') {
        console.error(err);
        showToast(I18N.t('recordingFailed'), 'error');
        exportModal.classList.remove('open');
      }
    }
  });

  btnCancelExport.addEventListener('click', () => {
    exporter.cancel();
    exportModal.classList.remove('open');
    showToast(I18N.t('exportCancelled'), 'info');
  });

  btnDownloadVideo.addEventListener('click', () => {
    if (exportedVideoResult) {
      VideoExporter.downloadBlob(exportedVideoResult.blob, exportedVideoResult.fileName);
    }
  });

  btnCloseModal.addEventListener('click', () => {
    if (exporter.isRecording) exporter.cancel();
    exportModal.classList.remove('open');
  });

  // Ecosystem Matrix Modal
  const btnMatrix = document.getElementById('btn-ecosystem-matrix');
  const matrixModal = document.getElementById('matrix-modal');
  const btnCloseMatrix = document.getElementById('btn-close-matrix');
  const btnCloseMatrixFooter = document.getElementById('btn-close-matrix-footer');

  if (btnMatrix && matrixModal) {
    btnMatrix.addEventListener('click', () => {
      matrixModal.classList.add('open');
    });
    if (btnCloseMatrix) {
      btnCloseMatrix.addEventListener('click', () => {
        matrixModal.classList.remove('open');
      });
    }
    if (btnCloseMatrixFooter) {
      btnCloseMatrixFooter.addEventListener('click', () => {
        matrixModal.classList.remove('open');
      });
    }
    matrixModal.addEventListener('click', (e) => {
      if (e.target === matrixModal) {
        matrixModal.classList.remove('open');
      }
    });
  }

  // Keyboard Shortcuts (Space for Play/Pause)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      if (matrixModal && matrixModal.classList.contains('open')) {
        matrixModal.classList.remove('open');
      }
      if (exportModal && exportModal.classList.contains('open') && !exporter.isRecording) {
        exportModal.classList.remove('open');
      }
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
    if (exportModal && exportModal.classList.contains('open')) return;
    if (matrixModal && matrixModal.classList.contains('open')) return;
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
    if (audioEngine.onStateChange) audioEngine.onStateChange(audioEngine.isPlaying);
  });

  // Window resize handler for timeline redraw
  let resizeRaf = null;
  window.addEventListener('resize', () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => drawTimelineWaveform());
  });
});
