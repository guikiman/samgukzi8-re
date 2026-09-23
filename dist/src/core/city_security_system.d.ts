/**
 * [148][401] 도시 안정/전장 물리 — City Security & Debris (Python city_manager.py + battle_physics.py 포팅)
 *
 * Python 원본: src/systems/city_manager.py (riot_risk [148]) / battle_physics.py (debris ZOC [401])
 *
 * 설계 스펙:
 * - [148] 민란 위험도 — 징병 피로도, 군량 부족, 치안 저하로 축적 → 임계 도달 시 반란
 * - 아사 판정 — 군량 0 도달 시 병력 5% 소모 (Python: soldiers // 20)
 * - [401][408] 잔해(Debris) — 성벽 붕괴 등으로 생성, 헥스 ZOC 부여 및 이동 페널티
 */
import type { HexCoord } from './render_queue_types.js';
/** 민란 발생 임계 위험도 */
export declare const RIOT_THRESHOLD = 100;
/** 징병 1회당 피로도 증가 (Python: riot_risk += 5) */
export declare const RECRUIT_RIOT_INCREMENT = 5;
export interface CitySecurityState {
    cityId: string;
    /** 민란 위험도 0~100+ (Python riot_risk) */
    riotRisk: number;
    /** 민란 진압 직후 리셋 기준 */
    publicOrder: number;
}
/**
 * 징병에 따른 민란 위험도 축적 [148] — Python recruit_soldiers 이식.
 * @returns 갱신된 위험도
 */
export declare function accumulateRecruitFatigue(state: CitySecurityState, recruits: number): number;
/**
 * 굶주림에 따른 위험도 급등 + 병력 아사 [148] — Python process_turn 이식.
 * 군량 0 도달 시 병력 5% 소모 (Python: soldiers // 20) 및 위험도 +15.
 */
export declare function processStarvation(state: CitySecurityState, food: number, soldiers: number): {
    starveLoss: number;
    soldiersAfter: number;
    riotRisk: number;
};
/**
 * 월간 위험도 자연 감소 — 치안이 높을수록 빠르게 진정.
 * @returns 갱신된 위험도
 */
export declare function decayRiotRisk(state: CitySecurityState, publicOrder: number): number;
/** 민란 판정 결과 */
export interface RiotOutcome {
    occurred: boolean;
    /** 반란으로 이탈한 소속 세력 ID (occurred 시) */
    fromFactionId?: string;
    message?: string;
}
/**
 * [148] 민란 발생 판정 — 위험도 ≥ 임계 && 치안 미달 시 반란.
 * 반란 시 위험도는 40으로 부분 리셋 (근원 제거되지 않으면 재발 여지).
 */
export declare function checkRiot(state: CitySecurityState, ownerId: string | null, roll?: number): RiotOutcome;
/** 잔해 타일 — 성벽 붕괴/공성 후 생성 */
export interface DebrisTile {
    /** 헥스 키 "q,r" */
    key: string;
    q: number;
    r: number;
    /** 생성 턴 — 자연 소거(청소) 판정용 */
    createdAtTurn: number;
    /** 이동 비용 배율 (잔해 지대는 통과 비용 큼) */
    moveCostMultiplier: number;
}
export declare class DebrisField {
    private tiles;
    /** 잔해 생성 [401] — 성벽 붕괴물 물리. 중심 타일 + 1 반경 인접 헥스에 퍼짐 */
    createDebris(center: HexCoord, turn: number): DebrisTile[];
    /** 해당 헥스가 잔해인지 */
    hasDebris(q: number, r: number): boolean;
    /** 잔해 타일의 이동 비용 배율 — 비잔해는 1.0 */
    getMoveCostMultiplier(q: number, r: number): number;
    /**
     * [401] 잔해 ZOC — 잔해 타일에 인접한 헥스 집합 반환 (이동 제약 경계).
     * A* 패스파인더의 isPassable/getMoveCost에 결합하여 사용.
     */
    getDebrisZocKeys(): Set<string>;
    /** 잔해가 ZOC 경계에 있는지 */
    isInDebrisZoc(q: number, r: number): boolean;
    /** 수명 종료 잔해 자동 소거 [408] — 청소/붕괴 안정화 */
    cleanupExpired(currentTurn: number): number;
    /** 세이브/로드 */
    serialize(): DebrisTile[];
    restore(tiles: DebrisTile[]): void;
    get size(): number;
}
/** 잔해 확산 반경 상수 노출 (테스트/모딩용) */
export declare const DEBRIS_CONFIG: {
    readonly MOVE_COST: 2;
    readonly DURATION_TURNS: 3;
    readonly SPREAD_RADIUS: 1;
};
//# sourceMappingURL=city_security_system.d.ts.map