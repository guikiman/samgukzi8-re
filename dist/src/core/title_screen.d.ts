/**
 * 삼국지 8 리메이크 — 타이틀 스크린 컨트롤러
 *
 * 타이틀 화면 표시/전환, 파티클 연출(봄: 꽃잎 / 겨울: 눈), 계절 테마 동기화.
 * [21] 로비 반응형 캔버스, [1057] 계절 테마 효과
 */
export declare class TitleScreen {
    private root;
    private particleCanvas;
    private particles;
    private btnNew;
    private btnContinue;
    private onNewGame;
    private onContinue;
    constructor(opts: {
        onNewGame: () => void;
        onContinue: () => void;
        season?: string;
    });
    /** 세이브 존재 여부에 따라 '이어하기' 버튼 표시/숨김 */
    setHasSave(hasSave: boolean): void;
    /** 계절 테마 갱신 (body data-season + 파티클 색상) */
    setSeason(season: 'spring' | 'summer' | 'autumn' | 'winter'): void;
    /** 파티클 연출 시작 (타이틀 표시 시) */
    show(): void;
    private leave;
}
//# sourceMappingURL=title_screen.d.ts.map