/**
 * [Task 81] 헥스 타일 애니메이터 — HexTileAnimator
 *
 * 목적: 헥스 타일의 선택, 호버, 이동 가능 표시 등
 *       상태별 시각적 애니메이션 처리.
 *
 * 핵심 로직:
 *   1. 타일 상태별 애니메이션 (선택/호버/이동가능/공격가능)
 *   2. 페이드 인/아웃, 깜빡임, 색상 전환
 */
export class HexTileAnimator {
    constructor() {
        this.animTime = 0;
        this.activeTiles = new Map();
    }
    /**
     * 타임 업데이트
     */
    update(dt) {
        this.animTime += dt;
    }
    /**
     * 타일 상태 설정
     */
    setState(tileId, state) {
        this.activeTiles.set(tileId, { state, startTime: this.animTime });
    }
    /**
     * 타일 상태 제거
     */
    removeState(tileId) {
        this.activeTiles.delete(tileId);
    }
    /**
     * 특정 타일의 현재 애니메이션 색상 계산
     */
    getColor(tileId) {
        const entry = this.activeTiles.get(tileId);
        if (!entry)
            return [1, 1, 1, 1];
        const config = HexTileAnimator.CONFIGS[entry.state];
        const elapsed = this.animTime - entry.startTime;
        const progress = Math.min(elapsed / config.duration, 1);
        if (config.pulse) {
            const pulse = Math.sin(progress * Math.PI * 4) * 0.3 + 0.7;
            return [
                config.color[0] * pulse,
                config.color[1] * pulse,
                config.color[2] * pulse,
                config.color[3],
            ];
        }
        return config.color;
    }
    /**
     * 모든 활성 타일 상태 초기화
     */
    clearAll() {
        this.activeTiles.clear();
    }
}
HexTileAnimator.CONFIGS = {
    idle: { state: "idle", duration: 0, color: [1, 1, 1, 1], pulse: false },
    hover: { state: "hover", duration: 0.3, color: [1, 1, 0.8, 0.6], pulse: false },
    selected: { state: "selected", duration: 0.5, color: [0, 0.8, 1, 0.8], pulse: true },
    movable: { state: "movable", duration: 0.8, color: [0, 0.6, 1, 0.5], pulse: true },
    attackable: { state: "attackable", duration: 0.6, color: [1, 0.2, 0.2, 0.6], pulse: true },
    healable: { state: "healable", duration: 0.6, color: [0, 1, 0.4, 0.5], pulse: true },
};
//# sourceMappingURL=hex_tile_animator.js.map