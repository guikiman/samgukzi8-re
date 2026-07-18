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
export class ParticleSpritePacker {
    constructor(columns = 8, frameSize = 32) {
        this.sequences = new Map();
        this.columns = columns;
        this.frameSize = frameSize;
    }
    /**
     * 시트 기반 파티클 애니메이션 시퀀스 등록
     */
    registerSequence(type, startFrame, frameCount, fps, loop, sheetWidth, sheetHeight) {
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
            const idx = startFrame + i;
            const col = idx % this.columns;
            const row = Math.floor(idx / this.columns);
            frames.push({
                u: (col * this.frameSize) / sheetWidth,
                v: (row * this.frameSize) / sheetHeight,
                w: this.frameSize / sheetWidth,
                h: this.frameSize / sheetHeight,
            });
        }
        this.sequences.set(type, { type, frames, fps, loop });
    }
    /**
     * 시퀀스 조회
     */
    getSequence(type) {
        return this.sequences.get(type);
    }
    /**
     * 특정 시간의 프레임 조회
     */
    getFrameAt(type, elapsedMs) {
        const seq = this.sequences.get(type);
        if (!seq || seq.frames.length === 0)
            return undefined;
        const frameDuration = 1000 / seq.fps;
        let frameIndex = Math.floor(elapsedMs / frameDuration);
        if (seq.loop) {
            frameIndex = frameIndex % seq.frames.length;
        }
        else {
            frameIndex = Math.min(frameIndex, seq.frames.length - 1);
        }
        return seq.frames[frameIndex];
    }
    /**
     * 등록된 모든 시퀀스 타입
     */
    get types() {
        return Array.from(this.sequences.keys());
    }
    clear() {
        this.sequences.clear();
    }
}
//# sourceMappingURL=particle_sprite_packer.js.map