/**
 * [B12] 포위망 및 ZOC 차단 시스템 — FlankingZOCRestriction
 *
 * 목적: 헥사곤 타일 상에서 적 부대의 통제 영역(Zone of Control) 및
 *       다각도 포위 상태 판정.
 *
 * 핵심 로직:
 *   1. 적 부대 인접 6방향 타일 → ZOC 설정 (일반 통과 차단)
 *   2. 아군 2개 이상 부대가 적을 샌드위치 → 측방/후방 데미지 1.2~1.5배
 */

export interface HexCoord {
    readonly q: number;
    readonly r: number;
}

export interface ZOCState {
    readonly unitId: string;
    readonly zocTiles: string[];    // "q,r" 키 목록
    readonly flankRatio: number;     // 1.0 = 일반, 1.2~1.5 = 포위
}

export interface FlankingResult {
    readonly flankingBonus: number;
    readonly attackerCount: number;
    readonly isPincer: boolean;       // 협공(양쪽 포위)
    readonly isSurrounded: boolean;   // 완전 포위
}

const HEX_DIRECTIONS: [number, number][] = [
    [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];

export class FlankingZOCRestriction {
    /** 특정 부대의 ZOC 타일 목록 계산 */
    getZOCTiles(q: number, r: number): string[] {
        return HEX_DIRECTIONS.map(([dq, dr]) => `${q + dq},${r + dr}`);
    }

    /** 해당 타일이 ZOC(통제 영역)에 속하는지 확인 */
    isInZOC(tileKey: string, enemyPositions: HexCoord[]): boolean {
        return enemyPositions.some(enemy => {
            const zocTiles = this.getZOCTiles(enemy.q, enemy.r);
            return zocTiles.includes(tileKey);
        });
    }

    /**
     * 포위 상태 판정
     *
     * @param targetQ     - 대상 부대 q 좌표
     * @param targetR     - 대상 부대 r 좌표
     * @param allyPositions - 아군 부대 위치 목록
     */
    evaluateFlanking(targetQ: number, targetR: number, allyPositions: HexCoord[]): FlankingResult {
        // 대상 기준 6방향 타일 중 아군이 점유한 수
        const occupiedSides = HEX_DIRECTIONS.filter(([dq, dr]) => {
            return allyPositions.some(a => a.q === targetQ + dq && a.r === targetR + dr);
        });

        const attackerCount = occupiedSides.length;

        // 2방향 이상 점유 = 포위
        const isPincer = attackerCount >= 2;
        const isSurrounded = attackerCount >= 4;

        // 포위 보너스: 1방향=1.0, 2방향=1.2, 3방향=1.3, 4방향+=1.5
        let flankingBonus = 1.0;
        if (attackerCount >= 4) flankingBonus = 1.5;
        else if (attackerCount >= 3) flankingBonus = 1.3;
        else if (attackerCount >= 2) flankingBonus = 1.2;

        return { flankingBonus, attackerCount, isPincer, isSurrounded };
    }

    /** ZOC로 인한 강제 정지 여부 판정 (ZOC 타일 통과 시도 시) */
    isBlockedByZOC(fromQ: number, fromR: number, toQ: number, toR: number, enemyPositions: HexCoord[]): boolean {
        // 목표 타일이 적 ZOC 내에 있고, 진입하는 부대의 출발 타일도 ZOC 내면 차단
        const toKey = `${toQ},${toR}`;
        const fromKey = `${fromQ},${fromR}`;
        return this.isInZOC(toKey, enemyPositions) && !this.isInZOC(fromKey, enemyPositions);
    }
}
