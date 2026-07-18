/**
 * [E58] IndexedDB 할당량 보호기 — IndexedDBQuotaProtector
 *
 * 목적: IndexedDB 저장소 할당량 초과 시 자동 정리하여
 *       저장 실패 방지.
 *
 * 핵심 로직:
 *   1. 저장 전 할당량 체크
 *   2. 할당량 초과 시 오래된 데이터부터 자동 삭제
 */
export interface QuotaInfo {
    readonly usage: number;
    readonly quota: number;
    readonly available: number;
    readonly usagePercent: number;
}
export declare class IndexedDBQuotaProtector {
    private readonly dbName;
    private readonly storeName;
    private readonly maxEntries;
    constructor(dbName: string, storeName: string, maxEntries?: number);
    /** 저장소 할당량 정보 조회 */
    getQuotaInfo(): Promise<QuotaInfo>;
    /** 저장 전 할당량 체크 */
    canSave(dataSize: number): Promise<boolean>;
    /** 오래된 데이터 정리 */
    cleanOldEntries(keepCount?: number): Promise<number>;
    private openDB;
}
//# sourceMappingURL=indexeddb_quota_protector.d.ts.map