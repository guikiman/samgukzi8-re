/**
 * [Task 40] 양자 관계 등록 시스템 — AdoptionSystem
 *
 * 무장 간 양자(adoptive parent-child) 관계를 등록하고 관리.
 * 가계도와 연동되어 혈연이 아닌 법적 가족 관계를 처리.
 */
import type { OfficerID } from "./types.js";
export interface AdoptionRecord {
    readonly id: string;
    readonly parentId: OfficerID;
    readonly childId: OfficerID;
    readonly adoptionYear: number;
    readonly adoptionMonth: number;
    readonly isPermanent: boolean;
    disowned: boolean;
    disownYear?: number;
}
export interface AdoptionResult {
    readonly success: boolean;
    readonly record?: AdoptionRecord;
    readonly reason?: string;
}
export declare class AdoptionSystem {
    private adoptions;
    private parentChildren;
    private childParents;
    private idCounter;
    /**
     * 양자 관계 등록
     */
    adopt(parentId: OfficerID, childId: OfficerID, year: number, month: number, isPermanent?: boolean): AdoptionResult;
    /**
     * 양자 관계 파기 (서자/폐적)
     */
    disown(adoptionId: string, year: number): AdoptionResult;
    /**
     * 양부모 조회
     */
    getAdoptiveParents(childId: OfficerID): OfficerID[];
    /**
     * 양자녀 조회
     */
    getAdoptiveChildren(parentId: OfficerID): OfficerID[];
    /**
     * 특정 무장의 모든 양자 관계 기록
     */
    getRecordsForOfficer(officerId: OfficerID): AdoptionRecord[];
    /**
     * 두 무장이 양자 관계인지 확인
     */
    isAdoptiveRelation(a: OfficerID, b: OfficerID): boolean;
    /**
     * 모든 양자 기록을 배열로 반환 (직렬화용)
     */
    getAllRecords(): AdoptionRecord[];
    /**
     * 기록 복원 (직렬화 로드)
     */
    restoreRecords(records: AdoptionRecord[]): void;
    clear(): void;
}
//# sourceMappingURL=adoption_system.d.ts.map