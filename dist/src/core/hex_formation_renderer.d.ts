/**
 * [Task 85] 헥스 진형 렌더러 — HexFormationRenderer
 *
 * 목적: 전투 시 부대의 진형(방진, 학익진 등)을
 *       헥스 맵 위에 시각적으로 표시.
 *
 * 핵심 로직:
 *   1. 진형별 타일 오프셋 정의
 *   2. 진형에 따른 부대 위치 렌더링
 */
export type FormationType = "line" | "wedge" | "square" | "scatter" | "vanguard";
export interface FormationLayout {
    readonly type: FormationType;
    readonly offsets: readonly {
        readonly dq: number;
        readonly dr: number;
        readonly label: string;
    }[];
}
export declare class HexFormationRenderer {
    /**
     * 진형별 타일 오프셋 반환
     */
    getFormation(type: FormationType): FormationLayout;
    /**
     * 진형의 중심 기준 모든 좌표 반환
     */
    getFormationTiles(type: FormationType, centerQ: number, centerR: number): {
        q: number;
        r: number;
        label: string;
    }[];
    /**
     * 진형별 타일 수
     */
    getFormationSize(type: FormationType): number;
}
//# sourceMappingURL=hex_formation_renderer.d.ts.map