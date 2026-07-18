/**
 * 삼국지 8 리메이크 — 실시간 다국어 i18n 파이프라인
 * 파일: src/core/localization_manager.ts
 *
 * [306] 비동기 i18n 파이프라인 — 언어팩 로딩
 * [307] 가변 폰트 렌더러 바인딩 — 붓글씨 서체 전환
 * [308] 레이아웃 재연산 — 국가별 UI 뭉개짐 방지
 *
 * ── 아키텍처 ──
 *
 * 앱 초기화 시:
 *   LocalizationManager.init()
 *     ↓
 *   기본 언어팩 (ko-KR) 동기 로드
 *   기본 폰트 로드 (ko-KR 붓글씨)
 *     ↓
 *   사용 가능
 *
 * 언어 전환 시:
 *   manager.setLanguage('ja-JP')
 *     ↓
 *   1. 비동기 언어팩 JSON fetch()
 *   2. 번역 문자열 메모리 캐시에 저장
 *   3. 폰트 로드 (@font-face 동적 삽입)
 *   4. Font Loading API → fonts.ready
 *   5. 전체 UI 뷰포트 재연산 콜백
 *   6. onLanguageChanged 이벤트 발행
 */
/** 지원 언어 코드 */
export type LanguageCode = 'ko-KR' | 'zh-CN' | 'zh-TW' | 'ja-JP' | 'en-US';
/** 언어 메타데이터 */
export interface LanguageMeta {
    readonly code: LanguageCode;
    readonly name: string;
    readonly nativeName: string;
    readonly direction: 'ltr' | 'rtl';
    readonly fontFamily: string;
    readonly fallbackFont: string;
    readonly fontUrl: string;
    readonly fontFormat: string;
}
/** 번역 키-값 맵 */
export type TranslationMap = Record<string, string>;
/** 번역 네임스페이스 (UI 섹션별 분리) */
export type TranslationNamespace = 'common' | 'ui_main' | 'ui_battle' | 'ui_council' | 'ui_diplomacy' | 'ui_city' | 'ui_officer' | 'ui_event' | 'ui_tutorial' | 'ui_modding' | 'ui_options' | 'ui_editor' | 'tips' | 'tutorial' | 'tooltip';
/** 언어팩 구조 */
export interface LanguagePack {
    readonly meta: {
        readonly language: LanguageCode;
        readonly version: string;
        readonly author: string;
        readonly updatedAt: string;
    };
    readonly translations: Record<TranslationNamespace, TranslationMap>;
}
/** 폰트 로드 상태 */
export type FontLoadState = 'LOADING' | 'LOADED' | 'ERROR' | 'NOT_LOADED';
/** 언어 전환 이벤트 */
export interface LanguageChangeEvent {
    readonly previousCode: LanguageCode | null;
    readonly currentCode: LanguageCode;
    readonly pack: LanguagePack | null;
    readonly fontLoaded: boolean;
}
/** 레이아웃 조정 파라미터 */
export interface LayoutAdjustment {
    readonly scale: number;
    readonly lineHeight: number;
    readonly letterSpacing: number;
    readonly maxWidth?: number;
    readonly overflowStrategy: 'ellipsis' | 'scroll' | 'shrink' | 'wrap';
}
/**
 * LocalizationManager — 실시간 다국어 번역 + 폰트 로딩 + 레이아웃 조정
 *
 * 사용 예:
 * ```typescript
 * const i18n = new LocalizationManager({
 *     defaultLanguage: 'ko-KR',
 *     localePath: '/locales/',
 * });
 *
 * await i18n.init();
 *
 * // 번역
 * console.log(i18n.t('ui_main.start_game'));    // "게임 시작"
 *
 * // 언어 전환
 * await i18n.setLanguage('ja-JP');
 * console.log(i18n.t('ui_main.start_game'));    // "ゲーム開始"
 *
 * // 폰트 로드 대기
 * await i18n.waitForFont();
 * ```
 */
