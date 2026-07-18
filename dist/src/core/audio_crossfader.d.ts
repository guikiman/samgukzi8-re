export declare class AudioCrossfader {
    private ctx;
    private masterGain;
    private currentTrackGain;
    private currentSource;
    private isTransitioning;
    init(): Promise<boolean>;
    private ensureContext;
    loadTrack(url: string): Promise<AudioBuffer | null>;
    crossfadeTo(newBuffer: AudioBuffer, fadeOutDuration?: number, fadeInDuration?: number, loop?: boolean): void;
    fadeOut(duration?: number): void;
    fadeIn(duration?: number, targetVolume?: number): void;
    setVolume(volume: number): void;
    stop(): void;
    dispose(): void;
}
//# sourceMappingURL=audio_crossfader.d.ts.map