/**
 * [45] 치안 순찰 시 치외법권 범죄 인카운터 — PatrolEventSystem
 * 
 * 목적: 치안 유지 중 범죄 대응.
 */
export class PatrolEventSystem {
    public triggerEvent(): string {
        console.log("[Patrol] 범죄 인카운터 발생.");
        return "CRIME_ENCOUNTER";
    }
}
