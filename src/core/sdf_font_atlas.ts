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

export class SdfFontAtlas {
  private glyphs = new Map<string, GlyphInfo>();
  private readonly fontSize: number;
  private readonly sdfRadius: number;
  private readonly atlasSize: number;

  constructor(fontSize = 32, sdfRadius = 4, atlasSize = 512) {
    this.fontSize = fontSize;
    this.sdfRadius = sdfRadius;
    this.atlasSize = atlasSize;
  }

  /**
   * 글리프 등록
   */
  registerGlyph(char: string, u: number, v: number, w: number, h: number, advance: number): void {
    this.glyphs.set(char, { char, u, v, w, h, advance });
  }

  /**
   * 글리프 조회
   */
  getGlyph(char: string): GlyphInfo | undefined {
    return this.glyphs.get(char);
  }

  /**
   * 텍스트를 쿼드 리스트로 변환
   */
  textToQuads(text: string, startX: number, startY: number): TextQuad[] {
    const quads: TextQuad[] = [];
    let cursorX = startX;

    for (const char of text) {
      if (char === " ") {
        cursorX += this.fontSize * 0.3;
        continue;
      }

      const glyph = this.glyphs.get(char);
      if (!glyph) continue;

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
  get radius(): number {
    return this.sdfRadius;
  }

  /**
   * 아틀라스 크기
   */
  get size(): number {
    return this.atlasSize;
  }

  /**
   * 등록된 글리프 수
   */
  get glyphCount(): number {
    return this.glyphs.size;
  }

  /**
   * 초기화
   */
  clear(): void {
    this.glyphs.clear();
  }
}
