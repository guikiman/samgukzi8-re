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

export class AdoptionSystem {
  private adoptions = new Map<string, AdoptionRecord>();
  private parentChildren = new Map<OfficerID, OfficerID[]>();
  private childParents = new Map<OfficerID, OfficerID[]>();
  private idCounter = 0;

  /**
   * 양자 관계 등록
   */
  adopt(
    parentId: OfficerID,
    childId: OfficerID,
    year: number,
    month: number,
    isPermanent = false,
  ): AdoptionResult {
    if (parentId === childId) {
      return { success: false, reason: "Cannot adopt self" };
    }

    const existingParent = this.childParents.get(childId);
    if (existingParent && existingParent.length > 0) {
      return { success: false, reason: "Child already has adoptive parent" };
    }

    const id = `adopt_${this.idCounter++}_${year}`;
    const record: AdoptionRecord = {
      id, parentId, childId, adoptionYear: year, adoptionMonth: month,
      isPermanent, disowned: false,
    };

    this.adoptions.set(id, record);

    if (!this.parentChildren.has(parentId)) this.parentChildren.set(parentId, []);
    this.parentChildren.get(parentId)!.push(childId);

    if (!this.childParents.has(childId)) this.childParents.set(childId, []);
    this.childParents.get(childId)!.push(parentId);

    return { success: true, record };
  }

  /**
   * 양자 관계 파기 (서자/폐적)
   */
  disown(adoptionId: string, year: number): AdoptionResult {
    const record = this.adoptions.get(adoptionId);
    if (!record) return { success: false, reason: "Adoption record not found" };
    if (record.isPermanent) return { success: false, reason: "Permanent adoption cannot be disowned" };
    if (record.disowned) return { success: false, reason: "Already disowned" };

    record.disowned = true;
    record.disownYear = year;

    const children = this.parentChildren.get(record.parentId);
    if (children) {
      this.parentChildren.set(record.parentId, children.filter((c) => c !== record.childId));
    }

    const parents = this.childParents.get(record.childId);
    if (parents) {
      this.childParents.set(record.childId, parents.filter((p) => p !== record.parentId));
    }

    return { success: true, record };
  }

  /**
   * 양부모 조회
   */
  getAdoptiveParents(childId: OfficerID): OfficerID[] {
    return this.childParents.get(childId) ?? [];
  }

  /**
   * 양자녀 조회
   */
  getAdoptiveChildren(parentId: OfficerID): OfficerID[] {
    return this.parentChildren.get(parentId) ?? [];
  }

  /**
   * 특정 무장의 모든 양자 관계 기록
   */
  getRecordsForOfficer(officerId: OfficerID): AdoptionRecord[] {
    return Array.from(this.adoptions.values()).filter(
      (r) => r.parentId === officerId || r.childId === officerId,
    );
  }

  /**
   * 두 무장이 양자 관계인지 확인
   */
  isAdoptiveRelation(a: OfficerID, b: OfficerID): boolean {
    const aChildren = this.parentChildren.get(a) ?? [];
    if (aChildren.includes(b)) return true;
    const bChildren = this.parentChildren.get(b) ?? [];
    if (bChildren.includes(a)) return true;
    return false;
  }

  /**
   * 모든 양자 기록을 배열로 반환 (직렬화용)
   */
  getAllRecords(): AdoptionRecord[] {
    return Array.from(this.adoptions.values());
  }

  /**
   * 기록 복원 (직렬화 로드)
   */
  restoreRecords(records: AdoptionRecord[]): void {
    this.adoptions.clear();
    this.parentChildren.clear();
    this.childParents.clear();
    for (const record of records) {
      this.adoptions.set(record.id, record);
      if (!this.parentChildren.has(record.parentId)) this.parentChildren.set(record.parentId, []);
      this.parentChildren.get(record.parentId)!.push(record.childId);
      if (!this.childParents.has(record.childId)) this.childParents.set(record.childId, []);
      this.childParents.get(record.childId)!.push(record.parentId);
    }
  }

  clear(): void {
    this.adoptions.clear();
    this.parentChildren.clear();
    this.childParents.clear();
  }
}
