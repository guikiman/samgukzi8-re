/**
 * [10] 동적 영토 변화 연출기 — DynamicTerritoryPainter
 * 
 * 목적: 세력 합병 시 영토 분할 처리.
 */
export class DynamicTerritoryPainter {
    public mergeTerritory(sourceFaction: string, targetFaction: string): void {
        console.log(`영토 변경: ${sourceFaction}의 도시가 ${targetFaction}에게 양도됨.`);
    }
}
