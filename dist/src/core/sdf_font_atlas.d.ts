/**
 * [Task 75] SDF 폰트 아틀라스 — SdfFontAtlas
 *
 * 목적: Signed Distance Field 기반 폰트 렌더링을 위한
 *       글리프 아틀라스 생성 및 관리.
 *
 * 핵심 로직:
 *   1. 각 글리프의 SDF 텍스처 UV 저장
 *   2. 텍스트 → 쿼드 리스트 변환
 *   3. SDF 필드 반경 설정
 */
export interface GlyphInfo {
    readonly char: string;
    readonly u: number;
    readonly v: number;
    readonly w: number;
    readonly h: number;
    readonly advance: number;
}
export interface TextQuad {
    readonly u: number;
    readonly v: number;
    readonly w: number;
    readonly h: number;
    readonly x: number;
    readonly y: number;
    readonly advance: number;
}
export declare class SdfFontAtlas {
    private glyphs;
    private readonly fontSize;
    private readonly sdfRadius;
    private readonly atlasSize;
    constructor(fontSize?: number, sdfRadius?: number, atlasSize?: number);
    /**
     * 글리프 등록
     */
    registerGlyph(char: string, u: number, v: number, w: number, h: number, advance: number): void;
    /**
     * 글리프 조회
     */
    getGlyph(char: string): GlyphInfo | undefined;
    /**
     * 텍스트를 쿼드 리스트로 변환
     */
    textToQuads(text: string, startX: number, startY: number): TextQuad[];
    /**
     * SDF 반경
     */
    get radius(): number;
    /**
     * 아틀라스 크기
     */
    get size(): number;
    /**
     * 등록된 글리프 수
     */
    get glyphCount(): number;
    /**
     * 초기화
     */
    clear(): void;
}
//# sourceMappingURL=sdf_font_atlas.d.ts.map