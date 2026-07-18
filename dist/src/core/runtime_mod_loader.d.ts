/**
 * 삼국지 8 리메이크 — 런타임 JSON 모딩 로더
 * 파일: src/core/runtime_mod_loader.ts
 *
 * [301] JSON Schema 스키마 유효성 검증 엔진
 * [302] 핫 리로딩 및 전역 동적 결합
 * [309] 모드 창작 마당 — 파일 드래그/드롭 마운트
 *
 * ── 아키텍처 ──
 *
 * 유저가 JSON 파일을 드래그/드롭
 *     ↓
 * ModFileReader — 파일 읽기 + JSON 파싱
 *     ↓
 * SchemaValidator — 타입/범위/참조 ID 무결성 검사
 *     ↓
 * ModRegistry — 모드 메타 정보 등록 (중복/충돌 탐지)
 *     ↓
 * HotInjector — 실행 중인 GameStore에 동적 덮어쓰기
 *     ↓
 * 완료 콜백 (UI 재렌더링 트리거)
 */
import type { OfficerID, FactionID, CityID, OfficerStats, OfficerExp, OfficerInventory, IGameStore } from './types.js';
import type { EventId } from './story_event_compiler.js';
/** 모드 메타데이터 */
export interface ModMeta {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly author: string;
    readonly description: string;
    readonly dependencies?: readonly string[];
    readonly conflicts?: readonly string[];
    readonly createdAt: string;
    readonly gameVersion?: string;
}
/** 모드 데이터 (JSON 파일의 루트 구조) */
export interface ModData {
    readonly meta: ModMeta;
    readonly officers?: readonly PartialOfficerDef[];
    readonly factions?: readonly PartialFactionDef[];
    readonly cities?: readonly PartialCityDef[];
    readonly events?: readonly ModEventDef[];
    readonly items?: readonly ModItemDef[];
    readonly scenarios?: readonly ModScenarioDef[];
}
/** 무장 정의 (Officer 인터페이스의 부분 집합 + 유효성 검증용) */
export interface PartialOfficerDef {
    readonly id: OfficerID;
    readonly name: string;
    readonly courtesyName?: string;
    readonly gender?: 'M' | 'F';
    readonly birthYear: number;
    readonly deathYear?: number | null;
    readonly stats?: Partial<OfficerStats>;
    readonly exp?: Partial<OfficerExp>;
    readonly rank?: number;
    readonly status?: string;
    readonly factionId?: FactionID | null;
    readonly cityId?: CityID | null;
    readonly personality?: string;
    readonly loyalty?: number;
    readonly ambition?: number;
    readonly morality?: number;
    readonly greed?: number;
    readonly skills?: readonly string[];
    readonly specialty?: string | null;
    readonly inventory?: Partial<OfficerInventory>;
    readonly portrait?: string;
    readonly description?: string;
}
/** 세력 정의 */
export interface PartialFactionDef {
    readonly id: FactionID;
    readonly name: string;
    readonly lordId?: OfficerID;
    readonly officers?: readonly OfficerID[];
    readonly cities?: readonly CityID[];
    readonly reputation?: number;
    readonly color?: string;
    readonly description?: string;
}
/** 도시 정의 */
export interface PartialCityDef {
    readonly id: CityID;
    readonly name: string;
    readonly x: number;
    readonly y: number;
    readonly factionId?: FactionID | null;
    readonly governorId?: OfficerID | null;
    readonly population?: number;
    readonly loyalty?: number;
    readonly defense?: number;
    readonly gold?: number;
    readonly food?: number;
    readonly facilities?: readonly string[];
    readonly description?: string;
}
/** 이벤트 정의 (GameEventSchema 확장) */
export interface ModEventDef {
    readonly id: EventId;
    readonly name: string;
    readonly description: string;
    readonly category: "historical" | "fictional" | "character" | "disaster" | "chain_step";
    readonly priority: number;
    readonly trigger: {
        readonly logic: "AND" | "OR";
        readonly conditions: readonly {
            readonly field: string;
            readonly op: string;
            readonly targetId?: string;
            readonly targetId2?: string;
            readonly value?: number;
            readonly value2?: number;
            readonly probability?: number;
        }[];
    };
    readonly chain: {
        readonly type: "single" | "multi_turn" | "branching";
        readonly chainId?: string;
        readonly stepIndex?: number;
        readonly totalSteps?: number;
        readonly expiryTurns?: number;
        readonly nextEventId?: string;
        readonly branchOnChoice?: boolean;
    };
    readonly dialogue: {
        readonly lines: readonly string[];
        readonly speakerId?: string;
        readonly choices?: readonly {
            readonly label: string;
            readonly tooltip?: string;
            readonly effects: readonly {
                readonly type: string;
                readonly targetId: string;
                readonly targetId2?: string;
                readonly field?: string;
                readonly value?: number | string | boolean;
                readonly delta?: number;
            }[];
            readonly nextEventId?: string;
            readonly branchToChainId?: string;
        }[];
        readonly autoAdvance?: boolean;
        readonly autoAdvanceDelayMs?: number;
    };
    readonly effects?: readonly {
        readonly type: string;
        readonly targetId: string;
        readonly targetId2?: string;
        readonly field?: string;
        readonly value?: number | string | boolean;
        readonly delta?: number;
    }[];
    readonly onFailEffects?: readonly {
        readonly type: string;
        readonly targetId: string;
        readonly targetId2?: string;
        readonly field?: string;
        readonly value?: number | string | boolean;
        readonly delta?: number;
    }[];
    readonly once?: boolean;
}
/** 아이템 정의 */
export interface ModItemDef {
    readonly id: string;
    readonly name: string;
    readonly type: "weapon" | "mount" | "treasure" | "book" | "consumable";
    readonly description: string;
    readonly effects: readonly {
        readonly field: string;
        readonly value: number;
    }[];
    readonly rarity: number;
    readonly image?: string;
}
/** 시나리오 정의 */
export interface ModScenarioDef {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly year: number;
    readonly month: number;
    readonly officers: readonly {
        readonly officerId: OfficerID;
        readonly factionId: FactionID;
        readonly cityId: CityID;
        readonly rank?: number;
    }[];
    readonly factions: readonly {
        readonly factionId: FactionID;
        readonly cities: readonly CityID[];
        readonly diplomacy?: Record<string, number>;
    }[];
}
/** 모드 로드 결과 */
export interface ModLoadResult {
    readonly meta: ModMeta;
    readonly success: boolean;
    readonly errors: readonly string[];
    readonly warnings: readonly string[];
    readonly stats: {
        readonly officersLoaded: number;
        readonly factionsLoaded: number;
        readonly citiesLoaded: number;
        readonly eventsLoaded: number;
        readonly itemsLoaded: number;
        readonly scenariosLoaded: number;
    };
    readonly timestamp: number;
}
/** 스키마 검증 오류 */
export interface ValidationError {
    readonly path: string;
    readonly message: string;
    readonly code: 'TYPE_MISMATCH' | 'RANGE_EXCEEDED' | 'MISSING_FIELD' | 'REFERENCE_INVALID' | 'DUPLICATE_ID' | 'CUSTOM';
    readonly value?: unknown;
}
/**
 * SchemaValidator — 모드 데이터의 타입/범위/참조 ID 무결성 런타임 검사
 *
 * 검증 규칙:
 *   - 타입 검사 (number, string, boolean, array, object)
 *   - 숫자 범위 검사 (0~100, 0~999 등)
 *   - 필수 필드 누락 검사
 *   - ID 중복 검사 (전역 레지스트리 기준)
 *   - 참조 무결성 검사 (factionId → 존재하는 세력 등)
 */
