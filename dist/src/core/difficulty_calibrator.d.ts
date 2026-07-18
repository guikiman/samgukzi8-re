/**
 * [29] 게임 난이도 계수 동적 트리거 보정기 — DifficultyCalibrator
 *
 * DifficultyCalibrator:
 *   1. 쉬움/보통/어려움 난이도에 따라 AI의 이벤트 발생 빈도 보정
 *   2. 플레이어에게 가해지는 자연재해 디버프 확률을 실시간으로 조정
 *   3. 난이도별 가중치 테이블 기반 연산
 */
export type DifficultyLevel = 'EASY' | 'NORMAL' | 'HARD';
export interface DifficultyMultipliers {
    readonly aiEventFrequency: number;
    readonly disasterProbability: number;
    readonly playerDebuffChance: number;
    readonly aiDiplomacyBonus: number;
    readonly recruitmentCost: number;
    readonly aiMoraleBonus: number;
}
export declare class DifficultyCalibrator {
    private currentDifficulty;
    setDifficulty(level: DifficultyLevel): void;
    getDifficulty(): DifficultyLevel;
    getMultipliers(): DifficultyMultipliers;
    calibrateEventFrequency(baseFrequency: number): number;
    calibrateDisasterProbability(baseProbability: number): number;
    calibratePlayerDebuff(baseChance: number): number;
    rollTrigger(baseProbability: number, category: 'EVENT' | 'DISASTER' | 'DEBUFF'): boolean;
    getDifficultyLabel(): string;
}
//# sourceMappingURL=difficulty_calibrator.d.ts.map