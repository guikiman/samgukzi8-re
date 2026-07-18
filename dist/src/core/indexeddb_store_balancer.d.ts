/**
 * [E45] IndexedDB 저장소 균형 분산기 — IndexedDBStoreBalancer
 *
 * 목적: 단일 DB에 과도한 데이터가 쌓여 트랜잭션 지연이 발생하지 않도록
 *       여러 DB 인스턴스로 분산 저장.
 *
 * 핵심 로직:
 *   1. DB 이름 해시 기반 샤딩
 *   2. 읽기/쓰기 부하 분산
 */
export interface ShardConfig {
    readonly shardCount: number;
    readonly baseName: string;
}
export declare class IndexedDBStoreBalancer {
    private readonly config;
    private dbs;
    constructor(config: ShardConfig);
    /** 키에 해당하는 샤드 인덱스 계산 */
    getShardIndex(key: string): number;
    /** 샤드 DB 이름 */
    private shardDbName;
    /** 샤드 DB 열기 */
    openShard(index: number): Promise<IDBDatabase>;
    /** 데이터 저장 (자동 샤딩) */
    set(key: string, value: unknown): Promise<void>;
    /** 데이터 조회 */
    get<T>(key: string): Promise<T | null>;
    /** 데이터 삭제 */
    delete(key: string): Promise<void>;
    /** 모든 샤드 초기화 */
    clearAll(): Promise<void>;
}
//# sourceMappingURL=indexeddb_store_balancer.d.ts.map