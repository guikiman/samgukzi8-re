/**
 * [B19] 포로 포획/처분 시스템 — Prisoner System
 *
 * PrisonerManager:
 *   - capturePrisoner(): 전투 후 포로 포획
 *   - executePrisoner(): 처단 (외교 -50)
 *   - recruitPrisoner(): 등용 (충성도 역수 × 설득력)
 *   - releasePrisoner(): 해방 (외교 +20)
 *   - negotiateRansom(): 포로 협상
 *   - attemptEscape(): 탈옥 (지력/200 확률)
 */
import type { OfficerID, FactionID } from './types';
export type PrisonerStatus = 'CAPTURED' | 'UNDER_GUARD' | 'NEGOTIATING' | 'RELEASED' | 'EXECUTED' | 'RECRUITED' | 'ESCAPED';
export interface Prisoner {
    readonly officerId: OfficerID;
    readonly captorFactionId: FactionID;
    readonly originalFactionId: FactionID;
    readonly captureDate: number;
    readonly status: PrisonerStatus;
    readonly escapeAttempts: number;
    readonly negotiationCount: number;
}
export interface PrisonerAction {
    readonly officerId: OfficerID;
    readonly action: PrisonerStatus;
    readonly success: boolean;
    readonly message: string;
    readonly diplomacyModifier: number;
}
export declare class PrisonerManager {
    private prisoners;
    /** 포로 포획 */
    capturePrisoner(officerId: OfficerID, captorFactionId: FactionID, originalFactionId: FactionID, remainingHp: number, maxHp: number): Prisoner | null;
    /** 처단 */
    executePrisoner(officerId: OfficerID): PrisonerAction | null;
    /** 등용 */
    recruitPrisoner(officerId: OfficerID, _recruiterId: OfficerID, loyalty: number, persuasion: number): PrisonerAction;
    /** 해방 */
    releasePrisoner(officerId: OfficerID): PrisonerAction | null;
    /** 포로 협상 (금 요구) */
    negotiateRansom(officerId: OfficerID, ransomAmount: number): PrisonerAction;
    /** 탈옥 시도 */
    attemptEscape(officerId: OfficerID, intelligence: number): PrisonerAction;
    getPrisoner(officerId: OfficerID): Prisoner | undefined;
    getPrisonersByFaction(factionId: FactionID): Prisoner[];
    getAllPrisoners(): Prisoner[];
    clear(): void;
}
//# sourceMappingURL=prisoner_system.d.ts.map