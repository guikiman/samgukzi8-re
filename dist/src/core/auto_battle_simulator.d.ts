/**
 * [295] 유저 비개입 자동 전투 시뮬레이터 — Auto Battle Simulator
 *
 * Python 원본: src/systems/battle_engine.py → TypeScript 포팅 + 확장
 *
 * 설계 스펙:
 * - [295] 유저 비개입 전투 발생 시 0.1초 내 시뮬레이션 결과 도출
 * - Python battle_engine.py의 고저차 보정(elevation bonus) / 보급선 단절 사기 붕괴 이식
 * - 병력·사기·훈련·통솔 가중 종합 전투력 산출 → 라운드별 소모전 해결
 * - 지형 방어 보정, 크리티컬(무력 격차), 도시 방어막 반영
 * - 결과는 전투 리플레이 [312] 및 연대기 [441-460]에 사용 가능한 로그 형태
 */
import type { HexCoord } from './render_queue_types.js';
export type AutoBattleTerrain = 'PLAIN' | 'MOUNTAIN' | 'RIVER' | 'FOREST' | 'CITY_WALL';
/** 전장 단일 타일 (Python BattlefieldTile 포팅) */
export interface BattlefieldTile {
    readonly q: number;
    readonly r: number;
    terrain: AutoBattleTerrain;
    /** 타일 고저차 (고지대 공격 보정용) */
    elevation: number;
}
/** 자동 전투 참전 부대 (Python BattleUnit 포팅) */
export interface AutoBattleUnit {
    unitId: string;
    commanderId: string;
    commanderName: string;
    /** 통솔 — 지휘 효율 가중치 */
    leadership: number;
    /** 무력 — 크리티컬 판정 */
    might: number;
    soldiers: number;
    morale: number;
    training: number;
    /** 보급 상태 — 단절 시 매 라운드 사기 −10 (Python process_turn 이식) */
    isSupplied: boolean;
    position: HexCoord;
}
/** 양측 군편성 */
export interface AutoBattleSides {
    attacker: AutoBattleUnit;
    defender: AutoBattleUnit;
    /** 공격자가 성을 공격하는지 — 방어막 보정 적용 */
    siege: boolean;
    /** 공격자 타일 (고저차 보정용) */
    attackerTile?: BattlefieldTile;
    /** 방어자 타일 */
    defenderTile?: BattlefieldTile;
}
export interface AutoBattleRoundLog {
    round: number;
    attackerDamage: number;
    defenderDamage: number;
    attackerSoldiersAfter: number;
    defenderSoldiersAfter: number;
    criticals: Array<{
        side: 'attacker' | 'defender';
        who: string;
    }>;
    note?: string;
}
export interface AutoBattleResult {
    winner: 'attacker' | 'defender';
    /** 전투 지속 라운드 수 */
    rounds: number;
    attackerRemaining: number;
    defenderRemaining: number;
    /** 사망자 수 (양측 합계) */
    totalCasualties: number;
    roundLogs: AutoBattleRoundLog[];
    /** 연대기/보고서용 요약 문구 */
    summary: string;
}
/** 전투력 = 병력 × (사기/50) × (훈련/50) × (1 + 통솔/200) */
export declare function computeCombatPower(unit: AutoBattleUnit): number;
/** 보급선 단절 검사 — 적 진영이 두 유닛 사이를 완전히 가로막는지 (Python BFS 축약: 인접 봉쇄) */
export declare function isSupplyCut(unitPos: HexCoord, friendlyBase: HexCoord, enemyPositions: HexCoord[]): boolean;
/**
 * [295] 자동 전투 시뮬레이션 — 유저 비개입 전투를 라운드제 소모전으로 즉시 해결.
 * 성능 목표: 1,000회 연속 호출 기준 0.1초 내 완료 (라운드 ≤ 12의 O(1) 연산).
 */
export declare function simulateAutoBattle(sides: AutoBattleSides): AutoBattleResult;
/**
 * 전투력 비교 즉시 판정 — 더 가벼운 판정이 필요할 때 (외교/모의 전투 등).
 * 전투력 비율 + 난수로 단판 승부.
 */
export declare function resolveInstantBattle(sides: AutoBattleSides): AutoBattleResult;
//# sourceMappingURL=auto_battle_simulator.d.ts.map