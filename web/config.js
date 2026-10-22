/**
 * KenEasy WaveForge - Configuration & Presets
 * Strictly declarative data layer
 */

const CONFIG = {
  APP: {
    NAME: 'KenEasy WaveForge',
    VERSION: '1.1.0',
    STORAGE_PREFIX: 'keneasy_waveforge_',
    REPO_URL: 'https://github.com/ngiken/KenEasy-WaveForge',
  },

  LIMITS: {
    MAX_AUDIO_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
    SUPPORTED_AUDIO_EXTENSIONS: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
    DEFAULT_DURATION_MAX_SEC: 600, // 10 minutes max recommended
    DEFAULT_TRIM_MIN_SEC: 3, // min 3s clip
  },

  ASPECT_RATIOS: {
    '9:16': {
      id: '9:16',
      labelKey: 'ratio_portrait',
      descKey: 'ratio_portrait_desc',
      width: 1080,
      height: 1920,
      icon: '📱',
      tag: 'Shorts/TikTok/Xiaohongshu',
    },
    '16:9': {
      id: '16:9',
      labelKey: 'ratio_landscape',
      descKey: 'ratio_landscape_desc',
      width: 1920,
      height: 1080,
      icon: '🖥️',
      tag: 'Bilibili/YouTube',
    },
    '1:1': {
      id: '1:1',
      labelKey: 'ratio_square',
      descKey: 'ratio_square_desc',
      width: 1080,
      height: 1080,
      icon: '🔲',
      tag: 'Instagram/Feed',
    },
  },

  WAVE_STYLES: {
    bars: {
      id: 'bars',
      labelKey: 'style_bars',
      descKey: 'style_bars_desc',
      icon: '📊',
      barCount: 64,
      barGap: 3,
      showReflection: true,
      showPeakDots: true,
    },
    wave: {
      id: 'wave',
      labelKey: 'style_wave',
      descKey: 'style_wave_desc',
      icon: '🌊',
      pointCount: 128,
      mirror: true,
      lineWidth: 3,
    },
    radial: {
      id: 'radial',
      labelKey: 'style_radial',
      descKey: 'style_radial_desc',
      icon: '💿',
      barCount: 96,
      innerRadiusRatio: 0.22,
      rotateSpeed: 0.005,
    },
    ribbon: {
      id: 'ribbon',
      labelKey: 'style_ribbon',
      descKey: 'style_ribbon_desc',
      icon: '✨',
      layers: 3,
      flowSpeed: 0.02,
    },
  },

  COLOR_THEMES: {
    'pink-cyan': {
      id: 'pink-cyan',
      nameKey: 'theme_pink_cyan',
      primary: '#fb7299',
      secondary: '#00aeec',
      accent: '#ff4f7e',
      gradient: ['#fb7299', '#00aeec'],
    },
    'emerald-aurora': {
      id: 'emerald-aurora',
      nameKey: 'theme_emerald_aurora',
      primary: '#10b981',
      secondary: '#00aeec',
      accent: '#059669',
      gradient: ['#10b981', '#00aeec'],
    },
    'sunset-fire': {
      id: 'sunset-fire',
      nameKey: 'theme_sunset_fire',
      primary: '#ff5858',
      secondary: '#f09819',
      accent: '#ff416c',
      gradient: ['#ff5858', '#f09819'],
    },
    'cyber-purple': {
      id: 'cyber-purple',
      nameKey: 'theme_cyber_purple',
      primary: '#b827fc',
      secondary: '#2c90fc',
      accent: '#f355da',
      gradient: ['#b827fc', '#2c90fc'],
    },
    'mono-gold': {
      id: 'mono-gold',
      nameKey: 'theme_mono_gold',
      primary: '#ffd700',
      secondary: '#ffa500',
      accent: '#ffb703',
      gradient: ['#ffd700', '#ffa500'],
    },
  },

  BACKGROUND_MODES: {
    'dark-glass': {
      id: 'dark-glass',
      nameKey: 'bg_dark_glass',
      type: 'procedural',
    },
    'neon-vortex': {
      id: 'neon-vortex',
      nameKey: 'bg_neon_vortex',
      type: 'procedural',
    },
    'custom-image': {
      id: 'custom-image',
      nameKey: 'bg_custom_image',
      type: 'image',
    },
  },

  DEFAULTS: {
    aspectRatio: '9:16',
    waveStyle: 'bars',
    colorTheme: 'pink-cyan',
    backgroundMode: 'dark-glass',
    bgBlur: 10,
    bgVignette: 60,
    titleText: 'KenEasy Soundscape',
    authorText: 'Audio Visualizer',
    showTimecode: true,
    showCover: true,
    showBrandWatermark: true,
    audioGain: 1.0,
    fftSize: 1024,
    smoothingTimeConstant: 0.82,
    videoFps: 60,
    videoBitrateBps: 8000000, // 8 Mbps for sharp 1080p
  },
};

if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
