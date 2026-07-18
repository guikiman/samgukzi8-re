/**
 * [5] SeasonTransitionInterceptor — 계절 전환 핸들러
 *
 * 목적: 계절 변화 정산.
 */
export class SeasonTransitionInterceptor {
    onSeasonChange(newSeason) {
        console.log(`[Turn] 계절이 ${newSeason}로 변경.`);
    }
}
//# sourceMappingURL=season_transition_interceptor.js.map