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
export class SdfFontAtlas {
    constructor(fontSize = 32, sdfRadius = 4, atlasSize = 512) {
        this.glyphs = new Map();
        this.fontSize = fontSize;
        this.sdfRadius = sdfRadius;
        this.atlasSize = atlasSize;
    }
    /**
     * 글리프 등록
     */
    registerGlyph(char, u, v, w, h, advance) {
        this.glyphs.set(char, { char, u, v, w, h, advance });
    }
    /**
     * 글리프 조회
     */
    getGlyph(char) {
        return this.glyphs.get(char);
    }
    /**
     * 텍스트를 쿼드 리스트로 변환
     */
    textToQuads(text, startX, startY) {
        const quads = [];
        let cursorX = startX;
        for (const char of text) {
            if (char === " ") {
                cursorX += this.fontSize * 0.3;
                continue;
            }
            const glyph = this.glyphs.get(char);
            if (!glyph)
                continue;
            quads.push({
                u: glyph.u,
                v: glyph.v,
                w: glyph.w,
                h: glyph.h,
                x: cursorX,
                y: startY,
                advance: glyph.advance,
            });
            cursorX += glyph.advance;
        }
        return quads;
    }
    /**
     * SDF 반경
     */
    get radius() {
        return this.sdfRadius;
    }
    /**
     * 아틀라스 크기
     */
    get size() {
        return this.atlasSize;
    }
    /**
     * 등록된 글리프 수
     */
    get glyphCount() {
        return this.glyphs.size;
    }
    /**
     * 초기화
     */
    clear() {
        this.glyphs.clear();
    }
}
//# sourceMappingURL=sdf_font_atlas.js.map