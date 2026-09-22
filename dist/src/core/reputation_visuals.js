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
/** 등급 경계값 — 시나리오 군주 초기 명성 500 기준 */
const TIER_BENEVOLENT = 420; // 仁德
const TIER_HONORABLE = 300; // 名聲
const TIER_INFAMOUS = 80; // 梟雄 (악명 누적)
const TIER_TYRANT = 0; // 暴君
/** 군주(세력) 평판 등급 산출 */
export function getLeaderReputationVisual(faction) {
    if (!faction) {
        return { label: '무명', icon: '·', color: '#888', title: '평판을 알 수 없음' };
    }
    const score = faction.fame - faction.infamy * 2;
    if (score >= TIER_BENEVOLENT) {
        return { label: '仁德', icon: '✨', color: '#4caf50', title: `인덕이 널리 알려짐 (명성 ${faction.fame} / 악명 ${faction.infamy})` };
    }
    if (score >= TIER_HONORABLE) {
        return { label: '名聲', icon: '🌟', color: '#e8c35a', title: `명성이 자자함 (명성 ${faction.fame} / 악명 ${faction.infamy})` };
    }
    if (faction.infamy >= TIER_INFAMOUS && score >= TIER_TYRANT) {
        return { label: '梟雄', icon: '🔥', color: '#e9865a', title: `담력과 포악이 공존 (명성 ${faction.fame} / 악명 ${faction.infamy})` };
    }
    if (score < TIER_TYRANT) {
        return { label: '暴君', icon: '😈', color: '#e05a5a', title: `폭군이라 불림 (명성 ${faction.fame} / 악명 ${faction.infamy})` };
    }
    return { label: '平凡', icon: '·', color: '#9a9a9a', title: `특별한 평판 없음 (명성 ${faction.fame} / 악명 ${faction.infamy})` };
}
/** 무장 개인 평판 등급 산출 (군주보다 낮은 경계값) */
export function getOfficerReputationVisual(officer) {
    if (!officer) {
        return { label: '무명', icon: '·', color: '#888', title: '평판을 알 수 없음' };
    }
    const score = officer.fame - officer.infamy * 2;
    if (score >= 400)
        return { label: '天下', icon: '✨', color: '#4caf50', title: `천하에 이름이 알려짐 (명성 ${officer.fame})` };
    if (score >= 250)
        return { label: '名士', icon: '🌟', color: '#e8c35a', title: `일대 명사 (명성 ${officer.fame})` };
    if (officer.infamy >= 100)
        return { label: '凶名', icon: '🔥', color: '#e05a5a', title: `흉명이 자자함 (악명 ${officer.infamy})` };
    return { label: '무명', icon: '·', color: '#9a9a9a', title: `특별한 평판 없음 (명성 ${officer.fame})` };
}
/** 상단 바 칩 한 개 HTML 생성 */
export function renderReputationChip(vis) {
    return `<span class="rep-chip" style="color:${vis.color}" title="${vis.title}">${vis.icon} ${vis.label}</span>`;
}
//# sourceMappingURL=reputation_visuals.js.map