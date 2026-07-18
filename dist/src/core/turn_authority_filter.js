/**
 * [3] TurnAuthorityFilter — 신분별 권한 필터
 *
 * 목적: 신분별 행동 권한 제한.
 */
export class TurnAuthorityFilter {
    canAct(role, phase) {
        if (role === 'RULER')
            return true;
        if (role === 'PREFECT' && phase === 'DOMESTIC')
            return true;
        return false;
    }
}
//# sourceMappingURL=turn_authority_filter.js.map