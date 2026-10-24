<div align="center">

# KenEasy WaveForge

**极速纯前端音频波形视频生成器** — 导入音频，挑选 9:16 / 16:9 / 1:1 比例与酷炫波形样式，一键导出高清短视频。
全程在浏览器本地完成，**不上传、不排队、无水印限制、零隐私泄漏**。

<br/>

### 👉 点这里直接在线使用

# [🚀 打开 WaveForge（在线即开即用）](https://ngiken.github.io/KenEasy-WaveForge/)

**https://ngiken.github.io/KenEasy-WaveForge/**

> 💡 上面是**线上工具网页**，打开就能用。
> 页面内自带 **「✨ 试听示例曲目」**，即使手头没有音频也能一秒体验动效！

<br/>

[中文](README.md) · [English](README.en.md)

<br/>

<img alt="Use online" src="https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E4%BD%BF%E7%94%A8-ngiken.github.io-fb7299?style=for-the-badge">
<img alt="Version" src="https://img.shields.io/badge/version-1.1.0-00aeec?style=for-the-badge">
<img alt="Privacy" src="https://img.shields.io/badge/privacy-100%25%20local-10b981?style=for-the-badge">
<img alt="Tests" src="https://img.shields.io/badge/e2e-37%2F37-27c499?style=for-the-badge">
<img alt="License" src="https://img.shields.io/badge/license-MIT-9aa4b2?style=for-the-badge">

<br/><br/>

<img src="./docs/screenshots/hero-portrait.png" alt="KenEasy WaveForge 9:16 竖屏模式" width="1200">

<sub>KenEasy 标志性深色玻璃拟态 · 纯前端 Web Audio + Canvas 60FPS 渲染</sub>

</div>

---

## 30 秒上手

1. 打开：**[在线工具](https://ngiken.github.io/KenEasy-WaveForge/)**
2. 拖入你的音频文件（MP3, WAV, FLAC, M4A, OGG 等），或直接点击 **「✨ 试听示例曲目」** 一键生成内置 Lo-Fi 律动。
3. 选择发布目标画幅：
   - 📱 **9:16 竖屏**：适合 抖音 / 小红书 / 视频号 / TikTok / YouTube Shorts
   - 🖥️ **16:9 横屏**：适合 Bilibili / YouTube / 宽屏演示
   - 🔲 **1:1 方形**：适合 唱片封面 / 即刻 / 朋友圈 / Instagram
4. 切换你喜欢的 **波形动效**（光谱柱状、双面对称波、黑胶圆环、霓虹丝带）与 **调色方案**。
5. （可选）在时间轴上拖动或输入数值截取高能高潮片段。
6. 点击 **「🎬 导出波形视频」** → 纯本地硬件加速合成，完成后一键下载 MP4/WebM！

### 操作演示

<p align="center">
  <img src="./docs/screenshots/quick-tour.gif" alt="导入音频、切换样式与画幅、本地导出视频动画演示" width="960">
</p>

<p align="center"><strong>① 导入音频/试听　→　② 挑选样式与画幅　→　③ 本地导出高清视频</strong></p>

---

## 核心特性

| 痛点与需求 | KenEasy WaveForge 的解决方案 |
|---|---|
| **想把音频发到小红书/B站但平台只能发视频** | 一键将纯音频配上动感声波和标题，渲染成可直接发布的短视频 |
| **传统剪辑软件（PR/剪映/AE）太重太麻烦** | 浏览器打开即用，无需配置复杂的插件或关键帧，实时所见即所得 |
| **在线波形网站收费/限制时长/强制加丑陋水印** | 100% 自由开源，零限制，无收费套路，自由定制文字和样式 |
| **敏感录音/原创音乐担心上传泄密** | 纯前端利用 Web Audio API 与 MediaRecorder 处理，音频文件绝不上云 |
| **手头没有音频文件只想快速看看效果** | 内置 Web Audio 程序化 Lo-Fi 合成器，点击“试听示例”瞬间演奏动感音轨 |

---

## 视觉风格与多画幅预览

### 🖥️ 16:9 横屏大画幅模式（适合 B 站 / YouTube）
<p align="center">
  <img src="./docs/screenshots/hero-landscape.png" alt="16:9 横屏波形模式" width="900">
</p>

### 💿 1:1 黑胶唱片模式（适合唱片封套 / 音乐卡片）
<p align="center">
  <img src="./docs/screenshots/hero-radial.png" alt="1:1 黑胶唱片模式" width="700">
</p>

### 📱 移动端自适应排版
<p align="center">
  <img src="./docs/screenshots/mobile-view.png" alt="移动端适配效果" width="400">
</p>

---

## 4 种精调波形算法

1. **📊 光谱柱状 (Spectrum Bars)**：经典律动均衡器，带有物理重力下落的顶端浮点（Peak Drop）与倒影。
2. **🌊 对称波浪 (Mirrored Wave)**：双面对称呼吸脉冲，如心跳般的荧光流体。
3. **💿 黑胶圆环 (Vinyl Radial)**：中心是一张可旋转的高质感黑胶唱片，外圈向外辐射动态声波粒子环。
4. **✨ 霓虹丝带 (Neon Ribbon)**：多层贝塞尔曲线交织流转，如极光般绚丽。

---

## 离线安全与隐私承诺

- **零后端**：没有 Node.js / Python / Go 后端服务，纯静态 HTML/CSS/JS。
- **零上传**：无论是音频还是背景图片，均通过浏览器的 `File API` 与 `AudioContext.decodeAudioData` 本地解码。
- **离线即用**：所有依赖与逻辑均在本地打包，没有任何外部 CDN 请求，断网也能完美运行。

---

## 本地开发与测试

```powershell
# 1. 本地启动静态服务器
python -m http.server 8080 --directory web
# 浏览器访问 http://localhost:8080

# 2. 运行 E2E 自动化回归测试
cd scratch/e2e
node run.mjs

# 3. 重新捕获高清演示图并生成 GIF
node capture-readme.mjs
python build-readme-gif.py
```

---

## 开源协议

本项目采用 [MIT 许可证](./LICENSE) 开源。欢迎 Star、Fork 与提 Issue！
