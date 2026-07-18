/**
 * [17] 군기 사기 부스터 — Bannerman Morale Booster
 *
 * 전장 중심부 군기(깃발) 유닛의 생존 여부 및
 * 격파 시 적 세력 전체의 사기가 즉시 30% 감폭되는 사기 동역학 연산
 */
export class BannermanMoraleBooster {
    constructor() {
        this.banners = new Map();
    }
    /**
     * 군기 설치
     */
    deployBanner(bannerUnitId, factionId, position) {
        const state = {
            bannerUnitId,
            factionId,
            position,
            isAlive: true,
            moraleBonus: 10, // 기본 사기 보너스 +10%
            penaltyOnDestroy: 30, // 파괴 시 적 사기 -30%
        };
        this.banners.set(factionId, state);
        return state;
    }
    /**
     * 군기 생존 여부 확인
     */
    isBannerAlive(factionId) {
        const banner = this.banners.get(factionId);
        return banner !== undefined && banner.isAlive;
    }
    /**
     * 군기 파괴 → 적 세력 전체 사기 30% 감소
     */
    onBannerDestroyed(factionId) {
        const banner = this.banners.get(factionId);
        if (!banner || !banner.isAlive)
            return 0;
        banner.isAlive = false;
        return banner.penaltyOnDestroy;
    }
    /**
     * 군기로 인한 아군 사기 보너스 계산
     */
    getMoraleBonus(factionId) {
        const banner = this.banners.get(factionId);
        if (!banner || !banner.isAlive)
            return 0;
        return banner.moraleBonus;
    }
    /**
     * 군기 이동
     */
    moveBanner(factionId, newPosition) {
        const banner = this.banners.get(factionId);
        if (!banner || !banner.isAlive)
            return false;
        banner.position = newPosition;
        return true;
    }
    /**
     * 군기 상태 조회
     */
    getBanner(factionId) {
        return this.banners.get(factionId) ?? null;
    }
    /**
     * 거리 기반 사기 보너스 계산 (군기와 가까울수록 높은 보너스)
     */
    getDistanceMoraleBonus(factionId, unitPosition, maxRange) {
        const banner = this.banners.get(factionId);
        if (!banner || !banner.isAlive)
            return 0;
        const dq = Math.abs(banner.position.q - unitPosition.q);
        const dr = Math.abs(banner.position.r - unitPosition.r);
        const ds = Math.abs((-banner.position.q - banner.position.r) - (-unitPosition.q - unitPosition.r));
        const distance = Math.max(dq, dr, ds);
        if (distance > maxRange)
            return 0;
        const falloff = 1 - (distance / maxRange);
        return Math.floor(banner.moraleBonus * falloff);
    }
    getAllBanners() {
        return Array.from(this.banners.values());
    }
    reset() {
        this.banners.clear();
    }
}
//# sourceMappingURL=bannerman_morale_booster.js.map