/**
 * [96] 구혼 및 연애 감정 성숙 필터 — CourtshipSystem
 *
 * 목적: 애정 수치에 따른 결혼 이벤트 트리거.
 */
export class CourtshipSystem {
    checkMarriage(a, b) {
        return a.affection > 90 && b.affection > 90;
    }
}
//# sourceMappingURL=courtship_system.js.map