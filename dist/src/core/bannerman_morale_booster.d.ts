/**
 * [17] 군기 사기 부스터 — Bannerman Morale Booster
 *
 * 전장 중심부 군기(깃발) 유닛의 생존 여부 및
 * 격파 시 적 세력 전체의 사기가 즉시 30% 감폭되는 사기 동역학 연산
 */
import type { FactionID, HexCoord } from './types.js';
export interface BannerState {
    bannerUnitId: string;
    factionId: FactionID;
    position: HexCoord;
    isAlive: boolean;
    moraleBonus: number;
    penaltyOnDestroy: number;
}
export declare class BannermanMoraleBooster {
    private banners;
    /**
     * 군기 설치
     */
    deployBanner(bannerUnitId: string, factionId: FactionID, position: HexCoord): BannerState;
    /**
     * 군기 생존 여부 확인
     */
    isBannerAlive(factionId: FactionID): boolean;
    /**
     * 군기 파괴 → 적 세력 전체 사기 30% 감소
     */
    onBannerDestroyed(factionId: FactionID): number;
    /**
     * 군기로 인한 아군 사기 보너스 계산
     */
    getMoraleBonus(factionId: FactionID): number;
    /**
     * 군기 이동
     */
    moveBanner(factionId: FactionID, newPosition: HexCoord): boolean;
    /**
     * 군기 상태 조회
     */
    getBanner(factionId: FactionID): BannerState | null;
    /**
     * 거리 기반 사기 보너스 계산 (군기와 가까울수록 높은 보너스)
     */
    getDistanceMoraleBonus(factionId: FactionID, unitPosition: HexCoord, maxRange: number): number;
    getAllBanners(): BannerState[];
    reset(): void;
}
//# sourceMappingURL=bannerman_morale_booster.d.ts.map