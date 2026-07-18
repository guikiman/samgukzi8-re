export type WaveformType = "sine" | "square" | "sawtooth" | "triangle";
export interface OscillatorNote {
    frequency: number;
    duration: number;
    gain?: number;
    waveform?: WaveformType;
}
export interface SoundEffect {
    readonly notes: OscillatorNote[];
    readonly label: string;
}
export declare class AudioOscillatorMixer {
    private ctx;
    private masterGain;
    private initialized;
    private mute;
    init(): Promise<boolean>;
    private ensureContext;
    setMasterGain(gain: number): void;
    isMuted(): boolean;
    setMuted(muted: boolean): void;
    playNote(note: OscillatorNote): OscillatorNode | null;
    playSequence(notes: OscillatorNote[]): void;
    playEffect(effect: SoundEffect): void;
    static readonly Effects: {
        turnChange: () => SoundEffect;
        buttonClick: () => SoundEffect;
        error: () => SoundEffect;
        victory: () => SoundEffect;
        defeat: () => SoundEffect;
        notification: () => SoundEffect;
        march: () => SoundEffect;
        alarm: () => SoundEffect;
    };
    dispose(): void;
}
//# sourceMappingURL=audio_oscillator_mixer.d.ts.map