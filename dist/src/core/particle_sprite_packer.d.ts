/**
 * [Task 78] 파티클 스프라이트 패커 — ParticleSpritePacker
 *
 * 목적: 파티클 효과(불, 연기, 물방울, 별 등)의
 *       스프라이트 시트를 아틀라스에 패킹.
 *
 * 핵심 로직:
 *   1. 파티클 타입별 시트 프레임 인덱스
 *   2. 애니메이션 프레임 시퀀스 관리
 */
export type ParticleType = "fire" | "smoke" | "water" | "spark" | "leaf" | "snow" | "blood" | "magic";
export interface ParticleAnimFrame {
    readonly u: number;
    readonly v: number;
    readonly w: number;
    readonly h: number;
}
export interface ParticleAnimSequence {
    readonly type: ParticleType;
    readonly frames: ParticleAnimFrame[];
    readonly fps: number;
    readonly loop: boolean;
}
export declare class ParticleSpritePacker {
    private sequences;
    private readonly columns;
    private readonly frameSize;
    constructor(columns?: number, frameSize?: number);
    /**
     * 시트 기반 파티클 애니메이션 시퀀스 등록
     */
    registerSequence(type: ParticleType, startFrame: number, frameCount: number, fps: number, loop: boolean, sheetWidth: number, sheetHeight: number): void;
    /**
     * 시퀀스 조회
     */
    getSequence(type: ParticleType): ParticleAnimSequence | undefined;
    /**
     * 특정 시간의 프레임 조회
     */
    getFrameAt(type: ParticleType, elapsedMs: number): ParticleAnimFrame | undefined;
    /**
     * 등록된 모든 시퀀스 타입
     */
    get types(): ParticleType[];
    clear(): void;
}
//# sourceMappingURL=particle_sprite_packer.d.ts.map