export declare class SchemaValidator {
    private readonly officerMaxStats;
    private readonly maxYear;
    private readonly minYear;
    private readonly validGenders;
    private readonly validPersonalities;
    private readonly validCategories;
    private readonly validChainTypes;
    private readonly existingOfficerIds;
    private readonly existingFactionIds;
    private readonly existingCityIds;
    private readonly existingEventIds;
    /** 기존 게임 DB의 ID 목록을 로드 (참조 무결성 검증용) */
    loadExistingIds(store: IGameStore): void;
    /**
     * ModData 전체 검증
     *
     * @param data       로드할 모드 데이터
     * @param isNew      신규 추가(false=기존 데이터 덮어쓰기)
     * @returns          검증 오류 목록 (비어있으면 통과)
     */
    validate(data: ModData, isNew?: boolean): ValidationError[];
    private validateMeta;
    private validateOfficer;
    private validateFaction;
    private validateCity;
    private validateEvent;
    private validateItem;
}
/**
 * ModRegistry — 로드된 모드의 메타 정보를 관리
 * - 중복 모드 ID 감지
 * - 의존성/충돌 검사
 * - 로드 순서 정렬
 */
export declare class ModRegistry {
    private readonly mods;
    private readonly loadOrder;
    /** 모드 등록 (의존성/충돌 검증 포함) */
    register(meta: ModMeta): ValidationError[];
    /** 모드 제거 */
    unregister(id: string): boolean;
    /** 로드된 모든 모드 ID */
    get loadedModIds(): readonly string[];
    /** 특정 모드 메타 조회 */
    getMod(id: string): ModMeta | null;
    /** 로드된 모드 수 */
    get count(): number;
}
/**
 * RuntimeModLoader — JSON 모드 파일의 전체 생명주기 관리
 *
 * 사용 예:
 * ```typescript
 * const loader = new RuntimeModLoader(gameStore);
 *
 * // 드래그/드롭 이벤트에서:
 * const result = await loader.loadModFromFile(jsonString);
 * if (result.success) {
 *     console.log(`Loaded ${result.meta.name} v${result.meta.version}`);
 * } else {
 *     console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export declare class RuntimeModLoader {
    private readonly store;
    private readonly validator;
    private readonly registry;
    private readonly onModLoad;
    constructor(store: IGameStore);
    /**
     * JSON 문자열에서 모드 로드
     *
     * 1. JSON 파싱
     * 2. Schema 검증
     * 3. ModRegistry 등록 (중복/충돌 검사)
     * 4. Hot Injection — GameStore에 동적 주입
     *
     * @param jsonString  JSON 모드 파일 내용
     * @returns           로드 결과
     */
    loadModFromFile(jsonString: string): Promise<ModLoadResult>;
    private hotInject;
    /**
     * 모드 제거 (GameStore에서 되돌리기)
     *
     * ⚠ 주의: 완전한 롤백은 모드 로드 전 스냅샷이 필요
     *
     * @param modId  제거할 모드 ID
     */
    unloadMod(modId: string): boolean;
    /** 모드 로드 완료 콜백 등록 */
    onModLoadComplete(callback: (result: ModLoadResult) => void): void;
    get registryRef(): ModRegistry;
    get validatorRef(): SchemaValidator;
}
//# sourceMappingURL=runtime_mod_loader.d.ts.map