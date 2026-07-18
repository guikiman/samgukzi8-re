/**
 * [Task 44] 자녀 성장 단계 압축 저장 — ChildhoodVirtualizer
 *
 * 0~14세 아동기를 연간 스냅샷으로 압축하여 저장.
 */
export var ChildhoodStage;
(function (ChildhoodStage) {
    ChildhoodStage[ChildhoodStage["INFANT"] = 0] = "INFANT";
    ChildhoodStage[ChildhoodStage["TODDLER"] = 1] = "TODDLER";
    ChildhoodStage[ChildhoodStage["CHILD"] = 2] = "CHILD";
    ChildhoodStage[ChildhoodStage["ADOLESCENT"] = 3] = "ADOLESCENT";
})(ChildhoodStage || (ChildhoodStage = {}));
export class ChildhoodVirtualizer {
    constructor() {
        this.records = new Map();
    }
    initializeRecord(officerId, birthYear, birthMonth, fatherId, motherId, baseStats, basePersonality) {
        const record = {
            officerId, birthYear, birthMonth,
            parentFatherId: fatherId, parentMotherId: motherId,
            snapshots: [],
            baseStats, basePersonality,
            isVirtualized: false,
        };
        this.records.set(officerId, record);
        return record;
    }
    addYearSnapshot(officerId, age, statsGrowth, expGrowth, event, health) {
        const record = this.records.get(officerId);
        if (!record)
            return false;
        const stage = age <= 2 ? ChildhoodStage.INFANT
            : age <= 6 ? ChildhoodStage.TODDLER
                : age <= 10 ? ChildhoodStage.CHILD
                    : ChildhoodStage.ADOLESCENT;
        const snapshot = {
            age, stage,
            height: 50 + age * 5 + Math.round(Math.random() * 10 - 5),
            weight: 3 + age * 2 + Math.round(Math.random() * 3 - 1.5),
            stats: statsGrowth, exp: expGrowth,
            personalityTraits: [],
            notableEvent: event,
            health,
        };
        record.snapshots.push(snapshot);
        return true;
    }
    virtualize(officerId, currentYear) {
        const record = this.records.get(officerId);
        if (!record)
            throw new Error(`No record for officer ${officerId}`);
        record.snapshots = [];
        const base = record.baseStats;
        const parentAvg = (record.parentFatherId ? 55 : 50);
        for (let age = 0; age <= 14; age++) {
            const stage = age <= 2 ? ChildhoodStage.INFANT
                : age <= 6 ? ChildhoodStage.TODDLER
                    : age <= 10 ? ChildhoodStage.CHILD
                        : ChildhoodStage.ADOLESCENT;
            const growthMult = stage === ChildhoodStage.INFANT ? 1
                : stage === ChildhoodStage.TODDLER ? 3
                    : stage === ChildhoodStage.CHILD ? 5
                        : 7;
            const variance = () => Math.round((Math.random() - 0.5) * 0.4 * growthMult);
            const statsGrowth = {
                leadership: Math.max(0, Math.min(200, base.leadership * 0.1 + growthMult + variance())),
                might: Math.max(0, Math.min(200, base.might * 0.1 + growthMult + variance())),
                intelligence: Math.max(0, Math.min(200, base.intelligence * 0.1 + growthMult + variance())),
                politics: Math.max(0, Math.min(200, base.politics * 0.1 + growthMult + variance())),
                charisma: Math.max(0, Math.min(200, base.charisma * 0.1 + growthMult + variance())),
            };
            const expGrowth = {
                leadership: Math.round(growthMult * 2), might: Math.round(growthMult * 2),
                intelligence: Math.round(growthMult * 2), politics: Math.round(growthMult * 2),
                charisma: Math.round(growthMult * 2),
            };
            record.snapshots.push({
                age, stage,
                height: 50 + age * 5 + Math.round(Math.random() * 10 - 5),
                weight: 3 + age * 2 + Math.round(Math.random() * 3 - 1.5),
                stats: statsGrowth, exp: expGrowth,
                personalityTraits: [],
                notableEvent: null,
                health: Math.max(50, 100 - age * 2 + Math.round(Math.random() * 10)),
            });
        }
        record.isVirtualized = true;
        return record;
    }
    getProjectedStatsAtAge(officerId, targetAge) {
        const record = this.records.get(officerId);
        if (!record || record.snapshots.length === 0)
            return null;
        const snapshot = record.snapshots.find((s) => s.age === targetAge);
        if (!snapshot)
            return null;
        const base = record.baseStats;
        return {
            leadership: base.leadership + (snapshot.stats.leadership ?? 0),
            might: base.might + (snapshot.stats.might ?? 0),
            intelligence: base.intelligence + (snapshot.stats.intelligence ?? 0),
            politics: base.politics + (snapshot.stats.politics ?? 0),
            charisma: base.charisma + (snapshot.stats.charisma ?? 0),
        };
    }
    mature(officerId, currentYear) {
        const record = this.records.get(officerId);
        if (!record || record.snapshots.length === 0) {
            return {
                finalStats: { ...record?.baseStats ?? { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 } },
                finalExp: { leadership: 0, might: 0, intelligence: 0, politics: 0, charisma: 0 },
                finalPersonality: record?.basePersonality ?? "CALM",
                childhoodSummary: "기록 없음",
            };
        }
        const lastSnapshot = record.snapshots[record.snapshots.length - 1];
        const finalStats = {
            leadership: Math.round(record.baseStats.leadership + (lastSnapshot.stats.leadership ?? 0)),
            might: Math.round(record.baseStats.might + (lastSnapshot.stats.might ?? 0)),
            intelligence: Math.round(record.baseStats.intelligence + (lastSnapshot.stats.intelligence ?? 0)),
            politics: Math.round(record.baseStats.politics + (lastSnapshot.stats.politics ?? 0)),
            charisma: Math.round(record.baseStats.charisma + (lastSnapshot.stats.charisma ?? 0)),
        };
        return {
            finalStats,
            finalExp: {
                leadership: Math.round(record.baseStats.leadership * 0.5),
                might: Math.round(record.baseStats.might * 0.5),
                intelligence: Math.round(record.baseStats.intelligence * 0.5),
                politics: Math.round(record.baseStats.politics * 0.5),
                charisma: Math.round(record.baseStats.charisma * 0.5),
            },
            finalPersonality: record.basePersonality,
            childhoodSummary: `${record.snapshots.length}년간의 성장 기록 (가상화: ${record.isVirtualized})`,
        };
    }
    getRecord(officerId) {
        return this.records.get(officerId);
    }
    isVirtualized(officerId) {
        return this.records.get(officerId)?.isVirtualized ?? false;
    }
    deleteRecord(officerId) {
        return this.records.delete(officerId);
    }
    getCompressedSize(officerId) {
        const record = this.records.get(officerId);
        if (!record)
            return 0;
        const json = JSON.stringify(record);
        return new Blob([json]).size;
    }
}
//# sourceMappingURL=childhood_virtualizer.js.map