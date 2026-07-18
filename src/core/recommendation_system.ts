/**
 * [94] 인재 천거 시스템 — RecommendationSystem
 * 
 * 목적: 무장 추천 및 공적 획득.
 */
export class RecommendationSystem {
    public recommend(referrer: any, candidate: any): void {
        console.log(`[Social] ${referrer.name}이 ${candidate.name}을 천거.`);
    }
}
