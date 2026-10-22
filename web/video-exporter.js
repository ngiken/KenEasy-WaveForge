/**
 * KenEasy WaveForge - Video Exporter (v1.1.0 High-Fidelity Pipeline)
 * Pure client-side hardware-accelerated MediaRecorder pipeline.
 * Synchronizes Canvas 60fps video stream with Web Audio destination stream,
 * provides live real-time picture-in-picture (PiP) preview during render,
 * and eliminates initial audio-video desync.
 */

class VideoExporter {
  constructor({ canvas, audioEngine, renderer, pipCanvas }) {
    this.canvas = canvas;
    this.audioEngine = audioEngine;
    this.renderer = renderer;
    this.pipCanvas = pipCanvas;
    this.pipCtx = pipCanvas ? pipCanvas.getContext('2d') : null;

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.exportCancelled = false;

    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  detectSupportedMimeType() {
    const types = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];

    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  async startExport() {
    if (this.isRecording) return;
    if (!this.audioEngine.audioBuffer) {
      throw new Error('No audio buffer loaded');
    }

    this.isRecording = true;
    this.exportCancelled = false;
    this.recordedChunks = [];

    const mimeType = this.detectSupportedMimeType();
    const isMp4 = mimeType.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';

    // 1. Prepare Audio Destination & Tracks
    const audioStreamDest = this.audioEngine.getStreamDestination();
    const audioTrack = audioStreamDest.stream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('Audio track could not be obtained');
    }

    // 2. Prepare Canvas Video Stream (60 fps)
    const videoStream = this.canvas.captureStream(CONFIG.DEFAULTS.videoFps || 60);
    const videoTrack = videoStream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('Canvas video track could not be obtained');
    }

    // Combined stream
    const combinedStream = new MediaStream([videoTrack, audioTrack]);

    const options = {
      videoBitsPerSecond: CONFIG.DEFAULTS.videoBitrateBps,
    };
    if (mimeType) {
      options.mimeType = mimeType;
    }

    try {
      this.mediaRecorder = new MediaRecorder(combinedStream, options);
    } catch (e) {
      console.warn('Failed with bitRate option, retrying with default', e);
      this.mediaRecorder = new MediaRecorder(combinedStream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    const trimStart = this.audioEngine.trimStart;
    const trimEnd = this.audioEngine.trimEnd;
    const exportDuration = Math.max(0.5, trimEnd - trimStart);
    const startTimeStamp = performance.now();

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.audioEngine.stop();

        if (this.exportCancelled) {
          if (this.onError) this.onError(new Error('Export was cancelled'));
          reject(new Error('Cancelled'));
          return;
        }

        const actualType = mimeType || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: actualType });
        const result = {
          blob,
          ext,
          mimeType: actualType,
          sizeBytes: blob.size,
          duration: exportDuration,
          fileName: `KenEasy-Wave-${Date.now()}.${ext}`,
        };

        if (this.onComplete) this.onComplete(result);
        resolve(result);
      };

      this.mediaRecorder.onerror = (err) => {
        this.isRecording = false;
        this.audioEngine.stop();
        if (this.onError) this.onError(err);
        reject(err);
      };

      // Start recording with 200ms slice
      this.mediaRecorder.start(200);

      // Micro-sleep to allow MediaRecorder encoder thread to stabilize before firing audio
      setTimeout(() => {
        if (!this.isRecording || this.exportCancelled) return;
        this.audioEngine.play(trimStart);
      }, 35);

      // Animation & Progress Tracking Loop + PiP Rendering
      const trackProgress = () => {
        if (!this.isRecording || this.exportCancelled) return;

        // Render to PiP Mini-Canvas
        if (this.pipCtx && this.pipCanvas) {
          this.pipCtx.drawImage(
            this.canvas,
            0,
            0,
            this.canvas.width,
            this.canvas.height,
            0,
            0,
            this.pipCanvas.width,
            this.pipCanvas.height
          );
        }

        const currentAudioTime = this.audioEngine.getCurrentTime();
        const elapsedInClip = Math.max(0, currentAudioTime - trimStart);
        const progress = Math.min(1.0, elapsedInClip / exportDuration);

        // Calculate ETA
        const elapsedWallTime = (performance.now() - startTimeStamp) / 1000;
        let etaSec = 0;
        if (progress > 0.05) {
          const totalEstimatedWall = elapsedWallTime / progress;
          etaSec = Math.max(0, Math.round(totalEstimatedWall - elapsedWallTime));
        }

        if (this.onProgress) {
          this.onProgress({
            progress,
            elapsedSec: elapsedInClip,
            totalSec: exportDuration,
            etaSec,
          });
        }

        if (currentAudioTime >= trimEnd - 0.04 || (!this.audioEngine.isPlaying && elapsedInClip >= exportDuration * 0.95)) {
          // Reached end of clip
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
          return;
        }

        requestAnimationFrame(trackProgress);
      };

      requestAnimationFrame(trackProgress);
    });
  }

  cancel() {
    if (!this.isRecording) return;
    this.exportCancelled = true;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    this.audioEngine.stop();
    this.isRecording = false;
  }

  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  }
}

if (typeof window !== 'undefined') {
  window.VideoExporter = VideoExporter;
}
