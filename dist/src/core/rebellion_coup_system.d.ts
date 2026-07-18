/**
 * [A9] 반란 및 쿠데타 이벤트 트리거 — Rebellion & Coup System
 *
 * RebellionManager:
 *   - attemptCoup(): 태수/도독의 쿠데타 시도
 *   - triggerRevolt(): 세력 내 반란
 *   - defectToFaction(): 타 세력으로 투항
 *   - 쿠데타 성공 = 충성도 < 30 + 통솔 > 70 + 도시병력 > 세력총병력×0.3
 */
import type { OfficerID, CityID, FactionID } from './types';
export type TriggerType = 'COUP' | 'REVOLT' | 'DEFECT';
export interface RebellionTrigger {
    readonly rebelOfficerId: OfficerID;
    readonly targetCityId: CityID;
    readonly targetFactionId: FactionID;
    readonly triggerType: TriggerType;
    readonly timestamp: number;
}
export interface CoupResult {
    readonly success: boolean;
    readonly capturedCityIds: CityID[];
    readonly defectedOfficerIds: OfficerID[];
    readonly newFactionId: FactionID | null;
    readonly message: string;
}
export interface RevoltResult {
    readonly success: boolean;
    readonly damagedCityId: CityID | null;
    readonly destroyedFacilities: number;
    readonly lostSoldiers: number;
    readonly message: string;
}
export interface DefectResult {
    readonly success: boolean;
    readonly targetFactionId: FactionID;
    readonly message: string;
}
export declare class RebellionManager {
    private triggers;
    getTriggers(): RebellionTrigger[];
    /**
     * 쿠데타 시도
     * @param officerId - 쿠데타 주도 무장
     * @param cityId - 대상 도시
     * @param cityTroops - 도시 병력
     * @param factionTotalTroops - 세력 총 병력
     * @param loyalty - 무장의 충성도 (0~100)
     * @param leadership - 무장의 통솔력 (0~100)
     */
    attemptCoup(officerId: OfficerID, cityId: CityID, cityTroops: number, factionTotalTroops: number, loyalty: number, leadership: number): CoupResult;
    /**
     * 세력 내 반란 발생
     * @param officerId - 반란 주도 무장
     * @param factionId - 대상 세력
     * @param cityId - 반란 발생 도시
     * @param garrisonLoyalty - 수비대 충성도 (0~100)
     * @param publicOrder - 도시 치안 (0~100)
     */
    triggerRevolt(officerId: OfficerID, factionId: FactionID, cityId: CityID, garrisonLoyalty: number, publicOrder: number): RevoltResult;
    /**
     * 타 세력으로 투항
     * @param officerId - 투항 무장
     * @param currentFactionId - 현재 세력
     * @param targetFactionId - 대상 세력
     * @param loyalty - 현재 충성도
     */
    defectToFaction(officerId: OfficerID, currentFactionId: FactionID, targetFactionId: FactionID, loyalty: number): DefectResult;
    clearTriggers(): void;
}
//# sourceMappingURL=rebellion_coup_system.d.ts.map