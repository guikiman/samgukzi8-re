export interface SpouseBonus {
    readonly combatSync: number;
    readonly domesticBonus: number;
    readonly loyaltyBonus: number;
    readonly childBonus: number;
}
export declare class SpouseSynergySystem {
    calculateCombatSync(husbandMight: number, wifeMight: number, marriageDuration: number): number;
    calculateDomesticBonus(husbandPolitics: number, wifePolitics: number, marriageDuration: number): number;
    calculateLoyaltyBonus(marriageDuration: number, hasChildren: boolean): number;
    getSpouseBonus(selfStats: {
        might: number;
        politics: number;
    }, spouseStats: {
        might: number;
        politics: number;
    }, marriageDuration: number, hasChildren: boolean): SpouseBonus;
    calculateJointBattleDamage(baseDamage: number, combatSync: number): number;
}
//# sourceMappingURL=spouse_synergy_system.d.ts.map