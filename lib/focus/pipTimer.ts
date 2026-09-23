/**
 * Floating Mini Window (Picture-in-Picture) Manager for Focus Mode
 * Supports both Document Picture-in-Picture (interactive mini window with buttons)
 * and Canvas-to-Video Picture-in-Picture (universal OS floating player).
 */

export interface PipState {
  timeFormatted: string;
  taskTitle: string;
  progressPercent: number;
  isRunning: boolean;
  isComplete: boolean;
  durationMinutes: number;
}

export interface PipCallbacks {
  onTogglePlay: () => void;
  onReset: () => void;
  onClose?: () => void;
}

export class PipTimerManager {
  private pipWindow: Window | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private video: HTMLVideoElement | null = null;
  private callbacks: PipCallbacks | null = null;
  private isOpen: boolean = false;
  private isDocPip: boolean = false;

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "documentPictureInPicture" in window || "pictureInPictureEnabled" in document;
  }

  public isDocumentPipSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "documentPictureInPicture" in window;
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Open the floating mini window (Teams-style)
   */
  public async open(initialState: PipState, callbacks: PipCallbacks): Promise<boolean> {
    this.callbacks = callbacks;

    if (this.isDocumentPipSupported()) {
      try {
        const docPip = (window as any).documentPictureInPicture;
        this.pipWindow = await docPip.requestWindow({
          width: 320,
          height: 190,
        });

        if (this.pipWindow) {
          this.isDocPip = true;
          this.isOpen = true;
          this.setupDocPipWindow(initialState);

          this.pipWindow.addEventListener("pagehide", () => {
            this.isOpen = false;
            this.pipWindow = null;
            this.callbacks?.onClose?.();
          });

          return true;
        }
      } catch (err) {
        console.warn("Document Picture-in-Picture failed, falling back to Canvas PiP:", err);
      }
    }

    // Fallback: Canvas-to-Video Picture-in-Picture
    return this.openCanvasPip(initialState);
  }

  /**
   * Setup DOM and styling inside the Document PiP window
   */
  private setupDocPipWindow(state: PipState) {
    if (!this.pipWindow) return;

    const doc = this.pipWindow.document;
    doc.title = "Focus Timer • HabitTrack";

    const style = doc.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      body {
        background: #090d16;
        color: #f1f5f9;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100vh;
        padding: 14px 16px;
        user-select: none;
        overflow: hidden;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .app-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 800;
        color: #10b981;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .pulse-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 8px #10b981;
      }
      .pulse-dot.paused {
        background: #f59e0b;
        box-shadow: 0 0 8px #f59e0b;
      }
      .task-title {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 170px;
      }
      .timer-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 2px 0;
      }
      .time-display {
        font-size: 42px;
        font-weight: 900;
        letter-spacing: -0.04em;
        font-variant-numeric: tabular-nums;
        color: #ffffff;
        line-height: 1;
      }
      .time-display.completed {
        color: #10b981;
        font-size: 28px;
        letter-spacing: -0.02em;
        padding: 6px 0;
      }
      .progress-track {
        width: 100%;
        height: 5px;
        background: #1e293b;
        border-radius: 9999px;
        overflow: hidden;
        margin: 8px 0;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #059669);
        border-radius: 9999px;
        transition: width 0.4s ease;
      }
      .controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
      button {
        cursor: pointer;
        border: none;
        outline: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        font-weight: 700;
        font-size: 12px;
        transition: all 0.15s ease;
      }
      button:active {
        transform: scale(0.97);
      }
      .btn-primary {
        background: #10b981;
        color: #022c22;
        padding: 7px 18px;
      }
      .btn-primary:hover {
        background: #34d399;
      }
      .btn-secondary {
        background: #1e293b;
        color: #94a3b8;
        padding: 7px 12px;
      }
      .btn-secondary:hover {
        background: #334155;
        color: #f1f5f9;
      }
    `;

    doc.head.appendChild(style);

    doc.body.innerHTML = `
      <div class="header">
        <div class="app-tag">
          <span id="pip-dot" class="pulse-dot ${state.isRunning ? "" : "paused"}"></span>
          <span>Focus Mode</span>
        </div>
        <div id="pip-task" class="task-title">${this.escapeHtml(state.taskTitle || "Deep Study")}</div>
      </div>

      <div class="timer-container">
        <div id="pip-time" class="time-display ${state.isComplete ? "completed" : ""}">
          ${state.isComplete ? "Completed! 🎉" : state.timeFormatted}
        </div>
        <div class="progress-track">
          <div id="pip-progress" class="progress-fill" style="width: ${state.progressPercent}%;"></div>
        </div>
      </div>

      <div class="controls">
        <button id="pip-reset-btn" class="btn-secondary" title="Reset">
          ↺ Reset
        </button>
        <button id="pip-toggle-btn" class="btn-primary">
          ${state.isRunning ? "❚❚ Pause" : "▶ Start"}
        </button>
        <button id="pip-focus-btn" class="btn-secondary" title="Back to app">
          ↗ Tab
        </button>
      </div>
    `;

    // Attach button listeners
    const toggleBtn = doc.getElementById("pip-toggle-btn");
    toggleBtn?.addEventListener("click", () => {
      this.callbacks?.onTogglePlay();
    });

    const resetBtn = doc.getElementById("pip-reset-btn");
    resetBtn?.addEventListener("click", () => {
      this.callbacks?.onReset();
    });

    const focusBtn = doc.getElementById("pip-focus-btn");
    focusBtn?.addEventListener("click", () => {
      window.focus();
    });
  }

  /**
   * Fallback Canvas-based Picture-in-Picture
   */
  private async openCanvasPip(state: PipState): Promise<boolean> {
    if (typeof document === "undefined" || !("pictureInPictureEnabled" in document)) {
      return false;
    }

    try {
      if (!this.canvas) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 340;
        this.canvas.height = 190;
      }

      this.renderCanvasFrame(state);

      if (!this.video) {
        this.video = document.createElement("video");
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.autoplay = true;
        this.video.style.position = "fixed";
        this.video.style.top = "-9999px";
        this.video.style.left = "-9999px";
        this.video.style.opacity = "0";
        this.video.style.pointerEvents = "none";
        document.body.appendChild(this.video);

        const stream = this.canvas.captureStream(15);
        this.video.srcObject = stream;
        await this.video.play();
      }

      await this.video.requestPictureInPicture();
      this.isDocPip = false;
      this.isOpen = true;

      this.video.addEventListener(
        "leavepictureinpicture",
        () => {
          this.isOpen = false;
          this.callbacks?.onClose?.();
        },
        { once: true }
      );

      return true;
    } catch (err) {
      console.warn("Canvas Picture-in-Picture failed:", err);
      return false;
    }
  }

  /**
   * Render frame to canvas for video PiP
   */
  private renderCanvasFrame(state: PipState) {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, w, h);

    // Accent line at top
    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, 0, w, 4);

    // Header text
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.fillText("HABITTRACK FOCUS", 20, 32);

    // Status or task
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#94a3b8";
    const title = (state.taskTitle || "Deep Study Session").slice(0, 24);
    ctx.fillText(title, 20, 52);

    // Time string
    ctx.font = "900 52px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = state.isComplete ? "#10b981" : "#ffffff";
    const text = state.isComplete ? "Done! 🎉" : state.timeFormatted;
    ctx.fillText(text, 20, 114);

    // Progress bar track
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(20, 134, w - 40, 8, 4);
    ctx.fill();

    // Progress bar fill
    const fillWidth = Math.max(0, Math.min(w - 40, ((w - 40) * state.progressPercent) / 100));
    if (fillWidth > 0) {
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.roundRect(20, 134, fillWidth, 8, 4);
      ctx.fill();
    }

    // Bottom status
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = state.isRunning ? "#10b981" : "#f59e0b";
    ctx.fillText(state.isRunning ? "● Session in progress" : "❚❚ Paused", 20, 168);
  }

  /**
   * Update the running PiP mini window with the latest time and progress
   */
  public update(state: PipState) {
    if (!this.isOpen) return;

    if (this.isDocPip && this.pipWindow && !this.pipWindow.closed) {
      const doc = this.pipWindow.document;
      const timeEl = doc.getElementById("pip-time");
      const progressEl = doc.getElementById("pip-progress");
      const toggleBtn = doc.getElementById("pip-toggle-btn");
      const dotEl = doc.getElementById("pip-dot");
      const taskEl = doc.getElementById("pip-task");

      if (timeEl) {
        timeEl.textContent = state.isComplete ? "Completed! 🎉" : state.timeFormatted;
        if (state.isComplete) {
          timeEl.classList.add("completed");
        } else {
          timeEl.classList.remove("completed");
        }
      }

      if (progressEl) {
        progressEl.style.width = `${state.progressPercent}%`;
      }

      if (toggleBtn) {
        toggleBtn.textContent = state.isRunning ? "❚❚ Pause" : "▶ Start";
      }

      if (dotEl) {
        if (state.isRunning) {
          dotEl.classList.remove("paused");
        } else {
          dotEl.classList.add("paused");
        }
      }

      if (taskEl) {
        taskEl.textContent = state.taskTitle || "Deep Study";
      }
    } else if (this.canvas) {
      this.renderCanvasFrame(state);
    }
  }

  /**
   * Close the Picture-in-Picture window
   */
  public close() {
    if (this.pipWindow && !this.pipWindow.closed) {
      this.pipWindow.close();
      this.pipWindow = null;
    }

    if (
      typeof document !== "undefined" &&
      document.pictureInPictureElement &&
      document.exitPictureInPicture
    ) {
      document.exitPictureInPicture().catch(() => {});
    }

    if (this.video) {
      this.video.pause();
      if (this.video.srcObject) {
        const stream = this.video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      this.video.remove();
      this.video = null;
    }

    this.isOpen = false;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
