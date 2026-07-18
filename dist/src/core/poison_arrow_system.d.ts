/**
 * [14] 맹독 화살 시스템 — Poison Arrow System
 *
 * 맹독 화살 타격 시 무장의 병상 발생 플래그 및
 * 매 턴 병력 감소 계수를 지수 로그 감쇠로 연산
 */
import type { OfficerID } from './types.js';
export interface PoisonState {
    officerId: OfficerID;
    poisonLevel: number;
    startTurn: number;
    currentTurn: number;
    baseTroopLoss: number;
    isActive: boolean;
}
export declare class PoisonArrowSystem {
    private poisoned;
    /**
     * 독 화살 명중
     *
     * @param poisonLevel 독 레벨 (1~10, 높을수록 강력)
     */
    applyPoison(officerId: OfficerID, poisonLevel: number, currentTurn: number): PoisonState;
    /**
     * 매 턴 독 피해 처리
     *
     * 공식: loss = baseLoss × exp(-decayRate × elapsedTurns)
     *   - decayRate = 0.3 (독 자연 소멸 속도)
     *   - elapsedTurns = currentTurn - startTurn
     *   - loss는 턴이 지날수록 지수적으로 감소
     */
    processPoisonTurn(officerId: OfficerID, currentTurn: number): number;
    /**
     * 특정 무장의 중독 상태 확인
     */
    isPoisoned(officerId: OfficerID): boolean;
    /**
     * 중독 상태 조회
     */
    getPoisonState(officerId: OfficerID): PoisonState | null;
    /**
     * 해독 치료
     */
    curePoison(officerId: OfficerID): boolean;
    /**
     * 예상 피해량 계산 (실행 전 예측)
     */
    predictDamage(officerId: OfficerID, currentTurn: number): number;
    getAllPoisoned(): PoisonState[];
    reset(): void;
}
//# sourceMappingURL=poison_arrow_system.d.ts.map