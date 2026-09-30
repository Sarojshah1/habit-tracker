/**
 * Synthesized Web Audio API sound effects for HabitTrack.
 * Zero external audio files/bandwidth required; works completely offline.
 */

// Check if sound is enabled (persisted in localStorage)
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("habittrack_sound_enabled");
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("habittrack_sound_enabled", String(enabled));
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

/**
 * Crisp, uplifting harmonic chime played upon completing a habit or task.
 * Musical chord: C5 (523.25 Hz) -> E5 (659.25 Hz) -> G5 (783.99 Hz)
 */
export function playHabitCompleteSound(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C-E-G major triad

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.35);
    });
  } catch (err) {
    // Gracefully ignore audio failures on restricted browser environments
  }
}

/**
 * Triumphal celebratory fanfare chord when hitting a milestone or maintaining a streak.
 */
export function playStreakMilestoneSound(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 440, delay: 0, duration: 0.2 },      // A4
      { freq: 554.37, delay: 0.12, duration: 0.2 }, // C#5
      { freq: 659.25, delay: 0.24, duration: 0.3 }, // E5
      { freq: 880, delay: 0.38, duration: 0.7 },    // A5 (soaring)
    ];

    notes.forEach(({ freq, delay, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + duration);
    });
  } catch (err) {
    // Gracefully ignore
  }
}

/**
 * Subtle tactile whoosh/click when flipping a flashcard.
 */
export function playCardFlipSound(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    // Gracefully ignore
  }
}
