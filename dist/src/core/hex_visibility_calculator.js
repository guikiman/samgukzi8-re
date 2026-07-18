/**
 * [Task 84] 헥스 가시성 계산기 — HexVisibilityCalculator
 *
 * 목적: 유닛의 시야 범위를 기반으로 헥스 타일의
 *       가시 여부를 계산.
 *
 * 핵심 로직:
 *   1. 유닛 위치에서 반경 내 타일 가시 판정
 *   2. 장애물(산, 숲)에 의한 시야 차단
 */
export class HexVisibilityCalculator {
    /**
     * 시야 반경 내 타일 목록 계산 (Bresenham 기반)
     */
    computeVisibleTiles(originQ, originR, sightRange, isBlocked) {
        const results = [];
        const visited = new Set();
        for (let dq = -sightRange; dq <= sightRange; dq++) {
            for (let dr = -sightRange; dr <= sightRange; dr++) {
                const q = originQ + dq;
                const r = originR + dr;
                const key = `${q},${r}`;
                if (visited.has(key))
                    continue;
                visited.add(key);
                const dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));
                if (dist > sightRange)
                    continue;
                // 시야 차단 검사
                const blocked = this.isLineBlocked(originQ, originR, q, r, isBlocked);
                results.push({ q, r, visible: !blocked });
            }
        }
        return results;
    }
    /**
     * 두 헥스 좌표 사이의 시야 차단 검사
     */
    isLineBlocked(q0, r0, q1, r1, isBlocked) {
        const steps = Math.max(Math.abs(q1 - q0), Math.abs(r1 - r0), Math.abs(-q1 - r1 + q0 + r0));
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const q = Math.round(q0 + (q1 - q0) * t);
            const r = Math.round(r0 + (r1 - r0) * t);
            if (isBlocked(q, r))
                return true;
        }
        return false;
    }
}
//# sourceMappingURL=hex_visibility_calculator.js.map