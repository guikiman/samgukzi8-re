/**
 * 삼국지 8 리메이크 — WebAssembly 고속 AI 이식 데이터 브리지
 * 파일: src/core/wasm_core_bridge.ts
 *
 * [201] Wasm 가속 길찾기 및 대미지 바인딩 인터페이스
 *
 * ── 설계 원칙 ──
 *   - JS GC/힙을 우회: 모든 데이터는 ArrayBuffer → Wasm 선형 메모리 직접 매핑
 *   - 고정 배열(Fixed Array) 직렬화: 오브젝트 필드 대신 평탄화된 Float32Array/Int32Array
 *   - 호출당 메모리 할당/해제는 Wasm allocator에 위임 (exported malloc/free)
 *   - 결과는 Wasm 메모리에서 직접 읽어 TypedArray로 반환
 *
 * ── Wasm 메모리 레이아웃 ──
 *
 *   [0x0000 ── 0x03FF] : 스택/전역
 *   [0x0400 ── 0x1FFF] : 입력 버퍼 (그리드, 유닛 스탯)
 *   [0x2000 ── 0x3FFF] : 출력 버퍼 (경로, 대미지 결과)
 *   [0x4000 ── ...   ] : 동적 할당 영역 (malloc)
 */
/** Wasm 익스포트 함수 시그니처 */
export interface WasmExports {
    /** 메모리 할당 (bytes) → 포인터 */
    malloc: (size: number) => number;
    /** 메모리 해제 */
    free: (ptr: number) => void;
    /** A* 길찾기: (gridPtr, gridW, gridH, startX, startY, endX, endY, outPtr) → 경로 길이 */
    astar_pathfind: (gridPtr: number, gridW: number, gridH: number, startX: number, startY: number, endX: number, endY: number, outPtr: number) => number;
    /** 대미지 계산: (attackerPtr, defenderPtr, terrainType, weather) → 대미지 */
    calc_damage: (attackerPtr: number, defenderPtr: number, terrainType: number, weather: number) => number;
    /** 전투 시뮬레이션: (attackerPtr, defenderPtr, rounds) → 결과 ptr */
    simulate_combat: (attackerPtr: number, defenderPtr: number, rounds: number) => number;
    /** 체크섬 계산: (dataPtr, length) → 32bit 체크섬 */
    checksum: (dataPtr: number, length: number) => number;
}
/** Wasm 모듈 로드 결과 */
export interface WasmModuleResult {
    instance: WebAssembly.Instance;
    memory: WebAssembly.Memory;
    exports: WasmExports;
}
/** 그리드 셀 데이터 (평탄화) */
export interface GridCellData {
    readonly height: number;
    readonly terrainType: number;
    readonly isBlocked: number;
    readonly moveCost: number;
}
/** 유닛 스탯 (평탄화) */
export interface UnitStats {
    readonly attack: number;
    readonly defense: number;
    readonly hp: number;
    readonly maxHp: number;
    readonly morale: number;
    readonly troopCount: number;
    readonly troopType: number;
    readonly leadership: number;
    readonly experience: number;
}
/** 경로 결과 */
export interface PathResult {
    readonly path: readonly {
        readonly x: number;
        readonly y: number;
    }[];
    readonly length: number;
    readonly totalCost: number;
}
/** 대미지 계산 결과 */
export interface DamageResult {
    readonly damage: number;
    readonly isCritical: boolean;
    readonly isHit: boolean;
    readonly moraleDamage: number;
}
/**
 * WasmCoreBridge — JS ↔ Wasm 고속 데이터 브리지
 *
 * 설계 원칙:
 *   - JS GC/힙을 완전히 우회: 모든 데이터는 ArrayBuffer → Wasm 선형 메모리 직접 매핑
 *   - 직렬화된 고정 배열(Fixed Array)만 사용: 오브젝트 직렬화 오버헤드 제로
 *   - 메모리 할당/해제는 Wasm의 exported malloc/free 사용
 *   - TypedArray 뷰를 통해 0-copy 읽기/쓰기
 *
 * 메모리 레이아웃:
 *   [0x0000 ── 0x03FF] : Wasm 스택/전역
 *   [0x0400 ── 0x1FFF] : 고정 입력 버퍼 (그리드, 유닛 스탯)
 *   [0x2000 ── 0x3FFF] : 고정 출력 버퍼 (경로, 결과)
 *   [0x4000 ── ...   ] : 동적 할당 (malloc)
 */
