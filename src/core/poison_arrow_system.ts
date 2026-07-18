/**
 * [14] 맹독 화살 시스템 — Poison Arrow System
 *
 * 맹독 화살 타격 시 무장의 병상 발생 플래그 및
 * 매 턴 병력 감소 계수를 지수 로그 감쇠로 연산
 */

import type { OfficerID } from './types.js';

export interface PoisonState {
    officerId: OfficerID;
    poisonLevel: number;     // 1~10
    startTurn: number;
    currentTurn: number;
    baseTroopLoss: number;   // 초기 병력 감소량
    isActive: boolean;
}

export class PoisonArrowSystem {
    private poisoned: Map<OfficerID, PoisonState> = new Map();

    /**
     * 독 화살 명중
     *
     * @param poisonLevel 독 레벨 (1~10, 높을수록 강력)
     */
    applyPoison(officerId: OfficerID, poisonLevel: number, currentTurn: number): PoisonState {
        const baseLoss = Math.floor(50 * (poisonLevel / 10));
        const state: PoisonState = {
            officerId,
            poisonLevel: Math.max(1, Math.min(10, poisonLevel)),
            startTurn: currentTurn,
            currentTurn,
            baseTroopLoss: baseLoss,
            isActive: true,
        };
        this.poisoned.set(officerId, state);
        return state;
    }

    /**
     * 매 턴 독 피해 처리
     *
     * 공식: loss = baseLoss × exp(-decayRate × elapsedTurns)
     *   - decayRate = 0.3 (독 자연 소멸 속도)
     *   - elapsedTurns = currentTurn - startTurn
     *   - loss는 턴이 지날수록 지수적으로 감소
     */
    processPoisonTurn(officerId: OfficerID, currentTurn: number): number {
        const state = this.poisoned.get(officerId);
        if (!state || !state.isActive) return 0;

        state.currentTurn = currentTurn;
        const elapsedTurns = currentTurn - state.startTurn;
        const decayRate = 0.3;
        const loss = Math.floor(state.baseTroopLoss * Math.exp(-decayRate * elapsedTurns));

        // 5턴 이상 경과 시 자연 치유
        if (elapsedTurns >= 5 || loss < 1) {
            state.isActive = false;
            this.poisoned.delete(officerId);
        }

        return Math.max(0, loss);
    }

    /**
     * 특정 무장의 중독 상태 확인
     */
    isPoisoned(officerId: OfficerID): boolean {
        return this.poisoned.has(officerId) && this.poisoned.get(officerId)!.isActive;
    }

    /**
     * 중독 상태 조회
     */
    getPoisonState(officerId: OfficerID): PoisonState | null {
        return this.poisoned.get(officerId) ?? null;
    }

    /**
     * 해독 치료
     */
    curePoison(officerId: OfficerID): boolean {
        const state = this.poisoned.get(officerId);
        if (!state) return false;
        state.isActive = false;
        this.poisoned.delete(officerId);
        return true;
    }

    /**
     * 예상 피해량 계산 (실행 전 예측)
     */
    predictDamage(officerId: OfficerID, currentTurn: number): number {
        const state = this.poisoned.get(officerId);
        if (!state || !state.isActive) return 0;
        const elapsedTurns = currentTurn - state.startTurn;
        return Math.max(0, Math.floor(state.baseTroopLoss * Math.exp(-0.3 * elapsedTurns)));
    }

    getAllPoisoned(): PoisonState[] {
        return Array.from(this.poisoned.values()).filter(p => p.isActive);
    }

    reset(): void {
        this.poisoned.clear();
    }
}
