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
    readonly aiEventFrequency: number;     // AI 이벤트 발생 빈도 (1.0 = 기본)
    readonly disasterProbability: number;  // 자연재해 확률 (1.0 = 기본)
    readonly playerDebuffChance: number;   // 플레이어 디버프 확률 (1.0 = 기본)
    readonly aiDiplomacyBonus: number;     // AI 외교 보너스 (1.0 = 기본)
    readonly recruitmentCost: number;      // 징병 비용 (1.0 = 기본)
    readonly aiMoraleBonus: number;        // AI 사기 보너스
}

const DIFFICULTY_TABLE: Record<DifficultyLevel, DifficultyMultipliers> = {
    EASY: {
        aiEventFrequency: 0.6,
        disasterProbability: 0.5,
        playerDebuffChance: 0.3,
        aiDiplomacyBonus: 0.7,
        recruitmentCost: 0.8,
        aiMoraleBonus: 0.8,
    },
    NORMAL: {
        aiEventFrequency: 1.0,
        disasterProbability: 1.0,
        playerDebuffChance: 1.0,
        aiDiplomacyBonus: 1.0,
        recruitmentCost: 1.0,
        aiMoraleBonus: 1.0,
    },
    HARD: {
        aiEventFrequency: 1.5,
        disasterProbability: 1.8,
        playerDebuffChance: 2.0,
        aiDiplomacyBonus: 1.3,
        recruitmentCost: 1.2,
        aiMoraleBonus: 1.2,
    },
};

export class DifficultyCalibrator {
    private currentDifficulty: DifficultyLevel = 'NORMAL';

    setDifficulty(level: DifficultyLevel): void {
        this.currentDifficulty = level;
    }

    getDifficulty(): DifficultyLevel {
        return this.currentDifficulty;
    }

    getMultipliers(): DifficultyMultipliers {
        return { ...DIFFICULTY_TABLE[this.currentDifficulty] };
    }

    calibrateEventFrequency(baseFrequency: number): number {
        const mult = DIFFICULTY_TABLE[this.currentDifficulty].aiEventFrequency;
        return baseFrequency * mult;
    }

    calibrateDisasterProbability(baseProbability: number): number {
        const mult = DIFFICULTY_TABLE[this.currentDifficulty].disasterProbability;
        return Math.min(1.0, baseProbability * mult);
    }

    calibratePlayerDebuff(baseChance: number): number {
        const mult = DIFFICULTY_TABLE[this.currentDifficulty].playerDebuffChance;
        return Math.min(1.0, baseChance * mult);
    }

    rollTrigger(baseProbability: number, category: 'EVENT' | 'DISASTER' | 'DEBUFF'): boolean {
        let calibrated: number;
        switch (category) {
            case 'EVENT':
                calibrated = this.calibrateEventFrequency(baseProbability);
                break;
            case 'DISASTER':
                calibrated = this.calibrateDisasterProbability(baseProbability);
                break;
            case 'DEBUFF':
                calibrated = this.calibratePlayerDebuff(baseProbability);
                break;
        }
        return Math.random() < calibrated;
    }

    getDifficultyLabel(): string {
        const labels: Record<DifficultyLevel, string> = {
            EASY: '쉬움',
            NORMAL: '보통',
            HARD: '어려움',
        };
        return labels[this.currentDifficulty];
    }
}
