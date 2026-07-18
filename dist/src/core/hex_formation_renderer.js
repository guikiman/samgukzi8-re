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
const FORMATIONS = {
    line: {
        type: "line",
        offsets: [
            { dq: 0, dr: 0, label: "C" },
            { dq: 1, dr: 0, label: "R" },
            { dq: -1, dr: 0, label: "L" },
            { dq: 2, dr: 0, label: "RR" },
            { dq: -2, dr: 0, label: "LL" },
        ],
    },
    wedge: {
        type: "wedge",
        offsets: [
            { dq: 0, dr: 0, label: "C" },
            { dq: 1, dr: -1, label: "R" },
            { dq: -1, dr: 1, label: "L" },
            { dq: 2, dr: -2, label: "RR" },
            { dq: -2, dr: 2, label: "LL" },
        ],
    },
    square: {
        type: "square",
        offsets: [
            { dq: 0, dr: 0, label: "C" },
            { dq: 1, dr: 0, label: "R" },
            { dq: 0, dr: 1, label: "BR" },
            { dq: -1, dr: 1, label: "BL" },
            { dq: -1, dr: 0, label: "L" },
        ],
    },
    scatter: {
        type: "scatter",
        offsets: [
            { dq: 0, dr: 0, label: "C" },
            { dq: 2, dr: -1, label: "FR" },
            { dq: -2, dr: 1, label: "FL" },
            { dq: 1, dr: 1, label: "BR" },
            { dq: -1, dr: -1, label: "BL" },
        ],
    },
    vanguard: {
        type: "vanguard",
        offsets: [
            { dq: 0, dr: 0, label: "C" },
            { dq: 0, dr: -1, label: "F" },
            { dq: 1, dr: -1, label: "FR" },
            { dq: -1, dr: 0, label: "L" },
            { dq: 1, dr: 0, label: "R" },
        ],
    },
};
export class HexFormationRenderer {
    /**
     * 진형별 타일 오프셋 반환
     */
    getFormation(type) {
        return FORMATIONS[type];
    }
    /**
     * 진형의 중심 기준 모든 좌표 반환
     */
    getFormationTiles(type, centerQ, centerR) {
        const layout = this.getFormation(type);
        return layout.offsets.map((o) => ({
            q: centerQ + o.dq,
            r: centerR + o.dr,
            label: o.label,
        }));
    }
    /**
     * 진형별 타일 수
     */
    getFormationSize(type) {
        return FORMATIONS[type].offsets.length;
    }
}
//# sourceMappingURL=hex_formation_renderer.js.map