// FluxOS Persistent Foreground Audio Manager
// Uses Web Audio API Synthesizer to guarantee instant, 0-latency, 0-external-dependency audio chimes
// Implements Chromium Auto-Unlock on first user gesture.

export type SoundType =
  | 'order_created'
  | 'order_ready'
  | 'order_cancelled'
  | 'print_error'
  | 'cash_flow'
  | 'ding';

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private volume: number = 0.8;
  private enabled: boolean = true;

  constructor() {
    this.loadSettings();

    // Attach Chromium & iOS Safari auto-unlock listeners
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
      };

      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
      window.addEventListener('click', unlock, { passive: true });
    }
  }

  public unlockAudio(): boolean {
    try {
      const ctx = this.initAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            this.isUnlocked = true;
          }).catch(() => {});
        } else {
          this.isUnlocked = true;
        }

        // Play brief silent micro-tone inside user gesture tick to unlock browser autoplay policy permanently
        const silentOsc = ctx.createOscillator();
        const silentGain = ctx.createGain();
        silentGain.gain.setValueAtTime(0.00001, ctx.currentTime);
        silentOsc.connect(silentGain);
        silentGain.connect(ctx.destination);
        silentOsc.start(ctx.currentTime);
        silentOsc.stop(ctx.currentTime + 0.001);
      }
    } catch (e) {}
    return this.isUnlocked;
  }

  public loadSettings() {
    try {
      const raw = localStorage.getItem('adegaos_notification_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.volume === 'number') this.volume = Math.max(0, Math.min(1, parsed.volume));
        if (typeof parsed.soundEnabled === 'boolean') this.enabled = parsed.soundEnabled;
      }
    } catch (e) {}
  }

  public saveSettings(volume: number, enabled: boolean) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.enabled = enabled;
    try {
      const current = JSON.parse(localStorage.getItem('adegaos_notification_settings') || '{}');
      localStorage.setItem('adegaos_notification_settings', JSON.stringify({
        ...current,
        volume: this.volume,
        soundEnabled: this.enabled
      }));
    } catch (e) {}
  }

  public getSettings() {
    return { volume: this.volume, soundEnabled: this.enabled, isUnlocked: this.isUnlocked };
  }

  private initAudioContext(): AudioContext {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    return this.audioCtx!;
  }

  public play(sound: SoundType, customVolume?: number): void {
    if (!this.enabled) return;

    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const masterGain = ctx.createGain();
      const vol = customVolume !== undefined ? customVolume : this.volume;
      masterGain.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (sound) {
        case 'order_created': {
          // Upbeat double chime: E5 (659.25Hz) -> A5 (880Hz)
          this.playTone(ctx, masterGain, 659.25, now, 0.12, 'sine');
          this.playTone(ctx, masterGain, 880.0, now + 0.12, 0.25, 'sine');
          break;
        }

        case 'order_ready': {
          // Triumph triple chime: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.5Hz)
          this.playTone(ctx, masterGain, 523.25, now, 0.08, 'triangle');
          this.playTone(ctx, masterGain, 659.25, now + 0.08, 0.08, 'triangle');
          this.playTone(ctx, masterGain, 783.99, now + 0.16, 0.08, 'triangle');
          this.playTone(ctx, masterGain, 1046.5, now + 0.24, 0.3, 'sine');
          break;
        }

        case 'order_cancelled': {
          // Low descending warning tone: F4 (349.23Hz) -> C4 (261.63Hz)
          this.playTone(ctx, masterGain, 349.23, now, 0.15, 'sawtooth');
          this.playTone(ctx, masterGain, 261.63, now + 0.15, 0.35, 'sawtooth');
          break;
        }

        case 'print_error': {
          // Double buzz alert: D4 (293.66Hz)
          this.playTone(ctx, masterGain, 293.66, now, 0.1, 'square');
          this.playTone(ctx, masterGain, 293.66, now + 0.15, 0.15, 'square');
          break;
        }

        case 'cash_flow': {
          // Cash register metallic ping: E6 (1318.5Hz) with quick resonance decay
          this.playTone(ctx, masterGain, 1318.5, now, 0.05, 'sine');
          this.playTone(ctx, masterGain, 1760.0, now + 0.05, 0.2, 'sine');
          break;
        }

        case 'ding':
        default: {
          // Soft 880Hz A5 ding
          this.playTone(ctx, masterGain, 880.0, now, 0.2, 'sine');
          break;
        }
      }
    } catch (e) {
      console.warn('[AudioManager] Failed to play sound:', e);
    }
  }

  private playTone(
    ctx: AudioContext,
    destination: GainNode,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine'
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envelope: quick attack, exponential decay
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(1, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}

export const audioManager = new AudioManager();
