// ============================================================================
// CoreWatch Professional Security Alarm & Audio Management Engine
// Synthesized via Web Audio API for zero-latency, 100% offline reliability
// ============================================================================

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AudioPreferences {
  soundEnabled: boolean;
  criticalSound: boolean;
  highSound: boolean;
  mediumSound: boolean;
  lowSound: boolean;
  masterVolume: number; // 0 - 100
  criticalAlarmRepeatInterval: number; // in seconds
}

class SecurityAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private preferences: AudioPreferences = {
    soundEnabled: true,
    criticalSound: true,
    highSound: true,
    mediumSound: true,
    lowSound: false,
    masterVolume: 80,
    criticalAlarmRepeatInterval: 8
  };

  private criticalIntervalId: any = null;
  private activeCriticalAlertId: string | null = null;
  private isPlayingNow: boolean = false;

  constructor() {
    // AudioContext will be initialized or resumed on user gesture
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public updatePreferences(prefs: Partial<AudioPreferences>) {
    this.preferences = { ...this.preferences, ...prefs };
    if (prefs.masterVolume !== undefined) {
      this.masterVolume = Math.min(Math.max(prefs.masterVolume / 100, 0), 1);
    }
    if (prefs.soundEnabled !== undefined) {
      this.isMuted = !prefs.soundEnabled;
    }
  }

  public setGlobalMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopCriticalAlarm();
    }
  }

  public getGlobalMute(): boolean {
    return this.isMuted;
  }

  /**
   * Play security alarm tone based on severity
   */
  public playAlarm(severity: AlertSeverity, alertId?: string) {
    if (this.isMuted || !this.preferences.soundEnabled) return;

    switch (severity) {
      case 'CRITICAL':
        if (!this.preferences.criticalSound) return;
        this.startCriticalAlarmLoop(alertId);
        break;
      case 'HIGH':
        if (!this.preferences.highSound) return;
        this.playHighWarning();
        break;
      case 'MEDIUM':
        if (!this.preferences.mediumSound) return;
        this.playMediumNotice();
        break;
      case 'LOW':
        if (!this.preferences.lowSound) return;
        this.playLowChime();
        break;
    }
  }

  /**
   * CRITICAL: Repeating emergency warble siren
   */
  private startCriticalAlarmLoop(alertId?: string) {
    if (alertId) {
      this.activeCriticalAlertId = alertId;
    }
    // Play initial burst immediately
    this.playCriticalSirenTone();

    // Clear previous repeat loop if any
    if (this.criticalIntervalId) {
      clearInterval(this.criticalIntervalId);
    }

    const intervalSec = Math.max(this.preferences.criticalAlarmRepeatInterval || 8, 4);
    this.criticalIntervalId = setInterval(() => {
      if (this.isMuted || !this.preferences.soundEnabled) {
        this.stopCriticalAlarm();
        return;
      }
      this.playCriticalSirenTone();
    }, intervalSec * 1000);
  }

  /**
   * Stops the repeating critical alarm loop (upon user acknowledgement)
   */
  public stopCriticalAlarm(alertId?: string) {
    if (alertId && this.activeCriticalAlertId && this.activeCriticalAlertId !== alertId) {
      // If stopping for a different alert, retain current if still active
      return;
    }
    if (this.criticalIntervalId) {
      clearInterval(this.criticalIntervalId);
      this.criticalIntervalId = null;
    }
    this.activeCriticalAlertId = null;
  }

  /**
   * Synthesize Critical Siren: Dual high-intensity warble (880Hz / 660Hz)
   */
  private playCriticalSirenTone() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.01, now);
      // Volume ramp
      const targetVol = this.masterVolume * 0.9;
      gain.gain.exponentialRampToValueAtTime(targetVol, now + 0.05);

      // Pitch sweep warble: 880Hz -> 660Hz -> 880Hz -> 660Hz
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(659.25, now + 0.25);
      osc.frequency.linearRampToValueAtTime(880, now + 0.5);
      osc.frequency.linearRampToValueAtTime(659.25, now + 0.75);
      osc.frequency.linearRampToValueAtTime(880, now + 1.0);

      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (err) {
      console.warn("SecurityAudio: Failed to synthesize critical alarm:", err);
    }
  }

  /**
   * HIGH: Urgent double rising alert pulse (650Hz -> 900Hz)
   */
  private playHighWarning() {
    if (this.isPlayingNow) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.isPlayingNow = true;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume * 0.75;

      // Pulse 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(650, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.linearRampToValueAtTime(vol, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.23);

      // Pulse 2 (0.12s later)
      const now2 = now + 0.14;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(750, now2);
      osc2.frequency.exponentialRampToValueAtTime(980, now2 + 0.22);
      gain2.gain.setValueAtTime(0.01, now2);
      gain2.gain.linearRampToValueAtTime(vol, now2 + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now2);
      osc2.stop(now2 + 0.3);

      setTimeout(() => {
        this.isPlayingNow = false;
      }, 400);
    } catch {
      this.isPlayingNow = false;
    }
  }

  /**
   * MEDIUM: Distinct single warning chime (520Hz)
   */
  private playMediumNotice() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);

      const vol = this.masterVolume * 0.6;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {}
  }

  /**
   * LOW: Subtle click / low alert chime (440Hz)
   */
  private playLowChime() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);

      const vol = this.masterVolume * 0.4;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  /**
   * Test preview for Settings UI
   */
  public testTone(severity: AlertSeverity) {
    const prevMute = this.isMuted;
    this.isMuted = false;
    if (severity === 'CRITICAL') {
      this.playCriticalSirenTone();
    } else if (severity === 'HIGH') {
      this.playHighWarning();
    } else if (severity === 'MEDIUM') {
      this.playMediumNotice();
    } else {
      this.playLowChime();
    }
    this.isMuted = prevMute;
  }
}

export const securityAudio = new SecurityAudioEngine();
