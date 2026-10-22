/**
 * KenEasy WaveForge - Visualizer Renderer
 * Multi-layer 60fps Canvas 2D Engine with procedural animations,
 * dynamic spectrum algorithms, vinyl rotation, and responsive layout.
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

    this.peakDrops = new Float32Array(128).fill(0);
    this.peakVelocities = new Float32Array(128).fill(0);
    this.rotationAngle = 0;
    this.ribbonPhase = 0;

    this.bgParticles = [];
    this.initParticles();
  }

  initParticles() {
    this.bgParticles = [];
    for (let i = 0; i < 48; i++) {
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

    // 1. Draw Background Layer
    this.drawBackground(ctx, w, h, theme);

    // 2. Draw Central Vinyl / Cover Art (if applicable)
    let coverCenter = { x: w * 0.5, y: h * 0.44 };
    let coverRadius = Math.min(w, h) * 0.18;
    if (this.aspectRatioId === '16:9') {
      coverCenter = { x: w * 0.28, y: h * 0.5 };
      coverRadius = h * 0.25;
    } else if (this.aspectRatioId === '1:1') {
      coverCenter = { x: w * 0.5, y: h * 0.42 };
      coverRadius = w * 0.2;
    }

    if (this.showCover) {
      if (isPlaying) {
        this.rotationAngle += 0.008;
      }
      this.drawVinylCover(ctx, coverCenter.x, coverCenter.y, coverRadius, theme);
    }

    // 3. Draw Selected Waveform Visualizer
    if (freqData) {
      this.drawWaveform(ctx, w, h, freqData, timeData, theme, coverCenter, coverRadius);
    }

    // 4. Draw Typography & Overlays
    this.drawOverlays(ctx, w, h, theme, currentTime, duration);
  }

  drawBackground(ctx, w, h, theme) {
    // Fill Base Dark
    ctx.fillStyle = '#0b0c0f';
    ctx.fillRect(0, 0, w, h);

    if (this.bgModeId === 'custom-image' && this.bgImage) {
      // Draw Cover with Cover aspect crop
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
    } else {
      // Procedural KenEasy Atmospheric Ambient Glow
      const grad1 = ctx.createRadialGradient(w * 0.2, h * 0.25, 50, w * 0.2, h * 0.25, w * 0.8);
      grad1.addColorStop(0, `${theme.primary}22`);
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      const grad2 = ctx.createRadialGradient(w * 0.8, h * 0.75, 50, w * 0.8, h * 0.75, w * 0.8);
      grad2.addColorStop(0, `${theme.secondary}22`);
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);

      // Procedural floating particles
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

    // Vignette Overlay
    if (this.bgVignette > 0) {
      const vigGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      const alpha = (this.bgVignette / 100) * 0.85;
      vigGrad.addColorStop(0, 'rgba(11, 12, 15, 0)');
      vigGrad.addColorStop(1, `rgba(11, 12, 15, ${alpha})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawVinylCover(ctx, cx, cy, radius, theme) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotationAngle);

    // 1. Vinyl Black Disc Outer Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;

    ctx.fillStyle = '#111317';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // 2. Vinyl Grooves (Subtle concentric rings)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.2;
    for (let r = radius * 0.6; r < radius * 0.95; r += radius * 0.065) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Vinyl Grooves Highlight Sheen
    const sheenGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    sheenGrad.addColorStop(0.5, 'transparent');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Center Label / Artwork
    const innerRadius = radius * 0.52;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.clip();

    if (this.coverImage) {
      ctx.drawImage(this.coverImage, -innerRadius, -innerRadius, innerRadius * 2, innerRadius * 2);
    } else {
      // KenEasy Default Gradient Brand Core
      const coreGrad = ctx.createLinearGradient(-innerRadius, -innerRadius, innerRadius, innerRadius);
      coreGrad.addColorStop(0, theme.primary);
      coreGrad.addColorStop(1, theme.secondary);
      ctx.fillStyle = coreGrad;
      ctx.fillRect(-innerRadius, -innerRadius, innerRadius * 2, innerRadius * 2);

      // Icon / Monogram
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${innerRadius * 0.45}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('KE', 0, 0);
    }
    ctx.restore();

    // 5. Center Spindle Hole
    ctx.fillStyle = '#0b0c0f';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

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
   * Style: Spectrum Bars with Glow and Peak Drops
   */
  drawStyleBars(ctx, w, h, freqData, theme) {
    const barCount = 56;
    const startX = w * 0.08;
    const usableWidth = w * 0.84;
    const barWidth = (usableWidth / barCount) * 0.72;
    const gap = (usableWidth / barCount) * 0.28;
    const baselineY = h * 0.74;
    const maxHeight = h * 0.22;

    const barGrad = ctx.createLinearGradient(0, baselineY - maxHeight, 0, baselineY);
    barGrad.addColorStop(0, theme.secondary);
    barGrad.addColorStop(0.6, theme.primary);
    barGrad.addColorStop(1, `${theme.primary}44`);

    for (let i = 0; i < barCount; i++) {
      // Pick frequency sample with gentle log-scale bias
      const freqIndex = Math.floor(Math.pow(i / barCount, 1.4) * (freqData.length * 0.75));
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
   * Style: Symmetrical Neon Fluid Wave
   */
  drawStyleWave(ctx, w, h, audioData, theme) {
    const centerY = h * 0.72;
    const startX = w * 0.06;
    const usableWidth = w * 0.88;
    const points = 64;
    const step = usableWidth / (points - 1);
    const maxAmp = h * 0.16;

    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = theme.primary;
    ctx.shadowColor = theme.secondary;
    ctx.shadowBlur = 18;

    // Top Wave
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const dataIdx = Math.floor((i / points) * (audioData.length * 0.5));
      const val = (audioData[dataIdx] || 128) / 255;
      const amp = Math.sin((i / points) * Math.PI) * Math.abs(val - 0.5) * 2 * maxAmp;
      const x = startX + i * step;
      const y = centerY - amp - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Mirror Bottom Wave
    ctx.strokeStyle = theme.secondary;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const dataIdx = Math.floor((i / points) * (audioData.length * 0.5));
      const val = (audioData[dataIdx] || 128) / 255;
      const amp = Math.sin((i / points) * Math.PI) * Math.abs(val - 0.5) * 2 * maxAmp;
      const x = startX + i * step;
      const y = centerY + amp + 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Style: Radial Sound Wave around Vinyl / Cover
   */
  drawStyleRadial(ctx, w, h, freqData, theme, center, radius) {
    const bars = 80;
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
    const baselineY = h * 0.72;
    const layers = 3;

    ctx.save();
    for (let l = 0; l < layers; l++) {
      ctx.beginPath();
      const layerOffset = l * (Math.PI / 3);
      const amp = (h * 0.08) + l * 12;

      ctx.moveTo(0, baselineY);
      for (let x = 0; x <= w; x += 30) {
        const freqSample = (freqData[Math.floor((x / w) * 64)] || 0) / 255;
        const wave = Math.sin(x * 0.005 + this.ribbonPhase + layerOffset) * amp * (0.4 + freqSample * 1.2);
        ctx.lineTo(x, baselineY + wave);
      }

      ctx.strokeStyle = l === 0 ? theme.primary : l === 1 ? theme.secondary : theme.accent;
      ctx.lineWidth = 3 - l * 0.5;
      ctx.shadowColor = theme.secondary;
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawOverlays(ctx, w, h, theme, currentTime, duration) {
    ctx.save();

    // 1. Title & Subtitle Typography
    let textX = w * 0.5;
    let textY = h * 0.22;
    let align = 'center';

    if (this.aspectRatioId === '16:9') {
      textX = w * 0.58;
      textY = h * 0.38;
      align = 'left';
    }

    ctx.textAlign = align;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(w * 0.048)}px system-ui, -apple-system, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 15;
    ctx.fillText(this.title || 'Untitled Track', textX, textY);

    ctx.fillStyle = theme.secondary;
    ctx.font = `500 ${Math.round(w * 0.026)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(this.author || 'KenEasy Audio', textX, textY + Math.round(w * 0.045));

    // 2. Timecode & Progress
    if (this.showTimecode && duration > 0) {
      const curStr = this.formatTime(currentTime);
      const totalStr = this.formatTime(duration);
      const timeStr = `${curStr} / ${totalStr}`;

      ctx.font = `600 ${Math.round(w * 0.028)}px ui-monospace, monospace`;
      ctx.fillStyle = '#f4f7fb';
      ctx.textAlign = 'center';
      const timeY = h * 0.88;
      ctx.fillText(timeStr, w * 0.5, timeY);

      // Thin sleek progress bar
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