export declare class WasmCoreBridge {
    private instance;
    private memory;
    private exports;
    private _ready;
    private static readonly INPUT_GRID_OFFSET;
    private static readonly INPUT_UNIT_OFFSET;
    private static readonly OUTPUT_PATH_OFFSET;
    private static readonly OUTPUT_RESULT_OFFSET;
    private static readonly MAX_GRID_CELLS;
    private static readonly MAX_PATH_LENGTH;
    /**
     * Wasm 모듈 로드 및 인스턴스화
     *
     * @param wasmUrl  .wasm 파일 URL
     * @param imports  Wasm 임포트 객체 (옵션)
     */
    load(wasmUrl: string, imports?: WebAssembly.Imports): Promise<boolean>;
    get ready(): boolean;
    /**
     * Wasm 선형 메모리에 버퍼 할당
     *
     * @param size  할당할 바이트 수
     * @returns     Wasm 메모리 포인터 (0 = 실패)
     */
    allocateBuffer(size: number): number;
    /**
     * 할당된 Wasm 메모리 해제
     */
    freeBuffer(ptr: number): void;
    /**
     * Float32Array 데이터를 Wasm 메모리에 직접 복사
     *
     * @param data   JS Float32Array
     * @param offset Wasm 메모리 오프셋
     */
    writeF32Array(data: Float32Array, offset: number): void;
    /**
     * Int32Array 데이터를 Wasm 메모리에 직접 복사
     */
    writeI32Array(data: Int32Array, offset: number): void;
    /**
     * Uint8Array 데이터를 Wasm 메모리에 직접 복사
     */
    writeU8Array(data: Uint8Array, offset: number): void;
    /**
     * Wasm 메모리에서 Float32Array 읽기
     */
    readF32Array(offset: number, length: number): Float32Array;
    /**
     * Wasm 메모리에서 Int32Array 읽기
     */
    readI32Array(offset: number, length: number): Int32Array;
    /**
     * Wasm 메모리에서 Uint8Array 읽기
     */
    readU8Array(offset: number, length: number): Uint8Array;
    /**
     * Wasm 메모리에서 단일 Int32 읽기
     */
    readI32(offset: number): number;
    /**
     * Wasm 메모리에서 단일 Float32 읽기
     */
    readF32(offset: number): number;
    /**
     * GridCellData[] → 평탄화 Float32Array 변환
     *
     * 각 셀 = [height, terrainType, isBlocked, moveCost] (4 floats)
     * 총 길이 = cells.length × 4
     */
    serializeGrid(cells: readonly GridCellData[]): Float32Array;
    /**
     * 유닛 스탯 → 평탄화 Float32Array (8 floats)
     *
     * [attack, defense, hp, maxHp, morale, troopCount, troopType, leadership, experience]
     */
    serializeUnitStats(stats: UnitStats): Float32Array;
    /**
     * Wasm A* 길찾기 호출
     *
     * @param gridCells  평탄화 그리드 데이터 (GridCellData[] → serializeGrid)
     * @param gridW      그리드 너비
     * @param gridH      그리드 높이
     * @param startX     시작 X
     * @param startY     시작 Y
     * @param endX       목표 X
     * @param endY       목표 Y
     * @returns          경로 결과 (경로 없으면 length=0)
     */
    callPathfinding(gridCells: Float32Array, gridW: number, gridH: number, startX: number, startY: number, endX: number, endY: number): PathResult;
    /**
     * Wasm 대미지 계산 호출
     *
     * @param attackerStats  공격자 스탯 (평탄화 Float32Array, 9 floats)
     * @param defenderStats  방어자 스탯 (평탄화 Float32Array, 9 floats)
     * @param terrainType    지형 타입 (0=평지, 1=숲, 2=산, 3=강, 4=늪, 5=도로)
     * @param weather        기상 (0=맑음, 1=비, 2=눈, 3=폭풍)
     * @returns              대미지 결과
     */
    callDamageCalc(attackerStats: Float32Array, defenderStats: Float32Array, terrainType: number, weather: number): DamageResult;
    /**
     * Wasm 전투 시뮬레이션 호출 (다회전)
     *
     * @param attackerStats  공격자 스탯
     * @param defenderStats  방어자 스탯
     * @param rounds         시뮬레이션할 턴 수
     * @returns              누적 대미지 결과
     */
    callCombatSim(attackerStats: Float32Array, defenderStats: Float32Array, rounds: number): {
        totalDamage: number;
        totalMoraleDamage: number;
        roundsSimulated: number;
    };
    /**
     * Wasm 체크섬 계산 호출 (데이터 무결성 검증용)
     */
    callChecksum(data: Uint8Array): number;
    /**
     * JS A* 길찾기 폴백
     * (Wasm 미탑재 환경에서도 동작 보장)
     */
    private fallbackPathfinding;
    private readonly cellsPerRow;
    private heuristic;
    private getNeighbors;
    /**
     * JS 대미지 계산 폴백
     */
    private fallbackDamageCalc;
    /**
     * JS 체크섬 폴백 (FNV-1a)
     */
    private fallbackChecksum;
    /** Wasm 인스턴스 해제 */
    dispose(): void;
}
//# sourceMappingURL=wasm_core_bridge.d.ts.map