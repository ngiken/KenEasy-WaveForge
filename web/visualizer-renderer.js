/**
 * KenEasy WaveForge - Visualizer Renderer (v1.1.0 High-Fidelity Edition)
 * Multi-layer 60fps Canvas 2D Engine with procedural animations,
 * Bezier-smoothed waves, authentic vinyl with tonearm, dynamic typography fitting,
 * and adaptive aspect ratio responsiveness.
 */

class VisualizerRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });

    this.width = 1080;
    this.height = 1920;
    this.aspectRatioId = '9:16';
    this.waveStyleId = 'bars';
    this.themeId = 'pink-cyan';
    this.bgModeId = 'dark-glass';

    this.bgImage = null;
    this.coverImage = null;

    this.title = CONFIG.DEFAULTS.titleText;
    this.author = CONFIG.DEFAULTS.authorText;
    this.showTimecode = true;
    this.showCover = true;
    this.showWatermark = true;
    this.bgBlur = 10;
    this.bgVignette = 60;

    this.peakDrops = new Float32Array(160).fill(0);
    this.peakVelocities = new Float32Array(160).fill(0);
    this.rotationAngle = 0;
    this.ribbonPhase = 0;
    this.vortexAngle = 0;
    this.tonearmAngle = 0; // 0 = lifted, 0.32 = on disc

    this.bgParticles = [];
    this.initParticles();
  }

  initParticles() {
    this.bgParticles = [];
    for (let i = 0; i < 54; i++) {
      this.bgParticles.push({
        x: Math.random(),
        y: Math.random(),
        radius: Math.random() * 2.5 + 1.2,
        speedX: (Math.random() - 0.5) * 0.0004,
        speedY: (Math.random() - 0.5) * 0.0004,
        alpha: Math.random() * 0.45 + 0.15,
      });
    }
  }

  setDimensions(width, height, ratioId) {
    this.width = width;
    this.height = height;
    this.aspectRatioId = ratioId;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setTheme(themeId) {
    this.themeId = themeId;
  }

  setStyle(styleId) {
    this.waveStyleId = styleId;
  }

  setBgMode(bgModeId) {
    this.bgModeId = bgModeId;
  }

  setCustomBgImage(img) {
    this.bgImage = img;
  }

  setCoverImage(img) {
    this.coverImage = img;
  }

  getTheme() {
    return CONFIG.COLOR_THEMES[this.themeId] || CONFIG.COLOR_THEMES['pink-cyan'];
  }

  formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Main Render Loop Frame
   */
  renderFrame({ freqData, timeData, currentTime, duration, isPlaying }) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const theme = this.getTheme();

    // 1. Draw Background Layer (supports dark-glass, neon-vortex, custom-image)
    this.drawBackground(ctx, w, h, theme, isPlaying);

    // 2. Geometry for Central Vinyl / Cover Art
    let coverCenter = { x: w * 0.5, y: h * 0.44 };
    let coverRadius = Math.min(w, h) * 0.19;
    if (this.aspectRatioId === '16:9') {
      coverCenter = { x: w * 0.28, y: h * 0.5 };
      coverRadius = h * 0.25;
    } else if (this.aspectRatioId === '1:1') {
      coverCenter = { x: w * 0.5, y: h * 0.42 };
      coverRadius = w * 0.21;
    }

    if (this.showCover) {
      if (isPlaying) {
        this.rotationAngle += 0.007;
        // Smoothly lower tonearm to record
        this.tonearmAngle += (0.34 - this.tonearmAngle) * 0.08;
      } else {
        // Smoothly lift tonearm back
        this.tonearmAngle += (0.0 - this.tonearmAngle) * 0.08;
      }
      this.drawVinylCover(ctx, coverCenter.x, coverCenter.y, coverRadius, theme);
      this.drawTonearm(ctx, coverCenter.x, coverCenter.y, coverRadius);
    }

    // 3. Draw Selected Waveform Visualizer
    if (freqData) {
      this.drawWaveform(ctx, w, h, freqData, timeData, theme, coverCenter, coverRadius);
    }

    // 4. Draw Typography & Overlays (Auto-fit title bounds)
    this.drawOverlays(ctx, w, h, theme, currentTime, duration);
  }

  drawBackground(ctx, w, h, theme, isPlaying) {
    // Fill Base Dark
    ctx.fillStyle = '#0b0c0f';
    ctx.fillRect(0, 0, w, h);

    if (this.bgModeId === 'custom-image' && this.bgImage) {
      // Draw Custom Image with Cover Crop
      const img = this.bgImage;
      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let sw, sh, sx, sy;

      if (imgRatio > canvasRatio) {
        sh = img.height;
        sw = sh * canvasRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / canvasRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }

      ctx.save();
      if (this.bgBlur > 0) {
        ctx.filter = `blur(${this.bgBlur * 1.5}px) brightness(0.7)`;
      }
      ctx.drawImage(img, sx, sy, sw, sh, -10, -10, w + 20, h + 20);
      ctx.restore();
    } else if (this.bgModeId === 'neon-vortex') {
      // Atmospheric Neon Vortex Mode (Rotating multi-layer nebula swirls)
      if (isPlaying) {
        this.vortexAngle += 0.003;
      }
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(this.vortexAngle);

      // Swirling dual elliptical gradients
      const rad1 = Math.max(w, h) * 0.7;
      const vortexGrad1 = ctx.createRadialGradient(w * 0.15, h * 0.15, 20, 0, 0, rad1);
      vortexGrad1.addColorStop(0, `${theme.primary}33`);
      vortexGrad1.addColorStop(0.5, `${theme.secondary}1a`);
      vortexGrad1.addColorStop(1, 'transparent');
      ctx.fillStyle = vortexGrad1;
      ctx.fillRect(-rad1, -rad1, rad1 * 2, rad1 * 2);

      const vortexGrad2 = ctx.createRadialGradient(-w * 0.2, -h * 0.2, 30, 0, 0, rad1 * 0.85);
      vortexGrad2.addColorStop(0, `${theme.accent || theme.secondary}26`);
      vortexGrad2.addColorStop(1, 'transparent');
      ctx.fillStyle = vortexGrad2;
      ctx.fillRect(-rad1, -rad1, rad1 * 2, rad1 * 2);

      ctx.restore();

      // Ambient particle field
      this.drawFloatingParticles(ctx, w, h);
    } else {
      // Default: Deep Frosted Glass with Atmospheric Radial Glows
      const grad1 = ctx.createRadialGradient(w * 0.2, h * 0.25, 50, w * 0.2, h * 0.25, w * 0.85);
      grad1.addColorStop(0, `${theme.primary}24`);
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      const grad2 = ctx.createRadialGradient(w * 0.8, h * 0.75, 50, w * 0.8, h * 0.75, w * 0.85);
      grad2.addColorStop(0, `${theme.secondary}22`);
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);

      this.drawFloatingParticles(ctx, w, h);
    }

    // Vignette Overlay
    if (this.bgVignette > 0) {
      const maxDim = Math.max(w, h);
      const vigGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, maxDim * 0.75);
      const alpha = (this.bgVignette / 100) * 0.85;
      vigGrad.addColorStop(0, 'rgba(11, 12, 15, 0)');
      vigGrad.addColorStop(1, `rgba(11, 12, 15, ${alpha})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawFloatingParticles(ctx, w, h) {
    ctx.save();
    for (let p of this.bgParticles) {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Refined High-End Vinyl Disc with Micro-Grooves & Vintage Center Label
   */
  drawVinylCover(ctx, cx, cy, radius, theme) {
    ctx.save();
    ctx.translate(cx, cy);

    // 1. Vinyl Black Disc Outer Deep Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 42;
    ctx.shadowOffsetY = 18;

    ctx.fillStyle = '#0f1014';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // 2. Vinyl Micro Grooves (Subtle realistic concentric tracks)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.0;
    for (let r = radius * 0.56; r < radius * 0.96; r += radius * 0.045) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Double-Angle Radial Light Sheen (Simulates spinning vinyl reflections)
    ctx.save();
    ctx.rotate(this.rotationAngle * 0.5);
    const sheenGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
    sheenGrad.addColorStop(0.25, 'transparent');
    sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.09)');
    sheenGrad.addColorStop(0.75, 'transparent');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.07)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Center Rotating Label (Spins smoothly with rotationAngle)
    ctx.save();
    ctx.rotate(this.rotationAngle);

    const innerRadius = radius * 0.48;
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.clip();

    if (this.coverImage) {
      ctx.drawImage(this.coverImage, -innerRadius, -innerRadius, innerRadius * 2, innerRadius * 2);
    } else {
      // High-Fidelity Retro Vinyl Center Core
      const coreGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, innerRadius);
      coreGrad.addColorStop(0, '#1c1f26');
      coreGrad.addColorStop(0.7, '#13151b');
      coreGrad.addColorStop(1, '#0e1014');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(-innerRadius, -innerRadius, innerRadius * 2, innerRadius * 2);

      // Vintage Fine Gold/Brand Accent Rings
      ctx.strokeStyle = `${theme.primary}aa`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius * 0.88, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `${theme.secondary}66`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius * 0.82, 0, Math.PI * 2);
      ctx.stroke();

      // Top & Bottom Label Markings
      ctx.fillStyle = theme.secondary;
      ctx.font = `600 ${Math.round(innerRadius * 0.16)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('KENEASY STEREO', 0, -innerRadius * 0.52);

      ctx.fillStyle = '#8d9aa9';
      ctx.font = `500 ${Math.round(innerRadius * 0.12)}px system-ui, sans-serif`;
      ctx.fillText('33⅓ RPM · HI-FI', 0, innerRadius * 0.52);

      // Central Aesthetic Monogram Emblem
      ctx.fillStyle = theme.primary;
      ctx.font = `bold ${Math.round(innerRadius * 0.32)}px system-ui, sans-serif`;
      ctx.fillText('WF', 0, 0);
    }
    ctx.restore();

    // 5. Center Spindle Brass Bushing
    ctx.fillStyle = '#2d333b';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0b0c0f';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.035, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Realistic Tonearm with Smooth Lowering/Lifting Physics
   */
  drawTonearm(ctx, cx, cy, radius) {
    const pivotX = cx + radius * 1.15;
    const pivotY = cy - radius * 0.95;

    ctx.save();
    ctx.translate(pivotX, pivotY);

    // Tonearm base swivel angle: lifted (0.0) -> on record (0.34)
    const angle = 0.55 + this.tonearmAngle;
    ctx.rotate(angle);

    // 1. Arm Base / Gimbal Pivot
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#222730';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#444c56';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Counterweight
    ctx.fillStyle = '#57606a';
    ctx.fillRect(-radius * 0.07, -radius * 0.28, radius * 0.14, radius * 0.24);

    // 2. Tonearm Wand (Sleek brushed aluminum rod)
    const armLength = radius * 1.55;
    const armGrad = ctx.createLinearGradient(0, 0, 0, armLength);
    armGrad.addColorStop(0, '#8c959f');
    armGrad.addColorStop(0.5, '#d0d7de');
    armGrad.addColorStop(1, '#6e7781');

    ctx.strokeStyle = armGrad;
    ctx.lineWidth = Math.max(3, radius * 0.028);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Subtle S-shaped audiophile tonearm curve
    ctx.bezierCurveTo(radius * 0.08, armLength * 0.4, -radius * 0.04, armLength * 0.75, 0, armLength);
    ctx.stroke();

    // 3. Headshell and Cartridge Stylus
    ctx.save();
    ctx.translate(0, armLength);
    ctx.rotate(-0.25);

    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(-radius * 0.04, 0, radius * 0.08, radius * 0.2);

    // Stylus needle tip
    ctx.fillStyle = '#ff4f7e';
    ctx.fillRect(-radius * 0.015, radius * 0.18, radius * 0.03, radius * 0.06);

    ctx.restore();
    ctx.restore();
  }

  drawWaveform(ctx, w, h, freqData, timeData, theme, coverCenter, coverRadius) {
    switch (this.waveStyleId) {
      case 'bars':
        this.drawStyleBars(ctx, w, h, freqData, theme);
        break;
      case 'wave':
        this.drawStyleWave(ctx, w, h, timeData || freqData, theme);
        break;
      case 'radial':
        this.drawStyleRadial(ctx, w, h, freqData, theme, coverCenter, coverRadius);
        break;
      case 'ribbon':
        this.drawStyleRibbon(ctx, w, h, freqData, theme);
        break;
      default:
        this.drawStyleBars(ctx, w, h, freqData, theme);
    }
  }

  /**
   * Style: Adaptive Spectrum Bars (Responsive count: 84 on landscape, 56 on portrait)
   */
  drawStyleBars(ctx, w, h, freqData, theme) {
    const isLandscape = this.aspectRatioId === '16:9';
    const barCount = isLandscape ? 84 : 56;
    const startX = isLandscape ? w * 0.52 : w * 0.08;
    const usableWidth = isLandscape ? w * 0.42 : w * 0.84;
    const barWidth = (usableWidth / barCount) * 0.72;
    const gap = (usableWidth / barCount) * 0.28;
    const baselineY = isLandscape ? h * 0.78 : h * 0.74;
    const maxHeight = isLandscape ? h * 0.28 : h * 0.22;

    const barGrad = ctx.createLinearGradient(0, baselineY - maxHeight, 0, baselineY);
    barGrad.addColorStop(0, theme.secondary);
    barGrad.addColorStop(0.6, theme.primary);
    barGrad.addColorStop(1, `${theme.primary}44`);

    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor(Math.pow(i / barCount, 1.35) * (freqData.length * 0.75));
      const rawVal = freqData[freqIndex] || 0;
      const targetHeight = Math.max(6, (rawVal / 255) * maxHeight);

      const x = startX + i * (barWidth + gap);
      const y = baselineY - targetHeight;

      // Peak drop physics
      if (targetHeight >= this.peakDrops[i]) {
        this.peakDrops[i] = targetHeight;
        this.peakVelocities[i] = 0;
      } else {
        this.peakVelocities[i] += 0.45;
        this.peakDrops[i] = Math.max(0, this.peakDrops[i] - this.peakVelocities[i]);
      }

      // Draw Main Bar
      ctx.fillStyle = barGrad;
      this.drawRoundedRect(ctx, x, y, barWidth, targetHeight, barWidth * 0.4);
      ctx.fill();

      // Peak Dot
      const peakY = baselineY - this.peakDrops[i] - 5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, Math.max(baselineY - maxHeight - 12, peakY), barWidth, 3);

      // Reflection Bar
      const reflHeight = targetHeight * 0.28;
      const reflGrad = ctx.createLinearGradient(0, baselineY, 0, baselineY + reflHeight);
      reflGrad.addColorStop(0, `${theme.primary}55`);
      reflGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = reflGrad;
      this.drawRoundedRect(ctx, x, baselineY + 4, barWidth, reflHeight, barWidth * 0.3);
      ctx.fill();
    }
  }

  /**
   * Style: Symmetrical Neon Fluid Wave with High-Quality Bezier Smoothing
   */
  drawStyleWave(ctx, w, h, audioData, theme) {
    const isLandscape = this.aspectRatioId === '16:9';
    const centerY = isLandscape ? h * 0.74 : h * 0.72;
    const startX = isLandscape ? w * 0.52 : w * 0.06;
    const usableWidth = isLandscape ? w * 0.42 : w * 0.88;
    const pointsCount = 72;
    const step = usableWidth / (pointsCount - 1);
    const maxAmp = h * 0.16;

    // Build raw points
    const pts = [];
    for (let i = 0; i < pointsCount; i++) {
      const dataIdx = Math.floor((i / pointsCount) * (audioData.length * 0.5));
      const val = (audioData[dataIdx] || 128) / 255;
      const amp = Math.sin((i / pointsCount) * Math.PI) * Math.abs(val - 0.5) * 2 * maxAmp;
      pts.push({ x: startX + i * step, amp: Math.max(2, amp) });
    }

    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 18;

    // 1. Draw Top Smooth Bezier Wave
    ctx.strokeStyle = theme.primary;
    ctx.shadowColor = theme.secondary;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, centerY - pts[0].amp);
    for (let i = 0; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = centerY - (pts[i].amp + pts[i + 1].amp) / 2;
      ctx.quadraticCurveTo(pts[i].x, centerY - pts[i].amp, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, centerY - pts[pts.length - 1].amp);
    ctx.stroke();

    // 2. Draw Bottom Mirrored Smooth Bezier Wave
    ctx.strokeStyle = theme.secondary;
    ctx.shadowColor = theme.primary;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, centerY + pts[0].amp);
    for (let i = 0; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = centerY + (pts[i].amp + pts[i + 1].amp) / 2;
      ctx.quadraticCurveTo(pts[i].x, centerY + pts[i].amp, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, centerY + pts[pts.length - 1].amp);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Style: Radial Sound Wave around Vinyl / Cover
   */
  drawStyleRadial(ctx, w, h, freqData, theme, center, radius) {
    const bars = 84;
    const angleStep = (Math.PI * 2) / bars;
    const maxBarLen = radius * 0.65;
    const baseRadius = radius + 15;

    ctx.save();
    ctx.translate(center.x, center.y);

    for (let i = 0; i < bars; i++) {
      const angle = i * angleStep;
      const freqIdx = Math.floor(Math.abs(Math.sin(angle)) * (freqData.length * 0.45));
      const val = (freqData[freqIdx] || 0) / 255;
      const barLen = Math.max(4, val * maxBarLen);

      const x1 = Math.cos(angle) * baseRadius;
      const y1 = Math.sin(angle) * baseRadius;
      const x2 = Math.cos(angle) * (baseRadius + barLen);
      const y2 = Math.sin(angle) * (baseRadius + barLen);

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, theme.primary);
      grad.addColorStop(1, theme.secondary);

      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(2, (radius * 0.04) * 0.8);
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Style: Neon Ribbon (Layered Bezier waves)
   */
  drawStyleRibbon(ctx, w, h, freqData, theme) {
    this.ribbonPhase += 0.025;
    const isLandscape = this.aspectRatioId === '16:9';
    const baselineY = isLandscape ? h * 0.74 : h * 0.72;
    const startX = isLandscape ? w * 0.52 : 0;
    const usableW = isLandscape ? w * 0.44 : w;
    const layers = 3;

    ctx.save();
    for (let l = 0; l < layers; l++) {
      ctx.beginPath();
      const layerOffset = l * (Math.PI / 3);
      const amp = (h * 0.08) + l * 12;

      ctx.moveTo(startX, baselineY);
      for (let x = 0; x <= usableW; x += 25) {
        const freqSample = (freqData[Math.floor((x / usableW) * 64)] || 0) / 255;
        const wave = Math.sin(x * 0.005 + this.ribbonPhase + layerOffset) * amp * (0.4 + freqSample * 1.2);
        ctx.lineTo(startX + x, baselineY + wave);
      }

      ctx.strokeStyle = l === 0 ? theme.primary : l === 1 ? theme.secondary : (theme.accent || theme.secondary);
      ctx.lineWidth = 3.2 - l * 0.5;
      ctx.shadowColor = theme.secondary;
      ctx.shadowBlur = 14;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Typography and Overlay with Dynamic Title Bounds Fitting
   */
  drawOverlays(ctx, w, h, theme, currentTime, duration) {
    ctx.save();

    let textX = w * 0.5;
    let textY = h * 0.22;
    let align = 'center';
    let maxTextWidth = w * 0.84;

    if (this.aspectRatioId === '16:9') {
      textX = w * 0.58;
      textY = h * 0.38;
      align = 'left';
      maxTextWidth = w * 0.38;
    }

    ctx.textAlign = align;

    // 1. Dynamic Font Fitting for Primary Title
    let baseFontSize = Math.round(w * (this.aspectRatioId === '16:9' ? 0.038 : 0.048));
    ctx.font = `bold ${baseFontSize}px system-ui, -apple-system, sans-serif`;
    let measuredWidth = ctx.measureText(this.title || 'Untitled').width;

    // Scale down font size until it fits safely
    while (measuredWidth > maxTextWidth && baseFontSize > 18) {
      baseFontSize -= 2;
      ctx.font = `bold ${baseFontSize}px system-ui, -apple-system, sans-serif`;
      measuredWidth = ctx.measureText(this.title || 'Untitled').width;
    }

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 15;
    ctx.fillText(this.title || 'Untitled Track', textX, textY);

    // Subtitle
    ctx.fillStyle = theme.secondary;
    ctx.font = `500 ${Math.round(baseFontSize * 0.58)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(this.author || 'KenEasy Audio', textX, textY + Math.round(baseFontSize * 0.95));

    // 2. Timecode & Sleek Progress Bar
    if (this.showTimecode && duration > 0) {
      const curStr = this.formatTime(currentTime);
      const totalStr = this.formatTime(duration);
      const timeStr = `${curStr} / ${totalStr}`;

      ctx.font = `600 ${Math.round(w * (this.aspectRatioId === '16:9' ? 0.022 : 0.028))}px ui-monospace, monospace`;
      ctx.fillStyle = '#f4f7fb';
      ctx.textAlign = 'center';
      const timeY = h * 0.88;
      ctx.fillText(timeStr, w * 0.5, timeY);

      const pBarW = w * 0.65;
      const pBarX = (w - pBarW) * 0.5;
      const pBarY = timeY + 18;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(pBarX, pBarY, pBarW, 3);

      const ratio = Math.max(0, Math.min(1, currentTime / duration));
      const pGrad = ctx.createLinearGradient(pBarX, pBarY, pBarX + pBarW, pBarY);
      pGrad.addColorStop(0, theme.primary);
      pGrad.addColorStop(1, theme.secondary);
      ctx.fillStyle = pGrad;
      ctx.fillRect(pBarX, pBarY, pBarW * ratio, 3);
    }

    // 3. Series Branding Watermark
    if (this.showWatermark) {
      ctx.textAlign = 'right';
      ctx.font = `500 ${Math.round(w * 0.019)}px system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('KenEasy WaveForge', w - 32, h - 28);
    }

    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

if (typeof window !== 'undefined') {
  window.VisualizerRenderer = VisualizerRenderer;
}
