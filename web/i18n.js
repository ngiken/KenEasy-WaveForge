/**
 * KenEasy WaveForge - Internationalization (i18n)
 * Bilingual support (zh / en)
 */

const I18N = {
  currentLang: 'zh',

  locales: {
    zh: {
      appName: 'KenEasy 声波工坊',
      appSubtitle: '极速纯前端音频可视化与动态波形短视频生成器',
      tagline: '本地离线运行 · 零隐私泄漏 · 4K/1080P 超清音画导出',

      // Navigation / Actions
      tryDemo: '试听示例曲目',
      uploadAudio: '选择或拖拽音频文件',
      uploadCover: '上传封面图',
      removeCover: '移除封面',
      clearAudio: '清空音频',
      play: '播放预览',
      pause: '暂停',
      exportVideo: '导出波形视频',
      exporting: '正在渲染导出视频...',
      cancelExport: '取消导出',
      downloadReady: '视频生成完成，点击下载',
      githubLink: 'GitHub 仓库',

      // Panels & Sections
      sectionAudio: '音频导入与试听',
      sectionRatio: '画幅比例与平台',
      sectionStyle: '波形动态样式',
      sectionTheme: '霓虹配色方案',
      sectionBackground: '背景与视觉氛围',
      sectionText: '文本与封面标语',
      sectionTrim: '片段裁剪与时间轴',

      // Ratios
      ratio_portrait: '9:16 竖屏',
      ratio_portrait_desc: '适合 抖音 / 小红书 / TikTok / Shorts',
      ratio_landscape: '16:9 横屏',
      ratio_landscape_desc: '适合 Bilibili / YouTube / 宽屏演示',
      ratio_square: '1:1 方形',
      ratio_square_desc: '适合 唱片封面 / 即刻 / 朋友圈 / Feed',

      // Wave Styles
      style_bars: '光谱柱状 (Bars)',
      style_bars_desc: '经典律动均衡器，带倒影与顶端浮点',
      style_wave: '对称波浪 (Wave)',
      style_wave_desc: '双面对称脉冲，具呼吸感的荧光流体',
      style_radial: '黑胶唱片 (Vinyl)',
      style_radial_desc: '旋转黑胶封套，向外放射动感粒子环',
      style_ribbon: '霓虹丝带 (Ribbon)',
      style_ribbon_desc: '多层贝塞尔交织波，流光溢彩',

      // Color Themes
      theme_pink_cyan: 'KenEasy 粉蓝 (官方经典)',
      theme_emerald_aurora: '极光翠绿 (清新高雅)',
      theme_sunset_fire: '落日熔金 (热情活力)',
      theme_cyber_purple: '赛博霓虹 (电音未来)',
      theme_mono_gold: '黑金至尊 (奢华质感)',

      // Backgrounds
      bg_dark_glass: '深空微光 (深色磨砂)',
      bg_neon_vortex: '霓虹漩涡 (动态微光)',
      bg_custom_image: '自定义壁纸 / 封面',

      // Controls & Sliders
      bgBlur: '背景模糊度',
      bgVignette: '暗角阴影深度',
      titleLabel: '视频主标题',
      titlePlaceholder: '例如：夜航星 / Night Flight',
      authorLabel: '副标题 / 艺术家',
      authorPlaceholder: '例如：KenEasy Soundscape',
      showTimecode: '显示实时时间码',
      showCover: '中心显示黑胶封面',
      showBrandWatermark: '显示优雅系列水印',
      audioGain: '频谱灵敏度',

      // Trimming
      trimTitle: '音频片段选择 (导出截取)',
      timelineHint: '拖动两端高亮手柄自由截取片段，点击波形快速跳转播放。',
      uploadBg: '🖼️ 上传背景图片',
      toastNoAudio: '请先导入音频或点击「试听示例」！',
      toastExportReady: '🎉 视频已成功生成，开始下载！',
      pipLivePreview: '实时录制画面 (画中画)',
      trimStart: '起始时间',
      trimEnd: '结束时间',
      trimDuration: '截取总时长',
      playSelection: '试听截取片段',
      resetTrim: '重置全曲',

      // Export Modal
      exportModalTitle: '正在生成高清视频',
      exportModalDesc: '使用原生 WebCodecs / MediaRecorder 硬件加速，纯本地渲染合成...',
      exportProgress: '渲染进度',
      exportEstimate: '预估剩余时间',
      exportTip: '导出过程中请保持页面在前台，切勿关闭窗口。',
      exportSuccessTitle: '🎉 视频导出成功！',
      exportSuccessDesc: '音画合一视频已准备好，点击下方按钮保存。',
      downloadBtn: '立即下载视频',
      closeModal: '关闭',

      // Status & Messages
      dragDropHint: '拖放音频文件至此处，支持 MP3 / WAV / FLAC / AAC / M4A',
      audioLoaded: '音频已就绪',
      generatingDemo: '正在合成内置 Lo-Fi 动感音轨...',
      demoReady: '内置 Lo-Fi 示范音轨已载入！点击播放查看跳动',
      errorSynthesizeDemo: '合成示范音轨发生错误，请重试。',
      formatNotSupported: '不支持该音频格式，请上传标准音频文件。',
      sizeExceeded: '音频文件过大，建议上传小于 100MB 的文件。',
      exportCancelled: '导出已取消。',
      recordingFailed: '视频录制发生错误，请重试。',
      readyToPlay: '就绪，点击播放',
      playing: '正在播放',
      paused: '已暂停',
    },

    en: {
      appName: 'KenEasy WaveForge',
      appSubtitle: 'Pure Client-Side Audio Visualizer & Video Generator',
      tagline: '100% Local & Offline · Zero Data Leakage · Crisp 1080P/4K Video Export',

      // Navigation / Actions
      tryDemo: 'Play Demo Track',
      uploadAudio: 'Choose or Drop Audio',
      uploadCover: 'Upload Cover Image',
      removeCover: 'Remove Cover',
      clearAudio: 'Clear Audio',
      play: 'Play Preview',
      pause: 'Pause',
      exportVideo: 'Export Wave Video',
      exporting: 'Rendering & Exporting Video...',
      cancelExport: 'Cancel Export',
      downloadReady: 'Video Ready, Click to Download',
      githubLink: 'GitHub Repository',

      // Panels & Sections
      sectionAudio: 'Audio Import & Demo',
      sectionRatio: 'Aspect Ratio & Platform',
      sectionStyle: 'Wave Visualizer Style',
      sectionTheme: 'Color Palette',
      sectionBackground: 'Background Atmosphere',
      sectionText: 'Typography & Cover Art',
      sectionTrim: 'Timeline & Audio Trimming',

      // Ratios
      ratio_portrait: '9:16 Portrait',
      ratio_portrait_desc: 'Perfect for TikTok / Shorts / Reels',
      ratio_landscape: '16:9 Landscape',
      ratio_landscape_desc: 'Perfect for YouTube / Bilibili / Desktop',
      ratio_square: '1:1 Square',
      ratio_square_desc: 'Perfect for Vinyl Art / Feeds / Instagram',

      // Wave Styles
      style_bars: 'Spectrum Bars',
      style_bars_desc: 'Classic equalizer bars with peak dots and reflection',
      style_wave: 'Mirrored Wave',
      style_wave_desc: 'Symmetric dual-edge pulse with glowing fluid curves',
      style_radial: 'Vinyl Radial',
      style_radial_desc: 'Spinning album sleeve with radiating audio particle ring',
      style_ribbon: 'Neon Ribbon',
      style_ribbon_desc: 'Flowing multi-layer bezier ribbon with vibrant sheen',

      // Color Themes
      theme_pink_cyan: 'KenEasy Pink-Cyan (Signature)',
      theme_emerald_aurora: 'Emerald Aurora (Fresh & Elegant)',
      theme_sunset_fire: 'Sunset Flare (Warm & Passionate)',
      theme_cyber_purple: 'Cyber Neon (Futuristic Synthwave)',
      theme_mono_gold: 'Royal Gold (Luxury Metal)',

      // Backgrounds
      bg_dark_glass: 'Deep Void (Frosted Glass)',
      bg_neon_vortex: 'Neon Ambient (Dynamic Glow)',
      bg_custom_image: 'Custom Artwork / Photo',

      // Controls & Sliders
      bgBlur: 'Background Blur',
      bgVignette: 'Vignette Darkness',
      titleLabel: 'Primary Title',
      titlePlaceholder: 'e.g. Night Flight / Synth Echoes',
      authorLabel: 'Subtitle / Artist',
      authorPlaceholder: 'e.g. KenEasy Soundscape',
      showTimecode: 'Show Timecode',
      showCover: 'Show Vinyl Album Center',
      showBrandWatermark: 'Show Series Watermark',
      audioGain: 'Audio Sensitivity',

      // Trimming
      trimTitle: 'Clip Selection (Trim for Export)',
      timelineHint: 'Drag dual handles to trim clip seamlessly, or click waveform to seek.',
      uploadBg: '🖼️ Upload Custom Background',
      toastNoAudio: 'Please load audio or try the demo track first!',
      toastExportReady: '🎉 Video rendered successfully! Starting download.',
      pipLivePreview: 'Live Recording Stream (PiP)',
      trimStart: 'Start Time',
      trimEnd: 'End Time',
      trimDuration: 'Selected Duration',
      playSelection: 'Preview Selection',
      resetTrim: 'Reset Whole Track',

      // Export Modal
      exportModalTitle: 'Exporting High-Definition Video',
      exportModalDesc: 'Rendering frame-by-frame with hardware-accelerated MediaRecorder...',
      exportProgress: 'Rendering Progress',
      exportEstimate: 'Estimated Time Left',
      exportTip: 'Please keep this tab in foreground during export.',
      exportSuccessTitle: '🎉 Video Successfully Exported!',
      exportSuccessDesc: 'Your audio-visual masterpiece is ready to download.',
      downloadBtn: 'Download Video Now',
      closeModal: 'Close',

      // Status & Messages
      dragDropHint: 'Drag & drop an audio file here. Supports MP3, WAV, FLAC, AAC, M4A',
      audioLoaded: 'Audio Loaded and Ready',
      generatingDemo: 'Synthesizing built-in demo track...',
      demoReady: 'Demo Lo-Fi track synthesized! Click Play to watch waves.',
      errorSynthesizeDemo: 'Error synthesizing demo track, please retry.',
      formatNotSupported: 'Unsupported audio format. Please upload standard audio.',
      sizeExceeded: 'File is too large. Recommended under 100MB.',
      exportCancelled: 'Export cancelled.',
      recordingFailed: 'Video recording encountered an error, please retry.',
      readyToPlay: 'Ready, Click Play',
      playing: 'Playing',
      paused: 'Paused',
    },
  },

  init() {
    try {
      const saved = localStorage.getItem(`${CONFIG.APP.STORAGE_PREFIX}lang`);
      if (saved && (saved === 'zh' || saved === 'en')) {
        this.currentLang = saved;
      } else {
        const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        this.currentLang = navLang.startsWith('zh') ? 'zh' : 'en';
      }
    } catch (e) {
      this.currentLang = 'zh';
    }
    this.apply();
  },

  setLang(lang) {
    if (lang !== 'zh' && lang !== 'en') return;
    this.currentLang = lang;
    try {
      localStorage.setItem(`${CONFIG.APP.STORAGE_PREFIX}lang`, lang);
    } catch (e) {}
    this.apply();
  },

  t(key) {
    const dict = this.locales[this.currentLang] || this.locales.zh;
    return dict[key] || this.locales.en[key] || key;
  },

  apply() {
    document.documentElement.lang = this.currentLang;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = this.t(key);
      }
    });

    const titles = document.querySelectorAll('[data-i18n-title]');
    titles.forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.title = this.t(key);
      }
    });

    // Notify listeners
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: this.currentLang } }));
  },
};

if (typeof window !== 'undefined') {
  window.I18N = I18N;
}
