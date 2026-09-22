/**
 * 평판 시각화 시스템 [11][27]
 *
 * 명성(fame)/악명(infamy) 수치를 플레이어가 한눈에 알아보는
 * 등급 라벨 + 아이콘 + 색상으로 변환한다.
 *
 * 판정 로직(reputation_effect_system)과 분리된 순수 표시 계층 —
 * 점수 공식을 바꿔도 게임 판정에는 영향이 없다.
 *
 * 점수 공식: score = fame − infamy × 2 (악명은 명성보다 2배 무겁다)
 */
export interface ReputationVisual {
    /** 등급 라벨 (한자 2글자) */
    label: string;
    /** 표시 아이콘 */
    icon: string;
    /** 등급 색상 (hex) */
    color: string;
    /** 툴팁 설명 */
    title: string;
}
/** 군주(세력) 평판 등급 산출 */
export declare function getLeaderReputationVisual(faction: {
    fame: number;
    infamy: number;
} | null | undefined): ReputationVisual;
/** 무장 개인 평판 등급 산출 (군주보다 낮은 경계값) */
export declare function getOfficerReputationVisual(officer: {
    fame: number;
    infamy: number;
} | null | undefined): ReputationVisual;
/** 상단 바 칩 한 개 HTML 생성 */
export declare function renderReputationChip(vis: ReputationVisual): string;
//# sourceMappingURL=reputation_visuals.d.ts.map