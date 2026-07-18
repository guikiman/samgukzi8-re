const DEFAULT_BASE_GAIN = 0.15;
export class AudioOscillatorMixer {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.initialized = false;
        this.mute = false;
    }
    async init() {
        if (this.initialized)
            return true;
        try {
            const AC = window.AudioContext
                || window.webkitAudioContext;
            if (!AC)
                return false;
            this.ctx = new AC();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = DEFAULT_BASE_GAIN;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
            return true;
        }
        catch {
            return false;
        }
    }
    ensureContext() {
        if (!this.ctx || !this.masterGain) {
            throw new Error("AudioOscillatorMixer not initialized. Call init() first.");
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
        return this.ctx;
    }
    setMasterGain(gain) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, gain)), this.ctx.currentTime);
        }
    }
    isMuted() {
        return this.mute;
    }
    setMuted(muted) {
        this.mute = muted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(muted ? 0 : DEFAULT_BASE_GAIN, this.ctx.currentTime);
        }
    }
    playNote(note) {
        if (this.mute)
            return null;
        const ctx = this.ensureContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.waveform ?? "square";
        osc.frequency.setValueAtTime(note.frequency, ctx.currentTime);
        gain.gain.setValueAtTime(note.gain ?? 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + note.duration);
        return osc;
    }
    playSequence(notes) {
        if (this.mute || notes.length === 0)
            return;
        const ctx = this.ensureContext();
        let timeOffset = 0;
        for (const note of notes) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = note.waveform ?? "square";
            osc.frequency.setValueAtTime(note.frequency, ctx.currentTime + timeOffset);
            gain.gain.setValueAtTime(note.gain ?? 0.3, ctx.currentTime + timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + note.duration);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(ctx.currentTime + timeOffset);
            osc.stop(ctx.currentTime + timeOffset + note.duration);
            timeOffset += note.duration;
        }
    }
    playEffect(effect) {
        this.playSequence(effect.notes);
    }
    dispose() {
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
        this.masterGain = null;
        this.initialized = false;
    }
}
AudioOscillatorMixer.Effects = {
    turnChange: () => ({
        label: "turn_change",
        notes: [
            { frequency: 523.25, duration: 0.1, gain: 0.3 },
            { frequency: 659.25, duration: 0.15, gain: 0.3 },
            { frequency: 783.99, duration: 0.2, gain: 0.25 },
        ],
    }),
    buttonClick: () => ({
        label: "button_click",
        notes: [
            { frequency: 800, duration: 0.05, gain: 0.2 },
        ],
    }),
    error: () => ({
        label: "error",
        notes: [
            { frequency: 200, duration: 0.15, gain: 0.4, waveform: "sawtooth" },
            { frequency: 150, duration: 0.2, gain: 0.35, waveform: "sawtooth" },
        ],
    }),
    victory: () => ({
        label: "victory",
        notes: [
            { frequency: 523.25, duration: 0.15, gain: 0.3 },
            { frequency: 659.25, duration: 0.15, gain: 0.3 },
            { frequency: 783.99, duration: 0.15, gain: 0.3 },
            { frequency: 1046.5, duration: 0.4, gain: 0.35 },
        ],
    }),
    defeat: () => ({
        label: "defeat",
        notes: [
            { frequency: 400, duration: 0.2, gain: 0.3, waveform: "triangle" },
            { frequency: 300, duration: 0.2, gain: 0.3, waveform: "triangle" },
            { frequency: 200, duration: 0.4, gain: 0.25, waveform: "triangle" },
        ],
    }),
    notification: () => ({
        label: "notification",
        notes: [
            { frequency: 880, duration: 0.08, gain: 0.2 },
            { frequency: 1108.73, duration: 0.08, gain: 0.2 },
        ],
    }),
    march: () => ({
        label: "march",
        notes: [
            { frequency: 196, duration: 0.2, gain: 0.2, waveform: "square" },
            { frequency: 0, duration: 0.1, gain: 0 },
            { frequency: 196, duration: 0.2, gain: 0.2, waveform: "square" },
            { frequency: 0, duration: 0.1, gain: 0 },
            { frequency: 220, duration: 0.2, gain: 0.2, waveform: "square" },
            { frequency: 0, duration: 0.1, gain: 0 },
            { frequency: 220, duration: 0.2, gain: 0.2, waveform: "square" },
        ],
    }),
    alarm: () => ({
        label: "alarm",
        notes: [
            { frequency: 440, duration: 0.1, gain: 0.4, waveform: "square" },
            { frequency: 0, duration: 0.1, gain: 0 },
            { frequency: 440, duration: 0.1, gain: 0.4, waveform: "square" },
            { frequency: 0, duration: 0.1, gain: 0 },
            { frequency: 440, duration: 0.2, gain: 0.4, waveform: "square" },
        ],
    }),
};
//# sourceMappingURL=audio_oscillator_mixer.js.map