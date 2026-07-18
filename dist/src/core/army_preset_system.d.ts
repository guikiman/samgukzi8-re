/**
 * [3] 부대 편성 '원클릭 프리셋' 및 템플릿 세이브
 *
 * ArmyPresetSystem:
 *   - savePreset(): 현재 부대 구성을 localStorage에 저장
 *   - loadPreset(): 저장된 프리셋 복원
 *   - autoFillStrongest(): 무력 순 장수 자동 배치
 *   - recentFormations(): 최근 N개 편성 자동 보관 (LRU)
 */
import type { OfficerID, IGameStore } from './types.js';
export interface UnitSlot {
    readonly commanderId: OfficerID;
    readonly troopType: 'infantry' | 'cavalry' | 'archer' | 'siege';
    readonly subCommanders: OfficerID[];
    readonly equipment: string[];
}
export interface ArmyPreset {
    readonly id: string;
    readonly name: string;
    readonly slots: readonly UnitSlot[];
    readonly createdAt: number;
    readonly updatedAt: number;
}
export declare class ArmyPresetSystem {
    private readonly store;
    private presets;
    private recentFormations;
    constructor(store: IGameStore);
    /** 현재 편성을 프리셋으로 저장 */
    savePreset(name: string, slots: UnitSlot[]): ArmyPreset;
    /** 프리셋 불러오기 */
    loadPreset(id: string): ArmyPreset | null;
    /** [3] 이전 편성 불러오기 (가장 최근 사용) */
    loadLatestPreset(): ArmyPreset | null;
    /** [3] 원클릭 최강 군대 편성 — 무력 순 장수 자동 배치 */
    autoFillStrongest(factionId: string, count?: number): UnitSlot[];
    /** 모든 프리셋 목록 */
    getAllPresets(): readonly ArmyPreset[];
    /** 최근 사용 편성 */
    getRecentFormations(): readonly ArmyPreset[];
    /** 프리셋 삭제 */
    deletePreset(id: string): boolean;
    private loadFromStorage;
    private saveToStorage;
}
//# sourceMappingURL=army_preset_system.d.ts.map