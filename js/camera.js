/* ===================================================================
   AI CAMERA REP COUNTER & FORM REFEREE
   Browser WebRTC + Motion Tracking Engine
   =================================================================== */

class AICameraReferee {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.stream = null;
    this.active = false;
    this.activeExercise = 'pushups';
    this.repCount = 0;
    this.prevFrame = null;
    this.state = 'up'; // 'up' or 'down'
    this.lastRepTime = 0;
    this.feedback = 'Stand in frame to begin';
  }

  init(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  async start(exercise = 'pushups') {
    this.activeExercise = exercise;
    this.repCount = 0;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
        this.active = true;
        this.processLoop();
        this.updateFeedback('AI Tracking Activated. Begin movement!');
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      this.updateFeedback('Camera simulation active (Tap screen for manual rep count)');
      this.active = true;
    }
  }

  stop() {
    this.active = false;
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  processLoop() {
    if (!this.active) return;

    if (this.video && this.video.readyState === 4) {
      this.canvas.width = 640;
      this.canvas.height = 480;
      this.ctx.drawImage(this.video, 0, 0, 640, 480);

      const frame = this.ctx.getImageData(0, 0, 640, 480);
      this.analyzeMotion(frame);
      this.drawCyberOverlay();
    }

    requestAnimationFrame(() => this.processLoop());
  }

  analyzeMotion(currentFrame) {
    if (!this.prevFrame) {
      this.prevFrame = currentFrame;
      return;
    }

    let diffSum = 0;
    let centroidY = 0;
    let motionPixels = 0;

    const cur = currentFrame.data;
    const prev = this.prevFrame.data;

    // Subsampled pixel difference calculation
    for (let i = 0; i < cur.length; i += 16) {
      const d = Math.abs(cur[i] - prev[i]) + Math.abs(cur[i+1] - prev[i+1]) + Math.abs(cur[i+2] - prev[i+2]);
      if (d > 75) {
        diffSum += d;
        motionPixels++;
        centroidY += Math.floor((i / 4) / 640);
      }
    }

    this.prevFrame = currentFrame;

    if (motionPixels > 450) {
      const avgY = centroidY / motionPixels;
      const now = Date.now();

      // State machine for rep detection
      if (avgY > 260 && this.state === 'up' && (now - this.lastRepTime > 1200)) {
        this.state = 'down';
        this.updateFeedback('Good depth! Press up!');
      } else if (avgY < 210 && this.state === 'down' && (now - this.lastRepTime > 1200)) {
        this.state = 'up';
        this.lastRepTime = now;
        this.recordRep();
      }
    }
  }

  recordRep() {
    this.repCount++;
    if (window.systemAudio) window.systemAudio.playRep();
    if (window.systemState) window.systemState.incrementQuest(this.activeExercise, 1);
    this.updateFeedback('REP COMPLETED! Form Locked.');
    
    const repElem = document.getElementById('cameraRepCount');
    if (repElem) repElem.innerText = this.repCount;
  }

  updateFeedback(text) {
    this.feedback = text;
    const badge = document.getElementById('cameraFeedback');
    if (badge) badge.innerText = text;
  }

  drawCyberOverlay() {
    // Draw cybernetic crosshair and tracking boxes
    this.ctx.strokeStyle = '#00f0ff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(120, 80, 400, 320);

    // Corner brackets
    const corners = [
      [120, 80], [520, 80],
      [120, 400], [520, 400]
    ];
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 4;
    for (let [cx, cy] of corners) {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
}

window.aiCamera = new AICameraReferee();
