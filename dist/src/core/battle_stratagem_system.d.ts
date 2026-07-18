/**
 * [B16][B17] 전장 계략(Stratagems) + 포위망/보급선 시스템
 *
 * BattleStratagemManager:
 *   - ROCKFALL: 광역 물리 데미지
 *   - TRAP: 이동 불가 1턴
 *   - FIRE_ATTACK: 지속 데미지 3턴
 *   - AMBUSH: 적 부대를 아군 방향으로 유인
 *   - BURN_GRANARY: 매턴 사기 -10
 *   각 계략 SPIRIT 소모 (1~3), 지력 높을수록 성공률 증가
 */
import type { HexCoord } from './types';
import type { Weather } from './types';
export type StratagemType = 'ROCKFALL' | 'TRAP' | 'FIRE_ATTACK' | 'AMBUSH' | 'FALSE_RETREAT' | 'FLANK' | 'BURN_GRANARY';
export interface Stratagem {
    readonly type: StratagemType;
    readonly name: string;
    readonly spiritCost: number;
    readonly range: number;
    readonly damage: number;
    readonly duration: number;
    readonly description: string;
}
export declare const STRATAGEMS: Record<StratagemType, Stratagem>;
export interface StratagemEffect {
    readonly stratagem: Stratagem;
    readonly executorId: string;
    readonly targetTile: HexCoord;
    readonly success: boolean;
    readonly damageApplied: number;
    readonly durationRemaining: number;
    readonly moraleDamage: number;
}
export declare class BattleStratagemManager {
    private activeEffects;
    private effectIdCounter;
    getStratagem(type: StratagemType): Stratagem;
    getAllStratagems(): Stratagem[];
    /** 사용 가능 계략 목록 (지력 기반) */
    getAvailableStratagems(officerId: string, intelligence: number, spirit: number): Stratagem[];
    /** 계략 성공률 계산 */
    calculateSuccessRate(stratagemType: StratagemType, intelligence: number, weather: Weather): number;
    /** 계략 실행 */
    executeStratagem(stratagemType: StratagemType, executorId: string, targetTile: HexCoord, intelligence: number, weather: Weather, targetMorale: number): StratagemEffect;
    /** 매 턴 지속 효과 처리 */
    processActiveEffects(unitPositions: Map<string, HexCoord>): StratagemEffect[];
    /** 포위망 확인 (주변 6타일이 적에게 점령됨) */
    checkEncircled(unitCoord: HexCoord, enemyTiles: HexCoord[], radius?: number): boolean;
    private getNeighborCoords;
    getActiveEffects(): StratagemEffect[];
    clear(): void;
}
//# sourceMappingURL=battle_stratagem_system.d.ts.map