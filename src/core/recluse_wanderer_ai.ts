/**
 * [59] 재야 무장 유랑 및 정착 루트 AI — RecluseWandererAI
 * 
 * 목적: 재야 무장의 거주지 이동.
 */
export class RecluseWandererAI {
    public wander(officer: any, currentCityId: string): string {
        console.log(`[AI] 재야 무장 ${officer.name} 이동.`);
        return "new_city_id";
    }
}
