/**
 * [Phase 16] 시각 효과 관리자
 * 스크린 쉐이크, 파티클 물리, 동적 광원 셰이더
 */

export class VisualEffects {
    constructor() {
        this.shakeIntensity = 0;
    }

    applyShake(intensity, duration) {
        this.shakeIntensity = intensity;
        setTimeout(() => this.shakeIntensity = 0, duration);
    }

    // 파티클 생성 함수 (WebGL buffer 업데이트 인터페이스 가정)
    spawnDust(x, y) {
        // 물리 엔진 기반 먼지 파티클 생성 로직
    }
}
