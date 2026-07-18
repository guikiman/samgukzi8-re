/**
 * [3] TurnAuthorityFilter — 신분별 권한 필터
 * 
 * 목적: 신분별 행동 권한 제한.
 */
export class TurnAuthorityFilter {
    public canAct(role: string, phase: string): boolean {
        if (role === 'RULER') return true;
        if (role === 'PREFECT' && phase === 'DOMESTIC') return true;
        return false;
    }
}
