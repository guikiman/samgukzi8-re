export class AudioCrossfader {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.currentTrackGain = null;
        this.currentSource = null;
        this.isTransitioning = false;
    }
    async init() {
        try {
            const AC = window.AudioContext
                || window.webkitAudioContext;
            if (!AC)
                return false;
            this.ctx = new AC();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            return true;
        }
        catch {
            return false;
        }
    }
    ensureContext() {
        if (!this.ctx || !this.masterGain) {
            throw new Error("AudioCrossfader not initialized");
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
        return this.ctx;
    }
    async loadTrack(url) {
        try {
            const ctx = this.ensureContext();
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await ctx.decodeAudioData(arrayBuffer);
        }
        catch {
            return null;
        }
    }
    crossfadeTo(newBuffer, fadeOutDuration = 1.0, fadeInDuration = 1.0, loop = true) {
        const ctx = this.ensureContext();
        if (this.isTransitioning)
            return;
        this.isTransitioning = true;
        const previousSource = this.currentSource;
        const previousGain = this.currentTrackGain;
        const newGain = ctx.createGain();
        newGain.gain.setValueAtTime(0, ctx.currentTime);
        newGain.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeInDuration);
        const newSource = ctx.createBufferSource();
        newSource.buffer = newBuffer;
        newSource.loop = loop;
        newSource.connect(newGain);
        newGain.connect(this.masterGain);
        newSource.start(ctx.currentTime);
        this.currentSource = newSource;
        this.currentTrackGain = newGain;
        if (previousSource && previousGain) {
            previousGain.gain.setValueAtTime(1, ctx.currentTime);
            previousGain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOutDuration);
            previousSource.stop(ctx.currentTime + fadeOutDuration + 0.1);
        }
        setTimeout(() => {
            this.isTransitioning = false;
        }, (fadeOutDuration + fadeInDuration) * 1000);
    }
    fadeOut(duration = 1.0) {
        if (!this.masterGain || !this.ctx)
            return;
        const ctx = this.ctx;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    }
    fadeIn(duration = 1.0, targetVolume = 0.3) {
        if (!this.masterGain || !this.ctx)
            return;
        const ctx = this.ctx;
        this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + duration);
    }
    setVolume(volume) {
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
        }
    }
    stop() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            }
            catch { }
            this.currentSource = null;
        }
        this.currentTrackGain = null;
    }
    dispose() {
        this.stop();
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
        this.masterGain = null;
    }
}
//# sourceMappingURL=audio_crossfader.js.map