export declare class LocalizationManager {
    private readonly defaultLanguage;
    private readonly localePath;
    private currentLanguage;
    private packs;
    private currentPack;
    private fontState;
    private fontLoadPromises;
    private readonly onLanguageChanged;
    private readonly languageMetas;
    private _initialized;
    private _layoutAdjustment;
    /** 프리로드할 언어 목록 (init() 전에 설정) */
    preloadLanguages: LanguageCode[];
    constructor(options?: {
        defaultLanguage?: LanguageCode;
        localePath?: string;
    });
    /**
     * LocalizationManager 초기화
     *
     * 1. 기본 언어팩 동기 로드
     * 2. 프리로드 언어팩 비동기 로드
     * 3. 기본 폰트 로드 시작
     */
    init(): Promise<void>;
    /**
     * 키 기반 번역 문자열 조회
     *
     * @param key         "namespace.key" 형식의 번역 키
     * @param params      치환 파라미터 (선택)
     * @returns           번역된 문자열 (없으면 키 자체 반환)
     *
     * 사용 예:
     * ```typescript
     * i18n.t('ui_main.start_game');                        // "게임 시작"
     * i18n.t('common.turn_count', { count: 5 });            // "5턴째"
     * i18n.t('ui_battle.damage_dealt', { dmg: 150 });
     * ```
     */
    t(key: string, params?: Record<string, string | number>): string;
    /**
     * 특정 네임스페이스의 모든 번역 조회
     */
    getNamespace(namespace: TranslationNamespace): TranslationMap | null;
    /**
     * 실시간 언어 전환
     *
     * 파이프라인:
     *   1. 언어팩 로드 (캐시 or fetch)
     *   2. 폰트 로드
     *   3. 레이아웃 조정 계산
     *   4. onLanguageChanged 콜백
     *
     * @param code  대상 언어 코드
     */
    setLanguage(code: LanguageCode): Promise<void>;
    /** 현재 언어 코드 */
    get language(): LanguageCode;
    /** 언어 전환 콜백 등록 */
    onLanguageChange(callback: (event: LanguageChangeEvent) => void): void;
    /**
     * 언어별 폰트 로드
     *
     * @font-face 동적 스타일시트 삽입 → Font Loading API로 완료 감지
     *
     * @param code  언어 코드
     * @returns     폰트 로드 성공 여부
     */
    loadFont(code: LanguageCode): Promise<boolean>;
    /** 폰트 로드 완료까지 대기 */
    waitForFont(code?: LanguageCode): Promise<boolean>;
    /** 특정 폰트의 로드 상태 */
    getFontState(code: LanguageCode): FontLoadState;
    /**
     * 언어 전환 시 레이아웃 조정 파라미터 계산
     *
     * 각 언어별 텍스트 길이/폰트 특성에 따라 scale/lineHeight/letterSpacing 조정
     * - 한국어: 기본 (한글 음절 1:1 비율)
     * - 중국어 (간/번체): 기본 (한자 1:1 비율)
     * - 일본어: lineHeight 약간 증가 (히라가나/가타카나 혼합)
     * - 영어: scale 증가 (영어 단어가 한글보다 길어짐)
     */
    private computeLayoutAdjustment;
    /** 현재 레이아웃 조정 파라미터 */
    get layoutAdjustment(): LayoutAdjustment;
    /** CSS 변수로 레이아웃 파라미터 적용 */
    applyLayoutToCSS(root?: HTMLElement): void;
    private buildLanguageMetas;
    /** 모든 언어 메타데이터 */
    get allLanguages(): LanguageMeta[];
    /** 특정 언어 메타데이터 */
    getLanguageMeta(code: LanguageCode): LanguageMeta;
    /**
     * 언어팩 JSON 파일 로드
     *
     * @param code  언어 코드
     * @returns     파싱된 LanguagePack
     */
    private loadPack;
    /** 빈 언어팩 생성 (폴백) */
    private createEmptyPack;
    get initialized(): boolean;
    /** 현재 언어팩의 번역 키 개수 */
    get translationCount(): number;
    /** 캐시된 언어팩 목록 */
    get cachedLanguages(): LanguageCode[];
    /** 모든 초기화된 언어팩의 메모리 사용량 추정 (bytes) */
    get estimatedMemoryUsage(): number;
    /** 리소스 정리 */
    dispose(): void;
}
/**
 * 숫자/날짜 포맷 — 로케일 인식 포맷팅
 *
 * @param value  포맷할 값
 * @param locale 언어 코드
 * @returns      로케일 기반 문자열
 */
export declare function formatLocaleNumber(value: number, locale: LanguageCode): string;
/**
 * 복수형 메시지 포맷 (영어: 1 item / N items)
 */
export declare function formatPlural(count: number, singular: string, plural: string, locale: LanguageCode): string;
/**
 * HTML 엔티티 이스케이프 (XSS 방지)
 */
export declare function escapeHTML(str: string): string;
//# sourceMappingURL=localization_manager.d.ts.map