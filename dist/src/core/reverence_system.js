/**
 * [81] 경외(Reverence) 상태 생성기 — ReverenceSystem
 *
 * 목적: 거물급 장수에게 경외 상태 적용.
 */
export class ReverenceSystem {
    checkReverence(observer, target) {
        return (target.war - observer.war) > 30 || (target.intel - observer.intel) > 30;
    }
}
//# sourceMappingURL=reverence_system.js.map